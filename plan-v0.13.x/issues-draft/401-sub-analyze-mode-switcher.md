# 🔧 P3-001: Analyze mode-switcher Current Implementation [serial]

> **Parent**: [003-parent-phase3-broken-tools.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/003-parent-phase3-broken-tools.md)
> **Labels**: `phase-3`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 2 hours
> **Depends On**: None

## Context

The mode-switcher tool currently returns guidance but doesn't actually change agent state. Before fixing, we need a complete audit.

## Task Description

Audit current mode-switcher implementation:

1. **Document Current Behavior:**
   - What the tool currently returns
   - What inputs it accepts
   - How it's expected to work vs. actual behavior

2. **Define State Model:**
   ```typescript
   interface ModeState {
     currentMode: Mode;
     previousMode?: Mode;
     timestamp: Date;
     context?: Record<string, unknown>;
   }

   type Mode = 'planning' | 'editing' | 'analysis' | 'debugging' | 'refactoring' | 'documentation';
   ```

3. **Identify Required Changes:**
   - State management singleton
   - Mode persistence across calls
   - Mode-specific tool recommendations

**Output Document:**
```markdown
# Mode-Switcher Audit

## Current Behavior
- Accepts: targetMode, currentMode, reason
- Returns: Text guidance about switching
- Does NOT: Actually change any state

## Gap Analysis
- Missing: State management
- Missing: Persistence
- Missing: Tool filtering

## Proposed State Model
...

## Required Changes
1. Create ModeManager singleton
2. Refactor tool to call ModeManager
3. Add mode-aware tool filtering
```

## Acceptance Criteria

- [ ] Analysis document: `docs/analysis/mode-switcher-audit.md`
- [ ] Current behavior documented
- [ ] State model defined
- [ ] List of required changes

## Files to Analyze

- `src/tools/mode-switcher.ts` (or equivalent location)

## Files to Create

- `docs/analysis/mode-switcher-audit.md`

## Verification

```bash
# Verify analysis document exists
cat docs/analysis/mode-switcher-audit.md
```

## References

- [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-001
