# MCP Tools Reference

**Complete guide to all 27 Model Context Protocol (MCP) tools provided by this server.**

---

## 📋 Table of Contents

- [Prompt Builders (9 tools)](#-prompt-builders)
- [Code Analysis & Quality (7 tools)](#-code-analysis--quality)
- [Strategy & Planning (5 tools)](#-strategy--planning)
- [Design Workflow (1 tool)](#-design-workflow)
- [Utilities (5 tools)](#-utilities)
- [Quick Reference Table](#quick-reference-table)

---

## 🎨 Prompt Builders

### 1. hierarchical-prompt-builder

**Purpose**: Build structured prompts with clear context → goal → requirements hierarchy.

**Key Parameters**:
- `context` (required): Broad domain/context
- `goal` (required): Specific objective
- `requirements`: Detailed constraints
- `techniques`: Prompting techniques (chain-of-thought, few-shot, etc.)
- `provider`: Model family (gpt-4.1, claude-3.7, gemini-2.5, etc.)

**Usage Example**:
```json
{
  "context": "React component development",
  "goal": "Code review prompt for performance optimization",
  "requirements": ["Check memoization", "Identify re-renders"],
  "techniques": ["chain-of-thought"],
  "provider": "claude-3.7"
}
```

**Related Tools**: prompting-hierarchy-evaluator, hierarchy-level-selector

---

### 2. code-analysis-prompt-builder

**Purpose**: Generate prompts for code analysis with security, performance, or maintainability focus.

**Key Parameters**:
- `codebase` (required): Code to analyze
- `language`: Programming language
- `focusArea`: security | performance | maintainability | general

**Usage Example**:
```json
{
  "codebase": "async function fetchData() { ... }",
  "language": "typescript",
  "focusArea": "performance"
}
```

**Related Tools**: code-hygiene-analyzer, clean-code-scorer

---

### 3. architecture-design-prompt-builder

**Purpose**: Create architecture design prompts with scale-appropriate guidance.

**Key Parameters**:
- `systemRequirements` (required): System requirements and constraints
- `scale`: small | medium | large
- `technologyStack`: Preferred tech stack

**Usage Example**:
```json
{
  "systemRequirements": "Real-time chat with 10K concurrent users",
  "scale": "medium",
  "technologyStack": "Node.js, WebSocket, Redis"
}
```

**Related Tools**: l9-distinguished-engineer-prompt-builder, digital-enterprise-architect-prompt-builder

---

### 4. digital-enterprise-architect-prompt-builder

**Purpose**: Guide enterprise architecture strategy with mentor perspectives and current research.

**Key Parameters**:
- `initiativeName` (required): Architecture initiative name
- `problemStatement` (required): Strategic problem/opportunity
- `businessDrivers`: Business objectives
- `researchFocus`: Topics to benchmark

**Usage Example**:
```json
{
  "initiativeName": "Cloud Migration Strategy",
  "problemStatement": "Migrate monolith to microservices",
  "businessDrivers": ["Reduce time-to-market", "Improve scalability"],
  "researchFocus": ["Kubernetes patterns", "Service mesh"]
}
```

**Related Tools**: architecture-design-prompt-builder, strategy-frameworks-builder

---

### 5. debugging-assistant-prompt-builder

**Purpose**: Generate systematic debugging prompts with structured analysis.

**Key Parameters**:
- `errorDescription` (required): Error/issue description
- `context`: Additional context
- `attemptedSolutions`: Solutions already tried

**Usage Example**:
```json
{
  "errorDescription": "React component not re-rendering after state update",
  "context": "Using useState hook",
  "attemptedSolutions": "Tried key prop, forceUpdate"
}
```

**Related Tools**: code-analysis-prompt-builder, semantic-code-analyzer

---

### 6. l9-distinguished-engineer-prompt-builder

**Purpose**: Generate L9 (Distinguished Engineer) level technical design prompts for high-level architecture.

**Key Parameters**:
- `projectName` (required): Software project name
- `technicalChallenge` (required): Core technical problem
- `techStack`: Technologies/frameworks
- `performanceTargets`: SLOs/SLAs

**Usage Example**:
```json
{
  "projectName": "Distributed Cache System",
  "technicalChallenge": "Sub-millisecond p99 latency at 1M RPS",
  "techStack": ["Rust", "Redis", "gRPC"],
  "performanceTargets": ["p99 < 1ms", "99.99% availability"]
}
```

**Related Tools**: architecture-design-prompt-builder, digital-enterprise-architect-prompt-builder

---

### 7. documentation-generator-prompt-builder

**Purpose**: Generate technical documentation prompts tailored to content type and audience.

**Key Parameters**:
- `contentType` (required): API | user guide | technical spec
- `targetAudience`: Intended audience
- `existingContent`: Content to build upon

**Usage Example**:
```json
{
  "contentType": "API",
  "targetAudience": "Frontend developers",
  "existingContent": "OpenAPI spec"
}
```

**Related Tools**: domain-neutral-prompt-builder

---

### 8. domain-neutral-prompt-builder

**Purpose**: Build domain-neutral prompts with objectives, workflow, capabilities, and acceptance criteria.

**Key Parameters**:
- `title` (required): Document title
- `summary` (required): One-paragraph summary
- `objectives`: Goals list
- `workflow`: Step-by-step workflow
- `capabilities`: Tool capabilities

**Usage Example**:
```json
{
  "title": "API Rate Limiting Implementation",
  "summary": "Design token bucket rate limiter",
  "objectives": ["Prevent abuse", "Fair resource allocation"],
  "workflow": ["Identify endpoints", "Set limits", "Implement middleware"]
}
```

**Related Tools**: hierarchical-prompt-builder, spark-prompt-builder

---

### 9. security-hardening-prompt-builder

**Purpose**: Build security hardening and vulnerability analysis prompts with OWASP/compliance focus.

**Key Parameters**:
- `codeContext` (required): Code to analyze
- `securityFocus`: vulnerability-analysis | security-hardening | compliance-check
- `complianceStandards`: OWASP-Top-10, NIST, ISO-27001, etc.

**Usage Example**:
```json
{
  "codeContext": "Express.js authentication middleware",
  "securityFocus": "vulnerability-analysis",
  "complianceStandards": ["OWASP-Top-10", "NIST-Cybersecurity-Framework"]
}
```

**Related Tools**: code-analysis-prompt-builder, guidelines-validator

---

## 🔍 Code Analysis & Quality

### 10. clean-code-scorer

**Purpose**: Calculate comprehensive Clean Code score (0-100) based on multiple quality metrics.

**Key Parameters**:
- `codeContent`: Code to analyze
- `language`: Programming language
- `framework`: Framework/tech stack
- `projectPath`: Project root directory
- `coverageMetrics`: Test coverage data

**Usage Example**:
```json
{
  "projectPath": "/path/to/project",
  "language": "typescript",
  "framework": "React",
  "coverageMetrics": {
    "lines": 85,
    "branches": 78,
    "functions": 90
  }
}
```

**Output**: Score 0-100 with breakdown (code hygiene, tests, TypeScript, linting, docs, security)

**Related Tools**: code-hygiene-analyzer, iterative-coverage-enhancer

---

### 11. code-hygiene-analyzer

**Purpose**: Analyze codebase for outdated patterns, unused dependencies, and hygiene issues.

**Key Parameters**:
- `codeContent` (required): Code to analyze
- `language` (required): Programming language
- `framework`: Framework/tech stack
- `includeReferences`: Include best-practice links

**Usage Example**:
```json
{
  "codeContent": "const user = users.find(u => u.id === id); ...",
  "language": "javascript",
  "framework": "Node.js"
}
```

**Output**: Outdated patterns, unused code, hygiene recommendations

**Related Tools**: clean-code-scorer, dependency-auditor

---

### 12. dependency-auditor

**Purpose**: Analyze package.json for outdated, deprecated, or insecure packages with modern alternatives.

**Key Parameters**:
- `packageJsonContent` (required): package.json content
- `checkOutdated`: Check for outdated versions
- `checkDeprecated`: Check for deprecated packages
- `checkVulnerabilities`: Check for known vulnerabilities
- `suggestAlternatives`: Suggest ESM-compatible alternatives

**Usage Example**:
```json
{
  "packageJsonContent": "{\"dependencies\": {\"lodash\": \"^4.17.0\"}}",
  "checkOutdated": true,
  "checkVulnerabilities": true,
  "suggestAlternatives": true
}
```

**Output**: Audit report with alternatives and security recommendations

**Related Tools**: code-hygiene-analyzer, clean-code-scorer

---

### 13. iterative-coverage-enhancer

**Purpose**: Analyze coverage gaps, detect dead code, generate test suggestions, adapt thresholds.

**Key Parameters**:
- `projectPath`: Project root directory
- `currentCoverage`: Current coverage metrics
- `targetCoverage`: Target coverage goals
- `generateTestSuggestions`: Generate test suggestions
- `detectDeadCode`: Detect unused code

**Usage Example**:
```json
{
  "projectPath": "/path/to/project",
  "currentCoverage": {"lines": 65, "branches": 58},
  "targetCoverage": {"lines": 85, "branches": 80},
  "generateTestSuggestions": true,
  "detectDeadCode": true
}
```

**Output**: Coverage gaps, test suggestions, dead code, adaptive thresholds

**Related Tools**: clean-code-scorer

---

### 14. semantic-code-analyzer

**Purpose**: Perform semantic analysis to identify symbols, structure, dependencies, and patterns.

**Key Parameters**:
- `codeContent` (required): Code to analyze
- `language`: Programming language (auto-detected)
- `analysisType`: symbols | structure | dependencies | patterns | all

**Usage Example**:
```json
{
  "codeContent": "export class UserService { ... }",
  "language": "typescript",
  "analysisType": "all"
}
```

**Output**: Symbols, structure, dependencies, code patterns

**Related Tools**: project-onboarding

---

### 15. guidelines-validator

**Purpose**: Validate development practices against AI agent guidelines.

**Key Parameters**:
- `practiceDescription` (required): Practice to validate
- `category` (required): prompting | code-management | architecture | visualization | memory | workflow

**Usage Example**:
```json
{
  "practiceDescription": "Use chain-of-thought prompting for complex reasoning",
  "category": "prompting"
}
```

**Output**: Validation result with best practice recommendations

**Related Tools**: prompting-hierarchy-evaluator

---

### 16. mermaid-diagram-generator

**Purpose**: Generate Mermaid diagrams from text descriptions following best practices.

**Key Parameters**:
- `description` (required): System/process description
- `diagramType` (required): flowchart | sequence | class | state | gantt | pie | er | journey | etc.
- `direction`: TD | BT | LR | RL (for flowcharts)
- `theme`: Visual theme (default, dark, forest, neutral)

**Usage Example**:
```json
{
  "description": "User authentication flow with JWT tokens",
  "diagramType": "sequence",
  "theme": "default"
}
```

**Output**: Valid Mermaid diagram syntax

**Related Tools**: None (standalone visualization)

---

## 📊 Strategy & Planning

### 17. strategy-frameworks-builder

**Purpose**: Compose strategy analysis using SWOT, BSC, VRIO, Porter's Five Forces, etc.

**Key Parameters**:
- `frameworks` (required): Array of framework IDs (swot, balancedScorecard, portersFiveForces, etc.)
- `context` (required): Business context
- `objectives`: Strategic objectives
- `market`: Market description

**Usage Example**:
```json
{
  "frameworks": ["swot", "portersFiveForces", "bcgMatrix"],
  "context": "SaaS startup entering enterprise market",
  "objectives": ["Market penetration", "Build brand"],
  "market": "Enterprise project management"
}
```

**Output**: Multi-framework strategy analysis

**Related Tools**: gap-frameworks-analyzers

---

### 18. gap-frameworks-analyzers

**Purpose**: Analyze gaps between current and desired states using various frameworks.

**Key Parameters**:
- `frameworks` (required): capability | performance | maturity | skills | technology | etc.
- `currentState` (required): Current state description
- `desiredState` (required): Desired state description
- `context` (required): Analysis context

**Usage Example**:
```json
{
  "frameworks": ["capability", "technology"],
  "currentState": "Manual deployments, monolithic architecture",
  "desiredState": "CI/CD, microservices",
  "context": "DevOps transformation"
}
```

**Output**: Gap analysis with action plan

**Related Tools**: strategy-frameworks-builder

---

### 19. sprint-timeline-calculator

**Purpose**: Calculate optimal sprint timelines with dependency-aware scheduling.

**Key Parameters**:
- `tasks` (required): Tasks with estimates
- `teamSize` (required): Number of team members
- `sprintLength`: Sprint length in days
- `velocity`: Team velocity (story points/sprint)
- `optimizationStrategy`: greedy | linear-programming

**Usage Example**:
```json
{
  "tasks": [
    {"name": "API design", "estimate": 8, "dependencies": []},
    {"name": "Implementation", "estimate": 13, "dependencies": ["API design"]}
  ],
  "teamSize": 5,
  "sprintLength": 14,
  "velocity": 40
}
```

**Output**: Sprint timeline with task assignments

**Related Tools**: None (standalone planning)

---

### 20. model-compatibility-checker

**Purpose**: Recommend best AI models for specific tasks based on capabilities and budget.

**Key Parameters**:
- `taskDescription` (required): Task description
- `requirements`: Context length, multimodal, etc.
- `budget`: low | medium | high
- `language`: Language for code examples

**Usage Example**:
```json
{
  "taskDescription": "Code generation with long context windows",
  "requirements": ["200K+ context", "function calling"],
  "budget": "medium",
  "language": "typescript"
}
```

**Output**: Model recommendations with pros/cons

**Related Tools**: None (standalone utility)

---

### 21. project-onboarding

**Purpose**: Perform comprehensive project onboarding with structure analysis and documentation.

**Key Parameters**:
- `projectPath` (required): Project directory path
- `projectName`: Project name
- `projectType`: library | application | service | tool | other
- `analysisDepth`: quick | standard | deep
- `includeMemories`: Generate project memories

**Usage Example**:
```json
{
  "projectPath": "/Users/dev/my-project",
  "projectName": "API Gateway",
  "projectType": "service",
  "analysisDepth": "standard",
  "includeMemories": true
}
```

**Output**: Project structure, dependencies, onboarding guide

**Related Tools**: semantic-code-analyzer

---

## 🎨 Design Workflow

### 22. design-assistant

**Purpose**: Multi-phase design workflow orchestration with constraint validation and artifact generation.

**Key Parameters**:
- `action` (required): start-session | advance-phase | validate-phase | generate-artifacts | etc.
- `sessionId` (required): Unique session ID
- `config`: Session configuration (for start-session)
- `phaseId`: Target phase ID
- `artifactTypes`: adr | specification | roadmap

**Usage Example**:
```json
{
  "action": "start-session",
  "sessionId": "api-gateway-design-2024",
  "config": {
    "context": "Microservices API gateway",
    "goal": "Design scalable gateway",
    "requirements": ["Rate limiting", "Authentication", "Logging"]
  }
}
```

**Output**: Design session state with phase guidance

**Related Tools**: architecture-design-prompt-builder

---

## 🛠️ Utilities

### 23. memory-context-optimizer

**Purpose**: Optimize prompt caching and context window usage for AI agents.

**Key Parameters**:
- `contextContent` (required): Context to optimize
- `maxTokens`: Maximum token limit
- `cacheStrategy`: aggressive | conservative | balanced

**Usage Example**:
```json
{
  "contextContent": "Long documentation text...",
  "maxTokens": 8000,
  "cacheStrategy": "balanced"
}
```

**Output**: Optimized context with caching recommendations

**Related Tools**: None (standalone utility)

---

### 24. mode-switcher

**Purpose**: Switch between agent operation modes with tailored tool sets.

**Key Parameters**:
- `targetMode` (required): planning | editing | analysis | debugging | refactoring | documentation
- `currentMode`: Current mode
- `context`: desktop-app | ide-assistant | agent | terminal | collaborative
- `reason`: Reason for mode switch

**Usage Example**:
```json
{
  "targetMode": "debugging",
  "currentMode": "editing",
  "context": "ide-assistant",
  "reason": "Found runtime error"
}
```

**Output**: Mode switch guidance with recommended tools

**Related Tools**: None (workflow utility)

---

### 25. prompting-hierarchy-evaluator

**Purpose**: Evaluate prompts with numeric scoring (clarity, specificity, completeness).

**Key Parameters**:
- `promptText` (required): Prompt to evaluate
- `targetLevel`: independent | indirect | direct | modeling | scaffolding | full-physical
- `includeRecommendations`: Include improvement suggestions

**Usage Example**:
```json
{
  "promptText": "Write a function to sort an array",
  "includeRecommendations": true
}
```

**Output**: Numeric score with detailed breakdown

**Related Tools**: hierarchy-level-selector, hierarchical-prompt-builder

---

### 26. hierarchy-level-selector

**Purpose**: Select optimal prompting hierarchy level based on task and agent capability.

**Key Parameters**:
- `taskDescription` (required): Task description
- `agentCapability`: novice | intermediate | advanced | expert
- `taskComplexity`: simple | moderate | complex | very-complex
- `autonomyPreference`: low | medium | high

**Usage Example**:
```json
{
  "taskDescription": "Implement OAuth2 authentication",
  "agentCapability": "intermediate",
  "taskComplexity": "complex",
  "autonomyPreference": "medium"
}
```

**Output**: Recommended hierarchy level with examples

**Related Tools**: prompting-hierarchy-evaluator, hierarchical-prompt-builder

---

### 27. spark-prompt-builder

**Purpose**: Build UI/UX product prompts with structured design inputs.

**Key Parameters**:
- `title` (required): Prompt title
- `summary` (required): Brief summary
- `complexityLevel` (required): Design complexity
- `designDirection` (required): Design direction
- `colorSchemeType` (required): Color scheme type
- `features`: UI features with functionality

**Usage Example**:
```json
{
  "title": "Dashboard Design",
  "summary": "Admin dashboard for analytics",
  "complexityLevel": "medium",
  "designDirection": "Clean, modern",
  "colorSchemeType": "Professional blue/gray",
  "features": [
    {"name": "Chart widget", "functionality": "Display metrics"}
  ]
}
```

**Output**: Structured UI/UX design prompt

**Related Tools**: domain-neutral-prompt-builder

---

## Quick Reference Table

| Tool | Category | Primary Use | Input Complexity |
|------|----------|-------------|------------------|
| hierarchical-prompt-builder | Prompt | Structured prompts | ⭐⭐ |
| code-analysis-prompt-builder | Prompt | Code analysis prompts | ⭐⭐ |
| architecture-design-prompt-builder | Prompt | Architecture prompts | ⭐⭐⭐ |
| digital-enterprise-architect-prompt-builder | Prompt | Enterprise strategy | ⭐⭐⭐⭐ |
| debugging-assistant-prompt-builder | Prompt | Debugging prompts | ⭐⭐ |
| l9-distinguished-engineer-prompt-builder | Prompt | L9 tech design | ⭐⭐⭐⭐⭐ |
| documentation-generator-prompt-builder | Prompt | Documentation prompts | ⭐⭐ |
| domain-neutral-prompt-builder | Prompt | Generic templates | ⭐⭐⭐ |
| security-hardening-prompt-builder | Prompt | Security analysis | ⭐⭐⭐ |
| clean-code-scorer | Analysis | Code quality scoring | ⭐⭐⭐ |
| code-hygiene-analyzer | Analysis | Pattern detection | ⭐⭐ |
| dependency-auditor | Analysis | Package audit | ⭐ |
| iterative-coverage-enhancer | Analysis | Test coverage | ⭐⭐⭐ |
| semantic-code-analyzer | Analysis | Semantic analysis | ⭐⭐ |
| guidelines-validator | Analysis | Practice validation | ⭐ |
| mermaid-diagram-generator | Analysis | Diagram generation | ⭐⭐ |
| strategy-frameworks-builder | Strategy | Business strategy | ⭐⭐⭐ |
| gap-frameworks-analyzers | Strategy | Gap analysis | ⭐⭐⭐ |
| sprint-timeline-calculator | Planning | Sprint planning | ⭐⭐ |
| model-compatibility-checker | Planning | Model selection | ⭐ |
| project-onboarding | Planning | Project analysis | ⭐⭐ |
| design-assistant | Design | Design workflow | ⭐⭐⭐⭐ |
| memory-context-optimizer | Utility | Context optimization | ⭐⭐ |
| mode-switcher | Utility | Workflow modes | ⭐ |
| prompting-hierarchy-evaluator | Utility | Prompt evaluation | ⭐⭐ |
| hierarchy-level-selector | Utility | Hierarchy selection | ⭐ |
| spark-prompt-builder | Utility | UI/UX prompts | ⭐⭐⭐ |

**Complexity Legend**: ⭐ (Simple) → ⭐⭐⭐⭐⭐ (Advanced)

---

## 🔗 See Also

- **[AI Interaction Tips](./AI_INTERACTION_TIPS.md)** - How to ask targeted questions
- **[Prompting Hierarchy](./PROMPTING_HIERARCHY.md)** - Understanding prompt levels
- **[Demos](../demos/README.md)** - Real-world examples of each tool
- **[Main README](../README.md)** - Installation and setup

---

<div align="center">
  <sub>Built with ❤️ for the MCP community</sub>
</div>
