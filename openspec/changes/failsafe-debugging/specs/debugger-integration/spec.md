## ADDED Requirements

### Requirement: GDB Synchronization Strictness
The backend SHALL synchronize with GDB by exclusively waiting for the `*stopped` asynchronous record when executing state-modifying commands (`-exec-run`, `-exec-next`), ignoring intermediate `^running` prompts.

#### Scenario: User steps to next line
- **WHEN** the backend issues `-exec-next`
- **THEN** it buffers all output until `*stopped` is received and parses the prompt immediately following it, ensuring no out-of-order commands are queued.
