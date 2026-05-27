## 1. Go Backend — STL Dereference Fallback

- [x] 1.1 `else if isSTLType(cleanType(local.Type))` at `gdb.go:357`
- [x] 1.2 `delete(seen, address)` + `HeapObject{Address, Type, IsSTL: true}` at `gdb.go:358-364`
- [x] 1.3 `adv-dump` console command + parse at `gdb.go:365-368`
- [x] 1.4 Elements extracted from `advancedData.elements` at `gdb.go:369-385`
- [x] 1.5 `heapObjects = append(heapObjects, *obj)` at `gdb.go:387`
- [x] 1.6 Go build: clean | TypeScript build: clean

## 2. Frontend — STL Variable Source Handle

**File**: `frontend/src/components/MemoryNode.tsx`

- [x] 2.1 Add `isSTLType()` helper function (or import from MemoryCanvas) to detect `std::` prefixed types
- [x] 2.2 Locate the Handle rendering logic in the `category === 'variable'` section (lines 82-88)
- [x] 2.3 Extend the condition from `v.type.includes('*')` to `v.type.includes('*') || isSTLType(v.type)`
- [x] 2.4 Use amber color (#f59e0b) for STL handles, cyan (#22d3ee) for pointer handles
- [x] 2.5 Test: npm run build (verify no TypeScript errors)

## 3. Frontend — Distinct Edge Style for STL Connections

**File**: `frontend/src/components/MemoryCanvas.tsx`

- [x] 3.1 In `buildNodesAndEdges()`, locate the edge creation block for STL variables (around line 265)
- [x] 3.2 Change the edge style color from pink (#ec4899) to amber (#f59e0b)
- [x] 3.3 Keep the `animated: true` and `smoothstep` type
- [x] 3.4 Test: npm run build (verify no TypeScript errors)

## 4. Verification

- [ ] 4.1 Manual — run debug session with `std::map<string, int> ages;` and add 3+ entries
- [ ] 4.2 Verify amber arrow connects the stack box to the heap box
- [ ] 4.3 Verify pointer variables still use cyan edges (no regression)
- [ ] 4.4 Manual — verify `std::vector` and `std::set` unchanged
- [ ] 4.5 Manual — verify collapse/expand still works if implemented
- [ ] 4.6 Frontend build: `npm run build` — clean
- [ ] 4.7 Go build: `go build ./...` — clean
