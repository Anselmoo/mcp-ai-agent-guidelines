# T-033: Create Legacy Facade: DomainNeutralPromptBuilder

**Task ID**: T-033
**Phase**: 2.5 - Unified Prompt Ecosystem
**Priority**: P0 (Critical Path)
**Estimate**: 4h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-026 (UnifiedPromptBuilder Core)
**Blocks**: T-035 (Test UnifiedPromptBuilder)

---

## 1. Overview

### What

Create a backward-compatible facade `domain-neutral-facade.ts` that wraps the new `UnifiedPromptBuilder` while preserving the existing `domainNeutralPromptBuilder` API. This enables gradual migration without breaking existing tool consumers.

### Why

- **Backward Compatibility**: Existing MCP clients using `domain-neutral-prompt-builder` continue working
- **Deprecation Path**: Facade emits deprecation warnings guiding users to UnifiedPromptBuilder
- **Risk Reduction**: Parallel operation allows rollback if issues arise
- **REQ-008 Compliance**: Spec requires legacy facades with deprecation warnings

### Deliverables

- `src/tools/prompt/facades/domain-neutral-facade.ts` - Facade implementation
- `src/tools/prompt/facades/index.ts` - Barrel export
- Updated `src/tools/prompt/index.ts` to export facade
- Unit tests in `tests/vitest/tools/prompt/facades/domain-neutral-facade.spec.ts`

## 2. Context and Scope

### Current State

The existing `domain-neutral-prompt-builder.ts` (445 lines) exports:
```typescript
// src/tools/prompt/domain-neutral-prompt-builder.ts
export async function domainNeutralPromptBuilder(
  input: DomainNeutralInput
): Promise<CallToolResult>
```

Key schema fields: `title`, `summary`, `objectives`, `workflow`, `capabilities`, `risks`, `successMetrics`

### Target State

```
src/tools/prompt/
├── domain-neutral-prompt-builder.ts  (existing - unchanged)
├── facades/
│   ├── domain-neutral-facade.ts      (NEW - wraps UnifiedPromptBuilder)
│   └── index.ts                      (NEW - barrel)
└── index.ts                          (updated exports)
```

### Out of Scope

- Modifying `domain-neutral-prompt-builder.ts` internals
- Breaking API changes to existing schema
- Full UnifiedPromptBuilder implementation (T-026)

## 3. Prerequisites

### Dependencies

| Task  | Status           | Required For             |
| ----- | ---------------- | ------------------------ |
| T-026 | Must be complete | UnifiedPromptBuilder API |
| T-024 | Must be complete | PromptRegistry           |
| T-025 | Must be complete | TemplateEngine           |

### Target Files

| File                                                              | Action | Purpose               |
| ----------------------------------------------------------------- | ------ | --------------------- |
| `src/tools/prompt/facades/domain-neutral-facade.ts`               | Create | Facade implementation |
| `src/tools/prompt/facades/index.ts`                               | Create | Barrel exports        |
| `src/tools/prompt/index.ts`                                       | Modify | Add facade export     |
| `tests/vitest/tools/prompt/facades/domain-neutral-facade.spec.ts` | Create | Unit tests            |

### Tooling

- Node.js 22.x
- TypeScript strict mode
- Vitest for testing
- `npm run quality` for validation

## 4. Implementation Guide

### Step 4.1: Create Facade Directory Structure

```bash
mkdir -p src/tools/prompt/facades
mkdir -p tests/vitest/tools/prompt/facades
```

### Step 4.2: Implement Domain-Neutral Facade

```typescript
// src/tools/prompt/facades/domain-neutral-facade.ts

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { warnDeprecated } from "../../shared/deprecation-helpers.js";
import type { UnifiedPromptBuilder } from "../unified/unified-prompt-builder.js";

/**
 * Legacy facade for DomainNeutralPromptBuilder.
 * Wraps UnifiedPromptBuilder while preserving backward compatibility.
 *
 * @deprecated Use UnifiedPromptBuilder directly with domain='domain-neutral'
 * @removalVersion v0.16.0
 */

// Re-export original schema for backward compatibility
export const DomainNeutralFacadeSchema = z.object({
  title: z.string().describe("Prompt title"),
  summary: z.string().describe("Brief summary of the prompt purpose"),
  objectives: z.array(z.string()).optional().describe("List of objectives"),
  nonGoals: z.array(z.string()).optional().describe("Explicit non-goals"),
  background: z.string().optional().describe("Background context"),
  workflow: z.array(z.string()).optional().describe("Workflow steps"),
  capabilities: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    preconditions: z.string().optional(),
    inputs: z.string().optional(),
    processing: z.string().optional(),
    outputs: z.string().optional(),
  })).optional().describe("Capability definitions"),
  risks: z.array(z.object({
    description: z.string(),
    mitigation: z.string().optional(),
  })).optional().describe("Risk factors"),
  successMetrics: z.array(z.string()).optional().describe("Success criteria"),
  // Prompt configuration
  style: z.enum(["markdown", "xml"]).optional().default("markdown"),
  provider: z.string().optional(),
  techniques: z.array(z.string()).optional(),
  includeReferences: z.boolean().optional().default(true),
  includeFrontmatter: z.boolean().optional().default(true),
  includeMetadata: z.boolean().optional().default(true),
});

export type DomainNeutralFacadeInput = z.infer<typeof DomainNeutralFacadeSchema>;

export class DomainNeutralFacade {
  private readonly unifiedBuilder: UnifiedPromptBuilder;
  private deprecationWarned = false;

  constructor(unifiedBuilder: UnifiedPromptBuilder) {
    this.unifiedBuilder = unifiedBuilder;
  }

  /**
   * Generate domain-neutral prompt using legacy API.
   * Internally delegates to UnifiedPromptBuilder.
   */
  async generate(input: DomainNeutralFacadeInput): Promise<CallToolResult> {
    // Emit deprecation warning once per instance
    if (!this.deprecationWarned) {
      warnDeprecated({
        oldName: "domainNeutralPromptBuilder",
        newName: "UnifiedPromptBuilder.generate({ domain: 'domain-neutral', ... })",
        removalVersion: "v0.16.0",
        migrationGuide: "See docs/migration/prompt-builders.md",
      });
      this.deprecationWarned = true;
    }

    // Transform legacy input to unified format
    const unifiedInput = this.transformInput(input);

    // Delegate to UnifiedPromptBuilder
    return this.unifiedBuilder.generate(unifiedInput);
  }

  private transformInput(legacy: DomainNeutralFacadeInput) {
    return {
      domain: "domain-neutral" as const,
      title: legacy.title,
      description: legacy.summary,
      sections: {
        objectives: legacy.objectives,
        nonGoals: legacy.nonGoals,
        background: legacy.background,
        workflow: legacy.workflow,
        capabilities: legacy.capabilities,
        risks: legacy.risks,
        successMetrics: legacy.successMetrics,
      },
      config: {
        style: legacy.style,
        provider: legacy.provider,
        techniques: legacy.techniques,
        includeReferences: legacy.includeReferences,
        includeFrontmatter: legacy.includeFrontmatter,
        includeMetadata: legacy.includeMetadata,
      },
    };
  }
}

/**
 * Factory function for backward compatibility.
 * @deprecated Use UnifiedPromptBuilder directly
 */
export function createDomainNeutralFacade(
  unifiedBuilder: UnifiedPromptBuilder
): DomainNeutralFacade {
  return new DomainNeutralFacade(unifiedBuilder);
}
```

### Step 4.3: Create Barrel Export

```typescript
// src/tools/prompt/facades/index.ts

export {
  DomainNeutralFacade,
  DomainNeutralFacadeSchema,
  createDomainNeutralFacade,
  type DomainNeutralFacadeInput,
} from "./domain-neutral-facade.js";

// Future facades will be added here:
// export { HierarchicalFacade } from "./hierarchical-facade.js";
```

### Step 4.4: Update Main Barrel Export

```typescript
// src/tools/prompt/index.ts (add to existing exports)

// Legacy facades (deprecated)
export {
  DomainNeutralFacade,
  createDomainNeutralFacade,
} from "./facades/index.js";
```

### Step 4.5: Implement Unit Tests

```typescript
// tests/vitest/tools/prompt/facades/domain-neutral-facade.spec.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DomainNeutralFacade,
  DomainNeutralFacadeSchema,
  createDomainNeutralFacade,
} from "../../../../../src/tools/prompt/facades/domain-neutral-facade.js";

describe("DomainNeutralFacade", () => {
  const mockUnifiedBuilder = {
    generate: vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "Generated prompt" }],
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("schema validation", () => {
    it("accepts valid minimal input", () => {
      const input = { title: "Test", summary: "Test summary" };
      const result = DomainNeutralFacadeSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("accepts full input with all optional fields", () => {
      const input = {
        title: "Full Test",
        summary: "Complete test",
        objectives: ["Obj 1", "Obj 2"],
        workflow: ["Step 1", "Step 2"],
        risks: [{ description: "Risk 1", mitigation: "Mitigate" }],
        style: "markdown",
        includeReferences: true,
      };
      const result = DomainNeutralFacadeSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects input missing required fields", () => {
      const result = DomainNeutralFacadeSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("generate()", () => {
    it("delegates to UnifiedPromptBuilder with transformed input", async () => {
      const facade = createDomainNeutralFacade(mockUnifiedBuilder as any);

      await facade.generate({
        title: "Test Prompt",
        summary: "Test description",
        objectives: ["Goal 1"],
      });

      expect(mockUnifiedBuilder.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: "domain-neutral",
          title: "Test Prompt",
          description: "Test description",
        })
      );
    });

    it("returns result from UnifiedPromptBuilder", async () => {
      const facade = createDomainNeutralFacade(mockUnifiedBuilder as any);

      const result = await facade.generate({
        title: "Test",
        summary: "Test",
      });

      expect(result.content).toBeDefined();
    });

    it("emits deprecation warning on first call only", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const facade = createDomainNeutralFacade(mockUnifiedBuilder as any);

      await facade.generate({ title: "Test", summary: "Test" });
      await facade.generate({ title: "Test2", summary: "Test2" });

      // Warning should be emitted only once
      expect(warnSpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });
  });

  describe("input transformation", () => {
    it("maps legacy fields to unified format", async () => {
      const facade = createDomainNeutralFacade(mockUnifiedBuilder as any);

      await facade.generate({
        title: "Legacy Title",
        summary: "Legacy Summary",
        objectives: ["Obj"],
        workflow: ["Step"],
        style: "xml",
        includeReferences: false,
      });

      expect(mockUnifiedBuilder.generate).toHaveBeenCalledWith({
        domain: "domain-neutral",
        title: "Legacy Title",
        description: "Legacy Summary",
        sections: {
          objectives: ["Obj"],
          workflow: ["Step"],
          nonGoals: undefined,
          background: undefined,
          capabilities: undefined,
          risks: undefined,
          successMetrics: undefined,
        },
        config: {
          style: "xml",
          provider: undefined,
          techniques: undefined,
          includeReferences: false,
          includeFrontmatter: undefined,
          includeMetadata: undefined,
        },
      });
    });
  });
});
```

## 5. Testing Strategy

### Unit Tests
- Schema validation (valid/invalid inputs)
- Input transformation (legacy → unified format)
- Delegation to UnifiedPromptBuilder
- Deprecation warning emission (once per instance)

### Integration Tests
- End-to-end facade → UnifiedPromptBuilder → output
- Verify output matches original `domainNeutralPromptBuilder`

### Commands
```bash
# Run facade tests
npm run test:vitest -- --filter="domain-neutral-facade"

# Run with coverage
npm run test:coverage:vitest -- --filter="facades"

# Quality check
npm run quality
```

## 6. Risks and Mitigations

| Risk                             | Likelihood | Impact | Mitigation                       |
| -------------------------------- | ---------- | ------ | -------------------------------- |
| Input transformation loses data  | Medium     | High   | Comprehensive mapping tests      |
| Deprecation warning spam         | Low        | Low    | Warn once per instance           |
| UnifiedPromptBuilder API changes | Medium     | Medium | Pin to stable interface contract |
| Performance regression           | Low        | Medium | Benchmark facade vs direct call  |

## 7. Acceptance Criteria

| Criterion                                | Status | Verification                          |
| ---------------------------------------- | ------ | ------------------------------------- |
| Facade delegates to UnifiedPromptBuilder | ⬜      | Unit test: `generate()` calls builder |
| Schema accepts all legacy input shapes   | ⬜      | Schema validation tests pass          |
| Deprecation warning emitted once         | ⬜      | Console spy test                      |
| Barrel exports work correctly            | ⬜      | Import test from `prompt/index.ts`    |
| TypeScript strict mode passes            | ⬜      | `npm run type-check`                  |
| Test coverage ≥90%                       | ⬜      | `npm run test:coverage:vitest`        |

---

## 8. References

- [spec.md - REQ-008](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) - Legacy facade requirement
- [T-026 UnifiedPromptBuilder](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-25-unified-prompts/T-026-unified-builder.md) - Core builder dependency
- [domain-neutral-prompt-builder.ts](../../../../src/tools/prompt/domain-neutral-prompt-builder.ts) - Existing implementation
- [ADR-002 ToolAnnotations](../../../../docs/adr/ADR-002-tool-annotations.md) - Annotation standard

---

*Task: T-033 | Phase: 2.5 | Priority: P0*
