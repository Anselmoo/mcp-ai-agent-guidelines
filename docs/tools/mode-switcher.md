<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Mode Switcher

> **Switch agent operation modes**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../../README.md)
[![Utilities](https://img.shields.io/badge/Category-Utilities-gray?style=flat-square)](./README.md#utilities)
[![Documentation](https://img.shields.io/badge/📚-Docs-blue?style=flat-square)](../README.md)

**Complexity**: ⭐ Simple | **Category**: Utilities | **Time to Learn**: 5-10 minutes

---

## Overview

The `mode-switcher` tool enables switching between different agent operation modes to optimize tool recommendations and workflow strategies for your current task. Each mode configures the agent with specific tool sets, prompting strategies, and focus areas tailored to common development workflows.

### Key Capabilities

- Switch between 8 specialized operation modes
- Context-aware tool recommendations for each mode
- Automatic prompting strategy adjustment
- Persistent mode state across tool calls within a session
- Mode transition history tracking

---

## When to Use

✅ **Good for:**

- Optimizing agent behavior for specific task types (planning, coding, debugging)
- Getting recommended tools for your current workflow phase
- Setting clear expectations for agent operation style
- Transitioning between different development activities

❌ **Not ideal for:**

- Single tool invocations (no need to switch modes)
- Tasks that require multiple modes simultaneously
- Real-time execution control

---

## Basic Usage

### Example 1: Switch to Planning Mode

```typescript
// Switch to planning mode for design work
await callTool('mode-switcher', {
  targetMode: 'planning',
  reason: 'Starting new feature design',
});
```

### Example 2: Validate Current Mode

```typescript
// Ensure current mode matches expectation (will error if mismatch)
await callTool('mode-switcher', {
  targetMode: 'editing',
  currentMode: 'planning', // Validation: checks if this matches actual current mode
});
```

### Example 3: Switch with Context

```typescript
// Switch to debugging mode with IDE context
await callTool('mode-switcher', {
  targetMode: 'debugging',
  context: 'ide-assistant',
  reason: 'Investigating test failure in authentication module',
});
```

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `targetMode` | enum | ✅ Yes | - | Mode to switch to. Options: `planning`, `editing`, `analysis`, `interactive`, `one-shot`, `debugging`, `refactoring`, `documentation` |
| `currentMode` | enum | No | - | Current active mode for validation. If provided and doesn't match actual mode, returns error |
| `context` | enum | No | - | Operating context: `desktop-app`, `ide-assistant`, `agent`, `terminal`, `collaborative` |
| `reason` | string | No | - | Human-readable reason for the mode switch |
| `includeReferences` | boolean | No | `false` | Include external reference links in output |
| `includeMetadata` | boolean | No | `false` | Include metadata section in output |

---

## Available Modes

| Mode | Description | Recommended Tools |
|------|-------------|-------------------|
| `planning` | Design and architecture work | hierarchical-prompt-builder, domain-neutral-prompt-builder, strategy-frameworks-builder, gap-frameworks-analyzers, mermaid-diagram-generator |
| `editing` | Code writing and modification | semantic-code-analyzer, code-hygiene-analyzer, iterative-coverage-enhancer, file-operations |
| `analysis` | Code review and quality checks | semantic-code-analyzer, code-hygiene-analyzer, guidelines-validator, gap-frameworks-analyzers |
| `debugging` | Troubleshooting and fixes | semantic-code-analyzer, iterative-coverage-enhancer, code-hygiene-analyzer |
| `refactoring` | Code improvement | semantic-code-analyzer, code-hygiene-analyzer, iterative-coverage-enhancer |
| `documentation` | Docs and comments | mermaid-diagram-generator, domain-neutral-prompt-builder, hierarchical-prompt-builder |
| `interactive` | All tools available, conversational style | All tools enabled |
| `one-shot` | Single comprehensive response | All tools enabled |

---

## What You Get

The tool returns a detailed mode switch confirmation with:

1. **Mode Transition Summary** - Previous mode, new mode, timestamp, and reason
2. **Recommended Tools** - List of tools optimized for the new mode
3. **Mode Profile** - Description, focus areas, enabled/disabled tools
4. **Prompting Strategy** - Guidance for how to prompt in this mode
5. **Next Steps** - Mode-specific workflow recommendations
6. **Context Guidance** - Additional tips based on operating context (if provided)

### Output Structure

```markdown
# Mode Switched Successfully

**Previous Mode**: [Previous Mode Name]
**Current Mode**: [New Mode Name]
**Switched At**: [ISO timestamp]
**Reason**: [Reason if provided]

## Recommended Tools for [Mode] Mode
- tool-1
- tool-2
...

## 🎯 [Mode] Overview
[Mode description]

### 🔍 Primary Focus Areas
- Focus area 1
- Focus area 2
...

### 🛠️ Enabled Tools
- enabled-tool-1
- enabled-tool-2
...

### 💡 Prompting Strategy
[Strategy description]

### ✅ Best Used For
- Use case 1
- Use case 2
...

### 🎬 Next Steps in [Mode]
1. Step 1
2. Step 2
...

[Context guidance if context parameter provided]

## Notes
Mode will persist until explicitly changed. Use `getCurrentMode` to verify.

---
**Mode Active**: [Mode Name] 🟢
```

---

## State Persistence

Mode persists across tool calls within a session. The mode manager maintains:

- Current active mode
- Mode transition history with timestamps and reasons
- Available tool recommendations per mode

**Note**: Mode state is session-specific. Each new session starts in the default mode.

---

## Tips & Tricks

### 💡 Best Practices

1. **Choose the Right Mode** - Select mode based on your current task type, not just preference
2. **Validate Transitions** - Use `currentMode` parameter to catch unexpected mode state
3. **Provide Context** - Add `reason` to document why you're switching (helps with debugging)
4. **Use Context Parameter** - Specify operating environment for tailored guidance

### 🚫 Common Mistakes

- ❌ Switching modes too frequently → ✅ Stay in one mode for related tasks
- ❌ Using interactive mode for everything → ✅ Use specialized modes for better results
- ❌ Ignoring recommended tools → ✅ Follow mode-specific tool suggestions
- ❌ Not validating current mode → ✅ Use currentMode parameter when mode state matters

### ⚡ Pro Tips

- **Planning → Editing → Analysis** is a common workflow progression
- Use `one-shot` mode for well-defined tasks that don't need iteration
- Switch to `debugging` mode as soon as you encounter an error
- `documentation` mode disables code editing to focus on docs only
- Check transition history with `modeManager.getHistory()` to understand workflow

---

## Mode Profiles Reference

### Planning Mode
- **Best for**: Complex features, system design, refactoring large codebases
- **Focus**: Understand requirements, break down tasks, create detailed plans
- **Strategy**: Structured hierarchical prompts, plan before acting
- **Disabled**: Code editing, file operations

### Editing Mode
- **Best for**: Implementing well-defined features, bug fixes, small refactorings
- **Focus**: Make precise code changes, implement efficiently
- **Strategy**: Be specific about changes, use symbol operations, verify immediately
- **Enabled**: All code modification tools

### Analysis Mode
- **Best for**: Code review, architecture assessment, quality evaluation
- **Focus**: Analyze structure, identify patterns, understand dependencies
- **Strategy**: Ask targeted questions, use semantic analysis, build understanding incrementally
- **Disabled**: File operations (read-only mode)

### Debugging Mode
- **Best for**: Bug investigation, error resolution, test failures
- **Focus**: Reproduce issues, analyze errors, trace execution flow
- **Strategy**: Systematic debugging, use logging, test hypotheses, verify fixes
- **Enabled**: Semantic analyzer, coverage tools, hygiene analyzer

### Refactoring Mode
- **Best for**: Code cleanup, architecture improvement, technical debt reduction
- **Focus**: Preserve functionality, improve quality, reduce complexity
- **Strategy**: Small incremental changes, run tests frequently, use semantic operations
- **Enabled**: Quality analysis and code modification tools

### Documentation Mode
- **Best for**: API docs, user guides, architecture documentation
- **Focus**: Document code and APIs, create guides, generate diagrams
- **Strategy**: Focus on clarity, use diagrams, provide examples
- **Disabled**: Code editing (documentation only)

### Interactive Mode
- **Best for**: Exploratory work, learning codebase, unclear requirements
- **Focus**: Iterate with feedback, clarify requirements, adjust approach
- **Strategy**: Ask clarifying questions, confirm understanding, iterate
- **All tools**: Enabled

### One-Shot Mode
- **Best for**: Well-defined tasks, report generation, batch operations
- **Focus**: Gather context upfront, execute complete solution, minimize follow-up
- **Strategy**: Be comprehensive, cover edge cases, provide complete solutions
- **All tools**: Enabled

---

## Related Tools

_No directly related tools. Check the [Tools Overview](./README.md) for other options._

---

<details>
<summary><strong>📚 Related Documentation</strong></summary>

- [All Utilities Tools](./README.md#utilities)
- [AI Interaction Tips](../tips/ai-interaction-tips.md)

</details>

<sub>**MCP AI Agent Guidelines** • Licensed under [MIT](../../LICENSE) • [Disclaimer](../../DISCLAIMER.md) • [Contributing](../../CONTRIBUTING.md)</sub>

---

## Related Documentation

- [All Utilities Tools](./README.md#utilities)
- [AI Interaction Tips](../tips/ai-interaction-tips.md)

---

<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
