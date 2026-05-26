## ADDED Requirements

### Requirement: Reliable React Layouts
The visualization interface SHALL robustly render all variables within a stack frame without runtime crash failures caused by missing index references.

#### Scenario: Rendering multiple local variables
- **WHEN** a stack frame contains multiple variables
- **THEN** all variables are displayed cleanly, with pointer handles offset correctly based on their index.

### Requirement: Header Inclusion
The `DEFAULT_CODE` template SHALL include standard C++ headers requested by users.

#### Scenario: Initial Load
- **WHEN** the editor mounts
- **THEN** it contains `#include <iostream>` and standard I/O streams.
