# GitHub Issue Templates for v0.14.x Strategic Consolidation

This directory contains issue templates generated from the SpecKit plan for creating GitHub issues.

## Issue Categories

### Phase 1: Foundation (8 issues)

| Issue # | Title                                          | Type     | Priority |
| ------- | ---------------------------------------------- | -------- | -------- |
| 1       | Implement BaseStrategy Abstract Class          | feature  | P0       |
| 2       | Implement ExecutionTrace System                | feature  | P0       |
| 3       | Implement SummaryFeedbackCoordinator           | feature  | P1       |
| 4       | Implement AgentHandoffCoordinator              | feature  | P1       |
| 5       | Migrate SpecKit Strategy to BaseStrategy       | refactor | P1       |
| 6       | Migrate TOGAF Strategy to BaseStrategy         | refactor | P1       |
| 7       | Migrate ADR/RFC/Enterprise/SDD/Chat Strategies | refactor | P2       |
| 8       | Phase 1 Validation & Testing                   | testing  | P0       |

### Phase 2: Unification (7 issues)

| Issue # | Title                                  | Type     | Priority |
| ------- | -------------------------------------- | -------- | -------- |
| 9       | Implement UnifiedPromptBuilder Core    | feature  | P0       |
| 10      | Implement PromptRegistry Pattern       | feature  | P1       |
| 11      | Implement TemplateEngine               | feature  | P1       |
| 12      | Register All Prompt Domains            | feature  | P1       |
| 13      | Create Legacy Facades with Deprecation | refactor | P2       |
| 14      | Update All Tests for Unified Prompts   | testing  | P1       |
| 15      | Phase 2 Validation & Testing           | testing  | P0       |

### Phase 3: Consolidation (6 issues)

| Issue # | Title                          | Type     | Priority |
| ------- | ------------------------------ | -------- | -------- |
| 16      | Implement FrameworkRouter      | feature  | P0       |
| 17      | Create 11 Unified Frameworks   | feature  | P0       |
| 18      | Migrate 30 Tools to Frameworks | refactor | P1       |
| 19      | Update Barrel Files (index.ts) | refactor | P2       |
| 20      | Update MCP Server Registration | refactor | P1       |
| 21      | Phase 3 Validation & Testing   | testing  | P0       |

### Phase 4: Platform (5 issues)

| Issue # | Title                            | Type     | Priority |
| ------- | -------------------------------- | -------- | -------- |
| 22      | Define PAL Interface             | feature  | P0       |
| 23      | Implement NodePAL                | feature  | P1       |
| 24      | Implement MockPAL                | feature  | P1       |
| 25      | Migrate All fs/path Calls to PAL | refactor | P1       |
| 26      | Phase 4 Validation & Testing     | testing  | P0       |

### Phase 5: Enforcement (4 issues)

| Issue # | Title                                 | Type     | Priority |
| ------- | ------------------------------------- | -------- | -------- |
| 27      | Implement 5 Enforcement Tools         | feature  | P0       |
| 28      | Create CI Enforcement Workflow        | feature  | P1       |
| 29      | Achieve 100% ToolAnnotations Coverage | refactor | P1       |
| 30      | Phase 5 Validation & Testing          | testing  | P0       |

### Phase 6: Finalization (4 issues)

| Issue # | Title                  | Type    | Priority |
| ------- | ---------------------- | ------- | -------- |
| 31      | Complete Documentation | docs    | P0       |
| 32      | Write Migration Guide  | docs    | P1       |
| 33      | Update CHANGELOG       | docs    | P1       |
| 34      | v0.14.0 Release        | release | P0       |

## Usage

### Create Issues via GitHub CLI

```bash
# Create all issues from templates
for template in ./templates/*.md; do
  gh issue create --body-file "$template" --label "v0.14.x"
done
```

### Create Issue from Template

```bash
# Single issue
gh issue create \
  --title "Implement BaseStrategy Abstract Class" \
  --body-file ./templates/issue-001-base-strategy.md \
  --label "feature,v0.14.x,P0" \
  --milestone "v0.14.0"
```

## Template Format

Each template follows this structure:

```markdown
## Summary

Brief description of the work.

## Context

Background and motivation.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Technical Details

Implementation guidance.

## Dependencies

- Depends on: #issue
- Blocks: #issue

## Effort Estimate

X hours

## References

- [spec.md](../spec.md)
- [tasks.md](../tasks.md)
```

---

*Generated from SpecKit plan on 2026-02-01*
