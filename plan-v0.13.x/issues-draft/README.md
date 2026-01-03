# Issue Draft System — v0.13.x Implementation

> Local issue drafts for bulk creation via GitHub CLI

## 📋 Quick Reference

```bash
# Create all issues for a phase
./scripts/create-issues-phase1.sh

# Assign to Copilot agent
gh issue edit <number> --add-assignee @copilot

# Bulk assign phase issues
for i in $(gh issue list --label "phase-1" -q '.[] | .number'); do
  gh issue edit $i --add-assignee @copilot
done
```

---

## 📁 File Naming Convention

```
<priority><sequence>-<scope>-<topic>.md

Priority:
  0XX — Parent/Epic issues (orchestration)
  1XX — High priority sub-issues (blocking)
  2XX — Medium priority sub-issues
  3XX — Low priority sub-issues

Scope:
  parent — Epic/tracking issue
  sub    — Implementation issue

Examples:
  001-parent-phase1-discoverability.md    # Phase 1 Epic
  101-sub-tool-annotations.md              # High priority sub-issue
  201-sub-schema-examples.md               # Medium priority sub-issue
```

---

## 🏷️ Label System

### Phase Labels
| Label | Color | Description |
|-------|-------|-------------|
| `phase-1` | `#0E8A16` | Discoverability work |
| `phase-2` | `#1D76DB` | Domain extraction |
| `phase-3` | `#D93F0B` | Broken tools fix |
| `phase-4` | `#5319E7` | Spec-Kit integration |

### Execution Labels
| Label | Color | Description |
|-------|-------|-------------|
| `parallel` | `#FBCA04` | Can run in parallel with others |
| `serial` | `#B60205` | Must complete before next |
| `copilot-suitable` | `#0052CC` | Good for Copilot agent |
| `human-required` | `#E99695` | Needs human expertise |

### MCP Tool Labels (recommend tool usage)
| Label | Description |
|-------|-------------|
| `mcp-serena` | Use Serena for symbol manipulation |
| `mcp-context7` | Use Context7 for docs lookup |
| `mcp-playwright` | Use Playwright for testing |

### Priority Labels
| Label | Color | Description |
|-------|-------|-------------|
| `priority-high` | `#B60205` | Critical path, blocks others |
| `priority-medium` | `#FBCA04` | Important but not blocking |
| `priority-low` | `#0E8A16` | Nice to have |

---

## 📊 Milestone Definitions

| Milestone | Target Date | Exit Criteria |
|-----------|-------------|---------------|
| **M1: Foundation** | End Week 2 | All planning docs complete |
| **M2: Discoverability** | End Week 4 | All tools unique & annotated |
| **M3: Domain Layer** | End Week 8 | Domain extracted, strategies working |
| **M4: Tools Fixed** | End Week 10 | All 3 broken tools functional |
| **M5: Spec-Kit** | End Week 14 | Full Spec-Kit workflow |
| **M6: Release** | End Week 16 | v0.13.0 released |

---

## 📝 Issue Template Structure

### Parent Issue Template
```markdown
## 🎯 Epic: [Phase Name]

### Summary
[Brief description of the phase objective]

### Implementation Plan

| Order | Issue | Priority | Execution | Assignee |
|-------|-------|----------|-----------|----------|
| 1 | #101 | High | Serial | @copilot |
| 2 | #102 | High | Parallel | @copilot |

### Dependency Graph
\`\`\`mermaid
flowchart LR
    A[P1-001] --> B[P1-002]
    A --> C[P1-003]
    B --> D[P1-006]
\`\`\`

### Technical Summary
[Key architectural decisions and file changes]

### Exit Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Related Documents
- [SPEC-XXX](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-XXX.md)
- [ADR-XXX](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/adrs/ADR-XXX.md)
```

### Sub-Issue Template
```markdown
## 🔧 [Task Title]

### Context
[Why this task exists, what problem it solves]

### Task Description
[Detailed description of what needs to be done]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass
- [ ] Documentation updated

### Files to Change
| Action | Path |
|--------|------|
| Create | `src/path/to/new-file.ts` |
| Modify | `src/path/to/existing.ts` |

### Implementation Hints
[Code snippets, patterns to follow, gotchas]

### Testing Strategy
[How to verify this task is complete]

### Dependencies
- Blocked by: #XXX
- Blocks: #YYY

### References
- [SPEC-XXX](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-XXX.md)
- [Relevant code](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/src/...)
```

---

## 🚀 Creation Scripts

Scripts will be generated in `scripts/create-issues-phase*.sh`:
- Read issue markdown files
- Use `gh issue create` with labels, milestones
- Output created issue numbers for reference
- Support dry-run mode

---

## 📈 Progress Tracking

After issues are created, track progress via:
```bash
# Phase 1 progress
gh issue list --label "phase-1" --state all --json state,title

# Copilot assigned issues
gh issue list --assignee @copilot --state open

# Generate progress report
./scripts/progress-report.sh
```

