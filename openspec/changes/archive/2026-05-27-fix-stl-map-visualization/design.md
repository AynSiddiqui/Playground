## Context

Currently, `gdb` inside the sandbox does not load default pretty printers for `std::map`. This causes `flatten_stl_container` to return an empty elements array. The frontend sees empty `elements` and fails to render the map completely, skipping fallbacks. Additionally, when types contain spaces (e.g. `std::map<std::string, int>`), GDB MI evaluates them as multiple arguments unless they are surrounded by quotes, leading to syntax usage errors.

## Goals / Non-Goals

**Goals:**
- Force GDB to load standard GCC `libstdc++` pretty printers in the Python script.
- Ensure GDB MI commands sent by the Go backend wrap expression arguments in double quotes.
- Fallback gracefully when `gdb.default_visualizer()` returns `None`.

**Non-Goals:**
- Modifying how the frontend parses the JSON structure.

## Decisions

### Decision 1: Explicitly register GCC pretty printers in Python
We will modify the start of `stl_printers.py` to append the Python path of the compiler pretty printers and run the standard registration method:
```python
import sys
try:
    for path in ['/usr/local/share/gcc-16.1.0/python', '/usr/share/gcc/python']:
        if path not in sys.path:
            sys.path.insert(0, path)
    from libstdcxx.v6.printers import register_libstdcxx_printers
    register_libstdcxx_printers(None)
except Exception as e:
    sys.stderr.write(f"Failed to register libstdcxx pretty printers: {str(e)}\n")
```

### Decision 2: Quote GDB MI evaluations in Go
In `gdb.go`, we will format GDB MI evaluation commands to wrap expressions in escaped double quotes `\"`.
*Examples:*
- `-data-evaluate-expression "*(ptrType)address"`
- `adv-dump <address> "<typeName>"`

### Decision 3: Fall back on `pp = None`
In `flatten_stl_container()`, if `stl_type == "STL_CONTAINER"` and `"map" in type_str`, we should return `None` (rather than an empty `elements: []` list) if `gdb.default_visualizer(val)` returns `None` or fails. This lets the caller fall back to string parsing or default prints.

## Risks / Trade-offs

- **[Risk]** Type names in templates might contain escaped double quotes themselves in extremely rare cases (like NTTP string templates).
  → **Mitigation**: Standard educational programs do not use these advanced C++20 features; simple templates are safe.
