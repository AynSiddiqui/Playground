## Why

The current default C++ code example still includes a `struct Node` and pointers, which makes it slightly complex for users who just want to see a very basic demonstration of the visualizer. Additionally, users want to see simple primitive variables properly initialized and consistently displayed on the right-hand side memory visualizer without the noise of dynamic memory allocation.

## What Changes

- **BREAKING:** Completely remove `struct Node` and pointer logic from the `DEFAULT_CODE` in `CodeEditor.tsx`.
- Update the default code to be a pure, simple addition example (`int c = a + b;`) with explicit initialization to avoid any initial garbage values.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `visualizer-ui`: Update the requirement to provide an explicitly simple default demonstration code without complex data structures.

## Impact

- **Frontend:** `CodeEditor.tsx` `DEFAULT_CODE` constant will be heavily simplified.
