# 🔧 P3-003: Refactor mode-switcher Tool [serial]

> **Parent**: [003-parent-phase3-broken-tools.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/003-parent-phase3-broken-tools.md)
> **Labels**: `phase-3`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 4 hours
> **Depends On**: P3-002
> **Blocks**: P3-004, P3-008, P3-016

## Context

With ModeManager in place, the mode-switcher tool can now actually change agent state.

## Task Description

Refactor mode-switcher to actually change state:

**Modify `src/tools/mode-switcher.ts`:**
```typescript
import { modeManager, Mode } from '../shared/mode-manager.js';
import { createMcpResponse } from '../shared/response-utils.js';

export interface ModeSwitcherRequest {
  targetMode: Mode;
  currentMode?: Mode; // Optional, for validation
  reason?: string;
}

export async function modeSwitcher(request: ModeSwitcherRequest) {
  const { targetMode, reason } = request;

  // Get current mode before switch
  const previousMode = modeManager.getCurrentMode();

  // Validate transition (optional)
  if (request.currentMode && request.currentMode !== previousMode) {
    return createMcpResponse({
      isError: true,
      content: `Mode mismatch: expected ${request.currentMode}, but current mode is ${previousMode}`,
    });
  }

  // Actually switch mode
  const newState = modeManager.setMode(targetMode, reason);

  // Get recommended tools for new mode
  const recommendedTools = modeManager.getToolsForMode(targetMode);

  return createMcpResponse({
    content: `# Mode Switched Successfully

**Previous Mode**: ${previousMode}
**Current Mode**: ${newState.currentMode}
**Switched At**: ${newState.timestamp.toISOString()}
${reason ? `**Reason**: ${reason}` : ''}

## Recommended Tools for ${targetMode} Mode

${recommendedTools.map(t => `- ${t}`).join('\n')}

## Notes

Mode will persist until explicitly changed. Use \`getCurrentMode\` to verify.
`,
  });
}
```

## Acceptance Criteria

- [ ] Tool calls `modeManager.setMode()`
- [ ] Mode persists across tool calls
- [ ] Returns confirmation with previous/new mode
- [ ] Returns recommended tools for new mode
- [ ] Validates currentMode if provided
- [ ] Integration test: switch mode → call getCurrentMode → verify

## Files to Modify

- `src/tools/mode-switcher.ts`

## Files to Create

- `tests/vitest/tools/mode-switcher.integration.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- mode-switcher
```

## References

- [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-003
