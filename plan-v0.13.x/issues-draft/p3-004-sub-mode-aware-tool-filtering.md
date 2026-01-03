# 🔧 P3-004: Add Mode-Aware Tool Filtering [serial]

> **Parent**: #TBD
> **Labels**: `phase-3`, `priority-medium`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 3 hours
> **Depends On**: P3-003

## Context

Optionally filter available tools based on current mode. When enabled, only mode-relevant tools are returned in the tool list.

## Task Description

Add optional tool filtering based on mode:

**Modify `src/index.ts`:**
```typescript
import { modeManager } from './tools/shared/mode-manager.js';
import { getFeatureFlags } from './config/feature-flags.js';

// In list_tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const flags = getFeatureFlags();
  let tools = getAllTools();

  if (flags.enableModeAwareToolFiltering) {
    const currentMode = modeManager.getCurrentMode();
    const allowedTools = modeManager.getToolsForMode(currentMode);

    if (!allowedTools.includes('*')) {
      tools = tools.filter(t => allowedTools.includes(t.name));
    }
  }

  return { tools };
});
```

**Update `src/config/feature-flags.ts`:**
```typescript
export interface FeatureFlags {
  // ... existing flags
  enableModeAwareToolFiltering: boolean;
}

const defaultFlags: FeatureFlags = {
  // ... existing flags
  enableModeAwareToolFiltering: false, // Disabled by default
};
```

## Acceptance Criteria

- [ ] Feature flag `enableModeAwareToolFiltering` added
- [ ] Tool list filtered when flag enabled
- [ ] Tools marked `*` in mode map bypass filtering
- [ ] Documentation of mode→tools mapping
- [ ] Integration test with flag on/off

## Files to Modify

- `src/index.ts`
- `src/config/feature-flags.ts`

## Files to Create

- `docs/features/mode-aware-filtering.md`

## Verification

```bash
# Test with filtering disabled (default)
npm run test:vitest -- list-tools

# Test with filtering enabled
MCP_ENABLE_MODE_FILTERING=true npm run test:vitest -- list-tools
```

## References

- [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-004
