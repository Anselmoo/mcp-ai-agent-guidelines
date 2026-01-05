# 🔧 P1-010: Create Description Uniqueness Test [serial]

> **Parent**: #695
> **Labels**: `phase-1`, `priority-high`, `serial`, `copilot-suitable`
> **Milestone**: M2: Discoverability
> **Estimate**: 2 hours
> **Blocked by**: P1-009

## Context

Automated enforcement ensures tool descriptions stay unique over time. This test fails CI if any two tools share similar opening words.

## Task Description

Create test that verifies:
1. No two tools share first 5 words
2. All descriptions follow the template pattern
3. Character count < 200

```typescript
// tests/vitest/discoverability/unique-descriptions.spec.ts
import { describe, it, expect } from 'vitest';

describe('Tool Description Uniqueness', () => {
  const tools = getRegisteredTools(); // implement this

  it('should have unique first 5 words across all tools', () => {
    const firstFiveWords = new Map<string, string>();

    for (const tool of tools) {
      const key = tool.description
        .split(' ')
        .slice(0, 5)
        .join(' ')
        .toLowerCase();

      if (firstFiveWords.has(key)) {
        fail(`Tools "${tool.name}" and "${firstFiveWords.get(key)}" share first 5 words: "${key}"`);
      }
      firstFiveWords.set(key, tool.name);
    }
  });

  it('should follow description template pattern', () => {
    const pattern = /^[A-Z][^.]+\. BEST FOR:/;

    for (const tool of tools) {
      expect(tool.description).toMatch(pattern);
    }
  });

  it('should have descriptions under 200 characters', () => {
    for (const tool of tools) {
      expect(tool.description.length).toBeLessThan(200);
    }
  });
});
```

## Acceptance Criteria

- [ ] Test file created at `tests/vitest/discoverability/unique-descriptions.spec.ts`
- [ ] Test fails if any two tools share first 5 words
- [ ] Test fails if description doesn't follow template
- [ ] Test fails if description > 200 chars
- [ ] Integrated into CI (runs with `npm run test:vitest`)

## Files to Change

| Action | Path |
|--------|------|
| Create | `tests/vitest/discoverability/unique-descriptions.spec.ts` |

## Testing Strategy

```bash
# Run specific test
npm run test:vitest -- unique-descriptions

# Should pass after all descriptions rewritten
npm run test:vitest
```

## Dependencies

- **Blocked by**: P1-009 (needs all descriptions rewritten first)
- **Blocks**: P1-017 (documentation update)

## References

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md#verification)
