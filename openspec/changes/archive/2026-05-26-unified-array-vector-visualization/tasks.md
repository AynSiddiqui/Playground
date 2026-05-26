## 1. GDB Python Script Updates

- [ ] 1.1 Update `_extract_array` in `stl_printers.py` to format raw array elements as `{"index": i, "value": val}`
- [ ] 1.2 Update `_extract_matrix` in `stl_printers.py` to support fallback extraction for raw 2D arrays

## 2. Memory Canvas Updates

- [ ] 2.1 Add `isSTLType` helper function to `MemoryCanvas.tsx`
- [ ] 2.2 Update `buildNodesAndEdges` in `MemoryCanvas.tsx` to link stack-allocated STL/array variables via pointer edges
- [ ] 2.3 Correct the binary tree orientation check to look for `type === 'BINARY_TREE'` in `getLayoutedElements`
- [ ] 2.4 Explicitly add generic parameters `Node` and `Edge` to react-flow state hooks in `MemoryCanvas.tsx`

## 3. Memory Node Component Updates

- [ ] 3.1 Implement rendering block for `ARRAY_1D` in `MemoryNode.tsx` without the `isStl` requirement
- [ ] 3.2 Implement CSS Grid rendering block for `MATRIX_2D` in `MemoryNode.tsx`
- [ ] 3.3 Add `BINARY_TREE` and `LINKED_LIST` fallbacks for structural node renderer checks
- [ ] 3.4 Remove unused warnings parameter `i` in variable mapping in `MemoryNode`

## 4. Verification

- [ ] 4.1 Compile frontend production build (`npm run build`) to ensure no compilation issues
- [ ] 4.2 Run backend unit tests (`go test ./...`) to verify sandbox execution works
- [ ] 4.3 Verify 1D and 2D arrays, 1D and 2D vectors, linked lists, and binary trees render correctly in the visualizer UI
