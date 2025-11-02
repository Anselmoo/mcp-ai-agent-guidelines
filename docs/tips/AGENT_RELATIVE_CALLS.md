<!-- HEADER:START -->

![Header](../.frames-static/09-header.svg)

<!-- HEADER:END -->

# Agent-Relative Call Patterns

> **Invoking Tools in Workflows**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../README.md)
[![Documentation](https://img.shields.io/badge/📚-Documentation-blue?style=flat-square)](./README.md)
[![Technical Guide](https://img.shields.io/badge/Type-Technical_Guide-purple?style=flat-square)](#)

<details>
<summary><strong>📍 Quick Navigation</strong></summary>

**Related Guides:**

- [Documentation Index](#documentation-index)
- [AI Interaction Tips](#ai-interaction-tips)
- [Contributing](#contributing)

</details>

---

# Agent-Relative Call Patterns for MCP AI Agent Guidelines

## Overview

This guide demonstrates how to use **agent-relative calls** to invoke tools from the MCP AI Agent Guidelines server in AI agent workflows. Agent-relative calls enable natural language patterns like "Use the [Tool] MCP to..." that allow agents to discover, invoke, and chain tools contextually.

## What Are Agent-Relative Calls?

Agent-relative calls are natural language patterns in prompts that:

1. **Explicitly reference MCP tools** by name (e.g., "Use the hierarchical-prompt-builder MCP to...")
2. **Describe the desired outcome** clearly and specifically
3. **Provide context** for tool selection and parameter values
4. **Chain multiple tools** logically for complex workflows

### Example from GitHub Documentation

From the [GitHub MCP documentation](https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp):

```markdown
I need to make our customer portal WCAG 2.1 AA compliant. Use the Figma MCP to analyze our design specifications at https://figma.com/design/DESIGN-FILE-FOR-ACCESSIBILITY-SPECS?node-id=NODE_ID for accessibility requirements. Also use the GitHub MCP to find open GitHub issues with the labels accessibility or WCAG in the customer-portal repository.
```

This demonstrates:

- Clear goal statement
- Explicit MCP tool references
- Specific parameters and context
- Multiple tool coordination

## Core Prompt Patterns

### Pattern 1: Single Tool Invocation

```markdown
Use the [tool-name] MCP to [action] with [parameters/context]
```

**Example:**

```markdown
Use the hierarchical-prompt-builder MCP to create a structured code review prompt with:

- Context: React TypeScript application
- Goal: Identify performance bottlenecks
- Requirements: Focus on React hooks, re-renders, and bundle size
```

### Pattern 2: Sequential Tool Chain

```markdown
1. Use [tool-1] MCP to [action-1]
2. Use [tool-2] MCP to [action-2] based on results from step 1
3. Use [tool-3] MCP to [action-3] and compile findings
```

**Example:**

```markdown
1. Use the clean-code-scorer MCP to evaluate the authentication module
2. Use the code-hygiene-analyzer MCP to identify specific issues found
3. Use the security-hardening-prompt-builder MCP to create a remediation plan
```

### Pattern 3: Parallel Tool Execution

```markdown
Simultaneously:

- Use [tool-1] MCP to [action-1]
- Use [tool-2] MCP to [action-2]
- Use [tool-3] MCP to [action-3]

Then combine results to [final-action]
```

**Example:**

```markdown
Analyze our codebase using multiple perspectives:

- Use the clean-code-scorer MCP for overall quality metrics
- Use the dependency-auditor MCP for security vulnerabilities
- Use the semantic-code-analyzer MCP for code structure analysis

Compile findings into a prioritized improvement roadmap.
```

### Pattern 4: Conditional Tool Selection

```markdown
If [condition], use [tool-1] MCP to [action-1]
Otherwise, use [tool-2] MCP to [action-2]
```

**Example:**

```markdown
If the codebase is TypeScript:
Use the semantic-code-analyzer MCP to analyze type usage and interfaces
Otherwise:
Use the code-hygiene-analyzer MCP for general code quality assessment
```

## Tool Categories & Usage Patterns

### 1. Prompt Building Tools

**Purpose:** Generate structured, high-quality prompts for specific tasks

**Agent-Relative Call Pattern:**

```markdown
Use the [prompt-builder-name] MCP to create a [type] prompt for [purpose] with [requirements]
```

**Available Tools:**

- `hierarchical-prompt-builder` - Multi-level structured prompts
- `code-analysis-prompt-builder` - Code review and analysis prompts
- `architecture-design-prompt-builder` - System design prompts
- `debugging-assistant-prompt-builder` - Troubleshooting prompts
- `documentation-generator-prompt-builder` - Documentation prompts
- `security-hardening-prompt-builder` - Security analysis prompts
- `spark-prompt-builder` - UI/UX design prompts
- `domain-neutral-prompt-builder` - Generic workflow prompts

**Complete Example:**

```markdown
# Feature Development: Real-time Collaboration

I need comprehensive prompts for implementing a real-time collaboration feature.

## Prompt Creation Workflow

### Architecture Planning

Use the architecture-design-prompt-builder MCP to create a system design prompt with:

- System requirements: Real-time document editing, presence indicators, conflict resolution
- Scale: Medium (1000-5000 concurrent users)
- Technology stack: Node.js, Socket.io, Redis, PostgreSQL

### Implementation Guidance

Use the hierarchical-prompt-builder MCP to create structured implementation prompts for:

- Context: WebSocket-based real-time collaboration
- Goal: Implement operational transformation for conflict-free editing
- Requirements: Handle network failures, maintain consistency, support reconnection
- Techniques: Chain-of-thought for complex state management

### Security Review

Use the security-hardening-prompt-builder MCP to create security analysis prompts focusing on:

- Real-time data transmission security
- WebSocket authentication and authorization
- XSS prevention in collaborative content
- Rate limiting and DoS protection

Compile these prompts into a comprehensive implementation guide.
```

### 2. Code Analysis & Quality Tools

**Purpose:** Assess code quality, identify issues, and improve test coverage

**Agent-Relative Call Pattern:**

```markdown
Use the [analyzer-name] MCP to analyze [target] for [specific-concerns]
```

**Available Tools:**

- `clean-code-scorer` - Overall quality scoring (0-100)
- `code-hygiene-analyzer` - Technical debt identification
- `iterative-coverage-enhancer` - Test coverage analysis
- `dependency-auditor` - Security vulnerability scanning
- `semantic-code-analyzer` - Symbol and reference analysis

**Complete Example:**

```markdown
# Comprehensive Code Quality Assessment

Perform a complete quality assessment of our payment processing module.

## Analysis Workflow

### Baseline Quality

Use the clean-code-scorer MCP to evaluate the payment module at `src/payment/` and establish baseline metrics.

### Detailed Issues

Use the code-hygiene-analyzer MCP to scan `src/payment/` for:

- Outdated payment gateway integrations
- Unused dependencies
- Security anti-patterns in payment handling
- Code complexity in transaction processing

### Test Coverage

Use the iterative-coverage-enhancer MCP to:

- Analyze current test coverage for payment flows
- Identify critical untested paths (refunds, failed transactions, retries)
- Generate test suggestions for edge cases
- Recommend coverage thresholds for payment-critical code

### Dependency Security

Use the dependency-auditor MCP to audit all payment-related dependencies for known vulnerabilities, especially:

- Payment gateway SDKs
- Encryption libraries
- Validation libraries

### Code Structure

Use the semantic-code-analyzer MCP to:

- Map payment flow dependencies
- Identify tightly coupled payment components
- Find dead code in payment utilities

Compile all findings into a prioritized remediation plan with severity levels.
```

### 3. Strategy & Planning Tools

**Purpose:** Strategic analysis, gap identification, and project planning

**Agent-Relative Call Pattern:**

```markdown
Use the [strategy-tool] MCP to [analyze/plan] [aspect] considering [factors]
```

**Available Tools:**

- `strategy-frameworks-builder` - SWOT, Balanced Scorecard, Porter's Five Forces, etc.
- `gap-frameworks-analyzers` - Capability, technology, skills gap analysis
- `sprint-timeline-calculator` - Agile sprint estimation

**Complete Example:**

```markdown
# Strategic Planning: Microservices Migration

Plan the migration from monolith to microservices architecture.

## Strategic Analysis

### Framework Analysis

Use the strategy-frameworks-builder MCP to generate:

1. **SWOT Analysis** for microservices migration:

   - Context: Current monolithic e-commerce platform
   - Market: Growing need for scalability and independent deployment
   - Objectives: Reduce deployment time, improve scalability, enable team autonomy

2. **Porter's Five Forces** analysis:

   - Context: Cloud-native application development
   - Market: Enterprise e-commerce
   - Assess competitive pressures and technology vendor landscape

3. **Balanced Scorecard**:
   - Define KPIs for migration success across:
     - Financial: Infrastructure cost, development efficiency
     - Customer: Performance, availability
     - Internal: Deployment frequency, recovery time
     - Learning: Team capability, technology adoption

### Gap Analysis

Use the gap-frameworks-analyzers MCP to analyze:

**Technology Gaps:**

- Current state: Monolithic PHP application on traditional hosting
- Desired state: Microservices with containerization, service mesh, cloud-native
- Frameworks: Technology gap, process gap

**Capability Gaps:**

- Current: Waterfall development, manual deployment
- Desired: DevOps culture, CI/CD, automated testing
- Frameworks: Capability gap, skills gap

**Strategic Gaps:**

- Alignment with business goals
- Organizational readiness
- Risk mitigation strategies

### Timeline Estimation

Use the sprint-timeline-calculator MCP to estimate migration timeline with:

- Team size: 8 developers
- Velocity: Historical data shows 40 story points per sprint
- Complexity: Mix of medium (60%) and high (40%) complexity
- Consider: Training time, parallel operations, incremental migration

Synthesize all analyses into an executive summary with go/no-go recommendation.
```

### 4. Visualization & Documentation Tools

**Purpose:** Generate diagrams, optimize prompts, document systems

**Agent-Relative Call Pattern:**

```markdown
Use the [visual-tool] MCP to [generate/create] [artifact-type] showing [content]
```

**Available Tools:**

- `mermaid-diagram-generator` - Various diagram types (flowchart, sequence, ER, class, etc.)
- `memory-context-optimizer` - Prompt optimization for token efficiency
- `project-onboarding` - Project structure analysis

**Complete Example:**

```markdown
# System Documentation: Order Processing Pipeline

Create comprehensive documentation for our order processing system.

## Visualization

### Architecture Overview

Use the mermaid-diagram-generator MCP to create:

1. **System Architecture Diagram** (flowchart):

   - Show order ingestion, validation, payment, fulfillment, notification
   - Include external systems: Payment gateway, inventory, shipping
   - Highlight async processing and event-driven components

2. **Order State Machine**:

   - States: Pending, Validated, PaymentProcessing, Paid, Fulfilling, Shipped, Delivered, Cancelled
   - Transitions and triggers for each state change
   - Error handling and retry logic

3. **Sequence Diagram** for successful order:

   - Customer → API → OrderService → PaymentService → FulfillmentService
   - Include all async callbacks and event emissions

4. **Entity Relationship Diagram**:
   - Order, OrderItem, Payment, Shipment, Customer entities
   - Relationships and cardinality

### Process Documentation

Use the mermaid-diagram-generator MCP to create flowcharts for:

- Order validation process (business rules, inventory check)
- Payment processing flow (authorization, capture, refunds)
- Error handling and compensation logic
- Notification dispatch workflow

### Project Structure

Use the project-onboarding MCP to:

- Scan the order processing codebase
- Generate directory structure documentation
- Identify key entry points and dependencies
- Create developer onboarding guide

### Context Optimization

Use the memory-context-optimizer MCP to optimize the generated documentation for:

- Token efficiency in AI-assisted development
- Removal of redundant information
- Hierarchical organization for progressive disclosure

Compile all artifacts into a comprehensive system documentation package.
```

### 5. Development Workflow Tools

**Purpose:** Validation, model selection, workflow orchestration

**Agent-Relative Call Pattern:**

```markdown
Use the [workflow-tool] MCP to [validate/select/optimize] [aspect]
```

**Available Tools:**

- `guidelines-validator` - Best practice validation
- `model-compatibility-checker` - AI model recommendations
- `hierarchy-level-selector` - Prompt hierarchy selection
- `prompting-hierarchy-evaluator` - Prompt effectiveness evaluation
- `mode-switcher` - Planning/editing/analysis mode switching
- `prompt-chaining-builder` - Sequential prompt chains
- `prompt-flow-builder` - Parallel/conditional prompt flows

**Complete Example:**

```markdown
# Development Workflow Optimization

Optimize our development workflow for a new AI-assisted coding project.

## Workflow Design

### Guidelines Validation

Use the guidelines-validator MCP to validate our current practices against AI agent best practices:

- Category: Code management, architecture, workflow
- Practice: Current Git workflow, code review process, testing approach

### Model Selection

Use the model-compatibility-checker MCP to recommend AI models for:

- Task: Full-stack web development (React + Node.js)
- Requirements:
  - Long context window for large codebases
  - Strong TypeScript support
  - Good at API design
- Budget: Medium (balance cost and capability)

### Prompt Hierarchy

Use the hierarchy-level-selector MCP to determine appropriate prompting levels for:

- Junior developers (novice): Complex tasks with low autonomy → Scaffolding level
- Senior developers (expert): Exploratory tasks with high autonomy → Independent level
- Mid-level developers (intermediate): Standard tasks → Direct level

### Prompt Effectiveness

Use the prompting-hierarchy-evaluator MCP to:

- Evaluate current code review prompts
- Assess implementation guidance prompts
- Suggest improvements for clarity and effectiveness

### Workflow Orchestration

Use the prompt-flow-builder MCP to design:

- Feature development flow: Planning → Design → Implementation → Testing → Review
- Bug fix flow: Triage → Root cause → Fix → Test → Deploy
- Refactoring flow: Analysis → Planning → Incremental changes → Validation

Use the prompt-chaining-builder MCP to create sequential chains for:

- Onboarding new developers: Setup → Architecture overview → Code patterns → Practice tasks
- Release preparation: Feature freeze → Testing → Documentation → Deployment checklist

Compile into a comprehensive development workflow guide with role-based prompt templates.
```

### 6. Design & Architecture Tools

**Purpose:** Multi-phase design workflow management

**Agent-Relative Call Pattern:**

```markdown
Use the design-assistant MCP to [manage/orchestrate] [design-process] through [phases]
```

**Available Tool:**

- `design-assistant` - Comprehensive design workflow orchestration

**Complete Example:**

```markdown
# Complete Design Workflow: API Gateway Service

Design a new API gateway service for our microservices architecture.

## Design Session

### Session Initialization

Use the design-assistant MCP to start a design session:

- Action: start-session
- Session ID: api-gateway-design-2024
- Title: API Gateway Service Design
- Description: Centralized API gateway for microservices with authentication, rate limiting, and routing

### Discovery Phase

Use the design-assistant MCP to advance to discovery phase:

- Gather requirements:

  - Authentication: OAuth2, JWT
  - Rate limiting: Per-user, per-endpoint
  - Routing: Dynamic service discovery
  - Monitoring: Request/response logging, metrics
  - Security: DDoS protection, input validation

- Document constraints:
  - Must support 10,000 requests/second
  - 99.99% uptime SLA
  - Sub-100ms latency overhead

### Requirements Phase

Use the design-assistant MCP to advance to requirements phase:

- Functional requirements:

  - RESTful and GraphQL support
  - WebSocket proxying
  - API versioning
  - Request/response transformation

- Non-functional requirements:
  - Horizontal scalability
  - Zero-downtime deployments
  - Comprehensive monitoring and alerting
  - Automated failover

### Architecture Phase

Use the design-assistant MCP to advance to architecture phase:

- Architectural decisions:

  - Technology: Node.js with Express/Fastify
  - Service discovery: Consul or Kubernetes
  - Rate limiting: Redis-based token bucket
  - Authentication: Auth0 or custom OAuth2 server

- Generate architecture diagrams using mermaid-diagram-generator

### Implementation Phase

Use the design-assistant MCP to advance to implementation phase:

- Break down into implementation tasks
- Define API contracts
- Create database schemas
- Plan deployment strategy

### Artifact Generation

Use the design-assistant MCP to generate artifacts:

- Types: adr, specification, roadmap
- ADR: Document key architectural decisions (technology choices, patterns)
- Specification: Detailed API gateway specification
- Roadmap: Implementation timeline and milestones

### Consistency Validation

Use the design-assistant MCP to validate consistency:

- Check cross-phase dependencies
- Ensure all requirements are addressed in architecture
- Validate implementation aligns with architecture
- Confirm constraints are satisfied

### Coverage Enforcement

Use the design-assistant MCP to check coverage:

- Ensure all design phases meet minimum coverage thresholds
- Validate all artifacts are complete
- Check that all stakeholder concerns are addressed

This systematic approach ensures comprehensive, validated design documentation ready for implementation.
```

## Multi-MCP Server Integration

The AI Agent Guidelines MCP server is designed to work alongside other MCP servers in complex workflows.

### Example: Accessibility Compliance Project

```markdown
# Accessibility Compliance Implementation

Ensure our web application meets WCAG 2.1 AA standards using multiple MCP servers.

## Phase 1: Design Analysis (Figma MCP + AI Agent Guidelines MCP)

### Design Review

Use the Figma MCP to analyze design file at [figma-url]:

- Color contrast ratios for all text and interactive elements
- Typography accessibility (font sizes, line heights, spacing)
- Focus state indicators visibility
- Touch target sizes (minimum 44x44 pixels)

### Security Analysis

Use the security-hardening-prompt-builder MCP from AI Agent Guidelines to create an accessibility security audit prompt focusing on:

- XSS vulnerabilities in dynamic content
- ARIA attribute injection risks
- Screen reader content security

## Phase 2: Issue Management (GitHub MCP + AI Agent Guidelines MCP)

### Issue Discovery

Use the GitHub MCP to search repository for issues with labels:

- `accessibility`, `a11y`, `WCAG`, `screen-reader`, `keyboard-nav`

### Issue Analysis

Use the strategy-frameworks-builder MCP from AI Agent Guidelines to categorize issues:

- Priority matrix: Impact vs. Effort
- Severity classification: Critical, High, Medium, Low
- Component grouping: Navigation, Forms, Content, Media

### Sprint Planning

Use the sprint-timeline-calculator MCP from AI Agent Guidelines to estimate:

- Team capacity and velocity
- Issue complexity (story points)
- Sprint allocation for phased rollout

## Phase 3: Code Analysis (AI Agent Guidelines MCP)

### Quality Assessment

Use the clean-code-scorer MCP to evaluate accessibility-related code modules.

Use the code-hygiene-analyzer MCP to identify:

- Missing ARIA attributes
- Keyboard navigation gaps
- Semantic HTML violations
- Color contrast issues in CSS

### Test Coverage

Use the iterative-coverage-enhancer MCP to:

- Analyze accessibility test coverage
- Identify untested user flows for assistive technologies
- Generate test suggestions for:
  - Screen reader navigation
  - Keyboard-only interaction
  - High contrast mode
  - Text scaling

## Phase 4: Implementation (AI Agent Guidelines MCP)

### Implementation Prompts

Use the hierarchical-prompt-builder MCP to create structured prompts for:

- Semantic HTML refactoring
- ARIA attribute implementation
- Keyboard navigation enhancement
- Focus management improvements

### Architecture Updates

Use the mermaid-diagram-generator MCP to document:

- Accessibility architecture overview
- Focus management flow
- Screen reader announcement strategy
- Keyboard navigation state machine

## Phase 5: Testing (Playwright MCP + AI Agent Guidelines MCP)

### Test Creation

Use the Playwright MCP to create automated accessibility tests:

- Axe-core integration for automated checks
- Keyboard navigation tests
- Screen reader compatibility tests
- Color contrast validation

### Test Documentation

Use the documentation-generator-prompt-builder MCP from AI Agent Guidelines to document:

- Test coverage strategy
- Manual testing procedures
- Assistive technology compatibility matrix

## Phase 6: Validation (AI Agent Guidelines MCP)

### Best Practices Check

Use the guidelines-validator MCP to ensure:

- WCAG 2.1 AA compliance
- ARIA best practices
- Semantic HTML standards
- Keyboard accessibility patterns

### Dependency Audit

Use the dependency-auditor MCP to check accessibility library dependencies:

- Axe-core version
- ARIA helper libraries
- Focus trap utilities

## Phase 7: Documentation (GitHub MCP + AI Agent Guidelines MCP)

### Diagrams

Use the mermaid-diagram-generator MCP from AI Agent Guidelines to create:

- Accessibility testing workflow
- Component accessibility decision tree
- ARIA attribute usage guide

### Issue Updates

Use the GitHub MCP to:

- Update resolved issues with implementation details
- Link commits to accessibility fixes
- Create new issues for remaining work
- Update project board with progress

### Team Guidelines

Use the documentation-generator-prompt-builder MCP from AI Agent Guidelines to create:

- Accessibility development guidelines
- Code review checklist for accessibility
- Testing procedures for new features

This comprehensive workflow demonstrates how AI Agent Guidelines MCP server complements GitHub, Figma, and Playwright MCP servers for complex, multi-phase projects.
```

## Best Practices

### 1. Clear Goal Statements

✅ **Good:**

```markdown
Use the hierarchical-prompt-builder MCP to create a code review prompt for security vulnerabilities in authentication logic, focusing on OAuth2 implementation, token storage, and session management.
```

❌ **Bad:**

```markdown
Use the prompt builder to make a prompt about security.
```

### 2. Provide Context

✅ **Good:**

```markdown
Our Node.js API uses Express with TypeScript. Use the code-hygiene-analyzer MCP to scan src/api/ for:

- Outdated Express middleware patterns
- TypeScript type safety issues in route handlers
- Unused dependencies in package.json
```

❌ **Bad:**

```markdown
Analyze the code for issues.
```

### 3. Logical Tool Ordering

✅ **Good:**

```markdown
1. Use clean-code-scorer MCP for baseline (analysis)
2. Use code-hygiene-analyzer MCP for specific issues (deep dive)
3. Use security-hardening-prompt-builder MCP for security plan (action)
4. Use sprint-timeline-calculator MCP for estimation (planning)
```

❌ **Bad:**

```markdown
1. Use sprint calculator first
2. Then maybe analyze code
3. Do security if there's time
```

### 4. Set Clear Boundaries

✅ **Good:**

```markdown
Use the design-assistant MCP to plan the feature, but:

- Stop after requirements phase
- Do NOT advance to implementation
- Focus only on user authentication flow
- Exclude payment processing for now
```

❌ **Bad:**

```markdown
Plan the whole application with all features.
```

### 5. Request Confirmations

✅ **Good:**

```markdown
Before using the mermaid-diagram-generator MCP, please:

1. Confirm you understand the system architecture
2. List the diagrams you plan to create
3. Identify any missing information
4. Wait for my approval to proceed
```

❌ **Bad:**

```markdown
Make all the diagrams you think we need.
```

## Prompts and Resources Reference

### Available Prompts

Access these via MCP GetPrompt requests:

- **code-analysis-prompt** - Code analysis and review template
- **spark-ui-prompt** - UI/UX design template
- **hierarchical-task-prompt** - Task breakdown template
- **architecture-design-prompt** - System design template
- **debugging-assistant-prompt** - Troubleshooting template
- **documentation-generator-prompt** - Documentation template
- **security-analysis-prompt** - Security analysis template
- **agent-workflow-prompt** - Multi-tool workflow template

### Available Resources

Access these via MCP ReadResource requests:

- **guidelines://agent-relative-calls** - This guide (comprehensive patterns and examples)
- **guidelines://core-development-principles** - Development best practices with references
- **guidelines://core-principles** - Fundamental AI agent principles
- **guidelines://prompt-templates** - Reusable prompt patterns
- **guidelines://development-checklists** - Development workflow checklists
- **guidelines://model-selection** - AI model selection guide
- **guidelines://architecture-patterns** - Architectural patterns and best practices

## Performance Optimization

### Context Window Management

```markdown
# Efficient Context Usage

For large codebases, use progressive analysis:

1. Use the project-onboarding MCP to get high-level structure first
2. Use the memory-context-optimizer MCP to reduce token usage in subsequent prompts
3. Target specific modules rather than entire codebase
4. Cache common analysis results for reuse
```

### Batching Operations

```markdown
# Batch Related Analyses

Instead of multiple separate calls:
❌ Call code-hygiene-analyzer, then call clean-code-scorer, then call dependency-auditor

✅ Request all in one prompt:
Perform comprehensive code quality analysis:

- Use clean-code-scorer MCP for baseline metrics
- Use code-hygiene-analyzer MCP for technical debt
- Use dependency-auditor MCP for security issues
  Compile results into single report
```

### Incremental Workflows

```markdown
# Progressive Enhancement

Start broad, then drill down:

1. Use clean-code-scorer MCP for overall quality score
2. If score < 70, use code-hygiene-analyzer MCP for details
3. If critical issues found, use security-hardening-prompt-builder MCP
4. For high-priority fixes only, use sprint-timeline-calculator MCP

This avoids running unnecessary analyses.
```

## Troubleshooting

### Tool Selection Confusion

**Problem:** Agent uses wrong tool for task

**Solution:** Be explicit about which tool to use

```markdown
Use the security-hardening-prompt-builder MCP (not the general code-analysis-prompt-builder) to create a security-focused analysis prompt with OWASP Top 10 coverage.
```

### Missing Context

**Problem:** Tool outputs are too generic

**Solution:** Provide detailed context

```markdown
Use the hierarchical-prompt-builder MCP to create a prompt for:

- Context: Legacy Java Spring application being modernized to Spring Boot
- Goal: Migrate XML configuration to Java annotations
- Requirements: Maintain backward compatibility, update tests, document changes
- Audience: Mid-level Java developers familiar with Spring but new to Spring Boot
```

### Workflow Interruptions

**Problem:** Multi-step workflows break down

**Solution:** Use numbered steps with confirmation points

```markdown
Complete this analysis in phases:

Phase 1: Use clean-code-scorer MCP for baseline
→ PAUSE and share score

Phase 2: If score < 80, use code-hygiene-analyzer MCP
→ PAUSE and share top 5 issues

Phase 3: For critical issues only, use security-hardening-prompt-builder MCP
→ PAUSE and get approval

Phase 4: Use sprint-timeline-calculator MCP for approved fixes
```

## References

- [GitHub: Enhance Agent Mode with MCP](https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp)
- [Anthropic: Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/introduction)
- [Cloudflare: MCP Architecture](https://developers.cloudflare.com/agents/model-context-protocol/)
- [LangChain: MCP Integration](https://docs.langchain.com/oss/python/langchain/mcp)
- [Microsoft: Building Agents with MCP on Azure](https://learn.microsoft.com/en-us/azure/developer/ai/intro-agents-mcp)
- [MCP AI Agent Guidelines Repository](https://github.com/Anselmoo/mcp-ai-agent-guidelines)

## Contributing

To suggest improvements to agent-relative call patterns or add new examples:

1. Open an issue describing the pattern or example
2. Provide context about the use case
3. Include sample prompts demonstrating the pattern
4. Submit a PR with documentation updates

---

**Version:** 1.0.0
**Last Updated:** 2025-10-27
**Maintainer:** Anselmoo

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

---

<details>
<summary><strong>📚 Related Documentation</strong></summary>

- [AI Interaction Tips](./AI_INTERACTION_TIPS.md)
- [Prompting Hierarchy](./PROMPTING_HIERARCHY.md)
- [Design Assistant](./AI_INTERACTION_TIPS.md#design-assistant)
- [Tools Reference](./TOOLS_REFERENCE.md)

</details>

<!-- END AUTO-GENERATED FOOTER -->

<!-- FOOTER:START -->

![Footer](../.frames-static/09-footer.svg)

<!-- FOOTER:END -->
