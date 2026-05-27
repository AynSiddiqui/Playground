## ADDED Requirements

### Requirement: Filter Compiler Locals
The Go debugger backend SHALL filter out all stack local variables whose names start with double underscores `__`.

#### Scenario: Filter range-loop compiler variables
- **WHEN** GDB returns local variables including `__for_begin`, `__for_end`, and `__for_range`
- **THEN** `parseLocals()` ignores those variables, returning only user-defined locals in the stack snapshot.

### Requirement: Dereference Reference Types
The Go debugger backend SHALL convert reference-typed stack variables (ending in `&`) into standard pointer types (ending in `*`) for address dereferencing.

#### Scenario: Evaluate std::pair reference
- **WHEN** a local variable has type `std::pair<const std::string, int>&`
- **THEN** the backend evaluates its heap object using type `std::pair<const std::string, int>*` to retrieve its address and dereference its members.
