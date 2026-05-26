## 1. Robust Parser Refactor

- [x] 1.1 In `backend/internal/debugger/gdb.go`, rewrite `parseLocalsOutput` to use `regexp` to find all occurrences of variable blocks, fixing the missing variable bug.

## 2. Advanced Structure Support

- [x] 2.1 In `backend/api/schema.json`, add an `advancedData` property to `StackFrame` and `HeapObject` schemas.
- [x] 2.2 In `backend/internal/debugger/gdb.go`, implement a pointer-chasing helper that detects `*Node` types and queries their children via `-data-evaluate-expression` or `-var-create`.

## 3. Visual Edge Rendering

- [x] 3.1 In `frontend/src/utils/canvas.ts`, implement edge generation for elements inside `advancedData`, connecting the React Flow `<Handle>` IDs visually across the canvas.
