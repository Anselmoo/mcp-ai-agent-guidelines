# Prompting Hierarchy

> **Understanding Prompt Levels & Evaluation**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../README.md)
[![Documentation](https://img.shields.io/badge/📚-Documentation-blue?style=flat-square)](./README.md)
[![User Guide](https://img.shields.io/badge/Type-User_Guide-purple?style=flat-square)](#)

<details>
<summary><strong>📍 Quick Navigation</strong></summary>

**Related Guides:**

- [AI Interaction Tips](./AI_INTERACTION_TIPS.md)
- [Hierarchical Prompt Builder](./tools/hierarchical-prompt-builder.md)
- [Hierarchy Level Selector](./tools/hierarchy-level-selector.md)

</details>

---

# Prompting Hierarchy and Numeric Evaluation

This document describes the new prompting hierarchy and numeric evaluation features added to the MCP AI Agent Guidelines server.

## Overview

The system implements a structured framework for:

1. **Hierarchical Prompting Levels** - Different levels of guidance and support for AI agents
2. **Numeric Evaluation** - Quantitative metrics for assessing prompt quality
3. **Reinforcement Learning-Inspired Scoring** - Predictive effectiveness metrics

## Hierarchy Levels

The framework defines six levels of prompting support, from least to most specific:

| Level             | Description                      | Cognitive Load | Best For                                |
| ----------------- | -------------------------------- | -------------- | --------------------------------------- |
| **Independent**   | Minimal guidance; high autonomy  | High           | Expert agents, exploratory tasks        |
| **Indirect**      | Subtle hints and cues            | Medium         | Learning scenarios, skill development   |
| **Direct**        | Clear instructions without steps | Medium         | Standard tasks, experienced agents      |
| **Modeling**      | Examples and demonstrations      | Low            | New patterns, ensuring consistency      |
| **Scaffolding**   | Step-by-step structured guidance | Low            | Complex tasks, less experienced agents  |
| **Full Physical** | Complete detailed specification  | Low            | High-risk operations, exact replication |

## Evaluation Metrics

The numeric evaluation system provides scores across multiple dimensions:

- **Overall Score (0-100)**: Composite quality metric
- **Clarity Score**: Sentence structure and language clarity
- **Specificity Score**: Concrete action verbs and detailed requirements
- **Completeness Score**: Coverage of context, goals, and constraints
- **Structure Score**: Organization with headings, bullets, numbering
- **Hierarchy Score**: Match between prompt and intended support level
- **Cognitive Complexity**: Task difficulty and technical depth (0-100)
- **Predicted Effectiveness**: RL-style reward signal for success probability (0-100)

## Available Tools

### 1. prompting-hierarchy-evaluator

Evaluates prompts and provides numeric scoring with recommendations.

**Input:**

```typescript
{
  promptText: string;           // The prompt to evaluate
  targetLevel?: string;         // Optional expected hierarchy level
  context?: string;             // Additional context
  includeRecommendations?: boolean;
  includeReferences?: boolean;
}
```

**Output:**

- Numeric scores for all metrics
- Detected hierarchy level
- Component scores breakdown
- Recommendations for improvement
- Hierarchy level reference

### 2. hierarchy-level-selector

Selects the most appropriate hierarchy level based on task characteristics.

**Input:**

```typescript
{
  taskDescription: string;
  agentCapability?: "novice" | "intermediate" | "advanced" | "expert";
  taskComplexity?: "simple" | "moderate" | "complex" | "very-complex";
  autonomyPreference?: "low" | "medium" | "high";
  includeExamples?: boolean;
  includeReferences?: boolean;
}
```

**Output:**

- Recommended hierarchy level
- Scoring for all levels
- Usage guidance
- Example prompts
- Alternative considerations

## Usage Examples

### Example 1: Evaluate a Prompt

```typescript
const evaluation = await promptingHierarchyEvaluator({
  promptText:
    "Implement JWT authentication for the user login endpoint. Add input validation for email and password fields.",
  targetLevel: "direct",
  includeRecommendations: true,
});

// Returns:
// - Overall Score: 75/100
// - Hierarchy Level: Direct
// - Clarity: 82/100
// - Specificity: 73/100
// - Completeness: 68/100
// - Structure: 65/100
// - Predicted Effectiveness: 72/100
```

### Example 2: Select Appropriate Hierarchy Level

```typescript
const recommendation = await hierarchyLevelSelector({
  taskDescription:
    "Implement a comprehensive authentication system with OAuth, JWT, and session management",
  agentCapability: "intermediate",
  taskComplexity: "very-complex",
  autonomyPreference: "low",
});

// Returns:
// - Recommended Level: Scaffolding or Full Physical
// - Rationale: Complex task + intermediate agent + low autonomy preference
// - How to use this level
// - Example prompts
```

### Example 3: Complete Workflow

```typescript
// 1. Select appropriate level
const levelResult = await hierarchyLevelSelector({
  taskDescription: "Fix authentication bug in login module",
  agentCapability: "intermediate",
  taskComplexity: "moderate",
});

// 2. Build prompt at that level (Direct in this case)
const prompt = `
# Context
The login module has a bug where tokens expire incorrectly.

# Goal
Fix the token expiration logic.

# Requirements
1. Review current token generation
2. Fix expiration calculation
3. Add unit tests
4. Update documentation
`;

// 3. Evaluate the prompt
const evaluation = await promptingHierarchyEvaluator({
  promptText: prompt,
  targetLevel: levelResult.level,
  includeRecommendations: true,
});

// 4. Iterate based on scores
if (evaluation.overallScore < 70) {
  // Apply recommendations and re-evaluate
}
```

## Selection Guidelines

Choose hierarchy level based on:

1. **Agent Capability**

   - Novice → Full Physical/Scaffolding
   - Intermediate → Direct/Modeling
   - Advanced → Indirect/Direct
   - Expert → Independent/Indirect

2. **Task Complexity**

   - Simple → Independent/Direct
   - Moderate → Direct/Modeling
   - Complex → Modeling/Scaffolding
   - Very Complex → Scaffolding/Full Physical

3. **Risk Level**
   - High-risk tasks (production, security, payments) → Higher support levels
   - Standard tasks → Match to agent capability
   - Exploratory tasks → Lower support levels (more autonomy)

## Integration with Existing Tools

The hierarchy framework integrates with:

- **hierarchical-prompt-builder**: Use selected levels to structure prompts
- **guidelines-validator**: Now includes hierarchy and evaluation criteria
- **design-assistant**: Can leverage hierarchy levels for design prompts

## References

- [Hierarchical Prompting Taxonomy (HPT)](https://arxiv.org/abs/2406.12644) - arXiv paper on HPT framework
- [Master Hierarchical Prompting](https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions) - RelevanceAI guide
- [Prompting Techniques for LLMs](https://www.aiforeducation.io/ai-resources/prompting-techniques-for-specialized-llms) - AI for Education
- [Prompting Hierarchy Tiers](https://www.promptopti.com/best-3-prompting-hierarchy-tiers-for-ai-interaction/) - PromptOpti guide

## Related Guidelines Config

The `guidelines-config.ts` now includes:

- `hierarchy-level` criterion for validating hierarchy usage
- `numeric-evaluation` criterion for measuring effectiveness
- Updated best practices including hierarchy selection and numeric evaluation

## Testing

Comprehensive tests are available in:

- `tests/vitest/prompting-hierarchy-evaluation.test.ts`
  - Tests for all hierarchy levels
  - Numeric scoring validation
  - Integration tests
  - RL-style effectiveness scoring

<!-- AUTO-GENERATED FOOTER - DO NOT EDIT -->

---

<div align="center">

<!-- Navigation Grid -->
<table>
  <tr>
    <td align="center" width="33%">
      <strong>📚 User Guides</strong><br/>
      <a href="./AI_INTERACTION_TIPS.md">AI Interaction Tips</a><br/>
      <a href="./PROMPTING_HIERARCHY.md">Prompting Hierarchy</a><br/>
      <a href="./AGENT_RELATIVE_CALLS.md">Agent Patterns</a><br/>
      <a href="./FLOW_PROMPTING_EXAMPLES.md">Flow Prompting</a>
    </td>
    <td align="center" width="33%">
      <strong>🛠️ Developer Docs</strong><br/>
      <a href="./CLEAN_CODE_INITIATIVE.md">Clean Code</a><br/>
      <a href="./ERROR_HANDLING.md">Error Handling</a><br/>
      <a href="./TECHNICAL_IMPROVEMENTS.md">Tech Improvements</a>
    </td>
    <td align="center" width="33%">
      <strong>📖 Reference</strong><br/>
      <a href="./REFERENCES.md">References</a><br/>
      <a href="./BRIDGE_CONNECTORS.md">Architecture</a><br/>
      <a href="../demos/README.md">Demos</a>
    </td>
  </tr>
</table>

<details>
<summary><strong>📚 Related Documentation</strong></summary>

<br>

**User Guides:**

- [AI Interaction Tips](./AI_INTERACTION_TIPS.md) - Targeted tool-oriented questions
- [Agent-Relative Patterns](./AGENT_RELATIVE_CALLS.md) - Tool orchestration workflows
- [Flow-Based Prompting](./FLOW_PROMPTING_EXAMPLES.md) - Multi-step workflows

**Tool References:**

- [Complete Tools Reference](./TOOLS_REFERENCE.md) - All 27 tools documented
- [Hierarchy Level Selector](./tools/hierarchy-level-selector.md) - Optimal level selection
- [Prompting Hierarchy Evaluator](./tools/prompting-hierarchy-evaluator.md) - Numeric scoring

</details>

<div align="center">

<p>
  <a href="#top">⬆️ Back to Top</a>
</p>

<sub>
  <strong>MCP AI Agent Guidelines</strong> • Made with ❤️ by <a href="https://github.com/Anselmoo">@Anselmoo</a> and contributors<br/>
  Licensed under <a href="../LICENSE">MIT</a> • <a href="../DISCLAIMER.md">Disclaimer</a> • <a href="../CONTRIBUTING.md">Contributing</a>
</sub>

</div>

<!-- Metadata Footer -->
<sub>
  <strong>MCP AI Agent Guidelines</strong> • Made with ❤️ by <a href="https://github.com/Anselmoo">@Anselmoo</a> and contributors<br/>
  Licensed under <a href="../LICENSE">MIT</a> • <a href="../DISCLAIMER.md">Disclaimer</a> • <a href="../CONTRIBUTING.md">Contributing</a>
</sub>

</div>

<!-- END AUTO-GENERATED FOOTER -->
