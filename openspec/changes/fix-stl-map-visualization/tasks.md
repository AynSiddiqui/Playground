## 1. Python script enhancements (`stl_printers.py`)

- [x] 1.1 Add the explicit libstdc++ pretty-printer path registration block to the top of `stl_printers.py`.
- [x] 1.2 Update `flatten_stl_container()` (under the `"map" in type_str` branch) to return `None` if the visualizer `pp` is `None` or has no `children` attribute, rather than silently returning an empty elements list.

## 2. Go debugger wrapper enhancements (`gdb.go`)

- [x] 2.1 Wrap the `-data-evaluate-expression` commands in double quotes inside `getFrame()`, `dereferencePointer()`, and `extractSTLElements()` (lines 306, 371, 464).
- [x] 2.2 Wrap the base type parameter in escaped double quotes inside the `adv-dump` console execution (line 403).

## 3. Verification

- [x] 3.1 Check Python script syntax and compile Go backend to verify it builds correctly.
- [x] 3.2 Test stepping through a `std::map` program to confirm the map variables render correctly in the visualizer.
