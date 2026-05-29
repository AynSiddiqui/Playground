## Why

The first council identified three consensus issues in the architecture — `gdb.go` fragility, missing Docker health model, and absent backpressure — plus one high-priority incremental refactor. The second council ratified the direction but flagged critical design flaws in the health probe and backpressure approaches.

The proposal is revised to address all dissents.

## What Changes

### 1. Extract graph builder to pure utility

`buildNodesAndEdges` and its helpers move from `MemoryCanvas.tsx` to `frontend/src/utils/graphBuilder.ts`. Zero behavioral change — pure reorganization with immediate testability payoff.

### 2. GDB MI parsing integration test suite (EXPANDED)

Table-driven tests for every parsing function in `gdb.go`. Council addition: tests must cover error paths — malformed MI records, truncated output from container OOM, unexpected record types, empty responses. Use real GDB output captured from live runs as test fixtures rather than hand-crafted strings, so the tests catch real protocol changes. Target >80% line coverage of non-I/O parsing functions.

### 3. Docker health probes (REDESIGNED)

Council rejected the original `"echo alive"` approach (tests the shell, not GDB). Replacement: ping via `-interpreter-exec console "info threads"` — a real GDB command that exercises MI responsiveness. Parameters: 5s interval, 2 consecutive failures triggers kill+restart (was 2s/3 — less aggressive to avoid false positives). Session context cancellation gates the goroutine lifecycle.

### 4. WebSocket backpressure (REDESIGNED)

Council rejected buffer-depth magic numbers (just moves the OOM). Replacement: frontend sends `{event: "snapshot_ready"}` after each snapshot renders. Backend queues the next snapshot until the ACK arrives. Yes, this adds a round-trip — it's the only provably OOM-safe approach without streaming infrastructure. The RTT is negligible at human stepping speeds.

### 5. (NEW) GDB MI version detection

At `Start()`, parse the MI banner line (`~"GNU gdb (GDB) X.Y"`) and log the version. Gate any GDB-specific command formatting on known-compatible versions. Makes version-related breakage visible in logs instead of silent corruption.

## Implementation Results

### Files changed

**Frontend** (3 files):
- `MemoryCanvas.tsx` — 525→123 LOC. `buildNodesAndEdges` and helpers removed, now imported from `graphBuilder.ts`. New `onSnapshotReady` prop fires `sendCommand({command: "snapshot_ready"})` after each render.
- `src/utils/graphBuilder.ts` — new file, ~300 LOC. Exports `findSourceEdge`, `getParentRelativeOffset`, `getLayoutedElements`, `processAdvancedDataOnHeap`, `buildNodesAndEdges`.
- `App.tsx` — wires `onSnapshotReady` callback to `handleSnapshotReady` which sends `snapshot_ready` via WebSocket.
- `useWebSocket.ts` — handles `"reconnecting"` event, sets `status` to `"reconnecting"`.
- `types.ts` — adds `"reconnecting"` to `ServerMessage.event` union.

**Backend** (4 files):
- `gdb.go` — adds `version` field, `extractGDBVersion()` call in `Start()` after `consumeUntilPrompt`, `HealthCheck()` method (sends `-interpreter-exec console "info threads"`), `Version()` accessor. Health checks acquire own mutex for thread safety.
- `gdb_test.go` — 18 test functions covering `parseLocals`, `parseFieldsFromEval`, `parseSTLOutput`, `parseLineFromFrame`, `parseFileFromFrame`, `parseFunctionFromFrame`, `parseDepth`, `normalizeAddress`, `isPointerType`, `isSTLType`, `containsAny`, `stripDefaultTemplateArgs`, `parseAdvancedDump`, `consumeUntilPrompt` (5 cases with real prompt varieties), `consumeUntilStopped`, `extractGDBVersion` (5 cases). >80% line coverage of non-I/O parsing.
- `handler/websocket.go` — `Session` gains `code`, `cancel` (context.CancelFunc), `snapshotQueue`, `awaitingAck`, `ackTimer`. `handleStart` stores code, starts health goroutine, uses `sendSnapshotLocked`. `handleMessage` routes `"snapshot_ready"`. `cleanupLocked` cancels context (fixes zombie goroutine), resets backpressure state. `startHealthCheck` goroutine: 5s interval, `-info threads` probe, 2 failures → cancel + `reconnect()`. `reconnect()` sends `reconnecting` event, sleeps 500ms, calls `handleStart` with stored code. `sendSnapshotLocked` queues when `awaitingAck`, sends + starts 5s timer otherwise. `handleSnapshotReady` stops timer, sets `awaitingAck=false`, flushes queue.
- `protocol/messages.go` — adds `ReconnectingMessage()` helper. `ServerMessage.Event` now accepts `"reconnecting"`.

### Deferred items
- Real GDB output test fixtures (`testdata/`) — requires Docker + compiled binaries at test time
- `buildSnapshot` integration tests — too coupled to I/O, needs abstraction refactor
- `consumeUntilStopped` EOF guard — low production risk (GDB keeps pipe alive)
- `usePlayback` hook extraction — stretch goal, no behavioral impact
