## MODIFIED Requirements

### Requirement: Memory Snapshot Extraction
The backend SHALL pre-clean type strings before JSON serialization to reduce wire size and noise.

#### Scenario: Namespace stripping
- **WHEN** a type string contains `std::__cxx11::`
- **THEN** the backend SHALL strip this namespace qualifier (e.g., `std::__cxx11::basic_string<...>` becomes `std::basic_string<...>`)

#### Scenario: basic_string normalization
- **WHEN** a type string contains `std::basic_string<char, std::char_traits<char>, std::allocator<char>>`
- **THEN** the backend SHALL replace it with `std::string`
