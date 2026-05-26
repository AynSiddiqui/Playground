## MODIFIED Requirements

### Requirement: Flat Node JSON Serialization
The debugger backend SHALL serialize memory snapshots into a unified `Snapshot` object containing `stack` frames and a purely flattened array of `heap` objects.

#### Scenario: Backend node extraction
- **WHEN** a recursive structure is evaluated by GDB
- **THEN** the backend issues distinct JSON objects for each memory allocation and lists their internal pointers purely as memory address strings to facilitate frontend edge drawing.
