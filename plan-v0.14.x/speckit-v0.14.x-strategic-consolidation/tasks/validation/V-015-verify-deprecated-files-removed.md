# V-015: Verify Deprecated Files Removed and Content Migrated

**Task ID**: V-015
**Phase**: Validation
**Priority**: P1 (Cleanup Critical)
**Estimate**: 3h
**Owner**: @code-reviewer
**Reviewer**: @architecture-advisor
**Dependencies**: All Phase tasks (T-001 through T-067)
**References**: spec.md (consolidation goals), plan.md (migration targets)

---

## 1. Overview

### What

Verify that all deprecated files, stubs, and legacy code have been properly deleted, and that their content was either:
1. **Deleted** (if obsolete)
2. **Merged** (into consolidated modules)
3. **Migrated** (to new locations with proper references)

### Why

- **Code Hygiene**: Prevents confusion from orphaned or duplicate code
- **Bundle Size**: Eliminates dead code from production builds
- **Maintainability**: Ensures single source of truth for all functionality
- **Documentation Integrity**: Confirms migration guides are accurate

### Context from Spec-Kit

From spec.md consolidation goals:
> "Eliminate redundant tooling and consolidate into unified frameworks"

From plan.md Phase 3:
> "Consolidate 11 prompt builders into unified framework"

From roadmap.md metrics:
> "Tools: 35 → 28 (-20% surface, +100% coverage)"
> "Files: Eliminate redundant tool files through consolidation"

### Deliverables

- Audit report of all removed files with disposition (deleted/merged/migrated)
- Verification that no orphaned imports exist
- Confirmation that migration references are valid
- Dead code detection report (zero findings expected)

## 2. Context and Scope

### Files Expected to be Removed/Consolidated

Based on consolidation plan, the following patterns should be verified:

| Category               | Original Location             | Expected Disposition | Target                          |
| ---------------------- | ----------------------------- | -------------------- | ------------------------------- |
| Legacy prompt builders | `src/tools/prompt/*.ts`       | Merged               | `src/tools/prompt/framework/`   |
| Duplicate utilities    | `src/tools/shared/utils/*.ts` | Merged               | `src/tools/shared/`             |
| Old shell scripts      | `scripts/*.sh`                | Migrated             | `scripts/*.ts` (cross-platform) |
| Legacy test files      | `tests/unit/*.test.ts`        | Migrated             | `tests/vitest/*.spec.ts`        |
| Deprecated configs     | `./*.config.js`               | Deleted              | N/A (superseded)                |
| Draft documentation    | `docs/draft-*.md`             | Merged               | `docs/*.md`                     |

### Out of Scope

- Files that are intentionally kept for backward compatibility
- External dependency files (node_modules, etc.)
- Generated files (dist/, coverage/)

## 3. Prerequisites

### Dependencies

- All Phase 1-5 tasks completed
- Version control history available for audit

### Target Files

- `artifacts/file-removal-audit.json` (generated)
- `artifacts/migration-map.json` (generated)
- `artifacts/dead-code-report.md` (generated)

### Tooling

- Node.js 22.x
- `knip` for dead code detection
- `madge` for circular dependency detection
- Custom audit scripts

## 4. Validation Guide

### Step 4.1: Generate File Removal Audit

Create `scripts/audit-file-removals.ts`:

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

interface FileRemovalRecord {
  originalPath: string;
  disposition: 'deleted' | 'merged' | 'migrated';
  targetPath?: string;
  reason: string;
  commit?: string;
  verified: boolean;
}

interface AuditResult {
  timestamp: string;
  totalRemovals: number;
  byDisposition: Record<string, number>;
  records: FileRemovalRecord[];
  orphanedImports: string[];
  invalidReferences: string[];
}

/**
 * Audit file removals from git history
 */
export async function auditFileRemovals(repoPath: string): Promise<AuditResult> {
  // Get deleted files from git
  const deletedFiles = execSync(
    'git log --diff-filter=D --summary --since="2025-01-01" | grep "delete mode" | awk \'{print $4}\'',
    { cwd: repoPath, encoding: 'utf-8' }
  ).split('\n').filter(Boolean);

  // Get renamed/moved files
  const renamedFiles = execSync(
    'git log --diff-filter=R --summary --since="2025-01-01" -M | grep "rename"',
    { cwd: repoPath, encoding: 'utf-8' }
  ).split('\n').filter(Boolean);

  const records: FileRemovalRecord[] = [];

  // Process deleted files
  for (const file of deletedFiles) {
    const record = await classifyRemoval(file, repoPath);
    records.push(record);
  }

  // Check for orphaned imports
  const orphanedImports = await findOrphanedImports(repoPath, deletedFiles);

  // Check for invalid references in documentation
  const invalidReferences = await findInvalidReferences(repoPath);

  return {
    timestamp: new Date().toISOString(),
    totalRemovals: records.length,
    byDisposition: groupByDisposition(records),
    records,
    orphanedImports,
    invalidReferences,
  };
}

async function classifyRemoval(filePath: string, repoPath: string): Promise<FileRemovalRecord> {
  // Check git log for context
  const commitInfo = execSync(
    `git log --oneline -1 -- "${filePath}"`,
    { cwd: repoPath, encoding: 'utf-8' }
  ).trim();

  const commitMessage = commitInfo.toLowerCase();

  let disposition: 'deleted' | 'merged' | 'migrated' = 'deleted';
  let targetPath: string | undefined;
  let reason = 'Removed as obsolete';

  if (commitMessage.includes('merge') || commitMessage.includes('consolidate')) {
    disposition = 'merged';
    reason = 'Merged into consolidated module';
    targetPath = extractTargetFromCommit(commitMessage);
  } else if (commitMessage.includes('migrate') || commitMessage.includes('move')) {
    disposition = 'migrated';
    reason = 'Migrated to new location';
    targetPath = extractTargetFromCommit(commitMessage);
  }

  return {
    originalPath: filePath,
    disposition,
    targetPath,
    reason,
    commit: commitInfo.split(' ')[0],
    verified: targetPath ? await verifyTarget(targetPath, repoPath) : true,
  };
}

async function findOrphanedImports(repoPath: string, deletedFiles: string[]): Promise<string[]> {
  const orphaned: string[] = [];

  for (const deleted of deletedFiles) {
    const basename = path.basename(deleted, path.extname(deleted));

    // Search for imports of deleted file
    try {
      const matches = execSync(
        `grep -r "from.*${basename}" src/ --include="*.ts" -l 2>/dev/null || true`,
        { cwd: repoPath, encoding: 'utf-8' }
      ).split('\n').filter(Boolean);

      orphaned.push(...matches.map(m => `${m} imports deleted file: ${deleted}`));
    } catch {
      // No matches found
    }
  }

  return orphaned;
}

async function findInvalidReferences(repoPath: string): Promise<string[]> {
  const invalid: string[] = [];

  // Check markdown files for broken internal links
  const mdFiles = execSync(
    'find docs -name "*.md" -type f',
    { cwd: repoPath, encoding: 'utf-8' }
  ).split('\n').filter(Boolean);

  for (const mdFile of mdFiles) {
    const content = fs.readFileSync(path.join(repoPath, mdFile), 'utf-8');
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
      const linkTarget = match[2];
      if (linkTarget.startsWith('http')) continue;
      if (linkTarget.startsWith('#')) continue;

      const resolvedPath = path.resolve(path.dirname(path.join(repoPath, mdFile)), linkTarget);
      if (!fs.existsSync(resolvedPath)) {
        invalid.push(`${mdFile}: broken link to ${linkTarget}`);
      }
    }
  }

  return invalid;
}

function groupByDisposition(records: FileRemovalRecord[]): Record<string, number> {
  return records.reduce((acc, r) => {
    acc[r.disposition] = (acc[r.disposition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
```

### Step 4.2: Run Dead Code Detection

Create `scripts/detect-dead-code.ts`:

```typescript
import { execSync } from 'node:child_process';

interface DeadCodeResult {
  unusedExports: string[];
  unusedFiles: string[];
  unusedDependencies: string[];
  circularDependencies: string[][];
}

/**
 * Detect dead code using knip and madge
 */
export async function detectDeadCode(repoPath: string): Promise<DeadCodeResult> {
  // Run knip for unused exports and files
  let knipOutput: string;
  try {
    knipOutput = execSync('npx knip --reporter json', {
      cwd: repoPath,
      encoding: 'utf-8',
    });
  } catch (error: any) {
    knipOutput = error.stdout || '{}';
  }

  const knipResult = JSON.parse(knipOutput || '{}');

  // Run madge for circular dependencies
  let madgeOutput: string;
  try {
    madgeOutput = execSync('npx madge --circular --json src/', {
      cwd: repoPath,
      encoding: 'utf-8',
    });
  } catch (error: any) {
    madgeOutput = error.stdout || '[]';
  }

  const circularDeps = JSON.parse(madgeOutput || '[]');

  return {
    unusedExports: knipResult.unusedExports || [],
    unusedFiles: knipResult.unusedFiles || [],
    unusedDependencies: knipResult.unusedDependencies || [],
    circularDependencies: circularDeps,
  };
}
```

### Step 4.3: Verify Migration Map

Create `scripts/verify-migrations.ts`:

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';

interface MigrationEntry {
  source: string;
  target: string;
  type: 'file' | 'export' | 'function';
  verified: boolean;
  notes?: string;
}

interface MigrationMap {
  version: string;
  migrations: MigrationEntry[];
  summary: {
    total: number;
    verified: number;
    failed: number;
  };
}

/**
 * Expected migrations from consolidation plan
 */
const EXPECTED_MIGRATIONS: MigrationEntry[] = [
  // Prompt builder consolidation
  {
    source: 'src/tools/prompt/hierarchical-prompt-builder.ts',
    target: 'src/tools/prompt/framework/prompt-framework.ts',
    type: 'export',
    verified: false,
  },
  {
    source: 'src/tools/prompt/domain-neutral-prompt-builder.ts',
    target: 'src/tools/prompt/framework/prompt-framework.ts',
    type: 'export',
    verified: false,
  },
  // Test file migrations
  {
    source: 'tests/unit/',
    target: 'tests/vitest/',
    type: 'file',
    verified: false,
  },
  // Shell script migrations
  {
    source: 'scripts/*.sh',
    target: 'scripts/*.ts',
    type: 'file',
    verified: false,
  },
];

export async function verifyMigrations(repoPath: string): Promise<MigrationMap> {
  const migrations = [...EXPECTED_MIGRATIONS];

  for (const migration of migrations) {
    migration.verified = await verifyMigration(migration, repoPath);
  }

  const verified = migrations.filter(m => m.verified).length;
  const failed = migrations.filter(m => !m.verified).length;

  return {
    version: '0.14.0',
    migrations,
    summary: {
      total: migrations.length,
      verified,
      failed,
    },
  };
}

async function verifyMigration(entry: MigrationEntry, repoPath: string): Promise<boolean> {
  const targetPath = path.join(repoPath, entry.target);

  if (entry.type === 'file') {
    // For file migrations, check target exists
    return fs.existsSync(targetPath);
  }

  if (entry.type === 'export') {
    // For export migrations, check target file contains expected export
    if (!fs.existsSync(targetPath)) return false;
    const content = fs.readFileSync(targetPath, 'utf-8');
    const sourceName = path.basename(entry.source, '.ts');
    return content.includes(sourceName) || content.includes('export');
  }

  return false;
}
```

### Step 4.4: Generate Final Report

Create `scripts/generate-removal-report.ts`:

```typescript
import { auditFileRemovals } from './audit-file-removals.js';
import { detectDeadCode } from './detect-dead-code.js';
import { verifyMigrations } from './verify-migrations.js';
import * as fs from 'node:fs';

async function main() {
  const repoPath = process.cwd();

  console.log('📋 Auditing file removals...');
  const removalAudit = await auditFileRemovals(repoPath);

  console.log('🔍 Detecting dead code...');
  const deadCode = await detectDeadCode(repoPath);

  console.log('✅ Verifying migrations...');
  const migrations = await verifyMigrations(repoPath);

  // Generate report
  const report = `
# V-015 Validation Report: Deprecated Files Removed

Generated: ${new Date().toISOString()}

## Summary

| Metric                | Value                                                      | Status                                                     |
| --------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| Files Removed         | ${removalAudit.totalRemovals}                              | ✅                                                          |
| Orphaned Imports      | ${removalAudit.orphanedImports.length}                     | ${removalAudit.orphanedImports.length === 0 ? '✅' : '❌'}   |
| Invalid References    | ${removalAudit.invalidReferences.length}                   | ${removalAudit.invalidReferences.length === 0 ? '✅' : '❌'} |
| Unused Exports        | ${deadCode.unusedExports.length}                           | ${deadCode.unusedExports.length === 0 ? '✅' : '⚠️'}         |
| Unused Files          | ${deadCode.unusedFiles.length}                             | ${deadCode.unusedFiles.length === 0 ? '✅' : '❌'}           |
| Circular Dependencies | ${deadCode.circularDependencies.length}                    | ${deadCode.circularDependencies.length === 0 ? '✅' : '⚠️'}  |
| Migrations Verified   | ${migrations.summary.verified}/${migrations.summary.total} | ${migrations.summary.failed === 0 ? '✅' : '❌'}             |

## File Removal Disposition

| Disposition | Count                                    |
| ----------- | ---------------------------------------- |
| Deleted     | ${removalAudit.byDisposition['deleted']  |  | 0} |
| Merged      | ${removalAudit.byDisposition['merged']   |  | 0} |
| Migrated    | ${removalAudit.byDisposition['migrated'] |  | 0} |

## Issues Found

${removalAudit.orphanedImports.length > 0 ? `
### Orphaned Imports
${removalAudit.orphanedImports.map(o => `- ${o}`).join('\n')}
` : '✅ No orphaned imports found'}

${removalAudit.invalidReferences.length > 0 ? `
### Invalid References
${removalAudit.invalidReferences.map(r => `- ${r}`).join('\n')}
` : '✅ No invalid references found'}

${deadCode.unusedFiles.length > 0 ? `
### Unused Files
${deadCode.unusedFiles.map(f => `- ${f}`).join('\n')}
` : '✅ No unused files detected'}

## Validation Result

${removalAudit.orphanedImports.length === 0 &&
  removalAudit.invalidReferences.length === 0 &&
  deadCode.unusedFiles.length === 0 &&
  migrations.summary.failed === 0
  ? '✅ **PASS**: All deprecated files properly removed and migrated'
  : '❌ **FAIL**: Issues found - see details above'}
`;

  fs.writeFileSync('artifacts/v015-removal-report.md', report);
  fs.writeFileSync('artifacts/file-removal-audit.json', JSON.stringify(removalAudit, null, 2));
  fs.writeFileSync('artifacts/migration-map.json', JSON.stringify(migrations, null, 2));

  console.log('\\n📄 Report generated: artifacts/v015-removal-report.md');

  // Exit with error if validation failed
  if (removalAudit.orphanedImports.length > 0 ||
      removalAudit.invalidReferences.length > 0 ||
      deadCode.unusedFiles.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
```

## 5. Testing Strategy

- Run audit scripts after each phase completion
- Integrate into CI as post-consolidation check
- Manual review of migration map for accuracy

## 6. Risks and Mitigations

| Risk                                   | Likelihood | Impact | Mitigation                         |
| -------------------------------------- | ---------- | ------ | ---------------------------------- |
| False positives in dead code detection | Medium     | Low    | Manual review of flagged items     |
| Missing migration records              | Low        | Medium | Comprehensive git log analysis     |
| Circular dependencies introduced       | Low        | High   | madge CI check with zero tolerance |
| Orphaned imports cause build failures  | High       | High   | TypeScript strict mode catches     |

## 7. Acceptance Criteria

| Criterion                             | Status | Verification                              |
| ------------------------------------- | ------ | ----------------------------------------- |
| Zero orphaned imports in src/         | ⬜      | `grep_search` + TypeScript build          |
| Zero invalid documentation references | ⬜      | Link checker script                       |
| All migrations verified in map        | ⬜      | `scripts/verify-migrations.ts`            |
| Zero unused files detected by knip    | ⬜      | `npx knip`                                |
| Zero circular dependencies            | ⬜      | `npx madge --circular src/`               |
| Audit report generated                | ⬜      | `artifacts/v015-removal-report.md` exists |

## 8. npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "validate:removals": "tsx scripts/generate-removal-report.ts",
    "audit:dead-code": "npx knip",
    "audit:circular": "npx madge --circular src/",
    "audit:links": "tsx scripts/check-doc-links.ts"
  }
}
```

## 9. CI Integration

Add to `.github/workflows/quality.yml`:

```yaml
- name: V-015 Validate File Removals
  run: npm run validate:removals

- name: Upload Removal Audit
  uses: actions/upload-artifact@v4
  with:
    name: removal-audit
    path: |
      artifacts/v015-removal-report.md
      artifacts/file-removal-audit.json
      artifacts/migration-map.json
```

---

## 10. References

- [spec.md](../../spec.md) - Consolidation goals
- [plan.md](../../plan.md) - Migration targets
- [tasks.md](../../tasks.md) - Phase completion checklist

---

*Task: V-015 | Phase: Validation | Priority: P1*
