# 🔧 P4-009: Wire SpecKitStrategy to Gateway [serial]

> **Parent**: [004-parent-phase4-speckit.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/004-parent-phase4-speckit.md)
> **Labels**: `phase-4a`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M5: Spec-Kit Core
> **Estimate**: 2 hours
> **Depends On**: P4-008
> **Blocks**: P4-010, P4-011, P4-012

## Context

The SpecKitStrategy needs to be registered with the PolyglotGateway for the 'speckit' approach to be available.

## Task Description

Register SpecKitStrategy with PolyglotGateway:

**Modify `src/gateway/polyglot-gateway.ts`:**
```typescript
import { SpecKitStrategy } from '../strategies/speckit-strategy.js';

export class PolyglotGateway {
  private strategies: Map<OutputApproach, OutputStrategy<any>>;

  constructor() {
    this.strategies = new Map([
      [OutputApproach.CHAT, new ChatStrategy()],
      [OutputApproach.RFC, new RFCStrategy()],
      [OutputApproach.ADR, new ADRStrategy()],
      [OutputApproach.SDD, new SDDStrategy()],
      [OutputApproach.SPECKIT, new SpecKitStrategy()], // Add this
      [OutputApproach.TOGAF, new TOGAFStrategy()],
      [OutputApproach.ENTERPRISE, new EnterpriseStrategy()],
    ]);
  }

  // ... rest of implementation
}
```

**Update `src/strategies/index.ts`:**
```typescript
export * from './output-strategy.js';
export * from './chat-strategy.js';
export * from './rfc-strategy.js';
export * from './adr-strategy.js';
export * from './sdd-strategy.js';
export * from './speckit-strategy.js'; // Add this
export * from './togaf-strategy.js';
export * from './enterprise-strategy.js';
export * from './cross-cutting/index.js';
```

## Acceptance Criteria

- [ ] SpecKitStrategy imported in gateway
- [ ] Strategy registered with OutputApproach.SPECKIT
- [ ] 'speckit' approach selectable via gateway
- [ ] Export from strategies barrel
- [ ] Integration test

## Files to Modify

- `src/gateway/polyglot-gateway.ts`
- `src/strategies/index.ts`

## Files to Create

- `tests/vitest/gateway/speckit-integration.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- speckit-integration
```

## References

- [SPEC-005: Spec-Kit Integration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-005-speckit-integration.md)
- [TASKS Phase 4](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-4-speckit-integration.md) P4-009
