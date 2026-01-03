# 🔧 P4-013: Implement SpecValidator [serial]

> **Parent**: #TBD
> **Labels**: `phase-4b`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M6: Spec-Kit Validation
> **Estimate**: 6 hours
> **Depends On**: P4-002
> **Blocks**: P4-014, P4-015, P4-016

## Context

A validator ensures specs comply with constitutional constraints, providing warnings and errors when specs violate project principles or constraints.

## Task Description

Create validator to check specs against constitutional constraints:

**Create `src/strategies/speckit/spec-validator.ts`:**
```typescript
import type { Constitution, Principle, Constraint, ArchitectureRule, DesignPrinciple } from './types.js';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  constraint?: string;
  location?: {
    section?: string;
    line?: number;
  };
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  checkedConstraints: number;
  passedConstraints: number;
}

export interface SpecContent {
  title?: string;
  overview?: string;
  objectives?: { description: string; priority?: string }[];
  requirements?: { description: string; type?: string }[];
  acceptanceCriteria?: string[];
  rawMarkdown?: string;
}

export class SpecValidator {
  constructor(private constitution: Constitution) {}

  validate(spec: SpecContent): ValidationResult {
    const issues: ValidationIssue[] = [];
    let checkedConstraints = 0;
    let passedConstraints = 0;

    // Validate against principles
    for (const principle of this.constitution.principles ?? []) {
      checkedConstraints++;
      const issue = this.checkPrinciple(spec, principle);
      if (issue) {
        issues.push(issue);
      } else {
        passedConstraints++;
      }
    }

    // Validate against constraints
    for (const constraint of this.constitution.constraints ?? []) {
      checkedConstraints++;
      const issue = this.checkConstraint(spec, constraint);
      if (issue) {
        issues.push(issue);
      } else {
        passedConstraints++;
      }
    }

    // Validate against architecture rules
    for (const rule of this.constitution.architectureRules ?? []) {
      checkedConstraints++;
      const issue = this.checkArchitectureRule(spec, rule);
      if (issue) {
        issues.push(issue);
      } else {
        passedConstraints++;
      }
    }

    // Validate against design principles
    for (const principle of this.constitution.designPrinciples ?? []) {
      checkedConstraints++;
      const issue = this.checkDesignPrinciple(spec, principle);
      if (issue) {
        issues.push(issue);
      } else {
        passedConstraints++;
      }
    }

    const score = checkedConstraints > 0
      ? Math.round((passedConstraints / checkedConstraints) * 100)
      : 100;

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      score,
      issues,
      checkedConstraints,
      passedConstraints,
    };
  }

  private checkPrinciple(spec: SpecContent, principle: Principle): ValidationIssue | null {
    // Check if spec aligns with principle
    // Implementation depends on principle type and content
    return null; // No issue found
  }

  private checkConstraint(spec: SpecContent, constraint: Constraint): ValidationIssue | null {
    // Check if spec violates constraint
    return null;
  }

  private checkArchitectureRule(spec: SpecContent, rule: ArchitectureRule): ValidationIssue | null {
    // Check architecture compliance
    return null;
  }

  private checkDesignPrinciple(spec: SpecContent, principle: DesignPrinciple): ValidationIssue | null {
    // Check design principle compliance
    return null;
  }
}

// Factory function
export function createSpecValidator(constitution: Constitution): SpecValidator {
  return new SpecValidator(constitution);
}
```

## Acceptance Criteria

- [ ] `SpecValidator` class created with validation methods
- [ ] `ValidationResult` interface defined with score and issues
- [ ] Checks all principle types (P1, P2, etc.)
- [ ] Checks all constraint types (C1, C2, etc.)
- [ ] Checks architecture rules (AR1, AR2, etc.)
- [ ] Checks design principles (DP1, DP2, etc.)
- [ ] Unit tests for each check type

## Files to Create

- `src/strategies/speckit/spec-validator.ts`
- `tests/vitest/strategies/speckit/spec-validator.spec.ts`

## Technical Notes

- Validation should be deterministic and reproducible
- Consider caching compiled validation rules for performance
- Support both structured SpecContent and raw markdown

## Test Cases

```typescript
describe('SpecValidator', () => {
  it('validates empty spec as valid', () => {
    const result = validator.validate({});
    expect(result.valid).toBe(true);
  });

  it('detects principle violation', () => {
    const spec = { /* spec that violates P1 */ };
    const result = validator.validate(spec);
    expect(result.issues.some(i => i.code === 'P1-VIOLATION')).toBe(true);
  });

  it('calculates correct score', () => {
    const result = validator.validate(validSpec);
    expect(result.score).toBe(100);
  });
});
```

## Verification Commands

```bash
npm run test:vitest -- --grep "SpecValidator"
npm run build
```

## Definition of Done

1. ✅ SpecValidator class implemented
2. ✅ All validation check methods working
3. ✅ Unit tests pass with 90%+ coverage
4. ✅ Works with sample CONSTITUTION.md

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-013)*
