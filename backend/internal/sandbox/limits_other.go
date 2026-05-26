//go:build !linux

package sandbox

import "os/exec"

// applyLinuxLimits is a no-op on non-Linux platforms.
// The context timeout in runner.go is the primary safeguard.
func applyLinuxLimits(cmd *exec.Cmd, cfg Config) {
	// No-op: resource limits are Linux-specific.
	// Timeout-based protection still applies via context.
}
