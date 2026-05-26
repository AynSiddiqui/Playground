package sandbox

import (
	"fmt"
	"os/exec"
	"runtime"
)

// ApplyResourceLimits configures OS-level resource limits on the command.
// On Linux, this uses ulimit-style settings via the process attributes.
// On other platforms, it's a best-effort no-op (timeout still enforced by context).
func ApplyResourceLimits(cmd *exec.Cmd, cfg Config) {
	if runtime.GOOS == "linux" {
		applyLinuxLimits(cmd, cfg)
	}
	// On Windows/macOS, the context timeout in runner.go is the primary safeguard.
	// Full cgroup/gVisor isolation would be configured at the container orchestration
	// level in production deployments.
}

// FormatResourceInfo returns a human-readable summary of the resource limits.
func FormatResourceInfo(cfg Config) string {
	return fmt.Sprintf(
		"Timeout: %s, Memory: %dMB",
		cfg.MaxExecutionTime, cfg.MaxMemoryMB,
	)
}
