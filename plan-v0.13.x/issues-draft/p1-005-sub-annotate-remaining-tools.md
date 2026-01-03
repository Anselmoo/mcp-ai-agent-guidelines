# 🔧 P1-005: Add ToolAnnotations to Remaining Tools [parallel]

> **Parent**: #TBD
> **Labels**: `phase-1`, `priority-medium`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M2: Discoverability
> **Estimate**: 3 hours
> **Blocked by**: P1-001

## Context

After annotating analysis, prompt, and session tools, remaining tools need appropriate annotations based on their behavior.

## Task Description

Add annotations to all remaining tools:

**Target Tools:**
| Tool | Preset |
|------|--------|
| `strategy-frameworks-builder` | GENERATION |
| `sprint-timeline-calculator` | GENERATION |
| `model-compatibility-checker` | ANALYSIS |
| `mermaid-diagram-generator` | GENERATION |
| `memory-context-optimizer` | ANALYSIS |
| `project-onboarding` | FILESYSTEM |
| `prompt-chaining-builder` | GENERATION |
| `prompt-flow-builder` | GENERATION |
| `l9-distinguished-engineer-prompt-builder` | GENERATION |
| `digital-enterprise-architect-prompt-builder` | GENERATION |
| `guidelines-validator` | ANALYSIS |

## Acceptance Criteria

- [ ] All remaining tools (~11) have `annotations` field
- [ ] Each uses appropriate preset based on behavior
- [ ] Build passes
- [ ] Existing tests pass
- [ ] Comprehensive annotation coverage test passes

## Files to Change

| Action | Path |
|--------|------|
| Modify | `src/index.ts` |
| Create | `tests/vitest/discoverability/annotation-coverage.spec.ts` |

## Implementation Hints

Create a test that verifies ALL tools have annotations:

```typescript
// tests/vitest/discoverability/annotation-coverage.spec.ts
import { server } from '../../../src/index.js';

describe('Tool Annotation Coverage', () => {
  it('should have annotations on all registered tools', () => {
    const tools = server.getTools();
    for (const tool of tools) {
      expect(tool.annotations).toBeDefined();
      expect(tool.annotations.title).toBeDefined();
      expect(typeof tool.annotations.readOnlyHint).toBe('boolean');
    }
  });
});
```

## Tool-to-Title Mapping

| Tool | Suggested Title |
|------|-----------------|
| `strategy-frameworks-builder` | Strategy Framework Builder |
| `sprint-timeline-calculator` | Sprint Timeline Calculator |
| `model-compatibility-checker` | AI Model Compatibility Checker |
| `mermaid-diagram-generator` | Mermaid Diagram Generator |
| `memory-context-optimizer` | Memory Context Optimizer |
| `project-onboarding` | Project Onboarding Scanner |
| `prompt-chaining-builder` | Prompt Chain Builder |
| `prompt-flow-builder` | Prompt Flow Builder |
| `l9-distinguished-engineer-prompt-builder` | L9 Engineer Prompt Generator |
| `digital-enterprise-architect-prompt-builder` | Enterprise Architect Prompt Generator |
| `guidelines-validator` | AI Guidelines Validator |

## Testing Strategy

```bash
npm run build
npm run test:vitest
npm run test:vitest -- annotation-coverage
```

## Dependencies

- **Blocked by**: P1-001
- **Blocks**: None

## References

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md#tool-mapping)
