# 🔧 Sub-Issue: Phase 1 Documentation (P1-017)

> **Parent**: #TBD
> **Labels**: `phase-1`, `serial`, `copilot-suitable`, `priority-medium`
> **Milestone**: M2: Test-Stable

## Context

After all Phase 1 implementation (annotations, descriptions, unified tool), documentation must be updated to reflect the new features and migration paths.

---

## Task Description

Update documentation for Phase 1 changes:

1. **README.md** - Update tool count, add unified tool reference
2. **docs/tools.md** - Document all tools with annotations
3. **docs/migration.md** - Create migration guide for deprecated tools
4. **CHANGELOG.md** - Add Phase 1 changes

---

## Acceptance Criteria

- [ ] README reflects new tool count and capabilities
- [ ] Tools documentation includes ToolAnnotations information
- [ ] Migration guide documents path from old to unified tools
- [ ] CHANGELOG has v0.14.0-alpha.1 section with Phase 1 changes
- [ ] All links work
- [ ] Documentation builds/renders correctly

---

## Files to Change

| File | Change |
|------|--------|
| `README.md` | Update tool count, add prompt-hierarchy mention |
| `docs/tools.md` | Update with annotations, new descriptions |
| `docs/migration.md` | Create new file with migration guide |
| `CHANGELOG.md` | Add v0.14.0-alpha.1 section |

---

## Implementation Hints

### README Updates

```markdown
## Tools

This MCP server provides **32 tools** (+1 unified prompt tool) for AI-assisted development:

### Prompt Engineering
- **prompt-hierarchy** (NEW) - Unified API for prompt generation, evaluation, and workflow chaining
  - Modes: `build`, `evaluate`, `select-level`, `chain`, `flow`, `quick`
  - Replaces: 6 individual prompt tools (deprecated)

### Analysis Tools
...
```

### Migration Guide Structure

```markdown
# Migration Guide: v0.13.x → v0.14.x

## Prompt Tool Consolidation

v0.14.0 introduces `prompt-hierarchy`, a unified tool that consolidates 6 prompt-related tools.

### Deprecated Tools

| Old Tool | New Equivalent | Migration |
|----------|----------------|-----------|
| `hierarchical-prompt-builder` | `prompt-hierarchy` mode=`build` | Change tool name, add `mode: "build"` |
| `prompting-hierarchy-evaluator` | `prompt-hierarchy` mode=`evaluate` | Change tool name, add `mode: "evaluate"` |
| `hierarchy-level-selector` | `prompt-hierarchy` mode=`select-level` | Change tool name, add `mode: "select-level"` |
| `prompt-chaining-builder` | `prompt-hierarchy` mode=`chain` | Change tool name, add `mode: "chain"` |
| `prompt-flow-builder` | `prompt-hierarchy` mode=`flow` | Change tool name, add `mode: "flow"` |
| `quick-developer-prompts` | `prompt-hierarchy` mode=`quick` | Change tool name, add `mode: "quick"` |

### Before/After Examples

**Before (v0.13.x)**:
```json
{
  "tool": "hierarchical-prompt-builder",
  "arguments": {
    "taskDescription": "Review code for security issues",
    "hierarchyLevel": "direct"
  }
}
```

**After (v0.14.x)**:
```json
{
  "tool": "prompt-hierarchy",
  "arguments": {
    "mode": "build",
    "taskDescription": "Review code for security issues",
    "hierarchyLevel": "direct"
  }
}
```

### Timeline

- **v0.14.0**: Deprecated tools emit warnings, still functional
- **v0.15.0**: Deprecated tools removed
```

### CHANGELOG Section

```markdown
## [0.14.0-alpha.1] - 2026-01-XX

### Added
- ToolAnnotations for all 32 tools (title, readOnlyHint, idempotentHint, openWorldHint)
- `prompt-hierarchy` unified tool consolidating 6 prompt tools
- Schema examples for improved LLM understanding
- Description uniqueness test

### Changed
- All tool descriptions rewritten in active voice format
- Improved discoverability through standardized naming

### Deprecated
- `hierarchical-prompt-builder` (use `prompt-hierarchy` mode=build)
- `prompting-hierarchy-evaluator` (use `prompt-hierarchy` mode=evaluate)
- `hierarchy-level-selector` (use `prompt-hierarchy` mode=select-level)
- `prompt-chaining-builder` (use `prompt-hierarchy` mode=chain)
- `prompt-flow-builder` (use `prompt-hierarchy` mode=flow)
- `quick-developer-prompts` (use `prompt-hierarchy` mode=quick)
```

---

## Testing Strategy

- Check all markdown links with `npm run docs:check` (if available)
- Manual review of rendered documentation
- Verify CHANGELOG follows [Keep a Changelog](https://keepachangelog.com/) format

---

## Dependencies

- **Depends on**: P1-014, P1-015, P1-016 (all implementation complete)
- **Enables**: M2 milestone completion

---

## References

- [SPEC-001: LLM Tool Discoverability](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-llm-tool-discoverability.md) §4
- [TASKS-phase-1.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-1.md) P1-017
- [Keep a Changelog](https://keepachangelog.com/)
