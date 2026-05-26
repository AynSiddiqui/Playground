## Why

The frontend React application crashes with "Cannot read properties of null (reading 'length')" when the backend sends an incomplete or uninitialized snapshot payload. This results in a white screen of death, completely breaking the user experience. By implementing robust error boundaries and optional chaining, we can ensure the UI gracefully handles malformed data or empty states without crashing.

## What Changes

- Add an `ErrorBoundary` component to catch React rendering errors and display a graceful fallback UI with a reset option.
- Wrap the main `<App>` component and/or the `<MemoryCanvas>` visualization with the `ErrorBoundary`.
- Refactor `App.tsx` rendering logic to use optional chaining (e.g., `currentSnapshot.stack?.length ?? 0`) for snapshot properties.
- Refactor `MemoryCanvas.tsx` and related components to safely fallback to empty arrays when `stack` or `heap` are undefined.

## Capabilities

### New Capabilities
- `error-handling`: Implementation of React Error Boundaries and robust null-checks across the frontend visualization components to prevent application crashes.

### Modified Capabilities

## Impact

- **Frontend UI**: `App.tsx`, `MemoryCanvas.tsx`, and `PlaybackControls.tsx` will be updated for null safety.
- **Components**: A new `ErrorBoundary.tsx` component will be added to the frontend `src/components` directory.
