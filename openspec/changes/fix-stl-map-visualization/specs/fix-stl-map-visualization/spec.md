## ADDED Requirements

### Requirement: Register Pretty Printers
The Python debugging script SHALL import and register the GCC `libstdc++` pretty printers from the system search paths.

#### Scenario: Startup registration
- **WHEN** GDB loads the `stl_printers.py` script
- **THEN** it registers the libstdc++ pretty printers using GDB's Python API.

### Requirement: Quote GDB MI Expressions
The Go debugger backend SHALL wrap all evaluated expression arguments in double quotes.

#### Scenario: Expression evaluation
- **WHEN** the Go backend calls `-data-evaluate-expression` or `adv-dump`
- **THEN** it formats the target expression inside double quotes to protect spaces and template brackets.

### Requirement: Fallback on Missing Pretty Visualizer
The Python backend serialization SHALL return `None` (no payload) for STL containers when the visualizer cannot be resolved, instead of returning an empty element array.

#### Scenario: Map visualizer missing
- **WHEN** GDB fails to resolve a pretty visualizer for a map
- **THEN** `flatten_stl_container()` returns `None` so that default text-rendering fallback is triggered.
