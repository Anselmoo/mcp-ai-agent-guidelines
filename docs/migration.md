# Migration Guide: v0.13.x → v0.14.x

> **Version**: v0.14.0-alpha.1
> **Status**: Active
> **Last Updated**: 2026-01-05

## Overview

Version 0.14.0 introduces significant improvements to tool discoverability and usability through:

1. **Unified Prompt Tool**: `prompt-hierarchy` consolidates 6 prompt-related tools into a single, mode-based API
2. **ToolAnnotations**: All 32 tools now include metadata for better LLM understanding (readOnlyHint, idempotentHint, etc.)
3. **Enhanced Descriptions**: All tool descriptions rewritten in active voice with clear use cases
4. **Schema Examples**: Input schemas include examples for better LLM comprehension

---

## Prompt Tool Consolidation

The most significant change in v0.14.0 is the introduction of `prompt-hierarchy`, a unified tool that replaces 6 individual prompt tools.

### Deprecated Tools

The following tools are **deprecated as of v0.14.0** and will be **removed in v0.15.0**:

| Old Tool                        | New Equivalent                      | Migration Effort |
| ------------------------------- | ----------------------------------- | ---------------- |
| `hierarchical-prompt-builder`   | `prompt-hierarchy` mode=`build`     | Low - add mode   |
| `prompting-hierarchy-evaluator` | `prompt-hierarchy` mode=`evaluate`  | Low - add mode   |
| `hierarchy-level-selector`      | `prompt-hierarchy` mode=`select-level` | Low - add mode |
| `prompt-chaining-builder`       | `prompt-hierarchy` mode=`chain`     | Low - add mode   |
| `prompt-flow-builder`           | `prompt-hierarchy` mode=`flow`      | Low - add mode   |
| `quick-developer-prompts-builder` | `prompt-hierarchy` mode=`quick`   | Low - add mode   |

### Why This Change?

**Benefits of Consolidation**:
- ✅ **Reduced cognitive load**: One tool to learn instead of six
- ✅ **Better discoverability**: LLMs can find prompt operations in a single place
- ✅ **Consistent API**: All prompt operations share common patterns
- ✅ **Easier maintenance**: Bug fixes and features benefit all modes
- ✅ **Backward compatible**: Old tools still work with deprecation warnings until v0.15.0

---

## Migration Examples

### 1. Hierarchical Prompt Builder

**Before (v0.13.x)**:
```json
{
  "tool": "hierarchical-prompt-builder",
  "arguments": {
    "context": "Microservices authentication system",
    "goal": "Review OAuth2 implementation for security issues",
    "requirements": [
      "Check token validation",
      "Verify refresh token rotation",
      "Assess session management"
    ],
    "audience": "senior security engineer"
  }
}
```

**After (v0.14.x)**:
```json
{
  "tool": "prompt-hierarchy",
  "arguments": {
    "mode": "build",
    "context": "Microservices authentication system",
    "goal": "Review OAuth2 implementation for security issues",
    "requirements": [
      "Check token validation",
      "Verify refresh token rotation",
      "Assess session management"
    ],
    "audience": "senior security engineer"
  }
}
```

**Changes**: Add `"mode": "build"` parameter. All other parameters remain identical.

---

### 2. Prompting Hierarchy Evaluator

**Before (v0.13.x)**:
```json
{
  "tool": "prompting-hierarchy-evaluator",
  "arguments": {
    "promptText": "Analyze the codebase for security issues",
    "targetLevel": "direct"
  }
}
```

**After (v0.14.x)**:
```json
{
  "tool": "prompt-hierarchy",
  "arguments": {
    "mode": "evaluate",
    "promptText": "Analyze the codebase for security issues",
    "targetLevel": "direct"
  }
}
```

**Changes**: Add `"mode": "evaluate"` parameter. All other parameters remain identical.

---

### 3. Hierarchy Level Selector

**Before (v0.13.x)**:
```json
{
  "tool": "hierarchy-level-selector",
  "arguments": {
    "taskDescription": "Implement OAuth2 authentication",
    "agentCapability": "intermediate",
    "taskComplexity": "complex",
    "autonomyPreference": "medium"
  }
}
```

**After (v0.14.x)**:
```json
{
  "tool": "prompt-hierarchy",
  "arguments": {
    "mode": "select-level",
    "taskDescription": "Implement OAuth2 authentication",
    "agentCapability": "intermediate",
    "taskComplexity": "complex",
    "autonomyPreference": "medium"
  }
}
```

**Changes**: Add `"mode": "select-level"` parameter. All other parameters remain identical.

---

### 4. Prompt Chaining Builder

**Before (v0.13.x)**:
```json
{
  "tool": "prompt-chaining-builder",
  "arguments": {
    "chainName": "Security Analysis Pipeline",
    "steps": [
      {
        "name": "Scan",
        "prompt": "Scan for vulnerabilities",
        "outputKey": "vulns"
      },
      {
        "name": "Assess",
        "prompt": "Assess severity of {{vulns}}",
        "dependencies": ["vulns"]
      }
    ]
  }
}
```

**After (v0.14.x)**:
```json
{
  "tool": "prompt-hierarchy",
  "arguments": {
    "mode": "chain",
    "chainName": "Security Analysis Pipeline",
    "steps": [
      {
        "name": "Scan",
        "prompt": "Scan for vulnerabilities",
        "outputKey": "vulns"
      },
      {
        "name": "Assess",
        "prompt": "Assess severity of {{vulns}}",
        "dependencies": ["vulns"]
      }
    ]
  }
}
```

**Changes**: Add `"mode": "chain"` parameter. All other parameters remain identical.

---

### 5. Prompt Flow Builder

**Before (v0.13.x)**:
```json
{
  "tool": "prompt-flow-builder",
  "arguments": {
    "flowName": "Adaptive Code Review",
    "nodes": [
      { "id": "analyze", "type": "prompt", "name": "Analyze", "config": { "prompt": "Analyze code" } },
      { "id": "check", "type": "condition", "name": "Complex?", "config": { "expression": "complexity > 10" } }
    ],
    "edges": [
      { "from": "analyze", "to": "check" }
    ]
  }
}
```

**After (v0.14.x)**:
```json
{
  "tool": "prompt-hierarchy",
  "arguments": {
    "mode": "flow",
    "flowName": "Adaptive Code Review",
    "nodes": [
      { "id": "analyze", "type": "prompt", "name": "Analyze", "config": { "prompt": "Analyze code" } },
      { "id": "check", "type": "condition", "name": "Complex?", "config": { "expression": "complexity > 10" } }
    ],
    "edges": [
      { "from": "analyze", "to": "check" }
    ]
  }
}
```

**Changes**: Add `"mode": "flow"` parameter. All other parameters remain identical.

---

### 6. Quick Developer Prompts Builder

**Before (v0.13.x)**:
```json
{
  "tool": "quick-developer-prompts-builder",
  "arguments": {
    "category": "testing"
  }
}
```

**After (v0.14.x)**:
```json
{
  "tool": "prompt-hierarchy",
  "arguments": {
    "mode": "quick",
    "category": "testing"
  }
}
```

**Changes**: Add `"mode": "quick"` parameter. All other parameters remain identical.

---

## Agent-Relative Call Updates

If you're using agent-relative call patterns, update them as follows:

**Before**:
```markdown
Use the hierarchical-prompt-builder MCP to create a code review prompt
for our authentication module.
```

**After**:
```markdown
Use the prompt-hierarchy MCP with mode=build to create a code review prompt
for our authentication module.
```

**Before**:
```markdown
Use the prompting-hierarchy-evaluator MCP to score this prompt for quality.
```

**After**:
```markdown
Use the prompt-hierarchy MCP with mode=evaluate to score this prompt for quality.
```

---

## Migration Timeline

| Version  | Status                                    | Action Required                          |
| -------- | ----------------------------------------- | ---------------------------------------- |
| v0.13.x  | ✅ Old tools fully functional              | No action required                       |
| v0.14.0  | ⚠️ Deprecation warnings emitted           | Migrate at your convenience              |
| v0.15.0  | 🚫 Old tools removed                      | **Must migrate** to avoid breakage       |

**Recommendation**: Migrate as soon as you upgrade to v0.14.0 to avoid warnings and prepare for v0.15.0.

---

## Migration Checklist

Use this checklist to track your migration progress:

### Automated Search & Replace

1. [ ] Search codebase for `"tool": "hierarchical-prompt-builder"` → Replace with `"tool": "prompt-hierarchy", "mode": "build"`
2. [ ] Search codebase for `"tool": "prompting-hierarchy-evaluator"` → Replace with `"tool": "prompt-hierarchy", "mode": "evaluate"`
3. [ ] Search codebase for `"tool": "hierarchy-level-selector"` → Replace with `"tool": "prompt-hierarchy", "mode": "select-level"`
4. [ ] Search codebase for `"tool": "prompt-chaining-builder"` → Replace with `"tool": "prompt-hierarchy", "mode": "chain"`
5. [ ] Search codebase for `"tool": "prompt-flow-builder"` → Replace with `"tool": "prompt-hierarchy", "mode": "flow"`
6. [ ] Search codebase for `"tool": "quick-developer-prompts-builder"` → Replace with `"tool": "prompt-hierarchy", "mode": "quick"`

### Manual Verification

7. [ ] Test all migrated calls to ensure they work correctly
8. [ ] Update documentation references to old tool names
9. [ ] Update agent-relative call patterns in workflows
10. [ ] Remove any hardcoded references to deprecated tools
11. [ ] Update CI/CD scripts if they reference old tools
12. [ ] Verify no deprecation warnings appear in logs

---

## Breaking Changes

**None in v0.14.0** - All deprecated tools remain functional with warnings.

**In v0.15.0** (future):
- ❌ `hierarchical-prompt-builder` will be removed
- ❌ `prompting-hierarchy-evaluator` will be removed
- ❌ `hierarchy-level-selector` will be removed
- ❌ `prompt-chaining-builder` will be removed
- ❌ `prompt-flow-builder` will be removed
- ❌ `quick-developer-prompts-builder` will be removed

**Impact**: Any code still using old tools will fail when calling these tools.

---

## New Features in v0.14.0

While migrating, you can also take advantage of new features:

### 1. ToolAnnotations

All tools now include annotations for better LLM understanding:

```typescript
{
  title: "Clean Code Scorer",
  readOnlyHint: true,      // Tool doesn't modify state
  idempotentHint: true,    // Repeated calls return same result
  destructiveHint: false,  // Tool doesn't delete/destroy data
  openWorldHint: false     // Tool doesn't access external systems
}
```

**Use cases**:
- LLMs can understand which tools are safe to call repeatedly
- Better error handling based on tool characteristics
- Improved workflow planning

### 2. Enhanced Descriptions

All tool descriptions now follow a consistent format:

```
[ACTION VERB] [WHAT IT DOES] with [KEY DIFFERENTIATOR].
BEST FOR: [use cases].
OUTPUTS: [format].
```

**Example**:
```
Analyze codebase for outdated patterns, unused dependencies, deprecated APIs,
code smells, and technical debt with modernization recommendations.
BEST FOR: legacy code assessment, dependency cleanup, code modernization.
OUTPUTS: Hygiene analysis with prioritized recommendations.
```

### 3. Schema Examples

Input schemas now include examples for better LLM comprehension:

```json
{
  "context": {
    "type": "string",
    "description": "The broad context or domain",
    "examples": [
      "Microservices authentication system",
      "E-commerce checkout flow",
      "Real-time data pipeline"
    ]
  }
}
```

---

## Getting Help

- 📖 **Documentation**: See [docs/api/prompt-hierarchy.md](./api/prompt-hierarchy.md) for full `prompt-hierarchy` API reference
- 🐛 **Issues**: Report migration problems at [GitHub Issues](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues)
- 💬 **Questions**: Ask questions in [GitHub Issues](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues) with the `question` label
- 📧 **Contact**: Reach maintainers via GitHub

---

## See Also

- [CHANGELOG.md](../CHANGELOG.md) - Full list of changes in v0.14.0
- [Complete Documentation](./README.md) - All tool guides and references
- [prompt-hierarchy API Reference](./api/prompt-hierarchy.md) - Detailed API documentation
