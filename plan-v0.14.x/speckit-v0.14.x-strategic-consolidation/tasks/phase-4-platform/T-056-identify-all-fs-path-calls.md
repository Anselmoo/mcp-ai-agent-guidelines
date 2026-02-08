# T-056: Identify All fs/path Calls

**Task ID**: T-056
**Phase**: 4
**Priority**: P1
**Estimate**: 2h
**Owner**: @code-reviewer
**Reviewer**: @code-reviewer
**Dependencies**: None

---

## 1. Overview

### What

Audit codebase for all direct filesystem access.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-056
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Identify All fs/path Calls fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- None

### Target Files

- `TBD`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Create Filesystem Usage Audit Script

Create `scripts/audit-fs-usage.ts`:

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

interface FsUsageResult {
  file: string;
  line: number;
  column: number;
  type: 'fs' | 'path' | 'fs/promises';
  method: string;
  context: string;
}

interface AuditSummary {
  totalFiles: number;
  filesWithFsUsage: number;
  totalUsages: number;
  byType: Record<string, number>;
  byMethod: Record<string, number>;
  usages: FsUsageResult[];
}

/**
 * Audit codebase for direct fs/path module usage
 * Identifies all locations that need PAL abstraction
 */
export async function auditFsUsage(srcDir: string): Promise<AuditSummary> {
  const files = await glob(`${srcDir}/**/*.ts`, {
    ignore: ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**'],
  });

  const usages: FsUsageResult[] = [];
  let filesWithFsUsage = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const fileUsages = analyzeFile(file, content);
    if (fileUsages.length > 0) {
      filesWithFsUsage++;
      usages.push(...fileUsages);
    }
  }

  return {
    totalFiles: files.length,
    filesWithFsUsage,
    totalUsages: usages.length,
    byType: groupByType(usages),
    byMethod: groupByMethod(usages),
    usages,
  };
}

function analyzeFile(filePath: string, content: string): FsUsageResult[] {
  const results: FsUsageResult[] = [];
  const lines = content.split('\n');

  // Patterns to detect
  const patterns = [
    { type: 'fs' as const, regex: /\bfs\.(\w+)\s*\(/g },
    { type: 'fs/promises' as const, regex: /\bfsPromises\.(\w+)\s*\(/g },
    { type: 'path' as const, regex: /\bpath\.(\w+)\s*\(/g },
    { type: 'fs' as const, regex: /from\s+['"]node:fs['"]/g, method: 'import' },
    { type: 'fs/promises' as const, regex: /from\s+['"]node:fs\/promises['"]/g, method: 'import' },
    { type: 'path' as const, regex: /from\s+['"]node:path['"]/g, method: 'import' },
  ];

  lines.forEach((line, lineIndex) => {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(line)) !== null) {
        results.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index + 1,
          type: pattern.type,
          method: pattern.method ?? match[1] ?? 'unknown',
          context: line.trim().slice(0, 100),
        });
      }
    }
  });

  return results;
}

function groupByType(usages: FsUsageResult[]): Record<string, number> {
  return usages.reduce((acc, u) => {
    acc[u.type] = (acc[u.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function groupByMethod(usages: FsUsageResult[]): Record<string, number> {
  return usages.reduce((acc, u) => {
    acc[u.method] = (acc[u.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
```

### Step 4.2: Generate Audit Report

Create `scripts/generate-fs-audit-report.ts`:

```typescript
import { auditFsUsage } from './audit-fs-usage.js';
import * as fs from 'node:fs';

async function main() {
  const srcDir = process.argv[2] || 'src';
  const result = await auditFsUsage(srcDir);

  const report = `
# Filesystem Usage Audit Report

Generated: ${new Date().toISOString()}

## Summary

| Metric                   | Value                      |
| ------------------------ | -------------------------- |
| Total Files Scanned      | ${result.totalFiles}       |
| Files with fs/path Usage | ${result.filesWithFsUsage} |
| Total Usages             | ${result.totalUsages}      |

## By Module Type

| Type                                              | Count |
| ------------------------------------------------- | ----- |
| ${Object.entries(result.byType).map(([k, v]) => ` | ${k}  | ${v} | `).join('\n')} |

## By Method

| Method                                              | Count |
| --------------------------------------------------- | ----- |
| ${Object.entries(result.byMethod).map(([k, v]) => ` | ${k}  | ${v} | `).join('\n')} |

## All Usages

${result.usages.map(u => `- **${u.file}:${u.line}** - \`${u.type}.${u.method}\`
  \`\`\`
  ${u.context}
  \`\`\``).join('\n\n')}
`;

  fs.writeFileSync('artifacts/fs-audit-report.md', report);
  console.log(`Audit complete. Found ${result.totalUsages} usages in ${result.filesWithFsUsage} files.`);
}

main();
```

### Step 4.3: Add npm Scripts

Update `package.json`:

```json
{
  "scripts": {
    "audit:fs": "tsx scripts/audit-fs-usage.ts src",
    "audit:fs:report": "tsx scripts/generate-fs-audit-report.ts src"
  }
}
```

### Step 4.4: Create CI Check

Add to `.github/workflows/quality.yml`:

```yaml
- name: Audit Filesystem Usage
  run: npm run audit:fs:report

- name: Upload Audit Report
  uses: actions/upload-artifact@v4
  with:
    name: fs-audit-report
    path: artifacts/fs-audit-report.md
```

## 5. Testing Strategy

- Add/update unit tests for new logic
- Cover error handling and edge cases
- Run `npm run quality` before finalizing

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                                 | Status | Verification |
| ----------------------------------------- | ------ | ------------ |
| Implementation completed per requirements | ⬜      | TBD          |
| Integration points wired and documented   | ⬜      | TBD          |
| Quality checks pass                       | ⬜      | TBD          |

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md)
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md)

---

*Task: T-056 | Phase: 4 | Priority: P1*
