<!-- HEADER:START -->

![Header](../.frames-static/09-header.svg)

<!-- HEADER:END -->

# Mermaid Diagram Examples

> **Visual Diagrams & Flowcharts**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../README.md)
[![Documentation](https://img.shields.io/badge/📚-Documentation-blue?style=flat-square)](./README.md)
[![User Guide](https://img.shields.io/badge/Type-User_Guide-purple?style=flat-square)](#)

<details>
<summary><strong>📍 Quick Navigation</strong></summary>

**Related Guides:**

- [Mermaid Diagram Generator](#mermaid-diagram-generator)
- [Documentation Index](#documentation-index)
- [Contributing](#contributing)

</details>

---

# Mermaid Diagram Generator - Advanced Examples

This document provides comprehensive examples and guidance for creating complex Mermaid diagrams using the enhanced diagram generator.

## Table of Contents

- [Overview](#overview)
- [Diagram Types](#diagram-types)
- [Advanced Features](#advanced-features)
- [Complex Examples](#complex-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Mermaid Diagram Generator has been significantly enhanced to support:

1. **Intelligent Description Parsing**: All diagram types now extract structure from your description
2. **6 New Diagram Types**: ER diagrams, user journeys, quadrant charts, git graphs, mindmaps, and timelines
3. **Advanced Customization**: Direction control, themes, custom styles, and type-specific features
4. **Smart Fallbacks**: Sensible defaults when descriptions are ambiguous

## Diagram Types

### Flowchart Diagrams

**Enhanced with:**

- Automatic step extraction from sentences
- Risk node injection for security keywords
- Direction control (TD, LR, BT, RL)
- Decision node detection

**Example:**

```json
{
  "description": "Receive user input and validate format. Check authentication credentials. If invalid, reject request. Process business logic. Generate response and return to user.",
  "diagramType": "flowchart",
  "direction": "LR",
  "theme": "dark"
}
```

### Sequence Diagrams

**Enhanced with:**

- Automatic participant extraction
- Interaction pattern detection
- Autonumber support

**Example:**

```json
{
  "description": "User sends login request to API. API queries Database for credentials. Database returns user record to API. API sends validation to AuthService. AuthService responds with token. API responds with success to User.",
  "diagramType": "sequence",
  "advancedFeatures": { "autonumber": true },
  "theme": "forest"
}
```

### Class Diagrams

**Enhanced with:**

- Class name extraction from capitalized words
- Property and method detection
- Relationship extraction (has, uses, contains)

**Example:**

```json
{
  "description": "User has personal information including id, email, and name. Account contains User details. Transaction uses Account for payments. Product can be purchased via Transaction. User can have multiple Orders.",
  "diagramType": "class"
}
```

### State Diagrams

**Enhanced with:**

- State extraction from keywords (idle, active, processing, etc.)
- Transition detection
- Trigger identification

**Example:**

```json
{
  "description": "System starts in idle state. From idle to processing when user starts task. Processing to complete when task finishes successfully. From processing to error if validation fails. Error to idle when user retries.",
  "diagramType": "state",
  "theme": "neutral"
}
```

### Gantt Charts

**Enhanced with:**

- Task extraction from sentences
- Section/phase detection
- Dynamic date generation
- Status indicators (done, active)

**Example:**

```json
{
  "description": "Project: Q1 Feature Development. Planning Phase: Research user requirements. Analyze competitor solutions. Design Phase: Create wireframes. Build prototypes. Development Phase: Implement backend API. Create frontend components. Testing Phase: Unit testing. Integration testing. User acceptance testing.",
  "diagramType": "gantt"
}
```

### Pie Charts

**Enhanced with:**

- Percentage extraction
- Count-to-percentage conversion
- Title detection

**Example:**

```json
{
  "description": "Distribution of: Customer feedback. Very satisfied: 45%. Satisfied: 30%. Neutral: 15%. Unsatisfied: 10%.",
  "diagramType": "pie",
  "theme": "default"
}
```

### Entity-Relationship Diagrams (NEW)

**Features:**

- Entity extraction from capitalized words
- Relationship cardinality detection
- Attribute inference

**Example:**

```json
{
  "description": "Customer places Order. Order contains multiple LineItems. Product is referenced in LineItem. Each Order belongs to one Customer. Product can appear in many LineItems.",
  "diagramType": "er"
}
```

### User Journey Maps (NEW)

**Features:**

- Journey title extraction
- Section/phase detection
- Satisfaction scoring
- Actor identification

**Example:**

```json
{
  "description": "E-commerce Shopping Journey. Discovery Phase: User searches for product. User browses categories. User reads product reviews. Selection Phase: User compares options. User adds item to cart. Purchase Phase: User enters shipping details. User completes payment. User receives confirmation.",
  "diagramType": "journey"
}
```

### Quadrant Charts (NEW)

**Features:**

- Axis labeling
- Quadrant naming
- Item positioning
- Priority matrix visualization

**Example:**

```json
{
  "description": "Feature Priority Matrix. Critical bug fixes must be done immediately. New authentication system is high priority. UI polish is low priority but important. Legacy migration can wait. Performance optimization is critical.",
  "diagramType": "quadrant"
}
```

### Git Graphs (NEW)

**Features:**

- Commit message extraction
- Branch visualization
- Merge representation

**Example:**

```json
{
  "description": "Initial project setup. Add authentication module. Implement user profile feature. Fix security vulnerability. Merge feature branch. Create release candidate. Deploy to production.",
  "diagramType": "git-graph"
}
```

### Mindmaps (NEW)

**Features:**

- Root concept identification
- Topic hierarchy
- Branch organization

**Example:**

```json
{
  "description": "Software Architecture. Frontend layer with React components. State management with Redux. Backend services include Authentication API. Data processing service. Payment gateway integration. Database layer uses PostgreSQL. Cache layer with Redis.",
  "diagramType": "mindmap"
}
```

### Timelines (NEW)

**Features:**

- Event extraction
- Date organization
- Section grouping

**Example:**

```json
{
  "description": "Product Roadmap 2024. Q1: Launch beta version. Gather user feedback. Q2: Implement enterprise features. Expand to European market. Q3: Mobile app release. Integration partnerships. Q4: AI-powered recommendations. Year-end review and planning.",
  "diagramType": "timeline"
}
```

## Advanced Features

### Theme Customization

Supported themes: `default`, `dark`, `forest`, `neutral`

```json
{
  "description": "...",
  "diagramType": "flowchart",
  "theme": "dark"
}
```

### Direction Control (Flowcharts)

- `TD` or `TB`: Top to bottom (default)
- `BT`: Bottom to top
- `LR`: Left to right
- `RL`: Right to left

```json
{
  "description": "...",
  "diagramType": "flowchart",
  "direction": "LR"
}
```

### Accessibility

Add screen reader support with accessibility metadata:

```json
{
  "description": "...",
  "diagramType": "sequence",
  "accTitle": "User Authentication Flow",
  "accDescr": "Diagram showing the complete authentication process from user login to token generation"
}
```

### Advanced Features Object

Type-specific features:

```json
{
  "description": "...",
  "diagramType": "sequence",
  "advancedFeatures": {
    "autonumber": true
  }
}
```

## Complex Examples

### Microservices Architecture

```json
{
  "description": "User sends HTTP request to API Gateway. API Gateway routes to AuthService for token validation. AuthService queries UserDatabase. AuthService returns validated token. API Gateway forwards request to OrderService. OrderService queries OrderDatabase. OrderService publishes event to MessageQueue. PaymentService consumes event from MessageQueue. PaymentService processes payment. PaymentService responds to OrderService. OrderService returns response to API Gateway. API Gateway sends response to User.",
  "diagramType": "sequence",
  "advancedFeatures": { "autonumber": true },
  "theme": "forest",
  "accTitle": "Microservices Order Processing",
  "accDescr": "Complete flow of an order through microservices architecture"
}
```

### Database Schema

```json
{
  "description": "User entity has unique identifier. User contains profile information. Organization has multiple Users. Project belongs to Organization. Task is part of Project. User can be assigned to Task. Comment references Task. Attachment belongs to Comment. User creates Comment.",
  "diagramType": "er",
  "theme": "neutral"
}
```

### Sprint Planning

```json
{
  "description": "Project: Sprint 23 Execution. Planning Phase: Backlog refinement and story pointing. Sprint planning meeting. Development Phase: Implement user authentication. Build dashboard UI. Create REST API endpoints. Integrate payment gateway. Testing Phase: Unit test coverage. Integration testing. QA validation. Review Phase: Code review sessions. Sprint retrospective. Demo to stakeholders.",
  "diagramType": "gantt"
}
```

## Best Practices

### 1. Be Specific and Detailed

❌ Poor: "User logs in"
✅ Good: "User sends credentials to AuthService. AuthService validates against Database. Database returns user record. AuthService generates JWT token. AuthService responds to User with token."

### 2. Use Keywords for Better Parsing

- **Sequence diagrams**: "sends", "queries", "returns", "responds"
- **Class diagrams**: "has", "contains", "uses", "belongs to"
- **State diagrams**: "idle", "active", "processing", "complete", "error"
- **ER diagrams**: "has", "contains", "belongs to", "references"

### 3. Structure Descriptions with Sections

For Gantt charts and journeys:

```
"Project: Name. Phase 1: tasks. Phase 2: tasks."
"Journey Title. Section 1: steps. Section 2: steps."
```

### 4. Leverage Advanced Features

- Always use `theme` for consistent styling
- Add `accTitle` and `accDescr` for accessibility
- Use `direction` for flowcharts to improve readability
- Enable `autonumber` for sequence diagrams with many interactions

### 5. Handle Edge Cases

The generator includes smart fallbacks:

- If parsing fails, it generates sensible default diagrams
- Empty descriptions trigger template diagrams
- Unknown keywords are handled gracefully

## Troubleshooting

### Issue: Diagram doesn't reflect my description

**Solution**: Be more explicit with keywords:

- Use "sends to" instead of just "sends"
- Capitalize entity names for class/ER diagrams
- Use state keywords (idle, active, processing) for state diagrams

### Issue: Too many/too few elements

**Solution**: The parser has limits:

- Flowcharts: max 12 steps
- Sequence: detects common participants (user, system, database, api, etc.)
- Classes: extracts capitalized words > 2 characters

### Issue: Relationships not detected

**Solution**: Use explicit relationship keywords:

- "User **has** Account" (ownership)
- "Order **contains** Items" (composition)
- "Service **uses** Database" (dependency)
- "Task **belongs to** Project" (membership)

### Issue: Validation errors

**Solution**:

- Set `strict: false` for development/testing
- Set `repair: true` to auto-fix common issues
- Check the feedback section in the output for specific guidance

## Migration from Legacy

If you were using the old generator:

### Old Way (Static Templates)

```json
{
  "description": "Any text here (ignored)",
  "diagramType": "sequence"
}
// Always generated the same User->System->Database template
```

### New Way (Intelligent Parsing)

```json
{
  "description": "Client requests data from Server. Server queries Cache. Cache returns result to Server. Server responds to Client.",
  "diagramType": "sequence"
}
// Generates diagram with Client, Server, and Cache participants
```

### Legacy Type Mappings

The generator automatically converts legacy type names:

- `erDiagram` → `er`
- `graph` → `flowchart`
- `userJourney` → `journey`
- `gitGraph` → `git-graph`

## See Also

- [Mermaid Official Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/)
- [MCP Server README](../README.md)

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

## <!-- Back to Top -->

<details>
<summary><strong>📚 Related Documentation</strong></summary>

- [Export Formats](./EXPORT_FORMATS.md)
- [Sprint Planning Reliability](./SPRINT_PLANNING_RELIABILITY.md)
- [Tools Reference](./TOOLS_REFERENCE.md)

</details>

<!-- FOOTER:START -->

![Footer](../.frames-static/09-footer.svg)

<!-- FOOTER:END -->
