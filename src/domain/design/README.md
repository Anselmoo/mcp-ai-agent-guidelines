# Design Session Domain Logic

This directory contains pure domain logic for design session management and phase workflows, extracted from the tool layer as part of [Issue #696 - Phase 2: Domain Extraction](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/696).

## Architecture

```
┌─────────────────────────────────────────┐
│ Tool Layer (src/tools/design/)          │
│ - design-assistant.ts                   │
│ - design-phase-workflow.ts              │
│ - Orchestrates MCP-specific features    │
│ - Methodology profiles, confirmations   │
└──────────────┬──────────────────────────┘
               │ delegates to
               ▼
┌─────────────────────────────────────────┐
│ Domain Layer (src/domain/design/)       │
│ - session-manager.ts (CRUD operations)  │
│ - phase-workflow.ts (transitions)       │
│ - Pure functions, no side effects       │
└─────────────────────────────────────────┘
```

## Files

### `session-manager.ts`

Pure session lifecycle management:

- `createSession()` - Initialize new design session
- `getSession()` - Retrieve session by ID
- `updateSessionPhase()` - Transition to new phase
- `updateSessionContext()` - Merge context updates
- `deleteSession()` - Remove session
- `listSessions()` - Get all session IDs
- `getCurrentPhase()` - Get current phase
- `getSessionHistory()` - Get transition history

**Coverage**: 100% (33 tests)

### `phase-workflow.ts`

Pure phase transition logic:

- `canTransition()` - Validate phase transitions
- `getNextPhase()` / `getPreviousPhase()` - Navigate workflow
- `validatePhaseCompletion()` - Check required outputs
- `getPhaseRequirements()` - Get phase requirements
- `getPhaseOrder()` - Get phase sequence
- `getPhaseProgress()` - Calculate completion percentage
- `getPhaseDependencies()` - Get prerequisite phases

**Coverage**: 100% (45 tests)

### `types.ts`

Shared domain types:

- `PhaseId` - Phase identifier union type
- `SessionContext` - Flexible session context
- `PhaseTransition` - Phase change record
- `SessionConfig` - Session configuration
- `SessionState` - Complete session state

## Design Principles

All domain functions follow strict principles:

1. **Pure Functions**: No side effects, deterministic
2. **No Framework Dependencies**: No MCP SDK, Express, etc.
3. **Explicit Types**: Full TypeScript strict mode
4. **Error Handling**: Clear error messages with context
5. **100% Test Coverage**: Comprehensive test suites

## Usage Examples

### Session Management

```typescript
import {
  createSession,
  updateSessionPhase,
  getSession
} from '@/domain/design/session-manager';

// Create new session
const session = createSession('session-1', {
  goal: 'Build authentication system',
  requirements: ['OAuth', 'JWT']
});

// Transition phases
updateSessionPhase('session-1', 'requirements', 'Discovery complete');

// Retrieve session
const current = getSession('session-1');
console.log(current.phase); // 'requirements'
```

### Phase Workflow

```typescript
import {
  canTransition,
  getNextPhase,
  validatePhaseCompletion
} from '@/domain/design/phase-workflow';

// Check valid transition
if (canTransition('discovery', 'requirements')) {
  const next = getNextPhase('discovery');
  // Proceed with transition
}

// Validate phase completion
const result = validatePhaseCompletion('discovery', {
  problem_statement: 'Need auth',
  stakeholders: ['users'],
  context: 'E-commerce'
});

if (result.valid) {
  // Phase is complete
} else {
  console.log('Missing:', result.missing);
}
```

## Tool Layer Integration

The tool layer (`src/tools/design/design-phase-workflow.ts`) now imports domain functions:

```typescript
import {
  getNextPhase as domainGetNextPhase,
  canTransition as domainCanTransition,
} from '../../domain/design/index.js';
```

This demonstrates the pattern while maintaining backward compatibility. Future refactoring can migrate more logic to the domain layer.

## Testing

Run domain tests:

```bash
# All domain design tests
npm run test:vitest -- domain/design

# Specific test files
npm run test:vitest -- domain/design/session-manager.spec.ts
npm run test:vitest -- domain/design/phase-workflow.spec.ts
```

Test coverage:

```bash
npm run test:coverage:vitest -- domain/design
```

## Migration Notes

### What Was Extracted

- ✅ Session CRUD operations → `session-manager.ts`
- ✅ Phase transition validation → `phase-workflow.ts`
- ✅ Phase sequence and dependencies → `phase-workflow.ts`
- ✅ Phase completion validation → `phase-workflow.ts`

### What Remains in Tool Layer

The tool layer still handles:

- Methodology profile integration
- Confirmation module orchestration
- Pivot evaluation
- Constraint management
- Artifact generation
- Coverage enforcement
- Event history with rich metadata

These are MCP-specific concerns that layer on top of domain logic.

## Related Issues

- [#696 - Phase 2: Domain Extraction](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/696)
- [P2-012 - Extract Design Session Domain Logic](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/P2-012)

## References

- [Domain Layer Instructions](.github/instructions/domain-layer.instructions.md)
- [SPEC-001: Output Strategy Layer](plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md)
- [TASKS Phase 2](plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md)
