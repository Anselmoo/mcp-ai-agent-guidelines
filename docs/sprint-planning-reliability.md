<!-- AUTO-GENERATED HEADER - DO NOT EDIT -->

<div align="center">

<!-- Category Header Animation -->
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=8BE9FD,50FA7B,FFB86C,BD93F9&height=3&section=header&animation=twinkling" />

<!-- Title and Badge -->
<h1>🛠️ MCP AI Agent Guidelines</h1>
<p>
  <img src="https://img.shields.io/badge/Category-Specialized_Tools-8BE9FD?style=for-the-badge" alt="Specialized Tools Badge"/>
</p>

<!-- Quick Navigation -->
<p>
  <a href="./visualization-guide.md">📊 Visualization</a> •
  <a href="./export-formats.md">💾 Export Formats</a> •
  <a href="./maintaining-models.md">🔧 Model Maintenance</a> •
  <a href="./sprint-planning.md">⚡ Sprint Planning</a>
</p>

<hr/>

</div>

<!-- END AUTO-GENERATED HEADER -->


# Sprint Planning Reliability Improvements

## Overview

The sprint timeline calculator has been enhanced with reliability improvements to ensure deterministic, dependency-aware planning. These changes implement foundations for future optimization approaches inspired by linear programming methods.

<!-- Note: Issue reference removed - link was broken -->

## Key Improvements

### 1. Dependency-Aware Task Ordering

**Problem**: Tasks with dependencies could be scheduled in the wrong order, violating dependency constraints.

**Solution**: Implemented **Kahn's Algorithm** for topological sorting to ensure tasks are ordered such that dependencies always come before dependent tasks.

**Benefits**:

- Tasks are automatically ordered respecting all dependency relationships
- Circular dependencies are detected and handled gracefully
- Multi-level dependencies (A→B→C) work correctly

### 2. Deterministic Scheduling

**Problem**: The previous algorithm used a cycling approach that could produce different results for the same input.

**Solution**: Replaced with **First Fit** bin-packing algorithm that produces consistent, reproducible results.

**Benefits**:

- Same input always produces same output (reproducible)
- More predictable sprint allocation
- Better capacity utilization

### 3. Dependency Validation

**Problem**: No validation that scheduled tasks had their dependencies met.

**Solution**: Added comprehensive dependency validation with detailed error reporting.

**Benefits**:

- Missing dependencies are detected and reported as High risk
- Dependency violations are clearly described
- Users can fix dependency issues before finalizing plans

### 4. Future-Ready Optimization

**Problem**: No path to incorporate advanced optimization techniques like Linear Programming.

**Solution**: Added `optimizationStrategy` parameter with support for:

- `"greedy"` (default): Current deterministic bin-packing algorithm
- `"linear-programming"`: Reserved for future MILP optimization (e.g., Gurobi/Julia integration)

**Benefits**:

- Graceful upgrade path to advanced optimization
- No breaking changes to existing code
- Documentation includes reference to optimization approaches

## Usage Examples

### Basic Usage with Dependencies

```javascript
const result = await sprintTimelineCalculator({
  tasks: [
    {
      name: "Design API",
      estimate: 5,
      priority: "high",
    },
    {
      name: "Implement Backend",
      estimate: 8,
      priority: "high",
      dependencies: ["Design API"], // Must complete Design API first
    },
    {
      name: "Build Frontend",
      estimate: 8,
      priority: "medium",
      dependencies: ["Implement Backend"],
    },
    {
      name: "Testing",
      estimate: 5,
      priority: "medium",
      dependencies: ["Build Frontend"],
    },
  ],
  teamSize: 4,
  sprintLength: 14,
});
```

The tool will automatically:

1. Order tasks: Design API → Implement Backend → Build Frontend → Testing
2. Allocate them to sprints respecting dependencies
3. Validate all dependencies are met
4. Report any violations as risks

### Specifying Optimization Strategy

```javascript
const result = await sprintTimelineCalculator({
  tasks: [...],
  teamSize: 3,
  sprintLength: 14,
  optimizationStrategy: "greedy", // or "linear-programming" in future
});
```

### Handling Complex Dependencies

```javascript
const result = await sprintTimelineCalculator({
  tasks: [
    { name: "Infrastructure", estimate: 8 },
    {
      name: "API Development",
      estimate: 13,
      dependencies: ["Infrastructure"],
    },
    {
      name: "Database Schema",
      estimate: 5,
      dependencies: ["Infrastructure"],
    },
    {
      name: "Integration Tests",
      estimate: 5,
      dependencies: ["API Development", "Database Schema"], // Multiple dependencies
    },
  ],
  teamSize: 5,
  sprintLength: 14,
});
```

## Algorithm Details

### Topological Sort (Kahn's Algorithm)

1. **Build dependency graph**: Create adjacency list and calculate in-degrees
2. **Find starting nodes**: All tasks with no dependencies (in-degree = 0)
3. **Process queue**:
   - Remove node from queue
   - Add to sorted list
   - Decrease in-degree of dependent tasks
   - Add tasks with in-degree = 0 to queue
4. **Detect cycles**: If sorted list length < total tasks, circular dependency exists

### First Fit Bin-Packing

1. **Input**: Topologically sorted tasks
2. **For each task**:
   - Find first sprint with available capacity
   - Validate all dependencies are in earlier or same sprint
   - Place task if dependencies are met
   - Otherwise, try next sprint
3. **Fallback**: If no valid sprint found, place in first sprint

### Dependency Validation

After scheduling:

1. For each task in each sprint
2. Check all dependencies are in current or earlier sprints
3. Report violations with task and dependency names
4. Classify as High risk if violations found

## Risk Assessment

The tool now provides enhanced risk assessment:

- **High Risk**:

  - Dependency violations detected (with details)
  - Over 90% capacity utilization
  - Large scope (>10 sprints worth of work)

- **Medium Risk**:

  - Dependencies correctly scheduled (warning about potential delays)
  - Small team size (<3 members)

- **Low Risk**:
  - No issues detected
  - Timeline appears achievable

## References

The improvements are inspired by modern sprint planning optimization approaches:

- **Optimizing Sprint Planning with Julia**: [Linear Programming Approach with Gurobi](https://medium.com/@karim.ouldaklouche/optimizing-sprint-planning-with-julia-a-linear-programming-approach-with-gurobi-03f28c0cf5bf)
- **ZenHub**: [AI-assisted sprint planning tools (2025)](https://www.zenhub.com/blog-posts/the-7-best-ai-assisted-sprint-planning-tools-for-agile-teams-in-2025)
- **Nitor Infotech**: [AI in software project delivery](https://www.nitorinfotech.com/blog/ai-in-software-project-delivery-smarter-planning-and-execution/)

## Future Enhancements

While the current implementation provides reliable, deterministic planning, future enhancements could include:

1. **Linear Programming Optimization**:

   - Integration with Gurobi/GLPK for optimal sprint count minimization
   - Fill rate optimization to balance sprint utilization
   - Multi-objective optimization (cost, time, resources)

2. **Advanced Constraints**:

   - Team member skill matching
   - Resource availability windows
   - Critical path analysis

3. **Machine Learning**:
   - Historical velocity prediction
   - Risk prediction based on past sprints
   - Effort estimation refinement

## Migration Guide

The changes are **100% backward compatible**. Existing code continues to work with improved behavior:

- **No API changes**: All existing parameters work as before
- **Better results**: Same inputs now produce more reliable, deterministic outputs
- **Enhanced output**: Additional information about dependencies and risks

To leverage new features, simply:

1. Add `dependencies` array to tasks that depend on others
2. Optionally specify `optimizationStrategy` parameter
3. Review enhanced risk assessment in output

## Testing

Comprehensive test coverage includes:

- ✅ Topological sorting with various dependency patterns
- ✅ Circular dependency detection
- ✅ Deterministic result validation (multiple runs)
- ✅ Multi-level dependency handling
- ✅ Dependency violation detection
- ✅ Complex dependency graphs with priorities
- ✅ Missing dependency reporting

All tests pass with 100% backward compatibility.


<!-- AUTO-GENERATED FOOTER - DO NOT EDIT -->

---

<div align="center">

<!-- Navigation Grid -->
<table>
  <tr>
    <td align="center" width="33%">
      <strong>📊 Visualization</strong><br/>
      <a href="./visualization-guide.md">Mermaid Guide</a><br/>
      <a href="./DIAGRAM_GENERATION.md">Diagram Tools</a><br/>
      <a href="../demos/demo-code-analysis.diagram.md">Examples</a>
    </td>
    <td align="center" width="33%">
      <strong>⚡ Planning</strong><br/>
      <a href="./sprint-planning.md">Sprint Timelines</a><br/>
      <a href="./gap-analysis-guide.md">Gap Analysis</a><br/>
      <a href="./AGILE_WORKFLOW_OPTIMIZATION.md">Agile Optimization</a>
    </td>
    <td align="center" width="33%">
      <strong>🔧 Maintenance</strong><br/>
      <a href="./maintaining-models.md">Model Updates</a><br/>
      <a href="./export-formats.md">Export Formats</a><br/>
      <a href="./TECHNICAL_IMPROVEMENTS.md">Improvements</a>
    </td>
  </tr>
</table>

<!-- Back to Top -->
<p>
  <a href="#top">⬆️ Back to Top</a>
</p>

<!-- Animated Waving Footer -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=8BE9FD,50FA7B,FFB86C,BD93F9,FF79C6&height=80&section=footer&animation=twinkling" />

<!-- Metadata Footer -->
<sub>
  <strong>MCP AI Agent Guidelines</strong> • Made with ❤️ by <a href="https://github.com/Anselmoo">@Anselmoo</a> and contributors<br/>
  Licensed under <a href="../LICENSE">MIT</a> • <a href="../DISCLAIMER.md">Disclaimer</a> • <a href="../CONTRIBUTING.md">Contributing</a>
</sub>

</div>

<!-- END AUTO-GENERATED FOOTER -->
