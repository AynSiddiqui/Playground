## Context

The debugging backend `stl_printers.py` abstracts STL containers for the visualizer. For `std::map`, it extracts alternating keys and values using the native `gdb.default_visualizer(val).children()` pretty printer. While it successfully gets their text string representations, it currently omits fetching the exact memory address. The frontend needs this memory address (specifically the memory address of the internal `std::pair` object holding the key and value) to render structural memory graphs properly.

## Goals / Non-Goals

**Goals:**
- Extract the memory address of the internal `std::pair` inside the `std::map` node.
- Include the address robustly in the JSON payload under the `"address"` key.
- Provide a robust fallback to `"0x0"` if the value is optimized out or unaddressable.

**Non-Goals:**
- Manually parsing the libstdc++ `_Rb_tree` pointers. We will leverage the existing pretty printer.
- Changing how other containers are rendered or adding addressing for scalar primitive values.

## Decisions

### Decision 1: Use `key_val.address` for Memory Reference
Since the native GDB pretty printer yields `key_val` representing the `first` member of `std::pair<const K, V>`, its memory address (`key_val.address`) corresponds exactly to the start of the `std::pair` object within the red-black tree node.
*Alternative considered:* Manually walking `_Rb_tree` pointers to get the strict `_Rb_tree_node` address. This is brittle and tightly coupled to specific compiler/STL versions. Relying on the pretty printer's output is vastly more stable.

### Decision 2: Fallback to `"0x0"` on Error
We will wrap `str(key_val.address)` inside a `try...except` block catching `gdb.error` and `AttributeError` to handle edge cases like optimized-out values, register variables, or lacking debug info.

## Risks / Trade-offs

- **[Risk]** The GDB pretty printer on some ancient or custom STL versions might yield synthesized values with no addresses.
  → **Mitigation**: The `try/except` fallback to `"0x0"` ensures the visualizer still receives key/value data even if structural linking becomes impossible.
