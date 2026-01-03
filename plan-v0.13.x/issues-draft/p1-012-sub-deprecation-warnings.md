# 🔧 Sub-Issue: Add Deprecation Warnings (P1-015)

> **Parent**: [001-parent-phase1-discoverability.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/001-parent-phase1-discoverability.md)
> **Labels**: `phase-1`, `serial`, `copilot-suitable`, `priority-medium`
> **Milestone**: M2: Test-Stable

## Context

After implementing the unified `prompt-hierarchy` tool (P1-014), the individual prompt builders that it consolidates should emit deprecation warnings. This provides a migration path for users.

---

## Task Description

Add deprecation warnings to the 6 prompt builders being unified:

1. `hierarchical-prompt-builder`
2. `prompting-hierarchy-evaluator`
3. `hierarchy-level-selector`
4. `prompt-chaining-builder`
5. `prompt-flow-builder`
6. `quick-developer-prompts`

Warnings should:
- Log once per session (not spam)
- Suggest migration to `prompt-hierarchy` tool
- Include version when removal is planned

---

## Acceptance Criteria

- [ ] 6 tools emit deprecation warning on first use
- [ ] Warning includes suggested replacement
- [ ] Warning includes version info (deprecate in v0.14, remove in v0.15)
- [ ] Warning only emits once per tool per session
- [ ] All tests pass
- [ ] Tools still function normally

---

## Files to Change

| File | Change |
|------|--------|
| `src/tools/shared/deprecation.ts` | Create deprecation utility (NEW) |
| `src/tools/prompt/hierarchical-prompt-builder.ts` | Add deprecation warning |
| `src/tools/prompt/prompting-hierarchy-evaluator.ts` | Add deprecation warning |
| `src/tools/prompt/hierarchy-level-selector.ts` | Add deprecation warning |
| `src/tools/prompt/prompt-chaining-builder.ts` | Add deprecation warning |
| `src/tools/prompt/prompt-flow-builder.ts` | Add deprecation warning |
| `src/tools/prompt/quick-developer-prompts.ts` | Add deprecation warning |

---

## Implementation Hints

### Deprecation Utility

```typescript
// src/tools/shared/deprecation.ts
import { logger } from './logger.js';

const warned = new Set<string>();

export interface DeprecationOptions {
  tool: string;
  replacement: string;
  deprecatedIn: string;
  removedIn: string;
}

export function emitDeprecationWarning(options: DeprecationOptions): void {
  if (warned.has(options.tool)) return;

  warned.add(options.tool);

  logger.warn({
    type: 'deprecation',
    tool: options.tool,
    message: `Tool "${options.tool}" is deprecated since ${options.deprecatedIn}. ` +
             `Use "${options.replacement}" instead. ` +
             `Will be removed in ${options.removedIn}.`
  });
}

// For testing: reset warnings
export function resetDeprecationWarnings(): void {
  warned.clear();
}
```

### Usage in Tool

```typescript
// src/tools/prompt/hierarchical-prompt-builder.ts
import { emitDeprecationWarning } from '../shared/deprecation.js';

export function hierarchicalPromptBuilder(input: Input): Output {
  emitDeprecationWarning({
    tool: 'hierarchical-prompt-builder',
    replacement: 'prompt-hierarchy',
    deprecatedIn: 'v0.14.0',
    removedIn: 'v0.15.0'
  });

  // ... existing implementation
}
```

### Warning Message Format

```
[WARN] Tool "hierarchical-prompt-builder" is deprecated since v0.14.0.
Use "prompt-hierarchy" instead. Will be removed in v0.15.0.
```

---

## Testing Strategy

```typescript
// tests/vitest/tools/shared/deprecation.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { emitDeprecationWarning, resetDeprecationWarnings } from '../../src/tools/shared/deprecation.js';
import { logger } from '../../src/tools/shared/logger.js';

describe('emitDeprecationWarning', () => {
  beforeEach(() => {
    resetDeprecationWarnings();
    vi.spyOn(logger, 'warn');
  });

  it('emits warning on first call', () => {
    emitDeprecationWarning({
      tool: 'old-tool',
      replacement: 'new-tool',
      deprecatedIn: 'v0.14.0',
      removedIn: 'v0.15.0'
    });

    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('does not emit warning on subsequent calls for same tool', () => {
    const options = { tool: 'old-tool', replacement: 'new-tool', deprecatedIn: 'v0.14.0', removedIn: 'v0.15.0' };

    emitDeprecationWarning(options);
    emitDeprecationWarning(options);
    emitDeprecationWarning(options);

    expect(logger.warn).toHaveBeenCalledOnce();
  });
});
```

---

## Dependencies

- **Depends on**: P1-014 (unified tool must exist to deprecate old ones)
- **Enables**: Clean removal in v0.15.0

---

## References

- [SPEC-001: LLM Tool Discoverability](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-llm-tool-discoverability.md) §3.4.4
- [TASKS-phase-1.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-1.md) P1-015
