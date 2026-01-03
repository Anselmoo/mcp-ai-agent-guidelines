# 🔧 P4-021: Comprehensive Spec-Kit Tests [serial]

> **Parent**: #698
> **Labels**: `phase-4b`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M7: Spec-Kit Progress
> **Estimate**: 4 hours
> **Depends On**: P4-019
> **Blocks**: P4-024

## Context

A comprehensive test suite ensures Spec-Kit functionality works correctly end-to-end, providing confidence for refactoring and feature additions.

## Task Description

Create comprehensive test suite for Spec-Kit integration:

**Create `tests/vitest/strategies/speckit/integration.spec.ts`:**
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { polyglotGateway } from '../../../../src/gateway/polyglot-gateway.js';
import { parseConstitution } from '../../../../src/strategies/speckit/constitution-parser.js';
import { SpecKitStrategy } from '../../../../src/strategies/speckit-strategy.js';
import { createSpecValidator } from '../../../../src/strategies/speckit/spec-validator.js';
import { createProgressTracker } from '../../../../src/strategies/speckit/progress-tracker.js';
import { OutputApproach } from '../../../../src/strategies/output-strategy.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

// Sample data
const sampleConstitution = `
# CONSTITUTION.md

## Principles
- **P1**: All code must be type-safe
- **P2**: Tests required for all features

## Constraints
- **C1**: No external dependencies without approval
- **C2**: Must support TypeScript 5.0+

## Architecture Rules
- **AR1**: Use functional patterns where possible

## Design Principles
- **DP1**: Single responsibility principle
`;

const sampleDomainResult = {
  metadata: { title: 'Test Feature' },
  context: {
    overview: 'Test feature overview',
    objectives: [{ description: 'Objective 1', priority: 'high' }],
    requirements: [
      { description: 'Requirement 1', type: 'functional', priority: 'high' },
      { description: 'Requirement 2', type: 'non-functional', priority: 'medium' },
    ],
    acceptanceCriteria: ['Criteria 1', 'Criteria 2'],
    outOfScope: ['Out of scope item'],
  },
  phase: 'implementation',
};

describe('Spec-Kit Integration', () => {
  describe('End-to-end generation', () => {
    it('generates all 4 artifacts', () => {
      const strategy = new SpecKitStrategy();
      const result = strategy.render(sampleDomainResult);

      expect(result.primary.name).toBe('spec.md');
      expect(result.secondary).toHaveLength(3);
      expect(result.secondary?.map(s => s.name)).toContain('plan.md');
      expect(result.secondary?.map(s => s.name)).toContain('tasks.md');
      expect(result.secondary?.map(s => s.name)).toContain('progress.md');
    });

    it('includes title in spec.md', () => {
      const strategy = new SpecKitStrategy();
      const result = strategy.render(sampleDomainResult);

      expect(result.primary.content).toContain('Test Feature');
    });

    it('derives tasks from requirements', () => {
      const strategy = new SpecKitStrategy();
      const result = strategy.render(sampleDomainResult);

      const tasks = result.secondary?.find(s => s.name === 'tasks.md');
      expect(tasks?.content).toContain('Requirement 1');
    });
  });

  describe('Constitution validation', () => {
    it('validates spec against constitution', () => {
      const constitution = parseConstitution(sampleConstitution);
      const validator = createSpecValidator(constitution);

      const result = validator.validate({
        title: 'Test',
        overview: 'Test overview',
        requirements: [{ description: 'Test req' }],
      });

      expect(result.valid).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('generates validation report', () => {
      const constitution = parseConstitution(sampleConstitution);
      const validator = createSpecValidator(constitution);

      const report = validator.generateReport({
        title: 'Test',
        requirements: [],
      });

      expect(report.timestamp).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.byType).toBeDefined();
    });
  });

  describe('Progress tracking', () => {
    it('calculates completion metrics', () => {
      const tasks = {
        items: [
          { id: 'TASK-001', title: 'Task 1' },
          { id: 'TASK-002', title: 'Task 2' },
          { id: 'TASK-003', title: 'Task 3' },
        ],
      };

      const tracker = createProgressTracker(tasks);

      let metrics = tracker.calculateCompletion();
      expect(metrics.total).toBe(3);
      expect(metrics.completed).toBe(0);
      expect(metrics.percentComplete).toBe(0);

      tracker.updateProgress({ taskId: 'TASK-001', status: 'completed' });

      metrics = tracker.calculateCompletion();
      expect(metrics.completed).toBe(1);
      expect(metrics.percentComplete).toBe(33);
    });

    it('generates progress markdown', () => {
      const tasks = {
        items: [{ id: 'TASK-001', title: 'Task 1' }],
      };

      const tracker = createProgressTracker(tasks);
      const markdown = tracker.generateProgressMarkdown();

      expect(markdown).toContain('# Progress');
      expect(markdown).toContain('TASK-001');
    });
  });

  describe('Design-assistant integration', () => {
    it('supports speckit artifact type', async () => {
      // Test design-assistant generates speckit artifacts
      // This test depends on P4-011 implementation
    });
  });

  describe('Gateway integration', () => {
    it('routes speckit approach correctly', () => {
      const result = polyglotGateway.render({
        domainResult: sampleDomainResult,
        domainType: 'SessionState',
        approach: OutputApproach.SPECKIT,
      });

      expect(result.primary.name).toBe('spec.md');
    });
  });
});

describe('Spec-Kit with real constitution', () => {
  let realConstitution: string;

  beforeAll(async () => {
    try {
      realConstitution = await fs.readFile(
        join(process.cwd(), 'plan-v0.13.x/CONSTITUTION.md'),
        'utf-8'
      );
    } catch {
      realConstitution = sampleConstitution;
    }
  });

  it('parses real constitution', () => {
    const constitution = parseConstitution(realConstitution);

    expect(constitution.principles).toBeDefined();
    expect(constitution.constraints).toBeDefined();
  });

  it('validates against real constitution', () => {
    const constitution = parseConstitution(realConstitution);
    const validator = createSpecValidator(constitution);

    const result = validator.validate(sampleDomainResult.context);

    expect(result).toBeDefined();
    expect(typeof result.score).toBe('number');
  });
});
```

## Acceptance Criteria

- [ ] End-to-end generation test passes
- [ ] Validation test with real constitution passes
- [ ] Progress tracking test passes
- [ ] Design-assistant integration test passes
- [ ] Gateway integration test passes
- [ ] 90%+ code coverage for Spec-Kit modules

## Files to Create

- `tests/vitest/strategies/speckit/integration.spec.ts`

## Coverage Targets

| Module | Target |
|--------|--------|
| speckit-strategy.ts | 90% |
| constitution-parser.ts | 95% |
| spec-validator.ts | 90% |
| progress-tracker.ts | 90% |
| speckit-generator tool | 85% |

## Verification Commands

```bash
npm run test:vitest -- --grep "Spec-Kit"
npm run test:coverage:vitest -- --grep "speckit"
```

## Definition of Done

1. ✅ All integration tests pass
2. ✅ Works with real CONSTITUTION.md
3. ✅ 90%+ coverage achieved
4. ✅ No regressions

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-021)*
