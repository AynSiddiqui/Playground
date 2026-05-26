## ADDED Requirements

### Requirement: Strict CSP Compliance
The frontend application SHALL be configured to strictly comply with Content Security Policy headers, explicitly omitting the `unsafe-eval` directive.

#### Scenario: Web Worker initialization
- **WHEN** the Monaco Editor initializes its language workers
- **THEN** the workers are loaded via strictly bundled JS files without using inline blobs or `eval()`

### Requirement: Explicit Error Handling
The frontend SHALL intercept server-broadcast `ERROR` events to prevent the UI from locking up during compilation failures or runtime crashes.

#### Scenario: Compilation Failure
- **WHEN** the backend broadcasts an `ERROR` event containing compiler logs
- **THEN** the frontend breaks out of the "Launching" state and displays the error message clearly to the user

## MODIFIED Requirements

### Requirement: Split Pane Interface
The frontend SHALL render a dual-pane layout containing a Monaco editor for code and a visualization canvas (React Flow) for memory state. The canvas MUST utilize dynamic layouts depending on the data structure (e.g., CSS Grids for 2D arrays, and Dagre/hierarchical layouts for Trees and Linked Lists).

#### Scenario: Viewing current state
- **WHEN** a state snapshot containing tree nodes is received
- **THEN** the editor highlights the current executing line and the canvas utilizes the Dagre layout engine to properly align the tree nodes hierarchically
