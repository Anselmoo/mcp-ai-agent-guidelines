# 🔧 P3-017: Update Tool Descriptions [serial]

> **Parent**: #697
> **Labels**: `phase-3`, `priority-medium`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 1 hour
> **Depends On**: P3-003, P3-007, P3-014

## Context

After fixing the tools, descriptions must accurately reflect actual functionality.

## Task Description

Update tool descriptions to reflect actual functionality:

**mode-switcher New Description:**
```typescript
{
  name: 'mode-switcher',
  description: 'Switch the agent operating mode. Changes persist across tool calls and affect available tool recommendations. Modes: planning, editing, analysis, debugging, refactoring, documentation, interactive, one-shot.',
  // ... input schema
}
```

**project-onboarding New Description:**
```typescript
{
  name: 'project-onboarding',
  description: 'Scan a project directory and generate onboarding documentation. Analyzes package.json, tsconfig.json, and directory structure. Detects frameworks (React, Vue, Express, etc.) and lists real dependencies.',
  // ... input schema
}
```

**agent-orchestrator New Description:**
```typescript
{
  name: 'agent-orchestrator',
  description: 'Orchestrate multi-agent workflows. Actions: list-agents (show available agents), list-workflows (show predefined workflows), handoff (execute single agent), workflow (execute multi-step workflow).',
  // ... input schema
}
```

**Description Guidelines (from SPEC-002):**
1. Start with verb (Switch, Scan, Orchestrate)
2. State actual capability
3. List available options/actions
4. Keep under 200 characters for core description

## Acceptance Criteria

- [ ] mode-switcher description accurate
- [ ] project-onboarding description accurate
- [ ] agent-orchestrator description accurate
- [ ] Descriptions follow SPEC-002 template
- [ ] LLM can correctly select tools

## Files to Modify

- `src/index.ts`

## Verification

```bash
npm run build && npm run test:mcp
```

## References

- [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-017
