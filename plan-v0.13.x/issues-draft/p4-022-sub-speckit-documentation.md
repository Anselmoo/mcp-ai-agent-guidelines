# 🔧 P4-022: Spec-Kit Documentation [serial]

> **Parent**: #TBD
> **Labels**: `phase-4b`, `priority-medium`, `serial`, `copilot-suitable`
> **Milestone**: M7: Spec-Kit Progress
> **Estimate**: 3 hours
> **Depends On**: P4-020
> **Blocks**: P4-024

## Context

Comprehensive documentation ensures users understand how to use Spec-Kit features effectively, including tools, workflows, and constitutional constraints.

## Task Description

Create documentation for Spec-Kit features:

**Create `docs/speckit/README.md`:**
```markdown
# Spec-Kit Integration

Spec-Kit is a structured methodology for creating and managing project specifications,
based on [GitHub's Spec-Kit](https://github.com/github/spec-kit) approach.

## Overview

Spec-Kit generates four interconnected artifacts:

1. **spec.md** - Project specification with objectives, requirements, and constraints
2. **plan.md** - Implementation plan with phases, dependencies, and timeline
3. **tasks.md** - Derived tasks from requirements with priorities
4. **progress.md** - Progress tracking with completion metrics

## Quick Start

\`\`\`typescript
import { specKitGenerator } from 'mcp-ai-agent-guidelines';

const result = await specKitGenerator({
  title: 'My Feature',
  overview: 'Feature description',
  objectives: [{ description: 'Objective 1', priority: 'high' }],
  requirements: [{ description: 'Requirement 1', type: 'functional' }],
});
\`\`\`

## Features

- **Constitution-aware**: Validate specs against project principles and constraints
- **Task derivation**: Automatically derive tasks from requirements
- **Progress tracking**: Track completion with metrics and status indicators
- **Git integration**: Sync progress from commit messages

## Documentation

- [Usage Guide](./usage.md) - Detailed usage instructions
- [Constitution Guide](./constitution-guide.md) - Writing and using constitutional constraints
- [Tool Reference](./tools.md) - MCP tool documentation

## Related

- [SPEC-005: Spec-Kit Integration](../../plan-v0.13.x/specs/SPEC-005-speckit-integration.md)
- [GitHub Spec-Kit](https://github.com/github/spec-kit)
```

**Create `docs/speckit/usage.md`:**
```markdown
# Spec-Kit Usage Guide

## Table of Contents

1. [Generating Specifications](#generating-specifications)
2. [Validating Against Constitution](#validating-against-constitution)
3. [Tracking Progress](#tracking-progress)
4. [Design-Assistant Integration](#design-assistant-integration)

## Generating Specifications

### Using speckit-generator Tool

\`\`\`typescript
const result = await specKitGenerator({
  title: 'User Authentication',
  overview: 'Implement secure authentication system',
  objectives: [
    { description: 'Enable secure login', priority: 'high' },
    { description: 'Support password reset', priority: 'medium' },
  ],
  requirements: [
    { description: 'Email/password login', type: 'functional', priority: 'high' },
    { description: 'Passwords hashed with bcrypt', type: 'non-functional' },
  ],
  acceptanceCriteria: [
    'Invalid credentials return 401',
    'Password reset within 5 seconds',
  ],
  outOfScope: [
    'OAuth integration',
    'Multi-factor authentication',
  ],
  constitutionPath: './CONSTITUTION.md',
  validateAgainstConstitution: true,
});
\`\`\`

### Output Structure

The generator produces four files:

#### spec.md
- Title and overview
- Objectives with priorities
- Functional and non-functional requirements
- Acceptance criteria
- Out of scope items
- Constitutional constraints (if constitution provided)

#### plan.md
- Implementation approach
- Phases with deliverables
- Dependencies
- Risk assessment
- Timeline table

#### tasks.md
- Tasks derived from requirements
- Priority assignments
- Phase assignments
- Dependency tracking

#### progress.md
- Status indicator
- Summary metrics
- Task completion checklist

## Validating Against Constitution

### Using validate-spec Tool

\`\`\`typescript
const result = await validateSpec({
  specContent: specMarkdown,
  constitutionPath: './CONSTITUTION.md',
  outputFormat: 'markdown',
  includeRecommendations: true,
});
\`\`\`

### Validation Result

- **Score**: 0-100 compliance score
- **Issues**: Errors, warnings, and info items
- **Recommendations**: Suggested improvements

## Tracking Progress

### Using update-progress Tool

\`\`\`typescript
const result = await updateProgress({
  progressPath: './progress.md',
  completedTaskIds: ['TASK-001', 'TASK-002'],
  syncFromGit: true,
  outputFormat: 'markdown',
});
\`\`\`

### Git Integration

Enable automatic progress updates from commits:

\`\`\`bash
git commit -m "closes TASK-001: Implement login endpoint"
\`\`\`

Recognized patterns:
- `closes #TASK-001`
- `fixes TASK-002`
- `resolves #TASK-003`
- `completes TASK-004`

## Design-Assistant Integration

Generate Spec-Kit artifacts from design sessions:

\`\`\`typescript
const result = await designAssistant({
  action: 'generate-artifacts',
  sessionId: 'my-session',
  artifactTypes: ['speckit'],
});
\`\`\`

This converts design session data into full Spec-Kit artifacts.
```

**Create `docs/speckit/constitution-guide.md`:**
```markdown
# Constitution Guide

A CONSTITUTION.md file defines project principles and constraints that specs
must comply with.

## Structure

\`\`\`markdown
# CONSTITUTION.md

## Principles
Core values that guide all decisions.

- **P1**: Short name - Description
- **P2**: Short name - Description

## Constraints
Hard requirements that must not be violated.

- **C1**: Short name - Description
- **C2**: Short name - Description

## Architecture Rules
Technical architecture constraints.

- **AR1**: Short name - Description
- **AR2**: Short name - Description

## Design Principles
Design-level guidelines.

- **DP1**: Short name - Description
- **DP2**: Short name - Description
\`\`\`

## ID Patterns

| Pattern | Type | Example |
|---------|------|---------|
| P1, P2, ... | Principle | P1: Type Safety |
| C1, C2, ... | Constraint | C1: No External Dependencies |
| AR1, AR2, ... | Architecture Rule | AR1: Functional Patterns |
| DP1, DP2, ... | Design Principle | DP1: Single Responsibility |

## Validation Behavior

- **Principles**: Advisory - generate warnings if not addressed
- **Constraints**: Required - generate errors if violated
- **Architecture Rules**: Required - generate errors if violated
- **Design Principles**: Advisory - generate warnings if not followed

## Example Constitution

See [CONSTITUTION.md](../../plan-v0.13.x/CONSTITUTION.md) for a real example.
```

## Acceptance Criteria

- [ ] `docs/speckit/README.md` - Overview and quick start
- [ ] `docs/speckit/usage.md` - Detailed usage guide
- [ ] `docs/speckit/constitution-guide.md` - Constitution format guide
- [ ] README.md updated with Spec-Kit section
- [ ] Code examples are accurate and working

## Files to Create

- `docs/speckit/README.md`
- `docs/speckit/usage.md`
- `docs/speckit/constitution-guide.md`

## Files to Modify

- `README.md` (add Spec-Kit section)

## Verification

- [ ] All code examples run successfully
- [ ] Links are valid
- [ ] Documentation is complete and clear

## Definition of Done

1. ✅ All documentation files created
2. ✅ README.md updated
3. ✅ Code examples verified
4. ✅ Review passed

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-022)*
