# 🔧 P1-008: Rewrite Tool Descriptions — Batch 2 (Prompt Builders) [serial]

> **Parent**: #695
> **Labels**: `phase-1`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M2: Discoverability
> **Estimate**: 4 hours
> **Blocked by**: P1-007

## Context

Continuing description rewrites for prompt builder tools that have significant overlap and need clear differentiation.

## Task Description

Rewrite descriptions for prompt builder batch 2:

1. `code-analysis-prompt-builder`
2. `debugging-assistant-prompt-builder`
3. `architecture-design-prompt-builder`
4. `documentation-generator-prompt-builder`
5. `domain-neutral-prompt-builder`

## Acceptance Criteria

- [ ] 5 tools have new descriptions
- [ ] Clear differentiation from Batch 1 prompt tools
- [ ] All follow template format
- [ ] Character count < 200

## Proposed Descriptions

### 1. code-analysis-prompt-builder
> "Generate targeted code review prompts for specific quality concerns. BEST FOR: security reviews, performance audits, refactoring analysis. OUTPUTS: Review checklist prompt."

### 2. debugging-assistant-prompt-builder
> "Create systematic debugging prompts with hypothesis generation. BEST FOR: root cause analysis, bug reproduction, error investigation. OUTPUTS: Debug workflow prompt."

### 3. architecture-design-prompt-builder
> "Generate architecture design prompts scaled to project size. BEST FOR: system design, microservices planning, tech stack decisions. OUTPUTS: Architecture prompt with constraints."

### 4. documentation-generator-prompt-builder
> "Create documentation prompts for various doc types. BEST FOR: API docs, user guides, README generation. OUTPUTS: Documentation template prompt."

### 5. domain-neutral-prompt-builder
> "Build prompts from objectives without domain assumptions. BEST FOR: cross-domain tasks, general guidance, flexible workflows. OUTPUTS: Adaptable prompt structure."

## Files to Change

| Action | Path |
|--------|------|
| Modify | `src/index.ts` |

## Dependencies

- **Blocked by**: P1-007
- **Blocks**: P1-009

## References

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md#description-template)
