# 🔧 P1-003: Add ToolAnnotations to Prompt Builder Tools [parallel]

> **Labels**: `phase-1`, `priority-high`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M2: Discoverability
> **Estimate**: 3 hours
> **Blocked by**: P1-001

## Context

Prompt builder tools generate AI prompts and content. They use `GENERATION_TOOL_ANNOTATIONS` to signal they create output but don't modify external state.

## Task Description

Add `GENERATION_TOOL_ANNOTATIONS` preset to all prompt builder tools in `src/index.ts`:

**Target Tools (11 total):**
1. `hierarchical-prompt-builder`
2. `hierarchy-level-selector`
3. `prompting-hierarchy-evaluator`
4. `code-analysis-prompt-builder`
5. `debugging-assistant-prompt-builder`
6. `security-hardening-prompt-builder`
7. `architecture-design-prompt-builder`
8. `documentation-generator-prompt-builder`
9. `domain-neutral-prompt-builder`
10. `quick-developer-prompts-builder`
11. `spark-prompt-builder`

## Acceptance Criteria

- [ ] All 11 prompt tools have `annotations` field
- [ ] All use imported `GENERATION_TOOL_ANNOTATIONS` preset
- [ ] Each tool has custom `title` override
- [ ] Build passes
- [ ] Existing tests pass

## Files to Change

| Action | Path |
|--------|------|
| Modify | `src/index.ts` |

## Implementation Hints

```typescript
import { GENERATION_TOOL_ANNOTATIONS } from './tools/shared/annotation-presets.js';

// For each prompt tool
server.tool(
  'hierarchical-prompt-builder',
  'Build structured prompts...',
  { /* schema */ },
  async (args) => { /* handler */ },
  {
    annotations: {
      ...GENERATION_TOOL_ANNOTATIONS,
      title: 'Hierarchical Prompt Builder',
    },
  }
);
```

## Tool-to-Title Mapping

| Tool | Suggested Title |
|------|-----------------|
| `hierarchical-prompt-builder` | Hierarchical Prompt Builder |
| `hierarchy-level-selector` | Prompt Hierarchy Level Selector |
| `prompting-hierarchy-evaluator` | Prompt Quality Evaluator |
| `code-analysis-prompt-builder` | Code Analysis Prompt Generator |
| `debugging-assistant-prompt-builder` | Debug Assistant Prompt Generator |
| `security-hardening-prompt-builder` | Security Hardening Prompt Generator |
| `architecture-design-prompt-builder` | Architecture Design Prompt Generator |
| `documentation-generator-prompt-builder` | Documentation Prompt Generator |
| `domain-neutral-prompt-builder` | Domain-Neutral Prompt Builder |
| `quick-developer-prompts-builder` | Quick Developer Prompts |
| `spark-prompt-builder` | Spark Design Prompt Builder |

## Testing Strategy

```bash
npm run build
npm run test:vitest
```

## Dependencies

- **Blocked by**: P1-001
- **Blocks**: None (parallel)

## References

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md#prompt-tools)
