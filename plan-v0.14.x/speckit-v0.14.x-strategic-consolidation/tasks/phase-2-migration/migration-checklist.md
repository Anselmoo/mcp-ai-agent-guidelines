# Migration Checklist: Strategy → BaseStrategy

**Phase**: 2 - Strategy Migration
**Applies to**: T-012 through T-017

---

## 1. Overview

### What

A reusable checklist for migrating each strategy (TOGAF, ADR, RFC, Enterprise, SDD, Chat) to the `BaseStrategy<T>` pattern.

### Why

This ensures consistent migration steps across all strategies:
- Mandatory validation via `validate()`
- Execution tracing via `ExecutionTrace`
- Summary feedback integration
- Consistent error handling and timeouts

---

## 2. Pre-Migration Checklist

- [ ] BaseStrategy (`T-001`) complete
- [ ] ExecutionTrace (`T-003`) complete
- [ ] Target strategy file identified
- [ ] Existing tests passing
- [ ] Strategy-specific types located

---

## 3. Migration Steps

### 3.1 Create Domain Layer (if needed)

- [ ] Extract pure logic into `src/domain/<strategy>/`
- [ ] Create `types.ts` for input/output
- [ ] Add `index.ts` barrel exports
- [ ] Ensure no side effects in domain functions

### 3.2 Update Strategy Class

- [ ] Extend `BaseStrategy<TInput, TOutput>`
- [ ] Add `name` + `version` fields
- [ ] Implement `validate(input)` using Zod schemas
- [ ] Move core logic into `execute(input)`
- [ ] Record decisions with `trace.recordDecision()`
- [ ] Record metrics with `trace.recordMetric()`
- [ ] Record errors with `trace.recordError()`

### 3.3 Summary Feedback Integration

- [ ] Create `SummaryFeedbackCoordinator`
- [ ] Collect trace data from strategy and validators
- [ ] Return summary in tool response
- [ ] Ensure HITL checkpoints are present

### 3.4 Update Exports and Registrations

- [ ] Update strategy barrel export
- [ ] Update any registry/router references
- [ ] Update MCP tool handlers to use new strategy entry

---

## 4. Testing Checklist

- [ ] Unit tests for new domain functions
- [ ] Strategy-level tests for validation failures
- [ ] Strategy-level tests for tracing + metrics
- [ ] Integration tests for tool handler
- [ ] Coverage ≥ 90% for tool layer

---

## 5. Acceptance Criteria

| Criterion | Status | Verification |
|-----------|--------|--------------|
| Strategy extends BaseStrategy | ⬜ | Type-check passes |
| Validation uses Zod schema | ⬜ | Validation tests |
| ExecutionTrace records decisions | ⬜ | Trace assertions |
| Summary feedback returned | ⬜ | Integration test |
| No `any` types introduced | ⬜ | grep check |
| Tests updated | ⬜ | Vitest passes |

---

## 6. References

- [T-001: BaseStrategy](../phase-1-foundation/T-001-base-strategy.md)
- [T-003: ExecutionTrace](../phase-1-foundation/T-003-execution-trace.md)
- [T-011: SpecKit Migration](./T-011-migrate-speckit.md)
- [spec.md](../../spec.md)

---

*Template: Strategy Migration Checklist*
