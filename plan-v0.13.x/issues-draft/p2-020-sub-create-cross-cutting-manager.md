# 🔧 P2-020: Create CrossCuttingManager [serial]

> **Parent**: #696
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 4 hours
> **Depends On**: P2-015
> **Blocks**: P2-023, P2-024, P2-025

## Context

Cross-cutting capabilities (workflows, diagrams, shell scripts, etc.) can be added to any output strategy. The CrossCuttingManager provides a plugin architecture for these capabilities.

## Task Description

Create CrossCuttingManager:

**Create `src/strategies/cross-cutting/types.ts`:**
```typescript
import type { CrossCuttingCapability, CrossCuttingArtifact } from '../output-strategy.js';

export interface CapabilityContext {
  domainResult: unknown;
  primaryDocument: string;
  metadata?: Record<string, unknown>;
}

export interface CapabilityHandler {
  readonly capability: CrossCuttingCapability;
  generate(context: CapabilityContext): CrossCuttingArtifact | null;
  supports(domainType: string): boolean;
}
```

**Create `src/strategies/cross-cutting/manager.ts`:**
```typescript
import type { CrossCuttingCapability, CrossCuttingArtifact } from '../output-strategy.js';
import type { CapabilityHandler, CapabilityContext } from './types.js';

export class CrossCuttingManager {
  private handlers: Map<CrossCuttingCapability, CapabilityHandler> = new Map();

  registerHandler(handler: CapabilityHandler): void {
    this.handlers.set(handler.capability, handler);
  }

  generateArtifacts(
    context: CapabilityContext,
    capabilities: CrossCuttingCapability[]
  ): CrossCuttingArtifact[] {
    const artifacts: CrossCuttingArtifact[] = [];

    for (const capability of capabilities) {
      const handler = this.handlers.get(capability);
      if (handler) {
        const artifact = handler.generate(context);
        if (artifact) {
          artifacts.push(artifact);
        }
      }
    }

    return artifacts;
  }

  getSupportedCapabilities(domainType: string): CrossCuttingCapability[] {
    return Array.from(this.handlers.values())
      .filter(h => h.supports(domainType))
      .map(h => h.capability);
  }
}

// Singleton instance
export const crossCuttingManager = new CrossCuttingManager();
```

## Acceptance Criteria

- [ ] `src/strategies/cross-cutting/types.ts` with interfaces
- [ ] `src/strategies/cross-cutting/manager.ts` with CrossCuttingManager
- [ ] Plugin architecture (registerHandler)
- [ ] `generateArtifacts()` method
- [ ] Singleton export
- [ ] Unit tests

## Files to Create

- `src/strategies/cross-cutting/types.ts`
- `src/strategies/cross-cutting/manager.ts`
- `src/strategies/cross-cutting/index.ts`
- `tests/vitest/strategies/cross-cutting/manager.spec.ts`

## Files to Modify

- `src/strategies/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- cross-cutting
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §5
- [ADR-005: Cross-Cutting Capabilities](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/adrs/ADR-005-cross-cutting-capabilities.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-020
