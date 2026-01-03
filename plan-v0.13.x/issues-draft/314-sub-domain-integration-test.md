# 🔧 P2-014: Domain Layer Integration Test [serial]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`
> **Milestone**: M3: Domain Layer
> **Estimate**: 3 hours
> **Depends On**: P2-006, P2-007, P2-012

## Context

After domain extraction, we need integration tests to verify:
- Domain functions work correctly
- Tools correctly call domain and format results
- Error propagation works through the layers
- Type safety is maintained

## Task Description

Create integration tests for domain layer:

**Create `tests/vitest/domain/integration.spec.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { buildHierarchicalPrompt } from '../../../src/domain/prompting/hierarchical-builder.js';
import { calculateCleanCodeScore } from '../../../src/domain/analysis/code-scorer.js';
import { createSession, updateSessionPhase } from '../../../src/domain/design/session-manager.js';
import { hierarchicalPromptBuilder } from '../../../src/tools/prompt/hierarchical-prompt-builder.js';

describe('Domain Layer Integration', () => {
  describe('Prompting Domain → Tool Flow', () => {
    it('domain function returns structured result', () => {
      const result = buildHierarchicalPrompt({
        goal: 'Review code for security issues',
        context: 'Node.js authentication module',
        requirements: ['Check for injection', 'Verify input validation'],
      });

      expect(result.sections).toHaveLength(3);
      expect(result.metadata.technique).toBe('zero-shot');
      expect(result.metadata.estimatedTokens).toBeGreaterThan(0);
    });

    it('tool returns formatted markdown', async () => {
      const result = await hierarchicalPromptBuilder({
        goal: 'Review code',
      });

      expect(result.content[0].text).toContain('# Goal');
    });
  });

  describe('Analysis Domain → Tool Flow', () => {
    it('scoring domain returns numeric result', () => {
      const result = calculateCleanCodeScore({
        coverageMetrics: { lineCoverage: 80, branchCoverage: 70, functionCoverage: 90 },
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.breakdown).toHaveProperty('coverage');
    });
  });

  describe('Design Domain → Tool Flow', () => {
    it('session lifecycle works through domain', () => {
      const session = createSession('test-123', { goal: 'Test' });
      expect(session.phase).toBe('discovery');

      const updated = updateSessionPhase('test-123', 'requirements', 'Gathered requirements');
      expect(updated.phase).toBe('requirements');
      expect(updated.history).toHaveLength(1);
    });
  });

  describe('Error Propagation', () => {
    it('domain errors propagate to tool response', async () => {
      const result = await hierarchicalPromptBuilder({} as any);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('MISSING_REQUIRED_FIELD');
    });
  });
});
```

## Acceptance Criteria

- [ ] Test file: `tests/vitest/domain/integration.spec.ts`
- [ ] Tests domain→tool flow for prompting
- [ ] Tests domain→tool flow for analysis
- [ ] Tests domain→tool flow for design
- [ ] Tests error propagation
- [ ] Tests type safety (no `any` escapes)
- [ ] All tests pass

## Files to Create

- `tests/vitest/domain/integration.spec.ts`

## Verification

```bash
npm run test:vitest -- integration
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-014
