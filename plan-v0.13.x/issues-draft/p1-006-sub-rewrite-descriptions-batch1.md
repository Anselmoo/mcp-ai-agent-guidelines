# 🔧 P1-007: Rewrite Tool Descriptions — Batch 1 (Core Tools) [serial]

> **Labels**: `phase-1`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M2: Discoverability
> **Estimate**: 4 hours
> **Blocked by**: P1-006

## Context

Tool descriptions must follow a consistent template to maximize LLM discoverability. Current descriptions often start with "Use this MCP to..." which provides poor differentiation.

## Task Description

Rewrite descriptions for the 5 most-used tools following the template:

**Template:**
```
[ACTION VERB] [WHAT IT DOES] for [PURPOSE].
BEST FOR: [2-3 use cases].
OUTPUTS: [format description].
```

**Batch 1 Tools:**
1. `hierarchical-prompt-builder`
2. `clean-code-scorer`
3. `design-assistant`
4. `security-hardening-prompt-builder`
5. `dependency-auditor`

## Acceptance Criteria

- [ ] 5 tools have new descriptions
- [ ] All descriptions follow template format
- [ ] First 10 words unique across all tools
- [ ] Character count < 200 per description
- [ ] Build passes
- [ ] Tests pass

## Files to Change

| Action | Path |
|--------|------|
| Modify | `src/index.ts` |

## Proposed Descriptions

### 1. hierarchical-prompt-builder
**Before:**
> "Build structured prompts with clear hierarchies and layers of specificity. Use this MCP to create prompts with context → goal → requirements hierarchy..."

**After:**
> "Create AI prompts with context→goal→requirements hierarchy. BEST FOR: code reviews, feature specs, technical decisions. OUTPUTS: Markdown prompt ready for LLM injection."

---

### 2. clean-code-scorer
**Before:**
> "Get a Clean Code score for your codebase ranging from 0-100. Use this MCP to calculate overall code quality metrics..."

**After:**
> "Calculate code quality score (0-100) with metric breakdown. BEST FOR: code reviews, refactoring decisions, CI quality gates. OUTPUTS: Score, metrics table, improvement suggestions."

---

### 3. design-assistant
**Before:**
> "Manage multi-phase design sessions with constraint validation and artifact generation. Use this MCP to orchestrate design workflows..."

**After:**
> "Orchestrate multi-phase design sessions with ADR/spec generation. BEST FOR: architecture decisions, feature design, technical planning. OUTPUTS: ADRs, specifications, roadmaps."

---

### 4. security-hardening-prompt-builder
**Before:**
> "Generate prompts for security assessments based on application context. Use this MCP to create security-focused prompts..."

**After:**
> "Generate OWASP-aligned security assessment prompts. BEST FOR: threat modeling, security audits, compliance checks. OUTPUTS: Security prompt with threat matrix."

---

### 5. dependency-auditor
**Before:**
> "Audit project dependencies for security vulnerabilities and deprecated packages. Use this MCP to analyze package.json..."

**After:**
> "Audit dependencies for vulnerabilities and deprecations. BEST FOR: security scans, upgrade planning, CI/CD gates. OUTPUTS: Vulnerability report, upgrade recommendations."

## Implementation Hints

```typescript
// In src/index.ts, find and update description strings
server.tool(
  'hierarchical-prompt-builder',
  'Create AI prompts with context→goal→requirements hierarchy. BEST FOR: code reviews, feature specs, technical decisions. OUTPUTS: Markdown prompt ready for LLM injection.',
  // ... rest unchanged
);
```

Use `mcp_serena_search_for_pattern` to find each tool's registration.

## Testing Strategy

```bash
# Build and test
npm run build
npm run test:vitest

# Manual check: ensure first 10 words are unique
grep -E "server.tool\(" src/index.ts | head -20
```

## Dependencies

- **Blocked by**: P1-006 (CSV analysis helps prioritize)
- **Blocks**: P1-008

## References

- [SPEC-002: Tool Harmonization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-harmonization.md#description-template)
- Exported CSV from P1-006
