# 🔧 P3-018: Documentation Update for Phase 3 [serial]

> **Parent**: #697
> **Labels**: `phase-3`, `priority-medium`, `serial`, `copilot-suitable`
> **Milestone**: M4: Broken Tools
> **Estimate**: 2 hours
> **Depends On**: P3-016

## Context

After fixing all three broken tools, documentation needs to be updated with usage examples and API reference.

## Task Description

Update documentation for fixed tools:

**Create/Update `docs/tools/mode-switcher.md`:**
```markdown
# mode-switcher

Switch the agent operating mode to optimize tool recommendations for your current task.

## Usage

\`\`\`typescript
// Switch to planning mode
await callTool('mode-switcher', {
  targetMode: 'planning',
  reason: 'Starting new feature design',
});

// Check current mode matches expectation
await callTool('mode-switcher', {
  targetMode: 'editing',
  currentMode: 'planning', // Will error if mismatch
});
\`\`\`

## Available Modes

| Mode | Description | Recommended Tools |
|------|-------------|-------------------|
| planning | Design and architecture work | design-assistant, architecture-design-prompt-builder |
| editing | Code writing and modification | hierarchical-prompt-builder, code-analysis-prompt-builder |
| analysis | Code review and quality checks | clean-code-scorer, code-hygiene-analyzer |
| debugging | Troubleshooting and fixes | debugging-assistant-prompt-builder |
| refactoring | Code improvement | clean-code-scorer, code-analysis-prompt-builder |
| documentation | Docs and comments | documentation-generator-prompt-builder, mermaid-diagram-generator |
| interactive | All tools available | * |
| one-shot | Single task completion | * |

## State Persistence

Mode persists across tool calls within a session. Use `modeManager.getHistory()` to see transition history.
```

**Create/Update `docs/tools/project-onboarding.md`:**
```markdown
# project-onboarding

Scan a real project directory and generate comprehensive onboarding documentation.

## Usage

\`\`\`typescript
const result = await callTool('project-onboarding', {
  projectPath: '/path/to/project',
  includeDetailedStructure: true,
  focusAreas: ['dependencies', 'scripts', 'frameworks'],
});
\`\`\`

## Output

- Project name and type
- Detected frameworks (React, Vue, Express, Next.js, etc.)
- Entry points
- Dependencies (from package.json)
- Available npm scripts
- Directory structure (optional)

## Supported Project Types

- TypeScript/JavaScript (package.json, tsconfig.json)
- Python (pyproject.toml, requirements.txt)
- Go (go.mod)
- Rust (Cargo.toml)
```

**Create/Update `docs/tools/agent-orchestrator.md`:**
```markdown
# agent-orchestrator

Orchestrate multi-agent workflows for complex tasks.

## Actions

### list-agents
\`\`\`typescript
await callTool('agent-orchestrator', { action: 'list-agents' });
\`\`\`

### list-workflows
\`\`\`typescript
await callTool('agent-orchestrator', { action: 'list-workflows' });
\`\`\`

### handoff
\`\`\`typescript
await callTool('agent-orchestrator', {
  action: 'handoff',
  targetAgent: 'code-scorer',
  context: { projectPath: '/path/to/project' },
});
\`\`\`

### workflow
\`\`\`typescript
await callTool('agent-orchestrator', {
  action: 'workflow',
  workflowName: 'code-review-chain',
  workflowInput: { projectPath: '/path/to/project' },
});
\`\`\`

## Available Workflows

- **code-review-chain**: code-scorer → security-analyzer → documentation-generator
- **design-to-spec**: Complete design workflow from discovery to specification
```

## Acceptance Criteria

- [ ] `docs/tools/mode-switcher.md` created/updated
- [ ] `docs/tools/project-onboarding.md` created/updated
- [ ] `docs/tools/agent-orchestrator.md` created/updated
- [ ] Usage examples accurate
- [ ] API reference complete
- [ ] Migration notes if behavior changed

## Files to Create/Modify

- `docs/tools/mode-switcher.md`
- `docs/tools/project-onboarding.md`
- `docs/tools/agent-orchestrator.md`
- `README.md` (update tool list section)
- `CHANGELOG.md`

## Verification

```bash
# Verify files exist
ls docs/tools/

# Verify examples work
npm run build && npm run test:demo
```

## References

- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-018
