## ADDED Requirements

### Requirement: Stable Node IDs via Memory Address
The websocket protocol SHALL strictly utilize the memory address of a C++ object (e.g., `0x7fffffffe000`) as the unique `id` for Heap Objects in the JSON payload to avoid collisions and enable stable DOM identity in the frontend.

#### Scenario: Sending an STL container
- **WHEN** the backend serializes a `std::vector`
- **THEN** it assigns the `id` field using the actual memory address of the vector, rather than a generic string, ensuring the frontend knows it's the exact same object across execution steps.
