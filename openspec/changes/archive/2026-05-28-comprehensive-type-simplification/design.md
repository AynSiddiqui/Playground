## Context

STL container type strings from GDB contain fully-qualified C++ template parameters including default allocators, comparators, and ABI namespace qualifiers. These are technically accurate but visually useless for a human debugging C++ code. The problem manifests in three places:

1. **Stack variable nodes** — `MemoryNode.tsx:110` renders `v.type` directly (the raw GDB output)
2. **Heap node labels** — `MemoryCanvas.tsx:452` uses `getCleanSTLTypeName()` which only handles map/set variants
3. **Wire format** — The Go backend passes full GDB types untouched, bloating JSON payloads

## Goals / Non-Goals

**Goals:**
- All displayed STL types show a clean, human-readable form (e.g., `std::map<std::string, int>` not the 20-line template expansion)
- Every STL container type is handled: vector, list, deque, array, map, set, unordered_map, unordered_set, stack, queue, priority_queue, pair
- Stack variable nodes show the cleaned type alongside the raw type available on hover
- Backend pre-cleans types to reduce wire size
- No duplication of `cleanType`/`isSTLType` between components

**Non-Goals:**
- Changing how struct/class types are displayed (only STL containers)
- i18n or localization of type names
- Dynamic type resolution at runtime

## Decisions

### 1. Shared utility over duplication
**Decision**: Extract all type-cleaning functions into `frontend/src/utils/typeUtils.ts`.
**Rationale**: `cleanType` and `isSTLType` are currently duplicated between `MemoryCanvas.tsx` and `MemoryNode.tsx`. A shared module prevents drift, simplifies testing, and makes the cleaning pipeline visible in one place.

### 2. Extend existing pattern over rewriting
**Decision**: Extend `getCleanSTLTypeName` (existing function) rather than writing a new parser.
**Rationale**: The function already handles bracket-depth parsing for map/set. The same pattern extends naturally to other containers — parse template args, strip the trailing defaults, reconstruct.

### 3. Backend pre-cleaning over frontend-only
**Decision**: Do cleanup at both ends — Go strip `__cxx11::` and `basic_string<...>` → `string`, frontend handles display-level formatting.
**Rationale**: The Go-side `cleanType()` already handles prefix stripping. Adding two simple replacements reduces wire size and gives the frontend less noise to parse. The frontend `getCleanSTLTypeName` handles the container-specific logic (which args to keep).

### 4. Clean type on stack nodes as a new field
**Decision**: Add `cleanType` to the variable data passed to stack nodes, rather than mutating `type`.
**Rationale**: Preserving `type` (raw) allows tooltip and downstream matching logic to stay unchanged. `cleanType` is additive.

## Template Argument Retention Table

```
Container         Total args    Keep args
──────────────────────────────────────────
map<K,V,C,A>      4             K, V
unordered_map<>   5             K, V
set<K,C,A>        3             K
unordered_set<>   4             K
vector<T,A>       2             T
list<T,A>         2             T
deque<T,A>        2             T
array<T,N>        2             T, N
stack<T,C>        2             T
queue<T,C>        2             T
priority_queue<>  3             T
pair<T,U>         2             T, U
```

## Risks / Trade-offs

- [Risk] Template arg parsing with nested `<>` may produce edge cases for chained templates like `std::vector<std::map<...>>` → Mitigation: existing bracket-depth parsing already handles nesting; add test cases for chained templates.
- [Risk] Backend `cleanType()` might over-strip if user code defines types containing `__cxx11` → Mitigation: only strip when preceded by `std::` (i.e., `std::__cxx11::`).
- [Risk] The `shortenSTLType` replacement could match inside string literals or user-defined templates → Mitigation: only apply to whole token or after `std::` prefix.
