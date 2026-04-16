# MCP AI Agent Guidelines — Philosophy & Architecture

## The "Software Evangelist" Mandate
In the modern AI agent architecture, humans are the bottleneck and the carriers of emotional legacy debt. The primary tenet of the Guidelines orchestration is **Radical Forward Movement**.
- **No Anti-Bodies:** Every dependency is a first-class citizen (e.g., Zod, AI SDK, TOON). If an integration requires duct tape, it's rejected.
- **Autonomous Loops:** The agent ecosystem operates on state machines where failing tests directly throw back to debug loops automatically. Humans do not babysit test runners.
- **Unbiased Architectural Review:** Physics and Metaphor analyses (QM/GR) strip subjective arguments out of coupling disputes.

## Zero Legacy Debt
Code is continuously evaluated. Any module detected with high `spacetime_debt` or `event-horizon` metrics by the `QM/GR` pipelines is refactored without asking for permission.

## Implementation over Intuition
Code remains the source of truth, but the current binding is narrower than the docs previously implied. Implemented workflow state handling lives in `src/infrastructure/state-machine-orchestration.ts`, with machine-readable workflow specs in `src/workflows/workflow-spec.ts`. The current docs contract verifies that each implemented workflow has Markdown/JSON docs and that workflow specs can render Mermaid state diagrams; it does not prove that every hand-written Mermaid diagram in `docs/workflows/` is a one-to-one executable `xstate` machine.
