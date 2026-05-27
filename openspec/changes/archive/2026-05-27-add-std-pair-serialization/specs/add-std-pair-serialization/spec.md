## ADDED Requirements

### Requirement: Serialize std::pair
The GDB python visualization script SHALL extract and format `std::pair` containers into two elements representing `first` and `second` values.

#### Scenario: Extract pair elements
- **WHEN** a variable of type `std::pair` is flattened
- **THEN** it outputs an elements array containing `{"key": "first", "value": <first_val>, "address": <first_addr>}` and `{"key": "second", "value": <second_val>, "address": <second_addr>}`.
