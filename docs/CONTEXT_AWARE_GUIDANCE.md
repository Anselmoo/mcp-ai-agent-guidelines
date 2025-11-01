<!-- AUTO-GENERATED HEADER - DO NOT EDIT -->
<div align="center">

<!-- Animated gradient header -->
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=FFB86C,FF79C6,BD93F9,8BE9FD&height=3&section=header&animation=twinkling" />

<br/>

<!-- Document Title -->
<h1>
  <img src="https://img.shields.io/badge/MCP-AI_Agent_Guidelines-FFB86C?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMyA3VjE3TDEyIDIyTDIxIDE3VjdMMTIgMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiA4VjE2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCAxMkgxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+" alt="MCP AI Agent Guidelines - Reference" />
</h1>

<p>
  <strong>📖 Reference Documentation</strong> • Architecture & Integration Patterns
</p>

<!-- Quick Navigation Bar -->
<div>
  <a href="../README.md">🏠 Home</a> •
  <a href="./README.md">📚 Docs Index</a> •
  <a href="./REFERENCES.md">📚 References</a> •
  <a href="./BRIDGE_CONNECTORS.md">🏗️ Architecture</a> •
  <a href="./SERENA_STRATEGIES.md">🔄 Serena</a>
</div>

</div>

---
<!-- END AUTO-GENERATED HEADER -->


# Context-Aware Design Guidance

The design-assistant tool provides context-aware design recommendations tailored to your project's programming language, framework, and code patterns. This feature analyzes your codebase context and generates actionable, language-specific guidance including SOLID principles, design patterns, and best practices.

## Overview

The context-aware guidance feature automatically detects:

- **Programming Language**: TypeScript, JavaScript, Python, Java, C#, Go, Rust
- **Framework**: React, Angular, Vue, Express, Node.js, Django, Flask, Spring Boot, ASP.NET Core, Rails, Laravel
- **Code Patterns**: Component design, API/Service architecture, State management, Database access, Authentication, Testing, Error handling, Event-driven patterns

Based on this detection, it provides:

- **SOLID Principles** tailored to the detected language
- **Design Patterns** appropriate for the framework and context
- **Best Practices** specific to your stack
- **Anti-Patterns** to avoid
- **Architectural Patterns** for the detected framework
- **Context-Aware Guidance** based on code patterns (API, Database, State, etc.)

## Usage

### MCP Client

Use the `design-assistant` tool with the `generate-context-aware-guidance` action:

```json
{
  "action": "generate-context-aware-guidance",
  "sessionId": "unique-session-id",
  "content": "Your code context description here"
}
```

### Programmatic Usage

```typescript
import { designAssistant } from "mcp-ai-agent-guidelines";

const result = await designAssistant.processRequest({
  action: "generate-context-aware-guidance",
  sessionId: "session-001",
  content: `
    This is a TypeScript Node.js backend service with Express framework,
    implementing REST APIs with middleware and dependency injection.
  `,
});

console.log("Detected Language:", result.data?.detectedLanguage);
console.log("Detected Framework:", result.data?.detectedFramework);
console.log("Guidance:", result.artifacts[0]?.content);
```

## Examples

### Example 1: TypeScript + Express Backend

**Input:**

```typescript
{
  action: "generate-context-aware-guidance",
  sessionId: "ts-backend-001",
  content: "TypeScript Node.js backend with Express, implementing REST APIs"
}
```

**Output Includes:**

- TypeScript-specific SOLID principles (using interfaces, type guards, dependency injection)
- Express middleware patterns
- Layered architecture (Controller → Service → Repository)
- Node.js best practices (async/await, error handling, environment configs)
- TypeScript-specific anti-patterns (avoiding `any`, proper type inference)

### Example 2: React Component Library

**Input:**

```typescript
{
  action: "generate-context-aware-guidance",
  sessionId: "react-components-001",
  content: "React application with hooks useState and useEffect"
}
```

**Output Includes:**

- Atomic Design methodology (atoms → molecules → organisms → templates → pages)
- React hooks best practices (useMemo, useCallback, custom hooks)
- Component composition patterns
- Accessibility guidelines (ARIA attributes, semantic HTML)
- React-specific anti-patterns (prop drilling, unnecessary re-renders)

### Example 3: Python Django REST API

**Input:**

```typescript
{
  action: "generate-context-aware-guidance",
  sessionId: "django-api-001",
  content: "Python Django REST API with models.Model and class-based views"
}
```

**Output Includes:**

- Python SOLID principles (using abstract base classes, duck typing)
- Django MVT pattern (Model-View-Template)
- Django ORM best practices
- Service layer pattern for business logic
- Python anti-patterns (mutable default arguments, bare except clauses)

### Example 4: Java Spring Boot

**Input:**

```typescript
{
  action: "generate-context-aware-guidance",
  sessionId: "spring-boot-001",
  content: "Spring Boot Java application with REST controllers and JPA repositories"
}
```

**Output Includes:**

- Java SOLID principles (interfaces, abstract classes, dependency inversion)
- Spring Boot layered architecture
- Dependency injection patterns
- Repository and DTO patterns
- Java best practices (try-with-resources, proper exception handling)

## Supported Languages

| Language   | SOLID Principles | Design Patterns | Best Practices | Anti-Patterns |
| ---------- | ---------------- | --------------- | -------------- | ------------- |
| TypeScript | ✅               | ✅              | ✅             | ✅            |
| JavaScript | ✅               | ✅              | ✅             | ✅            |
| Python     | ✅               | ✅              | ✅             | ✅            |
| Java       | ✅               | ✅              | ✅             | ✅            |
| C#         | ✅               | ✅              | ✅             | ✅            |
| Go         | ✅               | ✅              | ✅             | ✅            |
| Rust       | ✅               | ✅              | ✅             | ✅            |

## Supported Frameworks

| Framework     | Architecture Patterns | Best Practices | Common Issues | Recommended Structure |
| ------------- | --------------------- | -------------- | ------------- | --------------------- |
| React         | ✅                    | ✅             | ✅            | ✅                    |
| Angular       | ✅                    | ✅             | ✅            | ✅                    |
| Vue           | ✅                    | ✅             | ✅            | ✅                    |
| Express       | ✅                    | ✅             | ✅            | ✅                    |
| Node.js       | ✅                    | ✅             | ✅            | ✅                    |
| Django        | ✅                    | ✅             | ✅            | ✅                    |
| Flask         | ✅                    | ✅             | ✅            | ✅                    |
| Spring Boot   | ✅                    | ✅             | ✅            | ✅                    |
| ASP.NET Core  | ✅                    | ✅             | ✅            | ✅                    |
| Rails         | ✅                    | ✅             | ✅            | ✅                    |
| Laravel       | ✅                    | ✅             | ✅            | ✅                    |

## Context-Aware Guidance Categories

The system detects and provides specific guidance for:

### Component/UI Context

- Atomic Design principles
- Component composition
- Accessibility guidelines
- Single responsibility
- Prop/input validation

### API/Service Context

- Layered architecture (Controller → Service → Repository)
- Dependency injection
- RESTful principles / GraphQL best practices
- Error handling and status codes
- DTO patterns
- API versioning

### State Management Context

- Single source of truth
- Immutable state updates
- Separation of UI state from domain state
- State normalization
- Redux/Vuex/Context API patterns

### Database/Data Access Context

- Repository pattern
- Unit of Work pattern
- Query Object pattern
- CQRS (Command Query Responsibility Segregation)
- Entity relationship mapping

### Authentication/Authorization Context

- Strategy pattern for auth methods
- RBAC (Role-Based Access Control) / ABAC
- Guard pattern for route protection
- Session management / token-based auth
- OAuth2/OIDC patterns

### Testing Context

- Design for testability (dependency injection)
- Test Pyramid (unit → integration → e2e)
- Test Doubles (mocks, stubs, fakes)
- Arrange-Act-Assert (AAA) pattern
- Test-Driven Development (TDD)

### Error Handling Context

- Centralized error handling (middleware/interceptor)
- Custom error types for domain errors
- Railway Oriented Programming
- Error logging and monitoring
- Result/Either types

### Event-Driven Context

- Event Sourcing
- Observer/Pub-Sub patterns
- Event-Driven Architecture
- CQRS with event sourcing
- Event versioning and schema evolution

## Response Format

The response includes:

```typescript
{
  success: boolean,
  sessionId: string,
  status: "guidance-generated" | "error",
  message: string,
  recommendations: string[],  // High-level recommendations
  artifacts: [{
    id: string,
    name: "Context-Aware Design Guidance",
    type: "specification",
    content: string,  // Full markdown guidance
    format: "markdown",
    timestamp: string,
    metadata: {
      generatedAt: string,
      detectedLanguage: string,
      detectedFramework?: string
    }
  }],
  data: {
    detectedLanguage: string,
    detectedFramework?: string,
    guidanceLength: number
  }
}
```

## Demo

Run the interactive demo:

```bash
npm run build
node demos/demo-context-aware-guidance.js
```

This demonstrates:

- TypeScript + Express backend guidance
- React component library guidance
- Python + Django API guidance
- Mixed context (API + Database) guidance

## Implementation Details

### Language Detection

The system analyzes code context for language-specific keywords, file extensions, and syntax patterns:

- TypeScript: `interface`, `type`, `: string`, `.ts`
- JavaScript: `const`, `let`, `var`, `.js`
- Python: `def`, `import`, `class`, `self.`, `.py`
- Java: `public class`, `private`, `@override`, `.java`
- C#: `namespace`, `using System`, `.cs`
- Go: `func`, `package`, `.go`
- Rust: `fn`, `impl`, `trait`, `.rs`

### Framework Detection

Analyzes for framework-specific patterns:

- React: `useState`, `useEffect`, `jsx`
- Angular: `@Component`, `NgModule`
- Vue: `<template>`, `v-if`, `v-for`
- Express: `app.get`, `app.post`
- Django: `models.Model`, `django.`
- Spring Boot: `@RestController`, `@SpringBootApplication`

### Context Analysis

Examines code descriptions for context keywords:

- Component context: "component", "ui", "view", "template"
- API context: "api", "service", "endpoint", "controller"
- State context: "state", "store", "redux", "vuex"
- Database context: "database", "repository", "model", "entity"
- Auth context: "auth", "login", "permission", "role"
- Testing context: "test", "spec", "mock"
- Error context: "error", "exception", "validation"
- Event context: "event", "message", "queue", "pub", "sub"

## Related Actions

The design-assistant also supports these complementary actions:

- `start-session` - Initialize a design session
- `advance-phase` - Move to next design phase
- `validate-phase` - Validate phase completion
- `generate-artifacts` - Generate ADRs, specs, roadmaps
- `select-methodology` - Choose appropriate methodology
- `enforce-consistency` - Validate constraint compliance
- `enforce-cross-session-consistency` - Multi-session validation

## References

- [SOLID Principles (Wikipedia)](https://en.wikipedia.org/wiki/SOLID)
- [SOLID Principles Guide (DigitalOcean)](https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)
- [Atomic Design (Brad Frost)](https://atomicdesign.bradfrost.com/chapter-2/)
- [Design Patterns (GoF)](https://en.wikipedia.org/wiki/Design_Patterns)

## Contributing

To extend language or framework support:

1. Update `LANGUAGE_DESIGN_MAP` in `src/tools/design/services/context-pattern-analyzer.service.ts`
2. Add detection patterns to `detectLanguage()` or `detectFramework()`
3. Add tests to `tests/vitest/design-assistant-context-aware.test.ts`

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.


<!-- AUTO-GENERATED FOOTER - DO NOT EDIT -->

---

<div align="center">

<!-- Navigation Grid -->
<table>
  <tr>
    <td align="center" width="33%">
      <strong>📖 References</strong><br/>
      <a href="./REFERENCES.md">Credits & Research</a><br/>
      <a href="./SERENA_STRATEGIES.md">Serena Integration</a><br/>
      <a href="./CONTEXT_AWARE_GUIDANCE.md">Context Guidance</a>
    </td>
    <td align="center" width="33%">
      <strong>🏗️ Architecture</strong><br/>
      <a href="./BRIDGE_CONNECTORS.md">Bridge Connectors</a><br/>
      <a href="./design-module-status.md">Module Status</a><br/>
      <a href="./TECHNICAL_IMPROVEMENTS.md">Improvements</a>
    </td>
    <td align="center" width="33%">
      <strong>🚀 Get Started</strong><br/>
      <a href="../README.md">Main README</a><br/>
      <a href="./AI_INTERACTION_TIPS.md">Interaction Tips</a><br/>
      <a href="../demos/README.md">Demo Examples</a>
    </td>
  </tr>
</table>

<!-- Back to Top -->
<p>
  <a href="#top">⬆️ Back to Top</a>
</p>

<!-- Animated Waving Footer -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=FFB86C,FF79C6,BD93F9,8BE9FD,50FA7B&height=80&section=footer&animation=twinkling" />

<!-- Metadata Footer -->
<sub>
  <strong>MCP AI Agent Guidelines</strong> • Made with ❤️ by <a href="https://github.com/Anselmoo">@Anselmoo</a> and contributors<br/>
  Licensed under <a href="../LICENSE">MIT</a> • <a href="../DISCLAIMER.md">Disclaimer</a> • <a href="../CONTRIBUTING.md">Contributing</a>
</sub>

</div>

<!-- END AUTO-GENERATED FOOTER -->
