# MCP AI Agent Guidelines v0.13.x — Timeline & Milestones

> Sprint planning and milestone tracking for the Hybrid SDD + ADR approach

## 📅 Timeline Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           v0.13.x TIMELINE                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Jan 2026                  Feb 2026                  Mar 2026               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │Wk1-2 │ │Wk3-4 │ │Wk5-6 │ │Wk7-8 │ │Wk9-10│ │Wk11-12│ │Wk13-14│ │Wk15-16│ │
│  │      │ │      │ │      │ │      │ │      │ │      │ │      │ │      │  │
│  │Phase │ │Phase │ │Phase │ │Phase │ │Phase │ │Phase │ │Phase │ │Buffer│  │
│  │  0   │ │  1   │ │  2a  │ │  2b  │ │  3   │ │  4a  │ │  4b  │ │      │  │
│  │      │ │      │ │      │ │      │ │      │ │      │ │      │ │      │  │
│  │Found.│ │Discov│ │Domain│ │Output│ │Broken│ │SpecK │ │Valid │ │Polish│  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
│                                                                             │
│  Milestones:                                                                │
│  ◆ M1: Foundation Complete (End Week 2)                                     │
│  ◆ M2: LLM Discoverability Fixed (End Week 4)                              │
│  ◆ M3: Domain Layer Extracted (End Week 8)                                  │
│  ◆ M4: All Tools Functional (End Week 10)                                   │
│  ◆ M5: Spec-Kit Integration (End Week 14)                                   │
│  ◆ M6: v0.13.0 Release (End Week 16)                                        │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Foundation (Week 1-2)

### Objective
Establish documentation foundation for all subsequent work.

### Deliverables

| Item                                | Status     | Owner | Due    |
| ----------------------------------- | ---------- | ----- | ------ |
| Constitution.md                     | ✅ Complete | —     | Week 1 |
| ADR-001: Output Strategy Pattern    | 🔲 Draft    | —     | Week 1 |
| ADR-002: Tool Annotations Standard  | 🔲 Draft    | —     | Week 1 |
| ADR-003: Strangler Fig Migration    | 🔲 Draft    | —     | Week 1 |
| ADR-004: Error Code Enum            | 🔲 Draft    | —     | Week 2 |
| ADR-005: Cross-Cutting Capabilities | 🔲 Draft    | —     | Week 2 |
| SPEC-001: Output Strategy Layer     | 🔲 Draft    | —     | Week 2 |
| SPEC-002: Tool Harmonization        | 🔲 Draft    | —     | Week 2 |

### Exit Criteria
- [ ] All 5 ADRs in "Proposed" status
- [ ] All specifications drafted
- [ ] GitHub Issues created for Phase 1

### Milestone M1: Foundation Complete
**Date**: End of Week 2
**Criteria**: All planning documents complete, team aligned on approach

---

## Phase 1: Discoverability (Week 3-4)

### Objective
Fix LLM tool discoverability crisis — highest impact-to-effort ratio.

### Deliverables

| Item                              | Status | Owner | Due    |
| --------------------------------- | ------ | ----- | ------ |
| Rewrite all 30+ tool descriptions | 🔲      | —     | Week 3 |
| Add ToolAnnotations to all tools  | 🔲      | —     | Week 3 |
| Add examples to JSON schemas      | 🔲      | —     | Week 4 |
| Consolidate overlapping tools     | 🔲      | —     | Week 4 |
| Update tool tests                 | 🔲      | —     | Week 4 |

### Tool Description Pattern

```typescript
// BEFORE
"Build structured prompts with clear hierarchies and layers of specificity.
Use this MCP to create prompts with context → goal → requirements hierarchy..."

// AFTER
"Create AI prompts with context→goal→requirements structure.
BEST FOR: Code reviews, feature specs, technical decisions.
OUTPUTS: Markdown prompt ready for injection."
```

### Tool Consolidation Plan

| Current Tools                 | Action             | Result           |
| ----------------------------- | ------------------ | ---------------- |
| hierarchical-prompt-builder   | Keep as primary    | prompt-hierarchy |
| hierarchy-level-selector      | Merge → mode param | prompt-hierarchy |
| prompting-hierarchy-evaluator | Merge → mode param | prompt-hierarchy |

### Exit Criteria
- [ ] All tools have unique, action-oriented descriptions
- [ ] All tools have ToolAnnotations
- [ ] JSON schemas include examples for required params
- [ ] 3 overlapping prompt tools consolidated into 1
- [ ] Test coverage maintained at 90%+

### Milestone M2: LLM Discoverability Fixed
**Date**: End of Week 4
**Criteria**: LLMs select correct tool 90%+ of time (manual testing)

---

## Phase 2a: Domain Extraction (Week 5-6)

### Objective
Extract pure domain logic from tools into `src/domain/` layer.

### Deliverables

| Item                         | Status | Owner | Due    |
| ---------------------------- | ------ | ----- | ------ |
| Create src/domain/ structure | 🔲      | —     | Week 5 |
| Extract prompting domain     | 🔲      | —     | Week 5 |
| Extract analysis domain      | 🔲      | —     | Week 6 |
| Extract design domain        | 🔲      | —     | Week 6 |
| Add domain layer tests       | 🔲      | —     | Week 6 |

### Directory Structure

```
src/domain/
├── prompting/
│   ├── hierarchical-builder.ts   # Pure prompt building
│   ├── hierarchy-selector.ts     # Level selection logic
│   ├── prompt-evaluator.ts       # Evaluation logic
│   └── types.ts                  # Domain types
├── analysis/
│   ├── code-scorer.ts            # Clean code scoring
│   ├── hygiene-analyzer.ts       # Code hygiene
│   ├── dependency-auditor.ts     # Dependency audit
│   └── types.ts
└── design/
    ├── session-manager.ts        # Design sessions
    ├── phase-workflow.ts         # Phase progression
    ├── artifact-generator.ts     # ADR/spec generation
    └── types.ts
```

### Exit Criteria
- [ ] All domain functions are pure (no output formatting)
- [ ] Domain layer has 95%+ test coverage
- [ ] No MCP imports in domain layer
- [ ] Existing tools still work (Strangler Fig)

---

## Phase 2b: Output Strategy (Week 7-8)

### Objective
Implement OutputStrategy layer with 7+ output approaches.

### Deliverables

| Item                            | Status | Owner | Due    |
| ------------------------------- | ------ | ----- | ------ |
| Create OutputStrategy interface | 🔲      | —     | Week 7 |
| Implement ChatStrategy          | 🔲      | —     | Week 7 |
| Implement RFCStrategy           | 🔲      | —     | Week 7 |
| Implement ADRStrategy           | 🔲      | —     | Week 8 |
| Implement SDDStrategy           | 🔲      | —     | Week 8 |
| Implement CrossCutting support  | 🔲      | —     | Week 8 |
| Wire to PolyglotGateway         | 🔲      | —     | Week 8 |

### OutputStrategy Interface

```typescript
interface OutputStrategy {
  approach: OutputApproach;
  crossCutting: CrossCuttingCapability[];
  render(result: DomainResult, options: RenderOptions): OutputArtifacts;
}

type OutputApproach = 'chat' | 'rfc' | 'adr' | 'sdd' | 'speckit' | 'togaf' | 'enterprise';
type CrossCuttingCapability = 'workflow' | 'shell-script' | 'diagram' | 'config' | 'issues';
```

### Exit Criteria
- [ ] 7 output approaches implemented
- [ ] Cross-cutting capabilities work with all approaches
- [ ] RFC output includes workflow YAML (demonstration)
- [ ] ADR output includes migration script (demonstration)
- [ ] Strategy selection works via parameter

### Milestone M3: Domain Layer Extracted
**Date**: End of Week 8
**Criteria**: Clean separation of domain and output concerns

---

## Phase 3: Broken Tools (Week 9-10)

### Objective
Fix the 3 confirmed broken tools.

### Deliverables

| Tool               | Issue                     | Fix                       | Status |
| ------------------ | ------------------------- | ------------------------- | ------ |
| mode-switcher      | No state change           | Integrate session storage | 🔲      |
| project-onboarding | No file scanning          | Bridge to file system     | 🔲      |
| agent-orchestrator | Incomplete executeChain() | Complete implementation   | 🔲      |

### mode-switcher Fix

```typescript
// BEFORE: Returns markdown, doesn't change state
export function switchMode(target: Mode): string {
  return formatModeGuidance(target);
}

// AFTER: Actually changes agent state
export function switchMode(target: Mode): SessionState {
  const state = sessionStore.get();
  const newState = calculateNewState(state, target);
  sessionStore.set(newState);
  return newState;
}
```

### project-onboarding Fix

```typescript
// Use bridge pattern for file system access
import { projectOnboardingBridge } from '../bridge/project-onboarding-bridge.js';

export async function onboardProject(path: string): Promise<ProjectProfile> {
  const structure = await projectOnboardingBridge.scanDirectory(path);
  const languages = projectOnboardingBridge.detectLanguages(structure);
  const frameworks = projectOnboardingBridge.detectFrameworks(structure);
  return { structure, languages, frameworks };
}
```

### Exit Criteria
- [ ] mode-switcher actually changes agent state
- [ ] project-onboarding scans real directories
- [ ] agent-orchestrator executes chains successfully
- [ ] All 3 tools have integration tests
- [ ] Broken tool count = 0

### Milestone M4: All Tools Functional
**Date**: End of Week 10
**Criteria**: Zero broken tools, all integration tests passing

---

## Phase 4a: Spec-Kit Integration (Week 11-12)

### Objective
Add Spec-Kit compatible workflow support.

### Deliverables

| Item                       | Status | Owner | Due     |
| -------------------------- | ------ | ----- | ------- |
| spec.md generation         | 🔲      | —     | Week 11 |
| plan.md generation         | 🔲      | —     | Week 11 |
| tasks.md derivation        | 🔲      | —     | Week 12 |
| Constitutional constraints | 🔲      | —     | Week 12 |
| Local file writing         | 🔲      | —     | Week 12 |

### Spec-Kit Structure

```
.specify/
├── memory/
│   └── constitution.md      # Project constraints
├── specs/
│   └── [feature]/
│       ├── spec.md          # Specification
│       ├── plan.md          # Implementation plan
│       └── tasks.md         # Task breakdown
└── scripts/
    └── [automation]
```

### design-assistant Enhancement

```typescript
// New actions for spec-kit workflow
type DesignAssistantAction =
  | 'start-session'
  | 'advance-phase'
  | 'create-specification'    // NEW: Generate spec.md
  | 'create-plan'             // NEW: Generate plan.md
  | 'derive-tasks'            // NEW: Generate tasks.md
  | 'generate-artifacts';
```

### Exit Criteria
- [ ] spec.md generation works from design-assistant
- [ ] plan.md generated with phases
- [ ] tasks.md derived from plan
- [ ] Files written to .specify/ directory
- [ ] Constitutional constraints respected

---

## Phase 4b: Validation (Week 13-14)

### Objective
Validate entire implementation against specifications.

### Deliverables

| Item                          | Status | Owner | Due     |
| ----------------------------- | ------ | ----- | ------- |
| Spec-001 checklist validation | 🔲      | —     | Week 13 |
| Spec-002 checklist validation | 🔲      | —     | Week 13 |
| LLM discoverability testing   | 🔲      | —     | Week 14 |
| Demo scripts updated          | 🔲      | —     | Week 14 |
| Documentation complete        | 🔲      | —     | Week 14 |

### LLM Discoverability Test Matrix

| Scenario                              | Expected Tool          | Success Criteria |
| ------------------------------------- | ---------------------- | ---------------- |
| "Review my code for quality"          | clean-code-scorer      | Selected first   |
| "Create a prompt for code review"     | prompt-hierarchy       | Selected first   |
| "Document this architecture decision" | design-assistant + ADR | Correct workflow |
| "Generate a specification"            | design-assistant + SDD | Correct workflow |

### Exit Criteria
- [ ] All specification checklists pass
- [ ] LLM selects correct tool 90%+ of time
- [ ] All demo scripts work
- [ ] README updated with new capabilities
- [ ] CHANGELOG prepared

### Milestone M5: Spec-Kit Integration
**Date**: End of Week 14
**Criteria**: Complete Spec-Kit workflow functional

---

## Buffer & Polish (Week 15-16)

### Objective
Address issues discovered during validation, prepare release.

### Deliverables

| Item                      | Status | Owner | Due     |
| ------------------------- | ------ | ----- | ------- |
| Bug fixes from validation | 🔲      | —     | Week 15 |
| Performance optimization  | 🔲      | —     | Week 15 |
| CHANGELOG finalized       | 🔲      | —     | Week 16 |
| Migration guide written   | 🔲      | —     | Week 16 |
| v0.13.0 release           | 🔲      | —     | Week 16 |

### Exit Criteria
- [ ] No P0/P1 bugs open
- [ ] Performance acceptable
- [ ] All documentation complete
- [ ] Migration guide reviewed
- [ ] Release tagged

### Milestone M6: v0.13.0 Release
**Date**: End of Week 16
**Criteria**: Production-ready release published

---

## 📊 Risk Register

| Risk                     | Likelihood | Impact | Mitigation                            |
| ------------------------ | ---------- | ------ | ------------------------------------- |
| Strangler Fig complexity | Medium     | High   | Clear seam definitions, feature flags |
| Breaking changes         | Medium     | High   | Deprecation warnings, migration guide |
| Test coverage drop       | Low        | Medium | Coverage gates in CI                  |
| Scope creep              | Medium     | Medium | Strict spec adherence                 |
| Timeline slip            | Medium     | Medium | Buffer phase, prioritization          |

---

## 📈 Progress Tracking

### Weekly Status Template

```markdown
## Week X Status

### Completed
- Item 1
- Item 2

### In Progress
- Item 3 (80%)
- Item 4 (50%)

### Blocked
- Item 5 — Reason

### Next Week
- Item 6
- Item 7

### Metrics
- Test Coverage: XX%
- Open Issues: X
- PRs Merged: X
```

---

*Timeline Created: January 2026*
*Last Updated: January 2026*
*Status: Phase 0 (Foundation)*
