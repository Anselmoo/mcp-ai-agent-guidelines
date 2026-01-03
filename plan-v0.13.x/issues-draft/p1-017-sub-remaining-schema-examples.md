# 🔧 Sub-Issue: Remaining Schema Examples (P1-012)

> **Parent**: #TBD
> **Labels**: `phase-1`, `parallel`, `copilot-suitable`, `priority-medium`
> **Milestone**: M2: Test-Stable

## Context

After core tools (P1-011), add examples to remaining tool schemas. This covers prompt builders, strategy tools, and design tools.

---

## Task Description

Add `examples` arrays to Zod schemas for ~20 remaining tools:

### Prompt Builders (11 tools)
- `hierarchical-prompt-builder`
- `prompt-chaining-builder`
- `prompt-flow-builder`
- `security-hardening-prompt-builder`
- `domain-neutral-prompt-builder`
- `quick-developer-prompts`
- `debugging-assistant-prompt-builder`
- `documentation-generator-prompt-builder`
- `code-analysis-prompt-builder`
- `architecture-design-prompt-builder`
- `l9-distinguished-engineer-prompt-builder`

### Strategy & Planning Tools (6 tools)
- `strategy-frameworks-builder`
- `gap-frameworks-analyzers`
- `sprint-timeline-calculator`
- `mermaid-diagram-generator`
- `model-compatibility-checker`
- `hierarchy-level-selector`

### Design Tools (3 tools)
- `design-assistant`
- `mode-switcher`
- `memory-context-optimizer`

---

## Acceptance Criteria

- [ ] ~20 tools have examples on key parameters
- [ ] Each tool has 2-3 examples minimum
- [ ] Examples represent realistic use cases
- [ ] All tests pass
- [ ] No type errors

---

## Files to Change

| File | Change |
|------|--------|
| `src/tools/prompt/*.ts` | Add examples to Zod schemas (11 files) |
| `src/tools/analysis/*.ts` | Add examples for strategy tools |
| `src/tools/design/*.ts` | Add examples for design tools |

---

## Implementation Hints

### Prompt Builder Examples

```typescript
// hierarchical-prompt-builder
const schema = z.object({
  taskDescription: z.string()
    .describe('Task the prompt should address')
    .examples([
      'Review this pull request for security vulnerabilities',
      'Refactor the user authentication module to use OAuth2',
      'Generate unit tests for the payment processing service'
    ]),
  hierarchyLevel: z.enum(['independent', 'indirect', 'direct', 'modeling', 'scaffolding', 'full-physical'])
    .optional()
    .describe('Prompting hierarchy level')
    .examples(['direct', 'scaffolding'])
});
```

### Strategy Tool Examples

```typescript
// gap-frameworks-analyzers
const schema = z.object({
  currentState: z.string()
    .describe('Description of current state')
    .examples([
      'Monolithic application with 500k lines of code',
      'Manual deployment process taking 4 hours',
      'Team of 5 developers with limited cloud experience'
    ]),
  desiredState: z.string()
    .describe('Description of target state')
    .examples([
      'Microservices architecture with independent deployment',
      'Automated CI/CD with 15-minute deployments',
      'Full cloud-native development capability'
    ]),
  frameworks: z.array(z.string())
    .optional()
    .examples([
      ['capability', 'skills'],
      ['technology', 'process'],
      ['performance', 'maturity']
    ])
});
```

### Design Tool Examples

```typescript
// design-assistant
const schema = z.object({
  action: z.enum(['start-session', 'advance-phase', 'validate-phase', ...])
    .examples(['start-session', 'advance-phase']),
  sessionId: z.string()
    .describe('Unique session identifier')
    .examples(['session-auth-refactor-001', 'design-api-gateway-v2']),
  config: z.object({...})
    .optional()
    .examples([
      { goal: 'Design authentication service', context: 'E-commerce platform' },
      { goal: 'Refactor payment module', requirements: ['PCI compliance', 'Idempotency'] }
    ])
});
```

---

## Testing Strategy

- Run `npm run type-check`
- Run `npm run test:vitest`
- Spot-check examples make sense for each tool's purpose

---

## Dependencies

- **Depends on**: P1-011 (core examples establish pattern)
- **Enables**: P1-010 (uniqueness test can validate examples)

---

## References

- [SPEC-001: LLM Tool Discoverability](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-llm-tool-discoverability.md) §3.2
- [TASKS-phase-1.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-1.md) P1-012
