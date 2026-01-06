---
agent: MCP-Tool-Builder
description: Comprehensive prompt for MCP tool development following project patterns
---

# MCP Tool Builder Prompt

## Context
You are implementing MCP tools for the **MCP AI Agent Guidelines** project. This is a TypeScript-based MCP server delivering advanced tools for hierarchical prompting, code hygiene analysis, design workflows, security hardening, and agile planning.

## Current Epic Issues

### Phase 2: Domain Extraction (Issue #696) - IN PROGRESS
**Goal**: Extract pure business logic from `src/tools/` into `src/domain/`

Key requirements:
- **OutputStrategy Pattern**: Implement strategies for markdown/JSON/XML responses
- **ErrorCode Enum**: Create typed error handling with `McpToolError` class
- **Domain Layer**: Pure functions with no framework dependencies
- **Gateway Layer**: Thin MCP tool handlers calling domain logic

### Phase 3: Fix Broken Tools (Issue #697) - NOT STARTED
**Goal**: Fix 6+ broken MCP tools and ensure test coverage

Key requirements:
- Update tools for latest framework versions
- 90% test coverage for all tools
- Integration tests for tool interactions

### Phase 4: Spec-Kit Integration (Issue #698) - NOT STARTED
**Goal**: Integrate Spec-Kit methodology into project workflow

Key requirements:
- Create spec.md, plan.md, tasks.md templates
- Agent handoff orchestration patterns
- Progress tracking with progress.md

## MCP Tool Development Checklist

When creating or modifying MCP tools, follow this checklist:

### 1. Planning Phase
- [ ] Read existing tool patterns in `src/tools/`
- [ ] Use `sequentialthinking` for complex implementations
- [ ] Identify domain logic vs gateway logic (Phase 2)
- [ ] Create spec.md if significant change (Phase 4)

### 2. Implementation Phase
- [ ] Follow TypeScript strict mode (`tsconfig.json`)
- [ ] Use ESM imports with `.js` extensions
- [ ] Validate inputs with Zod schemas
- [ ] Use domain-specific error classes from `shared/errors.ts`
- [ ] Extract pure functions to `src/domain/` (Phase 2)
- [ ] Implement OutputStrategy if needed (Phase 2)

### 3. Testing Phase
- [ ] Write tests before implementation (TDD)
- [ ] Target 90% test coverage
- [ ] Mirror `src/` structure in `tests/vitest/`
- [ ] Use `vi.spyOn()` for function observation

### 4. Quality Phase
- [ ] Run `npm run quality` (type-check + lint)
- [ ] Run `npm run test:vitest`
- [ ] Verify no regressions with `npm run test:all`

### 5. Documentation Phase
- [ ] Update JSDoc comments
- [ ] Add to `docs/tools/` if new tool
- [ ] Update CHANGELOG.md

## Tool Registration Pattern

```typescript
// In src/index.ts
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "your-tool-name":
      // Validate with Zod
      const validatedArgs = YourToolSchema.parse(args);
      // Call domain logic
      const result = await yourDomainFunction(validatedArgs);
      // Return using OutputStrategy (Phase 2)
      return outputStrategy.format(result);
  }
});
```

## Domain Layer Pattern (Phase 2)

```typescript
// src/domain/your-feature/index.ts
export interface YourFeatureInput {
  // Input types
}

export interface YourFeatureOutput {
  // Output types
}

// Pure function - no framework dependencies
export function processYourFeature(
  input: YourFeatureInput
): YourFeatureOutput {
  // Business logic only
}
```

## OutputStrategy Pattern (Phase 2)

```typescript
// src/strategies/output-strategy.ts
export interface OutputStrategy {
  format(data: unknown): string;
}

export class MarkdownStrategy implements OutputStrategy {
  format(data: unknown): string {
    // Convert to markdown
  }
}

export class JsonStrategy implements OutputStrategy {
  format(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }
}
```

## Error Handling Pattern (Phase 2)

```typescript
// src/domain/errors.ts
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  OPERATION_ERROR = "OPERATION_ERROR",
}

export class McpToolError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "McpToolError";
  }
}
```

## Handoff Protocol

When your work is ready for next phase, use handoffs:

- **Tests needed** → Handoff to TDD-Workflow
- **Code review** → Handoff to Code-Reviewer
- **Security concern** → Handoff to Security-Auditor
- **Documentation** → Handoff to Documentation-Generator
- **Architecture decision** → Handoff to Architecture-Advisor

## MCP Tools to Use

| Task | Tool |
|------|------|
| Understand codebase | `serena/get_symbols_overview`, `serena/find_symbol` |
| Complex reasoning | `sequentialthinking` |
| Library docs | `context7/get-library-docs` |
| Code quality | `ai-agent-guidelines/clean-code-scorer` |
| Code patterns | `ai-agent-guidelines/semantic-code-analyzer` |

## Success Criteria

Your implementation is complete when:
- [ ] All tests pass (`npm run test:all`)
- [ ] Quality checks pass (`npm run quality`)
- [ ] Coverage ≥ 90% for new code
- [ ] Domain logic extracted (if applicable)
- [ ] OutputStrategy implemented (if applicable)
- [ ] Documentation updated
- [ ] CHANGELOG entry added
