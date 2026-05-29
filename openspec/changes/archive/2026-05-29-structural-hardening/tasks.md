## 1. Extract graph builder to pure utility

- [x] 1.1 Create `frontend/src/utils/graphBuilder.ts` with exported `buildNodesAndEdges`, `findSourceEdge`, `getParentRelativeOffset`, `getLayoutedElements`, `processAdvancedDataOnHeap`
- [x] 1.2 Update `MemoryCanvas.tsx` — import from graphBuilder, remove inline definitions, keep only React Flow wiring and the useEffect that calls buildNodesAndEdges
- [x] 1.3 Verify: `npm run build` passes, visual rendering identical for all 8 CODE_SNIPPETS

## 2. Add GDB MI parsing integration tests

- [x] 2.1 Add tests for `parseLocals` — happy path, missing value field, `__` prefixed locals, STL type locals, malformed braces
- [x] 2.2 Add tests for `parseFieldsFromEval` — struct with pointer fields, nested structs, empty struct, truncated output
- [x] 2.3 Add tests for `parseSTLOutput` — vector (3+ elements), map (string→int), set, nested vector, empty container
- [x] 2.4 Add tests for `parseLineFromFrame`, `parseFileFromFrame`, `parseFunctionFromFrame`, `parseDepth`, `normalizeAddress`, `isPointerType`, `isSTLType`, `containsAny`, `stripDefaultTemplateArgs`
- [x] 2.5 Add tests for `consumeUntilPrompt` and `consumeUntilStopped`
- [x] 2.6 Add tests for `parseAdvancedDump`
- [x] 2.7 Verify: `go test ./internal/debugger/ -v -run .` passes with >80% coverage of non-I/O functions
- [ ] ~2.8 Real GDB output test fixtures (`testdata/`) — deferred, requires Docker + compiled binaries~
- [ ] ~2.9 `buildSnapshot` integration tests — deferred, too coupled to GDB I/O~

## 3. Add Docker health probes

- [x] 3.1 In `handler/websocket.go`, after handleStart succeeds, launch a goroutine that sends `-interpreter-exec console "info threads"` via the GDB debugger every 5 seconds
- [x] 3.2 Track consecutive failures; after 2, cancel session context → cleanup → re-run Start sequence. Send `{event: "reconnecting"}` to frontend
- [x] 3.3 Wire goroutine lifecycle to session context cancellation (context-cancelled select in startHealthCheck)
- [x] 3.4 Add `"reconnecting"` event type to `protocol/messages.go` and frontend `types.ts`
- [x] 3.5 Frontend `useWebSocket.ts`: handle `"reconnecting"` event — set status to "reconnecting"

## 4. Add ACK-based WebSocket backpressure

- [x] 4.1 Frontend: after MemoryCanvas useEffect finishes processing a snapshot, send `{command: "snapshot_ready"}` via `onSnapshotReady` prop → App.tsx sends via WebSocket
- [x] 4.2 Backend `handler/websocket.go`: queue snapshots when `awaitingAck` is true, dequeue on `handleSnapshotReady`
- [x] 4.3 Backend safety timeout: 5s `ackTimer` — send queued snapshot if no ACK
- [x] 4.4 Add `"snapshot_ready"` command to `protocol/messages.go` and frontend `types.ts`
- [x] 4.5 Backend `snapshotQueue` flushed in `cleanupLocked` — stale snapshots dropped on disconnect/stop/reconnect

## 5. Add GDB MI version detection

- [x] 5.1 In `gdb.go` Start(), after consumeUntilPrompt, scan for GDB version in MI banner
- [x] 5.2 Extract version string and log it. Store in `GDBDebugger.version` field. Expose via `Version()` method.

## 6. Additional fixes discovered during implementation

- [x] 6.1 `cleanupLocked()` now cancels session context — prevents zombie health goroutine after stop/disconnect
- [ ] ~6.2 Pre-existing `SNAPSHOT` vs `"snapshot"` log typo — low impact, left as-is~
- [ ] ~6.3 `consumeUntilStopped` EOF guard — low risk in production (GDB keeps pipe open), deferred~
