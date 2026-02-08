# T-045: Consolidate Remaining Frameworks (5)

**Task ID**: T-045
**Phase**: 3
**Priority**: P0
**Estimate**: 4h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-038

---

## 1. Overview

### What

Complete the 'Consolidate Remaining Frameworks (5)' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-045
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

From spec.md, 5 remaining framework categories need consolidation:
1. **Strategic Planning**: strategy-frameworks, gap-analysis, sprint-calculator
2. **Agent Orchestration**: agent-orchestrator, design-assistant
3. **Prompt Optimization**: memory-optimizer, hierarchy-selector
4. **Visualization**: mermaid-generator, spark-ui-cards
5. **Project Management**: speckit-generator, validate-spec

### Target State

Per ADR-005, consolidate remaining tools into 5 unified frameworks:

| #   | Framework           | Source Tools                         | Actions                         |
| --- | ------------------- | ------------------------------------ | ------------------------------- |
| 7   | Strategic Planning  | strategy-frameworks, gap-analysis    | `swot`, `gap`, `sprint`         |
| 8   | Agent Orchestration | agent-orchestrator, design-assistant | `orchestrate`, `design-session` |
| 9   | Prompt Optimization | memory-optimizer, hierarchy-selector | `optimize`, `select-level`      |
| 10  | Visualization       | mermaid-generator, spark-ui          | `diagram`, `ui-card`            |
| 11  | Project Management  | speckit-generator, validate-spec     | `generate`, `validate`          |

### Out of Scope

- Tool logic changes (structure consolidation only)
- New features beyond consolidation

## 3. Prerequisites

### Dependencies

- T-038: Framework Router implemented
- T-039 through T-044: First 6 frameworks consolidated

### Target Files

```
src/frameworks/
├── strategic-planning/
├── agent-orchestration/
├── prompt-optimization/
├── visualization/
└── project-management/
```

### Tooling

- Node.js 22.x
- Zod for schema validation

## 4. Implementation Guide

### Step 4.1: Strategic Planning Framework

**File**: `src/frameworks/strategic-planning/handler.ts`
```typescript
import { z } from 'zod';

export const strategicPlanningSchema = z.object({
  action: z.enum(['swot', 'gap', 'vrio', 'bsc', 'sprint']),
  context: z.string(),
  factors: z.array(z.string()).optional(),
  outputFormat: z.enum(['markdown', 'json']).default('markdown'),
});

const actionHandlers = {
  'swot': swotAnalysisAction,
  'gap': gapAnalysisAction,
  'vrio': vrioAction,
  'bsc': balancedScorecardAction,
  'sprint': sprintCalculatorAction,
};

export async function handleStrategicPlanning(input: unknown) {
  const validated = strategicPlanningSchema.parse(input);
  return actionHandlers[validated.action](validated);
}
```

### Step 4.2: Agent Orchestration Framework

**File**: `src/frameworks/agent-orchestration/handler.ts`
```typescript
export const agentOrchestrationSchema = z.object({
  action: z.enum(['orchestrate', 'design-session', 'handoff', 'list-agents']),
  sessionId: z.string().optional(),
  targetAgent: z.string().optional(),
  workflowName: z.string().optional(),
});

export async function handleAgentOrchestration(input: unknown) {
  const validated = agentOrchestrationSchema.parse(input);
  // Route to appropriate action
}
```

### Step 4.3: Prompt Optimization Framework

**File**: `src/frameworks/prompt-optimization/handler.ts`
```typescript
export const promptOptimizationSchema = z.object({
  action: z.enum(['optimize', 'select-level', 'evaluate']),
  contextContent: z.string().optional(),
  maxTokens: z.number().default(8000),
  taskDescription: z.string().optional(),
});

export async function handlePromptOptimization(input: unknown) {
  const validated = promptOptimizationSchema.parse(input);
  // Route to appropriate action
}
```

### Step 4.4: Visualization Framework

**File**: `src/frameworks/visualization/handler.ts`
```typescript
export const visualizationSchema = z.object({
  action: z.enum(['diagram', 'ui-card', 'dashboard']),
  diagramType: z.enum(['flowchart', 'sequence', 'class', 'state', 'er']).optional(),
  description: z.string(),
  theme: z.string().optional(),
});

export async function handleVisualization(input: unknown) {
  const validated = visualizationSchema.parse(input);
  // Route to appropriate action
}
```

### Step 4.5: Project Management Framework

**File**: `src/frameworks/project-management/handler.ts`
```typescript
export const projectManagementSchema = z.object({
  action: z.enum(['generate', 'validate', 'enforce-planning']),
  directory: z.string().default('.'),
  artifacts: z.array(z.enum(['spec', 'plan', 'tasks', 'progress'])).optional(),
});

export async function handleProjectManagement(input: unknown) {
  const validated = projectManagementSchema.parse(input);
  // Route to appropriate action
}
```

### Step 4.6: Register All in Framework Router

```typescript
// src/frameworks/registry.ts
frameworkRouter.register('strategic-planning', handleStrategicPlanning);
frameworkRouter.register('agent-orchestration', handleAgentOrchestration);
frameworkRouter.register('prompt-optimization', handlePromptOptimization);
frameworkRouter.register('visualization', handleVisualization);
frameworkRouter.register('project-management', handleProjectManagement);
```

## 5. Testing Strategy

- Add/update unit tests for new logic
- Cover error handling and edge cases
- Run `npm run quality` before finalizing

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                                 | Status | Verification |
| ----------------------------------------- | ------ | ------------ |
| Implementation completed per requirements | ⬜      | TBD          |
| Integration points wired and documented   | ⬜      | TBD          |
| Quality checks pass                       | ⬜      | TBD          |

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md)

---

*Task: T-045 | Phase: 3 | Priority: P0*
