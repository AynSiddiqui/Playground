## Context

In C++ range-based `for` loops, compilers synthesize internal variable helpers (`__for_range`, `__for_begin`, `__for_end`, etc.). These helpers clog the local variable scope window in the visualization and lead to GDB evaluation errors.
Also, the Go backend dereferences reference-typed stack variables (like `std::pair<...>&`) by converting them to `T&*` (pointer to a reference) instead of a simple pointer (`T*`), causing invalid memory address lookup failures in GDB.

## Goals / Non-Goals

**Goals:**
- Eliminate stack visualization noise by filtering out variables starting with double underscores `__`.
- Resolve references safely by replacing type suffix `&` with `*` instead of appending `*` directly.
- Allow loop-iterator pointers (like `pair` inside range loops) to be resolved as valid pointers linking directly to the map nodes.

**Non-Goals:**
- Filtering out user variables starting with a single underscore (e.g. `_var` is permitted).
- Modifying standard GDB stack frames that are not user-defined functions (such as `main`).

## Decisions

### Decision 1: Filter compiler variables in `parseLocals`
We will skip variables starting with `__` inside `parseLocals()` in `gdb.go`.
*Alternative considered:* Filtering them in the frontend. However, filtering at the backend GDB wrapper level keeps payload transmissions minimal and avoids wasting network bandwidth and processor resources.

### Decision 2: Reference Suffix Conversion
In `extractHeapObjects()` in `gdb.go`, we will add check logic for reference types:
```go
ptrType := local.Type
if strings.HasSuffix(ptrType, "&") {
    ptrType = strings.TrimSuffix(ptrType, "&")
    ptrType = strings.TrimSpace(ptrType) + "*"
} else if !isPointerType(ptrType) {
    ...
}
```
This correctly converts `std::pair<...>&` to `std::pair<...>*`, enabling standard dereferences.

## Risks / Trade-offs

- **[Risk]** A user might name a local variable starting with `__` (e.g. `int __my_var = 10;`).
  → **Mitigation**: Double underscores are reserved symbols under the C++ standard for compiler internals and standard libraries. It is a best practice to discourage or ignore variables starting with `__` for custom code, and filtering them matches standard industry debugger behavior.
