## Why

The backend debugging script currently abstracts away the internal structure of `std::map` elements, resulting in a loss of the actual element memory address. As a result, the frontend lacks a reference pointer to render map elements securely or link them correctly in the memory graph visualization.

## What Changes

- Modify `backend/scripts/stl_printers.py` specifically `flatten_stl_container()` and `_extract_map()`.
- Augment the pretty-printer extraction loop to extract `key_val.address` for every map element.
- Inject the exact memory address into the JSON payload alongside the key and value strings.
- Add robust `try/except` fallback logic for optimized-out or unaddressable values, defaulting to `"0x0"`.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None. This is an internal technical fix for the backend STL data extraction pipeline.

## Impact

- **Code Affected**: `backend/scripts/stl_printers.py`
- **APIs**: The JSON structure emitted by the `stl-dump` command and `flatten_stl_container` will now contain an extra `"address"` key in each element of `std::map`.
- **Systems**: Debugging backend and the frontend visualization (which will now receive the necessary data to render addresses).
