# 🎯 Epic: Phase 1 — LLM Tool Discoverability [serial]

> **Milestone**: M2: Discoverability (End Week 4)
> **Labels**: `phase-1`, `epic`, `copilot-suitable`
> **Duration**: 2 weeks (Week 3-4)

## Summary

Phase 1 addresses the **LLM Tool Discoverability Crisis** — the most impactful improvement with lowest effort. Currently, LLMs struggle to select the correct tool from 30+ available tools due to:
- Repetitive descriptions ("Use this MCP to...")
- Missing ToolAnnotations hints
- No schema examples
- Overlapping tool functionality

**Goal**: Make every tool immediately discoverable and correctly selectable by any LLM.

---

## Implementation Plan

| Order | Issue | Task ID | Priority | Execution | Assignee |
|-------|-------|---------|----------|-----------|----------|
| 1 | #TBD | P1-001 | High | Serial | @copilot |
| 2 | #TBD | P1-002 | High | Parallel | @copilot |
| 3 | #TBD | P1-003 | High | Parallel | @copilot |
| 4 | #TBD | P1-004 | High | Parallel | @copilot |
| 5 | #TBD | P1-005 | Medium | Parallel | @copilot |
| 6 | #TBD | P1-006 | Medium | Parallel | @copilot |
| 7 | #TBD | P1-007 | High | Serial | @copilot |
| 8 | #TBD | P1-008 | High | Serial | @copilot |
| 9 | #TBD | P1-009 | Medium | Serial | @copilot |
| 10 | #TBD | P1-010 | High | Serial | @copilot |
| 11 | #TBD | P1-011 | High | Parallel | @copilot |
| 12 | #TBD | P1-012 | Medium | Parallel | @copilot |
| 13 | #TBD | P1-013 | High | Serial | @copilot |
| 14 | #TBD | P1-014 | High | Serial | @copilot |
| 15 | #TBD | P1-015 | Medium | Serial | @copilot |
| 16 | #TBD | P1-016 | High | Serial | @copilot |
| 17 | #TBD | P1-017 | Medium | Serial | @copilot |
| 18 | #TBD | P1-018 | Medium | Serial | @copilot |

---

## Dependency Graph

```mermaid
flowchart LR
    subgraph "Week 3: Annotations & Descriptions"
        P1001[P1-001: Create Annotation Presets]
        P1002[P1-002: Annotate Analysis Tools]
        P1003[P1-003: Annotate Prompt Tools]
        P1004[P1-004: Annotate Session Tools]
        P1005[P1-005: Annotate Remaining Tools]
        P1006[P1-006: Export Descriptions CSV]
        P1007[P1-007: Rewrite Batch 1]
        P1008[P1-008: Rewrite Batch 2]
        P1009[P1-009: Rewrite Batch 3]

        P1001 --> P1002
        P1001 --> P1003
        P1001 --> P1004
        P1001 --> P1005
        P1006 --> P1007
        P1007 --> P1008
        P1008 --> P1009
    end

    subgraph "Week 4: Schema & Consolidation"
        P1010[P1-010: Uniqueness Test]
        P1011[P1-011: Schema Examples Core]
        P1012[P1-012: Schema Examples All]
        P1013[P1-013: Design Unified Tool]
        P1014[P1-014: Implement Unified Tool]
        P1015[P1-015: Deprecation Warnings]
        P1016[P1-016: Register Tool]
        P1017[P1-017: Update Documentation]
        P1018[P1-018: Phase 1 Tests]

        P1009 --> P1010
        P1011 --> P1012
        P1013 --> P1014
        P1014 --> P1015
        P1015 --> P1016
        P1016 --> P1017
        P1017 --> P1018
    end
```

---

## Technical Summary

### Key Changes

1. **ToolAnnotations** (MCP 2024-11-05 spec)
   - Add to all 30+ tools in `src/index.ts`
   - Use presets: `ANALYSIS_TOOL`, `GENERATION_TOOL`, `SESSION_TOOL`, `FILESYSTEM_TOOL`

2. **Description Rewrite**
   - Template: `[ACTION] [WHAT] for [PURPOSE]. BEST FOR: [cases]. OUTPUTS: [format]`
   - First 10 words must be unique across all tools

3. **Schema Examples**
   - Add `.examples()` to all Zod schemas with required params
   - Examples must be realistic and diverse

4. **Tool Consolidation**
   - Merge 3 prompt tools → `prompt-hierarchy` with `mode` param
   - Add deprecation warnings to old tools

### Files Changed

| Category | Files |
|----------|-------|
| Create | `src/tools/shared/annotation-presets.ts` |
| Create | `src/tools/prompt/prompt-hierarchy.ts` |
| Create | `docs/api/prompt-hierarchy.md` |
| Create | `tests/vitest/discoverability/unique-descriptions.spec.ts` |
| Modify | `src/index.ts` (major changes) |
| Modify | `src/schemas/*.ts` (add examples) |
| Modify | `src/tools/prompt/*.ts` (deprecation warnings) |

---

## Exit Criteria

- [ ] All 30+ tools have ToolAnnotations
- [ ] All tools have unique, action-oriented descriptions
- [ ] All required params have schema examples
- [ ] 3 prompt tools consolidated into `prompt-hierarchy`
- [ ] Uniqueness test passes in CI
- [ ] Test coverage remains ≥90%
- [ ] Manual verification: LLMs select correct tool 90%+ of time

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Unique first-5-words | ~40% | 100% |
| Tools with annotations | 0 | 30+ |
| Tools with examples | ~10 | 30+ |
| Overlapping tools | 3 sets | 0 |

---

## Related Documents

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md)
- [ADR-002: Tool Annotations Standard](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/adrs/ADR-002-tool-annotations-standard.md)
- [TIMELINE: Phase 1](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/TIMELINE.md#phase-1-discoverability-week-3-4)

---

## Notes for Copilot Agent

This epic is **highly suitable for Copilot agent** because:
- Well-scoped, atomic tasks
- Clear acceptance criteria
- File paths specified
- Code patterns provided in SPEC-002
- Tests verify correctness

**Recommended approach**:
1. Start with P1-001 (creates foundation)
2. Do P1-002 through P1-005 in parallel
3. Then sequential flow for descriptions and consolidation
