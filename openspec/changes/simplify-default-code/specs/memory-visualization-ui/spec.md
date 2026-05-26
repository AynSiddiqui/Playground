## ADDED Requirements

### Requirement: Simple Default Code
The `CodeEditor` SHALL provide a highly simplified default C++ code example upon initialization. The code MUST contain only basic primitive arithmetic (`int c = a + b`) and must completely exclude pointers, structs, or dynamic memory allocations.

#### Scenario: Visualizer first launch
- **WHEN** the user opens the application for the first time
- **THEN** the editor is populated with a simple 5-line addition script that is easy to step through.
