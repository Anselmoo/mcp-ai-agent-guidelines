# 🔧 Sub-Issue: Core Schema Examples (P1-011)

> **Parent**: #695
> **Labels**: `phase-1`, `parallel`, `copilot-suitable`, `priority-medium`
> **Milestone**: M2: Test-Stable

## Context

SPEC-001 requires adding `examples` arrays to Zod schemas for core tools. Examples help LLMs understand valid input formats and typical usage patterns.

---

## Task Description

Add `examples` arrays to the Zod schemas for 5 core analysis tools:

1. `clean-code-scorer`
2. `code-hygiene-analyzer`
3. `iterative-coverage-enhancer`
4. `dependency-auditor`
5. `semantic-code-analyzer`

---

## Acceptance Criteria

- [ ] 5 tools have `.describe()` with `examples` array on key parameters
- [ ] Each example is valid input that would work
- [ ] Examples cover common use cases
- [ ] All tests pass
- [ ] TypeScript compiles without errors

---

## Files to Change

| File | Change |
|------|--------|
| `src/schemas/analysis-schemas.ts` (or inline in tool) | Add examples to Zod schemas |
| `src/tools/analysis/clean-code-scorer.ts` | Add examples if schema is inline |
| `src/tools/analysis/code-hygiene-analyzer.ts` | Add examples |
| `src/tools/analysis/iterative-coverage-enhancer.ts` | Add examples |
| `src/tools/dependency-auditor.ts` | Add examples |
| `src/tools/semantic-code-analyzer.ts` | Add examples |

---

## Implementation Hints

### Pattern

```typescript
import { z } from 'zod';

const cleanCodeScorerSchema = z.object({
  codeSnippet: z.string()
    .describe('Source code to analyze for quality metrics')
    .examples([
      'function add(a, b) { return a + b; }',
      `class UserService {
        constructor(private repo: UserRepository) {}
        async findById(id: string): Promise<User> {
          return this.repo.findById(id);
        }
      }`
    ]),
  language: z.string()
    .optional()
    .describe('Programming language (auto-detected if not specified)')
    .examples(['typescript', 'python', 'javascript']),
  includeMetadata: z.boolean()
    .optional()
    .default(true)
    .describe('Include metadata section in output')
});
```

### Example Values per Tool

**clean-code-scorer**:
- `codeSnippet`: Short function, class with method, module with imports
- `language`: 'typescript', 'python', 'javascript'

**code-hygiene-analyzer**:
- `codeContent`: File with potential issues (unused imports, any types)
- `fileType`: 'typescript', 'python', 'go'

**iterative-coverage-enhancer**:
- `currentCoverage`: `{ lines: 65, branches: 45, functions: 70, statements: 68 }`
- `targetCoverage`: `{ lines: 80, branches: 70, functions: 85, statements: 80 }`
- `projectPath`: '/src', './app'

**dependency-auditor**:
- `dependencyContent`: package.json content, requirements.txt content
- `fileType`: 'package.json', 'requirements.txt', 'pyproject.toml'

**semantic-code-analyzer**:
- `codeContent`: TypeScript class with dependencies
- `analysisType`: 'symbols', 'dependencies', 'patterns'

---

## Testing Strategy

- Run `npm run type-check` to ensure schemas compile
- Run `npm run test:vitest` for existing tests
- Optional: Add test that validates examples against schema

---

## Dependencies

- **Depends on**: P1-001 (annotation presets establish pattern)
- **Enables**: P1-012 (remaining schema examples)

---

## References

- [SPEC-001: LLM Tool Discoverability](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-llm-tool-discoverability.md) §3.2
- [Zod .describe() API](https://zod.dev/?id=describe)
- [TASKS-phase-1.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-1.md) P1-011
