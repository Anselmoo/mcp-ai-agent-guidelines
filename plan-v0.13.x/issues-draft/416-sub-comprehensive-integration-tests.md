# 🔧 P3-016: Comprehensive Integration Tests [serial]

> **Parent**: [003-parent-phase3-broken-tools.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/003-parent-phase3-broken-tools.md)
> **Labels**: `phase-3`, `priority-high`, `serial`, `copilot-suitable`
> **Milestone**: M4: Broken Tools
> **Estimate**: 4 hours
> **Depends On**: P3-003, P3-007, P3-014

## Context

Integration tests validate that all three fixed tools work correctly end-to-end.

## Task Description

Create integration tests for all three fixed tools:

**Create `tests/vitest/integration/fixed-tools.spec.ts`:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { modeManager } from '../../../src/tools/shared/mode-manager.js';
import { modeSwitcher } from '../../../src/tools/mode-switcher.js';
import { projectOnboarding } from '../../../src/tools/project-onboarding.js';
import { agentOrchestratorTool } from '../../../src/tools/agent-orchestrator.js';
import * as path from 'node:path';

describe('Fixed Tools Integration', () => {
  describe('mode-switcher', () => {
    beforeEach(() => {
      modeManager.reset();
    });

    it('actually changes mode state', async () => {
      // Initial state
      expect(modeManager.getCurrentMode()).toBe('interactive');

      // Switch mode
      const result = await modeSwitcher({
        targetMode: 'planning',
        reason: 'Starting design phase',
      });

      // Verify state changed
      expect(modeManager.getCurrentMode()).toBe('planning');
      expect(result.content[0].text).toContain('Mode Switched Successfully');
      expect(result.content[0].text).toContain('planning');
    });

    it('persists mode across calls', async () => {
      await modeSwitcher({ targetMode: 'debugging' });

      // Second call should see the new mode
      const result = await modeSwitcher({
        targetMode: 'refactoring',
        currentMode: 'debugging', // Validate current mode
      });

      expect(result.isError).toBeFalsy();
      expect(modeManager.getCurrentMode()).toBe('refactoring');
    });

    it('records transition history', async () => {
      await modeSwitcher({ targetMode: 'analysis' });
      await modeSwitcher({ targetMode: 'editing' });

      const history = modeManager.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].from).toBe('interactive');
      expect(history[0].to).toBe('analysis');
    });
  });

  describe('project-onboarding', () => {
    it('scans real project directory', async () => {
      const projectPath = path.resolve(__dirname, '../../../');

      const result = await projectOnboarding({ projectPath });

      // Should contain real project info
      expect(result.content[0].text).toContain('mcp-ai-agent-guidelines');
      expect(result.content[0].text).toContain('typescript');
      expect(result.content[0].text).toContain('vitest'); // Framework detection
    });

    it('includes real dependencies', async () => {
      const projectPath = path.resolve(__dirname, '../../../');

      const result = await projectOnboarding({ projectPath });

      // Should list actual dependencies
      expect(result.content[0].text).toContain('@modelcontextprotocol/sdk');
      expect(result.content[0].text).toContain('zod');
    });

    it('shows available scripts', async () => {
      const projectPath = path.resolve(__dirname, '../../../');

      const result = await projectOnboarding({ projectPath });

      expect(result.content[0].text).toContain('npm run build');
      expect(result.content[0].text).toContain('npm run test');
    });
  });

  describe('agent-orchestrator', () => {
    it('lists available agents', async () => {
      const result = await agentOrchestratorTool({
        action: 'list-agents',
      });

      expect(result.content[0].text).toContain('code-scorer');
      expect(result.content[0].text).toContain('security-analyzer');
    });

    it('lists available workflows', async () => {
      const result = await agentOrchestratorTool({
        action: 'list-workflows',
      });

      expect(result.content[0].text).toContain('code-review-chain');
    });

    it('executes simple handoff', async () => {
      const result = await agentOrchestratorTool({
        action: 'handoff',
        targetAgent: 'code-scorer',
        context: { coverageMetrics: { lineCoverage: 80 } },
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Handoff Completed');
    });
  });
});
```

## Acceptance Criteria

- [ ] Test file: `tests/vitest/integration/fixed-tools.spec.ts`
- [ ] mode-switcher: mode changes persist
- [ ] mode-switcher: history is recorded
- [ ] project-onboarding: scans this repository
- [ ] project-onboarding: detects real dependencies
- [ ] agent-orchestrator: lists agents and workflows
- [ ] agent-orchestrator: executes handoff
- [ ] All tests in CI

## Files to Create

- `tests/vitest/integration/fixed-tools.spec.ts`

## Verification

```bash
npm run test:vitest -- fixed-tools
```

## References

- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-016
