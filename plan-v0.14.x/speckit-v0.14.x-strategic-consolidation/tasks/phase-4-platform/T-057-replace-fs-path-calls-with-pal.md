# T-057: Replace fs/path Calls with PAL

**Task ID**: T-057
**Phase**: 4
**Priority**: P1
**Estimate**: 10h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-054, T-056

---

## 1. Overview

### What

Complete the 'Replace fs/path Calls with PAL' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-057
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Replace fs/path Calls with PAL fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-054, T-056

### Target Files

- `TBD`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Review PAL Interface

Ensure PAL interface from T-053 is available in `src/platform/pal.ts`:

```typescript
/**
 * Platform Abstraction Layer (PAL) Interface
 * Abstracts filesystem and path operations for cross-platform compatibility
 */
export interface PAL {
  // File operations
  readFile(path: string, encoding?: BufferEncoding): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<{ isFile: boolean; isDirectory: boolean }>;
  unlink(path: string): Promise<void>;

  // Path operations
  join(...paths: string[]): string;
  resolve(...paths: string[]): string;
  dirname(path: string): string;
  basename(path: string, ext?: string): string;
  extname(path: string): string;
  relative(from: string, to: string): string;
  isAbsolute(path: string): boolean;
  normalize(path: string): string;
}
```

### Step 4.2: Create Migration Script

Create `scripts/migrate-to-pal.ts`:

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

interface MigrationResult {
  file: string;
  changes: number;
  migrations: string[];
}

const REPLACEMENTS: Array<{ from: RegExp; to: string; description: string }> = [
  // Import replacements
  {
    from: /import \* as fs from ['"]node:fs['"];?/g,
    to: "import { getPAL } from '../platform/index.js';",
    description: 'Replace fs import',
  },
  {
    from: /import \* as path from ['"]node:path['"];?/g,
    to: '', // PAL includes path operations
    description: 'Remove path import (included in PAL)',
  },
  {
    from: /import \{ (.*) \} from ['"]node:fs\/promises['"];?/g,
    to: "import { getPAL } from '../platform/index.js';",
    description: 'Replace fs/promises import',
  },

  // Method replacements
  {
    from: /fs\.readFileSync\(([^,]+),\s*['"]utf-?8['"]\)/g,
    to: 'await getPAL().readFile($1)',
    description: 'Replace fs.readFileSync',
  },
  {
    from: /fs\.writeFileSync\(([^,]+),\s*([^)]+)\)/g,
    to: 'await getPAL().writeFile($1, $2)',
    description: 'Replace fs.writeFileSync',
  },
  {
    from: /fs\.existsSync\(([^)]+)\)/g,
    to: 'await getPAL().exists($1)',
    description: 'Replace fs.existsSync',
  },
  {
    from: /fs\.mkdirSync\(([^,)]+)(?:,\s*\{[^}]*\})?\)/g,
    to: 'await getPAL().mkdir($1, { recursive: true })',
    description: 'Replace fs.mkdirSync',
  },
  {
    from: /path\.(join|resolve|dirname|basename|extname|relative|normalize)\(/g,
    to: 'getPAL().$1(',
    description: 'Replace path methods',
  },
];

export async function migrateFile(filePath: string): Promise<MigrationResult> {
  let content = fs.readFileSync(filePath, 'utf-8');
  const migrations: string[] = [];
  let changes = 0;

  for (const replacement of REPLACEMENTS) {
    const matches = content.match(replacement.from);
    if (matches) {
      content = content.replace(replacement.from, replacement.to);
      changes += matches.length;
      migrations.push(`${replacement.description} (${matches.length}x)`);
    }
  }

  if (changes > 0) {
    fs.writeFileSync(filePath, content);
  }

  return { file: filePath, changes, migrations };
}

export async function migrateProject(srcDir: string): Promise<MigrationResult[]> {
  const files = await glob(`${srcDir}/**/*.ts`, {
    ignore: ['**/*.spec.ts', '**/platform/**', '**/node_modules/**'],
  });

  const results: MigrationResult[] = [];
  for (const file of files) {
    const result = await migrateFile(file);
    if (result.changes > 0) {
      results.push(result);
    }
  }

  return results;
}
```

### Step 4.3: Run Migration

Add npm script to `package.json`:

```json
{
  "scripts": {
    "migrate:pal": "tsx scripts/migrate-to-pal.ts src",
    "migrate:pal:dry": "tsx scripts/migrate-to-pal.ts src --dry-run"
  }
}
```

Run migration:

```bash
# Preview changes
npm run migrate:pal:dry

# Apply changes
npm run migrate:pal
```

### Step 4.4: Verify Migration

Post-migration verification:

```bash
# Type-check to ensure imports are correct
npm run type-check

# Run tests to verify functionality
npm run test:vitest

# Re-audit to confirm no direct fs/path usage remains
npm run audit:fs
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

*Task: T-057 | Phase: 4 | Priority: P1*
