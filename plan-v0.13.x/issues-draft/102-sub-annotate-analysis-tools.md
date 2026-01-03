# 🔧 P1-002: Add ToolAnnotations to Analysis Tools [parallel]

> **Labels**: `phase-1`, `priority-high`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M2: Discoverability
> **Estimate**: 3 hours
> **Blocked by**: P1-001

## Context

Analysis tools (code scoring, hygiene analysis, etc.) need `ANALYSIS_TOOL_ANNOTATIONS` to signal they are read-only, non-destructive, and idempotent. This helps LLMs understand these tools inspect but don't modify.

## Task Description

Add `ANALYSIS_TOOL_ANNOTATIONS` preset to all analysis tools in `src/index.ts`:

**Target Tools (6 total):**
1. `clean-code-scorer`
2. `code-hygiene-analyzer`
3. `semantic-code-analyzer`
4. `dependency-auditor`
5. `iterative-coverage-enhancer`
6. `gap-frameworks-analyzers`

## Acceptance Criteria

- [ ] All 6 analysis tools have `annotations` field in tool definition
- [ ] All use imported `ANALYSIS_TOOL_ANNOTATIONS` preset
- [ ] Each tool has custom `title` override matching tool purpose
- [ ] Build passes (`npm run build`)
- [ ] Existing tests still pass (`npm run test:vitest`)

## Files to Change

| Action | Path |
|--------|------|
| Modify | `src/index.ts` |

## Implementation Hints

1. Import the preset at top of `src/index.ts`:
   ```typescript
   import { ANALYSIS_TOOL_ANNOTATIONS } from './tools/shared/annotation-presets.js';
   ```

2. Find each tool registration and add annotations:
   ```typescript
   // Before
   server.tool(
     'clean-code-scorer',
     'Calculate code quality score...',
     { /* schema */ },
     async (args) => { /* handler */ }
   );

   // After
   server.tool(
     'clean-code-scorer',
     'Calculate code quality score...',
     { /* schema */ },
     async (args) => { /* handler */ },
     {
       annotations: {
         ...ANALYSIS_TOOL_ANNOTATIONS,
         title: 'Clean Code Quality Scorer',
       },
     }
   );
   ```

3. Use Serena to find tool registrations:
   ```
   mcp_serena_search_for_pattern: "server.tool.*clean-code-scorer"
   ```

## Testing Strategy

```bash
# Build to verify no type errors
npm run build

# Run all tests to catch regressions
npm run test:vitest

# Manual verification: check annotations appear in tool list
npx tsx scripts/list-tool-annotations.ts
```

## Tool-to-Title Mapping

| Tool | Suggested Title |
|------|-----------------|
| `clean-code-scorer` | Clean Code Quality Scorer |
| `code-hygiene-analyzer` | Code Hygiene Analyzer |
| `semantic-code-analyzer` | Semantic Code Analyzer |
| `dependency-auditor` | Dependency Security Auditor |
| `iterative-coverage-enhancer` | Test Coverage Enhancer |
| `gap-frameworks-analyzers` | Gap Analysis Framework |

## Dependencies

- **Blocked by**: P1-001 (needs preset file)
- **Blocks**: None (parallel with P1-003, P1-004)

## References

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md#analysis-tools)
- [Tool Registration Pattern](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/src/index.ts)
