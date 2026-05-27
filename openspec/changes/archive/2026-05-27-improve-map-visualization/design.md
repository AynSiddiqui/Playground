## Context
When `std::map` variables are parsed:
- GDB Python `adv-dump` flattens them into `advancedData` under the type `STL_CONTAINER` containing `elements` with `key` and `value` fields.
- The React frontend doesn't render `STL_CONTAINER` elements if `advancedData` exists, leaving map visualizer nodes empty.
- Stack variable nodes display GDB's raw nested brace-enclosed representations.

## Goals / Non-Goals

**Goals:**
- Format stack-allocated maps and vectors as `<type> (size=N)`.
- Render a two-column HTML table (`Key` and `Value` headers) inside the map nodes.
- Sanitize fallback outputs to strip escaped newlines and brackets.

**Non-Goals:**
- Modifying GDB's internal visualizer registration or custom commands.

## Decisions

### Decision 1: Stack Local Variable Summarization
In `MemoryCanvas.tsx`, when mapping stack locals:
If `local.type` is an STL container or array:
1. Locate the corresponding heap node (`heap-<local.address>`) or look up size in a pre-computed address-to-size map from `snapshot.heap`.
2. Read the element count `N` from `heapNode.elements` or `heapNode.advancedData.elements`.
3. Overwrite `local.value` with `std::map (size=N)` or the clean type name with the size.

### Decision 2: Structured Table Layout in MemoryNode.tsx
In `MemoryNode.tsx`, add a renderer for `advancedData.type === 'STL_CONTAINER'`:
```tsx
{advancedData && (advancedData.type === 'STL_CONTAINER') && advancedData.elements && (
  <table className="stl-map-table">
    <thead>
      <tr>
        <th>Key</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {advancedData.elements.map((el: any, idx: number) => (
        <tr key={el.key ?? idx}>
          <td className="stl-map-key">{el.key ?? `[${idx}]`}</td>
          <td className="stl-map-value">{el.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
```

### Decision 3: Fallback Sanitization in GDB Backend
Update `parseSTLOutput` in `gdb.go` to split raw value expressions into separate clean elements by removing `\n`, braces, and standard prefix words.

## Risks / Trade-offs

- **[Risk]** Key or value strings could be extremely long and overflow the visualizer nodes.
  → **Mitigation**: Apply CSS styles (such as `max-width`, `text-overflow: ellipsis`, and `overflow: hidden`) on key/value columns.
- **[Risk]** Fetching stack local sizes from the heap node could fail if the heap node has not yet been processed.
  → **Mitigation**: Build a pre-computed lookup map from `snapshot.heap` at the beginning of `buildNodesAndEdges` before iterating stack locals.
