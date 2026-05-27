## 1. Register std::pair inside GDB wrapper

- [x] 1.1 Locate `isSTLType()` in `backend/internal/debugger/gdb.go` (around line 795).
- [x] 1.2 Append `"std::pair"` to the `stlPrefixes` string slice.

## 2. Verification

- [x] 2.1 Recompile backend and run Go tests to ensure everything builds successfully.
- [x] 2.2 Run debugger and verify `pair` loop variables successfully resolve their heap addresses and render `first`/`second` table details.

