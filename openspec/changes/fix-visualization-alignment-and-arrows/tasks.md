## 1. Modify CSS Map Cell Alignment

- [x] 1.1 Locate `.stl-map-cell-value` styling inside `frontend/src/index.css`.
- [x] 1.2 Change `text-align: right;` to `text-align: left;` in both occurrences to align map/pair values with their table headers.

## 2. Implement Frontend Reference-Edge Rendering

- [x] 2.1 Add `std::pair` to `isSTLType()` in `frontend/src/components/MemoryCanvas.tsx`.
- [x] 2.2 Identify C++ reference variables by checking if `local.type` contains `&` (`isReference`).
- [x] 2.3 Update the target address calculation to use `local.address` for reference variables, drawing pointer edges to the referenced stack or heap objects.

## 3. Verification

- [x] 3.1 Run frontend and backend servers to test the visualizer application.
- [x] 3.2 Step through a map iteration containing reference variables to verify that the map values are left-aligned and reference variables point correctly to the referenced objects.
