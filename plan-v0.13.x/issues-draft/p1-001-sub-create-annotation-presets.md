# 🔧 P1-001: Create Annotation Presets [serial]

> **Parent**: #695
> **Labels**: `phase-1`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M2: Discoverability
> **Estimate**: 2 hours
> **Blocks**: P1-002, P1-003, P1-004, P1-005

## Context

The MCP spec (2024-11-05) introduced **ToolAnnotations** — hints that help LLMs understand tool behavior without reading descriptions. We need standardized presets for different tool categories to ensure consistent annotation across all 30+ tools.

## Task Description

Create `src/tools/shared/annotation-presets.ts` with reusable annotation configurations:

```typescript
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

/**
 * Preset annotations for read-only analysis tools.
 * These tools inspect but don't modify state.
 */
export const ANALYSIS_TOOL_ANNOTATIONS: ToolAnnotations = {
  title: undefined, // Set per-tool
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

/**
 * Preset annotations for content generation tools.
 * These tools create new content (prompts, docs, etc.)
 */
export const GENERATION_TOOL_ANNOTATIONS: ToolAnnotations = {
  title: undefined,
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

/**
 * Preset annotations for session-based tools.
 * These tools maintain state across calls.
 */
export const SESSION_TOOL_ANNOTATIONS: ToolAnnotations = {
  title: undefined,
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
};

/**
 * Preset annotations for filesystem/external tools.
 * These tools may interact with external systems.
 */
export const FILESYSTEM_TOOL_ANNOTATIONS: ToolAnnotations = {
  title: undefined,
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};
```

## Acceptance Criteria

- [ ] File created at `src/tools/shared/annotation-presets.ts`
- [ ] 4 presets exported: `ANALYSIS_TOOL_ANNOTATIONS`, `GENERATION_TOOL_ANNOTATIONS`, `SESSION_TOOL_ANNOTATIONS`, `FILESYSTEM_TOOL_ANNOTATIONS`
- [ ] Each preset has all 4 annotation fields with appropriate values
- [ ] JSDoc comments explain each preset's purpose
- [ ] Exported from `src/tools/shared/index.ts` barrel
- [ ] Unit test verifies preset structure

## Files to Change

| Action | Path |
|--------|------|
| Create | `src/tools/shared/annotation-presets.ts` |
| Modify | `src/tools/shared/index.ts` |
| Create | `tests/vitest/shared/annotation-presets.spec.ts` |

## Implementation Hints

1. Use the MCP SDK type for type safety:
   ```typescript
   import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
   ```

2. Check existing barrel export pattern in `src/tools/shared/index.ts`

3. Simple test structure:
   ```typescript
   describe('annotation-presets', () => {
     it('should export all preset types', () => {
       expect(ANALYSIS_TOOL_ANNOTATIONS).toBeDefined();
       expect(ANALYSIS_TOOL_ANNOTATIONS.readOnlyHint).toBe(true);
       // etc.
     });
   });
   ```

## Testing Strategy

```bash
# Run specific test
npm run test:vitest -- annotation-presets

# Verify export works
npx tsx -e "import { ANALYSIS_TOOL_ANNOTATIONS } from './src/tools/shared/index.js'; console.log(ANALYSIS_TOOL_ANNOTATIONS)"
```

## Dependencies

- **Blocked by**: None (first task)
- **Blocks**: P1-002, P1-003, P1-004, P1-005

## References

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md#toolannotations-presets)
- [ADR-002: Tool Annotations Standard](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/adrs/ADR-002-tool-annotations-standard.md)
- [MCP Spec: ToolAnnotations](https://spec.modelcontextprotocol.io/specification/2024-11-05/server/tools/#annotations)
