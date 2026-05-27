## 1. Modify `flatten_stl_container()`

- [x] 1.1 Locate the `STL_CONTAINER` block dealing with `std::map` inside `flatten_stl_container()`.
- [x] 1.2 Within the pretty-printer extraction loop (`while i < len(items) and i < 2000:`), fetch the memory address using `key_val.address`.
- [x] 1.3 Add a `try...except Exception:` block around the address lookup to capture `gdb.error` or `AttributeError` and fallback to `"0x0"`.
- [x] 1.4 Include the retrieved `address` in the dictionary that is appended to the `elements` array.

## 2. Modify `_extract_map()`

- [x] 2.1 Locate the `_extract_map(self, val)` fallback extraction logic.
- [x] 2.2 Replicate the address extraction inside the `while` loop over `items = list(pp.children())`.
- [x] 2.3 Apply the same `try...except Exception:` fallback to `"0x0"`.
- [x] 2.4 Update the `elements.append` call to include the `"address"` key.

## 3. Verify changes

- [x] 3.1 Run tests or test debugging a `std::map` locally via GDB to ensure `"address"` is emitted cleanly without exceptions.
