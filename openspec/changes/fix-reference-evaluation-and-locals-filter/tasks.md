## 1. Filter Compiler-Generated Locals

- [x] 1.1 Locate the `parseLocals` method in `backend/internal/debugger/gdb.go` (around line 522).
- [x] 1.2 Add a check `if strings.HasPrefix(name, "__")` inside the loops where local variables are parsed, and `continue` to skip them.

## 2. Fix Reference Type Suffix Dereference

- [x] 2.1 Locate the `extractHeapObjects` method in `backend/internal/debugger/gdb.go` (around line 329).
- [x] 2.2 Add a conditional block before `isPointerType` check to intercept reference types ending with `&`.
- [x] 2.3 Strip the suffix `&`, trim spaces, and append `*` to form a pointer type (e.g. `std::pair<...>*`), resolving it as a pointer.

## 3. Verification

- [x] 3.1 Rebuild the Go backend to ensure compilation passes without errors.
- [x] 3.2 Run local test files or step-through maps in range loops to confirm `pair` loops work cleanly without debugger MI parse syntax errors.
