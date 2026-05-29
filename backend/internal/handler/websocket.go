package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"github.com/cpp-memory-visualizer/backend/internal/debugger"
	"github.com/cpp-memory-visualizer/backend/internal/protocol"
	"github.com/cpp-memory-visualizer/backend/internal/sandbox"
)

const (
	healthCheckInterval  = 5 * time.Second
	healthCheckMaxFails  = 2
	ackSafetyTimeout     = 5 * time.Second
	reconnectDelay       = 500 * time.Millisecond
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// Session represents a single debugger session tied to a WebSocket connection.
type Session struct {
	conn          *websocket.Conn
	sandbox       *sandbox.Sandbox
	dbg           debugger.Debugger
	mu            sync.Mutex
	active        bool
	code          string
	cancel        context.CancelFunc
	snapshotQueue []*debugger.Snapshot
	awaitingAck   bool
	ackTimer      *time.Timer
}

// HandleWebSocket upgrades HTTP connections to WebSocket and manages debugger sessions.
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	session := &Session{
		conn: conn,
	}

	log.Println("New WebSocket session established")

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		var msg protocol.ClientMessage
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			session.sendError("Invalid message format: " + err.Error())
			continue
		}

		session.handleMessage(msg)
	}

	// Cleanup on disconnect
	session.cleanup()
	log.Println("WebSocket session closed")
}

// handleMessage routes incoming client messages to the appropriate handler.
func (s *Session) handleMessage(msg protocol.ClientMessage) {
	switch msg.Command {
	case "start":
		s.handleStart(msg)
	case "step":
		s.handleStep()
	case "stop":
		s.handleStop()
	case "snapshot_ready":
		s.handleSnapshotReady()
	default:
		s.sendError("Unknown command: " + msg.Command)
	}
}

// handleStart compiles the user's code, launches the debugger, and sends the initial snapshot.
func (s *Session) handleStart(msg protocol.ClientMessage) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Cancel any existing health check context
	if s.cancel != nil {
		s.cancel()
		s.cancel = nil
	}

	// Clean up any existing session
	s.cleanupLocked()

	if msg.Code == "" {
		s.sendErrorLocked("No source code provided")
		return
	}

	// Store code for potential reconnection
	s.code = msg.Code

	// Notify: compiling
	log.Println("Compiling user code...")
	s.sendMessageLocked(protocol.StatusMessage("compiling"))

	// Create sandbox
	cfg := sandbox.DefaultConfig()
	sb, err := sandbox.New(cfg)
	if err != nil {
		s.sendErrorLocked("Failed to create sandbox: " + err.Error())
		return
	}
	s.sandbox = sb

	// Compile the code (enforcing a 3-second timeout for Docker execution)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	binPath, err := sb.Compile(ctx, msg.Code)
	if err != nil {
		s.sendErrorLocked("Compilation failed: " + err.Error())
		return
	}

	// Notify: compiled, launching debugger
	log.Println("Container Started, launching GDB...")
	s.sendMessageLocked(protocol.StatusMessage("launching"))

	// Launch debugger
	gdb := debugger.NewGDBDebugger()
	if err := gdb.Start(binPath); err != nil {
		s.sendErrorLocked("Failed to start debugger: " + err.Error())
		return
	}
	s.dbg = gdb
	s.active = true

	// Start health check goroutine
	healthCtx, healthCancel := context.WithCancel(context.Background())
	s.cancel = healthCancel
	go s.startHealthCheck(healthCtx, healthCancel)

	log.Println("GDB Initialized, fetching initial snapshot...")
	// Send initial snapshot (paused at main)
	snapshot, err := gdb.GetSnapshot()
	if err != nil {
		s.sendErrorLocked("Failed to get initial state: " + err.Error())
		return
	}

	s.sendMessageLocked(protocol.StatusMessage("ready"))
	s.sendMessageLocked(protocol.ServerMessage{Event: "LAUNCH_SUCCESS"})
	s.sendSnapshotLocked(snapshot)
}

// handleStep advances execution by one line and sends the new snapshot.
func (s *Session) handleStep() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.dbg == nil || !s.active {
		s.sendErrorLocked("No active debugging session")
		return
	}

	snapshot, err := s.dbg.Step()
	if err != nil {
		if err.Error() == "program finished" {
			s.sendMessageLocked(protocol.FinishedMessage(0))
			s.active = false
			return
		}
		s.sendErrorLocked("Step failed: " + err.Error())
		return
	}

	s.sendSnapshotLocked(snapshot)
}

// handleStop terminates the current debugging session.
func (s *Session) handleStop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.cleanupLocked()
	s.sendMessageLocked(protocol.StatusMessage("stopped"))
}

// sendError sends an error message (thread-safe).
func (s *Session) sendError(msg string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sendErrorLocked(msg)
}

// sendErrorLocked sends an error message (must be called with lock held).
func (s *Session) sendErrorLocked(msg string) {
	s.sendMessageLocked(protocol.ErrorMessage(msg))
}

// sendMessageLocked sends a server message (must be called with lock held).
func (s *Session) sendMessageLocked(msg protocol.ServerMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return
	}
	
	// Structured Backend Logging: Print raw JSON payload if it is a snapshot
	if msg.Event == "SNAPSHOT" {
		log.Printf("OUTBOUND PAYLOAD: %s", string(data))
	}
	
	if err := s.conn.WriteMessage(websocket.TextMessage, data); err != nil {
		log.Printf("Failed to send message: %v", err)
	}
}

// cleanup releases all resources (thread-safe).
func (s *Session) cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cleanupLocked()
}

// cleanupLocked releases all resources (must be called with lock held).
func (s *Session) cleanupLocked() {
	s.active = false
	s.awaitingAck = false
	s.snapshotQueue = nil
	if s.ackTimer != nil {
		s.ackTimer.Stop()
		s.ackTimer = nil
	}
	if s.cancel != nil {
		s.cancel()
		s.cancel = nil
	}
	if s.dbg != nil {
		s.dbg.Stop()
		s.dbg = nil
	}
	if s.sandbox != nil {
		s.sandbox.Cleanup()
		s.sandbox = nil
	}
}

// --- Health probes ---

// startHealthCheck periodically verifies GDB responsiveness.
// On maxFailures consecutive failures it triggers a reconnect.
func (s *Session) startHealthCheck(ctx context.Context, cancel context.CancelFunc) {
	log.Println("Health check goroutine started")
	defer log.Println("Health check goroutine stopped")

	// Initial delay before first check to let the session settle
	select {
	case <-ctx.Done():
		return
	case <-time.After(healthCheckInterval):
	}

	ticker := time.NewTicker(healthCheckInterval)
	defer ticker.Stop()

	var failures int
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.mu.Lock()
			dbg := s.dbg
			s.mu.Unlock()

			if dbg == nil {
				continue
			}

			gdb, ok := dbg.(*debugger.GDBDebugger)
			if !ok {
				continue
			}
			if err := gdb.HealthCheck(); err != nil {
				failures++
				log.Printf("Health check failed (%d/%d): %v", failures, healthCheckMaxFails, err)
				if failures >= healthCheckMaxFails {
					log.Println("Health check: max failures reached, initiating reconnect")
					cancel()
					s.reconnect()
					return
				}
			} else {
				if failures > 0 {
					log.Printf("Health check recovered after %d failures", failures)
				}
				failures = 0
			}
		}
	}
}

// reconnect tears down and restarts the debugger session after health check failure.
func (s *Session) reconnect() {
	s.mu.Lock()
	s.sendMessageLocked(protocol.ReconnectingMessage())
	s.mu.Unlock()

	time.Sleep(reconnectDelay)

	s.handleStart(protocol.ClientMessage{Command: "start", Code: s.code})
}

// --- ACK-based backpressure ---

// sendSnapshotLocked queues or sends a snapshot depending on ACK state.
// Must be called with s.mu held.
func (s *Session) sendSnapshotLocked(snapshot *debugger.Snapshot) {
	if s.awaitingAck {
		s.snapshotQueue = append(s.snapshotQueue, snapshot)
		return
	}

	s.sendMessageLocked(protocol.SnapshotMessage(snapshot))
	s.awaitingAck = true

	if s.ackTimer != nil {
		s.ackTimer.Stop()
	}
	s.ackTimer = time.AfterFunc(ackSafetyTimeout, func() {
		s.mu.Lock()
		defer s.mu.Unlock()
		if s.awaitingAck {
			log.Println("ACK timeout: forcing queue flush")
			s.awaitingAck = false
			s.flushSnapshotQueueLocked()
		}
	})
}

// flushSnapshotQueueLocked sends the next queued snapshot, if any.
// Must be called with s.mu held.
func (s *Session) flushSnapshotQueueLocked() {
	if len(s.snapshotQueue) > 0 {
		next := s.snapshotQueue[0]
		s.snapshotQueue = s.snapshotQueue[1:]
		s.sendSnapshotLocked(next)
	}
}

// handleSnapshotReady processes the client's snapshot_ready ACK.
func (s *Session) handleSnapshotReady() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.ackTimer != nil {
		s.ackTimer.Stop()
	}
	s.awaitingAck = false
	s.flushSnapshotQueueLocked()
}
