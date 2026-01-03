# ADR-003: Strangler Fig Migration Strategy

## Status

**Proposed** — January 2026

## Context

The MCP AI Agent Guidelines v0.13.x refactoring involves significant architectural changes:

1. Extracting domain logic into `src/domain/` layer
2. Implementing OutputStrategy pattern in `src/strategies/`
3. Fixing 3 broken tools
4. Consolidating overlapping tools
5. Adding Spec-Kit integration

### Big-Bang Rewrite Risks

| Risk                            | Probability | Impact   |
| ------------------------------- | ----------- | -------- |
| Regression bugs                 | High        | Critical |
| Extended downtime               | Medium      | High     |
| Loss of institutional knowledge | Medium      | Medium   |
| Team burnout                    | Medium      | High     |
| Scope creep                     | High        | Medium   |

### Research: Strangler Fig Pattern

Martin Fowler's Strangler Fig Pattern offers an alternative:

> "They seed in the upper branches of a fig tree and gradually work their way down the tree until they root in the soil. Over many years they grow into fantastic and beautiful shapes, meanwhile strangling and killing the tree that was their host."

**Four Activities**:
1. **Understand Outcomes** — Focus on business value
2. **Break Into Parts** — Find seams for incremental replacement
3. **Deliver Parts** — Replace components one at a time
4. **Change Organization** — Adapt as system evolves

## Decision

We will use the **Strangler Fig Pattern** for all v0.13.x migrations:

### Migration Principles

1. **New code alongside old** — Never delete before replacement is proven
2. **Transitional architecture** — Temporary bridges between old and new
3. **Feature flags** — Control rollout of new implementations
4. **Incremental value** — Each phase delivers independently

### Identified Seams

```
┌─────────────────────────────────────────────────────────────────────┐
│                         IDENTIFIED SEAMS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐                                                │
│  │ Individual Tool │ ← Each tool file is a seam                     │
│  │     Files       │   Can be modified/migrated independently       │
│  └────────┬────────┘                                                │
│           │                                                          │
│  ┌────────▼────────┐                                                │
│  │ Shared Utilities│ ← prompt-utils.ts, prompt-sections.ts          │
│  │                 │   Extract domain logic, keep interface         │
│  └────────┬────────┘                                                │
│           │                                                          │
│  ┌────────▼────────┐                                                │
│  │ Output Rendering│ ← NEW SEAM: OutputStrategy layer               │
│  │                 │   Add alongside existing, gradually adopt      │
│  └────────┬────────┘                                                │
│           │                                                          │
│  ┌────────▼────────┐                                                │
│  │  Tool Configs   │ ← Annotation configs, schema definitions       │
│  │                 │   Update without changing tool logic           │
│  └─────────────────┘                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Migration Phases

#### Phase 1: Add OutputStrategy Layer (Transitional Architecture)

```typescript
// OLD: Tool returns formatted string directly
export function buildPrompt(input: Input): string {
  const result = processInput(input);
  return formatMarkdown(result);  // Output formatting in tool
}

// NEW: Add strategy layer alongside
export function buildPrompt(input: Input, strategy?: OutputStrategy): string {
  const result = processInput(input);

  // Transitional: Support both old and new
  if (strategy) {
    return strategy.render(result);  // New path
  }
  return formatMarkdown(result);     // Old path (backward compatible)
}
```

#### Phase 2: Extract Domain Logic

```typescript
// BEFORE: Logic mixed in tool file
// tools/prompt/hierarchical-prompt-builder.ts
export function buildHierarchicalPrompt(input: Input): string {
  // Business logic
  const hierarchy = calculateHierarchy(input);
  const sections = buildSections(hierarchy);
  // Output formatting
  return formatAsMarkdown(sections);
}

// AFTER: Domain extracted, tool is thin wrapper
// domain/prompting/hierarchical-builder.ts
export function buildHierarchicalPrompt(input: Input): PromptResult {
  const hierarchy = calculateHierarchy(input);
  const sections = buildSections(hierarchy);
  return { hierarchy, sections };  // Pure data
}

// tools/prompt/hierarchical-prompt-builder.ts (thin wrapper)
import { buildHierarchicalPrompt } from '../../domain/prompting/hierarchical-builder.js';

export function handleBuildPrompt(input: Input, strategy: OutputStrategy): string {
  const result = buildHierarchicalPrompt(input);
  return strategy.render(result);
}
```

#### Phase 3: Feature Flag Rollout

```typescript
// Feature flags for gradual rollout
const FEATURE_FLAGS = {
  USE_OUTPUT_STRATEGY: process.env.USE_OUTPUT_STRATEGY === 'true',
  USE_DOMAIN_LAYER: process.env.USE_DOMAIN_LAYER === 'true',
  USE_NEW_ERROR_HANDLING: process.env.USE_NEW_ERROR_HANDLING === 'true',
};

// In tool handler
export function handleRequest(input: Input): string {
  if (FEATURE_FLAGS.USE_OUTPUT_STRATEGY) {
    return newImplementation(input);
  }
  return legacyImplementation(input);
}
```

#### Phase 4: Deprecation and Removal

```typescript
// Mark old code as deprecated
/** @deprecated Use OutputStrategy.render() instead. Will be removed in v0.14.0 */
export function formatMarkdown(result: PromptResult): string {
  console.warn('formatMarkdown is deprecated. Use OutputStrategy.render() instead.');
  return legacyFormatMarkdown(result);
}
```

### Rollback Strategy

Each phase is independently rollbackable:

```
Phase N fails?
    ↓
1. Set feature flag to false
2. Users continue with Phase N-1 code
3. Debug and fix Phase N
4. Re-enable feature flag
5. Monitor
```

## Consequences

### Positive

1. **Reduced Risk**: Failures are contained to individual phases
2. **Early Value**: Each phase delivers value independently
3. **Learning**: Early phases inform later phases
4. **Flexibility**: Can adjust strategy based on feedback
5. **Rollback**: Any phase can be rolled back safely

### Negative

1. **Complexity**: Transitional code adds temporary complexity
2. **Maintenance**: Must maintain both old and new during migration
3. **Performance**: Feature flags add minor overhead
4. **Testing**: Need tests for both paths

### Neutral

1. **Timeline**: May take longer than big-bang but with less risk
2. **Documentation**: Must document which path is active

## Implementation Notes

### Transitional Architecture Guidelines

1. **Explicit Naming**: Name transitional code clearly
   ```typescript
   // Good
   function buildPromptLegacy(input: Input): string
   function buildPromptV2(input: Input, strategy: OutputStrategy): string

   // Bad
   function buildPrompt(input: Input): string
   function buildPrompt2(input: Input): string
   ```

2. **Plan for Removal**: Add removal date to transitional code
   ```typescript
   /**
    * @transitional Remove after v0.14.0 release
    * @removal-date 2026-06-01
    */
   ```

3. **Single Responsibility**: Each transitional adapter does one thing
   ```typescript
   // Adapter that bridges old interface to new
   function adaptLegacyToStrategy(legacy: LegacyOutput): StrategyResult {
     return { ...legacy, format: 'chat' };
   }
   ```

### Feature Flag Configuration

```typescript
// src/config/feature-flags.ts
export const FEATURE_FLAGS = {
  // Phase 1: Output Strategy
  OUTPUT_STRATEGY_ENABLED: true,

  // Phase 2: Domain Layer
  DOMAIN_LAYER_PROMPTING: true,
  DOMAIN_LAYER_ANALYSIS: false,
  DOMAIN_LAYER_DESIGN: false,

  // Phase 3: Broken Tool Fixes
  MODE_SWITCHER_V2: false,
  PROJECT_ONBOARDING_V2: false,
  AGENT_ORCHESTRATOR_V2: false,

  // Phase 4: Spec-Kit
  SPECKIT_INTEGRATION: false,
};
```

### Migration Checklist (Per Tool)

```markdown
## Migration Checklist: [Tool Name]

### Phase 1: Add Strategy Support
- [ ] Add optional OutputStrategy parameter
- [ ] Default to ChatStrategy for backward compatibility
- [ ] Add tests for strategy path

### Phase 2: Extract Domain
- [ ] Create domain function in src/domain/
- [ ] Move pure logic to domain function
- [ ] Tool becomes thin wrapper
- [ ] Add domain unit tests

### Phase 3: Enable Feature Flag
- [ ] Add feature flag for tool
- [ ] Test with flag on
- [ ] Test with flag off
- [ ] Enable in production

### Phase 4: Cleanup
- [ ] Remove legacy code
- [ ] Remove feature flag
- [ ] Update documentation
```

## Related ADRs

- ADR-001: Output Strategy Pattern (what we're migrating to)
- ADR-002: Tool Annotations Standard (tool changes during migration)

## References

- [Martin Fowler - Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Martin Fowler - Branch by Abstraction](https://martinfowler.com/bliki/BranchByAbstraction.html)
- [Feature Toggles](https://martinfowler.com/articles/feature-toggles.html)

---

*ADR-003 Created: January 2026*
*Status: Proposed*
