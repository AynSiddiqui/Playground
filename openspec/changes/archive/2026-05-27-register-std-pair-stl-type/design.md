## Context

`std::pair` variables are not classified as STL types by the Go backend debugger. Thus, GDB address evaluations are skipped for them, leading to blank values and addresses in the local snapshot.

## Goals / Non-Goals

**Goals:**
- Add `"std::pair"` to the slice of STL prefixes in `gdb.go`.
- Enable GDB to fetch addresses for `std::pair` and its references.

**Non-Goals:**
- None.

## Decisions

### Decision 1: Register std::pair inside `isSTLType()`
We will append `"std::pair"` to `stlPrefixes` in `isSTLType()` in `gdb.go`.
This aligns the Go types configuration directly with GDB's Python classifer list in `stl_printers.py`.

## Risks / Trade-offs

- **[Risk]** None. Adding a type prefix pattern to a helper matcher is zero-risk.
