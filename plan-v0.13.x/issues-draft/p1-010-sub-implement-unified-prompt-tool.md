# 🔧 P1-014: Implement Unified Prompt-Hierarchy Tool [serial]

> **Parent**: #TBD
> **Labels**: `phase-1`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M2: Discoverability
> **Estimate**: 8 hours
> **Blocked by**: P1-013

## Context

Implement the unified `prompt-hierarchy` tool based on P1-013 API design.

## Task Description

Create the unified tool by:
1. Extracting shared logic from existing tools
2. Implementing mode-based routing
3. Maintaining all existing functionality

```typescript
// src/tools/prompt/prompt-hierarchy.ts
import { z } from 'zod';
import { buildHierarchicalPrompt } from './hierarchical-prompt-builder.js';
import { selectHierarchyLevel } from './hierarchy-level-selector.js';
import { evaluatePrompt } from './prompting-hierarchy-evaluator.js';

export const promptHierarchySchema = z.object({
  mode: z.enum(['build', 'select', 'evaluate']),
  // ... mode-specific fields with .optional()
});

export async function promptHierarchy(args: z.infer<typeof promptHierarchySchema>) {
  switch (args.mode) {
    case 'build':
      return buildHierarchicalPrompt(args);
    case 'select':
      return selectHierarchyLevel(args);
    case 'evaluate':
      return evaluatePrompt(args);
  }
}
```

## Acceptance Criteria

- [ ] File created: `src/tools/prompt/prompt-hierarchy.ts`
- [ ] All 3 modes working correctly
- [ ] Shared utility functions extracted
- [ ] Unit tests for each mode
- [ ] 90%+ test coverage
- [ ] Existing functionality preserved

## Files to Change

| Action | Path |
|--------|------|
| Create | `src/tools/prompt/prompt-hierarchy.ts` |
| Create | `tests/vitest/tools/prompt/prompt-hierarchy.spec.ts` |
| Modify | `src/tools/prompt/index.ts` (barrel export) |

## Test Structure

```typescript
// tests/vitest/tools/prompt/prompt-hierarchy.spec.ts
describe('prompt-hierarchy', () => {
  describe('build mode', () => {
    it('should create structured prompt from context/goal/requirements');
    it('should handle missing optional fields');
  });

  describe('select mode', () => {
    it('should recommend level based on complexity');
    it('should consider agent capability');
  });

  describe('evaluate mode', () => {
    it('should score prompt against criteria');
    it('should provide improvement suggestions');
  });
});
```

## Dependencies

- **Blocked by**: P1-013 (API design)
- **Blocks**: P1-015, P1-016

## References

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md#implementation)
- API design from P1-013
