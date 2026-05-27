## Context

When debugging map iterators, users step over variables of type `std::pair`. However, because `std::pair` has no explicit parsing logic inside `flatten_stl_container()`, the visualizer renders them empty.

## Goals / Non-Goals

**Goals:**
- Extract the `first` and `second` elements of `std::pair` stack/heap variables.
- Include their memory addresses (`first_val.address` and `second_val.address`).
- Render pair variables as standard structured elements in the visualizer.

**Non-Goals:**
- Handling recursive nesting of pairs inside pairs dynamically beyond standard elements serialization.

## Decisions

### Decision 1: Add a pair-specific condition block in `flatten_stl_container`
We will intercept `"pair"` inside `type_str` and serialize `first` and `second` manually:
```python
        elif "pair" in type_str:
            try:
                first_val = val["first"]
                second_val = val["second"]
                try:
                    first_addr = str(first_val.address) if first_val.address is not None else "0x0"
                except Exception:
                    first_addr = "0x0"
                try:
                    second_addr = str(second_val.address) if second_val.address is not None else "0x0"
                except Exception:
                    second_addr = "0x0"
                
                elements.append({
                    "key": "first",
                    "value": clean_gdb_value(first_val),
                    "address": first_addr
                })
                elements.append({
                    "key": "second",
                    "value": clean_gdb_value(second_val),
                    "address": second_addr
                })
            except Exception:
                pass
```

## Risks / Trade-offs

- **[Risk]** The GDB `val["first"]` indexing might throw `gdb.error` if a pair is uninitialized or optimized out.
  → **Mitigation**: The `try...except` block wraps the extraction, returning safely without visualizer crashes.
