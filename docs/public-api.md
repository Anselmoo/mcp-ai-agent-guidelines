# Public API Documentation

This document describes the public API surface of the MCP AI Agent Guidelines project, including stable exports, singletons, and test utilities.

## Design System Public API

### Module Status Map: `DESIGN_MODULE_STATUSES`

**Export**: `src/tools/design/index.ts`

The `DESIGN_MODULE_STATUSES` constant provides a centralized, immutable map of implementation status for all design modules. This replaces individual `IMPLEMENTATION_STATUS` exports from each module.

**Stability**: ✅ **Stable** - This export is part of the public API and will not be removed without a major version bump.

**Usage**:
```typescript
import { DESIGN_MODULE_STATUSES } from '@/tools/design';

// Check if a module is implemented
if (DESIGN_MODULE_STATUSES.adrGenerator === 'IMPLEMENTED') {
  // Use the ADR generator
  const result = await adrGenerator.generateADR(/* ... */);
}

// List all implemented modules
const implementedModules = Object.entries(DESIGN_MODULE_STATUSES)
  .filter(([_, status]) => status === 'IMPLEMENTED')
  .map(([name, _]) => name);

console.log('Implemented modules:', implementedModules);
```

**Available Modules**:
- `adrGenerator` - Architecture Decision Record generation
- `confirmationModule` - Phase completion confirmation and validation
- `confirmationPromptBuilder` - Confirmation prompt generation
- `constraintConsistencyEnforcer` - Constraint validation and enforcement
- `constraintManager` - Constraint loading and management
- `coverageEnforcer` - Coverage threshold enforcement
- `crossSessionConsistencyEnforcer` - Cross-session consistency validation
- `designAssistant` - Main design workflow orchestrator
- `designPhaseWorkflow` - Phase-based design workflow execution
- `methodologySelector` - Methodology selection and profiling
- `pivotModule` - Strategic pivot evaluation and recommendations
- `roadmapGenerator` - Project roadmap generation
- `specGenerator` - Technical specification generation
- `strategicPivotPromptBuilder` - Strategic pivot prompt generation

All modules currently have status `'IMPLEMENTED'`.

---

## Public Singletons

The following singletons are part of the public API and should be reused across the application rather than recreated:

### `constraintManager`

**Export**: `src/tools/design/constraint-manager.ts`

**Purpose**: Loads and manages design constraints from YAML configuration files.

**Lifecycle**: Singleton - initialized once per application

**Key Methods**:
- `loadConstraintsFromConfig(configPath?: string): Promise<void>` - Load constraints from YAML
- `validateConstraints(state: DesignSessionState): ValidationResult` - Validate against loaded constraints
- `getConstraint(id: string): ConstraintRule | undefined` - Retrieve specific constraint
- `getMicroMethods(): MicroMethod[]` - Get available micro-methods

**Usage**:
```typescript
import { constraintManager } from '@/tools/design';

// Load constraints (usually done at startup)
await constraintManager.loadConstraintsFromConfig();

// Use throughout the application
const constraint = constraintManager.getConstraint('phase-discovery-required');
```

### `crossSessionConsistencyEnforcer`

**Export**: `src/tools/design/cross-session-consistency-enforcer.ts`

**Purpose**: Validates consistency across multiple design sessions.

**Lifecycle**: Singleton - maintains cross-session state

**Key Methods**:
- `initialize(): Promise<void>` - Initialize the enforcer
- `enforceConsistency(request: ConsistencyEnforcementRequest): Promise<ConsistencyEnforcementResult>` - Enforce consistency
- `generateEnforcementPrompts(request: ConsistencyEnforcementRequest): Promise<EnforcementPrompt[]>` - Generate enforcement prompts

### `logger`

**Export**: `src/tools/shared/logger.ts`

**Purpose**: Structured logging with trace support.

**Lifecycle**: Singleton - shared across all modules

**Key Methods**:
- `trace(message: string, data?: unknown): void` - Trace-level logging
- `debug(message: string, data?: unknown): void` - Debug logging
- `info(message: string, data?: unknown): void` - Info logging
- `warn(message: string, data?: unknown): void` - Warning logging
- `error(message: string, error?: Error | unknown): void` - Error logging

**Usage**:
```typescript
import { logger } from '@/tools/shared/logger';

logger.info('Processing design request', { sessionId: 'abc123' });
logger.error('Failed to generate ADR', error);
```

### `toolRegistry`

**Export**: `src/tools/shared/tool-registry.ts` (if applicable)

**Purpose**: Registry of available MCP tools.

**Lifecycle**: Singleton - initialized at server startup

---

## Test Utilities

### Location

Test-only utilities are exported from `src/tools/test-utils/` to clearly separate them from the public API.

### Available Test Utilities

#### `__setMermaidModuleProvider`

**Export**: `src/tools/test-utils/mermaid.ts`

**Purpose**: Mock Mermaid module loading for testing without requiring the actual `mermaid` package.

**⚠️ For Tests Only**: This function should only be imported and used in test files.

**Usage**:
```typescript
import { __setMermaidModuleProvider } from '@/tools/test-utils/mermaid';
import { describe, it, expect, afterEach } from 'vitest';

describe('My Mermaid Test', () => {
  afterEach(() => {
    // Always reset after tests
    __setMermaidModuleProvider(null);
  });

  it('should generate diagram with mocked validator', async () => {
    // Mock the mermaid module
    __setMermaidModuleProvider(() => ({
      parse: (code: string) => Promise.resolve(true)
    }));

    // Run your test...
  });
});
```

**Alternative**: Use the helper from `tests/vitest/helpers/mermaid-test-utils.ts`:
```typescript
import { withMermaidProvider } from '@/tests/vitest/helpers/mermaid-test-utils';

it('should validate diagram', async () => {
  await withMermaidProvider(
    () => ({ parse: (code) => Promise.resolve(true) }),
    async () => {
      // Test code here - provider is automatically reset after
    }
  );
});
```

---

## Deprecation Policy

### Deprecated Exports

The following exports are deprecated and will be removed in a future version:

- ❌ `__setMermaidModuleProvider` from `src/tools/mermaid-diagram-generator.ts`
  - **Migration**: Import from `src/tools/test-utils/mermaid.ts` instead
  - **Removal**: Planned for v1.0.0

- ❌ `__setMermaidModuleProvider` from `src/tools/mermaid/index.ts`
  - **Migration**: Import from `src/tools/test-utils/mermaid.ts` instead
  - **Removal**: Planned for v1.0.0

- ❌ Individual `IMPLEMENTATION_STATUS` re-exports from `src/tools/design/index.ts`
  - **Migration**: Use `DESIGN_MODULE_STATUSES` object instead
  - **Note**: Individual `IMPLEMENTATION_STATUS` constants in source files are kept for internal use but are no longer re-exported

---

## Versioning and Stability

This project follows semantic versioning (SemVer):

- **Patch versions** (0.12.x): Bug fixes, documentation updates, internal refactors
- **Minor versions** (0.x.0): New features, new exports, backwards-compatible changes
- **Major versions** (x.0.0): Breaking changes, removed exports, API changes

**Stability Promises**:
- ✅ **Stable**: Will not be removed without a major version bump
- ⚠️ **Experimental**: May change in minor versions
- ❌ **Deprecated**: Will be removed in next major version

---

## Contributing

When adding new public exports:

1. Add JSDoc documentation with stability annotations
2. Add examples to this document
3. Add tests verifying the export works as documented
4. Update CHANGELOG.md with the new export

When deprecating exports:

1. Mark with `@deprecated` JSDoc tag
2. Add migration path in JSDoc
3. Add to "Deprecated Exports" section above
4. Keep for at least one minor version before removal

---

## Questions?

For questions about the public API:
- Open an issue on GitHub
- Check the source code JSDoc comments
- Review the test files for usage examples
