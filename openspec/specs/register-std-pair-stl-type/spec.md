# register-std-pair-stl-type Specification

## Purpose
TBD - created by archiving change register-std-pair-stl-type. Update Purpose after archive.
## Requirements
### Requirement: Classify std::pair as STL Type
The Go debugger wrapper SHALL recognize `std::pair` as a standard STL type to trigger address lookup evaluations.

#### Scenario: Identify std::pair variables
- **WHEN** a local variable is of type `std::pair<std::string, int>&`
- **THEN** `isSTLType()` returns `true`, triggering address extraction.

