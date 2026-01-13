# SPEC-002: Tool Harmonization & Discoverability

> Technical specification for improving LLM tool discovery and consolidating overlapping tools

## 📋 Document Metadata

| Field         | Value                                                   |
| ------------- | ------------------------------------------------------- |
| Specification | SPEC-002                                                |
| Title         | Tool Harmonization & Discoverability                    |
| Status        | Draft                                                   |
| Created       | January 2026                                            |
| Related ADR   | [ADR-002](../adrs/ADR-002-tool-annotations-standard.md) |
| Phase         | Phase 1 (Discoverability)                               |

---

## 1. Executive Summary

This specification addresses the **LLM tool discoverability crisis** where 30+ tools have similar, verbose descriptions that prevent LLMs from selecting the correct tool. The solution includes action-oriented descriptions, ToolAnnotations for all tools, schema examples, and consolidation of overlapping tools.

## 2. Problem Statement

### 2.1 Current State

> *"Your LLM can easily perform the wrong action if the MCP server's tools aren't descriptive, comprehensive, and unique from one another."* — Merge.dev MCP Best Practices

| Issue                         | Evidence                         | Impact                   |
| ----------------------------- | -------------------------------- | ------------------------ |
| Verbose, similar descriptions | 94+ uses of "Use this MCP to..." | LLMs can't differentiate |
| Missing examples              | Schema properties lack examples  | LLMs guess at formats    |
| No semantic grouping          | Flat list of 30+ tools           | Cognitive overload       |
| Hidden features               | Buried in nested schemas         | Never discovered         |
| No behavior hints             | Unknown if tool is safe          | LLMs avoid or misuse     |

### 2.2 Example Problem

```typescript
// CURRENT: All tools look the same to LLMs
"Build structured prompts with clear hierarchies..."  // hierarchical-prompt-builder
"Generate comprehensive code analysis prompts..."      // code-analysis-prompt-builder
"Create systematic debugging prompts..."               // debugging-assistant-prompt-builder
// LLM: "These all seem to build prompts... which one?"
```

---

## 3. Goals & Non-Goals

### 3.1 Goals

1. **Unique, action-oriented descriptions** — LLMs can differentiate tools instantly
2. **ToolAnnotations for all tools** — Behavior hints (read-only, idempotent, etc.)
3. **Schema examples** — Required parameters have usage examples
4. **Tool consolidation** — Merge overlapping tools into unified interfaces
5. **Naming convention** — `<domain>-<action>` pattern for all tools

### 3.2 Non-Goals

- Removing tools entirely (only consolidating overlapping ones)
- Changing core tool functionality
- Adding new tools in this phase

---

## 4. Technical Specification

### 4.1 ToolAnnotations Standard

All tools must include MCP SDK `ToolAnnotations`:

```typescript
interface ToolAnnotations {
  readOnlyHint?: boolean;      // Tool doesn't modify state
  idempotentHint?: boolean;    // Safe to retry
  openWorldHint?: boolean;     // Interacts with external systems
  destructiveHint?: boolean;   // May cause irreversible changes
}
```

#### Annotation Presets

```typescript
// src/tools/shared/annotation-presets.ts

/**
 * Analysis tools: read-only, safe to retry
 */
export const ANALYSIS_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
  destructiveHint: false,
};

/**
 * Session tools: modify session state
 */
export const SESSION_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,
  idempotentHint: false,
  openWorldHint: false,
  destructiveHint: false,
};

/**
 * File system tools: read external files
 */
export const FILESYSTEM_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: true,
  destructiveHint: false,
};

/**
 * Generation tools: produce artifacts
 */
export const GENERATION_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
  destructiveHint: false,
};
```

#### Tool Annotation Assignments

| Tool                          | Annotation Preset             | Justification      |
| ----------------------------- | ----------------------------- | ------------------ |
| `clean-code-scorer`           | `ANALYSIS_TOOL_ANNOTATIONS`   | Read-only analysis |
| `code-hygiene-analyzer`       | `ANALYSIS_TOOL_ANNOTATIONS`   | Read-only analysis |
| `hierarchical-prompt-builder` | `GENERATION_TOOL_ANNOTATIONS` | Produces output    |
| `design-assistant`            | `SESSION_TOOL_ANNOTATIONS`    | Modifies session   |
| `project-onboarding`          | `FILESYSTEM_TOOL_ANNOTATIONS` | Reads file system  |
| `dependency-auditor`          | `ANALYSIS_TOOL_ANNOTATIONS`   | Analyzes packages  |

### 4.2 Description Template

All tool descriptions must follow this template:

```
[ACTION VERB] [WHAT IT DOES] with [KEY DIFFERENTIATOR].
BEST FOR: [Use case 1], [Use case 2], [Use case 3].
OUTPUTS: [Output format description].
```

#### Before/After Examples

| Tool                                | Before                                                                                                                                                                                                                                                                                                                                                                             | After                                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hierarchical-prompt-builder`       | "Build structured prompts with clear hierarchies and layers of specificity. Use this MCP to create prompts with context → goal → requirements hierarchy, supporting multiple prompting techniques (chain-of-thought, few-shot, etc.). Example: 'Use the hierarchical-prompt-builder MCP to create a code review prompt for React components focusing on performance optimization'" | "Create AI prompts with context→goal→requirements structure. BEST FOR: Code reviews, feature specs, technical decisions. OUTPUTS: Markdown prompt ready for injection."                    |
| `clean-code-scorer`                 | "Calculate comprehensive Clean Code score ranging from 0 to 100, evaluating various quality metrics such as code hygiene, test coverage, linting, documentation, and security. This score serves as a benchmark for developers to assess the quality of their code and identify areas for improvement."                                                                            | "Score code quality 0-100 with hygiene, coverage, lint metrics. BEST FOR: PR reviews, quality gates, tech debt tracking. OUTPUTS: Numeric score with detailed breakdown."                  |
| `security-hardening-prompt-builder` | "Build specialized security hardening and vulnerability analysis prompts for AI-guided security assessment with OWASP Top 10, NIST, and compliance framework support. Use this MCP to create comprehensive security analysis prompts with threat modeling and compliance checks."                                                                                                  | "Generate security audit prompts for OWASP/NIST compliance. BEST FOR: Vulnerability scanning, penetration testing, compliance checks. OUTPUTS: Security-focused prompt with threat model." |

### 4.3 Schema Examples

All required parameters must include examples:

```typescript
// BEFORE: No examples
inputSchema: z.object({
  context: z.string().describe("Domain context for the prompt"),
  goal: z.string().describe("What the prompt should accomplish"),
});

// AFTER: With examples
inputSchema: z.object({
  context: z.string()
    .describe("Domain context for the prompt")
    .examples([
      "React component review",
      "API security audit",
      "Database optimization"
    ]),

  goal: z.string()
    .describe("What the prompt should accomplish")
    .examples([
      "Review for performance issues",
      "Identify security vulnerabilities",
      "Find N+1 query problems"
    ]),
});
```

### 4.4 Tool Consolidation

#### Prompt Tools Consolidation

**Current State**: 3 overlapping tools with 70%+ functional overlap

| Current Tool                    | Function         | Lines |
| ------------------------------- | ---------------- | ----- |
| `hierarchical-prompt-builder`   | Build prompts    | ~400  |
| `hierarchy-level-selector`      | Select level     | ~200  |
| `prompting-hierarchy-evaluator` | Evaluate prompts | ~300  |

**Target State**: 1 unified tool with `mode` parameter

```typescript
// src/tools/prompt/prompt-hierarchy.ts

export interface PromptHierarchyInput {
  mode: 'build' | 'select' | 'evaluate';

  // Build mode inputs
  context?: string;
  goal?: string;
  requirements?: string[];

  // Select mode inputs
  taskDescription?: string;
  taskComplexity?: 'simple' | 'moderate' | 'complex';
  agentCapability?: 'novice' | 'intermediate' | 'advanced' | 'expert';

  // Evaluate mode inputs
  promptText?: string;
  targetLevel?: HierarchyLevel;
}

export function promptHierarchy(input: PromptHierarchyInput): PromptHierarchyOutput {
  switch (input.mode) {
    case 'build':
      return buildHierarchicalPrompt(input);
    case 'select':
      return selectHierarchyLevel(input);
    case 'evaluate':
      return evaluatePrompt(input);
  }
}
```

**Migration Path**:

1. Create new `prompt-hierarchy` tool
2. Deprecate old tools with warnings
3. Update documentation with migration guide
4. Remove deprecated tools in v0.14.0

### 4.5 Naming Convention

**Pattern**: `<domain>-<action>` or `<domain>-<noun>` for consolidated tools

| Domain   | Current Tools                                                                        | New Name                            |
| -------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| prompt   | hierarchical-prompt-builder, hierarchy-level-selector, prompting-hierarchy-evaluator | `prompt-hierarchy`                  |
| code     | clean-code-scorer, code-hygiene-analyzer                                             | Keep separate (different functions) |
| design   | design-assistant                                                                     | Keep (already consolidated)         |
| strategy | strategy-frameworks-builder, gap-frameworks-analyzers                                | Keep separate (different functions) |

---

## 5. Implementation Plan

### 5.1 Phase 1a: Add ToolAnnotations (Week 3)

**Files to modify**: `src/index.ts` (add annotations to all tool registrations)

```typescript
// Example modification in src/index.ts
server.tool(
  'clean-code-scorer',
  'Score code quality 0-100 with hygiene, coverage, lint metrics. BEST FOR: PR reviews, quality gates, tech debt tracking. OUTPUTS: Numeric score with detailed breakdown.',
  cleanCodeScorerSchema,
  ANALYSIS_TOOL_ANNOTATIONS,  // ADD THIS
  async (args) => { /* ... */ }
);
```

**Checklist**:
- [ ] Create `src/tools/shared/annotation-presets.ts`
- [ ] Add annotations to all 30+ tools in `src/index.ts`
- [ ] Update tool registration helper if exists

### 5.2 Phase 1b: Rewrite Descriptions (Week 3)

**Files to modify**: `src/index.ts` (all tool description strings)

**Process**:
1. Export current descriptions to CSV
2. Rewrite each following template
3. Verify uniqueness (no two tools have similar first 10 words)
4. Update in codebase

**Checklist**:
- [ ] Rewrite 30+ tool descriptions
- [ ] Verify uniqueness with script
- [ ] Update tests if they assert on descriptions

### 5.3 Phase 1c: Add Schema Examples (Week 4)

**Files to modify**: All tool schema files in `src/tools/*/`

**Checklist**:
- [ ] Add examples to `hierarchical-prompt-builder` schema
- [ ] Add examples to `clean-code-scorer` schema
- [ ] Add examples to `security-hardening-prompt-builder` schema
- [ ] Add examples to all other tools with required params
- [ ] Update Zod schemas to use `.examples()`

### 5.4 Phase 1d: Consolidate Overlapping Tools (Week 4)

**Files to create/modify**:
- Create: `src/tools/prompt/prompt-hierarchy.ts`
- Modify: `src/index.ts` (register new, deprecate old)
- Modify: Existing tool files (add deprecation warnings)

**Checklist**:
- [ ] Create `prompt-hierarchy.ts` with mode parameter
- [ ] Extract shared logic from 3 existing tools
- [ ] Add deprecation warnings to old tools
- [ ] Update barrel exports
- [ ] Update tests

---

## 6. Testing Strategy

### 6.1 Description Uniqueness Test

```typescript
// tests/vitest/discoverability/unique-descriptions.spec.ts
describe('Tool Description Uniqueness', () => {
  it('no two tools share similar description starts', () => {
    const tools = getAllToolDefinitions();
    const firstWords = tools.map(t =>
      t.description.split(' ').slice(0, 5).join(' ')
    );

    const uniqueFirstWords = new Set(firstWords);
    expect(uniqueFirstWords.size).toBe(firstWords.length);
  });

  it('all descriptions follow template', () => {
    const tools = getAllToolDefinitions();
    const templatePattern = /^[A-Z][a-z]+ .+ (with|for|using) .+\. BEST FOR: .+\. OUTPUTS: .+\.$/;

    for (const tool of tools) {
      expect(tool.description).toMatch(templatePattern);
    }
  });
});
```

### 6.2 Annotation Coverage Test

```typescript
// tests/vitest/discoverability/annotations.spec.ts
describe('Tool Annotations', () => {
  it('all tools have annotations', () => {
    const tools = getAllToolDefinitions();

    for (const tool of tools) {
      expect(tool.annotations).toBeDefined();
      expect(tool.annotations.readOnlyHint).toBeDefined();
    }
  });
});
```

### 6.3 Schema Examples Test

```typescript
// tests/vitest/discoverability/schema-examples.spec.ts
describe('Schema Examples', () => {
  it('required parameters have examples', () => {
    const tools = getAllToolDefinitions();

    for (const tool of tools) {
      const schema = tool.inputSchema;
      const requiredProps = getRequiredProperties(schema);

      for (const prop of requiredProps) {
        expect(prop.examples).toBeDefined();
        expect(prop.examples.length).toBeGreaterThan(0);
      }
    }
  });
});
```

---

## 7. LLM Discoverability Testing

### 7.1 Test Matrix

| Scenario                              | Expected Tool                 | Alternative Tools                   |
| ------------------------------------- | ----------------------------- | ----------------------------------- |
| "Review my code for quality"          | `clean-code-scorer`           | `code-hygiene-analyzer`             |
| "Create a prompt for code review"     | `prompt-hierarchy`            | —                                   |
| "Document this architecture decision" | `design-assistant` (ADR mode) | —                                   |
| "Check my dependencies for security"  | `dependency-auditor`          | `security-hardening-prompt-builder` |
| "Generate a specification"            | `design-assistant` (SDD mode) | —                                   |

### 7.2 Manual Testing Protocol

1. Use Claude/GPT with MCP tool access
2. Issue each scenario as natural language query
3. Record which tool is selected first
4. Target: 90%+ correct selection rate

---

## 8. Success Criteria

| Criterion              | Target | Measurement                       |
| ---------------------- | ------ | --------------------------------- |
| Unique descriptions    | 100%   | No two tools share first 5 words  |
| ToolAnnotations        | 100%   | All 30+ tools have annotations    |
| Schema examples        | 100%   | All required params have examples |
| Tools consolidated     | 3 → 1  | Prompt tools merged               |
| LLM selection accuracy | 90%+   | Manual testing                    |

---

## 9. Migration Guide

### 9.1 For Users of Deprecated Tools

```typescript
// BEFORE: Using hierarchical-prompt-builder
await client.callTool('hierarchical-prompt-builder', {
  context: 'React app',
  goal: 'Review component',
});

// AFTER: Using prompt-hierarchy
await client.callTool('prompt-hierarchy', {
  mode: 'build',
  context: 'React app',
  goal: 'Review component',
});
```

### 9.2 Deprecation Warnings

```typescript
// In deprecated tool
console.warn(
  'DEPRECATION: hierarchical-prompt-builder is deprecated. ' +
  'Use prompt-hierarchy with mode: "build" instead. ' +
  'Will be removed in v0.14.0.'
);
```

---

## 10. References

- [ADR-002: Tool Annotations Standard](../adrs/ADR-002-tool-annotations-standard.md)
- [MCP SDK ToolAnnotations](https://modelcontextprotocol.io/docs/concepts/tools#tool-annotations)
- [Memory: v013_architecture_analysis](serena://memories/v013_architecture_analysis)
- [Merge.dev MCP Best Practices](https://www.merge.dev/blog/mcp-best-practices)

---

*Specification Created: January 2026*
*Status: Draft — Awaiting Review*
