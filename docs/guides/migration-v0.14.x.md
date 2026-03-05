# Migration Guide: v0.13.x → v0.14.x

This guide covers breaking changes and new features in v0.14.x.

## Summary of Changes

| Area | Change | Action Required |
|------|--------|-----------------|
| Framework Facades | New `src/frameworks/` module with 11 unified facades | Optional adoption |
| Domain Router | New `src/domain/router/` with strategy/plugin system | No breaking change |
| Platform Abstraction Layer | New `src/platform/` (PAL) | No direct fs/path in src/ |
| Deprecation Helpers | New `src/tools/shared/deprecation-helpers.ts` | No breaking change |
| Enforcement Tool | New `validate_progress` MCP tool | New tool available |

## New Features

### Framework Facades

The new unified framework system provides a single entry point per domain:

```typescript
import { frameworkRouter } from "./frameworks/index.js";

// Route to prompt-engineering framework
const result = await frameworkRouter.execute("prompt-engineering", {
  action: "build",
  context: "...",
  goal: "...",
});
```

### Platform Abstraction Layer

Use the PAL for file I/O in production code and MockPAL in tests:

```typescript
// Production
import { pal } from "./platform/index.js";
const content = await pal.readFile(path);

// Tests
import { setPal, MockPAL } from "./platform/index.js";
setPal(new MockPAL());
```

### Deprecation Helpers

Track deprecated tool names with automatic migration warnings:

```typescript
import { deprecationRegistry, warnDeprecated } from "./tools/shared/deprecation-helpers.js";

deprecationRegistry.register({ oldName: "old-tool", newName: "new-tool", removalVersion: "0.15.0" });
deprecationRegistry.warn("old-tool"); // logs migration message
```

### validate_progress Tool

New MCP tool for validating project progress files:

```json
{
  "tool": "validate_progress",
  "arguments": {
    "projectPath": "./plan-v0.14.x",
    "outputFormat": "markdown"
  }
}
```

## Breaking Changes

No breaking changes in v0.14.x. All existing tools continue to work unchanged.

## Deprecations

None in v0.14.x.

## Upgrade Steps

1. `npm install mcp-ai-agent-guidelines@0.14.x`
2. No code changes required
3. Optionally adopt framework facades for new integrations
4. Optionally use PAL in new file I/O code
