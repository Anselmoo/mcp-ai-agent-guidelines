# T-027: Implement Domain Generator: Hierarchical

**Task ID**: T-027
**Phase**: 2.5 - Unified Prompt Ecosystem
**Priority**: P0 (Critical Path)
**Estimate**: 4h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-026 (UnifiedPromptBuilder Core)
**Blocks**: T-032 (Legacy Facade: Hierarchical)

---

## 1. Overview

### What

Implement `HierarchicalGenerator` - the domain generator for hierarchical prompts (independent → modeling → scaffolding levels) that plugs into UnifiedPromptBuilder.

### Why

- **REQ-007 Compliance**: Part of UnifiedPromptBuilder domain generators
- **Pattern Reuse**: Extract reusable logic from existing 650-line builder
- **Registry Integration**: Enable `domain: 'hierarchical'` routing

### Source Analysis

`src/tools/prompt/hierarchical-prompt-builder.ts` (650 lines):
- 3 hierarchy levels: independent, modeling, scaffolding
- Technique integration (chain-of-thought, few-shot, etc.)
- Provider-specific tips (GPT, Claude, Gemini)
- Metadata and frontmatter generation

### Deliverables

- `src/tools/prompt/unified/generators/hierarchical-generator.ts`
- `src/tools/prompt/unified/generators/index.ts` (barrel)
- Unit tests in `tests/vitest/tools/prompt/unified/generators/`

## 2. Context and Scope

### Current State

```typescript
// src/tools/prompt/hierarchical-prompt-builder.ts (650 lines)
export async function hierarchicalPromptBuilder(input: HierarchicalInput): Promise<CallToolResult>
```

### Target State

```typescript
// src/tools/prompt/unified/generators/hierarchical-generator.ts
export class HierarchicalGenerator implements DomainGenerator {
  generate(input: HierarchicalInput, context: GeneratorContext): Promise<PromptOutput>
  validate(input: unknown): ValidationResult
}
```

### Out of Scope

- Modifying existing `hierarchical-prompt-builder.ts`
- Creating legacy facade (T-032)
- Template engine implementation (T-025)

## 3. Prerequisites

### Dependencies

| Task  | Status   | Purpose                         |
| ----- | -------- | ------------------------------- |
| T-026 | Complete | DomainGenerator interface       |
| T-024 | Complete | PromptRegistry for registration |
| T-025 | Complete | TemplateEngine for rendering    |

### Target Files

| File                                                                          | Action | Purpose        |
| ----------------------------------------------------------------------------- | ------ | -------------- |
| `src/tools/prompt/unified/generators/hierarchical-generator.ts`               | Create | Generator impl |
| `src/tools/prompt/unified/generators/index.ts`                                | Create | Barrel export  |
| `tests/vitest/tools/prompt/unified/generators/hierarchical-generator.spec.ts` | Create | Unit tests     |

### Reference Files

| File                                              | Purpose                   |
| ------------------------------------------------- | ------------------------- |
| `src/tools/prompt/hierarchical-prompt-builder.ts` | Existing logic to extract |
| `src/tools/shared/prompt-sections.ts`             | Shared section builders   |
| `src/tools/shared/prompt-utils.ts`                | Utility functions         |

## 4. Implementation Guide

### Step 4.1: Create Generator Types

```typescript
// src/tools/prompt/unified/generators/hierarchical-generator.ts

import { z } from "zod";
import type { DomainGenerator, GeneratorContext, PromptOutput, ValidationResult } from "../types.js";
import {
  buildTechniqueHintsSection,
  buildProviderTipsSection,
  buildPitfallsSection,
  TechniqueEnum,
  ProviderEnum,
} from "../../../shared/prompt-sections.js";
import { buildMetadataSection, buildFrontmatterWithPolicy } from "../../../shared/prompt-utils.js";

/**
 * Hierarchy levels for structured prompting.
 */
export const HierarchyLevelEnum = z.enum([
  "independent",  // Minimal guidance, agent-driven
  "modeling",     // Examples and patterns provided
  "scaffolding",  // Step-by-step structure
]);

export type HierarchyLevel = z.infer<typeof HierarchyLevelEnum>;

/**
 * Schema for hierarchical prompt input.
 */
export const HierarchicalInputSchema = z.object({
  level: HierarchyLevelEnum.describe("Hierarchy level: independent, modeling, or scaffolding"),
  task: z.string().min(1).describe("Task description"),
  context: z.string().optional().describe("Additional context"),
  constraints: z.array(z.string()).optional().describe("Constraints or requirements"),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })).optional().describe("Few-shot examples (for modeling level)"),
  steps: z.array(z.string()).optional().describe("Explicit steps (for scaffolding level)"),
  techniques: z.array(TechniqueEnum).optional().describe("Prompting techniques to include"),
  provider: ProviderEnum.optional().describe("Target LLM provider"),
  style: z.enum(["markdown", "xml"]).optional().default("markdown"),
  includeReferences: z.boolean().optional().default(true),
  includeFrontmatter: z.boolean().optional().default(true),
  includeMetadata: z.boolean().optional().default(true),
});

export type HierarchicalInput = z.infer<typeof HierarchicalInputSchema>;
```

### Step 4.2: Implement Generator Class

```typescript
// (continued in hierarchical-generator.ts)

/**
 * Domain generator for hierarchical prompts.
 * Supports independent, modeling, and scaffolding levels.
 */
export class HierarchicalGenerator implements DomainGenerator {
  readonly name = "hierarchical";
  readonly version = "1.0.0";
  readonly schema = HierarchicalInputSchema;

  validate(input: unknown): ValidationResult {
    const result = HierarchicalInputSchema.safeParse(input);
    if (result.success) {
      return { valid: true, errors: [], warnings: [] };
    }
    return {
      valid: false,
      errors: result.error.errors.map(e => ({
        code: "VALIDATION_ERROR",
        message: e.message,
        field: e.path.join("."),
      })),
      warnings: [],
    };
  }

  async generate(
    input: HierarchicalInput,
    context: GeneratorContext
  ): Promise<PromptOutput> {
    const validated = HierarchicalInputSchema.parse(input);

    // Build sections based on hierarchy level
    const sections = this.buildSections(validated);

    // Add technique hints if requested
    const techniqueHints = validated.techniques
      ? buildTechniqueHintsSection(validated.techniques)
      : "";

    // Add provider tips if specified
    const providerTips = validated.provider
      ? buildProviderTipsSection(validated.provider)
      : "";

    // Build metadata
    const metadata = validated.includeMetadata
      ? buildMetadataSection({
          level: validated.level,
          provider: validated.provider,
          techniques: validated.techniques,
          sourceTool: "unified-prompt-builder",
        })
      : "";

    // Build frontmatter
    const frontmatter = validated.includeFrontmatter
      ? buildFrontmatterWithPolicy({
          title: `Hierarchical Prompt (${validated.level})`,
          level: validated.level,
        })
      : "";

    // Assemble content
    const content = this.assembleContent({
      frontmatter,
      metadata,
      sections,
      techniqueHints,
      providerTips,
      style: validated.style,
    });

    return {
      content,
      format: validated.style,
      metadata: {
        level: validated.level,
        provider: validated.provider,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private buildSections(input: HierarchicalInput): string {
    const parts: string[] = [];

    // Task section (always present)
    parts.push(`## Task\n\n${input.task}`);

    // Context (if provided)
    if (input.context) {
      parts.push(`## Context\n\n${input.context}`);
    }

    // Constraints (if provided)
    if (input.constraints?.length) {
      parts.push(`## Constraints\n\n${input.constraints.map(c => `- ${c}`).join("\n")}`);
    }

    // Level-specific sections
    switch (input.level) {
      case "independent":
        parts.push(this.buildIndependentSection());
        break;
      case "modeling":
        parts.push(this.buildModelingSection(input.examples));
        break;
      case "scaffolding":
        parts.push(this.buildScaffoldingSection(input.steps));
        break;
    }

    return parts.join("\n\n");
  }

  private buildIndependentSection(): string {
    return `## Approach\n\nUse your best judgment to complete this task. You have full autonomy over the approach and implementation details.`;
  }

  private buildModelingSection(examples?: HierarchicalInput["examples"]): string {
    if (!examples?.length) {
      return `## Examples\n\n*No examples provided. Consider adding examples for better results.*`;
    }

    const exampleBlocks = examples.map((ex, i) => {
      let block = `### Example ${i + 1}\n\n**Input:** ${ex.input}\n\n**Output:** ${ex.output}`;
      if (ex.explanation) {
        block += `\n\n**Explanation:** ${ex.explanation}`;
      }
      return block;
    });

    return `## Examples\n\n${exampleBlocks.join("\n\n")}`;
  }

  private buildScaffoldingSection(steps?: string[]): string {
    if (!steps?.length) {
      return `## Steps\n\n*No steps provided. Consider adding explicit steps for scaffolding level.*`;
    }

    const stepList = steps.map((step, i) => `${i + 1}. ${step}`).join("\n");
    return `## Steps\n\nFollow these steps in order:\n\n${stepList}`;
  }

  private assembleContent(parts: {
    frontmatter: string;
    metadata: string;
    sections: string;
    techniqueHints: string;
    providerTips: string;
    style: "markdown" | "xml";
  }): string {
    const { frontmatter, metadata, sections, techniqueHints, providerTips } = parts;

    return [
      frontmatter,
      metadata,
      sections,
      techniqueHints,
      providerTips,
    ].filter(Boolean).join("\n\n");
  }
}

// Export singleton instance for registration
export const hierarchicalGenerator = new HierarchicalGenerator();
```

### Step 4.3: Create Barrel Export

```typescript
// src/tools/prompt/unified/generators/index.ts

export {
  HierarchicalGenerator,
  hierarchicalGenerator,
  HierarchicalInputSchema,
  HierarchyLevelEnum,
  type HierarchicalInput,
  type HierarchyLevel,
} from "./hierarchical-generator.js";

// Future generators:
// export { SecurityGenerator } from "./security-generator.js";
// export { ArchitectureGenerator } from "./architecture-generator.js";
```

### Step 4.4: Register with PromptRegistry

```typescript
// In unified-prompt-builder.ts or initialization
import { hierarchicalGenerator } from "./generators/index.js";

PromptRegistry.getInstance().register({
  name: "hierarchical",
  version: "1.0.0",
  generator: hierarchicalGenerator,
  schema: HierarchicalInputSchema,
});
```

## 5. Testing Strategy

```typescript
// tests/vitest/tools/prompt/unified/generators/hierarchical-generator.spec.ts

import { describe, it, expect } from "vitest";
import {
  HierarchicalGenerator,
  HierarchicalInputSchema,
} from "../../../../../../src/tools/prompt/unified/generators/hierarchical-generator.js";

describe("HierarchicalGenerator", () => {
  const generator = new HierarchicalGenerator();

  describe("validate()", () => {
    it("accepts valid independent input", () => {
      const result = generator.validate({
        level: "independent",
        task: "Write a function",
      });
      expect(result.valid).toBe(true);
    });

    it("rejects missing required fields", () => {
      const result = generator.validate({ level: "independent" });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe("task");
    });
  });

  describe("generate()", () => {
    const mockContext = { templateEngine: {}, config: {}, metadata: {} } as any;

    it("generates independent level prompt", async () => {
      const result = await generator.generate(
        { level: "independent", task: "Test task" },
        mockContext
      );
      expect(result.content).toContain("Test task");
      expect(result.content).toContain("full autonomy");
    });

    it("generates modeling level with examples", async () => {
      const result = await generator.generate(
        {
          level: "modeling",
          task: "Classify sentiment",
          examples: [{ input: "Great!", output: "positive" }],
        },
        mockContext
      );
      expect(result.content).toContain("Example 1");
      expect(result.content).toContain("Great!");
    });

    it("generates scaffolding level with steps", async () => {
      const result = await generator.generate(
        {
          level: "scaffolding",
          task: "Build API",
          steps: ["Design schema", "Implement endpoints"],
        },
        mockContext
      );
      expect(result.content).toContain("1. Design schema");
      expect(result.content).toContain("2. Implement endpoints");
    });
  });
});
```

## 6. Risks and Mitigations

| Risk                           | Likelihood | Impact | Mitigation                       |
| ------------------------------ | ---------- | ------ | -------------------------------- |
| Logic divergence from original | Medium     | Medium | Comprehensive comparison tests   |
| Missing edge cases             | Medium     | Low    | Port existing tests              |
| Interface mismatch             | Low        | High   | Pin to DomainGenerator interface |

## 7. Acceptance Criteria

| Criterion                        | Status | Verification         |
| -------------------------------- | ------ | -------------------- |
| Generates all 3 hierarchy levels | ⬜      | Unit tests pass      |
| Validates input correctly        | ⬜      | Schema tests pass    |
| Integrates with PromptRegistry   | ⬜      | Registration test    |
| Output matches original builder  | ⬜      | Comparison test      |
| TypeScript strict passes         | ⬜      | `npm run type-check` |
| Test coverage ≥90%               | ⬜      | Coverage report      |

---

## 8. References

- [T-026 UnifiedPromptBuilder](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-25-unified-prompts/T-026-unified-builder.md)
- [T-023 Architecture](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-25-unified-prompts/T-023-design-unifiedpromptbuilder-architecture.md)
- [hierarchical-prompt-builder.ts](../../../../src/tools/prompt/hierarchical-prompt-builder.ts)
- [prompt-sections.ts](../../../../src/tools/shared/prompt-sections.ts)

---

*Task: T-027 | Phase: 2.5 | Priority: P0*
