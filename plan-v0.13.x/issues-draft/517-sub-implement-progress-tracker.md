# 🔧 P4-017: Implement ProgressTracker [serial]

> **Parent**: [004-parent-phase4-speckit.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/004-parent-phase4-speckit.md)
> **Labels**: `phase-4b`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M7: Spec-Kit Progress
> **Estimate**: 4 hours
> **Depends On**: P4-008
> **Blocks**: P4-018, P4-019

## Context

A ProgressTracker service manages spec progress state, calculating completion metrics and updating progress.md as tasks are completed.

## Task Description

Create service for tracking spec progress:

**Create `src/strategies/speckit/progress-tracker.ts`:**
```typescript
import type { Tasks, Progress, ProgressMetrics } from './types.js';
import { promises as fs } from 'node:fs';

export interface TaskStatus {
  id: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface ProgressUpdate {
  taskId: string;
  status: 'completed' | 'in-progress' | 'blocked';
  notes?: string;
  timestamp?: string;
}

export class ProgressTracker {
  private taskStatuses: Map<string, TaskStatus> = new Map();

  constructor(private tasks?: Tasks) {
    this.initializeFromTasks();
  }

  private initializeFromTasks(): void {
    if (!this.tasks?.items) return;

    for (const task of this.tasks.items) {
      this.taskStatuses.set(task.id, {
        id: task.id,
        completed: false,
      });
    }
  }

  /**
   * Load progress from existing progress.md content
   */
  loadProgress(content: string): void {
    // Parse progress.md format
    const completedPattern = /- \[x\] (.+)/gi;
    const matches = content.matchAll(completedPattern);

    for (const match of matches) {
      const taskRef = this.extractTaskId(match[1]);
      if (taskRef && this.taskStatuses.has(taskRef)) {
        const status = this.taskStatuses.get(taskRef)!;
        status.completed = true;
        status.completedAt = new Date().toISOString();
      }
    }
  }

  /**
   * Load progress from file
   */
  async loadProgressFromFile(path: string): Promise<void> {
    const content = await fs.readFile(path, 'utf-8');
    this.loadProgress(content);
  }

  /**
   * Update progress for a specific task
   */
  updateProgress(update: ProgressUpdate): void {
    const status = this.taskStatuses.get(update.taskId);
    if (!status) {
      throw new Error(`Unknown task: ${update.taskId}`);
    }

    status.completed = update.status === 'completed';
    status.completedAt = update.status === 'completed'
      ? (update.timestamp ?? new Date().toISOString())
      : undefined;
    status.notes = update.notes;
  }

  /**
   * Batch update multiple tasks
   */
  updateMultiple(updates: ProgressUpdate[]): void {
    for (const update of updates) {
      this.updateProgress(update);
    }
  }

  /**
   * Calculate completion metrics
   */
  calculateCompletion(): ProgressMetrics {
    const total = this.taskStatuses.size;
    const completed = Array.from(this.taskStatuses.values())
      .filter(s => s.completed).length;

    return {
      total,
      completed,
      remaining: total - completed,
      percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * Generate progress.md content
   */
  generateProgressMarkdown(): string {
    const metrics = this.calculateCompletion();
    const lines: string[] = [];

    lines.push('# Progress\n');
    lines.push(`**Last Updated**: ${new Date().toISOString()}\n`);
    lines.push(`**Status**: ${this.getStatusIndicator(metrics)}\n\n`);

    lines.push('## Summary\n\n');
    lines.push('| Metric | Value |\n');
    lines.push('|--------|-------|\n');
    lines.push(`| Total Tasks | ${metrics.total} |\n`);
    lines.push(`| Completed | ${metrics.completed} |\n`);
    lines.push(`| Remaining | ${metrics.remaining} |\n`);
    lines.push(`| Progress | ${metrics.percentComplete}% |\n\n`);

    lines.push('## Tasks\n\n');
    for (const [id, status] of this.taskStatuses) {
      const checkbox = status.completed ? '[x]' : '[ ]';
      const taskInfo = this.tasks?.items?.find(t => t.id === id);
      const title = taskInfo?.title ?? id;
      lines.push(`- ${checkbox} **${id}**: ${title}\n`);
      if (status.notes) {
        lines.push(`  - Note: ${status.notes}\n`);
      }
    }

    return lines.join('');
  }

  private getStatusIndicator(metrics: ProgressMetrics): string {
    if (metrics.percentComplete === 100) return '✅ Complete';
    if (metrics.percentComplete >= 75) return '🟢 On Track';
    if (metrics.percentComplete >= 50) return '🟡 In Progress';
    if (metrics.percentComplete >= 25) return '🟠 Early Stage';
    return '🔴 Starting';
  }

  private extractTaskId(text: string): string | null {
    const match = text.match(/\*\*([^*]+)\*\*/);
    return match ? match[1] : null;
  }
}

// Factory function
export function createProgressTracker(tasks?: Tasks): ProgressTracker {
  return new ProgressTracker(tasks);
}
```

## Acceptance Criteria

- [ ] `ProgressTracker` class created
- [ ] `loadProgress()` parses existing progress.md
- [ ] `updateProgress()` updates single task status
- [ ] `calculateCompletion()` returns correct metrics
- [ ] `generateProgressMarkdown()` produces valid progress.md
- [ ] Unit tests with sample data

## Files to Create

- `src/strategies/speckit/progress-tracker.ts`
- `tests/vitest/strategies/speckit/progress-tracker.spec.ts`

## Technical Notes

- Consider supporting different progress.md formats
- Handle edge cases: empty tasks, all completed, etc.
- Ensure thread-safe if used in async contexts

## Verification Commands

```bash
npm run test:vitest -- --grep "ProgressTracker"
npm run build
```

## Definition of Done

1. ✅ ProgressTracker class implemented
2. ✅ Load and update methods working
3. ✅ Completion calculation accurate
4. ✅ Unit tests pass

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-017)*
