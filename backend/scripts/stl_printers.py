"""
GDB Python script for extracting STL container contents via pretty printers.

This script is loaded by GDB at startup via the `-x` flag. It registers
custom commands that the Go backend can invoke to get structured output
from STL containers, bypassing the need to parse raw memory.

Usage from GDB:
    source stl_printers.py
    stl-dump myVector
    stl-dump myMap
"""

import gdb
import json
import sys

"""
Structural type tags for polymorphic memory layout visualization.
"""
STRUCTURAL_TYPES = {
    "PRIMITIVE": "PRIMITIVE",
    "ARRAY_1D": "ARRAY_1D",
    "MATRIX_2D": "MATRIX_2D",
    "LINKED_LIST": "LINKED_LIST",
    "BINARY_TREE": "BINARY_TREE",
    "STL_CONTAINER": "STL_CONTAINER",
}


def get_clean_type_str(type_obj):
    """Robustly clean and qualify a GDB type to standard format."""
    try:
        t = type_obj.strip_typedefs()
        if t.code == gdb.TYPE_CODE_REF:
            t = t.target().strip_typedefs()
        try:
            t = t.unqualified()
        except AttributeError:
            pass
        t_str = str(t)
        t_str = t_str.replace("const ", "").replace("volatile ", "").strip()
        if t_str.startswith("::"):
            t_str = t_str[2:]
        return t_str
    except Exception:
        return str(type_obj)


def classify_variable(var):
    """Classify a GDB value into a structural type tag.

    Returns one of: PRIMITIVE, ARRAY_1D, MATRIX_2D, LINKED_LIST,
    BINARY_TREE, STL_CONTAINER.
    """
    try:
        type_obj = var.type.strip_typedefs()
    except Exception:
        return STRUCTURAL_TYPES["PRIMITIVE"]

    type_code = type_obj.code
    t_str = get_clean_type_str(type_obj)
    clean_str = "".join(t_str.split())

    stl_prefixes = [
        "std::vector", "std::map", "std::unordered_map",
        "std::set", "std::unordered_set", "std::list",
        "std::deque", "std::string", "std::basic_string",
        "std::stack", "std::queue", "std::priority_queue",
        "std::pair", "std::array",
    ]
    for prefix in stl_prefixes:
        clean_prefix = "".join(prefix.split())
        if clean_str.startswith(clean_prefix):
            if clean_str.startswith("std::vector<std::vector") or clean_str.startswith("std::vector<std::vector<"):
                return STRUCTURAL_TYPES["MATRIX_2D"]
            return STRUCTURAL_TYPES["STL_CONTAINER"]

    if type_code == gdb.TYPE_CODE_ARRAY:
        try:
            inner_type = type_obj.target()
            if inner_type.code == gdb.TYPE_CODE_ARRAY:
                return STRUCTURAL_TYPES["MATRIX_2D"]
        except Exception:
            pass
        return STRUCTURAL_TYPES["ARRAY_1D"]

    if type_code == gdb.TYPE_CODE_PTR:
        return STRUCTURAL_TYPES["PRIMITIVE"]

    if type_code == gdb.TYPE_CODE_STRUCT:
        try:
            fields = list(type_obj.fields())
            field_names = [f.name for f in fields if f.name]
            has_left = "left" in field_names
            has_right = "right" in field_names
            if has_left and has_right:
                return STRUCTURAL_TYPES["BINARY_TREE"]
            if "next" in field_names:
                return STRUCTURAL_TYPES["LINKED_LIST"]
            return STRUCTURAL_TYPES["PRIMITIVE"]
        except Exception:
            return STRUCTURAL_TYPES["PRIMITIVE"]

    return STRUCTURAL_TYPES["PRIMITIVE"]


def resolve_structural_links(val, seen=None):
    """Extract structural links (next/prev/left/right) from a struct value.

    Returns a dict with 'type', 'root', and 'nodes' for LINKED_LIST or
    BINARY_TREE structures, or None for non-structural types.
    """
    if seen is None:
        seen = set()

    try:
        type_obj = val.type.strip_typedefs()
    except Exception:
        return None

    if type_obj.code != gdb.TYPE_CODE_STRUCT:
        return None

    try:
        fields = list(type_obj.fields())
        field_names = [f.name for f in fields if f.name]
    except Exception:
        return None

    has_next = "next" in field_names
    has_left = "left" in field_names
    has_right = "right" in field_names

    if not has_next and not (has_left and has_right):
        return None

    try:
        root_addr = str(val.address)
    except Exception:
        return None

    if root_addr in seen:
        return None
    seen.add(root_addr)

    nodes = {}
    stack = [(root_addr, val)]
    while stack:
        addr, node_val = stack.pop()
        if addr in nodes:
            continue

        node_info = {"value": {}, "links": {}}
        try:
            node_fields = list(node_val.type.strip_typedefs().fields())
            for f in node_fields:
                if f.name and f.name not in ("left", "right", "next", "prev"):
                    try:
                        node_info["value"][f.name] = str(node_val[f.name])
                    except Exception:
                        pass
        except Exception:
            node_info["value"] = str(node_val)

        for link_name in ("next", "prev", "left", "right"):
            if link_name in field_names:
                try:
                    ptr_val = node_val[link_name]
                    ptr_str = str(ptr_val)
                    if ptr_str and ptr_str != "0x0" and ptr_str != "0":
                        node_info["links"][link_name] = ptr_str
                        if ptr_str not in seen:
                            seen.add(ptr_str)
                            try:
                                child_type = str(type_obj)
                                child = gdb.parse_and_eval(
                                    f"*({child_type}*){ptr_str}"
                                )
                                stack.append((ptr_str, child))
                            except Exception:
                                pass
                except Exception:
                    pass

        nodes[addr] = node_info

    if not nodes:
        return None

    struct_type = "LINKED_LIST" if has_next else "BINARY_TREE"
    return {
        "type": struct_type,
        "root": root_addr,
        "nodes": nodes,
    }


def flatten_stl_container(val):
    """Flatten an STL container into a clean logical representation.

    Returns a dict with type tag and logical elements (no internal compiler
    metadata). Handles vectors, maps, sets, and other STL types.
    """
    try:
        type_str = get_clean_type_str(val.type)
    except Exception:
        return None

    clean_str = "".join(type_str.split())
    
    stl_type = None
    if clean_str.startswith("std::vector<std::vector"):
        stl_type = "MATRIX_2D"
    elif clean_str.startswith("std::vector"):
        stl_type = "ARRAY_1D"
    elif clean_str.startswith("std::map") or clean_str.startswith("std::unordered_map"):
        stl_type = "STL_CONTAINER"
    elif clean_str.startswith("std::set") or clean_str.startswith("std::unordered_set"):
        stl_type = "STL_CONTAINER"
    elif clean_str.startswith("std::list") or clean_str.startswith("std::deque"):
        stl_type = "ARRAY_1D"
    elif clean_str.startswith("std::basic_string") or clean_str.startswith("std::string"):
        stl_type = "PRIMITIVE"
    elif clean_str.startswith("std::stack") or clean_str.startswith("std::queue") or clean_str.startswith("std::priority_queue"):
        stl_type = "ARRAY_1D"
    elif clean_str.startswith("std::pair"):
        stl_type = "STL_CONTAINER"
    elif clean_str.startswith("std::array"):
        stl_type = "ARRAY_1D"
    else:
        return None

    result = {"type": stl_type, "container_type": type_str}

    if stl_type == "MATRIX_2D":
        rows = []
        try:
            impl = val["_M_impl"]
            start = impl["_M_start"]
            finish = impl["_M_finish"]
            size = int(finish - start)
            for i in range(min(size, 100)):
                row_val = start[i]
                try:
                    row_impl = row_val["_M_impl"]
                    row_start = row_impl["_M_start"]
                    row_finish = row_impl["_M_finish"]
                    row_size = int(row_finish - row_start)
                    row_elements = []
                    for j in range(min(row_size, 100)):
                        row_elements.append(str(row_start[j]))
                    rows.append(row_elements)
                except Exception:
                    try:
                        row_pp = gdb.default_visualizer(row_val)
                        if row_pp and hasattr(row_pp, 'children'):
                            row_elements = []
                            for _, elem_val in row_pp.children():
                                row_elements.append(str(elem_val))
                            rows.append(row_elements)
                        else:
                            rows.append([str(row_val)])
                    except Exception:
                        rows.append([str(row_val)])
            result["rows"] = rows
            dims = [len(rows), max((len(r) for r in rows), default=0)]
            result["dimensions"] = dims
        except Exception:
            try:
                pp = gdb.default_visualizer(val)
                if pp and hasattr(pp, 'children'):
                    for _, row_val in pp.children():
                        row_elements = []
                        row_pp = gdb.default_visualizer(row_val)
                        if row_pp and hasattr(row_pp, 'children'):
                            for _, elem_val in row_pp.children():
                                row_elements.append(str(elem_val))
                        else:
                            try:
                                row_val_clean = row_val.type.strip_typedefs()
                                if row_val_clean.code == gdb.TYPE_CODE_ARRAY:
                                    for j in range(row_val_clean.range()[1] + 1):
                                        row_elements.append(str(row_val[j]))
                                else:
                                    row_elements.append(str(row_val))
                            except Exception:
                                row_elements.append(str(row_val))
                        rows.append(row_elements)
                    result["rows"] = rows
                    dims = [len(rows), max((len(r) for r in rows), default=0)]
                    result["dimensions"] = dims
                else:
                    # Fallback for raw arrays
                    try:
                        val_clean = val.type.strip_typedefs()
                        if val_clean.code == gdb.TYPE_CODE_ARRAY:
                            for i in range(val_clean.range()[1] + 1):
                                row_val = val[i]
                                row_elements = []
                                row_val_clean = row_val.type.strip_typedefs()
                                if row_val_clean.code == gdb.TYPE_CODE_ARRAY:
                                    for j in range(row_val_clean.range()[1] + 1):
                                        row_elements.append(str(row_val[j]))
                                else:
                                    row_elements.append(str(row_val))
                                rows.append(row_elements)
                            result["rows"] = rows
                            dims = [len(rows), max((len(r) for r in rows), default=0)]
                            result["dimensions"] = dims
                        else:
                            result["error"] = "failed to extract matrix (no visualizer and not array)"
                    except Exception as fallback_e:
                        result["error"] = f"failed to extract matrix fallback: {str(fallback_e)}"
            except Exception as e:
                result["error"] = f"failed to extract matrix: {str(e)}"
        return result

    if stl_type == "ARRAY_1D":
        elements = []
        try:
            impl = val["_M_impl"]
            start = impl["_M_start"]
            finish = impl["_M_finish"]
            size = int(finish - start)
            for i in range(min(size, 1000)):
                elements.append({"index": i, "value": str(start[i])})
        except Exception:
            try:
                pp = gdb.default_visualizer(val)
                if pp and hasattr(pp, 'children'):
                    for i, (name, child_val) in enumerate(pp.children()):
                        if i >= 1000:
                            break
                        elements.append({"index": i, "value": str(child_val)})
                else:
                    # Fallback for raw arrays
                    try:
                        val_clean = val.type.strip_typedefs()
                        if val_clean.code == gdb.TYPE_CODE_ARRAY:
                            for i in range(min(val_clean.range()[1] + 1, 1000)):
                                elements.append({"index": i, "value": str(val[i])})
                    except Exception:
                        pass
            except Exception:
                pass
        result["elements"] = elements
        result["dimensions"] = [len(elements)]
        return result

    if stl_type == "STL_CONTAINER":
        elements = []
        if "map" in type_str:
            try:
                pp = gdb.default_visualizer(val)
                if pp and hasattr(pp, 'children'):
                    items = list(pp.children())
                    i = 0
                    while i < len(items) and i < 2000:
                        key_name, key_val = items[i]
                        if i + 1 < len(items):
                            val_name, val_val = items[i + 1]
                            elements.append({
                                "key": str(key_val),
                                "value": str(val_val)
                            })
                        i += 2
            except Exception:
                pass
        else:
            try:
                pp = gdb.default_visualizer(val)
                if pp and hasattr(pp, 'children'):
                    for i, (name, child_val) in enumerate(pp.children()):
                        if i >= 1000:
                            break
                        elements.append({"value": str(child_val)})
            except Exception:
                pass
        result["elements"] = elements
        return result

    if stl_type == "PRIMITIVE":
        result["value"] = str(val)
        return result

    return None


class STLDumpCommand(gdb.Command):
    """Dump an STL container as JSON using GDB's built-in pretty printers."""

    def __init__(self):
        super(STLDumpCommand, self).__init__("stl-dump", gdb.COMMAND_DATA)

    def invoke(self, arg, from_tty):
        args = gdb.string_to_argv(arg)
        if len(args) != 1:
            print("Usage: stl-dump <variable_name>")
            return

        var_name = args[0]
        try:
            val = gdb.parse_and_eval(var_name)
            type_str = str(val.type.strip_typedefs())
            result = flatten_stl_container(val)
            if result is None:
                result = self._extract(val, type_str)
            print("STL_JSON_BEGIN")
            print(json.dumps(result))
            print("STL_JSON_END")
        except gdb.error as e:
            print(json.dumps({"error": str(e)}))

    def _extract(self, val, type_str):
        """Extract container contents based on type."""
        if type_str.startswith("std::vector"):
            return self._extract_vector(val)
        elif type_str.startswith("std::map") or type_str.startswith("std::unordered_map"):
            return self._extract_map(val)
        elif type_str.startswith("std::set") or type_str.startswith("std::unordered_set"):
            return self._extract_set(val)
        elif type_str.startswith("std::list") or type_str.startswith("std::deque"):
            return self._extract_sequence(val)
        elif type_str.startswith("std::basic_string") or type_str.startswith("std::string"):
            return self._extract_string(val)
        elif type_str.startswith("std::stack"):
            return self._extract_adapter(val, "std::stack")
        elif type_str.startswith("std::queue") and not type_str.startswith("std::priority_queue"):
            return self._extract_adapter(val, "std::queue")
        elif type_str.startswith("std::priority_queue"):
            return self._extract_adapter(val, "std::priority_queue")
        elif type_str.startswith("std::pair"):
            return self._extract_pair(val)
        else:
            return {"type": type_str, "value": str(val)}

    def _extract_vector(self, val):
        """Extract std::vector elements."""
        elements = []
        try:
            # Access internal pointers of std::vector
            impl = val["_M_impl"]
            start = impl["_M_start"]
            finish = impl["_M_finish"]
            size = int(finish - start)

            for i in range(min(size, 1000)):  # Cap at 1000 elements
                elem = start[i]
                elements.append({
                    "index": i,
                    "value": str(elem)
                })
        except gdb.error:
            # Fallback: use the pretty printer string representation
            elements = [{"index": 0, "value": str(val)}]

        return {
            "type": "std::vector",
            "size": len(elements),
            "elements": elements
        }

    def _extract_map(self, val):
        """Extract std::map key-value pairs using the pretty printer."""
        elements = []
        try:
            # Use GDB's built-in pretty printer to iterate
            pp = gdb.default_visualizer(val)
            if pp and hasattr(pp, 'children'):
                items = list(pp.children())
                # GDB pretty printer yields alternating key/value pairs
                i = 0
                while i < len(items) and i < 2000:
                    key_name, key_val = items[i]
                    if i + 1 < len(items):
                        val_name, val_val = items[i + 1]
                        elements.append({
                            "key": str(key_val),
                            "value": str(val_val)
                        })
                    i += 2
            else:
                elements = [{"key": "?", "value": str(val)}]
        except gdb.error:
            elements = [{"key": "?", "value": str(val)}]

        return {
            "type": "std::map",
            "size": len(elements),
            "elements": elements
        }

    def _extract_set(self, val):
        """Extract std::set elements."""
        elements = []
        try:
            pp = gdb.default_visualizer(val)
            if pp and hasattr(pp, 'children'):
                for i, (name, child_val) in enumerate(pp.children()):
                    if i >= 1000:
                        break
                    elements.append({
                        "index": i,
                        "value": str(child_val)
                    })
        except gdb.error:
            elements = [{"index": 0, "value": str(val)}]

        return {
            "type": "std::set",
            "size": len(elements),
            "elements": elements
        }

    def _extract_sequence(self, val):
        """Extract std::list or std::deque elements."""
        elements = []
        try:
            pp = gdb.default_visualizer(val)
            if pp and hasattr(pp, 'children'):
                for i, (name, child_val) in enumerate(pp.children()):
                    if i >= 1000:
                        break
                    elements.append({
                        "index": i,
                        "value": str(child_val)
                    })
        except gdb.error:
            elements = [{"index": 0, "value": str(val)}]

        return {
            "type": str(val.type),
            "size": len(elements),
            "elements": elements
        }

    def _extract_string(self, val):
        """Extract std::string value."""
        try:
            return {
                "type": "std::string",
                "value": str(val)
            }
        except gdb.error:
            return {"type": "std::string", "value": "?"}

    def _extract_adapter(self, val, adapter_type):
        """Extract std::stack, std::queue, or std::priority_queue.
        These adapters wrap an internal container accessible via the 'c' member."""
        elements = []
        try:
            # Access the underlying container 'c'
            container = val["c"]
            container_type = str(container.type.strip_typedefs())

            # The underlying container is typically a deque or vector
            if container_type.startswith("std::vector"):
                impl = container["_M_impl"]
                start = impl["_M_start"]
                finish = impl["_M_finish"]
                size = int(finish - start)
                for i in range(min(size, 1000)):
                    elements.append({"index": i, "value": str(start[i])})
            else:
                # Fallback: use pretty printer
                pp = gdb.default_visualizer(container)
                if pp and hasattr(pp, 'children'):
                    for i, (name, child_val) in enumerate(pp.children()):
                        if i >= 1000:
                            break
                        elements.append({"index": i, "value": str(child_val)})
                else:
                    elements = [{"index": 0, "value": str(container)}]
        except gdb.error:
            # Last resort fallback: use the pretty printer on the adapter itself
            try:
                pp = gdb.default_visualizer(val)
                if pp and hasattr(pp, 'children'):
                    for i, (name, child_val) in enumerate(pp.children()):
                        if i >= 1000:
                            break
                        elements.append({"index": i, "value": str(child_val)})
            except gdb.error:
                elements = [{"index": 0, "value": str(val)}]

        return {
            "type": adapter_type,
            "size": len(elements),
            "elements": elements
        }

    def _extract_pair(self, val):
        """Extract std::pair first and second values."""
        try:
            first = str(val["first"])
            second = str(val["second"])
            return {
                "type": "std::pair",
                "elements": [
                    {"key": "first", "value": first},
                    {"key": "second", "value": second}
                ]
            }
        except gdb.error:
            return {"type": "std::pair", "value": str(val)}

class SnapshotCommand(gdb.Command):
    """Capture full execution state as JSON for the visualization frontend."""

    def __init__(self):
        super(SnapshotCommand, self).__init__("viz-snapshot", gdb.COMMAND_DATA)

    def invoke(self, arg, from_tty):
        try:
            snapshot = self._capture()
            print("SNAPSHOT_JSON_BEGIN")
            print(json.dumps(snapshot))
            print("SNAPSHOT_JSON_END")
        except Exception as e:
            print(json.dumps({"error": str(e)}))

    def _capture(self):
        """Capture the current execution state."""
        frame = gdb.selected_frame()
        sal = frame.find_sal()

        snapshot = {
            "line": sal.line if sal else 0,
            "file": str(sal.symtab.filename) if sal and sal.symtab else "",
            "stack": self._capture_stack(),
            "heap": []
        }

        # Debug: print the assembled snapshot JSON to stderr for instant verification
        print(json.dumps({"__debug_snapshot": snapshot}), file=sys.stderr)

        return snapshot

    def _capture_stack(self):
        """Walk the call stack and capture each frame."""
        frames = []
        frame = gdb.newest_frame()
        frame_id = 0

        while frame is not None:
            try:
                sal = frame.find_sal()
                frame_data = {
                    "frameId": str(frame_id),
                    "functionName": str(frame.name()) if frame.name() else "??",
                    "line": sal.line if sal else 0,
                    "file": str(sal.symtab.filename) if sal and sal.symtab else "",
                    "locals": self._capture_locals(frame)
                }
                frames.append(frame_data)
            except gdb.error:
                pass

            frame = frame.older()
            frame_id += 1

        return frames

    def _capture_locals(self, frame):
        """Capture local variables in the given frame with structural type tags."""
        locals_list = []
        try:
            block = frame.block()
            while block is not None:
                for sym in block:
                    if sym.is_argument or sym.is_variable:
                        try:
                            val = sym.value(frame)
                            struct_type = classify_variable(val)
                            local = {
                                "name": str(sym.name),
                                "type": str(sym.type),
                                "value": str(val),
                                "structType": struct_type,
                            }
                            # Add address for pointer types or complex value types
                            if sym.type.code == gdb.TYPE_CODE_PTR:
                                local["address"] = str(val)
                            elif sym.type.code in (gdb.TYPE_CODE_STRUCT, gdb.TYPE_CODE_ARRAY, gdb.TYPE_CODE_UNION):
                                try:
                                    local["address"] = str(val.address)
                                except Exception:
                                    pass

                            # For structures with links (BINARY_TREE, LINKED_LIST), resolve registry
                            if struct_type in ("BINARY_TREE", "LINKED_LIST"):
                                links = resolve_structural_links(val)
                                if links:
                                    local["structuralLinks"] = links

                            # For STL containers, flatten to logical representation
                            if struct_type == "STL_CONTAINER":
                                flat = flatten_stl_container(val)
                                if flat:
                                    local["stlFlattened"] = flat

                            locals_list.append(local)
                        except gdb.error:
                            pass
                if block.function:
                    break
                block = block.superblock
        except gdb.error:
            pass

        return locals_list


class AdvancedDumpCommand(gdb.Command):
    """Dump advanced structures (Lists, Trees, Matrices) as JSON with polymorphic type tags."""

    def __init__(self):
        super(AdvancedDumpCommand, self).__init__("adv-dump", gdb.COMMAND_DATA)

    def invoke(self, arg, from_tty):
        args = gdb.string_to_argv(arg)
        if len(args) < 2:
            print("ADV_JSON_BEGIN\\n" + json.dumps({"error": "Usage: adv-dump <address> <type>"}) + "\\nADV_JSON_END")
            return

        address = args[0]
        type_str = " ".join(args[1:])
        try:
            if "[" in type_str and "(*)" not in type_str:
                idx = type_str.find("[")
                base = type_str[:idx]
                brackets = type_str[idx:]
                cast_type = f"{base}(*){brackets}"
            else:
                cast_type = f"{type_str}*"
            val = gdb.parse_and_eval(f"*({cast_type}){address}")
            result = self._detect_and_extract(val, set())
            # Debug: print the assembled JSON to stderr
            print(json.dumps({"__debug_adv": result}), file=sys.stderr)
            print("ADV_JSON_BEGIN")
            print(json.dumps(result))
            print("ADV_JSON_END")
        except gdb.error as e:
            print("ADV_JSON_BEGIN\n" + json.dumps({"error": str(e)}) + "\nADV_JSON_END")

    def _detect_and_extract(self, val, seen):
        struct_type = classify_variable(val)

        if struct_type == "LINKED_LIST":
            return self._extract_linked_list_registry(val, seen)
        if struct_type == "BINARY_TREE":
            return self._extract_binary_tree_registry(val, seen)
        if struct_type == "MATRIX_2D":
            return self._extract_matrix(val, seen)
        if struct_type == "ARRAY_1D":
            return self._extract_array(val, seen)
        if struct_type == "STL_CONTAINER":
            flat = flatten_stl_container(val)
            if flat:
                return flat
            return {"value": str(val)}
        if struct_type == "PRIMITIVE":
            return {"value": str(val)}

        return {"value": str(val)}

    def _extract_linked_list_registry(self, val, seen):
        """Extract a linked list as a flat address-keyed registry."""
        result = resolve_structural_links(val, seen)
        if result:
            return result
        # Fallback: single node
        try:
            addr = str(val.address)
        except Exception:
            addr = "?"
        return {"type": "LINKED_LIST", "root": addr, "nodes": {addr: {"value": str(val), "links": {}}}}

    def _extract_binary_tree_registry(self, val, seen):
        """Extract a binary tree as a flat address-keyed registry."""
        result = resolve_structural_links(val, seen)
        if result:
            return result
        try:
            addr = str(val.address)
        except Exception:
            addr = "?"
        return {"type": "BINARY_TREE", "root": addr, "nodes": {addr: {"value": str(val), "links": {}}}}

    def _extract_matrix(self, val, seen):
        flat = flatten_stl_container(val)
        if flat:
            return flat
        elements = []
        try:
            val_type = val.type.strip_typedefs()
            if val_type.code == gdb.TYPE_CODE_ARRAY:
                for i in range(val_type.range()[1] + 1):
                    row_val = val[i]
                    row_elements = []
                    row_val_type = row_val.type.strip_typedefs()
                    if row_val_type.code == gdb.TYPE_CODE_ARRAY:
                        for j in range(row_val_type.range()[1] + 1):
                            row_elements.append(str(row_val[j]))
                    else:
                        row_elements.append(str(row_val))
                    elements.append(row_elements)
            else:
                impl = val["_M_impl"]
                start = impl["_M_start"]
                finish = impl["_M_finish"]
                size = int(finish - start)
                for i in range(min(size, 100)):
                    elem = start[i]
                    elements.append(self._detect_and_extract(elem, seen))
        except Exception:
            pass
        return {"type": "MATRIX_2D", "rows": elements}

    def _extract_array(self, val, seen):
        flat = flatten_stl_container(val)
        if flat:
            return flat
        elements = []
        try:
            val_type = val.type.strip_typedefs()
            if val_type.code == gdb.TYPE_CODE_ARRAY:
                for i in range(val_type.range()[1] + 1):
                    elements.append({"index": i, "value": str(val[i])})
            else:
                impl = val["_M_impl"]
                start = impl["_M_start"]
                finish = impl["_M_finish"]
                size = int(finish - start)
                for i in range(min(size, 100)):
                    elements.append({"index": i, "value": str(start[i])})
        except Exception:
            pass
        return {"type": "ARRAY_1D", "elements": elements}

# Register custom commands
STLDumpCommand()
SnapshotCommand()
AdvancedDumpCommand()

print("cpp-memory-visualizer: STL printers and snapshot commands loaded.")
