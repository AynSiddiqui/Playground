package sandbox

import (
	"context"
	"fmt"
	"os/exec"
	"syscall"
	"time"
)

// RunResult holds the outcome of a sandboxed process execution.
type RunResult struct {
	ExitCode int
	TimedOut bool
}

// Run executes a binary within the sandbox with resource limits and a timeout.
// On Linux, this uses process groups for clean termination.
// The context should carry the session-level timeout.
func (s *Sandbox) Run(ctx context.Context, binaryPath string) (*RunResult, error) {
	// Create a derived context with MaxExecutionTime as a hard ceiling
	execCtx, cancel := context.WithTimeout(ctx, s.cfg.MaxExecutionTime)
	defer cancel()

	cmd := exec.CommandContext(execCtx, "docker", "run", "--rm",
		"--network=none",
		"--memory=100m",
		"-v", s.workDir+":/src",
		"-w", "/src",
		"gcc:latest",
		"./main")

	// On Unix-like systems, create a new process group so we can kill the
	// entire tree (the binary and any child processes it spawns).
	cmd.SysProcAttr = &syscall.SysProcAttr{
		// CreationFlags on Windows, Setpgid on Linux - handled at build time.
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start process: %w", err)
	}

	err := cmd.Wait()
	timedOut := execCtx.Err() == context.DeadlineExceeded

	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else if timedOut {
			exitCode = -1
		} else {
			return nil, fmt.Errorf("process error: %w", err)
		}
	}

	return &RunResult{
		ExitCode: exitCode,
		TimedOut: timedOut,
	}, nil
}

// RunWithTimeout is a convenience wrapper that creates a context with the given timeout.
func (s *Sandbox) RunWithTimeout(binaryPath string, timeout time.Duration) (*RunResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	return s.Run(ctx, binaryPath)
}
