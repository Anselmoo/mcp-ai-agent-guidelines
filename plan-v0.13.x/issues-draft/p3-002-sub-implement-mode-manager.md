# 🔧 P3-002: Implement ModeManager Singleton [serial]

> **Parent**: #697
> **Labels**: `phase-3`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 4 hours
> **Depends On**: P3-001
> **Blocks**: P3-003

## Context

The mode-switcher needs a state management layer to persist mode across tool calls.

## Task Description

Create singleton to manage agent mode state:

**Create `src/tools/shared/mode-manager.ts`:**
```typescript
export type Mode =
  | 'planning'
  | 'editing'
  | 'analysis'
  | 'debugging'
  | 'refactoring'
  | 'documentation'
  | 'interactive'
  | 'one-shot';

interface ModeState {
  currentMode: Mode;
  previousMode?: Mode;
  timestamp: Date;
  context?: Record<string, unknown>;
}

interface ModeTransition {
  from: Mode;
  to: Mode;
  timestamp: Date;
  reason?: string;
}

const MODE_TOOL_MAP: Record<Mode, string[]> = {
  planning: ['design-assistant', 'architecture-design-prompt-builder', 'sprint-timeline-calculator'],
  editing: ['code-analysis-prompt-builder', 'hierarchical-prompt-builder'],
  analysis: ['clean-code-scorer', 'code-hygiene-analyzer', 'semantic-code-analyzer'],
  debugging: ['debugging-assistant-prompt-builder', 'iterative-coverage-enhancer'],
  refactoring: ['clean-code-scorer', 'code-analysis-prompt-builder'],
  documentation: ['documentation-generator-prompt-builder', 'mermaid-diagram-generator'],
  interactive: ['*'], // All tools
  'one-shot': ['*'],
};

class ModeManager {
  private state: ModeState = {
    currentMode: 'interactive',
    timestamp: new Date(),
  };

  private history: ModeTransition[] = [];

  getCurrentMode(): Mode {
    return this.state.currentMode;
  }

  setMode(mode: Mode, reason?: string): ModeState {
    const previousMode = this.state.currentMode;

    this.history.push({
      from: previousMode,
      to: mode,
      timestamp: new Date(),
      reason,
    });

    this.state = {
      currentMode: mode,
      previousMode,
      timestamp: new Date(),
    };

    return this.state;
  }

  getToolsForMode(mode?: Mode): string[] {
    const targetMode = mode ?? this.state.currentMode;
    return MODE_TOOL_MAP[targetMode] ?? ['*'];
  }

  getHistory(): ModeTransition[] {
    return [...this.history];
  }

  reset(): void {
    this.state = {
      currentMode: 'interactive',
      timestamp: new Date(),
    };
    this.history = [];
  }
}

// Singleton export
export const modeManager = new ModeManager();
```

## Acceptance Criteria

- [ ] File: `src/tools/shared/mode-manager.ts`
- [ ] 8 modes supported (planning, editing, analysis, debugging, refactoring, documentation, interactive, one-shot)
- [ ] `getCurrentMode()` returns current mode
- [ ] `setMode()` changes mode and records transition
- [ ] `getToolsForMode()` returns recommended tools
- [ ] `getHistory()` returns transition history
- [ ] Unit tests cover all methods

## Files to Create

- `src/tools/shared/mode-manager.ts`
- `tests/vitest/shared/mode-manager.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- mode-manager
```

## References

- [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-002
