# Tasks Index

> Phase-by-phase task breakdowns for v0.13.x implementation

## Quick Links

| Phase   | Tasks Doc                                                                    | Duration   | Focus                         |
| ------- | ---------------------------------------------------------------------------- | ---------- | ----------------------------- |
| Phase 1 | [TASKS-phase-1-discoverability.md](TASKS-phase-1-discoverability.md)         | Week 3-4   | Tool discoverability          |
| Phase 2 | [TASKS-phase-2-domain-extraction.md](TASKS-phase-2-domain-extraction.md)     | Week 5-8   | Domain layer + OutputStrategy |
| Phase 3 | [TASKS-phase-3-broken-tools.md](TASKS-phase-3-broken-tools.md)               | Week 9-10  | Fix broken tools              |
| Phase 4 | [TASKS-phase-4-speckit-integration.md](TASKS-phase-4-speckit-integration.md) | Week 11-14 | Spec-Kit methodology          |

## Task Summary by Phase

### Phase 1: Discoverability (18 Tasks)
- **P1-001 to P1-005**: Add ToolAnnotations to all tools
- **P1-006 to P1-009**: Rewrite tool descriptions
- **P1-010**: Description uniqueness test
- **P1-011 to P1-012**: Add schema examples
- **P1-013 to P1-016**: Consolidate prompt tools
- **P1-017 to P1-018**: Documentation and testing

**Exit Criteria**: All tools unique/discoverable, 3→1 consolidation

---

### Phase 2: Domain Extraction + Output Strategy (28 Tasks)

**Phase 2a (Week 5-6):**
- **P2-001 to P2-004**: ErrorCode infrastructure
- **P2-005 to P2-007**: Domain layer setup + first extractions
- **P2-008 to P2-014**: Migrate tools to new errors + domain

**Phase 2b (Week 7-8):**
- **P2-015 to P2-019**: OutputStrategy interface + first strategies
- **P2-020**: CrossCuttingManager
- **P2-021 to P2-028**: Remaining strategies + gateway integration

**Exit Criteria**: Domain functions pure, 7 strategies, gateway working

---

### Phase 3: Broken Tools (18 Tasks)
- **P3-001 to P3-004**: Fix mode-switcher
- **P3-005 to P3-008**: Fix project-onboarding
- **P3-009 to P3-018**: Fix agent-orchestrator + integration

**Exit Criteria**: All 3 tools functional, tests passing

---

### Phase 4: Spec-Kit Integration (24 Tasks)

**Phase 4a (Week 11-12):**
- **P4-001 to P4-006**: Constitution parser + core generation
- **P4-007 to P4-012**: Tasks/progress generation + integration

**Phase 4b (Week 13-14):**
- **P4-013 to P4-016**: Spec validation
- **P4-017 to P4-024**: Progress tracking + polish

**Exit Criteria**: Full Spec-Kit workflow working

---

## Task ID Convention

```
P<phase>-<number>
│ │
│ └── Sequential number within phase (001-999)
└──── Phase number (1, 2, 3, 4)
```

Examples:
- `P1-001` — First task in Phase 1
- `P2-015` — 15th task in Phase 2
- `P4-024` — Final task in Phase 4

---

## Task Priority Levels

| Priority   | Definition                        |
| ---------- | --------------------------------- |
| **High**   | Critical path, blocks other tasks |
| **Medium** | Important but not blocking        |
| **Low**    | Nice to have, can defer           |

---

## Total Task Count

| Phase     | High   | Medium | Low   | Total  |
| --------- | ------ | ------ | ----- | ------ |
| Phase 1   | 10     | 7      | 1     | 18     |
| Phase 2   | 18     | 8      | 2     | 28     |
| Phase 3   | 11     | 5      | 2     | 18     |
| Phase 4   | 12     | 9      | 3     | 24     |
| **Total** | **51** | **29** | **8** | **88** |

---

## Definition of Done (All Tasks)

1. Code changes merged to main
2. All tests passing (unit + integration)
3. Documentation updated
4. No regressions in existing functionality
5. PR reviewed and approved

---

## Related Documents

- [Specifications](../specs/) — Technical specifications
- [ADRs](../adrs/) — Architecture decisions
- [TIMELINE.md](../TIMELINE.md) — Sprint schedule
- [CONSTITUTION.md](../CONSTITUTION.md) — Project constraints

---

*Index Updated: January 2026*
