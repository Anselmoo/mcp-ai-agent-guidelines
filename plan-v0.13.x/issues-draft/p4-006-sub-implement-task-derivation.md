# 🔧 P4-006: Implement Task Derivation [serial]

> **Parent**: #TBD
> **Labels**: `phase-4a`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M5: Spec-Kit Core
> **Estimate**: 4 hours
> **Depends On**: P4-004
> **Blocks**: P4-007

## Context

Automatic task derivation transforms requirements into actionable tasks with estimates and priorities.

## Task Description

Implement automatic task derivation from spec:

**Add to `src/strategies/speckit-strategy.ts`:**
```typescript
private deriveTasksFromSpec(spec: ParsedSpec): DerivedTask[] {
  const tasks: DerivedTask[] = [];
  let taskCounter = 1;

  // Derive tasks from functional requirements
  for (const req of spec.functionalRequirements) {
    const task = this.deriveTaskFromRequirement(req, taskCounter++);
    tasks.push(task);

    // Add verification task for each requirement
    const verifyTask = this.deriveVerificationTask(req, taskCounter++);
    tasks.push(verifyTask);
  }

  // Derive tasks from acceptance criteria
  for (const ac of spec.acceptanceCriteria) {
    const task = this.deriveTaskFromAcceptanceCriterion(ac, taskCounter++);
    tasks.push(task);
  }

  return tasks;
}

private deriveTaskFromRequirement(req: Requirement, id: number): DerivedTask {
  // Estimate based on complexity keywords
  const estimate = this.estimateFromDescription(req.description);

  return {
    id: `T${String(id).padStart(3, '0')}`,
    title: `Implement: ${this.extractTitle(req.description)}`,
    description: `Implement functionality to satisfy requirement ${req.id}.\n\n**Requirement**: ${req.description}`,
    priority: req.priority,
    estimate,
    acceptanceCriteria: [
      `Requirement ${req.id} is satisfied`,
      'Unit tests pass',
      'Code review approved',
    ],
  };
}

private deriveVerificationTask(req: Requirement, id: number): DerivedTask {
  return {
    id: `T${String(id).padStart(3, '0')}`,
    title: `Verify: ${this.extractTitle(req.description)}`,
    description: `Write tests to verify requirement ${req.id} is correctly implemented.`,
    priority: req.priority,
    estimate: '2h',
    acceptanceCriteria: [
      'Tests cover happy path',
      'Tests cover edge cases',
      'Tests cover error conditions',
    ],
    dependencies: [`T${String(id - 1).padStart(3, '0')}`],
  };
}

private deriveTaskFromAcceptanceCriterion(ac: AcceptanceCriterion, id: number): DerivedTask {
  return {
    id: `T${String(id).padStart(3, '0')}`,
    title: `Validate: ${this.extractTitle(ac.description)}`,
    description: `Verify acceptance criterion ${ac.id} is met.`,
    priority: 'high',
    estimate: ac.verificationMethod === 'automated' ? '1h' : '2h',
    acceptanceCriteria: [
      `${ac.description} is verified`,
      `Verification method: ${ac.verificationMethod}`,
    ],
  };
}

private estimateFromDescription(description: string): string {
  const lowercased = description.toLowerCase();

  if (lowercased.includes('simple') || lowercased.includes('basic')) {
    return '2h';
  } else if (lowercased.includes('complex') || lowercased.includes('comprehensive')) {
    return '8h';
  } else if (lowercased.includes('integration') || lowercased.includes('refactor')) {
    return '4h';
  }

  return '3h'; // Default estimate
}

private extractTitle(description: string): string {
  // Extract first sentence or first N words as title
  const firstSentence = description.split('.')[0];
  return firstSentence.slice(0, 50) + (firstSentence.length > 50 ? '...' : '');
}
```

## Acceptance Criteria

- [ ] `deriveTasksFromSpec()` implemented
- [ ] Tasks derived from functional requirements
- [ ] Verification tasks created for each requirement
- [ ] Tasks derived from acceptance criteria
- [ ] Tasks include: id, title, description, priority, estimate
- [ ] Acceptance criteria per task
- [ ] Dependencies tracked
- [ ] Unit tests

## Files to Modify

- `src/strategies/speckit-strategy.ts`
- `tests/vitest/strategies/speckit-strategy.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- speckit-strategy
```

## References

- [SPEC-005: Spec-Kit Integration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-005-speckit-integration.md)
- [TASKS Phase 4](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-4-speckit-integration.md) P4-006
