## Context
To move beyond basic integer variables to complex linked lists and trees, the backend needs a semantic understanding of pointers, and the parser cannot afford to drop array elements on a single-line GDB response.

## Decisions

1. **Regex Parsing**: `extractQuotedValue` will be removed for list outputs. `parseLocals` will use `regexp.MustCompile(\`name="([^"]+)",type="([^"]+)",value="([^"]+)"\`)` to extract all matches sequentially from the `locals=[...]` string.
2. **Pointer Chasing (Phase 1)**: For complex variables, the backend will issue `-var-create` to evaluate the struct, and `-var-list-children` to iterate its members (e.g., `next`, `left`, `right`). We will recursive-fetch up to a max depth of 10 to prevent circular reference lockups.
3. **Advanced Payload Schema**: The `Variable` and `HeapObject` schema will be updated to include an `advancedData` field, containing `structure: 'tree_node' | 'list_node'` and pointer addresses.
4. **React Flow Edges**: The frontend will iterate through `advancedData` pointers, pushing elements to the React Flow `edges` array using `<Handle>` IDs for visually snapping curves between structs.
