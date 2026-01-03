# 🔧 Sub-Issue: Rewrite Descriptions Batch 3 (P1-009)

> **Parent**: #695
> **Labels**: `phase-1`, `parallel`, `copilot-suitable`, `priority-medium`
> **Milestone**: M2: Test-Stable

## Context

Phase 1 requires rewriting all tool descriptions to follow the active voice format. After Batch 1 (core tools) and Batch 2 (prompt builders), Batch 3 covers the remaining tools.

Follows pattern established in P1-007 and P1-008.

---

## Task Description

Rewrite descriptions for the remaining tools (analysis, design, strategy) following the standardized format.

### Target Tools

| Tool | Current Style | New Active Style |
|------|---------------|------------------|
| `strategy-frameworks-builder` | "Analyze situations using strategic frameworks..." | "Build strategic analysis using SWOT, Porter's Five Forces, and Value Chain frameworks. Select specific frameworks or combine multiple for comprehensive business strategy evaluation." |
| `gap-frameworks-analyzers` | "Analyze gaps between current and desired states..." | "Analyze capability, performance, or technology gaps between current and target states. Generate actionable roadmaps with prioritized recommendations." |
| `sprint-timeline-calculator` | "Calculate sprint timelines..." | "Calculate sprint timelines, velocity projections, and iteration schedules for agile planning. Input story points and team capacity to generate realistic delivery forecasts." |
| `mermaid-diagram-generator` | "Generate Mermaid diagrams..." | "Generate Mermaid diagrams from descriptions. Supports flowcharts, sequence diagrams, class diagrams, state machines, and ERDs with auto-validation and repair." |
| `model-compatibility-checker` | "Recommend best AI models for specific tasks..." | "Recommend optimal AI models for tasks based on capabilities, context length, and budget. Compare Claude, GPT-4, Gemini, and other models with task-specific guidance." |

---

## Acceptance Criteria

- [ ] 5 tool descriptions rewritten in active voice
- [ ] Each description starts with imperative verb
- [ ] Descriptions include key capabilities/use cases
- [ ] Character count: 150-300 per description
- [ ] All linting passes
- [ ] Tests still pass

---

## Files to Change

| File | Change |
|------|--------|
| `src/index.ts` | Update `description` in tool definitions for 5 tools |

---

## Implementation Hints

```typescript
// In src/index.ts, locate each tool's registration:
{
  name: "strategy-frameworks-builder",
  description: "Build strategic analysis using SWOT, Porter's Five Forces, and Value Chain frameworks. Select specific frameworks or combine multiple for comprehensive business strategy evaluation.",
  inputSchema: { ... }
}
```

**Format Rules**:
1. Start with action verb (Build, Analyze, Calculate, Generate, Recommend)
2. State primary purpose first
3. Add 1-2 specific capabilities
4. Mention use case if not obvious
5. Keep under 300 characters

---

## Testing Strategy

- Run `npm run check` for lint/format
- Run `npm run test:vitest` to ensure no regressions
- Manual review: descriptions should be distinct and informative

---

## Dependencies

- **Depends on**: P1-007, P1-008 (pattern established)
- **Enables**: P1-010 (uniqueness test)

---

## References

- [SPEC-001: LLM Tool Discoverability](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-llm-tool-discoverability.md) §3.3
- [TASKS-phase-1.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-1.md) P1-009
