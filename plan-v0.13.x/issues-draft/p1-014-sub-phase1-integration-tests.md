# 🔧 Sub-Issue: Phase 1 Integration Tests (P1-018)

> **Parent**: #695
> **Labels**: `phase-1`, `serial`, `copilot-suitable`, `priority-high`
> **Milestone**: M2: Test-Stable

## Context

Phase 1 introduces significant changes to tool discoverability. Before marking M2 complete, comprehensive integration tests must verify all Phase 1 features work together.

---

## Task Description

Create integration tests that verify:

1. All tools have ToolAnnotations
2. All descriptions are unique
3. Unified prompt-hierarchy tool works in all modes
4. Deprecation warnings emit correctly
5. Schema examples are valid

---

## Acceptance Criteria

- [ ] Test: All 32 tools have ToolAnnotations
- [ ] Test: No two tools have identical descriptions
- [ ] Test: prompt-hierarchy works in all 6 modes
- [ ] Test: Deprecated tools emit warning once
- [ ] Test: Schema examples pass validation
- [ ] All tests pass with 90%+ coverage
- [ ] Integration test suite runs in CI

---

## Files to Create

| File | Purpose |
|------|---------|
| `tests/vitest/integration/phase1-discoverability.spec.ts` | Main integration test file |
| `tests/vitest/integration/tool-annotations.spec.ts` | ToolAnnotations validation |
| `tests/vitest/integration/prompt-hierarchy.spec.ts` | Unified tool tests |

---

## Implementation Hints

### Test: All Tools Have Annotations

```typescript
// tests/vitest/integration/tool-annotations.spec.ts
import { describe, it, expect } from 'vitest';
import { listTools } from '../../src/index.js'; // or however tools are listed

describe('ToolAnnotations', () => {
  const tools = listTools();

  it('all tools have annotations', () => {
    for (const tool of tools) {
      expect(tool.annotations, `${tool.name} missing annotations`).toBeDefined();
    }
  });

  it('all tools have title annotation', () => {
    for (const tool of tools) {
      expect(tool.annotations?.title, `${tool.name} missing title`).toBeDefined();
      expect(typeof tool.annotations?.title).toBe('string');
    }
  });

  it('all tools have readOnlyHint', () => {
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint, `${tool.name} missing readOnlyHint`).toBeDefined();
    }
  });
});
```

### Test: Description Uniqueness

```typescript
// tests/vitest/integration/phase1-discoverability.spec.ts
describe('Tool Descriptions', () => {
  const tools = listTools();

  it('all descriptions are unique', () => {
    const descriptions = tools.map(t => t.description);
    const unique = new Set(descriptions);

    expect(unique.size).toBe(descriptions.length);

    // Find duplicates for better error messages
    const seen = new Map<string, string[]>();
    for (const tool of tools) {
      const existing = seen.get(tool.description) || [];
      existing.push(tool.name);
      seen.set(tool.description, existing);
    }

    for (const [desc, names] of seen) {
      if (names.length > 1) {
        throw new Error(`Duplicate description shared by: ${names.join(', ')}`);
      }
    }
  });

  it('all descriptions start with action verb', () => {
    const actionVerbs = ['Analyze', 'Build', 'Calculate', 'Create', 'Design',
                         'Evaluate', 'Generate', 'Identify', 'Manage', 'Optimize',
                         'Recommend', 'Select', 'Switch', 'Track', 'Validate'];

    for (const tool of tools) {
      const firstWord = tool.description.split(' ')[0];
      expect(actionVerbs, `${tool.name} description doesn't start with action verb: "${firstWord}"`)
        .toContain(firstWord);
    }
  });
});
```

### Test: Unified Tool Modes

```typescript
// tests/vitest/integration/prompt-hierarchy.spec.ts
import { describe, it, expect } from 'vitest';
import { promptHierarchy } from '../../src/tools/prompt/prompt-hierarchy.js';

describe('prompt-hierarchy unified tool', () => {
  const modes = ['build', 'evaluate', 'select-level', 'chain', 'flow', 'quick'] as const;

  for (const mode of modes) {
    it(`works in ${mode} mode`, async () => {
      const result = await promptHierarchy({
        mode,
        taskDescription: 'Test task for mode verification'
      });

      expect(result).toBeDefined();
      expect(result.mode).toBe(mode);
    });
  }

  it('returns structured output with metadata', async () => {
    const result = await promptHierarchy({
      mode: 'build',
      taskDescription: 'Build a prompt for code review'
    });

    expect(result.prompt).toBeDefined();
    expect(result.metadata).toBeDefined();
  });
});
```

### Test: Deprecation Warnings

```typescript
// tests/vitest/integration/deprecation.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hierarchicalPromptBuilder } from '../../src/tools/prompt/hierarchical-prompt-builder.js';
import { resetDeprecationWarnings } from '../../src/tools/shared/deprecation.js';
import { logger } from '../../src/tools/shared/logger.js';

describe('Deprecation warnings', () => {
  beforeEach(() => {
    resetDeprecationWarnings();
    vi.spyOn(logger, 'warn');
  });

  it('deprecated tools emit warning on first use', async () => {
    await hierarchicalPromptBuilder({ taskDescription: 'test' });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'deprecation',
        tool: 'hierarchical-prompt-builder'
      })
    );
  });

  it('warning only emits once per session', async () => {
    await hierarchicalPromptBuilder({ taskDescription: 'test1' });
    await hierarchicalPromptBuilder({ taskDescription: 'test2' });
    await hierarchicalPromptBuilder({ taskDescription: 'test3' });

    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
```

---

## Testing Strategy

- Run with `npm run test:vitest -- --run tests/vitest/integration/`
- Verify 90%+ coverage with `npm run test:coverage:vitest`
- Add to CI pipeline in `.github/workflows/test.yml`

---

## Dependencies

- **Depends on**: All P1-001 through P1-017 complete
- **Enables**: M2 milestone gate

---

## References

- [SPEC-001: LLM Tool Discoverability](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-llm-tool-discoverability.md) §5
- [TASKS-phase-1.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-1.md) P1-018
