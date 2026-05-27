## Why

Range-based loops in C++ maps unpack elements into `std::pair` reference variables (e.g. `pair` loop variable). Currently, `std::pair` is classified as `STL_CONTAINER` but has no custom extraction block in `flatten_stl_container()`. Since GDB does not possess a default visualizer for pairs, the backend returns empty element lists, causing loop variables to render empty in the visualizer.

## What Changes

- Add explicit `std::pair` template matching in `flatten_stl_container()` inside `stl_printers.py`.
- Directly index the `first` and `second` elements of the pair, serialize their clean values, extract their memory addresses, and return them as elements to be rendered as key-value rows in the frontend.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None. This is a visualizer serialization bug fix.

## Impact

- **Code Affected**: `backend/scripts/stl_printers.py`.
- **API/Protocol**: Emits structured elements for pairs matching the map elements schema.
- **Systems**: Map/set iterator step-through visuals in the frontend.
