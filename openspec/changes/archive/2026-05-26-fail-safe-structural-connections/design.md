## Context

The frontend (`MemoryCanvas.tsx`) has a structural processing pipeline that creates nodes and edges for linked lists and binary trees. The pipeline fires when a stack local variable has `structuralLinks` or `advancedData` with type `LINKED_LIST` or `BINARY_TREE`. However, the Go backend never populates these fields on stack locals — it uses its own `-stack-list-locals` + `-data-evaluate-expression` approach instead of the Python `viz-snapshot` command that sets `structuralLinks`.

Meanwhile, the backend's `adv-dump` command (called in `dereferencePointer`) DOES produce complete structural registries (all nodes, all links) but stores them in `HeapObject.AdvancedData`, not on stack locals. Separate from this, `chaseNodePointers` tries to recursively discover child heap nodes via `next`/`prev`/`left`/`right` fields, but `parseFieldsFromEval` — which supplies the field data — is a stub that only extracts raw `value` strings without `name` or `type`, making pointer field detection impossible.

The result is a three-layer disconnect:
1. `parseFieldsFromEval` omits field names/types → `chaseNodePointers` finds no children
2. Stack locals have no `structuralLinks` → frontend structural Pass 1+2 never runs
3. The heap edge loop's `structuralFieldNames` filter (added in `structural-link-authority`) blocks `next`/`prev`/`left`/`right` edges, assuming structural processing handled them

## Goals / Non-Goals

**Goals:**
- Fix `parseFieldsFromEval` to extract field `name`, `type`, and `value` from GDB MI `-data-evaluate-expression` output
- Enable `chaseNodePointers` to discover child nodes by matching field names (`next`, `prev`, `left`, `right`, `parent`)
- Add a frontend fallback that reads `AdvancedData` from heap objects for structural processing when stack locals lack `structuralLinks`
- Replace the unconditional `structuralFieldNames` filter with a conditional guard that only skips edges if structural processing actually handled that node
- All structural nodes and edges render correctly for linked lists and binary trees

**Non-Goals:**
- Not changing how the Go backend produces local variable JSON (no new Go-side `structuralLinks` population)
- Not changing how `adv-dump` works (it already produces correct data)
- Not changing MemoryNode.tsx or Dagre layout

## Decisions

### Decision 1: Fix `parseFieldsFromEval` to extract name/type/value

**Why:** The current implementation only extracts `value`, making `chaseNodePointers` blind to pointer fields. GDB MI output for `-data-evaluate-expression` produces structured results like:

```
^done,value="{data = 42, next = 0x5555555662c0}"
```

The MI parser already handles the surrounding format. The field value itself is a brace-delimited struct literal. We need to split on `, ` (comma-space) and parse each `name = value` pair.

**Alternatives considered:**
- Replace with a GDB Python command that emits structured JSON per field — more robust but introduces another GDB round-trip per heap object, doubling latency
- Use `-var-list-children` / `-var-create` — GDB variable objects are designed for this but add significant complexity with lifecycle management

**Chosen approach:** Fix the existing Go-side parser. Simple regex-based parsing of the brace-delimited struct output. ~20 lines.

### Decision 2: Frontend reads heap `AdvancedData` as a fallback path

**Why:** Even with `chaseNodePointers` fixed, we want a defense-in-depth layer. The `adv-dump` output (stored in `HeapObject.AdvancedData`) already contains a complete structural registry — `{type, root, nodes}` with every node's value fields and link pointers. By reading this on the frontend, we guarantee structural edges render even if `chaseNodePointers` has edge cases (e.g., circular reference depth limit, malformed fields).

**How:** In the heap loop (`(snapshot.heap || []).forEach`), after processing the normal node, check `obj.advancedData` for structural link data. If present, run the same Pass 1 + Pass 2 logic as the stack structural processing, using `structuralNodeIds` for dedup with the stack path.

**Alternatives considered:**
- Call `viz-snapshot` from the Go backend — would populate `structuralLinks` on stack locals, but requires re-plumbing the snapshot pipeline and risks breaking existing behavior
- Fix only `parseFieldsFromEval` and rely on heap field edges — simpler but leaves no safety net if the parser misses edge cases

### Decision 3: Conditional structural field filter

**Why:** The current unconditional `structuralFieldNames` filter (`Set(['next', 'prev', 'left', 'right'])`) blocks ALL structural field edges in the heap loop. This was correct in `structural-link-authority`'s assumption that stack structural processing handles all structural edges. But since stack processing often doesn't fire, we need the heap loop to create structural edges as a fallback — while still preventing duplicates when both paths fire.

**How:** Change the filter from:
```
if (structuralFieldNames.has(field.name)) return;
```
to:
```
if (structuralFieldNames.has(field.name) && structuralNodeIds.has(nodeId)) return;
```

This way, structural field edges are only skipped when the node was actually created by structural processing (meaning the edge was already handled). If structural processing didn't fire, the heap loop creates the edge normally.

## Risks / Trade-offs

- **[Risk]** The fixed `parseFieldsFromEval` could miss edge-case GDB MI formats → **Mitigation**: Layer 2 (`AdvancedData` fallback) and Layer 3 (conditional filter) act as safety nets. If the parser fails, data still renders.
- **[Risk]** `AdvancedData` on heap objects might not be present for all struct types → **Mitigation**: It's present for all LINKED_LIST and BINARY_TREE types because `adv-dump` classifies `classify_variable` the same way the frontend does. If `adv-dump` fails, the heap field edge loop (Layer 3) still catches structural fields.
- **[Risk]** The conditional filter could cause double edges when both stack structural processing AND heap field loop fire for overlapping data → **Mitigation**: `structuralNodeIds` is the single source of truth. Once a node ID is in the set, the heap field loop skips structural edges. Since node IDs are deterministic (`heap-<addr>`), there's no race condition.
- **[Trade-off]** Frontend does more work per heap object (checking `AdvancedData`) → Acceptable given that heap sizes are bounded by GDB traversal depth (max 10 in `chaseNodePointers`).
