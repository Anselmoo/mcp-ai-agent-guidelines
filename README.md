<!-- AUTO-GENERATED INTERACTIVE HEADER - DO NOT EDIT -->
<iframe
    src="https://raw.githubusercontent.com/Anselmoo/mcp-ai-agent-guidelines/main/docs/.frames-interactive/header-README.html"
    style="width: 100%; height: 120px; border: none; display: block; margin: 0; padding: 0;"
    title="Interactive Header"
    loading="lazy"
    sandbox="allow-scripts allow-same-origin"
></iframe>
<!-- END AUTO-GENERATED INTERACTIVE HEADER -->

<div align="center">

<!-- Interactive SVG Header -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/readme-header.svg">
  <img alt="MCP AI Agent Guidelines Server - advanced tools for AI development" src="./docs/assets/readme-header.svg" width="100%">
</picture>

</div>

# MCP AI Agent Guidelines Server

> [!CAUTION] > **Disclaimer -- Experimental / Early Stage:** This _research demonstrator_ project references third‑party models, tools, pricing, and docs that evolve quickly. Treat outputs as recommendations and verify against official docs and your own benchmarks before production use.

[![CI/CD Pipeline](https://img.shields.io/github/actions/workflow/status/Anselmoo/mcp-ai-agent-guidelines/ci-cd.yml?branch=main&label=CI%2FCD&logo=github-actions&logoColor=white)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/actions/workflows/ci-cd.yml)
[![Auto-Regenerate Demos](https://img.shields.io/github/actions/workflow/status/Anselmoo/mcp-ai-agent-guidelines/auto-regenerate-demos.yml?label=demos&logo=github-actions&logoColor=white)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/actions/workflows/auto-regenerate-demos.yml)
[![Link Checker](https://img.shields.io/github/actions/workflow/status/Anselmoo/mcp-ai-agent-guidelines/link-checker.yml?branch=main&label=links&logo=link&logoColor=white)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/actions/workflows/link-checker.yml)
[![Coverage Status](https://img.shields.io/codecov/c/github/Anselmoo/mcp-ai-agent-guidelines/main?label=coverage&logo=codecov&logoColor=white)](https://codecov.io/gh/Anselmoo/mcp-ai-agent-guidelines)
[![Node.js Version](https://img.shields.io/node/v/mcp-ai-agent-guidelines?label=node&logo=node.js&logoColor=white&color=green)](https://nodejs.org/en/download/)
[![Docker](https://img.shields.io/badge/docker-available-blue?logo=docker&logoColor=white)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/pkgs/container/mcp-ai-agent-guidelines)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?logo=opensourceinitiative&logoColor=white)](./LICENSE)

[![GitHub Stars](https://img.shields.io/github/stars/Anselmoo/mcp-ai-agent-guidelines?style=social)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Anselmoo/mcp-ai-agent-guidelines?style=social)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/Anselmoo/mcp-ai-agent-guidelines?label=issues&logo=github&logoColor=white)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/Anselmoo/mcp-ai-agent-guidelines?logo=github&logoColor=white)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/commits/main)

A Model Context Protocol (MCP) server offering advanced tools and templates for hierarchical prompting, code hygiene, visualization, memory optimization, and agile planning.

## 📚 Table of Contents

- [Installation](#installation)
- [Documentation](#documentation)
- [Demos](#demos)
- [Features](#features)
- [VS Code Integration](#vs-code-integration-one-click)
- [Agent-Relative Calls](#agent-relative-calls)
- [Configuration](#configuration)
- [Development](#development)
- [Contributing](#contributing)
- [Changelog](./CHANGELOG.md)
- [License](#license)

## Installation

```bash
# NPX (recommended)
npx mcp-ai-agent-guidelines

# NPM global
npm install -g mcp-ai-agent-guidelines

# From source
git clone https://github.com/Anselmoo/mcp-ai-agent-guidelines.git
cd mcp-ai-agent-guidelines
npm ci && npm run build && npm start
```

### Scripts

```bash
npm run build      # TypeScript build
npm run start      # Build and start server
npm run test:all   # Unit + integration + demos + MCP smoke
npm run test:coverage:unit # Unit test coverage (c8) -> coverage/ + summary
npm run quality    # Type-check + Biome checks
npm run links:check # Check links in main markdown files
npm run links:check:all # Check links in all markdown files (slow)
```

### Local Link Checking

The project includes automated link checking via GitHub Actions. To check links locally before committing:

```bash
# Quick check (README, CONTRIBUTING, DISCLAIMER)
npm run links:check

# Comprehensive check (all markdown files)
npm run links:check:all

# Or use npx directly
npx markdown-link-check --config .mlc_config.json README.md
```

Configuration is in `.mlc_config.json`. Ignored patterns and retries are configured there.

## Documentation

## Documentation

**[📖 Complete Documentation Index](./docs/README.md)** - Full guide to all tools and features

### Getting Started Guides

- **[🎯 AI Interaction Tips](./docs/AI_INTERACTION_TIPS.md)** - Learn to ask targeted questions for better results
- **[📊 Prompting Hierarchy](./docs/PROMPTING_HIERARCHY.md)** - Understanding prompt levels and evaluation
- **[🔗 Agent-Relative Call Patterns](./docs/AGENT_RELATIVE_CALLS.md)** - Invoking tools in workflows

### Advanced Features

- **[🌊 Flow-Based Prompting](./docs/FLOW_PROMPTING_EXAMPLES.md)** - Multi-step prompt workflows
- **[🎨 Mermaid Diagram Generation](./docs/MERMAID_DIAGRAM_EXAMPLES.md)** - Create flowcharts, sequences, ER diagrams
- **[🔍 Code Quality Analysis](./docs/CODE_QUALITY_IMPROVEMENTS.md)** - Hygiene scoring and best practices
- **[⚡ Sprint Planning](./docs/SPRINT_PLANNING_RELIABILITY.md)** - Dependency-aware timeline calculation

### Integration & Reference

- **[🏗️ Bridge Connectors](./docs/BRIDGE_CONNECTORS.md)** - Integration patterns for external systems
- **[🔄 Serena Integration](./docs/SERENA_STRATEGIES.md)** - Semantic analysis strategies
- **[📚 Complete Reference](./docs/REFERENCES.md)** - Credits, research papers, and citations

See **[docs/README.md](./docs/README.md)** for the complete documentation index.

### Quick Links

#### For Users

- **[🎯 AI Interaction Tips](./docs/AI_INTERACTION_TIPS.md)** - Learn to ask targeted questions for better results
- **[📊 Prompting Hierarchy](./docs/PROMPTING_HIERARCHY.md)** - Understanding prompt levels and evaluation
- **[🔗 Agent-Relative Call Patterns](./docs/AGENT_RELATIVE_CALLS.md)** - Invoking tools in workflows
- **[🌊 Flow-Based Prompting](./docs/FLOW_PROMPTING_EXAMPLES.md)** - Advanced chaining strategies
- **[🎨 Mermaid Diagrams](./docs/mermaid-diagram-examples.md)** - Visual diagram generation

#### For Developers

- **[🤝 Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute
- **[✨ Clean Code Initiative](./docs/CLEAN_CODE_INITIATIVE.md)** - Quality standards (100/100 scoring)
- **[� Technical Improvements](./docs/TECHNICAL_IMPROVEMENTS.md)** - Refactoring and enhancements
- **[⚠️ Error Handling](./docs/ERROR_HANDLING.md)** - Best practices
- **[🏗️ Bridge Connectors](./docs/BRIDGE_CONNECTORS.md)** - Integration patterns

See the **[complete documentation](./docs/README.md)** for the full list of guides organized by topic.

## Demos

Explore real-world examples showing the tools in action. All demos are auto-generated and kept in sync with the codebase.

**[📖 Complete Demo Index](./demos/README.md)** - Full list of all demos with descriptions

### Featured Examples

**Code Analysis & Quality:**

- [Code Hygiene Report](./demos/demo-code-analysis.hygiene.md) - Pattern detection and best practices
- [Guidelines Validation](./demos/demo-code-analysis.guidelines.md) - AI agent development standards
- [Clean Code Scoring](./demos/demo-clean-code-score.md) - Comprehensive quality metrics (0-100)

**Prompt Engineering:**

- [Hierarchical Prompt](./demos/demo-code-analysis.hierarchical.prompt.md) - Structured refactoring plan
- [Domain-Neutral Prompt](./demos/demo-code-analysis.domain-neutral.prompt.md) - Generic template
- [Security Hardening Prompt](./demos/demo-code-analysis.security-hardening.prompt.md) - OWASP-focused analysis
- [Flow-Based Prompting](./demos/demo-design-session.md) - Multi-step workflows

**Visualization & Planning:**

- [Architecture Diagram](./demos/demo-code-analysis.diagram.md) - Mermaid system diagrams
- [Sprint Planning](./demos/demo-code-analysis.sprint.md) - Dependency-aware timeline
- [Model Compatibility](./demos/demo-code-analysis.model-compat.md) - AI model selection

**Advanced Features:**

- [Memory Context Optimization](./demos/demo-code-analysis.memory.md) - Token efficiency
- [Strategy Frameworks](./demos/demo-strategy-frameworks.md) - SWOT, BCG, Porter's Five Forces
- [Gap Analysis](./demos/demo-gap-analysis.md) - Current vs. desired state

### Running Demos Locally

```bash
npm run build
node demos/demo-tools.js  # Generate sample tool outputs
```

Demos are automatically regenerated when tool code changes via GitHub Actions.

## Features & Tools

**27 professional tools** for AI-powered development workflows. Each tool is rated by complexity:

**⭐ Complexity Ratings:**

- ⭐ **Simple** - Single input, immediate output (5-10 min to master)
- ⭐⭐ **Moderate** - Multiple parameters, straightforward usage (15-30 min)
- ⭐⭐⭐ **Advanced** - Complex inputs, requires understanding of domain (1-2 hours)
- ⭐⭐⭐⭐ **Expert** - Multi-phase workflows, deep domain knowledge (half day)
- ⭐⭐⭐⭐⭐ **Master** - Enterprise-scale, comprehensive orchestration (1-2 days)

**📖 [Complete Tools Reference](./docs/TOOLS_REFERENCE.md)** - Detailed documentation with examples

---

### 🎨 Prompt Builders (9 tools)

Build structured, effective prompts for various use cases.

| Tool                                          | Purpose                                                         | Complexity | Learn More                                                           |
| --------------------------------------------- | --------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| `hierarchical-prompt-builder`                 | Multi-level specificity prompts (context → goal → requirements) | ⭐⭐       | [Guide](./docs/tools/hierarchical-prompt-builder.md)                 |
| `code-analysis-prompt-builder`                | Code review prompts (security, performance, maintainability)    | ⭐⭐       | [Guide](./docs/tools/code-analysis-prompt-builder.md)                |
| `architecture-design-prompt-builder`          | Architecture design with scale-appropriate guidance             | ⭐⭐⭐     | [Guide](./docs/tools/architecture-design-prompt-builder.md)          |
| `digital-enterprise-architect-prompt-builder` | Enterprise architecture with mentor perspectives & research     | ⭐⭐⭐⭐   | [Guide](./docs/tools/digital-enterprise-architect-prompt-builder.md) |
| `debugging-assistant-prompt-builder`          | Systematic debugging prompts with structured analysis           | ⭐⭐       | [Guide](./docs/tools/debugging-assistant-prompt-builder.md)          |
| `l9-distinguished-engineer-prompt-builder`    | L9 (Distinguished Engineer) high-level technical design         | ⭐⭐⭐⭐⭐ | [Guide](./docs/tools/l9-distinguished-engineer-prompt-builder.md)    |
| `documentation-generator-prompt-builder`      | Technical docs tailored to audience (API, user guide, spec)     | ⭐⭐       | [Guide](./docs/tools/documentation-generator-prompt-builder.md)      |
| `domain-neutral-prompt-builder`               | Generic templates with objectives and workflows                 | ⭐⭐⭐     | [Guide](./docs/tools/domain-neutral-prompt-builder.md)               |
| `security-hardening-prompt-builder`           | Security analysis with OWASP/compliance focus                   | ⭐⭐⭐     | [Guide](./docs/tools/security-hardening-prompt-builder.md)           |

### 🔍 Code Analysis & Quality (7 tools)

Analyze and improve code quality with automated insights.

| Tool                          | Purpose                                                            | Complexity | Learn More                                           |
| ----------------------------- | ------------------------------------------------------------------ | ---------- | ---------------------------------------------------- |
| `clean-code-scorer`           | Comprehensive 0-100 quality score with metric breakdown            | ⭐⭐⭐     | [Guide](./docs/tools/clean-code-scorer.md)           |
| `code-hygiene-analyzer`       | Detect outdated patterns, unused dependencies, code smells         | ⭐⭐       | [Guide](./docs/tools/code-hygiene-analyzer.md)       |
| `dependency-auditor`          | Audit package.json for security, deprecation, ESM compatibility    | ⭐         | [Guide](./docs/tools/dependency-auditor.md)          |
| `iterative-coverage-enhancer` | Analyze coverage gaps, generate test suggestions, adapt thresholds | ⭐⭐⭐     | [Guide](./docs/tools/iterative-coverage-enhancer.md) |
| `semantic-code-analyzer`      | Identify symbols, structure, dependencies, patterns (LSP-based)    | ⭐⭐       | [Guide](./docs/tools/semantic-code-analyzer.md)      |
| `guidelines-validator`        | Validate practices against AI agent development guidelines         | ⭐         | [Guide](./docs/tools/guidelines-validator.md)        |
| `mermaid-diagram-generator`   | Generate visual diagrams (flowchart, sequence, ER, class, etc.)    | ⭐⭐       | [Guide](./docs/tools/mermaid-diagram-generator.md)   |

### 📊 Strategy & Planning (5 tools)

Business strategy analysis and agile project planning.

| Tool                          | Purpose                                                               | Complexity | Learn More                                           |
| ----------------------------- | --------------------------------------------------------------------- | ---------- | ---------------------------------------------------- |
| `strategy-frameworks-builder` | SWOT, BSC, VRIO, Porter's Five Forces, market analysis                | ⭐⭐⭐     | [Guide](./docs/tools/strategy-frameworks-builder.md) |
| `gap-frameworks-analyzers`    | Capability, technology, maturity, skills gap analysis                 | ⭐⭐⭐     | [Guide](./docs/tools/gap-frameworks-analyzers.md)    |
| `sprint-timeline-calculator`  | Dependency-aware sprint planning with bin-packing optimization        | ⭐⭐       | [Guide](./docs/tools/sprint-timeline-calculator.md)  |
| `model-compatibility-checker` | Recommend best AI models for task requirements and budget             | ⭐         | [Guide](./docs/tools/model-compatibility-checker.md) |
| `project-onboarding`          | Comprehensive project structure analysis and documentation generation | ⭐⭐       | [Guide](./docs/tools/project-onboarding.md)          |

### 🎨 Design Workflow (1 tool)

Multi-phase design orchestration with constraint enforcement.

| Tool               | Purpose                                                                            | Complexity | Learn More                                |
| ------------------ | ---------------------------------------------------------------------------------- | ---------- | ----------------------------------------- |
| `design-assistant` | Constraint-driven design sessions with artifact generation (ADRs, specs, roadmaps) | ⭐⭐⭐⭐   | [Guide](./docs/tools/design-assistant.md) |

### 🛠️ Utilities (5 tools)

Supporting tools for workflow optimization.

| Tool                            | Purpose                                                                             | Complexity | Learn More                                             |
| ------------------------------- | ----------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| `memory-context-optimizer`      | Optimize prompt caching and context window usage                                    | ⭐⭐       | [Guide](./docs/tools/memory-context-optimizer.md)      |
| `mode-switcher`                 | Switch between agent operation modes (planning, debugging, refactoring)             | ⭐         | [Guide](./docs/tools/mode-switcher.md)                 |
| `prompting-hierarchy-evaluator` | Evaluate prompts with numeric scoring (clarity, specificity, completeness)          | ⭐⭐       | [Guide](./docs/tools/prompting-hierarchy-evaluator.md) |
| `hierarchy-level-selector`      | Select optimal prompting level for task complexity                                  | ⭐         | [Guide](./docs/tools/hierarchy-level-selector.md)      |
| `spark-prompt-builder`          | Build UI/UX product prompts with structured inputs (colors, typography, components) | ⭐⭐⭐     | [Guide](./docs/tools/spark-prompt-builder.md)          |

**💡 Pro Tip**: Start with ⭐ tools to learn the basics, then progress to ⭐⭐⭐+ tools for advanced workflows.

---

## VS Code Integration (One-Click)

Use buttons below to add this MCP server to VS Code (User Settings → mcp.servers):

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPX-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22mcp-ai-agent-guidelines%3Alatest%22%5D%7D)
[![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPX-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22mcp-ai-agent-guidelines%3Alatest%22%5D%7D&quality=insiders)
[![Install with Docker in VS Code](https://img.shields.io/badge/VS_Code-Docker-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22ghcr.io%2Fanselmoo%2Fmcp-ai-agent-guidelines%3Alatest%22%5D%7D)
[![Install with Docker in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Docker-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22ghcr.io%2Fanselmoo%2Fmcp-ai-agent-guidelines%3Alatest%22%5D%7D&quality=insiders)

Manual settings (User Settings JSON):

```json
{
  "mcp": {
    "servers": {
      "ai-agent-guidelines": {
        "command": "npx",
        "args": ["-y", "mcp-ai-agent-guidelines"]
      }
    }
  }
}
```

Using Docker:

```json
{
  "mcp": {
    "servers": {
      "ai-agent-guidelines": {
        "command": "docker",
        "args": [
          "run",
          "--rm",
          "-i",
          "ghcr.io/anselmoo/mcp-ai-agent-guidelines:latest"
        ]
      }
    }
  }
}
```

## Use tools from a chat window (VS Code/Cline)

After adding the server, open your chat client (e.g., Cline in VS Code). The tools appear under the server name. You can:

- Run a tool directly by name:
  - `hierarchical-prompt-builder` — Provide context, goal, and optional requirements.
  - `clean-code-scorer` — Calculate comprehensive Clean Code score (0-100) with coverage metrics.
  - `code-hygiene-analyzer` — Paste code or point to a file and set language.
  - `mermaid-diagram-generator` — Describe the system and select a diagram type.
- Ask in natural language and pick the suggested tool.

Example prompts:

- "Use hierarchical-prompt-builder to create a refactor plan for src/index.ts with outputFormat markdown."
- "Use clean-code-scorer to analyze my project with current coverage metrics and get a quality score."
- "Analyze this Python file with code-hygiene-analyzer; highlight security issues."
- "Generate a Mermaid sequence diagram showing: User sends request to API, API queries Database, Database returns data, API responds to User."
- "Create an ER diagram for: Customer has Orders, Order contains LineItems, Product referenced in LineItems."
- "Build a user journey map for our checkout flow using mermaid-diagram-generator."

Tip: Most clients can pass file content automatically when you select a file and invoke a tool.

GitHub Chat (VS Code): In the chat, type your request and pick a tool suggestion, or explicitly reference a tool by name (e.g., “Use mermaid-diagram-generator to draw a flowchart for our pipeline”).

## Agent-Relative Calls

This MCP server fully supports **agent-relative calls**, the MCP standard pattern for enabling AI agents to discover and invoke tools contextually. Following the [GitHub MCP documentation](https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp), agents can use natural language patterns to orchestrate complex multi-tool workflows.

### What Are Agent-Relative Calls?

Agent-relative calls are natural language patterns like:

```markdown
Use the [tool-name] MCP to [action] with [parameters/context]
```

### Quick Examples

**Single Tool Invocation:**

```markdown
Use the hierarchical-prompt-builder MCP to create a code review prompt for our authentication module focusing on security best practices and OAuth2 implementation.
```

**Multi-Tool Workflow:**

```markdown
1. Use the clean-code-scorer MCP to establish baseline quality metrics
2. Use the code-hygiene-analyzer MCP to identify specific technical debt
3. Use the security-hardening-prompt-builder MCP to create a remediation plan
4. Use the sprint-timeline-calculator MCP to estimate implementation timeline
```

**Integration with Other MCP Servers:**

```markdown
# Accessibility Compliance Workflow

Use the Figma MCP to analyze design specifications for WCAG 2.1 AA compliance.
Use the security-hardening-prompt-builder MCP from AI Agent Guidelines to create accessibility security audit prompts.
Use the GitHub MCP to categorize open accessibility issues.
Use the iterative-coverage-enhancer MCP from AI Agent Guidelines to plan accessibility test coverage.
Use the Playwright MCP to create and run automated accessibility tests.
```

### Comprehensive Guide

For complete documentation with 20+ detailed examples, workflow patterns, and best practices, see:

📘 **[Agent-Relative Call Patterns Guide](./docs/AGENT_RELATIVE_CALLS.md)**

This guide covers:

- Core prompt patterns (single tool, chains, parallel, conditional)
- Tool categories with complete usage examples
- Multi-MCP server integration workflows
- Best practices for agent-driven development
- Performance optimization techniques
- Troubleshooting common issues

### Available Resources

Access agent-relative call guidance via MCP resources:

```markdown
Use the resource guidelines://agent-relative-calls to get comprehensive patterns and examples
```

Or access programmatically:

```typescript
// MCP ReadResource request
{
  uri: "guidelines://agent-relative-calls";
}
```

## Features

<details>
<summary><strong>🔗 Prompt Chaining Builder</strong> — Multi-step prompts with output passing</summary>

Usage: `prompt-chaining-builder`

| Parameter           | Required | Description                        |
| ------------------- | -------- | ---------------------------------- |
| `chainName`         | ✅       | Name of the prompt chain           |
| `steps`             | ✅       | Array of chain steps with prompts  |
| `description`       | ❌       | Description of chain purpose       |
| `context`           | ❌       | Global context for the chain       |
| `globalVariables`   | ❌       | Variables accessible to all steps  |
| `executionStrategy` | ❌       | sequential/parallel-where-possible |

Build sophisticated multi-step prompt workflows where each step can depend on outputs from previous steps. Supports error handling strategies (skip/retry/abort) and automatic Mermaid visualization.

**Example:**

```typescript
{
  chainName: "Security Analysis Pipeline",
  steps: [
    {
      name: "Scan",
      prompt: "Scan for vulnerabilities",
      outputKey: "vulns"
    },
    {
      name: "Assess",
      prompt: "Assess severity of {{vulns}}",
      dependencies: ["vulns"],
      errorHandling: "retry"
    }
  ]
}
```

</details>

<details>
<summary><strong>🌊 Prompt Flow Builder</strong> — Declarative flows with branching/loops</summary>

Usage: `prompt-flow-builder`

| Parameter      | Required | Description                                                 |
| -------------- | -------- | ----------------------------------------------------------- |
| `flowName`     | ✅       | Name of the prompt flow                                     |
| `nodes`        | ✅       | Flow nodes (prompt/condition/loop/parallel/merge/transform) |
| `edges`        | ❌       | Connections between nodes with conditions                   |
| `entryPoint`   | ❌       | Starting node ID                                            |
| `variables`    | ❌       | Flow-level variables                                        |
| `outputFormat` | ❌       | markdown/mermaid/both                                       |

Create complex adaptive prompt flows with conditional branching, loops, parallel execution, and merge points. Automatically generates Mermaid flowcharts and execution guides.

**Example:**

```typescript
{
  flowName: "Adaptive Code Review",
  nodes: [
    { id: "analyze", type: "prompt", name: "Analyze" },
    { id: "check", type: "condition", name: "Complex?",
      config: { expression: "complexity > 10" } },
    { id: "deep", type: "prompt", name: "Deep Review" },
    { id: "quick", type: "prompt", name: "Quick Check" }
  ],
  edges: [
    { from: "analyze", to: "check" },
    { from: "check", to: "deep", condition: "true" },
    { from: "check", to: "quick", condition: "false" }
  ]
}
```

</details>

<details>
<summary><strong>🔍 Semantic Code Analyzer</strong> — Symbol-based code understanding</summary>

Usage: `semantic-code-analyzer`

| Parameter      | Required | Description                                 |
| -------------- | -------- | ------------------------------------------- |
| `codeContent`  | ✅       | Code content to analyze                     |
| `language`     | ❌       | Programming language (auto-detected)        |
| `analysisType` | ❌       | symbols/structure/dependencies/patterns/all |

Performs semantic analysis to identify symbols, dependencies, patterns, and structure. Inspired by Serena's language server approach.

</details>

<details>
<summary><strong>🚀 Project Onboarding</strong> — Comprehensive project familiarization</summary>

Usage: `project-onboarding`

| Parameter         | Required | Description                               |
| ----------------- | -------- | ----------------------------------------- |
| `projectPath`     | ✅       | Path to project directory                 |
| `projectName`     | ❌       | Name of the project                       |
| `projectType`     | ❌       | library/application/service/tool/other    |
| `analysisDepth`   | ❌       | quick/standard/deep                       |
| `includeMemories` | ❌       | Generate project memories (default: true) |

Analyzes project structure, detects technologies, and generates memories for context retention. Based on Serena's onboarding system.

</details>

<details>
<summary><strong>🔄 Mode Switcher</strong> — Flexible agent operation modes</summary>

Usage: `mode-switcher`

| Parameter     | Required | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| `targetMode`  | ✅       | Mode to switch to (planning/editing/analysis/etc.) |
| `currentMode` | ❌       | Current active mode                                |
| `context`     | ❌       | Operating context (desktop-app/ide-assistant/etc.) |
| `reason`      | ❌       | Reason for mode switch                             |

Switches between operation modes with optimized tool sets and prompting strategies. Modes include: planning, editing, analysis, interactive, one-shot, debugging, refactoring, documentation.

</details>

<details>
<summary><strong>Hierarchical Prompt Builder</strong> — Build structured prompts with clear hierarchies</summary>

Usage: `hierarchical-prompt-builder`

| Parameter      | Required | Description                           |
| -------------- | -------- | ------------------------------------- |
| `context`      | ✅       | The broad context or domain           |
| `goal`         | ✅       | The specific goal or objective        |
| `requirements` | ❌       | Detailed requirements and constraints |
| `outputFormat` | ❌       | Desired output format                 |
| `audience`     | ❌       | Target audience or expertise level    |

</details>

<details>
<summary><strong>Code Hygiene Analyzer</strong> — Analyze codebase for outdated patterns and hygiene issues</summary>

Usage: `code-hygiene-analyzer`

| Parameter     | Required | Description                   |
| ------------- | -------- | ----------------------------- |
| `codeContent` | ✅       | Code content to analyze       |
| `language`    | ✅       | Programming language          |
| `framework`   | ❌       | Framework or technology stack |

</details>

<details>
<summary><strong>Security Hardening Prompt Builder</strong> — Build specialized security analysis and vulnerability assessment prompts</summary>

Usage: `security-hardening-prompt-builder`

| Parameter              | Required | Description                                                                                                                  |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `codeContext`          | ✅       | Code context or description to analyze for security                                                                          |
| `securityFocus`        | ❌       | Security analysis focus (vulnerability-analysis, security-hardening, compliance-check, threat-modeling, penetration-testing) |
| `securityRequirements` | ❌       | Specific security requirements to check                                                                                      |
| `complianceStandards`  | ❌       | Compliance standards (OWASP-Top-10, NIST-Cybersecurity-Framework, ISO-27001, SOC-2, GDPR, HIPAA, PCI-DSS)                    |
| `language`             | ❌       | Programming language of the code                                                                                             |
| `riskTolerance`        | ❌       | Risk tolerance level (low, medium, high)                                                                                     |
| `analysisScope`        | ❌       | Security areas to focus on (input-validation, authentication, authorization, etc.)                                           |
| `outputFormat`         | ❌       | Output format (detailed, checklist, annotated-code)                                                                          |

**Security Focus Areas:**

- 🔍 Vulnerability analysis with OWASP Top 10 coverage
- 🛡️ Security hardening recommendations
- 📋 Compliance checking against industry standards
- ⚠️ Threat modeling and risk assessment
- 🧪 Penetration testing guidance

**Compliance Standards:** OWASP Top 10, NIST Cybersecurity Framework, ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS

</details>

<details>
<summary><strong>Mermaid Diagram Generator</strong> — Generate professional diagrams from text descriptions</summary>

Usage: `mermaid-diagram-generator`

Generates Mermaid diagrams with intelligent parsing of descriptions for rich, customizable visualizations.

| Parameter          | Required | Description                                                                                                                      |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `description`      | ✅       | Description of the system or process to diagram. Be detailed and specific for better diagram generation.                         |
| `diagramType`      | ✅       | Type: `flowchart`, `sequence`, `class`, `state`, `gantt`, `pie`, `er`, `journey`, `quadrant`, `git-graph`, `mindmap`, `timeline` |
| `theme`            | ❌       | Visual theme: `default`, `dark`, `forest`, `neutral`                                                                             |
| `direction`        | ❌       | Flowchart direction: `TD`/`TB` (top-down), `BT` (bottom-top), `LR` (left-right), `RL` (right-left)                               |
| `strict`           | ❌       | If true, never emit invalid diagram; use fallback if needed (default: true)                                                      |
| `repair`           | ❌       | Attempt auto-repair on validation failure (default: true)                                                                        |
| `accTitle`         | ❌       | Accessibility title (added as Mermaid comment)                                                                                   |
| `accDescr`         | ❌       | Accessibility description (added as Mermaid comment)                                                                             |
| `customStyles`     | ❌       | Custom CSS/styling directives for advanced customization                                                                         |
| `advancedFeatures` | ❌       | Type-specific advanced features (e.g., `{autonumber: true}` for sequence diagrams)                                               |

**Enhanced Features:**

- **Intelligent Description Parsing**: All diagram types now parse descriptions to extract relevant entities, relationships, and structures
- **New Diagram Types**:
  - `er` - Entity Relationship diagrams for database schemas
  - `journey` - User journey maps for UX workflows
  - `quadrant` - Quadrant/priority charts for decision matrices
  - `git-graph` - Git commit history visualization
  - `mindmap` - Hierarchical concept maps
  - `timeline` - Event timelines and roadmaps
- **Advanced Customization**: Direction control, themes, custom styles, and type-specific features
- **Smart Fallbacks**: Generates sensible default diagrams when description parsing is ambiguous

**Examples:**

```bash
# Sequence diagram with participants auto-detected from description
{
  "description": "User sends login request to API. API queries Database for credentials. Database returns user data. API responds to User with token.",
  "diagramType": "sequence",
  "advancedFeatures": {"autonumber": true}
}

# Class diagram with relationships extracted
{
  "description": "User has id and email. Order contains Product items. User places Order. Product has price and name.",
  "diagramType": "class"
}

# ER diagram for database schema
{
  "description": "Customer places Order. Order contains LineItem. Product is referenced in LineItem.",
  "diagramType": "er"
}

# User journey map
{
  "description": "Shopping Journey. Section Discovery: User finds product. User reads reviews. Section Purchase: User adds to cart. User completes checkout.",
  "diagramType": "journey"
}

# Gantt chart with tasks from description
{
  "description": "Project: Feature Development. Phase Planning: Research requirements. Design architecture. Phase Development: Implement backend. Create frontend. Phase Testing: QA validation.",
  "diagramType": "gantt"
}

# Flowchart with custom direction
{
  "description": "Receive request. Validate input. Process data. Return response.",
  "diagramType": "flowchart",
  "direction": "LR"
}
```

</details>

<details>
<summary><strong>Memory Context Optimizer</strong> — Optimize prompt caching and context window usage</summary>

Usage: `memory-context-optimizer`

| Parameter        | Required | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `contextContent` | ✅       | Context content to optimize                        |
| `maxTokens`      | ❌       | Maximum token limit                                |
| `cacheStrategy`  | ❌       | Strategy: `aggressive`, `conservative`, `balanced` |

</details>

<details>
<summary><strong>Sprint Timeline Calculator</strong> — Calculate optimal development cycles and sprint timelines</summary>

Usage: `sprint-timeline-calculator`

| Parameter      | Required | Description                             |
| -------------- | -------- | --------------------------------------- |
| `tasks`        | ✅       | List of tasks with estimates            |
| `teamSize`     | ✅       | Number of team members                  |
| `sprintLength` | ❌       | Sprint length in days                   |
| `velocity`     | ❌       | Team velocity (story points per sprint) |

</details>

<details>
<summary><strong>Model Compatibility Checker</strong> — Recommend best AI models for specific tasks</summary>

Usage: `model-compatibility-checker`

| Parameter         | Required | Description                                              |
| ----------------- | -------- | -------------------------------------------------------- |
| `taskDescription` | ✅       | Description of the task                                  |
| `requirements`    | ❌       | Specific requirements (context length, multimodal, etc.) |
| `budget`          | ❌       | Budget constraints: `low`, `medium`, `high`              |

</details>

<details>
<summary><strong>Guidelines Validator</strong> — Validate development practices against established guidelines</summary>

Usage: `guidelines-validator`

| Parameter             | Required | Description                                                                                     |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `practiceDescription` | ✅       | Description of the development practice                                                         |
| `category`            | ✅       | Category: `prompting`, `code-management`, `architecture`, `visualization`, `memory`, `workflow` |

</details>

## Configuration

- Node.js 20+ required (see `engines` in `package.json`).
- Tools are exposed by the MCP server and discoverable via client schemas.
- Mermaid diagrams render client-side (Markdown preview). No server rendering.

## Versioning

- Package version: `0.7.0` (matches internal resource versions).
- Tags `vX.Y.Z` trigger CI for NPM and Docker releases.
- Pin exact versions for production stability.

### Release Setup

Use the [Release Setup Issue Form](.github/ISSUE_TEMPLATE/release-setup.yml) to streamline the release process:

- **Automated version management**: Update version numbers across the codebase
- **GitHub Copilot compatible**: Structured form enables bot automation
- **Quality gates**: Pre-release checklist ensures reliability
- **CI/CD integration**: Supports existing NPM and Docker publishing workflow

To create a new release, [open a release setup issue](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/new?template=release-setup.yml) with the target version and release details.

## Development

Prerequisites:

- Node.js 20+
- npm 10+

Setup:

```bash
git clone https://github.com/Anselmoo/mcp-ai-agent-guidelines.git
cd mcp-ai-agent-guidelines
npm install
npm run build
npm start
```

Project structure:

```
/src      - TypeScript source (tools, resources, server)
/tests    - Test files and utilities
/scripts  - Shell scripts and helpers
/demos    - Demo scripts and generated artifacts
/.github  - CI and community health files
```

Testing and quality:

```bash
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:demo        # Demo runner
npm run test:mcp         # MCP smoke script
npm run test:coverage:unit # Unit test coverage (text-summary, lcov, html)
npm run quality          # Type-check + Biome check
npm run audit            # Security audit (production dependencies)
npm run audit:fix        # Auto-fix vulnerabilities
npm run audit:production # Audit production dependencies only
```

### Automated Demo Regeneration 🔄

Demo files are automatically regenerated when tools change via GitHub Actions:

- **Trigger**: Any changes to `src/tools/**/*.ts` in a pull request
- **Action**: Automatically runs `npm run test:demo` to regenerate demos
- **Result**: Updated demo files are committed to the PR automatically

**Benefits**:

- ✅ Documentation always stays in sync with code
- ✅ No manual steps to remember
- ✅ Reviewers can see demo changes alongside code changes

**Workflow**: [`.github/workflows/auto-regenerate-demos.yml`](./.github/workflows/auto-regenerate-demos.yml)

**Manual regeneration** (if needed):

```bash
npm run build
npm run test:demo
```

### Git Hooks with Lefthook 🪝

This project uses [Lefthook](https://github.com/evilmartians/lefthook) for fast, reliable Git hooks that enforce code quality and security standards.

**Mandatory for GitHub Copilot Agent**: All quality gates must pass before commits and pushes.

Setup (automatic via `npm install`):

```bash
npm run hooks:install    # Install lefthook git hooks
npm run hooks:uninstall  # Remove lefthook git hooks
npx lefthook run pre-commit  # Run pre-commit checks manually
npx lefthook run pre-push    # Run pre-push checks manually
```

**Pre-commit hooks** (fast, parallel execution):

- 🔒 **Security**: Gitleaks secret detection
- 🟨 **Code Quality**: Biome formatting & linting
- 🔷 **Type Safety**: TypeScript type checking
- 🧹 **Code Hygiene**: Trailing whitespace & EOF fixes

**Pre-push hooks** (comprehensive validation):

- 🔒 **Security Audit**: Dependency vulnerability scanning (moderate+ level)
- 🧪 **Testing**: Full test suite (unit, integration, demo, MCP)
- ⚡ **Quality**: Type checking + Biome validation

**Why Lefthook?**

- ⚡ **Fast**: Written in Go, parallel execution
- 🔄 **Reliable**: Better error handling than pre-commit
- 🤖 **CI Integration**: Mandatory quality gates for GitHub Copilot Agent
- 📝 **Simple**: Single YAML configuration file

Configuration: [`lefthook.yml`](./lefthook.yml)

### Coverage reporting

- CI publishes a coverage summary in the job’s Summary and uploads `coverage/` as an artifact.
- Coverage is also uploaded to Codecov on Node 22 runs; see the badge above for status.

## Docker

```bash
# Run with Docker
docker run -p 3000:3000 ghcr.io/anselmoo/mcp-ai-agent-guidelines:latest

# Build locally
docker build -t mcp-ai-agent-guidelines .
docker run -p 3000:3000 mcp-ai-agent-guidelines
```

VS Code + Docker settings:

```json
{
  "mcp": {
    "servers": {
      "mcp-ai-agent-guidelines": {
        "command": "docker",
        "args": [
          "run",
          "--rm",
          "-i",
          "ghcr.io/anselmoo/mcp-ai-agent-guidelines:latest"
        ]
      }
    }
  }
}
```

## Security

- **Dependency Scanning**: Automated vulnerability scanning runs on every PR and push to main
  - Production dependencies: fails on moderate+ vulnerabilities
  - All dependencies: audited and reported (dev dependencies don't block builds)
  - Local audit: `npm run audit` or `npm audit --audit-level=moderate`
  - Auto-fix: `npm run audit:fix` to automatically fix vulnerabilities when possible
  - Pre-push hook: automatically checks for vulnerabilities before pushing code
- **Secrets Protection**: No secrets committed; releases use provenance where supported
- **Supply Chain Security**: Docker images are signed (Cosign); artifacts signed via Sigstore
- **Vulnerability Reporting**: Report security issues via [GitHub Security tab](https://github.com/Anselmoo/mcp-ai-agent-guidelines/security) or Issues

### Remediation Steps for Maintainers

When vulnerabilities are detected:

1. **Review the vulnerability**: `npm audit` provides details about affected packages
2. **Update dependencies**: `npm run audit:fix` to apply automatic fixes
3. **Manual updates**: If auto-fix doesn't work, update package.json manually:
   ```bash
   npm update <package-name>
   # or for major version updates
   npm install <package-name>@latest
   ```
4. **Test changes**: Run `npm run test:all` to ensure updates don't break functionality
5. **Override if needed**: For false positives or accepted risks, document in security policy

## Documentation

- MCP Specification: https://modelcontextprotocol.io/
- Tools implementation: see `src/tools/` in this repo.
- Generated examples: see `demos/` and links above.

## Disclaimer

This project references third-party tools, frameworks, APIs, and services for informational purposes. See [DISCLAIMER.md](./DISCLAIMER.md) for important information about external references, trademarks, and limitations of liability.

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Developer Resources

- **[Complete Documentation](./docs/README.md)** - Full documentation index
- **[Clean Code Standards](./docs/CLEAN_CODE_INITIATIVE.md)** - Quality requirements and scoring
- **[Error Handling Patterns](./docs/ERROR_HANDLING.md)** - Best practices for error handling
- **[Architecture Guide](./docs/BRIDGE_CONNECTORS.md)** - System architecture and integration patterns
- **[Type System Organization](./docs/TYPE_ORGANIZATION_EXTENSION.md)** - TypeScript conventions

### Quality Standards

- **TypeScript strict mode** - All code must pass type checking
- **100% test coverage goal** - See [Clean Code Initiative](./docs/CLEAN_CODE_INITIATIVE.md)
- **Biome linting** - Code must pass `npm run quality`
- **Git hooks** - Automated checks via Lefthook (see [lefthook.yml](./lefthook.yml))

Keep changes typed, linted, and include tests when behavior changes.

## License

MIT © Anselmoo — see [LICENSE](./LICENSE).

## References & Acknowledgments

For a comprehensive list of references, research papers, and detailed attribution, see **[docs/REFERENCES.md](./docs/REFERENCES.md)**.

### Key Acknowledgments

---

<div align="center">

<!-- Interactive SVG Footer -->
<img src="./docs/assets/readme-footer.svg" alt="" width="100%" aria-hidden="true">

**[⭐ Star this project](https://github.com/Anselmoo/mcp-ai-agent-guidelines)** • **[🐛 Report issues](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues)** • **[💡 Request features](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/new)**

</div>

- **Model Context Protocol team** for the specification
- **Anthropic** for prompt caching research
- **Mermaid community** for diagram tooling
- **[@ruvnet/claude-flow](https://github.com/ruvnet/claude-flow)** - Inspired flow-based prompting features
- **[@oraios/serena](https://github.com/oraios/serena)** - Influenced semantic analysis and mode switching
- **All open-source contributors** whose work has shaped this project

See [docs/REFERENCES.md](./docs/REFERENCES.md) for the complete list of research papers, projects, and inspirations.



<!-- AUTO-GENERATED INTERACTIVE FOOTER - DO NOT EDIT -->
<iframe
    src="https://raw.githubusercontent.com/Anselmoo/mcp-ai-agent-guidelines/main/docs/.frames-interactive/footer-README.html"
    style="width: 100%; height: 80px; border: none; display: block; margin: 0; padding: 0;"
    title="Interactive Footer"
    loading="lazy"
    sandbox="allow-scripts allow-same-origin"
></iframe>
<!-- END AUTO-GENERATED INTERACTIVE FOOTER -->

