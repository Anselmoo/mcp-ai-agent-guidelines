# V-013: Verify ExecutionTrace Active

**Task ID**: V-013
**Phase**: Validation
**Priority**: P0 (Critical Path)
**Estimate**: 2h
**Owner**: @code-reviewer
**Reviewer**: @architecture-advisor
**Dependencies**: T-011 through T-017 (Strategy migrations)
**References**: AC-013 (spec.md), ADR-001 (adr.md), REQ-002 (spec.md)

---

## 1. Overview

### What

Verify that ExecutionTrace logging is active for all strategy executions, providing full decision transparency and debugging capabilities as mandated by ADR-001's mandatory HITL pattern.

### Why

- **Requirement**: AC-013 mandates ExecutionTrace logging for all strategies
- **Architecture**: ADR-001 establishes ExecutionTrace as core component of BaseStrategy<T>
- **Transparency**: Enables audit trails for AI agent decision-making
- **Debugging**: Provides detailed logs for error investigation

### Context from Spec-Kit

From spec.md AC-013:
> "ExecutionTrace logging active for all strategy executions"

From adr.md ADR-001:
> "Implement ExecutionTrace class for decision logging with recordDecision(), recordMetric(), recordError(), toJSON(), and toMarkdown() exports for transparency"

From plan.md Phase 1:
> "ExecutionTrace records all strategy decisions, metrics, and errors with timestamps, enabling full audit trails"

### Deliverables

- Log analysis showing ExecutionTrace calls in all 7 strategies
- Sample trace exports (JSON and Markdown)
- Integration test results confirming trace capture

## 2. Context and Scope

### Current State (Baseline)

From spec.md Phase 2 baseline:
- 7 strategies migrated to BaseStrategy<T>
- ExecutionTrace integrated per ADR-001
- Template method pattern ensures tracing cannot be bypassed

### Target State

Per AC-013:
- All 7 strategies use `this.trace` for decision logging
- Every strategy execution produces ExecutionTrace output
- Traces include decisions, metrics, and errors
- Both JSON and Markdown export formats work

**Expected ExecutionTrace Usage**:
```typescript
// In every strategy's executeStrategy() method
this.trace.recordDecision('phase-start', 'Starting spec generation', { title });
this.trace.recordMetric('requirement-count', requirements.length);
this.trace.recordError(error); // on failures
```

**Expected Trace Export**:
```typescript
const trace = strategyResult.trace;
trace.toJSON();      // Returns structured data
trace.toMarkdown();  // Returns human-readable report
```

### Out of Scope

- Trace content quality (tested in unit tests)
- Performance overhead measurement
- Trace storage/persistence

## 3. Prerequisites

### Dependencies

- T-003: ExecutionTrace class implemented
- T-011 through T-017: All 7 strategies migrated to BaseStrategy
- T-004: ExecutionTrace tests passing

### Target Files

- `src/domain/base-strategy/execution-trace.ts`
- `src/strategies/*/index.ts` (all 7 strategy implementations)

## 4. Implementation Guide

### Step 4.1: Verify ExecutionTrace Class

**Command**:
```bash
# Verify ExecutionTrace exists
ls -la src/domain/base-strategy/execution-trace.ts

# Check key methods
grep -E "(recordDecision|recordMetric|recordError|toJSON|toMarkdown)" src/domain/base-strategy/execution-trace.ts
```

**Expected**: All 5 methods present

### Step 4.2: Verify Strategy Usage

**Command**:
```bash
# Check each strategy uses this.trace
for strategy in speckit togaf adr rfc enterprise sdd chat; do
  echo "=== $strategy ==="
  grep -c "this.trace" src/strategies/$strategy/*.ts
done
```

**Expected Output** (each strategy should have multiple this.trace calls):
```
=== speckit ===
15  # Example: 15 trace calls in SpecKitStrategy

=== togaf ===
12  # Example: 12 trace calls in TOGAFStrategy

... (and so on for all 7)
```

**If count = 0 for any strategy**:
- Strategy is NOT using ExecutionTrace
- FAIL validation
- Remediation: Add trace calls per ADR-001

### Step 4.3: Verify Decision Recording

**Check Decision Patterns**:
```bash
# Find all decision recordings
grep -r "recordDecision" src/strategies/

# Should show calls like:
# this.trace.recordDecision('init', 'Starting generation', context)
# this.trace.recordDecision('validation', 'Input validated', result)
# this.trace.recordDecision('complete', 'Generation finished', stats)
```

### Step 4.4: Verify Metric Recording

**Check Metric Patterns**:
```bash
# Find all metric recordings
grep -r "recordMetric" src/strategies/

# Should show calls like:
# this.trace.recordMetric('requirement-count', input.requirements.length)
# this.trace.recordMetric('generation-time-ms', duration)
# this.trace.recordMetric('output-size-bytes', Buffer.byteLength(output))
```

### Step 4.5: Run Integration Test

**Execute Integration Test**:
```bash
# Run integration test that exercises strategies
npm run test:integration -- --grep "ExecutionTrace"
```

**Expected Output**:
```
✓ SpecKitStrategy produces ExecutionTrace
✓ TOGAFStrategy produces ExecutionTrace
✓ ADRStrategy produces ExecutionTrace
✓ RFCStrategy produces ExecutionTrace
✓ EnterpriseStrategy produces ExecutionTrace
✓ SDDStrategy produces ExecutionTrace
✓ ChatStrategy produces ExecutionTrace

✓ ExecutionTrace.toJSON() works
✓ ExecutionTrace.toMarkdown() works

10 passing
```

### Step 4.6: Sample Trace Export

**Generate Sample Traces**:
```bash
# Run a strategy and capture trace
node << 'SCRIPT'
const { SpecKitStrategy } = require('./dist/strategies/speckit');
const strategy = new SpecKitStrategy();

const input = {
  title: 'Test Spec',
  overview: 'Test overview',
  objectives: ['Objective 1'],
  requirements: [{ description: 'Req 1' }]
};

strategy.execute(input).then(result => {
  console.log('=== JSON Export ===');
  console.log(JSON.stringify(result.trace.toJSON(), null, 2));

  console.log('\n=== Markdown Export ===');
  console.log(result.trace.toMarkdown());
});
SCRIPT
```

**Expected JSON Structure**:
```json
{
  "strategyName": "speckit",
  "strategyVersion": "2.0.0",
  "startTime": "2026-02-02T08:00:00.000Z",
  "endTime": "2026-02-02T08:00:05.123Z",
  "decisions": [
    {
      "id": "init",
      "timestamp": "2026-02-02T08:00:00.100Z",
      "description": "Starting spec generation",
      "context": { "title": "Test Spec" }
    }
  ],
  "metrics": [
    {
      "name": "requirement-count",
      "value": 1,
      "timestamp": "2026-02-02T08:00:00.200Z"
    }
  ],
  "errors": []
}
```

**Expected Markdown Structure**:
```markdown
# ExecutionTrace: speckit v2.0.0

**Start Time**: 2026-02-02T08:00:00.000Z
**End Time**: 2026-02-02T08:00:05.123Z
**Duration**: 5123 ms

## Decisions

- [08:00:00.100] **init**: Starting spec generation
  - Context: { "title": "Test Spec" }

## Metrics

- requirement-count: 1
- generation-time-ms: 5000

## Errors

None
```

### Step 4.7: Capture Evidence

```bash
# Generate validation report
cat > artifacts/validation/V-013-executiontrace.txt << 'REPORT'
=== ExecutionTrace Verification ===

Strategy Usage Audit:
---------------------
REPORT

for strategy in speckit togaf adr rfc enterprise sdd chat; do
  count=$(grep -c "this.trace" src/strategies/$strategy/*.ts 2>/dev/null || echo "0")
  echo "$strategy: $count trace calls" >> artifacts/validation/V-013-executiontrace.txt
done

echo "" >> artifacts/validation/V-013-executiontrace.txt
echo "Integration Test Results:" >> artifacts/validation/V-013-executiontrace.txt
npm run test:integration -- --grep "ExecutionTrace" --reporter json > /tmp/trace-test-results.json 2>&1
cat /tmp/trace-test-results.json >> artifacts/validation/V-013-executiontrace.txt
```

## 5. Testing Strategy

### Unit Tests
- ExecutionTrace class methods (T-004)
- Decision/metric/error recording
- JSON and Markdown export

### Integration Tests
- Each strategy produces valid trace
- Trace contains decisions, metrics, errors
- Export formats work correctly

### Audit Tests
- All 7 strategies use `this.trace`
- Minimum trace call count per strategy
- No strategies bypass tracing

## 6. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Strategy bypasses trace | High | Template method pattern prevents |
| Trace overhead performance | Medium | Async recording, benchmarking |
| Trace export fails | Low | Unit tests cover export methods |
| Missing trace calls | Medium | Grep audit catches violations |

## 7. Acceptance Criteria

From spec.md AC-013:

| Criterion | Status | Verification |
|-----------|--------|--------------|
| ExecutionTrace class implemented | ⬜ | File exists: src/domain/base-strategy/execution-trace.ts |
| All 7 strategies use this.trace | ⬜ | grep shows trace calls in all strategies |
| recordDecision() calls present | ⬜ | grep finds decision recordings |
| recordMetric() calls present | ⬜ | grep finds metric recordings |
| recordError() calls present | ⬜ | grep finds error recordings |
| toJSON() export works | ⬜ | Integration test passes |
| toMarkdown() export works | ⬜ | Integration test passes |
| Integration tests pass for all strategies | ⬜ | npm run test:integration passes |

**Strategy Tracing Checklist**:
- [ ] SpecKitStrategy uses this.trace
- [ ] TOGAFStrategy uses this.trace
- [ ] ADRStrategy uses this.trace
- [ ] RFCStrategy uses this.trace
- [ ] EnterpriseStrategy uses this.trace
- [ ] SDDStrategy uses this.trace
- [ ] ChatStrategy uses this.trace

**Definition of Done**:
- All 7 strategies use ExecutionTrace
- Integration tests pass
- Sample traces exported successfully
- Evidence saved in artifacts/validation/

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) - AC-013, REQ-002
- [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md) - ADR-001 BaseStrategy Pattern
- [plan.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/plan.md) - Phase 1 Core Infrastructure
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md) - T-003, T-004, T-011 through T-017

---

*Task: V-013 | Phase: Validation (Phase 2) | Priority: P0 (Critical Path)*
