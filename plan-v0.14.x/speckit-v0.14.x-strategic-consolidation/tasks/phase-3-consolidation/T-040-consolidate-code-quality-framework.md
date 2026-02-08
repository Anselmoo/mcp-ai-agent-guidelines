# T-040: Consolidate Code Quality Framework

**Task ID**: T-040
**Phase**: 3 - Framework Consolidation
**Priority**: P0 (Critical Path)
**Estimate**: 4h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-038 (Framework Router)
**Blocks**: T-049 (Test Framework Consolidation)

---

## 1. Overview

### What

Consolidate 4 code quality tools into a unified "Code Quality & Analysis" framework routed via FrameworkRouter (REQ-010).

### Why

- **REQ-010 Compliance**: Consolidate 30+ tools into 11 frameworks
- **Reduce Duplication**: 4 tools share scoring logic, hygiene patterns
- **Single Entry Point**: Route via `framework: 'code-quality'`

### Tools to Consolidate

| Current Tool                  | Lines | Purpose                   |
| ----------------------------- | ----- | ------------------------- |
| `clean-code-scorer`           | 580   | Quality score 0-100       |
| `code-hygiene-analyzer`       | 420   | Patterns/dependencies     |
| `iterative-coverage-enhancer` | 510   | Coverage gap detection    |
| `semantic-code-analyzer`      | 390   | Symbol/structure analysis |

### Deliverables

- `src/frameworks/code-quality/index.ts` - Framework entry
- `src/frameworks/code-quality/router.ts` - Action routing
- Updated `src/frameworks/index.ts` - Barrel export
- Unit tests in `tests/vitest/frameworks/code-quality/`

## 2. Context and Scope

### Current State

```
src/tools/analysis/
├── clean-code-scorer.ts        (standalone tool)
├── code-hygiene-analyzer.ts    (standalone tool)
├── iterative-coverage-enhancer.ts
└── ...
src/tools/
└── semantic-code-analyzer.ts   (standalone tool)
```

### Target State

```
src/frameworks/code-quality/
├── index.ts           (Framework definition)
├── router.ts          (Action routing)
├── types.ts           (Shared types)
└── actions/
    ├── score.ts       (→ clean-code-scorer)
    ├── hygiene.ts     (→ code-hygiene-analyzer)
    ├── coverage.ts    (→ iterative-coverage-enhancer)
    └── semantic.ts    (→ semantic-code-analyzer)
```

### Out of Scope

- Rewriting tool internals
- Breaking existing tool APIs
- Performance optimization

## 3. Prerequisites

### Dependencies

| Task  | Status   | Purpose                        |
| ----- | -------- | ------------------------------ |
| T-038 | Complete | FrameworkRouter infrastructure |

### Target Files

| File                                             | Action | Purpose              |
| ------------------------------------------------ | ------ | -------------------- |
| `src/frameworks/code-quality/index.ts`           | Create | Framework definition |
| `src/frameworks/code-quality/router.ts`          | Create | Action routing       |
| `src/frameworks/code-quality/types.ts`           | Create | Shared types         |
| `src/frameworks/index.ts`                        | Modify | Add export           |
| `tests/vitest/frameworks/code-quality/*.spec.ts` | Create | Unit tests           |

## 4. Implementation Guide

### Step 4.1: Create Framework Types

```typescript
// src/frameworks/code-quality/types.ts

import { z } from "zod";

export const CodeQualityActionEnum = z.enum([
  "score",      // Calculate quality score
  "hygiene",    // Analyze code hygiene
  "coverage",   // Analyze test coverage
  "semantic",   // Semantic code analysis
]);

export type CodeQualityAction = z.infer<typeof CodeQualityActionEnum>;

export const CodeQualityInputSchema = z.object({
  action: CodeQualityActionEnum.describe("Quality analysis action"),
  codeContent: z.string().optional().describe("Code to analyze"),
  projectPath: z.string().optional().describe("Path to project"),
  language: z.string().optional().describe("Programming language"),
  framework: z.string().optional().describe("Framework/stack"),
  coverageMetrics: z.object({
    lines: z.number().min(0).max(100).optional(),
    branches: z.number().min(0).max(100).optional(),
    functions: z.number().min(0).max(100).optional(),
    statements: z.number().min(0).max(100).optional(),
  }).optional().describe("Current coverage metrics"),
  includeReferences: z.boolean().optional().default(true),
  includeMetadata: z.boolean().optional().default(true),
});

export type CodeQualityInput = z.infer<typeof CodeQualityInputSchema>;
```

### Step 4.2: Create Action Router

```typescript
// src/frameworks/code-quality/router.ts

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { cleanCodeScorer } from "../../tools/analysis/clean-code-scorer.js";
import { codeHygieneAnalyzer } from "../../tools/analysis/code-hygiene-analyzer.js";
import { iterativeCoverageEnhancer } from "../../tools/analysis/iterative-coverage-enhancer.js";
import { semanticCodeAnalyzer } from "../../tools/semantic-code-analyzer.js";
import type { CodeQualityInput, CodeQualityAction } from "./types.js";

const actionHandlers: Record<CodeQualityAction, (input: CodeQualityInput) => Promise<CallToolResult>> = {
  score: async (input) => cleanCodeScorer({
    codeContent: input.codeContent,
    projectPath: input.projectPath,
    language: input.language,
    framework: input.framework,
    coverageMetrics: input.coverageMetrics,
    includeReferences: input.includeReferences,
    includeMetadata: input.includeMetadata,
  }),

  hygiene: async (input) => codeHygieneAnalyzer({
    codeContent: input.codeContent ?? "",
    language: input.language ?? "typescript",
    framework: input.framework,
    includeReferences: input.includeReferences,
  }),

  coverage: async (input) => iterativeCoverageEnhancer({
    projectPath: input.projectPath,
    language: input.language,
    framework: input.framework,
    currentCoverage: input.coverageMetrics,
    analyzeCoverageGaps: true,
    generateTestSuggestions: true,
    includeReferences: input.includeReferences,
  }),

  semantic: async (input) => semanticCodeAnalyzer({
    codeContent: input.codeContent ?? "",
    language: input.language,
    analysisType: "all",
    includeReferences: input.includeReferences,
    includeMetadata: input.includeMetadata,
  }),
};

export async function routeCodeQualityAction(
  input: CodeQualityInput
): Promise<CallToolResult> {
  const handler = actionHandlers[input.action];
  if (!handler) {
    throw new Error(`Unknown code-quality action: ${input.action}`);
  }
  return handler(input);
}
```

### Step 4.3: Create Framework Entry Point

```typescript
// src/frameworks/code-quality/index.ts

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { FrameworkDefinition } from "../types.js";
import { CodeQualityInputSchema, type CodeQualityInput } from "./types.js";
import { routeCodeQualityAction } from "./router.js";

export const codeQualityFramework: FrameworkDefinition = {
  name: "code-quality",
  description: "Code quality analysis: scoring, hygiene, coverage, and semantic analysis",
  version: "1.0.0",
  schema: CodeQualityInputSchema,
  actions: ["score", "hygiene", "coverage", "semantic"],

  async execute(input: unknown): Promise<CallToolResult> {
    const validated = CodeQualityInputSchema.parse(input);
    return routeCodeQualityAction(validated);
  },
};

export { CodeQualityInputSchema, type CodeQualityInput } from "./types.js";
```

### Step 4.4: Update Barrel Export

```typescript
// src/frameworks/index.ts (add to existing)

export { codeQualityFramework } from "./code-quality/index.js";
```

### Step 4.5: Register with FrameworkRouter

```typescript
// In FrameworkRouter initialization
router.register(codeQualityFramework);
```

## 5. Testing Strategy

```typescript
// tests/vitest/frameworks/code-quality/router.spec.ts

import { describe, it, expect, vi } from "vitest";
import { routeCodeQualityAction } from "../../../../src/frameworks/code-quality/router.js";

vi.mock("../../../../src/tools/analysis/clean-code-scorer.js", () => ({
  cleanCodeScorer: vi.fn().mockResolvedValue({ content: [{ type: "text", text: "Score: 85" }] }),
}));

describe("Code Quality Router", () => {
  it("routes 'score' to cleanCodeScorer", async () => {
    const result = await routeCodeQualityAction({
      action: "score",
      codeContent: "const x = 1;",
      language: "typescript",
    });
    expect(result.content).toBeDefined();
  });

  it("throws on unknown action", async () => {
    await expect(
      routeCodeQualityAction({ action: "invalid" as any })
    ).rejects.toThrow("Unknown code-quality action");
  });
});
```

## 6. Risks and Mitigations

| Risk                         | Likelihood | Impact | Mitigation                     |
| ---------------------------- | ---------- | ------ | ------------------------------ |
| Breaking existing tool calls | Medium     | High   | Tools remain callable directly |
| Input mapping errors         | Medium     | Medium | Comprehensive test coverage    |
| Performance overhead         | Low        | Low    | Thin routing layer             |

## 7. Acceptance Criteria

| Criterion                       | Status | Verification         |
| ------------------------------- | ------ | -------------------- |
| Framework routes all 4 actions  | ⬜      | Router test passes   |
| Schema validates inputs         | ⬜      | Schema test passes   |
| Registered with FrameworkRouter | ⬜      | Import test passes   |
| TypeScript strict passes        | ⬜      | `npm run type-check` |
| Test coverage ≥90%              | ⬜      | Coverage report      |

---

## 8. References

- [spec.md - REQ-010](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)
- [T-038 Framework Router](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-3-consolidation/T-038-implement-framework-router.md)
- [clean-code-scorer.ts](../../../../src/tools/analysis/clean-code-scorer.ts)
- [code-hygiene-analyzer.ts](../../../../src/tools/analysis/code-hygiene-analyzer.ts)

---

*Task: T-040 | Phase: 3 | Priority: P0*
