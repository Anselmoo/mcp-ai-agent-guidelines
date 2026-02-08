# T-054: Implement NodePAL

**Task ID**: T-054
**Phase**: 4
**Priority**: P1
**Estimate**: 6h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-053

---

## 1. Overview

### What

Complete the 'Implement NodePAL' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-054
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- PAL interface defined in T-053
- No production implementation exists
- Direct fs/path calls scattered throughout codebase

### Target State

- `NodePAL` implements full `PlatformAbstractionLayer` interface
- Cross-platform path handling (Windows, Linux, macOS)
- Async file operations with proper error handling
- Thread-safe implementation for concurrent access

### Out of Scope

- Shell script replacement (future task)
- Streaming file operations

## 3. Prerequisites

### Dependencies

- T-053: PAL interface defined

### Target Files

- `src/platform/node-pal.ts` (new)
- `src/platform/index.ts` (barrel export)

### Tooling

- Node.js 22.x (fs/promises API)
- TypeScript strict mode

## 4. Implementation Guide

### Step 4.1: Create NodePAL Class

**File**: `src/platform/node-pal.ts`
```typescript
import type { PlatformAbstractionLayer, FileInfo, Platform } from './pal.interface.js';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { glob } from 'glob';

export class NodePAL implements PlatformAbstractionLayer {
  // File Operations
  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(filePath: string): Promise<void> {
    await fs.rm(filePath, { recursive: true, force: true });
  }

  async stat(filePath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath);
    return {
      path: filePath,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      size: stats.size,
      mtime: stats.mtime,
    };
  }

  // Directory Operations
  async listFiles(dir: string, pattern?: string): Promise<string[]> {
    if (pattern) {
      return glob(pattern, { cwd: dir, absolute: true });
    }
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter(e => e.isFile())
      .map(e => path.join(dir, e.name));
  }

  async createDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  // Path Operations
  resolvePath(...segments: string[]): string {
    return path.resolve(...segments);
  }

  joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  extname(filePath: string): string {
    return path.extname(filePath);
  }

  // Environment
  getEnv(key: string): string | undefined {
    return process.env[key];
  }

  getPlatform(): Platform {
    return process.platform as Platform;
  }

  getHomeDir(): string {
    return os.homedir();
  }

  getTempDir(): string {
    return os.tmpdir();
  }

  getCwd(): string {
    return process.cwd();
  }
}
```

### Step 4.2: Export Singleton

**File**: `src/platform/index.ts`
```typescript
import { NodePAL } from './node-pal.js';
import type { PlatformAbstractionLayer } from './pal.interface.js';

export type { PlatformAbstractionLayer, FileInfo, Platform } from './pal.interface.js';
export { NodePAL } from './node-pal.js';
export { MockPAL } from './mock-pal.js';

// Singleton for production use
export const pal: PlatformAbstractionLayer = new NodePAL();
```

### Step 4.3: Add Unit Tests

**File**: `tests/vitest/platform/node-pal.spec.ts`
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NodePAL } from '../../../src/platform/node-pal.js';
import * as os from 'node:os';
import * as path from 'node:path';

describe('NodePAL', () => {
  let pal: NodePAL;
  let testDir: string;

  beforeEach(async () => {
    pal = new NodePAL();
    testDir = path.join(os.tmpdir(), `nodepal-test-${Date.now()}`);
    await pal.createDir(testDir);
  });

  afterEach(async () => {
    await pal.delete(testDir);
  });

  it('should write and read files', async () => {
    const filePath = pal.joinPath(testDir, 'test.txt');
    await pal.writeFile(filePath, 'hello world');
    const content = await pal.readFile(filePath);
    expect(content).toBe('hello world');
  });

  it('should check file existence', async () => {
    const filePath = pal.joinPath(testDir, 'exists.txt');
    expect(await pal.exists(filePath)).toBe(false);
    await pal.writeFile(filePath, 'content');
    expect(await pal.exists(filePath)).toBe(true);
  });

  it('should return correct platform', () => {
    const platform = pal.getPlatform();
    expect(['darwin', 'linux', 'win32']).toContain(platform);
  });
});
```
- Add configuration entries where needed

### Step 4.4: Validate Behavior

- Run unit tests for new logic
- Ensure TypeScript strict mode passes

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

- [spec.md](../../spec.md)
- [tasks.md](../../tasks.md)
- `src/platform/node-pal.ts`
- [issue template](../../issues/templates/issue-022-pal-interface.md)

---

*Task: T-054 | Phase: 4 | Priority: P1*
