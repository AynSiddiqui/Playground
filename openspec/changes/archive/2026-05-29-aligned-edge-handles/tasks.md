## 1. CSS Row Anchor setup

- [x] 1.1 Add `position: relative` style to the `.memory-node__row` class or inline wrapper in `MemoryNode.tsx`

## 2. Refactoring Node Handle Placement

- [x] 2.1 Nest variable row connection handles inside their respective row container element
- [x] 2.2 Nest struct field row connection handles inside their respective row container element
- [x] 2.3 Remove hardcoded pixel coordinate calculations (`50 + i * 32`) from handle styles
- [x] 2.4 Apply `top: '50%'` and `transform: 'translateY(-50%)'` vertical centering CSS properties to all row-nested handles
