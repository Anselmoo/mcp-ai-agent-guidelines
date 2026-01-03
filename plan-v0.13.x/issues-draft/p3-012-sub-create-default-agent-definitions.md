# 🔧 P3-012: Create Default Agent Definitions [parallel]

> **Parent**: #TBD
> **Labels**: `phase-3`, `priority-medium`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 3 hours
> **Depends On**: P3-010
> **Blocks**: P3-013

## Context

Existing tools should be registered as agents to enable orchestration workflows.

## Task Description

Define existing tools as agents:

**Create `src/agents/definitions/code-scorer-agent.ts`:**
```typescript
import type { AgentDefinition } from '../types.js';

export const codeScorerAgent: AgentDefinition = {
  name: 'code-scorer',
  description: 'Analyzes code quality and returns a 0-100 clean code score with breakdown by category',
  capabilities: ['code-analysis', 'quality-metrics', 'scoring'],
  toolName: 'clean-code-scorer',
  inputSchema: {
    type: 'object',
    properties: {
      coverageMetrics: {
        type: 'object',
        properties: {
          lineCoverage: { type: 'number' },
          branchCoverage: { type: 'number' },
          functionCoverage: { type: 'number' },
        },
      },
      projectPath: { type: 'string' },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      overallScore: { type: 'number' },
      breakdown: { type: 'object' },
      recommendations: { type: 'array' },
    },
  },
};
```

**Create `src/agents/definitions/security-agent.ts`:**
```typescript
import type { AgentDefinition } from '../types.js';

export const securityAgent: AgentDefinition = {
  name: 'security-analyzer',
  description: 'Generates security analysis prompts with OWASP/NIST compliance checks',
  capabilities: ['security', 'compliance', 'owasp', 'prompt-generation'],
  toolName: 'security-hardening-prompt-builder',
  inputSchema: {
    type: 'object',
    properties: {
      codeContext: { type: 'string' },
      analysisType: { type: 'string', enum: ['owasp', 'nist', 'general'] },
      complianceFrameworks: { type: 'array', items: { type: 'string' } },
    },
    required: ['codeContext'],
  },
};
```

**Create `src/agents/definitions/design-agent.ts`:**
```typescript
import type { AgentDefinition } from '../types.js';

export const designAgent: AgentDefinition = {
  name: 'design-assistant',
  description: 'Orchestrates multi-phase design workflows with constraint validation',
  capabilities: ['design', 'architecture', 'specification', 'planning'],
  toolName: 'design-assistant',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string' },
      sessionId: { type: 'string' },
      config: { type: 'object' },
    },
    required: ['action', 'sessionId'],
  },
};
```

**Create `src/agents/definitions/index.ts`:**
```typescript
import { agentRegistry } from '../registry.js';
import { codeScorerAgent } from './code-scorer-agent.js';
import { securityAgent } from './security-agent.js';
import { designAgent } from './design-agent.js';

export const defaultAgents = [
  codeScorerAgent,
  securityAgent,
  designAgent,
];

export function registerDefaultAgents(): void {
  for (const agent of defaultAgents) {
    agentRegistry.registerAgent(agent);
  }
}
```

## Acceptance Criteria

- [ ] File: `src/agents/definitions/code-scorer-agent.ts`
- [ ] File: `src/agents/definitions/security-agent.ts`
- [ ] File: `src/agents/definitions/design-agent.ts`
- [ ] File: `src/agents/definitions/index.ts` with registration
- [ ] 3+ agent definitions
- [ ] Agents registered on server startup

## Files to Create

- `src/agents/definitions/code-scorer-agent.ts`
- `src/agents/definitions/security-agent.ts`
- `src/agents/definitions/design-agent.ts`
- `src/agents/definitions/index.ts`

## Files to Modify

- `src/index.ts` — Call `registerDefaultAgents()` on startup

## Verification

```bash
npm run build && npm run test:vitest -- definitions
```

## References

- [SPEC-004: Agent Orchestration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-004-agent-orchestration.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-012
