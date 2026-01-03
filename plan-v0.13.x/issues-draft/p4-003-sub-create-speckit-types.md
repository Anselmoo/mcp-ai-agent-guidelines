# 🔧 P4-003: Create Spec-Kit Types [parallel]

> **Parent**: #698
> **Labels**: `phase-4a`, `priority-high`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M5: Spec-Kit Core
> **Estimate**: 2 hours
> **Depends On**: None
> **Blocks**: P4-004

## Context

TypeScript types for all Spec-Kit artifacts enable type-safe generation and validation.

## Task Description

Define TypeScript types for Spec-Kit artifacts:

**Create/Expand `src/strategies/speckit/types.ts`:**
```typescript
// Constitution types
export interface Constitution {
  principles: Principle[];
  constraints: Constraint[];
  architectureRules: ArchitectureRule[];
  designPrinciples: DesignPrinciple[];
  metadata?: ConstitutionMetadata;
}

export interface Principle {
  id: string;
  title: string;
  description: string;
  type: 'principle';
}

export interface Constraint {
  id: string;
  title: string;
  description: string;
  severity: 'must' | 'should' | 'may';
  type: 'constraint';
}

export interface ArchitectureRule {
  id: string;
  title: string;
  description: string;
  type: 'architecture-rule';
}

export interface DesignPrinciple {
  id: string;
  title: string;
  description: string;
  type: 'design-principle';
}

export interface ConstitutionMetadata {
  title?: string;
  version?: string;
  lastUpdated?: string;
}

// Spec types
export interface ParsedSpec {
  title: string;
  overview: string;
  objectives: Objective[];
  functionalRequirements: Requirement[];
  nonFunctionalRequirements: Requirement[];
  constraints: ConstraintReference[];
  acceptanceCriteria: AcceptanceCriterion[];
  outOfScope: string[];
}

export interface Objective {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Requirement {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  derivedTasks?: DerivedTask[];
}

export interface ConstraintReference {
  constitutionId: string;
  type: 'principle' | 'constraint' | 'architecture-rule' | 'design-principle';
  notes?: string;
}

export interface AcceptanceCriterion {
  id: string;
  description: string;
  verificationMethod: 'automated' | 'manual' | 'review';
}

// Plan types
export interface Plan {
  approach: string;
  phases: Phase[];
  dependencies: Dependency[];
  risks: Risk[];
  timeline: TimelineEntry[];
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  deliverables: string[];
  duration: string;
}

export interface Dependency {
  id: string;
  description: string;
  owner?: string;
}

export interface Risk {
  id: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface TimelineEntry {
  phase: string;
  startWeek: number;
  endWeek: number;
}

// Task types
export interface DerivedTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimate: string;
  phase?: string;
  acceptanceCriteria: string[];
  dependencies?: string[];
}

// Progress types
export interface Progress {
  status: 'on-track' | 'at-risk' | 'blocked' | 'completed';
  completionPercentage: number;
  tasksCompleted: number;
  totalTasks: number;
  recentUpdates: ProgressUpdate[];
  blockers: Blocker[];
  nextSteps: string[];
  lastUpdated: Date;
}

export interface ProgressUpdate {
  date: Date;
  description: string;
  tasksCompleted: string[];
}

export interface Blocker {
  id: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  owner?: string;
}

// Aggregate type
export interface SpecKitArtifacts {
  spec: ParsedSpec;
  plan: Plan;
  tasks: DerivedTask[];
  progress: Progress;
  constitution?: Constitution;
}
```

## Acceptance Criteria

- [ ] File: `src/strategies/speckit/types.ts`
- [ ] Constitution types defined
- [ ] Spec types defined
- [ ] Plan types defined
- [ ] Task types defined
- [ ] Progress types defined
- [ ] SpecKitArtifacts aggregate type
- [ ] JSDoc documentation

## Files to Create

- `src/strategies/speckit/types.ts`

## Verification

```bash
npm run build
```

## References

- [SPEC-005: Spec-Kit Integration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-005-speckit-integration.md)
- [TASKS Phase 4](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-4-speckit-integration.md) P4-003
