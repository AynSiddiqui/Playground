## 1. Shared type utility module

- [x] 1.1 Create `frontend/src/utils/typeUtils.ts` with `cleanType`, `isSTLType`, `getCleanSTLTypeName`
- [x] 1.2 Migrate `cleanType` from MemoryCanvas.tsx into the shared module (remove local copy)
- [x] 1.3 Migrate `isSTLType` from MemoryCanvas.tsx into the shared module (remove local copy)
- [x] 1.4 Migrate `getCleanSTLTypeName` from MemoryCanvas.tsx into the shared module (remove local copy)
- [x] 1.5 Import from `typeUtils` in MemoryCanvas.tsx
- [x] 1.6 Import from `typeUtils` in MemoryNode.tsx (remove local `cleanType`/`isSTLType`)
- [x] 1.7 `npm run build` — clean

## 2. Comprehensive STL type cleaning

- [x] 2.1 Extend `getCleanSTLTypeName` to handle `vector`, `list`, `deque`, `array`
- [x] 2.2 Extend `getCleanSTLTypeName` to handle `stack`, `queue`, `priority_queue`
- [x] 2.3 Extend `getCleanSTLTypeName` to handle `pair`
- [x] 2.4 Add `shortenSTLType` helper for basic_string→string and `__cxx11::` stripping
- [x] 2.5 `npm run build` — clean

## 3. Stack variable type display

- [x] 3.1 In `MemoryCanvas.tsx buildNodesAndEdges`, add `cleanType: getCleanSTLTypeName(local.type)` to stack node variable data
- [x] 3.2 In `MemoryNode.tsx`, display `cleanType` in the type span with raw type in `title` tooltip
- [x] 3.3 `npm run build` — clean

## 4. Backend pre-cleaning

- [x] 4.1 In `gdb.go cleanType()`, strip `std::__cxx11::` prefix
- [x] 4.2 In `gdb.go cleanType()`, replace `basic_string<char, char_traits<char>, allocator<char>>` → `string`
- [x] 4.3 In `gdb.go`, remove trailing allocator/comparator default template params for map/vector/set/unordered_map/unordered_set — added `stripDefaultTemplateArgs` with recursive nested cleaning and `containerKeepArgs` map
- [x] 4.4 Add unit tests for Go `cleanType()` — 19 tests covering namespace stripping, basic_string normalization, allocator removal, nested templates, non-STL passthrough
- [x] 4.5 `go build ./...` — clean

## 5. Verification

- [ ] 5.1 Manual: `std::map<string,int>` with 3 entries — check types on stack + heap display as `std::map<std::string, int>`
- [ ] 5.2 Manual: `std::vector<int>` — shows `std::vector<int>` not full allocator type
- [ ] 5.3 Manual: `std::array<double,10>` — shows `std::array<double, 10>`
- [ ] 5.4 Manual: `std::pair<string,int>` — shows `std::pair<std::string, int>`
- [ ] 5.5 Manual: `std::list`, `std::deque`, `std::stack`, `std::queue` — all simplified
- [ ] 5.6 Manual: pointer types & structs unchanged (no false positives)
- [ ] 5.7 Manual: raw GDB type available on hover via tooltip
- [ ] 5.8 Go build: clean | Frontend build: clean
