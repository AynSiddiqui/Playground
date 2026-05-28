## ADDED Requirements

### Requirement: Row-Aligned Source Handles
The visualizer canvas SHALL center all source handles vertically on the right edge of their corresponding variable or field rows. The handle vertical offset MUST adapt dynamically to any variation in row height caused by font changes, line wrapping, or padding adjustments, without using hardcoded pixel math.

#### Scenario: Aligning handles to dynamic height rows
- **WHEN** a memory node containing multiple pointer fields is rendered
- **THEN** every source connection handle on the right edge aligns exactly with the vertical center of its corresponding row
- **AND** the handle positions remain centered even if row heights vary
