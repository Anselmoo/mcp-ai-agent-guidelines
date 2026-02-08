---
title: "Implement BaseStrategy Abstract Class"
labels: ["feature", "v0.14.x", "P0", "phase-1"]
assignees: ["@mcp-tool-builder"]
milestone: "v0.14.0"
---

## Summary

Implement the `BaseStrategy<TInput, TOutput>` abstract class that enforces a consistent interface across all 7 strategy implementations with mandatory Human-In-The-Loop (HITL) feedback.

## Context

The current v0.13.x codebase has 7 strategy implementations (SpecKit, TOGAF, ADR, RFC, Enterprise, SDD, Chat) with:

- No common interface or base class
- Inconsistent error handling
- No execution tracing
- No mandatory human feedback loops

Industry research from MCP community, Salesforce Agentforce, Temporal, and Zapier confirms that HITL is **NOT optional** for production AI workflows.

## Acceptance Criteria

- [ ] Abstract class `BaseStrategy<TInput, TOutput>` implemented in `src/strategies/shared/base-strategy.ts`
- [ ] Template method pattern with `run()` as final method
- [ ] Abstract methods: `execute()`, `validate()`
- [ ] Integration point for `SummaryFeedbackCoordinator`
- [ ] Integration point for `ExecutionTrace`
- [ ] 100% test coverage for base class
- [ ] TypeScript strict mode compliance
- [ ] No `any` types

## Technical Details

### Interface Design

```typescript
export abstract class BaseStrategy<TInput, TOutput> {
  protected trace: ExecutionTrace;
  protected feedbackCoordinator: SummaryFeedbackCoordinator;

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
    await this.feedbackCoordinator.requestFeedback(result);
    this.trace.recordSuccess({ output: result });
    return { success: true, data: result, trace: this.trace };
  }
}
```

### File Structure

```
src/strategies/
  shared/
    base-strategy.ts         # THIS ISSUE
    execution-trace.ts       # Issue #2
    types.ts                 # Shared types
    index.ts                 # Barrel export
```

## Dependencies

- **Depends on**: None (foundational)
- **Blocks**: #2 (ExecutionTrace), #5-7 (Strategy migrations)

## Effort Estimate

8 hours

## Testing Requirements

- Unit tests for abstract class behavior
- Mock implementations for testing
- Validation logic tests
- Error handling tests

## References

- [ADR-001](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md#adr-001-basestrategy-pattern-for-mandatory-hitl)
- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) - REQ-001, REQ-005
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md) - T-001

---

*Related Tasks: T-001*
*Phase: 1 - Foundation*
