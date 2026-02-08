---
title: "Implement Enforcement Tools and CI Integration"
labels: ["feature", "v0.14.x", "P0", "phase-5"]
assignees: ["@mcp-tool-builder", "@ci-fixer"]
milestone: "v0.14.0"
---

## Summary

Implement 5 enforcement tools and integrate them into the CI pipeline to automatically validate tool annotations, schema descriptions, SpecKit compliance, and progress file formats.

## Context

Quality enforcement is currently manual:
- No automated checks for tool annotations
- No validation of schema descriptions
- No enforcement of SpecKit compliance
- Progress files have inconsistent formats

Automation will ensure consistent quality standards across all contributions.

## Acceptance Criteria

### Enforcement Tools

- [ ] `validate_uniqueness` - Check for duplicate tool descriptions
- [ ] `validate_annotations` - Verify all tools have ToolAnnotations
- [ ] `validate_schema_examples` - Check Zod schemas have `.describe()` calls
- [ ] `enforce_planning` - Validate SpecKit document compliance
- [ ] `validate_progress` - Normalize and validate progress.md format

### CI Integration

- [ ] New workflow: `.github/workflows/enforce-quality.yml`
- [ ] Runs on all PRs
- [ ] Blocks merge on failures
- [ ] Reports detailed error messages
- [ ] Supports warning-only mode for gradual rollout

### Coverage

- [ ] 100% ToolAnnotations coverage achieved
- [ ] All Zod schemas have `.describe()` on fields
- [ ] All progress.md files normalized
- [ ] 90% test coverage on enforcement tools

## Technical Details

### Tool Implementations

```typescript
// validate_annotations.ts
interface AnnotationResult {
  tool: string;
  hasAnnotations: boolean;
  annotations?: ToolAnnotations;
  errors?: string[];
}

export async function validateAnnotations(): Promise<{
  passed: boolean;
  coverage: number;
  results: AnnotationResult[];
}>;

// validate_schema_examples.ts
interface SchemaResult {
  schema: string;
  field: string;
  hasDescription: boolean;
  hasExample: boolean;
}

export async function validateSchemaExamples(): Promise<{
  passed: boolean;
  coverage: number;
  results: SchemaResult[];
}>;
```

### CI Workflow

```yaml
# .github/workflows/enforce-quality.yml
name: Enforce Quality Standards

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  enforce:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Validate Tool Annotations
        run: npm run validate:annotations

      - name: Validate Schema Descriptions
        run: npm run validate:schemas

      - name: Validate Progress Files
        run: npm run validate:progress

      - name: Check for Duplicate Descriptions
        run: npm run validate:uniqueness
```

### Package.json Scripts

```json
{
  "scripts": {
    "validate:annotations": "node dist/tools/enforcement/validate-annotations.js",
    "validate:schemas": "node dist/tools/enforcement/validate-schema-examples.js",
    "validate:progress": "node dist/tools/enforcement/validate-progress.js",
    "validate:uniqueness": "node dist/tools/enforcement/validate-uniqueness.js",
    "validate:all": "npm run validate:annotations && npm run validate:schemas && npm run validate:progress && npm run validate:uniqueness"
  }
}
```

### File Structure

```
src/tools/enforcement/
  validate-annotations.ts
  validate-schema-examples.ts
  validate-progress.ts
  validate-uniqueness.ts
  enforce-planning.ts
  types.ts
  index.ts

.github/workflows/
  enforce-quality.yml
```

## Dependencies

- **Depends on**: #26 (Phase 4 complete - PAL stabilized)
- **Blocks**: #31 (Documentation - needs enforcement for consistency)

## Effort Estimate

14 hours (5 tools × 2h + CI integration 4h)

## Rollout Strategy

### Phase A: Warning Mode (Week 1)

- All checks run but don't block
- Generate reports for remediation
- Track coverage metrics

### Phase B: Blocking Mode (Week 2)

- Enable blocking on `validate_annotations`
- Enable blocking on `validate_schemas`
- Continue warnings on others

### Phase C: Full Enforcement (Week 3)

- All checks block on failure
- 100% coverage required

## Testing Requirements

- Each validation tool has unit tests
- CI workflow has integration tests
- Coverage reporting accuracy
- Error message clarity

## References

- [ADR-006](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/issues/adr.md#adr-006-enforcement-automation-layer)
- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/issues/spec.md) - REQ-025, REQ-026, REQ-027
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/issues/tasks.md) - T-061, T-062, T-063

---

*Related Tasks: T-061, T-062, T-063, T-048*
*Phase: 5 - Enforcement*
