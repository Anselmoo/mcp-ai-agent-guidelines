# MCP AI Agent Guidelines — Constitution

> Project-wide principles, constraints, and guidelines that govern all v0.13.x decisions

## 📜 Foundational Principles

### 1. Tool Discoverability First

> Every tool MUST be immediately understandable to an LLM.

**Rationale**: If LLMs can't discover and correctly select tools, the entire system fails.

**Implications**:
- Tool descriptions must be action-oriented and unique
- JSON schemas must include examples
- Similar tools must be consolidated or clearly differentiated
- Tool annotations must indicate behavior hints

### 2. Pure Domain, Pluggable Output

> Business logic MUST be pure; output formatting MUST be pluggable.

**Rationale**: The same analysis can be rendered as chat, RFC, ADR, or spec.md.

**Implications**:
- Domain functions return structured data, never formatted strings
- OutputStrategy handles all formatting decisions
- Cross-cutting capabilities (workflows, scripts) work with any output approach
- No presentation logic in domain layer

### 3. Incremental Migration (Strangler Fig)

> New architecture wraps and gradually replaces old code.

**Rationale**: Big-bang rewrites fail; incremental changes succeed.

**Implications**:
- New code alongside old, not replacing
- Transitional architecture is acceptable and planned for removal
- Each phase delivers value independently
- Feature flags enable gradual rollout

### 4. Cross-Cutting Capabilities Are Universal

> Workflows, scripts, diagrams can be part of ANY output approach.

**Rationale**: User clarified that these are NOT alternative strategies but additive capabilities.

**Implications**:
- RFC output can include workflow YAML
- ADR output can include migration scripts
- SDD output can include diagrams
- OutputArtifacts structure supports multiple artifact types

### 5. Specification-Driven Development

> Significant changes require specification → plan → tasks workflow.

**Rationale**: SDD reduces rework and enables AI-assisted implementation.

**Implications**:
- Each ADR links to a specification
- Each specification produces a plan
- Plans derive atomic tasks
- Tasks are linked to implementation PRs

---

## 🚫 Constraints (Non-Negotiable)

### C1: TypeScript Strict Mode

- `strict: true` in tsconfig.json
- No `any` types without explicit justification
- All tool inputs validated with Zod

### C2: ESM Module System

- All imports must use `.js` extension
- No CommonJS require() statements
- Barrel exports via index.ts files

### C3: Test Coverage

- Minimum 90% coverage (enforced)
- Target 95% coverage
- No mocking of domain logic
- Integration tests for tool workflows

### C4: Error Handling

- ErrorCode enum for all error types
- Single `handleToolError()` function
- No scattered try/catch blocks
- Typed error classes with context

### C5: Backward Compatibility

- Existing tool interfaces preserved during migration
- Deprecation warnings before removal
- Breaking changes require ADR approval

---

## 📐 Architecture Rules

### AR1: Layer Dependencies

```
Allowed:
  MCPServer → PolyglotGateway → DomainServices
  MCPServer → PolyglotGateway → OutputStrategies
  OutputStrategies → DomainResults (read-only)

Forbidden:
  DomainServices → OutputStrategies (no presentation in domain)
  DomainServices → MCPServer (no protocol awareness)
  OutputStrategies → MCPServer (no protocol awareness)
```

### AR2: File Organization

```
src/
├── index.ts              # MCP entry point only
├── gateway/              # Request routing
├── domain/               # Pure business logic
│   ├── prompting/
│   ├── analysis/
│   └── design/
├── strategies/           # Output formatting
├── shared/               # Cross-cutting utilities
└── tools/                # Legacy (being migrated)
```

### AR3: Naming Conventions

- **Tools**: `<domain>-<action>` (e.g., `prompt-build`, `code-score`)
- **Domain functions**: `<verb><Noun>` (e.g., `buildPrompt`, `scoreCode`)
- **Strategies**: `<Format>Strategy` (e.g., `ChatStrategy`, `RFCStrategy`)
- **Errors**: `<Domain>Error` (e.g., `ValidationError`, `PromptingError`)

### AR4: Interface Patterns

```typescript
// All domain functions follow this pattern
interface DomainFunction<TInput, TResult> {
  (input: TInput): TResult | Promise<TResult>;
}

// All strategies follow this pattern
interface OutputStrategy {
  approach: OutputApproach;
  crossCutting: CrossCuttingCapability[];
  render(result: DomainResult, options: RenderOptions): OutputArtifacts;
}

// All tools follow this pattern
interface ToolDefinition {
  name: string;
  description: string;       // Action-oriented, unique
  annotations: ToolAnnotations;
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
  execute: ToolFunction;
}
```

---

## 🎨 Design Principles

### DP1: Reduce to Essence

Each tool does **ONE thing** brilliantly. Consolidate overlapping tools.

**Anti-pattern**: hierarchical-prompt-builder that builds, evaluates, AND selects levels
**Pattern**: Three focused tools: prompt-build, prompt-evaluate, prompt-select-level

### DP2: Progressive Disclosure

Basic usage is obvious; advanced features are discoverable.

**Anti-pattern**: 20 required parameters
**Pattern**: 2-3 required, optional `options` object for advanced features

### DP3: Consistency

All tools follow identical input/output patterns.

**Anti-pattern**: Some tools return strings, some objects, some arrays
**Pattern**: All return `{ result: T, metadata?: M, suggestions?: string[] }`

### DP4: Deference

Tool outputs inform but don't dictate. LLM makes final decisions.

**Anti-pattern**: "You MUST use this approach"
**Pattern**: "Consider these options: A (for X), B (for Y), C (for Z)"

### DP5: Clarity

Every parameter name is self-explanatory.

**Anti-pattern**: `ctx`, `opts`, `cfg`, `args`
**Pattern**: `analysisContext`, `renderOptions`, `sessionConfig`

---

## 📋 Quality Gates

### QG1: Pre-Commit

- Biome format check
- TypeScript type check
- No console.log statements

### QG2: Pre-Push

- Full test suite passes
- Coverage >= 90%
- No lint warnings

### QG3: PR Review

- ADR approved for architectural changes
- Specification complete for feature changes
- Integration tests added
- Documentation updated

### QG4: Release

- All broken tool issues resolved
- CHANGELOG updated
- Migration guide for breaking changes
- Demo scripts validated

---

## 🔄 Change Process

### For Bug Fixes

1. Create issue with reproduction steps
2. Write failing test
3. Implement fix
4. Verify test passes
5. Submit PR

### For Features

1. Write specification in `specs/`
2. Get specification approved
3. Create ADR if architectural
4. Derive tasks from specification
5. Implement incrementally (Strangler Fig)
6. Validate against checklist

### For Architectural Changes

1. Draft ADR with Context, Decision, Consequences
2. Get ADR approved by maintainers
3. Create specification
4. Plan phased implementation
5. Execute with feature flags
6. Deprecate old implementation
7. Remove old code after migration

---

## 📊 Decision Framework

### When to Create an ADR

- Introducing new architectural pattern
- Changing existing architectural pattern
- Selecting between competing approaches
- Making irreversible decisions
- Decisions affecting multiple tools

### When to Create a Specification

- Adding new tool
- Modifying tool interface
- Adding new output approach
- Implementing cross-cutting capability
- Multi-phase implementation

### When to Skip Documentation

- Bug fixes with obvious solution
- Dependency updates (routine)
- Typo corrections
- Test improvements (non-architectural)

---

## 🏷️ Version Compatibility

### v0.13.x Scope

- OutputStrategy layer implementation
- Tool harmonization (annotations, descriptions)
- Error handling refactor
- Broken tool fixes
- Spec-Kit integration foundation

### v0.14.x Planned

- Agent handoffs system
- Multi-agent workflows
- Advanced workflow orchestration

### Deprecation Policy

- Announce in CHANGELOG
- Add console.warn for deprecated features
- Maintain for 2 minor versions
- Remove in next major version

---

*Constitution Adopted: January 2026*
*Last Updated: January 2026*
*Applies To: v0.13.x and all future versions unless superseded*
