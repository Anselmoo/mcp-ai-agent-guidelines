# Mode-Aware Tool Filtering

> **Feature**: P3-004
> **Status**: ✅ Implemented
> **Flag**: `MCP_ENABLE_MODE_FILTERING`
> **Default**: Disabled (false)

## Overview

Mode-aware tool filtering is an optional feature that limits the tools returned by the `list_tools` MCP handler based on the current agent mode. When enabled, only tools relevant to the active mode are displayed, reducing cognitive load and improving tool discoverability.

## Usage

### Enabling the Feature

Set the environment variable to enable mode-aware filtering:

```bash
export MCP_ENABLE_MODE_FILTERING=true
```

Or inline with your command:

```bash
MCP_ENABLE_MODE_FILTERING=true npm start
```

### Default Behavior (Disabled)

When the feature flag is **not set** or set to any value other than `"true"`:

- All tools are returned regardless of the current mode
- Backward compatible with existing behavior
- No filtering is applied

### Enabled Behavior

When `MCP_ENABLE_MODE_FILTERING=true`:

- Tools are filtered based on the current mode set in `modeManager`
- Only mode-relevant tools appear in the tool list
- Modes with wildcard (`*`) bypass filtering and return all tools

## Mode-to-Tools Mapping

The following table shows which tools are available in each mode:

| Mode | Allowed Tools |
|------|---------------|
| **planning** | `design-assistant`<br>`architecture-design-prompt-builder`<br>`sprint-timeline-calculator` |
| **editing** | `code-analysis-prompt-builder`<br>`hierarchical-prompt-builder` |
| **analysis** | `clean-code-scorer`<br>`code-hygiene-analyzer`<br>`semantic-code-analyzer` |
| **debugging** | `debugging-assistant-prompt-builder`<br>`iterative-coverage-enhancer` |
| **refactoring** | `clean-code-scorer`<br>`code-analysis-prompt-builder` |
| **documentation** | `documentation-generator-prompt-builder`<br>`mermaid-diagram-generator` |
| **interactive** | `*` (all tools) |
| **one-shot** | `*` (all tools) |

### Wildcard Modes

Modes marked with `*` bypass filtering entirely:

- **interactive**: Default mode, all tools available
- **one-shot**: Single-task execution, all tools available

## Implementation Details

### Feature Flag Configuration

The feature flag is defined in `src/config/feature-flags.ts`:

```typescript
export interface FeatureFlags {
  // ... other flags
  enableModeAwareToolFiltering: boolean;
}
```

Environment variable: `MCP_ENABLE_MODE_FILTERING`

### List Tools Handler

The filtering logic is implemented in `src/index.ts`:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const flags = getFeatureFlags();
  let tools = [
    // ... all tool definitions
  ];

  // Apply mode-aware filtering if enabled
  if (flags.enableModeAwareToolFiltering) {
    const currentMode = modeManager.getCurrentMode();
    const allowedTools = modeManager.getToolsForMode(currentMode);

    // If mode allows all tools (wildcard "*"), skip filtering
    if (!allowedTools.includes("*")) {
      tools = tools.filter((t) => allowedTools.includes(t.name));
    }
  }

  return { tools };
});
```

### Mode Manager

The mode manager (`src/tools/shared/mode-manager.ts`) maintains:

- Current active mode
- Mode transition history
- Mode-to-tools mapping

## Testing

### Unit Tests

Feature flag tests in `tests/vitest/config/feature-flags.spec.ts`:

```typescript
it("should enable enableModeAwareToolFiltering when env var is true", () => {
  process.env.MCP_ENABLE_MODE_FILTERING = "true";

  const flags = getFeatureFlags();

  expect(flags.enableModeAwareToolFiltering).toBe(true);
});
```

### Integration Tests

Integration tests in `tests/vitest/integration/mode-aware-filtering.spec.ts`:

```typescript
it("should filter tools for planning mode", async () => {
  process.env.MCP_ENABLE_MODE_FILTERING = "true";
  modeManager.setMode("planning");

  const tools = await getRegisteredTools();
  const toolNames = tools.map((t) => t.name);

  expect(toolNames).toContain("design-assistant");
  expect(toolNames).not.toContain("debugging-assistant-prompt-builder");
});
```

### Running Tests

```bash
# Run all tests
npm run test:vitest

# Run integration tests only
npx vitest run tests/vitest/integration/mode-aware-filtering.spec.ts

# Run with filtering enabled
MCP_ENABLE_MODE_FILTERING=true npm run test:vitest
```

## Examples

### Example 1: Planning Mode

```bash
# Enable mode filtering
export MCP_ENABLE_MODE_FILTERING=true

# Start server (mode defaults to "interactive")
npm start

# Switch to planning mode via mode-switcher tool
# Only planning tools will be returned in list_tools
```

Result: Only `design-assistant`, `architecture-design-prompt-builder`, and `sprint-timeline-calculator` appear.

### Example 2: Debugging Mode

```typescript
// In code, switch mode programmatically
import { modeManager } from "./tools/shared/mode-manager.js";

modeManager.setMode("debugging", "Investigating production issue");

// list_tools will now only show:
// - debugging-assistant-prompt-builder
// - iterative-coverage-enhancer
```

### Example 3: Interactive Mode (All Tools)

```typescript
// Interactive mode bypasses filtering
modeManager.setMode("interactive");

// list_tools returns ALL tools regardless of filtering flag
```

## Benefits

1. **Reduced Cognitive Load**: Users see only relevant tools for their current task
2. **Improved Discoverability**: Focused tool lists make finding the right tool easier
3. **Context-Appropriate Workflows**: Encourages mode-specific tool usage patterns
4. **Backward Compatible**: Disabled by default, no impact on existing workflows

## Limitations

1. **Manual Mode Switching**: Requires explicit mode changes via `mode-switcher` tool
2. **Static Mapping**: Tool-to-mode mapping is hardcoded in `mode-manager.ts`
3. **No Multi-Mode Support**: Tools can only be mapped to specific modes (no overlapping categories beyond explicit duplication)

## Future Enhancements

Potential improvements for future versions:

- [ ] Dynamic tool mapping via configuration file
- [ ] Automatic mode detection based on user intent
- [ ] Multi-mode support (composite modes)
- [ ] Tool recommendation system based on mode transitions
- [ ] Mode-specific tool aliases or shortcuts

## Related Documentation

- [Mode Switcher Tool](../tools/mode-switcher.md)
- [Feature Flags Configuration](../architecture/feature-flags.md)
- [SPEC-002: Tool Description Standardization](../../plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)
- [TASKS Phase 3](../../plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.13.0 | 2026-01-09 | Initial implementation (P3-004) |
