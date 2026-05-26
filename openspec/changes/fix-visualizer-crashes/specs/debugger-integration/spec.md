## MODIFIED Requirements

### Requirement: Safely Evaluate Expressions
The backend SHALL gracefully handle and sanitize memory addresses that contain debugging symbols before passing them to the GDB expression evaluator.

#### Scenario: Stripping malloc symbols
- **WHEN** the backend parses a variable with address `0x7d77370d0d92 <malloc+514>`
- **THEN** it strips the `<malloc+514>` and evaluates only `*(ListNode *)0x7d77370d0d92`.
