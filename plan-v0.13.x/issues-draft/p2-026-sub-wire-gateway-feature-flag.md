# 🔧 P2-026: Wire Gateway with Feature Flag [serial]

> **Parent**: #TBD
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 3 hours
> **Depends On**: P2-025

## Context

Feature flags allow gradual rollout of the new output strategies without breaking existing behavior. This task wires the PolyglotGateway into tools with a feature flag.

## Task Description

Add feature flag and wire gateway:

**Create `src/config/feature-flags.ts`:**
```typescript
export interface FeatureFlags {
  usePolyglotGateway: boolean;
  enableSpecKitOutput: boolean;
  enableEnterpriseOutput: boolean;
  enableCrossCuttingCapabilities: boolean;
}

const defaultFlags: FeatureFlags = {
  usePolyglotGateway: false, // Start disabled
  enableSpecKitOutput: false,
  enableEnterpriseOutput: false,
  enableCrossCuttingCapabilities: false,
};

// Allow override from environment
export function getFeatureFlags(): FeatureFlags {
  return {
    usePolyglotGateway: process.env.MCP_USE_POLYGLOT_GATEWAY === 'true',
    enableSpecKitOutput: process.env.MCP_ENABLE_SPECKIT === 'true',
    enableEnterpriseOutput: process.env.MCP_ENABLE_ENTERPRISE === 'true',
    enableCrossCuttingCapabilities: process.env.MCP_ENABLE_CROSS_CUTTING === 'true',
  };
}
```

**Modify `src/tools/design/design-assistant.ts`:**
```typescript
import { getFeatureFlags } from '../../config/feature-flags.js';
import { polyglotGateway } from '../../gateway/polyglot-gateway.js';

export async function designAssistant(request: DesignAssistantRequest) {
  // ... existing domain logic
  const domainResult = await processDesignRequest(request);

  const flags = getFeatureFlags();

  if (flags.usePolyglotGateway && request.outputFormat) {
    // Use new gateway
    const artifacts = polyglotGateway.render({
      domainResult,
      domainType: 'SessionState',
      approach: mapOutputFormat(request.outputFormat),
      crossCutting: request.crossCutting,
    });

    return formatMcpResponse(artifacts);
  }

  // Existing behavior (unchanged)
  return formatLegacyResponse(domainResult);
}
```

## Acceptance Criteria

- [ ] `src/config/feature-flags.ts` created
- [ ] Environment variable support
- [ ] design-assistant wired with conditional gateway usage
- [ ] `outputFormat` parameter added to request schema
- [ ] Legacy behavior preserved when flag is off
- [ ] Integration test with flag on/off

## Files to Create

- `src/config/feature-flags.ts`
- `tests/vitest/config/feature-flags.spec.ts`

## Files to Modify

- `src/tools/design/design-assistant.ts`
- `src/schemas/design-assistant-schema.ts`

## Verification

```bash
# Test with flag off (default)
npm run test:vitest -- design-assistant

# Test with flag on
MCP_USE_POLYGLOT_GATEWAY=true npm run test:vitest -- design-assistant
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §7
- [ADR-002: Feature Flag Migration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/adrs/ADR-002-feature-flag-migration.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-026
