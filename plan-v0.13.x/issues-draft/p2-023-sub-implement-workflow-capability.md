# 🔧 P2-023: Implement Workflow Capability Handler [parallel]

> **Parent**: #TBD
> **Labels**: `phase-2`, `priority-medium`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 3 hours
> **Depends On**: P2-020
> **Blocks**: P2-025

## Context

The workflow capability generates GitHub Actions YAML files for CI/CD automation. This is a cross-cutting capability that can be added to any output strategy.

## Task Description

Implement WorkflowCapabilityHandler:

**Create `src/strategies/cross-cutting/workflow-handler.ts`:**
```typescript
import type { CapabilityHandler, CapabilityContext } from './types.js';
import type { CrossCuttingCapability, CrossCuttingArtifact } from '../output-strategy.js';

export class WorkflowCapabilityHandler implements CapabilityHandler {
  readonly capability = CrossCuttingCapability.WORKFLOW;

  generate(context: CapabilityContext): CrossCuttingArtifact | null {
    const { domainResult, metadata } = context;

    // Determine workflow type based on context
    const workflowType = this.detectWorkflowType(domainResult);

    const content = this.generateWorkflowYaml(workflowType, metadata);

    return {
      type: this.capability,
      name: `.github/workflows/${workflowType}.yml`,
      content,
    };
  }

  supports(domainType: string): boolean {
    return ['SessionState', 'PromptResult'].includes(domainType);
  }

  private detectWorkflowType(result: unknown): string {
    // Detect if this is about testing, deployment, etc.
    return 'ci';
  }

  private generateWorkflowYaml(type: string, metadata?: Record<string, unknown>): string {
    const templates = {
      ci: this.generateCIWorkflow(),
      deploy: this.generateDeployWorkflow(),
      test: this.generateTestWorkflow(),
      release: this.generateReleaseWorkflow(),
    };

    return templates[type] ?? templates.ci;
  }

  private generateCIWorkflow(): string {
    return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run quality
      - run: npm run test:all
`;
  }

  private generateDeployWorkflow(): string {
    // Deployment workflow
  }

  private generateTestWorkflow(): string {
    // Test workflow
  }

  private generateReleaseWorkflow(): string {
    // Release workflow
  }
}
```

## Acceptance Criteria

- [ ] File: `src/strategies/cross-cutting/workflow-handler.ts`
- [ ] Generates valid GitHub Actions YAML
- [ ] Multiple workflow templates (CI, deploy, test, release)
- [ ] Registered with CrossCuttingManager
- [ ] Unit tests

## Files to Create

- `src/strategies/cross-cutting/workflow-handler.ts`
- `tests/vitest/strategies/cross-cutting/workflow-handler.spec.ts`

## Files to Modify

- `src/strategies/cross-cutting/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- workflow-handler
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §5.1
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-023
