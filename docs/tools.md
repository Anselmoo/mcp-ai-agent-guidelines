# Tools Reference

> **Complete reference for all 32 MCP tools** including ToolAnnotations, complexity ratings, and usage examples.

This document provides detailed information about all tools in the MCP AI Agent Guidelines server, organized by category.

---

## Table of Contents

1. [Prompt Builders](#prompt-builders) (10 tools)
2. [Code Analysis & Quality](#code-analysis--quality) (7 tools)
3. [Strategy & Planning](#strategy--planning) (5 tools)
4. [Design Workflow](#design-workflow) (1 tool)
5. [Utilities](#utilities) (3 tools)
6. [Deprecated Tools](#deprecated-tools) (6 tools)
7. [Understanding ToolAnnotations](#understanding-toolannotations)
8. [Complexity Ratings](#complexity-ratings)

---

## Prompt Builders

Tools for creating structured, effective prompts for various use cases.

### 🌟 prompt-hierarchy (NEW)

**Unified prompt API with 6 modes: build, evaluate, select-level, chain, flow, quick**

**ToolAnnotations**:
- `readOnlyHint`: true (doesn't modify state)
- `idempotentHint`: true (same inputs → same outputs)
- `destructiveHint`: false (doesn't delete/destroy data)
- `openWorldHint`: false (no external system access)

**Complexity**: ⭐⭐⭐ Advanced

**Modes**:
1. `build` - Create hierarchical prompts (context → goal → requirements)
2. `evaluate` - Score prompts with numeric quality metrics
3. `select-level` - Recommend optimal hierarchy level for tasks
4. `chain` - Build sequential prompt chains with dependencies
5. `flow` - Create declarative flows with branching/loops
6. `quick` - Access "Best of 25" quick developer prompts

**Best For**: All prompt operations, unified API, workflow automation

**Outputs**: Mode-specific structured responses (markdown/JSON/Mermaid)

**Example**:
```json
{
  "tool": "prompt-hierarchy",
  "arguments": {
    "mode": "build",
    "context": "Microservices authentication system",
    "goal": "Review OAuth2 implementation for security",
    "requirements": ["Token validation", "Refresh token rotation"]
  }
}
```

**Learn More**: [API Reference](./api/prompt-hierarchy.md)

---

### code-analysis-prompt-builder

**Generate code review prompts for security, performance, and maintainability analysis**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐ Moderate

**Best For**: Code reviews, static analysis prompts, technical debt assessment

**Outputs**: Structured markdown prompts for LLM injection

**Parameters**:
- `codebase` (required): Code or description to analyze
- `focusArea`: security | performance | maintainability | general
- `language`: Programming language

**Learn More**: [Guide](./tools/code-analysis-prompt-builder.md)

---

### architecture-design-prompt-builder

**Create architecture design prompts with scale-appropriate guidance**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐ Advanced

**Best For**: System architecture planning, microservices design, scalability reviews

**Outputs**: Architecture design prompts with scale considerations

**Parameters**:
- `systemRequirements` (required): System requirements and constraints
- `scale`: small | medium | large
- `technologyStack`: Preferred technologies

**Learn More**: [Guide](./tools/architecture-design-prompt-builder.md)

---

### digital-enterprise-architect-prompt-builder

**Enterprise architecture strategy with mentor perspectives and research**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐⭐ Expert

**Best For**: Enterprise strategy, cloud migration, digital transformation

**Outputs**: Strategic architecture prompts with research benchmarks

**Parameters**:
- `initiativeName` (required): Name of architecture initiative
- `problemStatement` (required): Strategic problem being addressed
- `businessDrivers`: Key business objectives
- `researchFocus`: Topics to benchmark

**Learn More**: [Guide](./tools/digital-enterprise-architect-prompt-builder.md)

---

### debugging-assistant-prompt-builder

**Systematic debugging prompts with structured analysis**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐ Moderate

**Best For**: Error investigation, root cause analysis, troubleshooting

**Outputs**: Debugging prompts with diagnostic steps

**Parameters**:
- `errorDescription` (required): Description of error/issue
- `context`: Additional problem context
- `attemptedSolutions`: Solutions already tried

**Learn More**: [Guide](./tools/debugging-assistant-prompt-builder.md)

---

### l9-distinguished-engineer-prompt-builder

**L9 (Distinguished Engineer) high-level technical design prompts**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐⭐⭐ Master

**Best For**: High-level architecture, distributed systems, performance at scale

**Outputs**: Distinguished-level technical design prompts

**Parameters**:
- `projectName` (required): Name of project/system
- `technicalChallenge` (required): Core technical problem
- `techStack`: Technologies/frameworks/platforms
- `performanceTargets`: SLOs/SLAs

**Learn More**: [Guide](./tools/l9-distinguished-engineer-prompt-builder.md)

---

### documentation-generator-prompt-builder

**Technical documentation prompts tailored to audience**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐ Moderate

**Best For**: API docs, user guides, technical specifications

**Outputs**: Documentation generation prompts

**Parameters**:
- `contentType` (required): API | user guide | technical spec
- `targetAudience`: Intended readers
- `existingContent`: Content to build upon

**Learn More**: [Guide](./tools/documentation-generator-prompt-builder.md)

---

### domain-neutral-prompt-builder

**Generic templates with objectives, workflows, and acceptance criteria**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐ Advanced

**Best For**: Specifications, technical requirements, project planning

**Outputs**: Comprehensive structured prompts

**Parameters**:
- `title` (required): Document title
- `summary` (required): One-paragraph summary
- `objectives`: List of objectives
- `workflow`: Step-by-step workflow

**Learn More**: [Guide](./tools/domain-neutral-prompt-builder.md)

---

### security-hardening-prompt-builder

**Security analysis prompts with OWASP/compliance focus**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐ Advanced

**Best For**: Security audits, vulnerability analysis, compliance checking

**Outputs**: Security-focused prompts with threat modeling

**Parameters**:
- `codeContext` (required): Code to analyze for security
- `securityFocus`: vulnerability-analysis | security-hardening | compliance-check
- `complianceStandards`: OWASP-Top-10 | NIST | ISO-27001 | GDPR | etc.
- `analysisScope`: Security areas to focus on

**Learn More**: [Guide](./tools/security-hardening-prompt-builder.md)

---

### spark-prompt-builder

**Build UI/UX product design prompts with structured inputs**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐ Advanced

**Best For**: UI/UX design, component libraries, design systems

**Outputs**: Structured design prompts with color/typography/animation specs

**Parameters**:
- `title` (required): Prompt title
- `complexityLevel` (required): Design complexity
- `colorScheme`: Color palette specifications
- `typography`: Font specifications

**Learn More**: [Guide](./tools/spark-prompt-builder.md)

---

## Code Analysis & Quality

Tools for analyzing and improving code quality with automated insights.

### clean-code-scorer

**Calculate comprehensive 0-100 quality score with metric breakdown**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐ Advanced

**Best For**: Code quality assessment, technical debt quantification, quality gates

**Outputs**: Numeric score (0-100) with detailed metrics

**Parameters**:
- `codeContent`: Code to analyze
- `coverageMetrics`: Test coverage data (lines, branches, functions, statements)
- `language`: Programming language
- `framework`: Framework/technology stack

**Learn More**: [Guide](./tools/clean-code-scorer.md)

---

### code-hygiene-analyzer

**Detect outdated patterns, unused dependencies, and code smells**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐ Moderate

**Best For**: Legacy code assessment, dependency cleanup, modernization planning

**Outputs**: Hygiene analysis with prioritized recommendations

**Parameters**:
- `codeContent` (required): Code to analyze
- `language` (required): Programming language
- `framework`: Framework or technology stack

**Learn More**: [Guide](./tools/code-hygiene-analyzer.md)

---

### dependency-auditor

**Audit package files for security, deprecation, and version issues**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐ Simple

**Best For**: Dependency security, version auditing, ESM compatibility

**Outputs**: Audit report with vulnerability and deprecation warnings

**Parameters**:
- `dependencyContent`: Content of package.json/requirements.txt/etc.
- `fileType`: package.json | requirements.txt | pyproject.toml | Cargo.toml | etc.
- `checkVulnerabilities`: Check for known vulnerabilities
- `checkDeprecated`: Check for deprecated packages

**Learn More**: [Guide](./tools/dependency-auditor.md)

---

### iterative-coverage-enhancer

**Analyze coverage gaps, generate test suggestions, adapt thresholds**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐ Advanced

**Best For**: Test coverage improvement, gap analysis, threshold optimization

**Outputs**: Coverage analysis with test suggestions

**Parameters**:
- `currentCoverage`: Current coverage metrics
- `targetCoverage`: Target coverage goals
- `projectPath`: Path to project directory
- `language`: Programming language

**Learn More**: [Guide](./tools/iterative-coverage-enhancer.md)

---

### semantic-code-analyzer

**Identify symbols, structure, dependencies, and patterns (LSP-based)**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐ Moderate

**Best For**: Code navigation, symbol analysis, dependency mapping

**Outputs**: Semantic analysis with symbols and structure

**Parameters**:
- `codeContent` (required): Code to analyze
- `language`: Programming language (auto-detected if not provided)
- `analysisType`: symbols | structure | dependencies | patterns | all

**Learn More**: [Guide](./tools/semantic-code-analyzer.md)

---

### guidelines-validator

**Validate practices against AI agent development guidelines**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐ Simple

**Best For**: Best practice validation, workflow compliance, guidelines adherence

**Outputs**: Validation report with recommendations

**Parameters**:
- `practiceDescription` (required): Description of practice
- `category` (required): prompting | code-management | architecture | visualization | memory | workflow

**Learn More**: [Guide](./tools/guidelines-validator.md)

---

### mermaid-diagram-generator

**Generate professional diagrams from text descriptions**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐ Moderate

**Best For**: Visual documentation, architecture diagrams, workflow visualization

**Outputs**: Valid Mermaid diagram syntax

**Parameters**:
- `description` (required): System/process description
- `diagramType` (required): flowchart | sequence | class | state | gantt | pie | er | journey | etc.
- `theme`: default | dark | forest | neutral
- `direction`: TD | LR | RL | BT (for flowcharts)

**Learn More**: [Guide](./tools/mermaid-diagram-generator.md)

---

## Strategy & Planning

Business strategy analysis and agile project planning tools.

### strategy-frameworks-builder

**Compose strategic analysis using SWOT, BSC, VRIO, Porter's Five Forces**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐ Advanced

**Best For**: Business strategy, market analysis, competitive positioning

**Outputs**: Structured framework analysis

**Parameters**:
- `frameworks` (required): List of frameworks to apply
- `context` (required): Business context
- `market`: Market description
- `objectives`: Strategic objectives

**Learn More**: [Guide](./tools/strategy-frameworks-builder.md)

---

### gap-frameworks-analyzers

**Analyze gaps in capability, technology, maturity, skills**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐ Advanced

**Best For**: Current vs. desired state analysis, transformation planning

**Outputs**: Gap analysis with action plans

**Parameters**:
- `frameworks` (required): Gap analysis types
- `currentState` (required): Current state description
- `desiredState` (required): Desired state description
- `context` (required): Analysis context

**Learn More**: [Guide](./tools/gap-frameworks-analyzers.md)

---

### sprint-timeline-calculator

**Dependency-aware sprint planning with optimization**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐ Moderate

**Best For**: Sprint planning, timeline estimation, resource allocation

**Outputs**: Sprint timeline with dependency resolution

**Parameters**:
- `tasks` (required): List of tasks with estimates
- `teamSize` (required): Number of team members
- `sprintLength`: Sprint length in days
- `velocity`: Team velocity (story points per sprint)

**Learn More**: [Guide](./tools/sprint-timeline-calculator.md)

---

### model-compatibility-checker

**Recommend best AI models for task requirements**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐ Simple

**Best For**: Model selection, cost optimization, capability matching

**Outputs**: Model recommendations with rationale

**Parameters**:
- `taskDescription` (required): Task description
- `requirements`: Specific requirements (context length, multimodal, etc.)
- `budget`: low | medium | high

**Learn More**: [Guide](./tools/model-compatibility-checker.md)

---

### project-onboarding

**Comprehensive project structure analysis and documentation**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: true (accesses filesystem)

**Complexity**: ⭐⭐ Moderate

**Best For**: Project familiarization, documentation generation, onboarding

**Outputs**: Project overview with structure analysis

**Parameters**:
- `projectPath` (required): Path to project directory
- `projectName`: Name of project
- `projectType`: library | application | service | tool | other
- `analysisDepth`: quick | standard | deep

**Learn More**: [Guide](./tools/project-onboarding.md)

---

## Design Workflow

Multi-phase design orchestration with constraint enforcement.

### design-assistant

**Constraint-driven design sessions with artifact generation**

**ToolAnnotations**:
- `readOnlyHint`: false (maintains session state)
- `idempotentHint`: false (stateful operations)
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐⭐⭐ Expert

**Best For**: Design workflows, ADR generation, specification creation

**Outputs**: Design artifacts (ADRs, specs, roadmaps)

**Actions**:
- `start-session`: Initialize design session
- `advance-phase`: Move to next phase
- `validate-phase`: Validate current phase
- `generate-artifacts`: Create ADRs/specs/roadmaps
- `enforce-coverage`: Check coverage thresholds
- `get-status`: Get session status

**Learn More**: [Guide](./tools/design-assistant.md)

---

## Utilities

Supporting tools for workflow optimization.

### memory-context-optimizer

**Optimize prompt caching and context window usage**

**ToolAnnotations**:
- `readOnlyHint`: true
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐⭐ Moderate

**Best For**: Token efficiency, context compression, caching optimization

**Outputs**: Optimized context with caching recommendations

**Parameters**:
- `contextContent` (required): Context to optimize
- `maxTokens`: Maximum token limit
- `cacheStrategy`: aggressive | conservative | balanced

**Learn More**: [Guide](./tools/memory-context-optimizer.md)

---

### mode-switcher

**Switch between agent operation modes**

**ToolAnnotations**:
- `readOnlyHint`: false (changes mode state)
- `idempotentHint`: true
- `destructiveHint`: false
- `openWorldHint`: false

**Complexity**: ⭐ Simple

**Best For**: Workflow transitions, context switching, mode management

**Outputs**: Mode switch confirmation with recommendations

**Parameters**:
- `targetMode` (required): planning | editing | analysis | debugging | refactoring | documentation
- `currentMode`: Current active mode
- `context`: Operating context
- `reason`: Reason for switch

**Learn More**: [Guide](./tools/mode-switcher.md)

---

## Deprecated Tools

> ⚠️ **These tools are deprecated as of v0.14.0 and will be removed in v0.15.0**
>
> Use `prompt-hierarchy` with the appropriate mode instead. See [Migration Guide](./migration.md).

### hierarchical-prompt-builder 🔻

**Status**: ⚠️ Deprecated in v0.14.0 → Removed in v0.15.0

**Replacement**: `prompt-hierarchy` with `mode: "build"`

**Migration**: Add `"mode": "build"` parameter, all other parameters remain identical.

**Learn More**: [Migration Guide](./migration.md#1-hierarchical-prompt-builder)

---

### prompting-hierarchy-evaluator 🔻

**Status**: ⚠️ Deprecated in v0.14.0 → Removed in v0.15.0

**Replacement**: `prompt-hierarchy` with `mode: "evaluate"`

**Migration**: Add `"mode": "evaluate"` parameter, all other parameters remain identical.

**Learn More**: [Migration Guide](./migration.md#2-prompting-hierarchy-evaluator)

---

### hierarchy-level-selector 🔻

**Status**: ⚠️ Deprecated in v0.14.0 → Removed in v0.15.0

**Replacement**: `prompt-hierarchy` with `mode: "select-level"`

**Migration**: Add `"mode": "select-level"` parameter, all other parameters remain identical.

**Learn More**: [Migration Guide](./migration.md#3-hierarchy-level-selector)

---

### prompt-chaining-builder 🔻

**Status**: ⚠️ Deprecated in v0.14.0 → Removed in v0.15.0

**Replacement**: `prompt-hierarchy` with `mode: "chain"`

**Migration**: Add `"mode": "chain"` parameter, all other parameters remain identical.

**Learn More**: [Migration Guide](./migration.md#4-prompt-chaining-builder)

---

### prompt-flow-builder 🔻

**Status**: ⚠️ Deprecated in v0.14.0 → Removed in v0.15.0

**Replacement**: `prompt-hierarchy` with `mode: "flow"`

**Migration**: Add `"mode": "flow"` parameter, all other parameters remain identical.

**Learn More**: [Migration Guide](./migration.md#5-prompt-flow-builder)

---

### quick-developer-prompts-builder 🔻

**Status**: ⚠️ Deprecated in v0.14.0 → Removed in v0.15.0

**Replacement**: `prompt-hierarchy` with `mode: "quick"`

**Migration**: Add `"mode": "quick"` parameter, all other parameters remain identical.

**Learn More**: [Migration Guide](./migration.md#6-quick-developer-prompts-builder)

---

## Understanding ToolAnnotations

All tools include **ToolAnnotations** to help LLMs understand their characteristics:

### Annotation Fields

| Field             | Type    | Meaning                                                     |
| ----------------- | ------- | ----------------------------------------------------------- |
| `title`           | string  | Human-readable tool title                                   |
| `readOnlyHint`    | boolean | **true** = doesn't modify state, **false** = may modify    |
| `idempotentHint`  | boolean | **true** = same inputs → same outputs, **false** = varies  |
| `destructiveHint` | boolean | **true** = may delete/destroy data, **false** = safe       |
| `openWorldHint`   | boolean | **true** = accesses external systems, **false** = isolated |

### Annotation Presets

Tools are categorized into 4 annotation presets:

#### ANALYSIS_TOOL_ANNOTATIONS
- `readOnlyHint`: **true** (inspects, doesn't modify)
- `idempotentHint`: **true** (repeatable)
- `destructiveHint`: **false** (safe)
- `openWorldHint`: **false** (isolated)
- **Examples**: clean-code-scorer, code-hygiene-analyzer, semantic-code-analyzer

#### GENERATION_TOOL_ANNOTATIONS
- `readOnlyHint`: **true** (creates content, doesn't modify existing state)
- `idempotentHint`: **true** (repeatable)
- `destructiveHint`: **false** (safe)
- `openWorldHint`: **false** (isolated)
- **Examples**: All prompt builders, mermaid-diagram-generator

#### SESSION_TOOL_ANNOTATIONS
- `readOnlyHint`: **false** (maintains session state)
- `idempotentHint`: **false** (stateful)
- `destructiveHint`: **false** (safe)
- `openWorldHint`: **false** (isolated)
- **Examples**: design-assistant, mode-switcher

#### FILESYSTEM_TOOL_ANNOTATIONS
- `readOnlyHint`: **true** (reads but doesn't modify filesystem)
- `idempotentHint`: **true** (repeatable)
- `destructiveHint`: **false** (safe)
- `openWorldHint`: **true** (accesses external filesystem)
- **Examples**: project-onboarding

---

## Complexity Ratings

All tools are rated by complexity to help you understand learning investment:

| Rating | Name       | Learning Time | Description                                              |
| ------ | ---------- | ------------- | -------------------------------------------------------- |
| ⭐     | Simple     | 5-10 min      | Single input, immediate output, straightforward usage    |
| ⭐⭐   | Moderate   | 15-30 min     | Multiple parameters, clear documentation, moderate depth |
| ⭐⭐⭐ | Advanced   | 1-2 hours     | Complex inputs, domain knowledge helpful, rich features  |
| ⭐⭐⭐⭐ | Expert   | Half day      | Multi-phase workflows, deep domain expertise needed      |
| ⭐⭐⭐⭐⭐ | Master | 1-2 days      | Enterprise-scale, comprehensive orchestration            |

**Pro Tip**: Start with ⭐ tools to learn the basics, then progress to ⭐⭐⭐+ tools for advanced workflows.

---

## Quick Reference

### By Use Case

**Code Quality**:
- clean-code-scorer (⭐⭐⭐)
- code-hygiene-analyzer (⭐⭐)
- dependency-auditor (⭐)
- iterative-coverage-enhancer (⭐⭐⭐)

**Security**:
- security-hardening-prompt-builder (⭐⭐⭐)
- dependency-auditor (⭐)

**Architecture**:
- architecture-design-prompt-builder (⭐⭐⭐)
- digital-enterprise-architect-prompt-builder (⭐⭐⭐⭐)
- l9-distinguished-engineer-prompt-builder (⭐⭐⭐⭐⭐)

**Testing**:
- iterative-coverage-enhancer (⭐⭐⭐)
- prompt-hierarchy mode=quick (⭐⭐⭐)

**Documentation**:
- documentation-generator-prompt-builder (⭐⭐)
- mermaid-diagram-generator (⭐⭐)

**Planning**:
- sprint-timeline-calculator (⭐⭐)
- strategy-frameworks-builder (⭐⭐⭐)
- gap-frameworks-analyzers (⭐⭐⭐)

---

## See Also

- **[Complete Documentation Index](./README.md)** - All guides and references
- **[Migration Guide](./migration.md)** - v0.13.x → v0.14.x migration
- **[prompt-hierarchy API Reference](./api/prompt-hierarchy.md)** - Unified prompt tool
- **[AI Interaction Tips](./tips/ai-interaction-tips.md)** - Best practices for using tools
- **[Agent-Relative Calls](./tips/agent-relative-calls.md)** - Workflow orchestration patterns
