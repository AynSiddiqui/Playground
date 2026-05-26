## ADDED Requirements

### Requirement: Editor CSS Overrides
The frontend SHALL inject explicit CSS overrides to ensure the Monaco Editor decoration classes (`.highlighted-line`, `.highlighted-glyph`) display visibly with a colored background and left margin indicator to the user.

### Requirement: Uniform Node Edge Mapping
The UI SHALL map edges between the stack frame local variables and heap nodes based strictly on matching memory addresses, rather than syntactically demanding the type string includes an asterisk.
