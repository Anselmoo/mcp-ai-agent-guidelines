# 🔧 P3-014: Refactor agent-orchestrator Tool [serial]

> **Parent**: #TBD
> **Labels**: `phase-3`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 4 hours
> **Depends On**: P3-011, P3-013
> **Blocks**: P3-016

## Context

The agent-orchestrator MCP tool needs to expose the new orchestration infrastructure.

## Task Description

Refactor agent-orchestrator tool to use new infrastructure:

**Modify/Create `src/tools/agent-orchestrator.ts`:**
```typescript
import { agentOrchestrator, Workflow } from '../agents/orchestrator.js';
import { agentRegistry } from '../agents/registry.js';
import { getWorkflow, listWorkflows } from '../agents/workflows/index.js';
import { createMcpResponse } from './shared/response-utils.js';
import { McpToolError, ErrorCode } from './shared/errors.js';

export type AgentOrchestratorAction = 'handoff' | 'workflow' | 'list-agents' | 'list-workflows';

export interface AgentOrchestratorRequest {
  action: AgentOrchestratorAction;

  // For handoff action
  targetAgent?: string;
  context?: unknown;
  reason?: string;

  // For workflow action
  workflowName?: string;
  workflowInput?: unknown;
}

export async function agentOrchestratorTool(request: AgentOrchestratorRequest) {
  switch (request.action) {
    case 'list-agents':
      return handleListAgents();

    case 'list-workflows':
      return handleListWorkflows();

    case 'handoff':
      return handleHandoff(request);

    case 'workflow':
      return handleWorkflow(request);

    default:
      throw new McpToolError(
        ErrorCode.INVALID_PARAMETER,
        `Unknown action: ${request.action}`,
        { validActions: ['handoff', 'workflow', 'list-agents', 'list-workflows'] }
      );
  }
}

function handleListAgents() {
  const agents = agentRegistry.listAgents();

  const content = `# Available Agents

${agents.map(a => `## ${a.name}

${a.description}

**Capabilities**: ${a.capabilities.join(', ')}
`).join('\n')}
`;

  return createMcpResponse({ content });
}

function handleListWorkflows() {
  const workflowNames = listWorkflows();

  const content = `# Available Workflows

${workflowNames.map(name => {
    const wf = getWorkflow(name);
    return `## ${name}

${wf?.description ?? 'No description'}

**Steps**: ${wf?.steps.map(s => s.agent).join(' → ')}
`;
  }).join('\n')}
`;

  return createMcpResponse({ content });
}

async function handleHandoff(request: AgentOrchestratorRequest) {
  if (!request.targetAgent) {
    throw new McpToolError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'targetAgent is required for handoff action'
    );
  }

  const result = await agentOrchestrator.executeHandoff({
    targetAgent: request.targetAgent,
    context: request.context,
    reason: request.reason,
  });

  if (!result.success) {
    return createMcpResponse({
      isError: true,
      content: `Handoff failed: ${result.error}`,
    });
  }

  return createMcpResponse({
    content: `# Handoff Completed

**Target Agent**: ${request.targetAgent}
**Execution Time**: ${result.executionTime}ms

## Output

${JSON.stringify(result.output, null, 2)}
`,
  });
}

async function handleWorkflow(request: AgentOrchestratorRequest) {
  if (!request.workflowName) {
    throw new McpToolError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'workflowName is required for workflow action'
    );
  }

  const workflow = getWorkflow(request.workflowName);
  if (!workflow) {
    throw new McpToolError(
      ErrorCode.RESOURCE_NOT_FOUND,
      `Workflow not found: ${request.workflowName}`,
      { availableWorkflows: listWorkflows() }
    );
  }

  const result = await agentOrchestrator.executeWorkflow(workflow, request.workflowInput);

  // ... format result
}
```

## Acceptance Criteria

- [ ] Tool calls real AgentOrchestrator
- [ ] Supports `action: 'handoff' | 'workflow' | 'list-agents' | 'list-workflows'`
- [ ] Returns structured results
- [ ] Error handling with ErrorCode
- [ ] Integration test

## Files to Modify

- `src/tools/agent-orchestrator.ts` (or create new)

## Files to Create

- `tests/vitest/tools/agent-orchestrator.integration.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- agent-orchestrator
```

## References

- [SPEC-004: Agent Orchestration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-004-agent-orchestration.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-014
