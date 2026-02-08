---
title: "Implement UnifiedPromptBuilder Core"
labels: ["feature", "v0.14.x", "P0", "phase-2"]
assignees: ["@mcp-tool-builder", "@prompt-architect"]
milestone: "v0.14.0"
---

## Summary

Implement the `UnifiedPromptBuilder` as the single entry point for all prompt generation, replacing the 12+ disparate prompt builders with a unified, extensible system.

## Context

The current codebase has 12+ prompt builders with:
- ~25% code duplication
- Inconsistent prompt structure
- Hard to maintain and extend
- No unified interface

This issue consolidates all prompt building into a single system with domain-specific generators accessed via a registry pattern.

## Acceptance Criteria

- [ ] `UnifiedPromptBuilder` class in `src/domain/prompts/unified-prompt-builder.ts`
- [ ] `PromptRegistry` for domain registration in `src/domain/prompts/prompt-registry.ts`
- [ ] `TemplateEngine` for prompt rendering in `src/domain/prompts/template-engine.ts`
- [ ] Supports all existing prompt domains (hierarchical, domain-neutral, spark, etc.)
- [ ] Consistent output format across all domains
- [ ] 90% test coverage
- [ ] TypeScript strict mode compliance

## Technical Details

### Architecture

```typescript
// unified-prompt-builder.ts
export class UnifiedPromptBuilder {
  private registry: PromptRegistry;
  private templateEngine: TemplateEngine;

  constructor(registry?: PromptRegistry, engine?: TemplateEngine) {
    this.registry = registry ?? PromptRegistry.getInstance();
    this.templateEngine = engine ?? new TemplateEngine();
  }

  build(request: PromptRequest): PromptResult {
    const generator = this.registry.get(request.domain);
    const template = generator.getTemplate(request);
    const rendered = this.templateEngine.render(template, request.context);
    return { content: rendered, metadata: { domain: request.domain, timestamp: new Date() } };
  }
}

// prompt-registry.ts
export class PromptRegistry {
  private static instance: PromptRegistry;
  private generators: Map<string, PromptGenerator> = new Map();

  static getInstance(): PromptRegistry { ... }
  register(domain: string, generator: PromptGenerator): void;
  get(domain: string): PromptGenerator;
  list(): string[];
}

// template-engine.ts
export class TemplateEngine {
  render(template: PromptTemplate, context: PromptContext): string;
  registerHelper(name: string, fn: HelperFunction): void;
}
```

### Domain Registration

```typescript
// In initialization
const registry = PromptRegistry.getInstance();
registry.register('hierarchical', new HierarchicalPromptGenerator());
registry.register('domain-neutral', new DomainNeutralPromptGenerator());
registry.register('spark', new SparkPromptGenerator());
registry.register('security', new SecurityPromptGenerator());
registry.register('architecture', new ArchitecturePromptGenerator());
// ... etc
```

### File Structure

```
src/domain/prompts/
  unified-prompt-builder.ts    # THIS ISSUE
  prompt-registry.ts           # THIS ISSUE
  template-engine.ts           # THIS ISSUE
  types.ts
  generators/
    hierarchical.ts
    domain-neutral.ts
    spark.ts
    security.ts
    architecture.ts
    ...
  index.ts
```

## Dependencies

- **Depends on**: #1 (BaseStrategy pattern for consistency)
- **Blocks**: #13 (Legacy Facades), #14 (Test updates)

## Effort Estimate

12 hours

## Testing Requirements

- Registry operations (register, get, list)
- Builder with all domains
- Template rendering
- Error handling for unknown domains
- Concurrency safety

## References

- [ADR-003](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md#adr-003-unified-prompt-ecosystem-gap-003)
- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) - REQ-007, REQ-008, REQ-009
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md) - T-023, T-024, T-025

---

*Related Tasks: T-023, T-024, T-025*
*Phase: 2 - Unification*
