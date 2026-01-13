# Spec-Kit Usage Guide

## Table of Contents

1. [Generating Specifications](#generating-specifications)
2. [Validating Against Constitution](#validating-against-constitution)
3. [Tracking Progress](#tracking-progress)
4. [Design-Assistant Integration](#design-assistant-integration)

## Generating Specifications

### Using speckit-generator Tool

```typescript
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
```

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

```typescript
const result = await validateSpec({
  specContent: specMarkdown,
  constitutionPath: './CONSTITUTION.md',
  outputFormat: 'markdown',
  includeRecommendations: true,
});
```

### Validation Result

- **Score**: 0-100 compliance score
- **Issues**: Errors, warnings, and info items
- **Recommendations**: Suggested improvements

## Tracking Progress

### Using update-progress Tool

```typescript
const result = await updateProgress({
  progressPath: './progress.md',
  completedTaskIds: ['TASK-001', 'TASK-002'],
  syncFromGit: true,
  outputFormat: 'markdown',
});
```

### Git Integration

Enable automatic progress updates from commits:

```bash
git commit -m "closes TASK-001: Implement login endpoint"
```

Recognized patterns:
- `closes #TASK-001`
- `fixes TASK-002`
- `resolves #TASK-003`
- `completes TASK-004`

## Design-Assistant Integration

Generate Spec-Kit artifacts from design sessions:

```typescript
const result = await designAssistant({
  action: 'generate-artifacts',
  sessionId: 'my-session',
  artifactTypes: ['speckit'],
});
```

This converts design session data into full Spec-Kit artifacts.
