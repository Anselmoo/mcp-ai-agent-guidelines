# 🔧 P4-011: Integrate Spec-Kit with Design-Assistant [serial]

> **Parent**: #TBD
> **Labels**: `phase-4a`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M5: Spec-Kit Core
> **Estimate**: 4 hours
> **Depends On**: P4-009
> **Blocks**: P4-020

## Context

Design-assistant should support Spec-Kit as an artifact type, allowing users to generate spec.md, plan.md, tasks.md, and progress.md directly from design sessions.

## Task Description

Add 'speckit' to design-assistant artifact types:

**Update `src/tools/design/design-assistant.ts`:**
```typescript
// Extend ArtifactType union
export type ArtifactType = 'adr' | 'specification' | 'roadmap' | 'speckit';

// Add to generateArtifacts switch/case
case 'speckit':
  return generateSpecKitArtifacts(session);
```

**Update `src/tools/design/services/artifact-generation-service.ts`:**
```typescript
import { polyglotGateway } from '../../../gateway/polyglot-gateway.js';
import { OutputApproach } from '../../../strategies/output-strategy.js';

export function generateSpecKitArtifacts(session: DesignSession): ArtifactResponse {
  const domainResult = convertSessionToDomainResult(session);

  const artifacts = polyglotGateway.render({
    domainResult,
    domainType: 'SessionState',
    approach: OutputApproach.SPECKIT,
  });

  return {
    type: 'speckit',
    artifacts: [artifacts.primary, ...(artifacts.secondary ?? [])],
  };
}

function convertSessionToDomainResult(session: DesignSession) {
  return {
    metadata: { title: session.config.goal },
    context: {
      overview: session.context,
      objectives: session.requirements.map(r => ({ description: r })),
      requirements: session.requirements.map(r => ({
        description: r,
        type: 'functional'
      })),
      acceptanceCriteria: [],
      outOfScope: [],
    },
    phase: session.currentPhase,
  };
}
```

## Acceptance Criteria

- [ ] 'speckit' added to ArtifactType union in design-assistant
- [ ] `generateSpecKitArtifacts()` function implemented
- [ ] Session data correctly maps to Spec-Kit format
- [ ] design-assistant can generate spec.md, plan.md, tasks.md, progress.md
- [ ] Integration test passes

## Files to Modify

- `src/tools/design/design-assistant.ts`
- `src/tools/design/services/artifact-generation-service.ts`

## Files to Create

- `tests/vitest/tools/design/speckit-integration.spec.ts`

## Technical Notes

- Reuse existing PolyglotGateway for rendering
- Session-to-DomainResult conversion should be straightforward mapping
- Consider adding validation for session completeness before generation

## Verification Commands

```bash
npm run test:vitest -- --grep "speckit.*integration"
npm run build
```

## Definition of Done

1. ✅ Code changes merged
2. ✅ Unit tests pass
3. ✅ Integration test with design-assistant
4. ✅ design-assistant 'generate-artifacts' action supports 'speckit'

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-011)*
