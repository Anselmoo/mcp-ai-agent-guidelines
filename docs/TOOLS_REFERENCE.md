# Tools Reference

> Complete reference for all 27+ MCP tools with examples and best practices

## Overview

This MCP server provides 27+ specialized tools organized into categories: prompt building, code analysis, design workflows, strategy frameworks, and utility tools.

## Tool Categories

### 🎯 Prompt Building Tools

#### Hierarchical Prompt Builder

Creates multi-level prompts with varying degrees of specificity and guidance.

**Use Cases**:
- Complex task decomposition
- Adaptive AI guidance
- Context-aware prompt generation

**Example**:
```typescript
await hierarchicalPromptBuilder({
  context: "Code optimization",
  goal: "Improve query performance",
  requirements: ["Maintain compatibility", "Document changes"],
  provider: "gpt-4.1"
});
```

See: [Prompting Hierarchy Guide](./PROMPTING_HIERARCHY.md)

#### Prompt Flow Builder

Creates declarative prompt flows with branching, loops, and parallel execution.

**Use Cases**:
- Multi-step workflows
- Conditional logic
- Complex orchestration

See: [Flow Prompting Examples](./FLOW_PROMPTING_EXAMPLES.md)

#### Prompt Chaining Builder

Builds sequential prompt chains with output passing and error handling.

**Use Cases**:
- Pipeline workflows
- Data transformation chains
- Sequential processing

#### Security Hardening Prompt Builder

Generates security-focused prompts with OWASP and compliance checks.

**Use Cases**:
- Security audits
- Vulnerability assessment
- Compliance validation

#### Domain-Neutral Prompt Builder

Creates structured prompts for any domain with objectives, workflow, and acceptance criteria.

**Use Cases**:
- General task planning
- Requirements analysis
- Project documentation

### 📊 Analysis Tools

#### Clean Code Scorer

Calculates comprehensive 0-100 quality score across multiple dimensions.

**Scoring**:
- Code Hygiene: 25 points
- Test Coverage: 25 points
- TypeScript Quality: 20 points
- Linting: 15 points
- Documentation: 10 points
- Security: 5 points

See: [Clean Code Initiative](./CLEAN_CODE_INITIATIVE.md)

#### Code Hygiene Analyzer

Identifies outdated patterns, unused dependencies, and code smells.

**Detects**:
- Deprecated APIs
- Unused imports/variables
- Code duplication
- Anti-patterns

See: [Code Quality Improvements](./CODE_QUALITY_IMPROVEMENTS.md)

#### Semantic Code Analyzer

Performs deep semantic analysis of code structure and patterns.

**Analysis Types**:
- Symbols and definitions
- Dependencies and imports
- Code patterns
- Architecture analysis

#### Iterative Coverage Enhancer

Analyzes test coverage gaps and generates improvement recommendations.

**Features**:
- Coverage gap identification
- Test generation suggestions
- Dead code detection
- Adaptive threshold recommendations

### 🏗️ Design Tools

#### Design Assistant

Orchestrates multi-phase design workflows with constraint enforcement.

**Actions**:
- Start design session
- Advance through phases
- Validate coverage
- Enforce consistency
- Generate artifacts (ADRs, specs, roadmaps)

**Phases**:
1. Discovery
2. Analysis
3. Design
4. Validation
5. Documentation

#### Architecture Design Prompt Builder

Generates architecture design prompts with scale-appropriate guidance.

**Scales**:
- Small: Simple, focused solutions
- Medium: Balanced architecture
- Large: Enterprise-grade, distributed systems

#### Mermaid Diagram Generator

Creates diagrams from text descriptions with validation and repair.

**Diagram Types**:
- Flowchart, Sequence, Class, State
- ER, Gantt, Journey, Git-graph
- Pie, Quadrant, Mindmap, Timeline

See: [Mermaid Diagram Examples](./MERMAID_DIAGRAM_EXAMPLES.md)

### 📈 Strategy & Planning Tools

#### Strategy Frameworks Builder

Composes strategy analysis using established frameworks.

**Frameworks**:
- SWOT, VRIO, Porter's Five Forces
- Balanced Scorecard
- McKinsey 7S, Ansoff Matrix
- Blue Ocean, PEST, BCG Matrix

#### Gap Frameworks Analyzers

Analyzes gaps between current and desired states.

**Gap Types**:
- Capability, Performance, Maturity
- Skills, Technology, Process
- Market, Strategic, Operational
- Cultural, Security, Compliance

#### Sprint Timeline Calculator

Calculates dependency-aware sprint timelines with capacity planning.

**Features**:
- Dependency-aware scheduling
- Team capacity calculation
- Optimization strategies (greedy, linear programming)
- Critical path analysis

See: [Sprint Planning Reliability](./SPRINT_PLANNING_RELIABILITY.md)

### 🔧 Utility Tools

#### Model Compatibility Checker

Recommends best AI models for specific tasks and budgets.

**Considers**:
- Task requirements
- Budget constraints
- Context window needs
- Multimodal capabilities

#### Guidelines Validator

Validates development practices against established AI agent guidelines.

**Categories**:
- Prompting best practices
- Code management
- Architecture patterns
- Visualization standards
- Memory management
- Workflow optimization

#### Memory Context Optimizer

Optimizes prompt caching and context window usage.

**Strategies**:
- Aggressive, Conservative, Balanced
- Automatic pruning
- Cache efficiency analysis

#### Project Onboarding

Performs comprehensive project analysis for efficient familiarization.

**Analysis**:
- Project structure
- Technology stack
- Dependencies
- Code patterns
- Quality baselines

#### Prompting Hierarchy Evaluator

Evaluates prompts and provides numeric scoring on clarity, specificity, completeness.

**Scores**:
- Clarity (0-100)
- Specificity (0-100)
- Completeness (0-100)
- Cognitive Complexity (0-100)

See: [Prompting Hierarchy Guide](./PROMPTING_HIERARCHY.md)

#### Hierarchy Level Selector

Recommends appropriate prompting hierarchy level based on task characteristics.

**Levels**:
- Independent, Indirect, Direct
- Modeling, Scaffolding, Full-Physical

## Quick Reference Table

| Tool | Category | Primary Use | Output Format |
|------|----------|-------------|---------------|
| hierarchical-prompt-builder | Prompting | Multi-level prompts | Markdown |
| prompt-flow-builder | Prompting | Declarative flows | Markdown/Mermaid |
| prompt-chaining-builder | Prompting | Sequential chains | Markdown |
| security-hardening-prompt-builder | Prompting | Security audits | Markdown |
| domain-neutral-prompt-builder | Prompting | General tasks | Markdown |
| clean-code-scorer | Analysis | Quality scoring | JSON |
| code-hygiene-analyzer | Analysis | Code health | JSON |
| semantic-code-analyzer | Analysis | Deep analysis | JSON |
| iterative-coverage-enhancer | Analysis | Test coverage | Markdown |
| design-assistant | Design | Workflow orchestration | Markdown/JSON |
| architecture-design-prompt-builder | Design | Architecture | Markdown |
| mermaid-diagram-generator | Design | Visualizations | Mermaid |
| strategy-frameworks-builder | Strategy | Strategic planning | Markdown |
| gap-frameworks-analyzers | Strategy | Gap analysis | Markdown |
| sprint-timeline-calculator | Planning | Sprint planning | JSON/Markdown |
| model-compatibility-checker | Utility | Model selection | Markdown |
| guidelines-validator | Utility | Practice validation | Markdown |
| memory-context-optimizer | Utility | Context optimization | JSON |
| project-onboarding | Utility | Project analysis | Markdown |
| prompting-hierarchy-evaluator | Utility | Prompt evaluation | JSON |
| hierarchy-level-selector | Utility | Level selection | Markdown |

## Common Workflows

### Workflow 1: New Feature Development

```
1. design-assistant (start session)
2. architecture-design-prompt-builder
3. security-hardening-prompt-builder
4. sprint-timeline-calculator
5. design-assistant (generate artifacts)
```

### Workflow 2: Code Quality Improvement

```
1. clean-code-scorer (baseline)
2. code-hygiene-analyzer
3. iterative-coverage-enhancer
4. semantic-code-analyzer
5. clean-code-scorer (validate improvement)
```

### Workflow 3: Strategic Planning

```
1. strategy-frameworks-builder (SWOT, objectives)
2. gap-frameworks-analyzers (capability gaps)
3. sprint-timeline-calculator
4. mermaid-diagram-generator (roadmap)
```

### Workflow 4: Security Audit

```
1. security-hardening-prompt-builder
2. code-hygiene-analyzer (security focus)
3. clean-code-scorer (security component)
4. design-assistant (remediation plan)
```

## Tool Selection Guide

### By Task Type

**Planning & Strategy**:
- strategy-frameworks-builder
- gap-frameworks-analyzers
- sprint-timeline-calculator

**Code Quality**:
- clean-code-scorer
- code-hygiene-analyzer
- iterative-coverage-enhancer

**Architecture & Design**:
- design-assistant
- architecture-design-prompt-builder
- mermaid-diagram-generator

**Security**:
- security-hardening-prompt-builder
- code-hygiene-analyzer (security)
- clean-code-scorer (security)

**Prompting**:
- hierarchical-prompt-builder
- prompt-flow-builder
- prompting-hierarchy-evaluator

## Best Practices

### 1. Tool Chaining

Combine tools for comprehensive analysis:

```typescript
// Quality improvement pipeline
const baseline = await cleanCodeScorer({ projectPath: "./" });
const hygiene = await codeHygieneAnalyzer({ codeContent: source });
const coverage = await iterativeCoverageEnhancer({ currentCoverage: baseline.coverage });
const semantic = await semanticCodeAnalyzer({ codeContent: source });
```

### 2. Iterative Refinement

Use tools iteratively:

```typescript
// Design iteration
let design = await designAssistant({ action: "start-session" });
design = await designAssistant({ action: "advance-phase" });
design = await designAssistant({ action: "validate-phase" });
design = await designAssistant({ action: "enforce-coverage" });
```

### 3. Context Provision

Provide rich context for better results:

```typescript
await tool({
  context: {
    framework: "react",
    teamSize: 5,
    constraints: ["mobile-first", "accessibility"]
  }
});
```

### 4. Output Validation

Validate and iterate on tool outputs:

```typescript
const result = await tool({ /* ... */ });
if (result.score < threshold) {
  // Iterate with refinements
  const improved = await tool({ /* adjusted params */ });
}
```

## Related Resources

- [AI Interaction Tips](./AI_INTERACTION_TIPS.md) - Effective tool usage
- [Prompting Hierarchy Guide](./PROMPTING_HIERARCHY.md) - Prompt levels
- [Flow Prompting Examples](./FLOW_PROMPTING_EXAMPLES.md) - Workflow patterns
- [Clean Code Initiative](./CLEAN_CODE_INITIATIVE.md) - Quality standards
- [Complete Documentation](./README.md) - Full documentation index

## Conclusion

This MCP server provides a comprehensive toolkit for AI-assisted development, from prompt engineering to code quality analysis to strategic planning. By understanding each tool's capabilities and combining them effectively, you can build sophisticated AI workflows that improve code quality, accelerate development, and enhance decision-making.

For detailed documentation on each tool, see the [complete documentation index](./README.md).
