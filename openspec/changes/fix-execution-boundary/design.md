## Context
When GDB finishes executing the `main()` function, it organically steps into the C standard library (`libc.so`) to perform program teardown. Currently, the backend keeps tracking these frames and attempts to serialize them as normal execution steps. Because these library frames lack debugging symbols, this causes the snapshot builder to fail and pollutes the frontend state with unmapped addresses and missing variable data.

## Goals / Non-Goals
**Goals:**
- Proactively halt debugging when the execution pointer leaves the user's `main.cpp` code.
- Prevent any stack frames containing `func="??"` or `from="libc.so"` from being transmitted to the frontend.
- Reset the frontend's timeline slider so that when the session starts, it defaults to step 0 (the beginning of execution) so users can manually step through the variable initialization, rather than starting at the end.

**Non-Goals:**
- Build a generic boundary filter for stepping *into* `std::` function calls (like `cout`). The standard `-exec-next` command naturally steps over these, so only the final teardown jump requires a hard boundary check.

## Decisions
1. **Frontend Slider:** In `App.tsx`, we will change the initial state upon receiving the initial payload to `setCurrentStep(0)` instead of `length - 1` or the end. Since the UI only streams one step at a time via WebSocket after `handleStart`, `setCurrentStep` just needs to be properly managed when appending. Wait, the frontend doesn't receive a `timeline` event; it receives discrete `snapshot` events! So when the first snapshot arrives (Step 0), we just append it and set `setCurrentStep(0)`.
2. **Backend Boundary Detection:** We've already implemented the `containsAny` logic in `gdb.go`'s `Step()` function for `func="??"` and `__libc_start_main`. We just need to ensure the check cleanly drops the final step and sends the `FinishedMessage(0)` back to the client.

## Risks / Trade-offs
- Setting `currentStep` to `0` upon appending snapshots might cause the slider to stay stuck at 0 if we aren't careful. The UI must ensure that as the user actively clicks "Next" and *drives* the stepping, the slider follows the newly added step.
