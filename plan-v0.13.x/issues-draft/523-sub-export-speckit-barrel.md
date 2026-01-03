# 🔧 P4-023: Export All Spec-Kit from Barrel [serial]

> **Parent**: [004-parent-phase4-speckit.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/004-parent-phase4-speckit.md)
> **Labels**: `phase-4b`, `priority-low`, `serial`, `copilot-suitable`
> **Milestone**: M7: Spec-Kit Progress
> **Estimate**: 1 hour
> **Depends On**: P4-021
> **Blocks**: P4-024

## Context

Proper barrel file organization ensures clean import paths and discoverability of Spec-Kit exports for external consumers and internal usage.

## Task Description

Ensure all Spec-Kit exports are properly organized:

**Create/Update `src/strategies/speckit/index.ts`:**
```typescript
/**
 * Spec-Kit Module
 *
 * Exports for the Spec-Kit methodology implementation.
 *
 * @module strategies/speckit
 */

// Types
export type {
  Constitution,
  Principle,
  Constraint,
  ArchitectureRule,
  DesignPrinciple,
  ParsedSpec,
  Plan,
  Tasks,
  TaskItem,
  Progress,
  ProgressMetrics,
  SpecKitArtifacts,
  ValidationIssue,
  ValidationResult,
  ValidationReport,
  ValidationSeverity,
} from './types.js';

// Constitution Parser
export {
  parseConstitution,
  type ConstitutionParseOptions,
} from './constitution-parser.js';

// Spec Validator
export {
  SpecValidator,
  createSpecValidator,
  type SpecContent,
} from './spec-validator.js';

// Progress Tracker
export {
  ProgressTracker,
  createProgressTracker,
  type ProgressUpdate,
  type TaskStatus,
  type GitSyncOptions,
} from './progress-tracker.js';
```

**Update `src/strategies/index.ts`:**
```typescript
/**
 * Strategies Module
 *
 * Barrel file for all output strategies.
 *
 * @module strategies
 */

// Base types
export type {
  OutputStrategy,
  RenderResult,
  RenderOptions,
  Document,
} from './output-strategy.js';

export { OutputApproach } from './output-strategy.js';

// Individual strategies
export { MarkdownStrategy } from './markdown-strategy.js';
export { JsonStrategy } from './json-strategy.js';
export { SpecKitStrategy } from './speckit-strategy.js';

// Spec-Kit sub-module
export * from './speckit/index.js';
```

**Update `src/index.ts` (main barrel):**
```typescript
// Add to exports section
export * from './strategies/index.js';
export * from './strategies/speckit/index.js';
```

## Acceptance Criteria

- [ ] `src/strategies/speckit/index.ts` exports all Spec-Kit types
- [ ] Parser, validator, and tracker accessible via barrel
- [ ] `src/strategies/index.ts` exports Spec-Kit strategy
- [ ] Main `src/index.ts` re-exports strategy module
- [ ] Clean import paths work: `import { SpecValidator } from 'mcp-ai-agent-guidelines'`

## Files to Create/Modify

- `src/strategies/speckit/index.ts` (create or update)
- `src/strategies/index.ts` (update)
- `src/index.ts` (update if needed)

## Import Path Examples

After this task, these imports should work:

```typescript
// From package root
import {
  parseConstitution,
  SpecValidator,
  ProgressTracker,
  type Constitution,
  type ValidationResult,
} from 'mcp-ai-agent-guidelines';

// From strategies
import {
  SpecKitStrategy,
  OutputApproach,
} from 'mcp-ai-agent-guidelines/strategies';

// From speckit submodule
import {
  createSpecValidator,
  createProgressTracker,
} from 'mcp-ai-agent-guidelines/strategies/speckit';
```

## Verification Commands

```bash
npm run build
# Verify exports compile
node -e "import('./dist/strategies/speckit/index.js').then(m => console.log(Object.keys(m)))"
```

## Definition of Done

1. ✅ All barrel files updated
2. ✅ Clean import paths work
3. ✅ Build succeeds
4. ✅ No circular dependencies

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-023)*
