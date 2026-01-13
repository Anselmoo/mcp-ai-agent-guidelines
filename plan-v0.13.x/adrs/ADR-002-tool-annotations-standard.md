# ADR-002: Tool Annotations Standard

## Status

**Proposed** — January 2026

## Context

The MCP AI Agent Guidelines has 30+ tools with **discoverability issues**:

> *"Your LLM can easily perform the wrong action if the MCP server's tools aren't descriptive, comprehensive, and unique from one another."* — Merge.dev MCP Best Practices

### Current Problems

| Issue                         | Evidence                         | Impact                         |
| ----------------------------- | -------------------------------- | ------------------------------ |
| Verbose, similar descriptions | 94+ uses of "Use this MCP to..." | LLMs can't differentiate tools |
| Missing examples              | Schema properties lack examples  | LLMs guess at formats          |
| No semantic grouping          | Flat list of 30+ tools           | Cognitive overload             |
| Hidden features               | Buried in nested schemas         | Never discovered               |
| No behavior hints             | Unknown if tool is safe          | LLMs avoid or misuse           |

### Example Problem

```typescript
// Current: All tools look the same to LLMs
"Build structured prompts with clear hierarchies..."
"Generate comprehensive code analysis prompts..."
"Create systematic debugging prompts..."
// LLM: "These all seem to build prompts... which one?"
```

### MCP SDK Support

The MCP SDK supports **ToolAnnotations** that hint at tool behavior:

```typescript
interface ToolAnnotations {
  readOnlyHint?: boolean;      // Tool doesn't modify state
  idempotentHint?: boolean;    // Safe to retry
  openWorldHint?: boolean;     // Interacts with external systems
  destructiveHint?: boolean;   // May cause irreversible changes
}
```

## Decision

We will adopt a **Tool Annotations Standard** for all 30+ tools with:

1. **ToolAnnotations** — Behavior hints for all tools
2. **Action-Oriented Descriptions** — Unique, differentiating descriptions
3. **Schema Examples** — Examples for all required parameters
4. **Tool Naming Convention** — `<domain>-<action>` pattern

### 1. ToolAnnotations for All Tools

```typescript
// Analysis tools: read-only, safe to retry
const cleanCodeScorer = {
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
    destructiveHint: false
  }
};

// Design tools: modify session state
const designAssistant = {
  annotations: {
    readOnlyHint: false,       // Modifies session
    idempotentHint: false,     // Session changes
    openWorldHint: false,
    destructiveHint: false
  }
};

// Project onboarding: reads file system
const projectOnboarding = {
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true,       // Reads external files
    destructiveHint: false
  }
};
```

### 2. Action-Oriented Descriptions

**Description Template**:
```
[ACTION VERB] [WHAT IT DOES] with [KEY DIFFERENTIATOR].
BEST FOR: [Use case 1], [Use case 2], [Use case 3].
OUTPUTS: [Output format description].
```

**Before/After Examples**:

| Tool                              | Before                                                                                                                                                      | After                                                                                                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| hierarchical-prompt-builder       | "Build structured prompts with clear hierarchies and layers of specificity. Use this MCP to create prompts with context → goal → requirements hierarchy..." | "Create AI prompts with context→goal→requirements structure. BEST FOR: Code reviews, feature specs, technical decisions. OUTPUTS: Markdown prompt ready for injection."                    |
| clean-code-scorer                 | "Calculate comprehensive Clean Code score ranging from 0 to 100, evaluating various quality metrics..."                                                     | "Score code quality 0-100 with hygiene, coverage, lint metrics. BEST FOR: PR reviews, quality gates, tech debt tracking. OUTPUTS: Numeric score with detailed breakdown."                  |
| security-hardening-prompt-builder | "Build specialized security hardening and vulnerability analysis prompts for AI-guided security assessment..."                                              | "Generate security audit prompts for OWASP/NIST compliance. BEST FOR: Vulnerability scanning, penetration testing, compliance checks. OUTPUTS: Security-focused prompt with threat model." |

### 3. Schema Examples

```typescript
// All required properties MUST have examples
inputSchema: z.object({
  context: z.string()
    .describe("Domain context for the prompt")
    .examples(["React component review", "API security audit", "Database optimization"]),

  goal: z.string()
    .describe("What the prompt should accomplish")
    .examples(["Review for performance issues", "Identify security vulnerabilities"]),

  requirements: z.array(z.string())
    .optional()
    .describe("Specific requirements to include")
    .examples([["Must address XSS", "Consider SQL injection"], ["Focus on N+1 queries"]])
})
```

### 4. Tool Naming Convention

**Pattern**: `<domain>-<action>`

| Domain   | Tools                                              | Pattern      |
| -------- | -------------------------------------------------- | ------------ |
| prompt   | prompt-build, prompt-evaluate, prompt-select-level | `prompt-*`   |
| code     | code-score, code-analyze-hygiene, code-audit-deps  | `code-*`     |
| design   | design-session, design-generate-artifacts          | `design-*`   |
| strategy | strategy-analyze-gaps, strategy-build-frameworks   | `strategy-*` |

### Tool Consolidation

**Overlapping tools to merge**:

| Current                       | After            | Mode Parameter     |
| ----------------------------- | ---------------- | ------------------ |
| hierarchical-prompt-builder   | prompt-hierarchy | `mode: "build"`    |
| hierarchy-level-selector      | prompt-hierarchy | `mode: "select"`   |
| prompting-hierarchy-evaluator | prompt-hierarchy | `mode: "evaluate"` |

**Rationale**: 70% functional overlap confuses LLMs.

## Consequences

### Positive

1. **Discoverability**: LLMs can differentiate tools by unique descriptions
2. **Safety**: Annotations hint at tool behavior before invocation
3. **Usability**: Examples help LLMs construct correct parameters
4. **Consistency**: Naming convention groups related tools
5. **Simplification**: Merged tools reduce cognitive load

### Negative

1. **Migration Effort**: All 30+ tools need updates
2. **Breaking Changes**: Merged tools change API
3. **Maintenance**: Must maintain annotation accuracy

### Neutral

1. **Documentation**: Must document annotation meanings
2. **Testing**: Need to validate annotation accuracy

## Implementation Notes

### Phase 1: Annotations (Week 3)

Add ToolAnnotations to all tools:

```typescript
// Create annotation presets
const ANALYSIS_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
  destructiveHint: false
};

const SESSION_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,
  idempotentHint: false,
  openWorldHint: false,
  destructiveHint: false
};
```

### Phase 2: Descriptions (Week 3)

Rewrite all descriptions following template.

### Phase 3: Examples (Week 4)

Add examples to all required schema properties.

### Phase 4: Consolidation (Week 4)

Merge overlapping prompt tools.

## Related ADRs

- ADR-001: Output Strategy Pattern (affects how tools output)
- ADR-003: Strangler Fig Migration (how we migrate tools)

## References

- [MCP Best Practices - Merge.dev](https://merge.dev/blog/model-context-protocol)
- [cyanheads/mcp-ts-template](https://github.com/cyanheads/mcp-ts-template) — ToolAnnotations example
- [MCP SDK ToolAnnotations](https://spec.modelcontextprotocol.io/specification/server/tools/)

---

*ADR-002 Created: January 2026*
*Status: Proposed*
*Specification: SPEC-002-tool-harmonization.md*
