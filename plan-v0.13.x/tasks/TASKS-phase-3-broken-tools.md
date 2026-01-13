# TASKS: Phase 3 — Broken Tools

> Week 9-10 task breakdown for fixing broken/non-functional tools

## 📋 Phase Metadata

| Field         | Value                   |
| ------------- | ----------------------- |
| Phase         | Phase 3                 |
| Name          | Broken Tools            |
| Duration      | 2 weeks (Week 9-10)     |
| Related Spec  | SPEC-002, SPEC-003      |
| Exit Criteria | See TIMELINE.md Phase 3 |

---

## 1. Overview

Phase 3 focuses on fixing the 3 identified broken tools:
1. **mode-switcher** — Returns guidance but doesn't actually change agent state
2. **project-onboarding** — Doesn't scan real directory structures
3. **agent-orchestrator** — Non-functional placeholder

---

## 2. Tool Analysis

### 2.1 mode-switcher

**Current State:**
- Returns text suggesting how to switch modes
- Does not maintain or modify actual agent state
- No persistence of mode across tool calls

**Required Fix:**
- Implement actual state management
- Persist mode selection across session
- Modify tool behavior based on current mode

---

### 2.2 project-onboarding

**Current State:**
- Generates generic onboarding documentation
- Does not actually scan provided project path
- No real file system interaction

**Required Fix:**
- Implement actual directory scanning
- Analyze real package.json, tsconfig.json, etc.
- Generate project-specific documentation

---

### 2.3 agent-orchestrator

**Current State:**
- Placeholder tool with minimal implementation
- No actual agent coordination
- Returns static responses

**Required Fix:**
- Implement agent registration and discovery
- Add handoff protocol (see SPEC-004)
- Enable workflow execution

---

## 3. Task Breakdown

### Week 9: mode-switcher & project-onboarding

#### Task 3.1: Analyze mode-switcher Current Implementation
- **ID**: P3-001
- **Priority**: High
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Audit current mode-switcher implementation:
- Document what it currently does
- Identify gaps vs. expected behavior
- Define state model for modes

**Acceptance Criteria:**
- [ ] Analysis document created
- [ ] State model defined
- [ ] List of required changes

**Files to Analyze:**
- `src/tools/mode-switcher.ts` (or equivalent)

**Files to Create:**
- `docs/analysis/mode-switcher-audit.md`

---

#### Task 3.2: Implement ModeManager Singleton
- **ID**: P3-002
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P3-001

**Description:**
Create singleton to manage agent mode state:
- Track current mode
- Provide mode-specific tool sets
- Handle mode transitions

**Acceptance Criteria:**
- [ ] File: `src/tools/shared/mode-manager.ts`
- [ ] Modes: planning, editing, analysis, debugging, refactoring, documentation
- [ ] getCurrentMode(), setMode(), getToolsForMode()
- [ ] Unit tests

**Files to Create:**
- `src/tools/shared/mode-manager.ts`
- `tests/vitest/shared/mode-manager.spec.ts`

---

#### Task 3.3: Refactor mode-switcher Tool
- **ID**: P3-003
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P3-002

**Description:**
Refactor mode-switcher to actually change state:
- Call ModeManager.setMode()
- Return confirmation of mode change
- Include mode-specific tool recommendations

**Acceptance Criteria:**
- [ ] Tool calls ModeManager
- [ ] Mode persists across calls
- [ ] Returns tools available in new mode
- [ ] Integration test: switch mode → verify state changed

**Files to Modify:**
- `src/tools/mode-switcher.ts`

---

#### Task 3.4: Add Mode-Aware Tool Filtering
- **ID**: P3-004
- **Priority**: Medium
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P3-003

**Description:**
Optionally filter available tools based on current mode.

**Acceptance Criteria:**
- [ ] Tool availability based on mode
- [ ] Feature flag to enable/disable filtering
- [ ] Documentation of mode→tools mapping

**Files to Modify:**
- `src/index.ts`

---

#### Task 3.5: Analyze project-onboarding Current Implementation
- **ID**: P3-005
- **Priority**: High
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Audit current project-onboarding implementation:
- What it generates vs. what it should generate
- File system access patterns
- Expected project structure analysis

**Acceptance Criteria:**
- [ ] Analysis document created
- [ ] Required file system APIs identified
- [ ] Expected output format defined

**Files to Create:**
- `docs/analysis/project-onboarding-audit.md`

---

#### Task 3.6: Implement ProjectScanner
- **ID**: P3-006
- **Priority**: High
- **Estimate**: 6 hours
- **Assignee**: TBD
- **Dependencies**: P3-005

**Description:**
Create service to scan real project directories:
- Read directory structure
- Parse package.json, tsconfig.json, pyproject.toml
- Detect frameworks and languages
- Identify entry points

**Acceptance Criteria:**
- [ ] File: `src/tools/bridge/project-scanner.ts`
- [ ] Scans directory recursively (with limits)
- [ ] Parses config files
- [ ] Returns ProjectStructure type
- [ ] Unit tests with mock file system

**Files to Create:**
- `src/tools/bridge/project-scanner.ts`
- `tests/vitest/bridge/project-scanner.spec.ts`

---

#### Task 3.7: Refactor project-onboarding Tool
- **ID**: P3-007
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P3-006

**Description:**
Refactor project-onboarding to use real scanning:
- Call ProjectScanner
- Generate documentation based on actual project
- Include real file paths and dependencies

**Acceptance Criteria:**
- [ ] Uses ProjectScanner for real data
- [ ] Output includes actual project structure
- [ ] Lists real dependencies from package.json
- [ ] Integration test with sample project

**Files to Modify:**
- `src/tools/project-onboarding.ts`

---

#### Task 3.8: Add ToolAnnotations for Fixed Tools
- **ID**: P3-008
- **Priority**: Medium
- **Estimate**: 1 hour
- **Assignee**: TBD
- **Dependencies**: P3-003, P3-007

**Description:**
Update ToolAnnotations for fixed tools:
- mode-switcher: `readOnlyHint: false`, `idempotentHint: false`
- project-onboarding: `readOnlyHint: true`, `openWorldHint: true`

**Acceptance Criteria:**
- [ ] Annotations match actual behavior
- [ ] Tests pass

**Files to Modify:**
- `src/index.ts`

---

### Week 10: agent-orchestrator & Integration

#### Task 3.9: Design Agent Orchestrator Architecture
- **ID**: P3-009
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: None

**Description:**
Design agent orchestrator based on SPEC-004:
- Agent registration
- Handoff protocol
- Workflow execution model

**Acceptance Criteria:**
- [ ] Architecture design document
- [ ] API surface defined
- [ ] Integration with existing tools mapped

**Files to Create:**
- `docs/design/agent-orchestrator.md`

---

#### Task 3.10: Implement AgentRegistry
- **ID**: P3-010
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P3-009

**Description:**
Create registry for available agents:
- Register tool as agent
- Query agents by capability
- Store agent metadata

**Acceptance Criteria:**
- [ ] File: `src/agents/registry.ts`
- [ ] registerAgent(), getAgent(), queryByCapability()
- [ ] Unit tests

**Files to Create:**
- `src/agents/registry.ts`
- `src/agents/types.ts`
- `tests/vitest/agents/registry.spec.ts`

---

#### Task 3.11: Implement Basic AgentOrchestrator
- **ID**: P3-011
- **Priority**: High
- **Estimate**: 6 hours
- **Assignee**: TBD
- **Dependencies**: P3-010

**Description:**
Implement core orchestrator functionality:
- Execute single handoff
- Pass context between agents
- Return aggregated result

**Acceptance Criteria:**
- [ ] File: `src/agents/orchestrator.ts`
- [ ] executeHandoff() method
- [ ] Context propagation
- [ ] Error handling with ErrorCode
- [ ] Unit tests

**Files to Create:**
- `src/agents/orchestrator.ts`
- `tests/vitest/agents/orchestrator.spec.ts`

---

#### Task 3.12: Create Default Agent Definitions
- **ID**: P3-012
- **Priority**: Medium
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P3-010

**Description:**
Define existing tools as agents:
- clean-code-scorer agent
- security-hardening-prompt-builder agent
- design-assistant agent

**Acceptance Criteria:**
- [ ] File: `src/agents/definitions/index.ts`
- [ ] 3+ agent definitions
- [ ] Registered on server startup

**Files to Create:**
- `src/agents/definitions/index.ts`
- `src/agents/definitions/code-scorer-agent.ts`
- `src/agents/definitions/security-agent.ts`
- `src/agents/definitions/design-agent.ts`

---

#### Task 3.13: Implement Pre-defined Workflows
- **ID**: P3-013
- **Priority**: Medium
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P3-011, P3-012

**Description:**
Create pre-defined multi-agent workflows:
- Code Review Chain (scorer → security → docs)
- Design-to-Spec (design-assistant → spec generation)

**Acceptance Criteria:**
- [ ] File: `src/agents/workflows/index.ts`
- [ ] 2+ workflow definitions
- [ ] Workflows executable via orchestrator
- [ ] Integration tests

**Files to Create:**
- `src/agents/workflows/code-review-chain.ts`
- `src/agents/workflows/design-to-spec.ts`
- `src/agents/workflows/index.ts`

---

#### Task 3.14: Refactor agent-orchestrator Tool
- **ID**: P3-014
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P3-011, P3-013

**Description:**
Refactor agent-orchestrator tool to use new infrastructure:
- Expose orchestrator via MCP tool
- Support handoff and workflow execution
- Proper error handling

**Acceptance Criteria:**
- [ ] Tool calls real AgentOrchestrator
- [ ] Supports action: 'handoff' | 'workflow' | 'list-agents'
- [ ] Returns structured results
- [ ] Integration test

**Files to Modify:**
- `src/tools/agent-orchestrator.ts` (or create new)

---

#### Task 3.15: Add Execution Graph Logging
- **ID**: P3-015
- **Priority**: Low
- **Estimate**: 3 hours
- **Assignee**: TBD
- **Dependencies**: P3-011

**Description:**
Add observability to agent orchestration:
- Log each handoff
- Track execution time
- Generate Mermaid diagram of execution

**Acceptance Criteria:**
- [ ] File: `src/agents/execution-graph.ts`
- [ ] recordHandoff() method
- [ ] toMermaid() method
- [ ] Integrated with orchestrator

**Files to Create:**
- `src/agents/execution-graph.ts`

---

#### Task 3.16: Comprehensive Integration Tests
- **ID**: P3-016
- **Priority**: High
- **Estimate**: 4 hours
- **Assignee**: TBD
- **Dependencies**: P3-003, P3-007, P3-014

**Description:**
Create integration tests for all three fixed tools.

**Acceptance Criteria:**
- [ ] mode-switcher: mode changes persist
- [ ] project-onboarding: scans real test project
- [ ] agent-orchestrator: executes simple workflow
- [ ] All tests in CI

**Files to Create:**
- `tests/vitest/integration/fixed-tools.spec.ts`

---

#### Task 3.17: Update Tool Descriptions
- **ID**: P3-017
- **Priority**: Medium
- **Estimate**: 1 hour
- **Assignee**: TBD
- **Dependencies**: P3-003, P3-007, P3-014

**Description:**
Update descriptions to reflect actual functionality.

**Acceptance Criteria:**
- [ ] Descriptions accurate
- [ ] Follow template from SPEC-002
- [ ] LLM can correctly select tools

**Files to Modify:**
- `src/index.ts`

---

#### Task 3.18: Documentation Update
- **ID**: P3-018
- **Priority**: Medium
- **Estimate**: 2 hours
- **Assignee**: TBD
- **Dependencies**: P3-016

**Description:**
Update documentation for fixed tools:
- Usage examples
- API reference
- Migration notes if behavior changed

**Files to Modify:**
- `README.md`
- `docs/tools/mode-switcher.md`
- `docs/tools/project-onboarding.md`
- `docs/tools/agent-orchestrator.md`

---

## 4. Exit Criteria Checklist

From TIMELINE.md Phase 3:

- [ ] mode-switcher actually changes agent state
- [ ] project-onboarding scans real directories
- [ ] agent-orchestrator executes workflows
- [ ] All 3 tools have accurate descriptions
- [ ] All 3 tools have correct ToolAnnotations
- [ ] Integration tests passing

---

## 5. Risk Mitigation

| Risk                           | Mitigation                                |
| ------------------------------ | ----------------------------------------- |
| File system access security    | Limit scanning depth, validate paths      |
| Mode state persistence         | In-memory singleton, document limitations |
| Agent orchestration complexity | Start with simple sequential execution    |

---

## 6. Definition of Done

A task is complete when:
1. Code changes are merged to main
2. Unit and integration tests pass
3. Tool behaves as described in description
4. ToolAnnotations accurately reflect behavior
5. Documentation updated
6. No regressions in existing functionality

---

*Tasks Created: January 2026*
*Last Updated: January 2026*
