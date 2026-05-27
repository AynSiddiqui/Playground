## 1. Implement std::pair serialization in Python

- [x] 1.1 Locate `flatten_stl_container()` in `backend/scripts/stl_printers.py`.
- [x] 1.2 Insert an `elif "pair" in type_str:` branch under the `"STL_CONTAINER"` type block.
- [x] 1.3 Implement direct indexing of `val["first"]` and `val["second"]`, extract their addresses with fallback, and append them as elements.

## 2. Verification

- [x] 2.1 Recompile Python script syntax using `py_compile`.
- [x] 2.2 Run program stepping through map iterations to confirm `pair` variables correctly display `first` and `second` keys/values in the visualizer.
