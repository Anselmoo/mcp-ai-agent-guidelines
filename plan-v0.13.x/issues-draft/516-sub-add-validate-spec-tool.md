# 🔧 P4-016: Add validate-spec Tool [serial]

> **Parent**: [004-parent-phase4-speckit.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/004-parent-phase4-speckit.md)
> **Labels**: `phase-4b`, `priority-medium`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M6: Spec-Kit Validation
> **Estimate**: 3 hours
> **Depends On**: P4-013
> **Blocks**: None

## Context

A dedicated validation tool allows users to validate any spec.md content against a constitution without generating new artifacts, useful for iterative refinement.

## Task Description

Create dedicated tool for spec validation:

**Create `src/schemas/validate-spec.ts`:**
```typescript
import { z } from 'zod';

export const validateSpecSchema = z.object({
  specContent: z.string().describe('The spec.md content to validate'),
  constitutionPath: z.string().optional().describe('Path to CONSTITUTION.md file'),
  constitutionContent: z.string().optional().describe('CONSTITUTION.md content directly'),
  outputFormat: z.enum(['json', 'markdown', 'summary']).default('markdown'),
  includeRecommendations: z.boolean().default(true),
});

export type ValidateSpecRequest = z.infer<typeof validateSpecSchema>;
```

**Create `src/tools/validate-spec.ts`:**
```typescript
import { parseConstitution } from '../strategies/speckit/constitution-parser.js';
import { createSpecValidator } from '../strategies/speckit/spec-validator.js';
import { parseSpecFromMarkdown } from '../strategies/speckit/spec-parser.js';
import { createMcpResponse } from './shared/response-utils.js';
import { promises as fs } from 'node:fs';
import type { ValidateSpecRequest } from '../schemas/validate-spec.js';

export async function validateSpec(request: ValidateSpecRequest) {
  // Load constitution
  let constitutionContent: string;
  if (request.constitutionContent) {
    constitutionContent = request.constitutionContent;
  } else if (request.constitutionPath) {
    constitutionContent = await fs.readFile(request.constitutionPath, 'utf-8');
  } else {
    throw new Error('Either constitutionPath or constitutionContent must be provided');
  }

  // Parse constitution and spec
  const constitution = parseConstitution(constitutionContent);
  const specContent = parseSpecFromMarkdown(request.specContent);

  // Create validator and validate
  const validator = createSpecValidator(constitution);
  const report = validator.generateReport(specContent);

  // Format output
  let output: string;
  switch (request.outputFormat) {
    case 'json':
      output = JSON.stringify(report, null, 2);
      break;
    case 'markdown':
      output = validator.formatReportAsMarkdown(report);
      break;
    case 'summary':
      output = formatSummary(report);
      break;
  }

  return createMcpResponse({
    content: output,
    metadata: {
      valid: report.valid,
      score: report.score,
      errorCount: report.metrics.failed,
      warningCount: report.metrics.warnings,
    },
  });
}

function formatSummary(report: ValidationReport): string {
  const status = report.valid ? '✅ VALID' : '❌ INVALID';
  return `Validation: ${status} | Score: ${report.score}/100 | Errors: ${report.metrics.failed} | Warnings: ${report.metrics.warnings}`;
}
```

**Update `src/index.ts`:**
```typescript
import { validateSpec } from './tools/validate-spec.js';
import { validateSpecSchema } from './schemas/validate-spec.js';

// Add to tools array
{
  name: 'validate-spec',
  description: 'Validate spec.md content against constitutional constraints',
  inputSchema: zodToJsonSchema(validateSpecSchema),
  annotations: {
    audience: ['developers', 'architects'],
    readOnlyHint: true,
    idempotentHint: true,
  },
}
```

## Acceptance Criteria

- [ ] `validate-spec` tool registered in index.ts
- [ ] Accepts spec content and constitution (path or content)
- [ ] Returns structured validation result
- [ ] Supports JSON, Markdown, and summary output formats
- [ ] Works with any spec.md content
- [ ] Unit tests pass

## Files to Create

- `src/schemas/validate-spec.ts`
- `src/tools/validate-spec.ts`
- `tests/vitest/tools/validate-spec.spec.ts`

## Files to Modify

- `src/index.ts`

## Technical Notes

- Support both file path and direct content input
- Consider caching parsed constitution for repeated validations
- Ensure error messages are user-friendly

## Example Usage

```typescript
// Via MCP call
{
  "tool": "validate-spec",
  "arguments": {
    "specContent": "# My Spec\n\n## Overview\n...",
    "constitutionPath": "./CONSTITUTION.md",
    "outputFormat": "markdown"
  }
}
```

## Verification Commands

```bash
npm run test:vitest -- --grep "validate-spec"
npm run build
```

## Definition of Done

1. ✅ Tool registered and working
2. ✅ All output formats working
3. ✅ Works with any spec content
4. ✅ Unit tests pass

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-016)*
