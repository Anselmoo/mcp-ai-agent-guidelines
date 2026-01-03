# 🔧 P4-012: Strategy Selection for Spec-Kit [serial]

> **Parent**: #698
> **Labels**: `phase-4a`, `priority-medium`, `serial`, `copilot-suitable`
> **Milestone**: M5: Spec-Kit Core
> **Estimate**: 2 hours
> **Depends On**: P4-009
> **Blocks**: None

## Context

OutputSelector should recommend Spec-Kit when appropriate context signals are detected, enabling automatic selection of the most suitable output strategy.

## Task Description

Add Spec-Kit to OutputSelector decision matrix:

**Update `src/gateway/output-selector.ts`:**
```typescript
import { OutputApproach } from '../strategies/output-strategy.js';

interface ContextSignals {
  keywords: string[];
  domainType?: string;
  hasConstitution?: boolean;
}

// Add Spec-Kit keywords to detection
const SPECKIT_SIGNALS = [
  'spec', 'specification', 'spec.md',
  'plan', 'plan.md',
  'tasks', 'tasks.md', 'task list',
  'progress', 'progress.md',
  'github workflow', 'speckit',
  'constitution', 'constraints',
  'acceptance criteria'
];

export function selectApproach(signals: ContextSignals): OutputApproach {
  const normalizedKeywords = signals.keywords.map(k => k.toLowerCase());

  // Check for Spec-Kit signals
  const speckitScore = SPECKIT_SIGNALS.filter(signal =>
    normalizedKeywords.some(k => k.includes(signal))
  ).length;

  if (speckitScore >= 2 || signals.hasConstitution) {
    return OutputApproach.SPECKIT;
  }

  // ... existing selection logic for other approaches
}

export function recommendApproach(context: string): {
  approach: OutputApproach;
  confidence: number;
  reasoning: string;
} {
  const keywords = extractKeywords(context);
  const signals: ContextSignals = { keywords };

  // Detect constitution reference
  if (context.includes('CONSTITUTION') || context.includes('constitution')) {
    signals.hasConstitution = true;
  }

  const approach = selectApproach(signals);

  return {
    approach,
    confidence: calculateConfidence(signals, approach),
    reasoning: generateReasoning(signals, approach),
  };
}
```

## Acceptance Criteria

- [ ] Spec-Kit signals defined in output-selector
- [ ] `selectApproach()` returns `SPECKIT` for appropriate signals
- [ ] Constitution presence boosts Spec-Kit selection
- [ ] `recommendApproach()` provides reasoning
- [ ] Unit tests for each signal combination

## Files to Modify

- `src/gateway/output-selector.ts`

## Files to Create

- `tests/vitest/gateway/output-selector.spec.ts` (if not exists)

## Technical Notes

- Balance between specific signals and general applicability
- Consider weighting: constitution presence should be strong signal
- Avoid false positives from generic "plan" or "spec" keywords

## Test Cases

```typescript
describe('OutputSelector', () => {
  it('selects speckit for constitution reference', () => {
    expect(selectApproach({ keywords: ['constitution'] }))
      .toBe(OutputApproach.SPECKIT);
  });

  it('selects speckit for multiple task signals', () => {
    expect(selectApproach({ keywords: ['spec.md', 'plan.md'] }))
      .toBe(OutputApproach.SPECKIT);
  });

  it('does not select speckit for single generic keyword', () => {
    expect(selectApproach({ keywords: ['plan'] }))
      .not.toBe(OutputApproach.SPECKIT);
  });
});
```

## Verification Commands

```bash
npm run test:vitest -- --grep "OutputSelector"
npm run build
```

## Definition of Done

1. ✅ Selection logic updated
2. ✅ Unit tests pass with 90%+ coverage
3. ✅ Recommends speckit for appropriate contexts
4. ✅ No false positives

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-012)*
