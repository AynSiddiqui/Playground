## Context

The React frontend currently assumes that the WebSocket snapshot payloads are fully formed arrays. If the backend experiences an issue and sends a snapshot where `stack` or `heap` are `null` or `undefined`, components like `App.tsx` and `MemoryCanvas.tsx` attempt to read properties like `.length` on them. This causes an unhandled Javascript exception that crashes the entire React component tree, resulting in a blank white screen. 

## Goals / Non-Goals

**Goals:**
- Implement a global `ErrorBoundary` to gracefully catch and display any rendering errors in the application.
- Use TypeScript optional chaining (`?.`) and nullish coalescing (`??`) to provide default fallbacks for nested properties in `App.tsx` and `MemoryCanvas.tsx`.

**Non-Goals:**
- This design does not change the backend's payload structure. We are purely adding defensive programming to the frontend to tolerate bad data.

## Decisions

- **React Error Boundary Component**: We will implement a standard class-based `ErrorBoundary` component. React requires error boundaries to be class components (using `getDerivedStateFromError` and `componentDidCatch`).
- **Reset Functionality**: The `ErrorBoundary` will provide a "Reset" button that clears the error state and disconnects the WebSocket, returning the app to its initial state.
- **Defensive Rendering**: In `App.tsx`, we will update expressions like `currentSnapshot.stack.length` to `currentSnapshot.stack?.length ?? 0`. Similarly, `MemoryCanvas.tsx` will default `snapshot.stack` to `[]` and `snapshot.heap` to `[]`.

## Risks / Trade-offs

- **Risk**: Masking underlying backend bugs. 
  **Mitigation**: The `ErrorBoundary` will explicitly log the caught errors to the console, and defensive rendering will fallback to empty UI states so the missing data is visually obvious without crashing the whole page.
