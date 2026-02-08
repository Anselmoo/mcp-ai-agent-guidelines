# ADR: MCP AI Agent Guidelines v0.14.x - Strategic Consolidation Architecture

## ADR-001: BaseStrategy Pattern for Mandatory HITL

### Status

**Proposed** — February 2026

### Context

The current v0.13.x codebase has 7 strategy implementations (SpecKit, TOGAF, ADR, RFC, Enterprise, SDD, Chat) with:

- No common interface or base class
- Inconsistent error handling
- No execution tracing
- No mandatory human feedback loops

Industry research from MCP community, Salesforce Agentforce, Temporal, and Zapier confirms that Human-In-The-Loop (HITL) is **NOT optional** for production AI workflows.

### Decision

Implement a `BaseStrategy<TInput, TOutput>` abstract class that:

1. Enforces a consistent interface across all strategies
2. Provides mandatory summary feedback via `SummaryFeedbackCoordinator`
3. Logs all decisions via `ExecutionTrace`
4. Supports agent handoffs via `AgentHandoffCoordinator`

```typescript
export abstract class BaseStrategy<TInput, TOutput> {
  protected trace: ExecutionTrace;

  abstract execute(input: TInput): Promise<TOutput>;
  abstract validate(input: TInput): ValidationResult;

  // Template method - cannot be overridden
  async run(input: TInput): Promise<StrategyResult<TOutput>> {
    this.trace.recordStart({ input });
    const validation = this.validate(input);
    if (!validation.valid) {
      this.trace.recordError(validation.errors);
      return { success: false, errors: validation.errors };
    }
    const result = await this.execute(input);
    this.trace.recordSuccess({ output: result });
    return { success: true, data: result, trace: this.trace };
  }
}
```

### Consequences

#### Positive

- Consistent interface across all 7 strategies
- Mandatory HITL feedback cannot be bypassed
- Decision transparency via ExecutionTrace
- Easier testing via template method pattern
- Clear extension points for new strategies

#### Negative

- Migration effort required for all 7 strategies
- Slight performance overhead from tracing
- Learning curve for contributors

#### Neutral

- Existing strategy logic unchanged
- External API unchanged (backward compatible)

### References

- [spec.md](./spec.md) - REQ-001, REQ-005
- [tasks.md](./tasks.md) - T-001 through T-017

---

## ADR-002: Tool Annotations Standard (GAP-001)

### Status

**Proposed** — February 2026

### Context

The MCP SDK provides `ToolAnnotations` for tool metadata, but only ~60% of the 30+ tools have annotations. This causes:

- Inconsistent tool discovery
- Missing safety hints for AI agents
- No standardized metadata format

### Decision

All tools MUST have ToolAnnotations with these properties:

```typescript
const toolAnnotations: ToolAnnotations = {
  title: string;           // Human-readable title
  readOnlyHint: boolean;   // true if tool only reads data
  destructiveHint: boolean; // true if tool modifies/deletes
  idempotentHint: boolean;  // true if repeated calls are safe
  openWorldHint: boolean;   // true if tool accesses external resources
};
```

Enforcement via `validate_annotations` CI job:
- Run on every PR
- Block merge if coverage < 100%

### Consequences

#### Positive

- 100% annotation coverage
- Better tool discovery
- Safer AI agent interactions
- Automated enforcement

#### Negative

- Initial effort to annotate all tools
- CI job adds ~30s to pipeline

#### Neutral

- No breaking changes to tool behavior

### References

- [spec.md](./spec.md) - REQ-024
- [tasks.md](./tasks.md) - T-034, T-062

---

## ADR-003: Unified Prompt Ecosystem (GAP-003)

### Status

**Proposed** — February 2026

### Context

The current codebase has 12+ prompt builders:

- `hierarchical-prompt-builder.ts`
- `domain-neutral-prompt-builder.ts`
- `spark-prompt-builder.ts`
- `security-hardening-prompt-builder.ts`
- `architecture-design-prompt-builder.ts`
- `code-analysis-prompt-builder.ts`
- `debugging-assistant-prompt-builder.ts`
- `documentation-generator-prompt-builder.ts`
- `l9-distinguished-engineer-prompt-builder.ts`
- Plus more...

This causes:
- Code duplication (~25%)
- Inconsistent prompt structure
- Hard to maintain/extend
- No unified interface

### Decision

Implement `UnifiedPromptBuilder` as single entry point:

```typescript
class UnifiedPromptBuilder {
  private registry: PromptRegistry;
  private templateEngine: TemplateEngine;

  build(request: PromptRequest): PromptResult {
    const generator = this.registry.get(request.domain);
    const template = generator.getTemplate(request);
    return this.templateEngine.render(template, request.context);
  }
}
```

**Registry Pattern**:
- Register domain-specific generators
- Route requests to appropriate generator
- Consistent output format

**Legacy Facades**:
- Maintain backward compatibility
- Emit deprecation warnings
- Map to UnifiedPromptBuilder internally

### Breaking Change Policy

Phase 2.5 has **strict "no backward compatibility" policy** for internal APIs:
- `PromptRegistry` internal API may change
- `TemplateEngine` internal API may change
- Public facades remain stable

### Consequences

#### Positive

- Single entry point for all prompts
- Reduced code duplication
- Consistent prompt structure
- Easier to add new domains
- Clear extension mechanism

#### Negative

- Breaking changes for internal users
- Migration effort required
- Learning curve for new pattern

#### Neutral

- External API via facades unchanged

### References

- [spec.md](./spec.md) - REQ-007 through REQ-009
- [tasks.md](./tasks.md) - T-023 through T-036

---

## ADR-004: Platform Abstraction Layer (PAL)

### Status

**Proposed** — February 2026

### Context

Current codebase has:
- 46 shell scripts (Bash only)
- Direct `fs` and `path` calls throughout
- Unix path assumptions (`/` separator)
- No Windows support

### Decision

Implement Platform Abstraction Layer (PAL):

```typescript
interface PlatformAbstractionLayer {
  // File operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;

  // Directory operations
  listFiles(dir: string, pattern?: string): Promise<string[]>;
  createDir(path: string): Promise<void>;

  // Path operations
  resolvePath(...segments: string[]): string;
  joinPath(...segments: string[]): string;
  dirname(path: string): string;
  basename(path: string): string;

  // Environment
  getEnv(key: string): string | undefined;
  getPlatform(): 'darwin' | 'linux' | 'win32';
}
```

**Implementations**:
- `NodePAL` - Production implementation using Node.js APIs
- `MockPAL` - Testing implementation with in-memory filesystem

### Consequences

#### Positive

- Cross-platform support (Windows, Linux, macOS)
- Easier testing with MockPAL
- Consistent path handling
- No direct fs/path dependencies

#### Negative

- Migration effort to replace all fs/path calls
- Slight abstraction overhead
- Additional code to maintain

#### Neutral

- Shell scripts remain for advanced use cases
- Node.js remains primary runtime

### References

- [spec.md](./spec.md) - REQ-014 through REQ-016
- [tasks.md](./tasks.md) - T-053 through T-060

---

## ADR-005: Framework Consolidation (30 → 11)

### Status

**Proposed** — February 2026

### Context

Current codebase has 30+ fragmented tools with:
- Semantic overlap
- Duplicate functionality
- No clear categorization
- Inconsistent naming

### Decision

Consolidate into 11 unified frameworks:

| #   | Framework               | Tools Consolidated                        |
| --- | ----------------------- | ----------------------------------------- |
| 1   | Prompt Engineering      | hierarchical, domain-neutral, spark       |
| 2   | Code Quality & Analysis | clean-code-scorer, code-hygiene, semantic |
| 3   | Design & Architecture   | architecture-design, l9-engineer          |
| 4   | Security & Compliance   | security-hardening, vulnerability         |
| 5   | Testing & Coverage      | coverage-enhancer, coverage-dashboard     |
| 6   | Documentation           | documentation-generator, quick-prompts    |
| 7   | Strategic Planning      | strategy-frameworks, gap-analysis         |
| 8   | AI Agent Orchestration  | agent-orchestrator, design-assistant      |
| 9   | Prompt Optimization     | memory-optimizer, hierarchy-selector      |
| 10  | Visualization           | mermaid-generator, spark-ui               |
| 11  | Project Management      | speckit-generator, sprint-calculator      |

**Router Pattern**:
```typescript
class FrameworkRouter {
  route(request: FrameworkRequest): Framework {
    const framework = this.registry.get(request.type);
    return framework.handle(request);
  }
}
```

### Consequences

#### Positive

- 63% reduction in tool count
- Clear categorization
- Reduced code duplication
- Easier discovery
- Simpler maintenance

#### Negative

- Migration effort required
- Some tools may lose specificity
- Learning curve for users

#### Neutral

- Individual tool APIs unchanged via facades

### References

- [spec.md](./spec.md) - REQ-010, OBJ-001
- [tasks.md](./tasks.md) - T-037 through T-052

---

## ADR-006: Enforcement Automation Layer

### Status

**Proposed** — February 2026

### Context

Quality enforcement is currently manual:
- No automated checks for tool annotations
- No validation of schema descriptions
- No enforcement of SpecKit compliance
- Progress files have inconsistent formats

### Decision

Implement 5 enforcement tools:

| Tool                       | Purpose                      | CI Integration |
| -------------------------- | ---------------------------- | -------------- |
| `validate_uniqueness`      | Check duplicate descriptions | Pre-merge      |
| `validate_annotations`     | Verify ToolAnnotations       | Pre-merge      |
| `validate_schema_examples` | Check Zod .describe()        | Pre-merge      |
| `enforce_planning`         | Validate SpecKit compliance  | On demand      |
| `validate_progress`        | Normalize progress.md        | Pre-merge      |

**CI Pipeline Integration**:
```yaml
jobs:
  enforce:
    runs-on: ubuntu-latest
    steps:
      - name: Validate Annotations
        run: npm run validate:annotations
      - name: Validate Schemas
        run: npm run validate:schemas
      - name: Validate Progress
        run: npm run validate:progress
```

### Consequences

#### Positive

- Automated quality enforcement
- Consistent standards
- Reduced manual review
- Clear pass/fail criteria

#### Negative

- Additional CI time (~90s)
- May block PRs initially
- Requires remediation effort

#### Neutral

- Gradual rollout possible

### References

- [spec.md](./spec.md) - REQ-025 through REQ-027
- [tasks.md](./tasks.md) - T-048, T-061 through T-063

---

## Decision Log

| ADR     | Title                      | Status   | Date       |
| ------- | -------------------------- | -------- | ---------- |
| ADR-001 | BaseStrategy Pattern       | Proposed | 2026-02-01 |
| ADR-002 | Tool Annotations Standard  | Proposed | 2026-02-01 |
| ADR-003 | Unified Prompt Ecosystem   | Proposed | 2026-02-01 |
| ADR-004 | Platform Abstraction Layer | Proposed | 2026-02-01 |
| ADR-005 | Framework Consolidation    | Proposed | 2026-02-01 |
| ADR-006 | Enforcement Automation     | Proposed | 2026-02-01 |

---

*See [spec.md](./spec.md) for full requirements*
*See [plan.md](./plan.md) for implementation approach*
