# 🔧 P3-008: Add ToolAnnotations for Fixed Tools [serial]

> **Parent**: [003-parent-phase3-broken-tools.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/003-parent-phase3-broken-tools.md)
> **Labels**: `phase-3`, `priority-medium`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 1 hour
> **Depends On**: P3-003, P3-007

## Context

After fixing mode-switcher and project-onboarding, their ToolAnnotations need to reflect actual behavior.

## Task Description

Update ToolAnnotations for fixed tools:

**mode-switcher Annotations:**
```typescript
{
  name: 'mode-switcher',
  // ...
  annotations: {
    readOnlyHint: false,      // Actually changes state now
    idempotentHint: false,    // Different modes affect behavior
    destructiveHint: false,   // No data loss
    openWorldHint: false,     // No external resources
  }
}
```

**project-onboarding Annotations:**
```typescript
{
  name: 'project-onboarding',
  // ...
  annotations: {
    readOnlyHint: true,       // Only reads files, doesn't modify
    idempotentHint: true,     // Same input = same output
    destructiveHint: false,   // No data loss
    openWorldHint: true,      // Accesses file system
  }
}
```

## Acceptance Criteria

- [ ] mode-switcher: `readOnlyHint: false` (changes state)
- [ ] mode-switcher: `idempotentHint: false` (mode changes behavior)
- [ ] project-onboarding: `readOnlyHint: true` (only reads)
- [ ] project-onboarding: `openWorldHint: true` (file system access)
- [ ] All tests pass

## Files to Modify

- `src/index.ts` — Tool registration section

## Verification

```bash
npm run build && npm run test:mcp
```

## References

- [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md) §5.2
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-008
