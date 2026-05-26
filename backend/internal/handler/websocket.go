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

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// Session represents a single debugger session tied to a WebSocket connection.
type Session struct {
	conn    *websocket.Conn
	sandbox *sandbox.Sandbox
	dbg     debugger.Debugger
	mu      sync.Mutex
	active  bool
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
	default:
		s.sendError("Unknown command: " + msg.Command)
	}
}

// handleStart compiles the user's code, launches the debugger, and sends the initial snapshot.
func (s *Session) handleStart(msg protocol.ClientMessage) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Clean up any existing session
	s.cleanupLocked()

	if msg.Code == "" {
		s.sendErrorLocked("No source code provided")
		return
	}

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

	log.Println("GDB Initialized, fetching initial snapshot...")
	// Send initial snapshot (paused at main)
	snapshot, err := gdb.GetSnapshot()
	if err != nil {
		s.sendErrorLocked("Failed to get initial state: " + err.Error())
		return
	}

	s.sendMessageLocked(protocol.StatusMessage("ready"))
	s.sendMessageLocked(protocol.ServerMessage{Event: "LAUNCH_SUCCESS"})
	s.sendMessageLocked(protocol.SnapshotMessage(snapshot))
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

	s.sendMessageLocked(protocol.SnapshotMessage(snapshot))
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
	if s.dbg != nil {
		s.dbg.Stop()
		s.dbg = nil
	}
	if s.sandbox != nil {
		s.sandbox.Cleanup()
		s.sandbox = nil
	}
}
