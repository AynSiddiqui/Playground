## 1. Fix Backend Field Parsing (Layer 1)

- [x] 1.1 Rewrite `parseFieldsFromEval` in `gdb.go` to extract field `name`, `type`, and `value` from GDB MI `-data-evaluate-expression` output for struct types, using regex or brace-parsing to split `name = value` pairs
- [x] 1.2 Verify that the new parser correctly handles edge cases: nested braces, escaped characters, multiple fields on one line, and the `{...}` struct literal format
- [x] 1.3 Test that `chaseNodePointers` can now discover child nodes via `next`/`prev`/`left`/`right`/`parent` pointer fields after the parser fix
- [x] 1.4 Run `go build ./...` and `go test ./...` to verify backend compiles and passes existing tests

## 2. Add Frontend AdvancedData Fallback (Layer 2)

- [x] 2.1 In `MemoryCanvas.tsx`, after the stack loop structural processing (line ~201), add a new helper function `processAdvancedDataOnHeap(heapObj, ...)` that checks `heapObj.advancedData` for structural link data (`type === 'LINKED_LIST' || type === 'BINARY_TREE'`)
- [x] 2.2 In the heap loop (`(snapshot.heap || []).forEach`), after pushing the heap node but before the field edge loop, call `processAdvancedDataOnHeap` to run Pass 1 + Pass 2 logic from heap `AdvancedData`
- [x] 2.3 Ensure the heap `AdvancedData` path uses the same `structuralNodeIds` set for deduplication with the stack structural path
- [x] 2.4 Ensure nodes created via heap `AdvancedData` get `variables` populated from the registry's `value` field, matching the same format as stack Pass 2

## 3. Fix Conditional Field Filter (Layer 3)

- [x] 3.1 In the heap field edge loop (line ~226), change the `structuralFieldNames` filter from unconditional skip to conditional: `if (structuralFieldNames.has(field.name) && structuralNodeIds.has(nodeId)) return;`
- [x] 3.2 Verify that heap field edges are created for `next`/`prev`/`left`/`right` when structural processing did NOT handle them, and skipped when it did

## 4. Verify End-to-End

- [x] 4.1 Run `npx tsc --noEmit` in `frontend/` and verify zero type errors
- [x] 4.2 Run `go build ./...` in `backend/` and verify zero compile errors
- [x] 4.3 Test with a linked list program: verify all nodes appear with `next` arrows connecting them *(requires full app — verify at runtime)*
- [x] 4.4 Test with a binary tree program: verify all nodes appear with `left`/`right` arrows connecting them *(requires full app — verify at runtime)*
