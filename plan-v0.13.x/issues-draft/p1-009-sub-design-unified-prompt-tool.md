# 🔧 P1-013: Design Unified Prompt-Hierarchy Tool API [serial]

> **Parent**: #695
> **Labels**: `phase-1`, `priority-high`, `serial`, `copilot-suitable`, `human-required`
> **Milestone**: M2: Discoverability
> **Estimate**: 4 hours

## Context

Three overlapping prompt tools need consolidation:
- `hierarchical-prompt-builder` — builds prompts
- `hierarchy-level-selector` — selects appropriate level
- `prompting-hierarchy-evaluator` — evaluates prompt quality

These confuse LLMs. A single `prompt-hierarchy` tool with `mode` parameter is clearer.

## Task Description

Design the unified tool API:

```typescript
// Schema
{
  mode: 'build' | 'select' | 'evaluate',

  // For 'build' mode
  context?: string,
  goal?: string,
  requirements?: string[],

  // For 'select' mode
  taskDescription?: string,
  taskComplexity?: 'simple' | 'moderate' | 'complex',
  agentCapability?: 'novice' | 'intermediate' | 'advanced',

  // For 'evaluate' mode
  promptToEvaluate?: string,
  evaluationCriteria?: string[],
}
```

## Acceptance Criteria

- [ ] API design document at `docs/api/prompt-hierarchy.md`
- [ ] Zod schema defined at `src/schemas/prompt-hierarchy.ts`
- [ ] Mode parameter supports: 'build', 'select', 'evaluate'
- [ ] Backward-compatible input handling documented
- [ ] Migration guide for existing tool users

## Files to Change

| Action | Path |
|--------|------|
| Create | `docs/api/prompt-hierarchy.md` |
| Create | `src/schemas/prompt-hierarchy.ts` |

## API Design Document Outline

```markdown
# prompt-hierarchy API Design

## Overview
Unified tool for building, selecting, and evaluating AI prompts.

## Modes

### build
Creates structured prompts with context→goal→requirements hierarchy.

### select
Recommends appropriate prompt hierarchy level for a task.

### evaluate
Assesses prompt quality against criteria.

## Schema
[Full Zod schema]

## Examples
[Example for each mode]

## Migration Guide
- hierarchical-prompt-builder → prompt-hierarchy(mode: 'build')
- hierarchy-level-selector → prompt-hierarchy(mode: 'select')
- prompting-hierarchy-evaluator → prompt-hierarchy(mode: 'evaluate')
```

## Dependencies

- **Blocked by**: None
- **Blocks**: P1-014 (implementation)

## References

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md#tool-consolidation)
- Current implementations in `src/tools/prompt/`
