package sandbox

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// Config holds sandbox execution parameters.
type Config struct {
	// MaxExecutionTime is the hard timeout for the entire debugger session.
	MaxExecutionTime time.Duration
	// MaxMemoryMB is the memory limit in megabytes (enforced via cgroups on Linux).
	MaxMemoryMB int
	// WorkDir is the temporary directory for compilation artifacts.
	WorkDir string
}

// DefaultConfig returns sensible defaults for educational C++ programs.
func DefaultConfig() Config {
	return Config{
		MaxExecutionTime: 5 * time.Second,
		MaxMemoryMB:      128,
	}
}

// Sandbox manages the lifecycle of a sandboxed C++ compilation and execution.
type Sandbox struct {
	cfg     Config
	workDir string
}

// New creates a new Sandbox instance. It creates a temporary working directory.
func New(cfg Config) (*Sandbox, error) {
	workDir := cfg.WorkDir
	if workDir == "" {
		dir, err := os.MkdirTemp("", "cppviz-*")
		if err != nil {
			return nil, fmt.Errorf("failed to create temp dir: %w", err)
		}
		workDir = dir
	}
	return &Sandbox{cfg: cfg, workDir: workDir}, nil
}

// WorkDir returns the sandbox's working directory path.
func (s *Sandbox) WorkDir() string {
	return s.workDir
}

// Compile writes the source code to a file and compiles it with debug symbols.
// Returns the path to the compiled binary.
func (s *Sandbox) Compile(ctx context.Context, sourceCode string) (string, error) {
	if err := sanitizeCode(sourceCode); err != nil {
		return "", err
	}

	srcPath := filepath.Join(s.workDir, "main.cpp")
	binPath := filepath.Join(s.workDir, "main")

	if err := os.WriteFile(srcPath, []byte(sourceCode), 0644); err != nil {
		return "", fmt.Errorf("failed to write source: %w", err)
	}

	// Compile with debug symbols (-g) and no optimizations (-O0)
	// inside a strictly isolated Docker container.
	cmd := exec.CommandContext(ctx, "docker", "run", "--rm",
		"--network=none",
		"--memory=100m",
		"-v", s.workDir+":/src",
		"-w", "/src",
		"cppviz-runner:latest", // Custom image with gcc + gdb
		"g++", "-g", "-O0", "-ftrivial-auto-var-init=zero", "-o", "main", "main.cpp")

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("compilation failed: %s\n%s", err, string(output))
	}

	return binPath, nil
}

// Cleanup removes the sandbox working directory and all artifacts.
func (s *Sandbox) Cleanup() error {
	if s.workDir != "" {
		return os.RemoveAll(s.workDir)
	}
	return nil
}

// sanitizeCode checks for forbidden system calls and headers.
func sanitizeCode(code string) error {
	forbidden := []string{
		"<cstdlib>",
		"<stdlib.h>",
		"<unistd.h>",
		"<sys/wait.h>",
		"system(",
		"popen(",
		"fork(",
		"execve(",
	}
	for _, f := range forbidden {
		if strings.Contains(code, f) {
			return fmt.Errorf("malicious code detected: usage of '%s' is not allowed", f)
		}
	}
	return nil
}
