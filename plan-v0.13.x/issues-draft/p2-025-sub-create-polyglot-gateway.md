# 🔧 P2-025: Create PolyglotGateway Orchestrator [serial]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-critical`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 6 hours
> **Depends On**: P2-012, P2-016, P2-017, P2-018, P2-019, P2-020, P2-021, P2-022, P2-023, P2-024
> **Blocks**: P2-026, P2-027

## Context

The PolyglotGateway is the central orchestrator that ties together domain services, output strategies, and cross-cutting capabilities. This is the core of the refactored architecture.

## Task Description

Create PolyglotGateway:

**Create `src/gateway/polyglot-gateway.ts`:**
```typescript
import type { OutputApproach, OutputArtifacts, RenderOptions, CrossCuttingCapability } from '../strategies/output-strategy.js';
import { ChatStrategy } from '../strategies/chat-strategy.js';
import { RFCStrategy } from '../strategies/rfc-strategy.js';
import { ADRStrategy } from '../strategies/adr-strategy.js';
import { SDDStrategy } from '../strategies/sdd-strategy.js';
import { SpecKitStrategy } from '../strategies/speckit-strategy.js';
import { TOGAFStrategy } from '../strategies/togaf-strategy.js';
import { EnterpriseStrategy } from '../strategies/enterprise-strategy.js';
import { crossCuttingManager } from '../strategies/cross-cutting/manager.js';

export interface GatewayRequest {
  domainResult: unknown;
  domainType: string;
  approach?: OutputApproach;
  crossCutting?: CrossCuttingCapability[];
  options?: Partial<RenderOptions>;
}

export class PolyglotGateway {
  private strategies: Map<OutputApproach, OutputStrategy<any>>;

  constructor() {
    this.strategies = new Map([
      [OutputApproach.CHAT, new ChatStrategy()],
      [OutputApproach.RFC, new RFCStrategy()],
      [OutputApproach.ADR, new ADRStrategy()],
      [OutputApproach.SDD, new SDDStrategy()],
      [OutputApproach.SPECKIT, new SpecKitStrategy()],
      [OutputApproach.TOGAF, new TOGAFStrategy()],
      [OutputApproach.ENTERPRISE, new EnterpriseStrategy()],
    ]);
  }

  render(request: GatewayRequest): OutputArtifacts {
    const approach = request.approach ?? OutputApproach.CHAT;
    const strategy = this.strategies.get(approach);

    if (!strategy) {
      throw new Error(`Unknown output approach: ${approach}`);
    }

    if (!strategy.supports(request.domainType)) {
      throw new Error(`Strategy ${approach} does not support ${request.domainType}`);
    }

    // Render primary and secondary documents
    const artifacts = strategy.render(request.domainResult, request.options);

    // Add cross-cutting artifacts if requested
    if (request.crossCutting?.length) {
      artifacts.crossCutting = crossCuttingManager.generateArtifacts(
        {
          domainResult: request.domainResult,
          primaryDocument: artifacts.primary.content,
        },
        request.crossCutting
      );
    }

    return artifacts;
  }

  getSupportedApproaches(domainType: string): OutputApproach[] {
    return Array.from(this.strategies.entries())
      .filter(([_, strategy]) => strategy.supports(domainType))
      .map(([approach, _]) => approach);
  }

  getSupportedCrossCutting(domainType: string): CrossCuttingCapability[] {
    return crossCuttingManager.getSupportedCapabilities(domainType);
  }
}

// Singleton instance
export const polyglotGateway = new PolyglotGateway();
```

**Create `src/gateway/index.ts`:**
```typescript
export * from './polyglot-gateway.js';
```

## Acceptance Criteria

- [ ] `src/gateway/polyglot-gateway.ts` created
- [ ] All 7 strategies registered
- [ ] `render()` method orchestrates strategy + cross-cutting
- [ ] `getSupportedApproaches()` returns valid strategies
- [ ] `getSupportedCrossCutting()` returns capabilities
- [ ] Singleton export
- [ ] Integration tests

## Files to Create

- `src/gateway/polyglot-gateway.ts`
- `src/gateway/index.ts`
- `tests/vitest/gateway/polyglot-gateway.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- polyglot-gateway
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §6
- [ARCHITECTURE.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/ARCHITECTURE.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-025
