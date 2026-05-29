## Context

Architecture council (round 1) identified 3 consensus issues: `gdb.go` brittleness (988 lines, untested parsing), absent Docker health model, no backpressure. Round 2 council ratified the direction but rejected two design choices and added one new item.

## Goals / Non-Goals

**Goals:**
- Extract `buildNodesAndEdges` into testable pure utility
- Integration tests with error-path coverage for all GDB MI parsing
- Docker health probes that test GDB responsiveness, not shell liveness
- ACK-based backpressure that provably prevents browser OOM
- GDB MI version detection at startup

**Non-Goals:**
- No state management library
- No splitting of `gdb.go` into multiple files
- No streaming protocol (NDJSON, chunked)
- No heap snapshot pagination or virtualization
- No changes to GDB Python pretty-printers

## Decisions

### Decision 1: Graph builder extraction

Pure utility extraction, no behavioral change.

### Decision 2: Integration tests over unit mocks

Table-driven tests covering happy paths and error paths (malformed MI, truncated output, unexpected types). Use live-captured GDB output as test fixtures.

### Decision 3: Health probe uses "info threads", not "echo alive"

Use `-interpreter-exec console "info threads"` — a real GDB MI command. Parameters: 5s interval, 2 consecutive failures = kill + restart session. Context-cancelled goroutine prevents double-launch race.

### Decision 4: ACK-based backpressure, not buffer depth

Frontend sends `{event: "snapshot_ready"}` after each React Flow render. Backend won't send the next snapshot until ACK arrives. Backend safety timeout: 5s — if no ACK, send queued snapshot anyway.

### Decision 5: GDB version detection

Parse `~"GNU gdb (GDB) <version>"` from initial MI banner. Log version. No behavioral change — makes version-related breakage visible in logs.

### Decision 6: Cleanup cancels health goroutine context

`cleanupLocked()` now calls `s.cancel()` to terminate the health check goroutine immediately on stop/disconnect, instead of leaving it alive until the next `handleStart`. The goroutine's select loop checks `ctx.Done()` on every tick and exits cleanly.

## Risks / Trade-offs

- **Risk**: ACK-based flow control makes the frontend responsible for unblocking the backend. *Mitigation*: backend timeout (5s) prevents deadlock.
- **Risk**: "info threads" probe could be slow on multi-threaded programs. *Mitigation*: this is a single-threaded debugger.
- **Risk**: Live-captured GDB output fixtures are platform-specific. *Mitigation*: capture from same Docker image used in production.
- **Risk**: Reconnect creates a brief window where two health goroutines overlap. *Mitigation*: old goroutine's context is cancelled by handleStart before new one starts; old goroutine exits on next select iteration (max 5s).
- **Risk**: `snapshotQueue` is unbounded under extreme rates. *Mitigation*: ACK-based throttling limits queue depth to 1 in practice; arbitrary depth only occurs if frontend fails to ACK and timeout flushes.
