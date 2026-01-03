# 🔧 P4-002: Implement Constitution Parser [serial]

> **Parent**: [004-parent-phase4-speckit.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/004-parent-phase4-speckit.md)
> **Labels**: `phase-4a`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M5: Spec-Kit Core
> **Estimate**: 4 hours
> **Depends On**: P4-001
> **Blocks**: P4-004, P4-013

## Context

The constitution parser extracts structured data from CONSTITUTION.md to enable spec validation.

## Task Description

Create parser to extract structured data from CONSTITUTION.md:

**Create `src/strategies/speckit/constitution-parser.ts`:**
```typescript
import type { Constitution, Principle, Constraint, ArchitectureRule, DesignPrinciple } from './types.js';

const PRINCIPLE_PATTERN = /^###\s+(P\d+):\s+(.+)$/gm;
const CONSTRAINT_PATTERN = /^###\s+(C\d+):\s+(.+)$/gm;
const ARCH_RULE_PATTERN = /^###\s+(AR\d+):\s+(.+)$/gm;
const DESIGN_PRINCIPLE_PATTERN = /^###\s+(DP\d+):\s+(.+)$/gm;

export function parseConstitution(content: string): Constitution {
  return {
    principles: extractPrinciples(content),
    constraints: extractConstraints(content),
    architectureRules: extractArchitectureRules(content),
    designPrinciples: extractDesignPrinciples(content),
    metadata: extractMetadata(content),
  };
}

function extractPrinciples(content: string): Principle[] {
  const principles: Principle[] = [];
  const matches = content.matchAll(PRINCIPLE_PATTERN);

  for (const match of matches) {
    const [_, id, title] = match;
    const description = extractSectionContent(content, match.index!);

    principles.push({
      id,
      title,
      description,
      type: 'principle',
    });
  }

  return principles;
}

function extractConstraints(content: string): Constraint[] {
  // Similar implementation for constraints
}

function extractArchitectureRules(content: string): ArchitectureRule[] {
  // Similar implementation for architecture rules
}

function extractDesignPrinciples(content: string): DesignPrinciple[] {
  // Similar implementation for design principles
}

function extractSectionContent(content: string, startIndex: number): string {
  // Extract content until next heading or end
}

function extractMetadata(content: string): ConstitutionMetadata | undefined {
  // Extract title, version, date from front matter
}
```

## Acceptance Criteria

- [ ] File: `src/strategies/speckit/constitution-parser.ts`
- [ ] `parseConstitution()` returns structured Constitution
- [ ] Extracts principles (P1, P2, etc.)
- [ ] Extracts constraints (C1, C2, etc.)
- [ ] Extracts architecture rules (AR1, etc.)
- [ ] Extracts design principles (DP1, etc.)
- [ ] Unit tests with sample constitution

## Files to Create

- `src/strategies/speckit/constitution-parser.ts`
- `tests/vitest/strategies/speckit/constitution-parser.spec.ts`

## Files to Modify

- `src/strategies/speckit/types.ts` — add interfaces

## Verification

```bash
npm run build && npm run test:vitest -- constitution-parser
```

## References

- [SPEC-005: Spec-Kit Integration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-005-speckit-integration.md)
- [TASKS Phase 4](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-4-speckit-integration.md) P4-002
