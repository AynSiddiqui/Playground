## ADDED Requirements

### Requirement: Flat Topology Graph Export
The backend structural evaluation API (Python GDB script + Go pointer chaser) SHALL return a flattened array of memory nodes. It MUST NOT recursively embed full child objects within parent objects. 

#### Scenario: Evaluating a list node
- **WHEN** the debugger encounters a `ListNode` with a `next` pointer
- **THEN** it outputs `{ "structure": "list_node", "next": { "address": "0xABC" } }` instead of embedding the entire downstream list.

### Requirement: Extended STL Coverage
The STL Python pretty printers SHALL detect and format container types beyond basic vectors and maps, including Stacks, Queues, and Pairs.

#### Scenario: User creates a std::stack
- **WHEN** the program steps over `std::stack<int> s;`
- **THEN** the GDB Python printer successfully extracts its underlying container elements and sends them to the UI as an array.
