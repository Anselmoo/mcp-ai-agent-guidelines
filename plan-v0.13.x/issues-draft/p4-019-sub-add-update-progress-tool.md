# 🔧 P4-019: Add update-progress Tool [serial]

> **Parent**: [004-parent-phase4-speckit.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/004-parent-phase4-speckit.md)
> **Labels**: `phase-4b`, `priority-medium`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M7: Spec-Kit Progress
> **Estimate**: 2 hours
> **Depends On**: P4-017
> **Blocks**: P4-020

## Context

An update-progress tool provides direct MCP access to the ProgressTracker, allowing AI agents and external tools to mark tasks complete and update progress.md.

## Task Description

Create tool to update progress.md:

**Create `src/schemas/update-progress.ts`:**
```typescript
import { z } from 'zod';

export const updateProgressSchema = z.object({
  progressPath: z.string().optional().describe('Path to existing progress.md'),
  progressContent: z.string().optional().describe('Current progress.md content'),
  tasksPath: z.string().optional().describe('Path to tasks.md for task list'),
  completedTaskIds: z.array(z.string()).describe('Task IDs to mark as completed'),
  taskUpdates: z.array(z.object({
    taskId: z.string(),
    status: z.enum(['completed', 'in-progress', 'blocked']),
    notes: z.string().optional(),
  })).optional().describe('Detailed task status updates'),
  syncFromGit: z.boolean().default(false).describe('Also sync from git commits'),
  gitOptions: z.object({
    repoPath: z.string().optional(),
    branch: z.string().optional(),
    since: z.string().optional(),
  }).optional(),
  outputFormat: z.enum(['markdown', 'json']).default('markdown'),
});

export type UpdateProgressRequest = z.infer<typeof updateProgressSchema>;
```

**Create `src/tools/update-progress.ts`:**
```typescript
import { createProgressTracker, ProgressUpdate } from '../strategies/speckit/progress-tracker.js';
import { parseTasksFromMarkdown } from '../strategies/speckit/tasks-parser.js';
import { createMcpResponse } from './shared/response-utils.js';
import { promises as fs } from 'node:fs';
import type { UpdateProgressRequest } from '../schemas/update-progress.js';

export async function updateProgress(request: UpdateProgressRequest) {
  // Load tasks if available
  let tasks;
  if (request.tasksPath) {
    const tasksContent = await fs.readFile(request.tasksPath, 'utf-8');
    tasks = parseTasksFromMarkdown(tasksContent);
  }

  // Create tracker
  const tracker = createProgressTracker(tasks);

  // Load existing progress if available
  if (request.progressContent) {
    tracker.loadProgress(request.progressContent);
  } else if (request.progressPath) {
    await tracker.loadProgressFromFile(request.progressPath);
  }

  // Apply simple completions
  if (request.completedTaskIds) {
    for (const taskId of request.completedTaskIds) {
      tracker.updateProgress({
        taskId,
        status: 'completed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Apply detailed updates
  if (request.taskUpdates) {
    tracker.updateMultiple(request.taskUpdates.map(u => ({
      taskId: u.taskId,
      status: u.status,
      notes: u.notes,
      timestamp: new Date().toISOString(),
    })));
  }

  // Sync from git if requested
  let gitUpdates: ProgressUpdate[] = [];
  if (request.syncFromGit) {
    gitUpdates = tracker.syncFromGit(request.gitOptions ?? {});
  }

  // Calculate metrics
  const metrics = tracker.calculateCompletion();

  // Generate output
  let output: string;
  if (request.outputFormat === 'json') {
    output = JSON.stringify({
      metrics,
      gitUpdates: gitUpdates.length > 0 ? gitUpdates : undefined,
      progressMarkdown: tracker.generateProgressMarkdown(),
    }, null, 2);
  } else {
    output = tracker.generateProgressMarkdown();
  }

  return createMcpResponse({
    content: output,
    metadata: {
      ...metrics,
      gitUpdatesApplied: gitUpdates.length,
    },
  });
}
```

**Update `src/index.ts`:**
```typescript
import { updateProgress } from './tools/update-progress.js';
import { updateProgressSchema } from './schemas/update-progress.js';

// Add to tools array
{
  name: 'update-progress',
  description: 'Update spec progress.md with completed tasks and recalculate metrics',
  inputSchema: zodToJsonSchema(updateProgressSchema),
  annotations: {
    audience: ['developers'],
    readOnlyHint: false,
    idempotentHint: false,
  },
}
```

## Acceptance Criteria

- [ ] `update-progress` tool registered in index.ts
- [ ] Accepts task IDs array for batch completion
- [ ] Accepts detailed task updates with status and notes
- [ ] Optional git sync integration
- [ ] Returns updated progress.md content
- [ ] Returns completion metrics
- [ ] Unit tests pass

## Files to Create

- `src/schemas/update-progress.ts`
- `src/tools/update-progress.ts`
- `tests/vitest/tools/update-progress.spec.ts`

## Files to Modify

- `src/index.ts`

## Example Usage

```typescript
// Mark tasks complete
{
  "tool": "update-progress",
  "arguments": {
    "progressPath": "./progress.md",
    "completedTaskIds": ["P4-001", "P4-002"],
    "outputFormat": "markdown"
  }
}

// With git sync
{
  "tool": "update-progress",
  "arguments": {
    "progressPath": "./progress.md",
    "syncFromGit": true,
    "gitOptions": {
      "since": "2026-01-01"
    }
  }
}
```

## Verification Commands

```bash
npm run test:vitest -- --grep "update-progress"
npm run build
```

## Definition of Done

1. ✅ Tool registered and working
2. ✅ Accepts task ID arrays
3. ✅ Returns updated progress
4. ✅ Unit tests pass

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-019)*
