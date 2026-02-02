# T-055: Implement MockPAL

**Task ID**: T-055
**Phase**: 4
**Priority**: P1
**Estimate**: 4h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-053

---

## 1. Overview

### What

Complete the 'Implement MockPAL' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-055
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- PAL interface defined in T-053
- NodePAL implemented in T-054
- Tests require file system mocking

### Target State

- `MockPAL` implements full `PlatformAbstractionLayer` interface
- In-memory file system simulation
- Configurable error injection for edge case testing
- Full compatibility with NodePAL behavior

### Out of Scope

- Performance optimization (test-only use)
- Streaming operations

## 3. Prerequisites

### Dependencies

- T-053: PAL interface defined

### Target Files

- `src/platform/mock-pal.ts` (new)
- Update `src/platform/index.ts` (export)

### Tooling

- Node.js 22.x
- Vitest for testing

## 4. Implementation Guide

### Step 4.1: Create MockPAL Class

**File**: `src/platform/mock-pal.ts`
```typescript
import type { PlatformAbstractionLayer, FileInfo, Platform } from './pal.interface.js';

interface MockFile {
  content: string;
  mtime: Date;
}

interface MockPALOptions {
  platform?: Platform;
  cwd?: string;
  homeDir?: string;
  env?: Record<string, string>;
}

export class MockPAL implements PlatformAbstractionLayer {
  private files = new Map<string, MockFile>();
  private directories = new Set<string>();
  private errorOnPath = new Map<string, Error>();

  private platform: Platform;
  private cwd: string;
  private homeDir: string;
  private env: Record<string, string>;

  constructor(options: MockPALOptions = {}) {
    this.platform = options.platform ?? 'linux';
    this.cwd = options.cwd ?? '/mock/cwd';
    this.homeDir = options.homeDir ?? '/mock/home';
    this.env = options.env ?? {};
    this.directories.add('/');
    this.directories.add(this.cwd);
    this.directories.add(this.homeDir);
  }

  // Test Helpers
  setFile(path: string, content: string): void {
    this.files.set(this.normalizePath(path), {
      content,
      mtime: new Date(),
    });
    this.ensureParentDirs(path);
  }

  setFiles(fileMap: Record<string, string>): void {
    for (const [path, content] of Object.entries(fileMap)) {
      this.setFile(path, content);
    }
  }

  setErrorOnPath(path: string, error: Error): void {
    this.errorOnPath.set(this.normalizePath(path), error);
  }

  reset(): void {
    this.files.clear();
    this.directories.clear();
    this.errorOnPath.clear();
    this.directories.add('/');
  }

  // File Operations
  async readFile(filePath: string): Promise<string> {
    const normalized = this.normalizePath(filePath);
    this.checkError(normalized);

    const file = this.files.get(normalized);
    if (!file) {
      throw new Error(`ENOENT: no such file or directory: ${filePath}`);
    }
    return file.content;
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const normalized = this.normalizePath(filePath);
    this.checkError(normalized);
    this.ensureParentDirs(filePath);

    this.files.set(normalized, {
      content,
      mtime: new Date(),
    });
  }

  async exists(filePath: string): Promise<boolean> {
    const normalized = this.normalizePath(filePath);
    return this.files.has(normalized) || this.directories.has(normalized);
  }

  async delete(filePath: string): Promise<void> {
    const normalized = this.normalizePath(filePath);
    this.files.delete(normalized);
    this.directories.delete(normalized);
  }

  async stat(filePath: string): Promise<FileInfo> {
    const normalized = this.normalizePath(filePath);
    const file = this.files.get(normalized);
    const isDir = this.directories.has(normalized);

    if (!file && !isDir) {
      throw new Error(`ENOENT: no such file or directory: ${filePath}`);
    }

    return {
      path: filePath,
      isDirectory: isDir,
      isFile: !!file,
      size: file?.content.length ?? 0,
      mtime: file?.mtime ?? new Date(),
    };
  }

  // Directory Operations
  async listFiles(dir: string, pattern?: string): Promise<string[]> {
    const normalized = this.normalizePath(dir);
    const files = Array.from(this.files.keys())
      .filter(f => f.startsWith(normalized + '/'));

    if (pattern) {
      const regex = this.globToRegex(pattern);
      return files.filter(f => regex.test(f));
    }
    return files;
  }

  async createDir(dirPath: string): Promise<void> {
    this.ensureParentDirs(dirPath);
    this.directories.add(this.normalizePath(dirPath));
  }

  // Path Operations
  resolvePath(...segments: string[]): string {
    return this.normalizePath(segments.join('/'));
  }

  joinPath(...segments: string[]): string {
    return segments.join(this.platform === 'win32' ? '\\' : '/');
  }

  dirname(filePath: string): string {
    const parts = filePath.split(/[\/\\]/);
    parts.pop();
    return parts.join('/') || '/';
  }

  basename(filePath: string, ext?: string): string {
    const name = filePath.split(/[\/\\]/).pop() ?? '';
    return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
  }

  extname(filePath: string): string {
    const name = this.basename(filePath);
    const idx = name.lastIndexOf('.');
    return idx > 0 ? name.slice(idx) : '';
  }

  // Environment
  getEnv(key: string): string | undefined {
    return this.env[key];
  }

  getPlatform(): Platform {
    return this.platform;
  }

  getHomeDir(): string {
    return this.homeDir;
  }

  getTempDir(): string {
    return '/mock/tmp';
  }

  getCwd(): string {
    return this.cwd;
  }

  // Private Helpers
  private normalizePath(p: string): string {
    return p.replace(/\\/g, '/').replace(/\/+/g, '/');
  }

  private ensureParentDirs(filePath: string): void {
    const parts = this.normalizePath(filePath).split('/');
    parts.pop();
    let current = '';
    for (const part of parts) {
      current += '/' + part;
      this.directories.add(current.replace(/^\/\//, '/'));
    }
  }

  private checkError(path: string): void {
    const error = this.errorOnPath.get(path);
    if (error) throw error;
  }

  private globToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`);
  }
}
```

### Step 4.2: Add Unit Tests

**File**: `tests/vitest/platform/mock-pal.spec.ts`
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MockPAL } from '../../../src/platform/mock-pal.js';

describe('MockPAL', () => {
  let pal: MockPAL;

  beforeEach(() => {
    pal = new MockPAL();
  });

  it('should read and write files', async () => {
    await pal.writeFile('/test/file.txt', 'content');
    const result = await pal.readFile('/test/file.txt');
    expect(result).toBe('content');
  });

  it('should throw on missing file', async () => {
    await expect(pal.readFile('/missing.txt')).rejects.toThrow('ENOENT');
  });

  it('should support setFiles helper', async () => {
    pal.setFiles({
      '/a.txt': 'A',
      '/b.txt': 'B',
    });
    expect(await pal.readFile('/a.txt')).toBe('A');
    expect(await pal.readFile('/b.txt')).toBe('B');
  });

  it('should inject errors on specific paths', async () => {
    pal.setFile('/protected.txt', 'secret');
    pal.setErrorOnPath('/protected.txt', new Error('EACCES: permission denied'));
    await expect(pal.readFile('/protected.txt')).rejects.toThrow('EACCES');
  });
});
```

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
- `src/platform/mock-pal.ts`
- [issue template](../../issues/templates/issue-022-pal-interface.md)

---

*Task: T-055 | Phase: 4 | Priority: P1*
