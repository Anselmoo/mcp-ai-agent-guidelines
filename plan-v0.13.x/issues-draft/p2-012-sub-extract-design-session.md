# 🔧 P2-012: Extract Design Session Domain Logic [serial]

> **Parent**: #696
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 8 hours
> **Depends On**: P2-005
> **Blocks**: P2-014, P2-025

## Context

The design-assistant is the most complex tool with session management, phase workflows, and artifact generation. This is the most important extraction as it demonstrates the full pattern.

## Task Description

Extract design session logic to domain layer:

**Create `src/domain/design/session-manager.ts`:**
```typescript
import type { SessionState, PhaseId, SessionContext } from './types.js';

const sessions = new Map<string, SessionState>();

export function createSession(
  id: string,
  context: SessionContext
): SessionState {
  const state: SessionState = {
    id,
    phase: 'discovery',
    context,
    history: [],
  };
  sessions.set(id, state);
  return state;
}

export function getSession(id: string): SessionState | undefined {
  return sessions.get(id);
}

export function updateSessionPhase(
  id: string,
  newPhase: PhaseId,
  content: string
): SessionState {
  const session = sessions.get(id);
  if (!session) throw new Error(`Session not found: ${id}`);

  session.history.push({
    from: session.phase,
    to: newPhase,
    timestamp: new Date(),
    content,
  });
  session.phase = newPhase;

  return session;
}
```

**Create `src/domain/design/phase-workflow.ts`:**
```typescript
import type { PhaseId } from './types.js';

const PHASE_ORDER: PhaseId[] = ['discovery', 'requirements', 'architecture', 'implementation'];

export function canTransition(current: PhaseId, target: PhaseId): boolean {
  const currentIndex = PHASE_ORDER.indexOf(current);
  const targetIndex = PHASE_ORDER.indexOf(target);

  // Can only advance to next phase or stay in current
  return targetIndex === currentIndex || targetIndex === currentIndex + 1;
}

export function getNextPhase(current: PhaseId): PhaseId | null {
  const currentIndex = PHASE_ORDER.indexOf(current);
  return currentIndex < PHASE_ORDER.length - 1
    ? PHASE_ORDER[currentIndex + 1]
    : null;
}

export function validatePhaseCompletion(
  phase: PhaseId,
  content: Record<string, unknown>
): { valid: boolean; missing: string[] } {
  const requirements = getPhaseRequirements(phase);
  const missing = requirements.filter(req => !content[req]);
  return { valid: missing.length === 0, missing };
}
```

## Acceptance Criteria

- [ ] `src/domain/design/session-manager.ts` with CRUD operations
- [ ] `src/domain/design/phase-workflow.ts` with transition logic
- [ ] Session state managed in domain (not tool)
- [ ] Phase transitions validated in domain
- [ ] Tool becomes orchestration layer
- [ ] All existing design-assistant tests pass

## Files to Create

- `src/domain/design/session-manager.ts`
- `src/domain/design/phase-workflow.ts`
- `tests/vitest/domain/design/session-manager.spec.ts`
- `tests/vitest/domain/design/phase-workflow.spec.ts`

## Files to Modify

- `src/tools/design/design-assistant.ts`
- `src/domain/design/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- design
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-012
