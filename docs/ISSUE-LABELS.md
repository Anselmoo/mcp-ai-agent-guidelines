# Issue Labels Guide

Comprehensive labeling system for v0.13.x refactoring issues.

## Label Categories

### 🎯 Type Labels (Conventional Commits)

| Label            | Description                                | Example                       |
| ---------------- | ------------------------------------------ | ----------------------------- |
| `type: feat`     | New feature or capability                  | Add constitution parser       |
| `type: refactor` | Code restructuring without behavior change | Extract domain layer          |
| `type: fix`      | Bug fix                                    | Fix mode-switcher memory leak |
| `type: docs`     | Documentation only                         | Update API documentation      |
| `type: test`     | Test additions or fixes                    | Add integration tests         |
| `type: chore`    | Tooling, dependencies, etc.                | Update TypeScript to 5.3      |
| `type: perf`     | Performance improvement                    | Optimize prompt caching       |

### 📦 Phase Labels

| Label      | Description                  | Timeline   |
| ---------- | ---------------------------- | ---------- |
| `phase-0`  | Foundation (ADRs, SPECs)     | Week 1-2   |
| `phase-1`  | Discoverability improvements | Week 3-4   |
| `phase-2a` | Domain extraction (core)     | Week 5-6   |
| `phase-2b` | Output strategies            | Week 7-8   |
| `phase-3`  | Broken tools fixes           | Week 9-10  |
| `phase-4a` | Spec-Kit core                | Week 11-12 |
| `phase-4b` | Spec-Kit validation          | Week 13-14 |

### 🔥 Priority Labels

| Label                | Description                | SLA            |
| -------------------- | -------------------------- | -------------- |
| `priority: critical` | Blocking all work          | Fix ASAP       |
| `priority: high`     | Blocking dependent work    | Within sprint  |
| `priority: medium`   | Important but not blocking | Next 2 sprints |
| `priority: low`      | Nice to have               | Backlog        |

### ⚡ Execution Mode

| Label            | Description                     | Usage             |
| ---------------- | ------------------------------- | ----------------- |
| `mode: serial`   | Must complete before dependents | Sequential tasks  |
| `mode: parallel` | Can run concurrently            | Independent tasks |
| `mode: batch`    | Group of related parallel tasks | Bulk operations   |

### 🎨 Domain Labels

| Label                    | Description                    |
| ------------------------ | ------------------------------ |
| `domain: prompting`      | Prompt building and evaluation |
| `domain: analysis`       | Code analysis and scoring      |
| `domain: design`         | Design workflow and sessions   |
| `domain: gateway`        | Output strategies and gateway  |
| `domain: infrastructure` | Build, test, tooling           |
| `domain: docs`           | Documentation and guides       |

### 🤖 AI/Automation Labels

| Label              | Description                               |
| ------------------ | ----------------------------------------- |
| `copilot-suitable` | Can be completed by GitHub Copilot        |
| `mcp-serena`       | Requires MCP Serena for semantic analysis |
| `ai-assisted`      | Suitable for AI pair programming          |
| `manual-review`    | Requires human expert review              |

### 🔗 Dependency Labels

| Label                   | Description                     |
| ----------------------- | ------------------------------- |
| `blocks: P1-XXX`        | Blocks specific task            |
| `blocked-by: P1-XXX`    | Blocked by specific task        |
| `depends-on: milestone` | Depends on milestone completion |

### 📊 Milestone Labels

| Label                   | Description             | Target Date |
| ----------------------- | ----------------------- | ----------- |
| `M1: Foundation`        | Planning docs complete  | End Week 2  |
| `M2: Discoverability`   | Tool descriptions fixed | End Week 4  |
| `M3: Domain Layer`      | Domain extraction done  | End Week 8  |
| `M4: Tools Fixed`       | All tools functional    | End Week 10 |
| `M5: Spec-Kit Core`     | Spec-Kit working        | End Week 12 |
| `M6: Spec-Kit Complete` | Validation done         | End Week 14 |
| `M7: Release`           | v0.13.0 shipped         | End Week 16 |

### 🎯 Special Labels

| Label                 | Description                        |
| --------------------- | ---------------------------------- |
| `breaking-change`     | Introduces breaking API change     |
| `needs-rfc`           | Requires RFC before implementation |
| `needs-design-review` | Needs architecture review          |
| `good-first-issue`    | Good for new contributors          |
| `help-wanted`         | Community help appreciated         |
| `wontfix`             | Won't be implemented               |
| `duplicate`           | Duplicate of another issue         |
| `on-hold`             | Temporarily paused                 |

## Label Combinations

### Common Patterns

**High-priority feature in Phase 1:**
```
type: feat
phase-1
priority: high
mode: serial
copilot-suitable
```

**Documentation task (parallel work):**
```
type: docs
phase-4b
priority: medium
mode: parallel
domain: docs
```

**Critical bugfix blocking milestone:**
```
type: fix
priority: critical
blocks: M3
mode: serial
manual-review
```

**Refactor requiring Serena:**
```
type: refactor
phase-2a
priority: high
mode: serial
mcp-serena
domain: gateway
```

## GitHub CLI Label Creation

Create all labels at once:

```bash
# Type labels
gh label create "type: feat" --color "0e8a16" --description "New feature"
gh label create "type: refactor" --color "fbca04" --description "Code restructuring"
gh label create "type: fix" --color "d73a4a" --description "Bug fix"
gh label create "type: docs" --color "0075ca" --description "Documentation"
gh label create "type: test" --color "1d76db" --description "Testing"
gh label create "type: chore" --color "fef2c0" --description "Maintenance"
gh label create "type: perf" --color "c5def5" --description "Performance"

# Phase labels
gh label create "phase-0" --color "5319e7" --description "Foundation"
gh label create "phase-1" --color "7057ff" --description "Discoverability"
gh label create "phase-2a" --color "8b8aff" --description "Domain Extraction"
gh label create "phase-2b" --color "a6a8ff" --description "Output Strategies"
gh label create "phase-3" --color "c1c3ff" --description "Broken Tools"
gh label create "phase-4a" --color "ddd8ff" --description "Spec-Kit Core"
gh label create "phase-4b" --color "f0edff" --description "Spec-Kit Validation"

# Priority labels
gh label create "priority: critical" --color "b60205" --description "Critical priority"
gh label create "priority: high" --color "d93f0b" --description "High priority"
gh label create "priority: medium" --color "fbca04" --description "Medium priority"
gh label create "priority: low" --color "0e8a16" --description "Low priority"

# Mode labels
gh label create "mode: serial" --color "d4c5f9" --description "Sequential execution"
gh label create "mode: parallel" --color "c2e0c6" --description "Concurrent execution"
gh label create "mode: batch" --color "bfd4f2" --description "Batch processing"

# Domain labels
gh label create "domain: prompting" --color "ededed" --description "Prompting domain"
gh label create "domain: analysis" --color "ededed" --description "Analysis domain"
gh label create "domain: design" --color "ededed" --description "Design domain"
gh label create "domain: gateway" --color "ededed" --description "Gateway domain"
gh label create "domain: infrastructure" --color "ededed" --description "Infrastructure"
gh label create "domain: docs" --color "ededed" --description "Documentation"

# AI/Automation labels
gh label create "copilot-suitable" --color "006b75" --description "GitHub Copilot can handle"
gh label create "mcp-serena" --color "0e8a16" --description "Requires MCP Serena"
gh label create "ai-assisted" --color "bfdadc" --description "AI pair programming"
gh label create "manual-review" --color "d93f0b" --description "Human review required"

# Special labels
gh label create "breaking-change" --color "d73a4a" --description "Breaking API change"
gh label create "needs-rfc" --color "d876e3" --description "RFC required"
gh label create "needs-design-review" --color "d876e3" --description "Architecture review needed"
gh label create "good-first-issue" --color "7057ff" --description "Good for newcomers"
gh label create "help-wanted" --color "008672" --description "Community help wanted"
```

## Usage in Issue Frontmatter

```yaml
---
title: "P4-001: Analyze CONSTITUTION.md Structure"
taskId: "P4-001"
type: "feat"
mode: "serial"
phase: "phase-4a"
priority: "high"
milestone: "M5: Spec-Kit Core"
estimate: "2 hours"
labels:
  - type: feat
  - phase-4a
  - priority: high
  - mode: serial
  - copilot-suitable
  - domain: infrastructure
dependsOn: []
blocks:
  - P4-002
copilotSuitable: true
mcpSerena: false
---
```

## Label Query Examples

**All high-priority Phase 1 tasks:**
```bash
gh issue list --label "phase-1" --label "priority: high"
```

**Parallel tasks that can run now:**
```bash
gh issue list --label "mode: parallel" --state "open"
```

**Tasks suitable for Copilot:**
```bash
gh issue list --label "copilot-suitable" --state "open"
```

**Blocked tasks:**
```bash
gh issue list --label "blocked-by"
```

## Automation Workflows

### Auto-label based on file changes
```yaml
# .github/workflows/auto-label.yml
name: Auto Label
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - if: contains(github.event.pull_request.files, 'src/domain/')
        run: gh pr edit ${{ github.event.pull_request.number }} --add-label "domain: *"
```

### Milestone automation
```yaml
# .github/workflows/milestone-check.yml
name: Milestone Check
on:
  issues:
    types: [closed]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check milestone completion
        run: |
          # Check if all issues in milestone are closed
          # Update milestone status
```

---

**Last Updated**: 2026-01-03
