## MODIFIED Requirements

### Requirement: STL Content Visibility
The UI SHALL display STL container types in a simplified, human-readable form — stripping default allocators, comparators, and ABI namespace qualifiers.

#### Scenario: Simplified type display for containers
- **WHEN** a `std::map<std::string, int>` or any other STL container is displayed
- **THEN** the type label SHALL show only the meaningful template arguments (e.g., `std::map<std::string, int>`), not the full instantiation including `std::allocator`, `std::less`, or `std::__cxx11::` qualifiers

#### Scenario: Stack variable type display
- **WHEN** a stack-allocated STL container variable is shown as a distinct node
- **THEN** the type shown in the variable row SHALL use the simplified type string
- **AND** the raw GDB type SHALL be available on hover via a tooltip
