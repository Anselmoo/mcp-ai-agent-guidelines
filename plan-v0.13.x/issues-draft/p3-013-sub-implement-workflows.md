# 🔧 P3-013: Implement Pre-defined Workflows [serial]

> **Parent**: [003-parent-phase3-broken-tools.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/003-parent-phase3-broken-tools.md)
> **Labels**: `phase-3`, `priority-medium`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 4 hours
> **Depends On**: P3-011, P3-012
> **Blocks**: P3-014

## Context

Pre-defined workflows enable common multi-agent patterns like code review chains and design-to-spec workflows.

## Task Description

Create pre-defined multi-agent workflows:

**Create `src/agents/workflows/code-review-chain.ts`:**
```typescript
import type { Workflow } from '../orchestrator.js';

/**
 * Code Review Chain Workflow
 *
 * Flow: code-scorer → security-analyzer → documentation-generator
 *
 * Use case: Complete code review with quality score, security check,
 * and documentation suggestions.
 */
export const codeReviewChainWorkflow: Workflow = {
  name: 'code-review-chain',
  description: 'Complete code review: quality scoring → security analysis → documentation',
  steps: [
    {
      agent: 'code-scorer',
      // Input: { projectPath, coverageMetrics }
    },
    {
      agent: 'security-analyzer',
      inputMapping: {
        codeContext: '_initial.codeContext',
        // Carry forward code context from initial input
      },
    },
    {
      agent: 'documentation-generator',
      inputMapping: {
        projectPath: '_initial.projectPath',
        analysisResults: 'code-scorer',
        securityResults: 'security-analyzer',
      },
    },
  ],
};
```

**Create `src/agents/workflows/design-to-spec.ts`:**
```typescript
import type { Workflow } from '../orchestrator.js';

/**
 * Design to Spec Workflow
 *
 * Flow: design-assistant (start) → design-assistant (advance) → design-assistant (generate)
 *
 * Use case: Full design session from discovery to specification generation.
 */
export const designToSpecWorkflow: Workflow = {
  name: 'design-to-spec',
  description: 'Complete design workflow from discovery to specification',
  steps: [
    {
      agent: 'design-assistant',
      // Start session
      inputMapping: {
        action: { value: 'start-session' },
        sessionId: '_initial.sessionId',
        config: '_initial.config',
      },
    },
    {
      agent: 'design-assistant',
      // Advance to requirements
      inputMapping: {
        action: { value: 'advance-phase' },
        sessionId: '_initial.sessionId',
        phaseId: { value: 'requirements' },
      },
    },
    {
      agent: 'design-assistant',
      // Generate artifacts
      inputMapping: {
        action: { value: 'generate-artifacts' },
        sessionId: '_initial.sessionId',
        artifactTypes: { value: ['specification', 'adr'] },
      },
    },
  ],
};
```

**Create `src/agents/workflows/index.ts`:**
```typescript
import { codeReviewChainWorkflow } from './code-review-chain.js';
import { designToSpecWorkflow } from './design-to-spec.js';
import type { Workflow } from '../orchestrator.js';

export const workflows: Map<string, Workflow> = new Map([
  ['code-review-chain', codeReviewChainWorkflow],
  ['design-to-spec', designToSpecWorkflow],
]);

export function getWorkflow(name: string): Workflow | undefined {
  return workflows.get(name);
}

export function listWorkflows(): string[] {
  return Array.from(workflows.keys());
}

export { codeReviewChainWorkflow, designToSpecWorkflow };
```

## Acceptance Criteria

- [ ] File: `src/agents/workflows/code-review-chain.ts`
- [ ] File: `src/agents/workflows/design-to-spec.ts`
- [ ] File: `src/agents/workflows/index.ts`
- [ ] 2+ workflow definitions
- [ ] Workflows executable via orchestrator
- [ ] Integration tests

## Files to Create

- `src/agents/workflows/code-review-chain.ts`
- `src/agents/workflows/design-to-spec.ts`
- `src/agents/workflows/index.ts`
- `tests/vitest/agents/workflows/code-review-chain.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- workflows
```

## References

- [SPEC-004: Agent Orchestration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-004-agent-orchestration.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-013
