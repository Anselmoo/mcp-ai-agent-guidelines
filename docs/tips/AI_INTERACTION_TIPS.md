<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# AI Interaction Tips

> **Prompting Strategies & Best Practices**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../README.md)
[![Documentation](https://img.shields.io/badge/📚-Documentation-blue?style=flat-square)](./README.md)
[![User Guide](https://img.shields.io/badge/Type-User_Guide-purple?style=flat-square)](#)

<details>
<summary><strong>📍 Quick Navigation</strong></summary>

**Related Guides:**

- [Documentation Index](./README.md)
- [Prompting Hierarchy](./PROMPTING_HIERARCHY.md)
- [Hierarchical Prompt Builder](../tools/hierarchical-prompt-builder.md)
- [Tool Reference](./TOOLS_REFERENCE.md)

</details>

---

# AI Interaction Tips: Leveraging Specialized Tools Effectively

## Overview

This guide helps you move beyond generic questions to leverage the full suite of specialized tools available in the MCP AI Agent Guidelines server. By learning how to ask **targeted, tool-oriented questions**, you can achieve better results and unlock capabilities you might not have known were available.

## The Problem with Generic Questions

Many users underutilize the available tools because they ask generic questions that don't naturally map to specific tool capabilities. For example:

❌ **Generic**: "Help me improve my code"
❌ **Generic**: "Analyze this application"
❌ **Generic**: "Create documentation"

While these questions can be answered, they often lead to suboptimal tool selection or incomplete use of specialized features.

## Solution: Targeted Questions That Map to Tools

By formulating more specific questions, you guide the AI to select the most appropriate specialized tools. This section provides concrete examples organized by tool category.

---

## Leveraging Specialized Tools with Targeted Questions

### 1. Code Generation & Refactoring

#### Hierarchical Prompt Building

**Instead of**: "Help me write better code"

**Ask**:

- "Create a structured prompt for refactoring my authentication module with context about OAuth2 implementation and goals focused on security best practices"
- "Build a hierarchical prompt for implementing a new REST API endpoint with requirements for input validation, error handling, and documentation"
- "Generate a scaffolded prompt for migrating from JavaScript to TypeScript with step-by-step guidance"

**Tool Used**: `hierarchical-prompt-builder`

#### Code Analysis & Quality Scoring

**Instead of**: "Is my code good quality?"

**Ask**:

- "Calculate a comprehensive Clean Code score for my project with current test coverage at 85% and identify areas below the quality threshold"
- "Analyze this Python module for outdated patterns, unused dependencies, and code hygiene issues"
- "Score my TypeScript codebase and break down metrics for coverage, linting, type safety, and security"

**Tools Used**: `clean-code-scorer`, `code-hygiene-analyzer`

#### Architecture & Design Prompts

**Instead of**: "Help me design a system"

**Ask**:

- "Create an architecture design prompt for a microservices-based e-commerce platform with requirements for scalability, data consistency, and API gateway patterns"
- "Build a distinguished engineer-level prompt for evaluating our current monolith architecture and planning a migration strategy"
- "Generate a domain-neutral prompt template for designing a message queue system with workflow steps and acceptance criteria"

**Tools Used**: `architecture-design-prompt-builder`, `l9-distinguished-engineer-prompt-builder`, `domain-neutral-prompt-builder`

### 2. Data Analysis & Visualization

#### Mermaid Diagrams

**Instead of**: "Draw a diagram of my system"

**Ask**:

- "Generate a sequence diagram showing the OAuth2 authorization code flow: User requests login → API redirects to provider → Provider authenticates → API receives token → API returns session"
- "Create an ER diagram for my database schema with entities: Customer has Orders, Order contains LineItems, Product referenced in LineItems"
- "Build a user journey map for our checkout flow: Discovery section (browse products, read reviews), Purchase section (add to cart, enter payment), Confirmation section (review order, receive email)"
- "Generate a Gantt chart for our sprint with tasks: Backend API (5 days), Frontend components (4 days), Integration testing (2 days)"

**Tool Used**: `mermaid-diagram-generator`

#### Semantic Code Analysis

**Instead of**: "What does this code do?"

**Ask**:

- "Perform semantic analysis on this TypeScript module to identify all exported symbols, their dependencies, and usage patterns"
- "Analyze the code structure of this React component to show hooks, state management, and component relationships"
- "Map dependencies in this Python package and identify circular imports or tight coupling patterns"

**Tool Used**: `semantic-code-analyzer`

### 3. Workflow & Automation

#### Prompt Chaining & Flow

**Instead of**: "Create a workflow"

**Ask**:

- "Build a prompt chain for security analysis with steps: 1) Scan for vulnerabilities → 2) Assess severity of findings → 3) Generate remediation plan → 4) Calculate implementation timeline"
- "Create a declarative flow with branching: Analyze code complexity → If complexity > 10, perform deep review, else run quick check → Merge results and generate report"
- "Design a parallel workflow to simultaneously analyze code quality, security vulnerabilities, and test coverage, then combine findings into a prioritized action plan"

**Tools Used**: `prompt-chaining-builder`, `prompt-flow-builder`

#### Sprint Planning & Timeline Calculation

**Instead of**: "How long will this take?"

**Ask**:

- "Calculate optimal sprint timeline for 8 tasks (3 story points each) with a 5-person team, 2-week sprints, and velocity of 25 points per sprint"
- "Generate a development timeline for features: Auth system (8 points), Dashboard (5 points), Reports (13 points) with a team velocity of 20 points per sprint"
- "Estimate the number of sprints needed for a backlog of 15 tasks totaling 75 story points with a 6-person team"

**Tool Used**: `sprint-timeline-calculator`

#### Mode Switching for Different Tasks

**Instead of**: "Switch to X mode"

**Ask**:

- "Switch to planning mode for designing a new feature with emphasis on requirement gathering and architecture decisions"
- "Enter debugging mode with optimized toolset for analyzing stack traces and reproducing issues"
- "Activate refactoring mode focused on code restructuring without changing external behavior"

**Tool Used**: `mode-switcher`

### 4. Security & Compliance

#### Security Hardening Analysis

**Instead of**: "Check for security issues"

**Ask**:

- "Build a security hardening prompt for vulnerability analysis of our authentication system with OWASP Top 10 compliance checking and focus on input validation and session management"
- "Create a threat modeling prompt for our payment processing module with PCI-DSS compliance requirements and risk tolerance set to low"
- "Generate security audit prompts for our API gateway covering authentication, authorization, data encryption, and logging/monitoring"

**Tool Used**: `security-hardening-prompt-builder`

#### Dependency Auditing

**Instead of**: "Are my dependencies safe?"

**Ask**:

- "Audit all production dependencies for security vulnerabilities at moderate severity level or higher"
- "Check for outdated dependencies in my package.json and identify which ones have security patches available"
- "Analyze dependency tree for known CVEs and provide upgrade recommendations with risk assessment"

**Tool Used**: `dependency-auditor`

#### Coverage Enhancement

**Instead of**: "Improve test coverage"

**Ask**:

- "Analyze coverage gaps in my test suite (current: 72% lines, 65% branches) and generate specific test suggestions for uncovered code paths"
- "Detect dead code that can be eliminated to improve coverage metrics and reduce maintenance burden"
- "Recommend adaptive coverage thresholds based on project complexity and generate CI/CD integration actions"

**Tool Used**: `iterative-coverage-enhancer`

---

## Advanced Techniques

### Multi-Tool Workflows

Combine multiple tools for comprehensive analysis:

```markdown
1. Use clean-code-scorer to establish baseline quality metrics (current coverage, linting score)
2. Use code-hygiene-analyzer to identify specific technical debt and outdated patterns
3. Use security-hardening-prompt-builder to create remediation plan for security issues
4. Use iterative-coverage-enhancer to generate test suggestions for uncovered code
5. Use sprint-timeline-calculator to estimate implementation timeline for all improvements
6. Use mermaid-diagram-generator to create a Gantt chart visualizing the improvement roadmap
```

### Strategy & Planning Tools

For high-level strategic work:

**Instead of**: "Help with business planning"

**Ask**:

- "Build a SWOT analysis framework for our product roadmap with focus on competitive positioning and market opportunities"
- "Create a gap analysis comparing current capabilities (manual deployment, 60% test coverage) to desired state (CI/CD automation, 90% coverage) with performance and maturity frameworks"
- "Generate a strategy map using the Balanced Scorecard framework for our Q1 objectives across financial, customer, process, and learning perspectives"

**Tools Used**: `strategy-frameworks-builder`, `gap-frameworks-analyzers`

### Project Onboarding

For understanding new codebases:

**Instead of**: "Tell me about this project"

**Ask**:

- "Perform deep project onboarding analysis for /path/to/project with comprehensive structure scanning, technology detection, and memory generation for context retention"
- "Quick onboard to this library project and identify key entry points, architecture patterns, and testing approach"
- "Analyze this service-type project's structure and generate memories for dependencies, APIs, and deployment configuration"

**Tool Used**: `project-onboarding`

### Model Selection & Compatibility

**Instead of**: "Which AI model should I use?"

**Ask**:

- "Recommend the best AI model for code generation tasks requiring 32K context window, with medium budget constraints"
- "Check model compatibility for multimodal analysis (code + diagrams) with requirements for long context and vision capabilities"
- "Suggest models for real-time chat applications with low latency requirements and high throughput"

**Tool Used**: `model-compatibility-checker`

---

## Best Practices

### 1. Be Specific About Context

Include relevant details like programming language, framework, domain, and constraints.

✅ **Good**: "Analyze this React TypeScript component for performance issues related to re-renders and hook dependencies"
❌ **Bad**: "Analyze this code"

### 2. Specify Desired Output Format

Many tools support multiple output formats (markdown, JSON, LaTeX, CSV).

✅ **Good**: "Generate a sequence diagram in Mermaid format with dark theme and left-to-right orientation"
❌ **Bad**: "Make a diagram"

### 3. Provide Success Criteria

Help the AI understand what "done" looks like.

✅ **Good**: "Create a hierarchical prompt for API design with requirements for RESTful principles, OpenAPI compliance, and error handling patterns"
❌ **Bad**: "Create a prompt for API design"

### 4. Leverage Composability

Chain multiple tool invocations for complex workflows instead of trying to do everything in one request.

### 5. Use Agent-Relative Call Patterns

When working with multiple MCP servers, use explicit tool references:

```markdown
Use the hierarchical-prompt-builder MCP from AI Agent Guidelines to create the initial structure
Use the GitHub MCP to analyze existing issues and PRs
Use the mermaid-diagram-generator MCP from AI Agent Guidelines to visualize the workflow
```

---

## Tips for Discovery

### Explore Tool Descriptions

Each tool has a detailed description. Review them to understand capabilities:

- Check tool parameters and what options are available
- Look for examples in the tool descriptions
- Note which parameters are required vs. optional

### Start with Your Goal

Think about what you want to achieve, then reverse-engineer the question:

1. What's the end result I need?
2. What information or format do I need it in?
3. What context is necessary to get a quality result?

### Learn from Examples

This repository includes comprehensive demo files showing tool usage:

- Check `demos/` directory for real examples
- Review `docs/tips/AGENT_RELATIVE_CALLS.md` for workflow patterns
- See `docs/tips/FLOW_PROMPTING_EXAMPLES.md` for advanced chaining

### Iterate and Refine

If the first result isn't perfect:

- Add more context or constraints
- Specify output format preferences
- Break complex requests into smaller steps

---

## Summary

The key to effective AI interaction is **asking questions that naturally map to specialized tool capabilities**. Instead of generic requests:

1. **Identify your specific need** (code quality? visualization? planning? security?)
2. **Formulate a targeted question** with relevant context and constraints
3. **Specify desired outcomes** including format and success criteria
4. **Chain tools** for complex multi-step workflows

By following these patterns, you'll unlock the full power of the MCP AI Agent Guidelines toolset and achieve more precise, actionable results.

---

## Additional Resources

- **[Agent-Relative Call Patterns](./AGENT_RELATIVE_CALLS.md)** - Comprehensive guide to invoking tools in workflows
- **[Prompting Hierarchy](./PROMPTING_HIERARCHY.md)** - Understanding prompt levels and evaluation
- **[Flow Prompting Examples](./FLOW_PROMPTING_EXAMPLES.md)** - Advanced chaining and orchestration
- **[Demo Reports](../../demos/README.md)** - Real-world tool usage examples

For more information about specific tools, see the main [README.md](../README.md).

<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
