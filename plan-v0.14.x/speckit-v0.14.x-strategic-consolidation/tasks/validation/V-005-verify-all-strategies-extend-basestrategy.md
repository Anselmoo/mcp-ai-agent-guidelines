# V-005: Verify All Strategies Extend BaseStrategy

**Task ID**: V-005
**Phase**: Validation
**Priority**: P0 (Critical Path)
**Estimate**: 1h
**Owner**: @code-reviewer
**Reviewer**: @architecture-advisor
**Dependencies**: T-021 (Verify BaseStrategy Compliance)
**References**: AC-005 (spec.md), ADR-001 (adr.md), REQ-005 (spec.md)

---

## 1. Overview

### What

Verify that all 7 strategies (SpecKit, TOGAF, ADR, RFC, Enterprise, SDD, Chat) extend the BaseStrategy<T> abstract class, implementing the mandatory HITL (Human-In-The-Loop) pattern established in ADR-001.

### Why

- **Requirement**: AC-005 mandates all strategies extend BaseStrategy<T>
- **Architecture**: ADR-001 establishes BaseStrategy as foundational pattern for mandatory HITL
- **Consistency**: Ensures uniform interface, validation, and ExecutionTrace logging
- **Safety**: Template method pattern prevents bypassing HITL feedback

### Context from Spec-Kit

From spec.md AC-005:
> "All 7 strategies (speckit, togaf, adr, rfc, enterprise, sdd, chat) extend BaseStrategy<T>"

From adr.md ADR-001:
> "Implement a `BaseStrategy<TInput, TOutput>` abstract class that: 1) Enforces a consistent interface, 2) Provides mandatory summary feedback, 3) Logs all decisions via ExecutionTrace, 4) Supports agent handoffs"

From plan.md:
> "Each strategy will be migrated following this pattern: extends BaseStrategy<SpecKitInput, SpecKitOutput> with mandatory summary feedback that cannot be bypassed"

### Deliverables

- TypeScript type-check confirmation for all 7 strategies
- Compilation evidence showing BaseStrategy inheritance
- List of strategies with their generic type parameters

## 2. Context and Scope

### Current State

From roadmap.md Phase 2 completion:
- 7 strategies migrated to extend BaseStrategy<T>
- Each strategy implements execute() and validate() methods
- ExecutionTrace integrated per ADR-001

### Target State

Per AC-005:
- All 7 strategies inherit from BaseStrategy<TInput, TOutput>
- TypeScript compilation confirms correct generic types
- No strategies bypass the template method pattern
- All strategies use mandatory HITL summary feedback

**Expected Strategy Signatures**:
1. `SpecKitStrategy extends BaseStrategy<SpecKitInput, SpecKitOutput>`
2. `TOGAFStrategy extends BaseStrategy<TOGAFInput, TOGAFOutput>`
3. `ADRStrategy extends BaseStrategy<ADRInput, ADROutput>`
4. `RFCStrategy extends BaseStrategy<RFCInput, RFCOutput>`
5. `EnterpriseStrategy extends BaseStrategy<EnterpriseInput, EnterpriseOutput>`
6. `SDDStrategy extends BaseStrategy<SDDInput, SDDOutput>`
7. `ChatStrategy extends BaseStrategy<ChatInput, ChatOutput>`

### Out of Scope

- Strategy implementation details
- Performance validation
- Integration testing (covered in Phase 2)

## 3. Prerequisites

### Dependencies

- T-021

### Target Files

- `artifacts/`
- `CI logs`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Prepare Validation Environment

- Confirm T-021 (Verify BaseStrategy Compliance) is complete
- Confirm all Phase 2 migration tasks (T-011 through T-017) are done
- Ensure TypeScript compiler is available

### Step 4.2: Execute TypeScript Type Check

**Command**:
```bash
npm run type-check
```

**Expected Output**:
```
✓ tsc --noEmit
✓ No type errors found
✓ All strategies correctly extend BaseStrategy<T>
```

### Step 4.3: Verify Strategy Inheritance

**Manual Verification Script**:
```bash
# Check each strategy file for extends clause
grep -n "extends BaseStrategy" src/strategies/*/index.ts

# Expected output:
src/strategies/speckit/index.ts:5:export class SpecKitStrategy extends BaseStrategy<SpecKitInput, SpecKitOutput> {
src/strategies/togaf/index.ts:5:export class TOGAFStrategy extends BaseStrategy<TOGAFInput, TOGAFOutput> {
src/strategies/adr/index.ts:5:export class ADRStrategy extends BaseStrategy<ADRInput, ADROutput> {
src/strategies/rfc/index.ts:5:export class RFCStrategy extends BaseStrategy<RFCInput, RFCOutput> {
src/strategies/enterprise/index.ts:5:export class EnterpriseStrategy extends BaseStrategy<EnterpriseInput, EnterpriseOutput> {
src/strategies/sdd/index.ts:5:export class SDDStrategy extends BaseStrategy<SDDInput, SDDOutput> {
src/strategies/chat/index.ts:5:export class ChatStrategy extends BaseStrategy<ChatInput, ChatOutput> {
```

### Step 4.4: Validate Template Method Pattern

Verify strategies cannot bypass BaseStrategy.run():
```typescript
// Each strategy should have readonly name and version
readonly name: string;
readonly version: string;

// And implement these abstract methods
protected abstract executeStrategy(input: TInput): Promise<TOutput>;
```

### Step 4.5: Capture Evidence

- Save type-check output to `artifacts/validation/V-005-basestrategy-compliance.txt`
- Save grep output showing all 7 extends clauses
- Document strategy signatures with generic types

## 5. Testing Strategy

- Confirm validation command exits with code 0
- Attach output artifacts to CI or `artifacts/`
- Document any follow-up actions

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

From spec.md AC-005:

| Criterion | Status | Verification |
|-----------|--------|--------------|
| All 7 strategies extend BaseStrategy<T> | ⬜ | grep shows 7 extends clauses |
| TypeScript compilation passes | ⬜ | `npm run type-check` exits 0 |
| Correct generic type parameters | ⬜ | Each strategy has matching Input/Output types |
| Template method pattern enforced | ⬜ | No direct override of run() method |
| ExecutionTrace integrated | ⬜ | Each strategy uses this.trace |

**Strategy Checklist**:
- [ ] SpecKitStrategy extends BaseStrategy
- [ ] TOGAFStrategy extends BaseStrategy
- [ ] ADRStrategy extends BaseStrategy
- [ ] RFCStrategy extends BaseStrategy
- [ ] EnterpriseStrategy extends BaseStrategy
- [ ] SDDStrategy extends BaseStrategy
- [ ] ChatStrategy extends BaseStrategy

**Definition of Done**:
- All 7 strategies verified via grep
- TypeScript type-check passes with no errors
- Generic types correctly specified
- Evidence saved in artifacts/validation/

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md)

---

*Task: V-005 | Phase: Validation | Priority: TBD*
