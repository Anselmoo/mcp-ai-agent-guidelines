# T-048: Implement GAP-008: validate_progress Tool

**Task ID**: T-048
**Phase**: 3
**Priority**: P0
**Estimate**: 6h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: None

---

## 1. Overview

### What

Complete the 'Implement GAP-008: validate_progress Tool' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-048
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Implement GAP-008: validate_progress Tool fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- None

### Target Files

- `src/tools/enforcement/validate-progress.ts`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Create Progress Validation Tool Schema

Create `src/tools/enforcement/validate-progress.ts`:

```typescript
import { z } from 'zod';
import type { ProgressValidationResult, TaskProgress, PhaseProgress } from './types.js';

// Task progress schema
export const taskProgressSchema = z.object({
  taskId: z.string().describe('Task identifier (e.g., T-001)'),
  status: z.enum(['not-started', 'in-progress', 'completed', 'blocked']).describe('Current task status'),
  completedCriteria: z.array(z.string()).optional().describe('List of completed acceptance criteria'),
  totalCriteria: z.number().optional().describe('Total number of acceptance criteria'),
  blockedBy: z.array(z.string()).optional().describe('Tasks blocking this task'),
  notes: z.string().optional().describe('Progress notes'),
});

// Phase progress schema
export const phaseProgressSchema = z.object({
  phaseId: z.string().describe('Phase identifier (e.g., phase-1)'),
  phaseName: z.string().describe('Phase name'),
  totalTasks: z.number().describe('Total tasks in phase'),
  completedTasks: z.number().describe('Number of completed tasks'),
  blockedTasks: z.number().default(0).describe('Number of blocked tasks'),
  progress: z.number().min(0).max(100).describe('Progress percentage'),
});

// Validation request schema
export const validateProgressRequestSchema = z.object({
  projectPath: z.string().describe('Path to project root'),
  tasksDir: z.string().optional().describe('Path to tasks directory'),
  includeDetails: z.boolean().default(true).describe('Include detailed task breakdown'),
  validateDependencies: z.boolean().default(true).describe('Validate task dependencies'),
  outputFormat: z.enum(['summary', 'detailed', 'json']).default('detailed'),
});

export type ValidateProgressRequest = z.infer<typeof validateProgressRequestSchema>;
```

### Step 4.2: Implement Progress Validator

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

export async function validateProgress(
  request: ValidateProgressRequest
): Promise<ProgressValidationResult> {
  const validated = validateProgressRequestSchema.parse(request);
  const tasksDir = validated.tasksDir ?? path.join(validated.projectPath, 'tasks');

  // Find all task files
  const taskFiles = await glob(`${tasksDir}/**/T-*.md`);
  const tasks = await Promise.all(taskFiles.map(parseTaskFile));

  // Group by phase
  const phases = groupTasksByPhase(tasks);

  // Calculate progress
  const phaseProgress: PhaseProgress[] = phases.map(calculatePhaseProgress);

  // Validate dependencies
  const dependencyIssues = validated.validateDependencies
    ? validateDependencies(tasks)
    : [];

  // Calculate overall progress
  const overallProgress = calculateOverallProgress(phaseProgress);

  return {
    success: true,
    overallProgress,
    phases: phaseProgress,
    tasks: validated.includeDetails ? tasks : undefined,
    dependencyIssues,
    timestamp: new Date().toISOString(),
  };
}

async function parseTaskFile(filePath: string): Promise<TaskProgress> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const taskId = path.basename(filePath, '.md').match(/T-\d+/)?.[0] ?? 'unknown';

  // Parse acceptance criteria
  const criteriaMatch = content.match(/## \d+\.\s*Acceptance Criteria[\s\S]*?\|(.*?)\|/g);
  const completedCount = (content.match(/✅/g) || []).length;
  const totalCount = (criteriaMatch || []).length;

  // Determine status from content
  const status = determineStatus(content, completedCount, totalCount);

  return {
    taskId,
    status,
    completedCriteria: extractCompletedCriteria(content),
    totalCriteria: totalCount,
    filePath,
  };
}

function determineStatus(
  content: string,
  completed: number,
  total: number
): TaskProgress['status'] {
  if (content.includes('BLOCKED')) return 'blocked';
  if (completed === 0) return 'not-started';
  if (completed >= total) return 'completed';
  return 'in-progress';
}
```

### Step 4.3: Register Tool Handler

Update `src/index.ts`:

```typescript
import { validateProgress, validateProgressRequestSchema } from './tools/enforcement/validate-progress.js';

server.tool(
  'validate_progress',
  'Validate project progress against task definitions',
  validateProgressRequestSchema,
  {
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      title: 'Progress Validator',
    },
  },
  async (request) => {
    const result = await validateProgress(request);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);
```

### Step 4.4: Create Unit Tests

Create `tests/vitest/tools/enforcement/validate-progress.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateProgress, validateProgressRequestSchema } from '../../../../src/tools/enforcement/validate-progress.js';

describe('validate-progress', () => {
  it('validates request schema', () => {
    const result = validateProgressRequestSchema.safeParse({
      projectPath: '/path/to/project',
    });
    expect(result.success).toBe(true);
  });

  it('calculates progress correctly', async () => {
    const result = await validateProgress({
      projectPath: process.cwd(),
      tasksDir: 'plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks',
    });
    expect(result.success).toBe(true);
    expect(result.overallProgress).toBeGreaterThanOrEqual(0);
    expect(result.phases).toBeDefined();
  });
});
```

## 5. Testing Strategy

- Add/update unit tests for new logic
- Cover error handling and edge cases
- Run `npm run quality` before finalizing

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                                 | Status | Verification |
| ----------------------------------------- | ------ | ------------ |
| Implementation completed per requirements | ⬜      | TBD          |
| Integration points wired and documented   | ⬜      | TBD          |
| Quality checks pass                       | ⬜      | TBD          |

---

## 8. References

- [spec.md](../../spec.md)
- [tasks.md](../../tasks.md)
- `src/tools/enforcement/validate-progress.ts`
- [issue template](../../issues/templates/issue-027-enforcement-tools.md)

---

*Task: T-048 | Phase: 3 | Priority: P0*
