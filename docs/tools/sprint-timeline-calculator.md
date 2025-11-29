<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Sprint Timeline Calculator

> **Strategy & Planning Tool** • **Complexity: Simple**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Strategy & Planning](https://img.shields.io/badge/Category-Strategy_&_Planning-blue?style=flat-square)](./README.md#strategy-planning)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

---

# sprint-timeline-calculator

> **Sprint timelines and development cycles**

**Complexity**: ⭐ Simple | **Category**: Strategy & Planning | **Time to Learn**: 5-10 minutes

---

## Overview

The `sprint-timeline-calculator` dependency-aware scheduling, optimal cycles.

### Key Capabilities

- Dependency-aware task scheduling
- Velocity-based planning
- Sprint capacity calculation
- Optimization strategies (greedy, linear programming)

---

## When to Use

✅ **Good for:**

- Strategic planning sessions
- Gap analysis between current and desired states
- Sprint and resource planning
- Multi-framework business analysis

❌ **Not ideal for:**

- Quick operational decisions
- Real-time project tracking
- Budget calculations

---

## Basic Usage

### Example 1: Basic Strategy & Planning Task

```json
{
  "tool": "sprint-timeline-calculator",
  "tasks": "your-tasks-here",
  "teamSize": "your-team-size-here",
  "sprintLength": 10,
  "velocity": 10,
  "optimizationStrategy": "your-optimization-strategy"
}
```

**Output**: Structured strategy & planning output with:

- Dependency-aware task scheduling
- Velocity-based planning
- Sprint capacity calculation

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tasks` | string | ✅ Yes | - | Array of task objects with estimates and dependencies |
| `teamSize` | number | ✅ Yes | - | Number of team members available |
| `sprintLength` | number | No | - | Sprint duration in days (default: 14) |
| `velocity` | number | No | - | Team velocity in story points per sprint |
| `optimizationStrategy` | enum | No | - | Scheduling optimization: `greedy` or `linear-programming` |

---

## What You Get

The tool returns a structured strategy & planning output with:

1. **Dependency-aware** - Dependency-aware task scheduling
2. **Velocity-based** - Velocity-based planning
3. **Sprint** - Sprint capacity calculation
4. **Optimization** - Optimization strategies (greedy, linear programming)

### Output Structure

```markdown
## Sprint Timeline Calculator Output

### Summary
[High-level summary of analysis/output]

### Details
[Detailed content based on your inputs]

### Recommendations
[Actionable next steps]

### References (if enabled)
[Links to external resources]
```

---

## Real-World Examples

### Example 1: Strategic Planning Session

```json
{
  "tool": "sprint-timeline-calculator",
  "tasks": "Example tasks value for strategic planning session",
  "teamSize": "Example teamSize value for strategic planning session",
  "sprintLength": "example-value",
  "velocity": "example-value"
}
```

**Generated Output Excerpt**:

```markdown
## Strategic Planning Session Results

### Summary
Analysis complete with actionable insights...

### Key Findings
1. [Finding 1 based on strategy & planning analysis]
2. [Finding 2 with specific recommendations]
3. [Finding 3 with priority indicators]

### Next Steps
- Implement recommended changes
- Review and validate results
- Integrate into workflow
```

---

## Tips & Tricks

### 💡 Best Practices

1. **Define Clear Objectives** - Measurable goals drive better analysis
2. **Involve Stakeholders** - List all affected parties
3. **Set Realistic Timeframes** - Be honest about constraints
4. **Use Multiple Frameworks** - Cross-validate insights

### 🚫 Common Mistakes

- ❌ Skipping context → ✅ Always provide business background
- ❌ Ignoring constraints → ✅ List real limitations upfront
- ❌ Over-planning → ✅ Focus on actionable next steps
- ❌ Static analysis → ✅ Strategy needs regular review

### ⚡ Pro Tips

- Combine SWOT with gap analysis for comprehensive views
- Use sprint calculator for realistic timelines
- Include action plans for implementation guidance

---

## Related Tools

- **[strategy-frameworks-builder](./strategy-frameworks-builder.md)** - Strategy analysis frameworks
- **[project-onboarding](./project-onboarding.md)** - Comprehensive project onboarding

---

## Workflow Integration

### With Other Tools

```mermaid
graph LR
  A[sprint-timeline-calculator] --> B[strategy-frameworks-builder]
  B --> C[project-onboarding]
  C --> D[Execute/Apply]
```

1. **sprint-timeline-calculator** - Sprint timelines and development cycles
2. **strategy-frameworks-builder** - Strategy analysis frameworks
3. **project-onboarding** - Comprehensive project onboarding
4. Execute combined output with your AI model or apply changes

---

<details>
<summary><strong>📚 Related Documentation</strong></summary>

- [All Strategy & Planning Tools](./README.md#strategy-planning)
- [Sprint Planning Reliability](../tips/SPRINT_PLANNING_RELIABILITY.md)
- [AI Interaction Tips](../tips/AI_INTERACTION_TIPS.md)

</details>

<sub>**MCP AI Agent Guidelines** • Licensed under [MIT](../../LICENSE) • [Disclaimer](../../DISCLAIMER.md) • [Contributing](../../CONTRIBUTING.md)</sub>

---

## Related Documentation

- [All Strategy & Planning Tools](./README.md#strategy-planning)
- [Sprint Planning Reliability](../tips/SPRINT_PLANNING_RELIABILITY.md)
- [AI Interaction Tips](../tips/AI_INTERACTION_TIPS.md)

---

<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
