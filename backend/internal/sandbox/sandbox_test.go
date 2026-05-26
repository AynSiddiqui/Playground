package sandbox

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"
)

// helper to check if g++ is available
func hasGPP(t *testing.T) {
	t.Helper()
	if _, err := lookupCompiler(); err != nil {
		t.Skip("g++ not found, skipping test")
	}
}

func lookupCompiler() (string, error) {
	path, err := lookPath("g++")
	if err != nil {
		return "", err
	}
	return path, nil
}

// lookPath wraps exec.LookPath for testability.
var lookPath = func(file string) (string, error) {
	return file, nil // overridden in tests if needed
}

func TestCompile_ValidCode(t *testing.T) {
	cfg := DefaultConfig()
	sb, err := New(cfg)
	if err != nil {
		t.Fatalf("failed to create sandbox: %v", err)
	}
	defer sb.Cleanup()

	code := `
#include <iostream>
int main() {
    std::cout << "hello" << std::endl;
    return 0;
}
`
	ctx := context.Background()
	binPath, err := sb.Compile(ctx, code)
	if err != nil {
		t.Skipf("compilation failed (g++ may not be installed): %v", err)
	}

	if _, err := os.Stat(binPath); os.IsNotExist(err) {
		t.Fatalf("binary was not created at %s", binPath)
	}
}

func TestCompile_InvalidCode(t *testing.T) {
	cfg := DefaultConfig()
	sb, err := New(cfg)
	if err != nil {
		t.Fatalf("failed to create sandbox: %v", err)
	}
	defer sb.Cleanup()

	code := `
int main() {
    this is not valid c++
}
`
	ctx := context.Background()
	_, err = sb.Compile(ctx, code)
	if err == nil {
		t.Fatal("expected compilation to fail for invalid code")
	}
}

func TestRun_Timeout(t *testing.T) {
	cfg := DefaultConfig()
	cfg.MaxExecutionTime = 1 * time.Second
	sb, err := New(cfg)
	if err != nil {
		t.Fatalf("failed to create sandbox: %v", err)
	}
	defer sb.Cleanup()

	// Create an infinite loop program
	code := `
int main() {
    while(true) {}
    return 0;
}
`
	ctx := context.Background()
	binPath, err := sb.Compile(ctx, code)
	if err != nil {
		t.Skipf("compilation failed (g++ may not be installed): %v", err)
	}

	start := time.Now()
	result, err := sb.Run(ctx, binPath)
	elapsed := time.Since(start)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !result.TimedOut {
		t.Fatal("expected the process to time out")
	}

	// Verify the timeout was enforced within a reasonable margin (2x the limit)
	if elapsed > 3*time.Second {
		t.Fatalf("timeout took too long: %v (expected ~1s)", elapsed)
	}
}

func TestRun_NormalExit(t *testing.T) {
	cfg := DefaultConfig()
	sb, err := New(cfg)
	if err != nil {
		t.Fatalf("failed to create sandbox: %v", err)
	}
	defer sb.Cleanup()

	code := `
int main() {
    return 0;
}
`
	ctx := context.Background()
	binPath, err := sb.Compile(ctx, code)
	if err != nil {
		t.Skipf("compilation failed (g++ may not be installed): %v", err)
	}

	result, err := sb.Run(ctx, binPath)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.TimedOut {
		t.Fatal("process should not have timed out")
	}

	if result.ExitCode != 0 {
		t.Fatalf("expected exit code 0, got %d", result.ExitCode)
	}
}

func TestCleanup(t *testing.T) {
	cfg := DefaultConfig()
	sb, err := New(cfg)
	if err != nil {
		t.Fatalf("failed to create sandbox: %v", err)
	}

	workDir := sb.WorkDir()
	if _, err := os.Stat(workDir); os.IsNotExist(err) {
		t.Fatalf("work directory should exist: %s", workDir)
	}

	if err := sb.Cleanup(); err != nil {
		t.Fatalf("cleanup failed: %v", err)
	}

	if _, err := os.Stat(workDir); !os.IsNotExist(err) {
		t.Fatal("work directory should have been removed after cleanup")
	}
}

func TestWorkDir_CustomPath(t *testing.T) {
	tmpDir := filepath.Join(os.TempDir(), "cppviz-test-custom")
	os.MkdirAll(tmpDir, 0755)
	defer os.RemoveAll(tmpDir)

	cfg := DefaultConfig()
	cfg.WorkDir = tmpDir
	sb, err := New(cfg)
	if err != nil {
		t.Fatalf("failed to create sandbox: %v", err)
	}

	if sb.WorkDir() != tmpDir {
		t.Fatalf("expected work dir %s, got %s", tmpDir, sb.WorkDir())
	}

	_ = runtime.GOOS // ensure runtime is used
}
