# 🔧 P4-018: Add Git Integration for Progress [serial]

> **Parent**: [004-parent-phase4-speckit.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/004-parent-phase4-speckit.md)
> **Labels**: `phase-4b`, `priority-low`, `serial`, `copilot-suitable`
> **Milestone**: M7: Spec-Kit Progress
> **Estimate**: 3 hours
> **Depends On**: P4-017
> **Blocks**: None

## Context

Git integration allows automatic progress updates based on commit messages, enabling seamless tracking of task completion through standard development workflows.

## Task Description

Auto-update progress based on git commits:

**Update `src/strategies/speckit/progress-tracker.ts`:**
```typescript
import { execSync } from 'node:child_process';

export interface GitCommit {
  hash: string;
  message: string;
  date: string;
  author: string;
}

export interface GitSyncOptions {
  repoPath?: string;
  branch?: string;
  since?: string;
  taskIdPattern?: RegExp;
}

// Add to ProgressTracker class
export class ProgressTracker {
  // ... existing code ...

  /**
   * Sync progress from git commit history
   */
  syncFromGit(options: GitSyncOptions = {}): ProgressUpdate[] {
    const commits = this.fetchCommits(options);
    const updates: ProgressUpdate[] = [];

    for (const commit of commits) {
      const taskRefs = this.extractTaskReferences(commit.message, options.taskIdPattern);

      for (const taskRef of taskRefs) {
        if (this.taskStatuses.has(taskRef.taskId)) {
          const update: ProgressUpdate = {
            taskId: taskRef.taskId,
            status: taskRef.action === 'closes' ? 'completed' : 'in-progress',
            notes: `${taskRef.action} via commit ${commit.hash.substring(0, 7)}`,
            timestamp: commit.date,
          };

          this.updateProgress(update);
          updates.push(update);
        }
      }
    }

    return updates;
  }

  /**
   * Fetch commits from git
   */
  private fetchCommits(options: GitSyncOptions): GitCommit[] {
    const cwd = options.repoPath ?? process.cwd();
    const branch = options.branch ?? 'HEAD';
    const since = options.since ? `--since="${options.since}"` : '';

    try {
      const output = execSync(
        `git log ${branch} ${since} --format="%H|%s|%aI|%an" --no-merges`,
        { cwd, encoding: 'utf-8' }
      );

      return output.trim().split('\n').filter(Boolean).map(line => {
        const [hash, message, date, author] = line.split('|');
        return { hash, message, date, author };
      });
    } catch (error) {
      // Git not available or not a repo
      return [];
    }
  }

  /**
   * Extract task references from commit message
   */
  private extractTaskReferences(
    message: string,
    customPattern?: RegExp
  ): Array<{ taskId: string; action: string }> {
    const results: Array<{ taskId: string; action: string }> = [];

    // Standard patterns: closes #X, fixes #X, resolves #X
    const patterns = [
      /(?:closes?|close)\s+#?(\S+)/gi,
      /(?:fixes?|fix)\s+#?(\S+)/gi,
      /(?:resolves?|resolve)\s+#?(\S+)/gi,
      /(?:completes?|complete)\s+#?(\S+)/gi,
    ];

    // Add custom pattern if provided
    if (customPattern) {
      patterns.push(customPattern);
    }

    for (const pattern of patterns) {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        const action = match[0].split(/\s+/)[0].toLowerCase().replace(/s$/, '');
        results.push({
          taskId: match[1],
          action,
        });
      }
    }

    // Also check for task ID mentions like "P4-001" or "TASK-123"
    const taskIdPattern = /\b([A-Z]+-\d+)\b/g;
    const taskIdMatches = message.matchAll(taskIdPattern);
    for (const match of taskIdMatches) {
      if (!results.some(r => r.taskId === match[1])) {
        results.push({
          taskId: match[1],
          action: 'mention',
        });
      }
    }

    return results;
  }

  /**
   * Watch for new commits and update progress
   */
  async watchAndSync(
    options: GitSyncOptions & { intervalMs?: number }
  ): Promise<() => void> {
    const interval = options.intervalMs ?? 60000; // Default 1 minute
    let lastSync = new Date().toISOString();

    const intervalId = setInterval(() => {
      const updates = this.syncFromGit({ ...options, since: lastSync });
      lastSync = new Date().toISOString();

      if (updates.length > 0) {
        console.log(`Progress updated: ${updates.length} tasks`);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}
```

## Acceptance Criteria

- [ ] `syncFromGit()` method implemented
- [ ] Parses "closes", "fixes", "resolves", "completes" patterns
- [ ] Extracts task IDs from commit messages
- [ ] Updates progress.md with commit references
- [ ] Handles repositories without git gracefully
- [ ] Unit tests with mock commit data

## Files to Modify

- `src/strategies/speckit/progress-tracker.ts`

## Files to Create

- `tests/vitest/strategies/speckit/progress-tracker-git.spec.ts`

## Technical Notes

- Make git integration optional/graceful degradation
- Consider rate limiting for watch mode
- Support custom task ID patterns per project

## Test Cases

```typescript
describe('ProgressTracker Git Integration', () => {
  it('parses closes pattern', () => {
    const refs = tracker.extractTaskReferences('closes #P4-001');
    expect(refs).toContainEqual({ taskId: 'P4-001', action: 'close' });
  });

  it('parses fixes pattern', () => {
    const refs = tracker.extractTaskReferences('fixes P4-002');
    expect(refs).toContainEqual({ taskId: 'P4-002', action: 'fix' });
  });

  it('handles multiple references', () => {
    const refs = tracker.extractTaskReferences('closes P4-001, fixes P4-002');
    expect(refs).toHaveLength(2);
  });

  it('handles no git gracefully', () => {
    const updates = tracker.syncFromGit({ repoPath: '/nonexistent' });
    expect(updates).toEqual([]);
  });
});
```

## Verification Commands

```bash
npm run test:vitest -- --grep "ProgressTracker.*Git"
npm run build
```

## Definition of Done

1. ✅ Git sync method working
2. ✅ Pattern parsing correct
3. ✅ Progress updates tracked
4. ✅ Unit tests pass with mocks

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-018)*
