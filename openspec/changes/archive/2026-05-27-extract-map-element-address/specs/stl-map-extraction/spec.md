## ADDED Requirements

### Requirement: Extract STL Map Addresses
The STL extraction backend SHALL include the exact memory address of the internal `std::pair` object for every element in a `std::map`.

#### Scenario: Normal extraction
- **WHEN** the backend extracts a `std::map` element
- **THEN** the JSON payload contains an `"address"` key with the exact memory address in hex format.

#### Scenario: Missing address
- **WHEN** the map element's value is optimized out or lacks an address
- **THEN** the backend safely falls back to outputting `"0x0"` for the `"address"` key instead of crashing.
