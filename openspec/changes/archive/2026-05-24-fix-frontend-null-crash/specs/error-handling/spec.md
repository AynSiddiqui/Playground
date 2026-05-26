## ADDED Requirements

### Requirement: Global React Error Boundary
The system SHALL wrap the main visualizer components inside a React Error Boundary to prevent application-wide crashes caused by unhandled exceptions.

#### Scenario: Catching render errors
- **WHEN** a child component throws an unhandled error (e.g., trying to read `.length` on a null property)
- **THEN** the Error Boundary catches the error and displays a safe, fallback UI indicating a visualization crash, preventing the blank white screen.

#### Scenario: Resetting from error state
- **WHEN** the fallback UI is displayed and the user clicks the "Reset" or "Dismiss" action
- **THEN** the error state is cleared, the WebSocket connection is reset or disconnected, and the component tree is remounted safely.

### Requirement: Resilient Snapshot Data Access
The system SHALL safely access all properties of the incoming WebSocket `Snapshot` payload by using optional chaining and default fallbacks.

#### Scenario: Null or missing snapshot data
- **WHEN** the backend payload omits the `stack` or `heap` arrays, or sends them as `null`
- **THEN** components like `App.tsx` and `MemoryCanvas.tsx` fall back to empty arrays `[]` instead of throwing exceptions, and the UI accurately reflects an empty visualization state.
