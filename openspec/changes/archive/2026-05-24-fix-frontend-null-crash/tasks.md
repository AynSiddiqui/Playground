## 1. Implement Error Boundary

- [x] 1.1 Create `ErrorBoundary.tsx` in `src/components` with error catching logic and fallback UI.
- [x] 1.2 Update `App.tsx` to wrap the visualization area (or the entire app) within the new `ErrorBoundary`.
- [x] 1.3 Plumb a reset mechanism into `ErrorBoundary` so users can clear the error state and disconnect the WebSocket.

## 2. Implement Defensive Rendering in UI Components

- [x] 2.1 Refactor `App.tsx` snapshot destructuring to use optional chaining (e.g. `currentSnapshot?.stack?.length ?? 0`).
- [x] 2.2 Refactor `MemoryCanvas.tsx` to handle `undefined` or `null` stack/heap arrays by defaulting them to `[]`.
- [x] 2.3 Verify `MemoryNode.tsx` and other child components are safe against missing nested properties.

## 3. Testing and Verification

- [x] 3.1 Simulate a malformed WebSocket payload containing `null` for `stack` and `heap` and verify the `ErrorBoundary` gracefully catches it or the components default to empty states.
- [x] 3.2 Verify the "Reset" button in the `ErrorBoundary` restores functionality.
