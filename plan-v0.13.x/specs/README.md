# Specifications Index

> Detailed technical specifications for v0.13.x implementation

## Quick Links

| Spec                                            | Title                                | Phase    | Status |
| ----------------------------------------------- | ------------------------------------ | -------- | ------ |
| [SPEC-001](SPEC-001-output-strategy-layer.md)   | Output Strategy Layer                | Phase 2b | Draft  |
| [SPEC-002](SPEC-002-tool-harmonization.md)      | Tool Harmonization & Discoverability | Phase 1  | Draft  |
| [SPEC-003](SPEC-003-error-handling-refactor.md) | Error Handling Refactor              | Phase 2a | Draft  |
| [SPEC-004](SPEC-004-agent-handoffs.md)          | Agent Handoffs & A2A Chaining        | Phase 4  | Draft  |
| [SPEC-005](SPEC-005-speckit-integration.md)     | Spec-Kit Integration                 | Phase 4  | Draft  |

## Specification Summary

### SPEC-001: Output Strategy Layer

Defines the OutputStrategy pattern that separates domain logic from output formatting. Supports 7 output approaches (chat, RFC, ADR, SDD, SpecKit, TOGAF, Enterprise) with cross-cutting capabilities (workflows, scripts, diagrams).

**Key Components:**
- `OutputStrategy` interface
- 7 strategy implementations
- `CrossCuttingManager`
- `PolyglotGateway`

### SPEC-002: Tool Harmonization & Discoverability

Addresses the LLM tool discoverability crisis by standardizing tool descriptions, adding ToolAnnotations, and consolidating overlapping tools.

**Key Changes:**
- ToolAnnotations on all 30+ tools
- Action-oriented descriptions
- Schema examples
- Consolidation: 3 prompt tools → 1 `prompt-hierarchy`

### SPEC-003: Error Handling Refactor

Implements centralized ErrorCode enum pattern replacing scattered try/catch chains.

**Key Components:**
- `ErrorCode` enum (1xxx-9xxx)
- `McpToolError` class
- Error factory functions
- `handleToolError()` central handler

### SPEC-004: Agent Handoffs & A2A Chaining

Enables agent-to-agent communication for multi-step workflows.

**Key Components:**
- `AgentOrchestrator`
- `HandoffRequest/Result` types
- Pre-defined workflows
- Execution graph logging

### SPEC-005: Spec-Kit Integration

Integrates GitHub Spec-Kit methodology with MCP tools.

**Key Components:**
- `SpecKitStrategy`
- Constitution parser
- Task derivation
- Progress tracking
- Spec validation

## Reading Order

For new contributors:
1. Start with SPEC-002 (Discoverability) — foundational improvements
2. Read SPEC-003 (Error Handling) — infrastructure
3. Continue with SPEC-001 (OutputStrategy) — core architecture
4. Then SPEC-005 (SpecKit) — integration
5. Finally SPEC-004 (Agent Handoffs) — advanced features

## Related Documents

- [ADRs](../adrs/) — Architecture decisions behind these specs
- [Tasks](../tasks/) — Implementation tasks derived from specs
- [CONSTITUTION.md](../CONSTITUTION.md) — Project principles and constraints
- [TIMELINE.md](../TIMELINE.md) — Sprint schedule

---

*Index Updated: January 2026*
