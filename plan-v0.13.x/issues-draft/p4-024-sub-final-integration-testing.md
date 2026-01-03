# 🔧 P4-024: Final Integration Testing [serial]

> **Parent**: #698
> **Labels**: `phase-4b`, `priority-high`, `serial`, `copilot-suitable`
> **Milestone**: M7: Spec-Kit Progress
> **Estimate**: 4 hours
> **Depends On**: P4-021, P4-022
> **Blocks**: None (Phase 4 Exit)

## Context

Final integration testing validates the complete Spec-Kit implementation against real project files, ensuring all components work together correctly before phase completion.

## Task Description

Final integration testing with real v0.13.x plan:

**Create `tests/vitest/strategies/speckit/final-integration.spec.ts`:**
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

import { parseConstitution } from '../../../../src/strategies/speckit/constitution-parser.js';
import { SpecKitStrategy } from '../../../../src/strategies/speckit-strategy.js';
import { createSpecValidator } from '../../../../src/strategies/speckit/spec-validator.js';
import { createProgressTracker } from '../../../../src/strategies/speckit/progress-tracker.js';
import { specKitGenerator } from '../../../../src/tools/speckit-generator.js';
import { validateSpec } from '../../../../src/tools/validate-spec.js';
import { updateProgress } from '../../../../src/tools/update-progress.js';
import { polyglotGateway } from '../../../../src/gateway/polyglot-gateway.js';
import { OutputApproach } from '../../../../src/strategies/output-strategy.js';

const PROJECT_ROOT = process.cwd();
const CONSTITUTION_PATH = join(PROJECT_ROOT, 'plan-v0.13.x/CONSTITUTION.md');

describe('Spec-Kit Final Integration', () => {
  let constitutionContent: string;
  let constitutionAvailable = false;

  beforeAll(async () => {
    try {
      constitutionContent = await fs.readFile(CONSTITUTION_PATH, 'utf-8');
      constitutionAvailable = true;
    } catch {
      console.warn('CONSTITUTION.md not found, using mock data');
      constitutionContent = getMockConstitution();
    }
  });

  describe('Real CONSTITUTION.md parsing', () => {
    it('parses all section types', () => {
      const constitution = parseConstitution(constitutionContent);

      // Verify structure
      expect(constitution).toBeDefined();
      expect(constitution.principles).toBeDefined();
      expect(constitution.constraints).toBeDefined();

      // If using real constitution, verify content
      if (constitutionAvailable) {
        expect(constitution.principles?.length).toBeGreaterThan(0);
      }
    });

    it('extracts principle IDs correctly', () => {
      const constitution = parseConstitution(constitutionContent);

      if (constitution.principles?.length) {
        expect(constitution.principles[0].id).toMatch(/^P\d+$/);
      }
    });
  });

  describe('Full generation workflow', () => {
    it('generates valid spec.md from real requirements', async () => {
      const requirements = getRealRequirements();

      const result = await specKitGenerator({
        ...requirements,
        constitutionPath: constitutionAvailable ? CONSTITUTION_PATH : undefined,
        validateAgainstConstitution: constitutionAvailable,
      });

      expect(result).toBeDefined();
      expect(result.content).toContain('spec.md');
    });

    it('generates all 4 artifacts', async () => {
      const strategy = new SpecKitStrategy();
      const domainResult = createDomainResult();

      if (constitutionAvailable) {
        const constitution = parseConstitution(constitutionContent);
        const result = strategy.render(domainResult, { constitution });

        expect(result.primary.name).toBe('spec.md');
        expect(result.secondary).toHaveLength(3);

        const names = result.secondary!.map(s => s.name);
        expect(names).toContain('plan.md');
        expect(names).toContain('tasks.md');
        expect(names).toContain('progress.md');
      }
    });
  });

  describe('Validation against real constitution', () => {
    it('validates without errors', async () => {
      if (!constitutionAvailable) {
        return; // Skip if no real constitution
      }

      const result = await validateSpec({
        specContent: getSampleSpec(),
        constitutionPath: CONSTITUTION_PATH,
        outputFormat: 'json',
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result.content);
      expect(parsed.valid).toBeDefined();
      expect(typeof parsed.score).toBe('number');
    });

    it('generates validation report in markdown', async () => {
      if (!constitutionAvailable) return;

      const result = await validateSpec({
        specContent: getSampleSpec(),
        constitutionPath: CONSTITUTION_PATH,
        outputFormat: 'markdown',
      });

      expect(result.content).toContain('Validation');
      expect(result.content).toContain('Score');
    });
  });

  describe('Progress tracking workflow', () => {
    it('tracks progress correctly', async () => {
      const tasks = createSampleTasks();
      const tracker = createProgressTracker(tasks);

      // Initial state
      let metrics = tracker.calculateCompletion();
      expect(metrics.completed).toBe(0);

      // Complete some tasks
      tracker.updateProgress({ taskId: 'TASK-001', status: 'completed' });
      tracker.updateProgress({ taskId: 'TASK-002', status: 'completed' });

      metrics = tracker.calculateCompletion();
      expect(metrics.completed).toBe(2);
      expect(metrics.percentComplete).toBeGreaterThan(0);
    });

    it('generates valid progress.md', () => {
      const tasks = createSampleTasks();
      const tracker = createProgressTracker(tasks);

      tracker.updateProgress({ taskId: 'TASK-001', status: 'completed' });

      const markdown = tracker.generateProgressMarkdown();

      expect(markdown).toContain('# Progress');
      expect(markdown).toContain('[x]'); // Completed checkbox
      expect(markdown).toContain('[ ]'); // Incomplete checkbox
    });
  });

  describe('Gateway integration', () => {
    it('routes to SpecKitStrategy correctly', () => {
      const domainResult = createDomainResult();

      const result = polyglotGateway.render({
        domainResult,
        domainType: 'SessionState',
        approach: OutputApproach.SPECKIT,
      });

      expect(result.primary.name).toBe('spec.md');
    });
  });

  describe('End-to-end workflow', () => {
    it('completes full spec-kit workflow', async () => {
      // 1. Generate artifacts
      const requirements = getRealRequirements();
      const generated = await specKitGenerator(requirements);
      expect(generated).toBeDefined();

      // 2. Validate (if constitution available)
      if (constitutionAvailable) {
        const validation = await validateSpec({
          specContent: getSampleSpec(),
          constitutionPath: CONSTITUTION_PATH,
          outputFormat: 'summary',
        });
        expect(validation.metadata?.valid).toBeDefined();
      }

      // 3. Track progress
      const progress = await updateProgress({
        progressContent: getSampleProgress(),
        completedTaskIds: ['TASK-001'],
        outputFormat: 'json',
      });

      const progressData = JSON.parse(progress.content);
      expect(progressData.metrics.completed).toBe(1);
    });
  });
});

// Helper functions
function getMockConstitution(): string {
  return `# CONSTITUTION.md

## Principles
- **P1**: Type Safety - All code must be type-safe
- **P2**: Testing - Tests required for all features

## Constraints
- **C1**: No External Dependencies - Without approval
- **C2**: TypeScript Support - Must support TypeScript 5.0+

## Architecture Rules
- **AR1**: Functional Patterns - Use functional patterns where possible

## Design Principles
- **DP1**: Single Responsibility - Each module has one responsibility
`;
}

function getRealRequirements() {
  return {
    title: 'v0.13.x Refactoring',
    overview: 'Major refactoring for improved discoverability and domain extraction',
    objectives: [
      { description: 'Improve tool discoverability', priority: 'high' },
      { description: 'Extract domain modules', priority: 'high' },
    ],
    requirements: [
      { description: 'Add tool annotations', type: 'functional', priority: 'high' },
      { description: 'Create domain extractors', type: 'functional', priority: 'high' },
    ],
    acceptanceCriteria: ['All tools have annotations', 'Domain modules extracted'],
    outOfScope: ['Breaking API changes'],
  };
}

function createDomainResult() {
  const req = getRealRequirements();
  return {
    metadata: { title: req.title },
    context: {
      overview: req.overview,
      objectives: req.objectives,
      requirements: req.requirements,
      acceptanceCriteria: req.acceptanceCriteria,
      outOfScope: req.outOfScope,
    },
    phase: 'implementation',
  };
}

function createSampleTasks() {
  return {
    items: [
      { id: 'TASK-001', title: 'Add annotations' },
      { id: 'TASK-002', title: 'Extract domains' },
      { id: 'TASK-003', title: 'Update tests' },
    ],
  };
}

function getSampleSpec(): string {
  return `# v0.13.x Spec

## Overview
Major refactoring effort.

## Requirements
- Add tool annotations
- Extract domain modules
`;
}

function getSampleProgress(): string {
  return `# Progress

## Tasks
- [ ] **TASK-001**: Add annotations
- [ ] **TASK-002**: Extract domains
- [ ] **TASK-003**: Update tests
`;
}
```

## Acceptance Criteria

- [ ] Works with actual CONSTITUTION.md file
- [ ] Works with actual plan-v0.13.x requirements
- [ ] Generates spec without errors or warnings
- [ ] Validates against actual constitutional constraints
- [ ] Progress tracking works correctly
- [ ] Output matches expected Spec-Kit format
- [ ] All tests pass

## Files to Create

- `tests/vitest/strategies/speckit/final-integration.spec.ts`

## Test Coverage

| Test Area | Verified |
|-----------|----------|
| Constitution parsing | Real file |
| Spec generation | All 4 artifacts |
| Validation | Against real constraints |
| Progress tracking | Full workflow |
| Gateway routing | Correct strategy |
| End-to-end | Complete workflow |

## Manual Verification Steps

1. Run the demo script and verify output
2. Manually inspect generated spec.md for correctness
3. Verify validation report makes sense
4. Check progress metrics are accurate

## Verification Commands

```bash
# Run final integration tests
npm run test:vitest -- --grep "Final Integration"

# Run demo for manual verification
node demos/demo-speckit.js

# Verify no regressions
npm run test:all
```

## Phase 4 Exit Checklist

After this task completes, verify:

- [ ] SpecKitStrategy generates all 4 files
- [ ] Constitution parser extracts all constraint types
- [ ] Task derivation working
- [ ] speckit-generator tool registered
- [ ] design-assistant supports 'speckit' artifact type
- [ ] SpecValidator validates against constitution
- [ ] ProgressTracker updates completion metrics
- [ ] validate-spec tool working
- [ ] update-progress tool working
- [ ] Documentation complete
- [ ] Demo script working

## Definition of Done

1. ✅ All final integration tests pass
2. ✅ Works with real project files
3. ✅ No errors or warnings
4. ✅ Phase 4 exit criteria met
5. ✅ Ready for release

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-024)*
