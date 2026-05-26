package protocol

import "github.com/cpp-memory-visualizer/backend/internal/debugger"

// --- Client → Server Messages ---

// ClientMessage is the envelope for all messages sent from client to server.
type ClientMessage struct {
	Command string `json:"command"` // "start", "step", "stop"
	Code    string `json:"code,omitempty"` // Only for "start"
}

// --- Server → Client Messages ---

// ServerMessage is the envelope for all messages sent from server to client.
type ServerMessage struct {
	Event   string             `json:"event"`             // "status", "error", "snapshot", "finished"
	State   string             `json:"state,omitempty"`   // For "status": "compiling", "ready", etc.
	Message string             `json:"message,omitempty"` // For "error"
	Data    *debugger.Snapshot `json:"data,omitempty"`    // For "snapshot"
	ExitCode *int             `json:"exitCode,omitempty"` // For "finished"
}

// Helper constructors for server messages.

func StatusMessage(state string) ServerMessage {
	return ServerMessage{Event: "status", State: state}
}

func ErrorMessage(msg string) ServerMessage {
	return ServerMessage{Event: "error", Message: msg}
}

func SnapshotMessage(data *debugger.Snapshot) ServerMessage {
	return ServerMessage{Event: "snapshot", Data: data}
}

func FinishedMessage(exitCode int) ServerMessage {
	return ServerMessage{Event: "finished", ExitCode: &exitCode}
}
