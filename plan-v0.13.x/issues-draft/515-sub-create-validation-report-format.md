# 🔧 P4-015: Create Validation Report Format [serial]

> **Parent**: [004-parent-phase4-speckit.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/004-parent-phase4-speckit.md)
> **Labels**: `phase-4b`, `priority-medium`, `serial`, `copilot-suitable`
> **Milestone**: M6: Spec-Kit Validation
> **Estimate**: 2 hours
> **Depends On**: P4-014
> **Blocks**: P4-016

## Context

A standardized validation report format ensures consistent output for validation results, supporting both human-readable and machine-parseable formats.

## Task Description

Define format for validation reports:

**Update `src/strategies/speckit/types.ts`:**
```typescript
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  constraint?: {
    id: string;
    type: 'principle' | 'constraint' | 'architecture-rule' | 'design-principle';
    description?: string;
  };
  location?: {
    section?: string;
    field?: string;
    line?: number;
    column?: number;
  };
  suggestion?: string;
  fixable?: boolean;
}

export interface ValidationReport {
  // Summary
  valid: boolean;
  score: number;
  timestamp: string;

  // Metrics
  metrics: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    info: number;
  };

  // Breakdown by type
  byType: {
    principles: { checked: number; passed: number };
    constraints: { checked: number; passed: number };
    architectureRules: { checked: number; passed: number };
    designPrinciples: { checked: number; passed: number };
  };

  // Issues
  issues: ValidationIssue[];

  // Recommendations
  recommendations?: string[];
}
```

**Update `src/strategies/speckit/spec-validator.ts`:**
```typescript
export class SpecValidator {
  // ... existing code ...

  generateReport(spec: SpecContent): ValidationReport {
    const result = this.validate(spec);

    return {
      valid: result.valid,
      score: result.score,
      timestamp: new Date().toISOString(),
      metrics: {
        total: result.checkedConstraints,
        passed: result.passedConstraints,
        failed: result.issues.filter(i => i.severity === 'error').length,
        warnings: result.issues.filter(i => i.severity === 'warning').length,
        info: result.issues.filter(i => i.severity === 'info').length,
      },
      byType: this.categorizeResults(result),
      issues: result.issues,
      recommendations: this.generateRecommendations(result),
    };
  }

  formatReportAsMarkdown(report: ValidationReport): string {
    const lines: string[] = [];

    lines.push('# Validation Report\n');
    lines.push(`**Generated**: ${report.timestamp}\n`);
    lines.push(`**Status**: ${report.valid ? '✅ Valid' : '❌ Invalid'}\n`);
    lines.push(`**Score**: ${report.score}/100\n\n`);

    lines.push('## Summary\n\n');
    lines.push('| Metric | Count |\n');
    lines.push('|--------|-------|\n');
    lines.push(`| Total Constraints | ${report.metrics.total} |\n`);
    lines.push(`| Passed | ${report.metrics.passed} |\n`);
    lines.push(`| Errors | ${report.metrics.failed} |\n`);
    lines.push(`| Warnings | ${report.metrics.warnings} |\n`);
    lines.push(`| Info | ${report.metrics.info} |\n\n`);

    if (report.issues.length > 0) {
      lines.push('## Issues\n\n');

      for (const severity of ['error', 'warning', 'info'] as const) {
        const issues = report.issues.filter(i => i.severity === severity);
        if (issues.length > 0) {
          const icon = { error: '❌', warning: '⚠️', info: 'ℹ️' }[severity];
          lines.push(`### ${icon} ${severity.charAt(0).toUpperCase() + severity.slice(1)}s\n\n`);

          for (const issue of issues) {
            lines.push(`- **${issue.code}**: ${issue.message}\n`);
            if (issue.constraint) {
              lines.push(`  - Constraint: ${issue.constraint.id} (${issue.constraint.type})\n`);
            }
            if (issue.suggestion) {
              lines.push(`  - Suggestion: ${issue.suggestion}\n`);
            }
          }
          lines.push('\n');
        }
      }
    }

    if (report.recommendations && report.recommendations.length > 0) {
      lines.push('## Recommendations\n\n');
      report.recommendations.forEach(r => {
        lines.push(`- ${r}\n`);
      });
    }

    return lines.join('');
  }
}
```

## Acceptance Criteria

- [ ] `ValidationReport` type defined with full structure
- [ ] `ValidationSeverity` type: 'error' | 'warning' | 'info'
- [ ] Metrics breakdown by constraint type
- [ ] `generateReport()` method creates structured report
- [ ] `formatReportAsMarkdown()` produces human-readable output
- [ ] Unit tests for report generation

## Files to Modify

- `src/strategies/speckit/types.ts`
- `src/strategies/speckit/spec-validator.ts`

## Technical Notes

- Report should be serializable to JSON
- Markdown format should be GitHub-flavored
- Consider adding HTML/JSON export options later

## Verification Commands

```bash
npm run test:vitest -- --grep "ValidationReport"
npm run build
```

## Definition of Done

1. ✅ ValidationReport type defined
2. ✅ Report generation working
3. ✅ Markdown formatting working
4. ✅ Unit tests pass

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-015)*
