package debugger

// Debugger is the interface for interacting with a C++ debugger (GDB/LLDB).
// This abstraction allows swapping the underlying debugger implementation.
type Debugger interface {
	// Start launches the debugger attached to the given binary.
	Start(binaryPath string) error
	// Step advances execution by one source line.
	Step() (*Snapshot, error)
	// GetSnapshot returns the current execution state without stepping.
	GetSnapshot() (*Snapshot, error)
	// Stop terminates the debugger and the debugged process.
	Stop() error
	// IsRunning returns true if the debugged process is still alive.
	IsRunning() bool
}
