# 🔧 P4-014: Add Validation to SpecKitStrategy [serial]

> **Parent**: #TBD
> **Labels**: `phase-4b`, `priority-high`, `serial`, `copilot-suitable`
> **Milestone**: M6: Spec-Kit Validation
> **Estimate**: 3 hours
> **Depends On**: P4-013
> **Blocks**: P4-015

## Context

SpecKitStrategy should integrate validation into the generation flow, allowing specs to be validated before rendering and including any violations in the output.

## Task Description

Integrate validation into spec generation:

**Update `src/strategies/speckit-strategy.ts`:**
```typescript
import { SpecValidator, ValidationResult, createSpecValidator } from './speckit/spec-validator.js';
import type { Constitution } from './speckit/types.js';

export interface SpecKitRenderOptions {
  constitution?: Constitution;
  includeConstitutionalConstraints?: boolean;
  validateBeforeRender?: boolean;
  failOnValidationErrors?: boolean;
}

export class SpecKitStrategy implements OutputStrategy {
  private validator?: SpecValidator;

  render(domainResult: DomainResult, options?: SpecKitRenderOptions): RenderResult {
    // Initialize validator if constitution provided
    if (options?.constitution) {
      this.validator = createSpecValidator(options.constitution);
    }

    // Prepare spec content for validation
    const specContent = this.extractSpecContent(domainResult);

    // Validate before rendering if requested
    let validationResult: ValidationResult | undefined;
    if (options?.validateBeforeRender && this.validator) {
      validationResult = this.validator.validate(specContent);

      // Fail if errors and failOnValidationErrors is true
      if (options.failOnValidationErrors && !validationResult.valid) {
        throw new ValidationError('Spec validation failed', {
          issues: validationResult.issues,
        });
      }
    }

    // Render spec with optional validation section
    const spec = this.renderSpec(domainResult, options, validationResult);
    const plan = this.renderPlan(domainResult);
    const tasks = this.renderTasks(domainResult);
    const progress = this.renderProgress(domainResult);

    return {
      primary: spec,
      secondary: [plan, tasks, progress],
      metadata: {
        validation: validationResult,
      },
    };
  }

  private renderSpec(
    domainResult: DomainResult,
    options?: SpecKitRenderOptions,
    validationResult?: ValidationResult
  ): Document {
    let content = this.renderSpecContent(domainResult, options);

    // Add validation section if validation was performed
    if (validationResult) {
      content += this.renderValidationSection(validationResult);
    }

    return { name: 'spec.md', content };
  }

  private renderValidationSection(result: ValidationResult): string {
    const sections: string[] = [];

    sections.push('\n---\n\n## ⚠️ Validation Results\n');
    sections.push(`**Score**: ${result.score}/100\n`);
    sections.push(`**Constraints Checked**: ${result.checkedConstraints}\n`);
    sections.push(`**Constraints Passed**: ${result.passedConstraints}\n\n`);

    if (result.issues.length > 0) {
      sections.push('### Issues Found\n\n');

      const errors = result.issues.filter(i => i.severity === 'error');
      const warnings = result.issues.filter(i => i.severity === 'warning');
      const infos = result.issues.filter(i => i.severity === 'info');

      if (errors.length > 0) {
        sections.push('#### ❌ Errors\n');
        errors.forEach(e => {
          sections.push(`- **${e.code}**: ${e.message}\n`);
          if (e.suggestion) sections.push(`  - *Suggestion*: ${e.suggestion}\n`);
        });
      }

      if (warnings.length > 0) {
        sections.push('\n#### ⚠️ Warnings\n');
        warnings.forEach(w => {
          sections.push(`- **${w.code}**: ${w.message}\n`);
        });
      }

      if (infos.length > 0) {
        sections.push('\n#### ℹ️ Info\n');
        infos.forEach(i => {
          sections.push(`- **${i.code}**: ${i.message}\n`);
        });
      }
    } else {
      sections.push('✅ No validation issues found.\n');
    }

    return sections.join('');
  }

  private extractSpecContent(domainResult: DomainResult): SpecContent {
    return {
      title: domainResult.metadata?.title,
      overview: domainResult.context?.overview,
      objectives: domainResult.context?.objectives,
      requirements: domainResult.context?.requirements,
      acceptanceCriteria: domainResult.context?.acceptanceCriteria,
    };
  }
}
```

## Acceptance Criteria

- [ ] `validateBeforeRender` option added to SpecKitRenderOptions
- [ ] Validation integrates with render() method
- [ ] Violations section rendered in spec.md when validation performed
- [ ] `failOnValidationErrors` option throws on errors
- [ ] ValidationResult included in render metadata
- [ ] Integration test passes

## Files to Modify

- `src/strategies/speckit-strategy.ts`

## Files to Create

- `tests/vitest/strategies/speckit-strategy-validation.spec.ts`

## Technical Notes

- Validation should be opt-in to avoid breaking existing usage
- ValidationError should be a proper typed error
- Consider caching validation results for repeated renders

## Verification Commands

```bash
npm run test:vitest -- --grep "SpecKitStrategy.*validation"
npm run build
```

## Definition of Done

1. ✅ Validation integrated into SpecKitStrategy
2. ✅ Optional validation step working
3. ✅ Violations section in spec.md
4. ✅ Unit tests pass

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-014)*
