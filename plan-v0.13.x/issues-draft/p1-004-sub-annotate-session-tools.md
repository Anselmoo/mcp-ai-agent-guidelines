# 🔧 P1-004: Add ToolAnnotations to Session/Design Tools [parallel]

> **Parent**: #695
> **Labels**: `phase-1`, `priority-high`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M2: Discoverability
> **Estimate**: 2 hours
> **Blocked by**: P1-001

## Context

Session-based tools maintain state across calls. They use `SESSION_TOOL_ANNOTATIONS` with `readOnlyHint: false` and `idempotentHint: false` to signal stateful behavior.

## Task Description

Add `SESSION_TOOL_ANNOTATIONS` preset to session-based tools:

**Target Tools (2 total):**
1. `design-assistant` — Multi-phase design workflow with session state
2. `mode-switcher` — Agent mode state management (currently broken)

## Acceptance Criteria

- [ ] Both session tools have `annotations` field
- [ ] Both use imported `SESSION_TOOL_ANNOTATIONS` preset
- [ ] Each tool has custom `title` override
- [ ] Build passes
- [ ] Existing tests pass

## Files to Change

| Action | Path |
|--------|------|
| Modify | `src/index.ts` |

## Implementation Hints

```typescript
import { SESSION_TOOL_ANNOTATIONS } from './tools/shared/annotation-presets.js';

// For session tools - note different annotation values
server.tool(
  'design-assistant',
  'Manage multi-phase design workflows...',
  { /* schema */ },
  async (args) => { /* handler */ },
  {
    annotations: {
      ...SESSION_TOOL_ANNOTATIONS,
      title: 'Design Session Assistant',
    },
  }
);
```

**Important**: SESSION_TOOL_ANNOTATIONS has:
- `readOnlyHint: false` — modifies session state
- `idempotentHint: false` — same call can produce different results

## Tool-to-Title Mapping

| Tool | Suggested Title |
|------|-----------------|
| `design-assistant` | Design Session Assistant |
| `mode-switcher` | Agent Mode Switcher |

## Testing Strategy

```bash
npm run build
npm run test:vitest
```

## Dependencies

- **Blocked by**: P1-001
- **Blocks**: None (parallel)

## References

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md#session-tools)
