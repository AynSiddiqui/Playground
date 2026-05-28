## ADDED Requirements

### Requirement: Configurable Edge Styles
The memory visualizer canvas SHALL provide a user interface element allowing developers to toggle between Grid, Straight, and Curved edge connection styles. The selected configuration MUST be persisted locally in the browser storage and automatically applied to all pointer and reference lines on canvas reload or snapshot changes.

#### Scenario: Toggling line style to Curved
- **WHEN** the user selects the Curved option in the line style control panel
- **THEN** all stack-to-heap and heap-to-heap connection lines are rendered as Bezier curves
- **AND** the preference is saved in localStorage

#### Scenario: Persisting line style preference
- **WHEN** the page is reloaded
- **THEN** the memory canvas retrieves the saved edge styling preference from localStorage
- **AND** initializes the visualizer canvas with the saved edge style
