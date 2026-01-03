# 🔧 Sub-Issue: Register Unified Prompt Tool (P1-016)

> **Parent**: [001-parent-phase1-discoverability.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/001-parent-phase1-discoverability.md)
> **Labels**: `phase-1`, `serial`, `copilot-suitable`, `priority-high`
> **Milestone**: M2: Test-Stable

## Context

After implementing the unified `prompt-hierarchy` tool (P1-014), it must be registered in the MCP server's tool manifest so LLMs can discover and invoke it.

---

## Task Description

Register the `prompt-hierarchy` tool in `src/index.ts` with:
- Full ToolAnnotations
- Comprehensive description
- Input schema with examples
- Proper error handling

---

## Acceptance Criteria

- [ ] Tool registered in `src/index.ts` with name `prompt-hierarchy`
- [ ] ToolAnnotations include title, readOnlyHint, idempotentHint
- [ ] Description follows active voice format
- [ ] Input schema includes examples for `mode` and `taskDescription`
- [ ] Tool appears in MCP tool list when server starts
- [ ] Tool can be invoked successfully
- [ ] All tests pass

---

## Files to Change

| File | Change |
|------|--------|
| `src/index.ts` | Add tool registration for prompt-hierarchy |
| `src/tools/prompt/index.ts` | Export promptHierarchy from barrel |

---

## Implementation Hints

### Tool Registration

```typescript
// In src/index.ts, add to tools map:

import { promptHierarchy, promptHierarchySchema } from './tools/prompt/index.js';
import { PROMPT_TOOL_ANNOTATIONS } from './tools/config/annotation-presets.js';

// In server.setRequestHandler(ListToolsRequestSchema, ...):
{
  name: 'prompt-hierarchy',
  description: 'Generate, evaluate, and recommend prompting strategies using a unified API. ' +
               'Supports building hierarchical prompts (independent to scaffolding), ' +
               'evaluating prompt quality, selecting appropriate hierarchy levels, ' +
               'and chaining multi-step workflows. Consolidates 6 prompt tools into one.',
  inputSchema: zodToJsonSchema(promptHierarchySchema),
  annotations: PROMPT_TOOL_ANNOTATIONS
}

// In server.setRequestHandler(CallToolRequestSchema, ...):
case 'prompt-hierarchy': {
  const validated = promptHierarchySchema.parse(args);
  const result = await promptHierarchy(validated);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}
```

### Schema Reference

```typescript
// The schema should support all modes:
const promptHierarchySchema = z.object({
  mode: z.enum(['build', 'evaluate', 'select-level', 'chain', 'flow', 'quick'])
    .describe('Operation mode')
    .examples(['build', 'evaluate', 'select-level']),
  taskDescription: z.string()
    .describe('Task description for prompt generation')
    .examples([
      'Review code for security vulnerabilities',
      'Design a caching strategy for user sessions'
    ]),
  // ... mode-specific parameters
});
```

### Barrel Export

```typescript
// src/tools/prompt/index.ts
export { promptHierarchy, promptHierarchySchema } from './prompt-hierarchy.js';
```

---

## Testing Strategy

```typescript
// tests/vitest/integration/prompt-hierarchy-registration.spec.ts
import { describe, it, expect } from 'vitest';

describe('prompt-hierarchy tool registration', () => {
  it('tool appears in ListTools response', async () => {
    // Integration test that starts server and lists tools
  });

  it('tool can be invoked via CallTool', async () => {
    // Integration test that invokes tool
  });
});
```

---

## Dependencies

- **Depends on**: P1-014 (tool implementation must exist)
- **Enables**: P1-015 (can deprecate old tools), P1-017 (documentation)

---

## References

- [SPEC-001: LLM Tool Discoverability](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-llm-tool-discoverability.md) §3.4.3
- [TASKS-phase-1.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-1.md) P1-016
- [MCP Tool Registration Docs](https://modelcontextprotocol.io/specification)
