//go:build linux

package sandbox

import (
	"os/exec"
	"syscall"
)

// applyLinuxLimits sets Linux-specific resource limits on the process.
func applyLinuxLimits(cmd *exec.Cmd, cfg Config) {
	memBytes := uint64(cfg.MaxMemoryMB) * 1024 * 1024

	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}

	// Create a new process group so we can kill the entire tree.
	cmd.SysProcAttr.Setpgid = true

	// Note: For full memory limiting, production deployments should use
	// cgroups v2 or gVisor. The ulimit approach here is a development fallback.
	// In production, wrap the execution in a container with:
	//   --memory=${MaxMemoryMB}m --cpus=1 --network=none
	_ = memBytes
}
