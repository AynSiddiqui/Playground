## 1. Simplify Handle ID Attributes

- [ ] 1.1 In `MemoryNode.tsx`, update source handle `id` for variable nodes to `v.name`
- [ ] 1.2 In `MemoryNode.tsx`, update source handle `id` for struct fields nodes to `v.name`

## 2. Align Edge Source Handles

- [ ] 2.1 In `MemoryCanvas.tsx`, update stack-to-heap variable edge `sourceHandle` to `local.name`
- [ ] 2.2 In `MemoryCanvas.tsx`, update stack-to-heap field edge `sourceHandle` to `field.name`
- [ ] 2.3 In `MemoryCanvas.tsx`, update stack structural links edge `sourceHandle` to `linkKey`
- [ ] 2.4 In `MemoryCanvas.tsx`, update heap structural links edge `sourceHandle` to `linkKey`
- [ ] 2.5 In `MemoryCanvas.tsx`, update heap field edge `sourceHandle` to `field.name`
