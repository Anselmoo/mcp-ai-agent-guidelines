# T-059: Cross-Platform Verification

**Task ID**: T-059
**Phase**: 4
**Priority**: P1
**Estimate**: 2h
**Owner**: @tdd-workflow
**Reviewer**: @code-reviewer
**Dependencies**: T-057

---

## 1. Overview

### What

Verify path handling on Windows vs Unix.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-059
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Cross-Platform Verification fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-057

### Target Files

- `TBD`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Create Cross-Platform Test Suite

Create `tests/vitest/platform/cross-platform.spec.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPAL, setPAL, resetPAL } from '../../../src/platform/index.js';
import { createNodePAL } from '../../../src/platform/node-pal.js';
import { createMockPAL } from '../../../src/platform/mock-pal.js';

describe('Cross-Platform Verification', () => {
  describe('Path Handling', () => {
    it('normalizes Windows-style paths', () => {
      const pal = getPAL();
      const result = pal.normalize('foo\\bar\\baz');
      expect(result).toMatch(/foo.bar.baz/);
    });

    it('normalizes Unix-style paths', () => {
      const pal = getPAL();
      const result = pal.normalize('foo/bar/baz');
      expect(result).toMatch(/foo.bar.baz/);
    });

    it('handles mixed path separators', () => {
      const pal = getPAL();
      const result = pal.normalize('foo/bar\\baz');
      expect(result).toMatch(/foo.bar.baz/);
    });

    it('joins paths consistently', () => {
      const pal = getPAL();
      const result = pal.join('foo', 'bar', 'baz');
      expect(result).toMatch(/foo.bar.baz/);
    });

    it('resolves relative paths', () => {
      const pal = getPAL();
      const result = pal.resolve('foo', '..', 'bar');
      expect(result).toContain('bar');
      expect(result).not.toContain('foo');
    });

    it('handles absolute path detection', () => {
      const pal = getPAL();

      // Unix absolute
      expect(pal.isAbsolute('/foo/bar')).toBe(true);

      // Windows absolute (if on Windows)
      if (process.platform === 'win32') {
        expect(pal.isAbsolute('C:\\foo\\bar')).toBe(true);
      }

      // Relative
      expect(pal.isAbsolute('foo/bar')).toBe(false);
    });
  });

  describe('File Operations', () => {
    const testDir = 'test-output/cross-platform';
    const testFile = `${testDir}/test.txt`;

    beforeEach(async () => {
      const pal = getPAL();
      await pal.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      const pal = getPAL();
      try {
        await pal.unlink(testFile);
      } catch { /* ignore */ }
    });

    it('writes and reads files consistently', async () => {
      const pal = getPAL();
      const content = 'Hello, cross-platform world!\nLine 2';

      await pal.writeFile(testFile, content);
      const result = await pal.readFile(testFile);

      expect(result).toBe(content);
    });

    it('handles UTF-8 content', async () => {
      const pal = getPAL();
      const content = '日本語テスト 🎉 émojis';

      await pal.writeFile(testFile, content);
      const result = await pal.readFile(testFile);

      expect(result).toBe(content);
    });

    it('checks file existence', async () => {
      const pal = getPAL();

      await pal.writeFile(testFile, 'test');
      expect(await pal.exists(testFile)).toBe(true);

      await pal.unlink(testFile);
      expect(await pal.exists(testFile)).toBe(false);
    });
  });

  describe('PAL Switching', () => {
    afterEach(() => {
      resetPAL();
    });

    it('switches between Node and Mock PAL', async () => {
      // Start with Node PAL
      const nodePAL = createNodePAL();
      setPAL(nodePAL);
      expect(getPAL()).toBe(nodePAL);

      // Switch to Mock PAL
      const mockPAL = createMockPAL();
      setPAL(mockPAL);
      expect(getPAL()).toBe(mockPAL);
    });

    it('Mock PAL works in memory', async () => {
      const mockPAL = createMockPAL();
      setPAL(mockPAL);

      const pal = getPAL();
      await pal.mkdir('/virtual/dir', { recursive: true });
      await pal.writeFile('/virtual/dir/test.txt', 'content');

      const result = await pal.readFile('/virtual/dir/test.txt');
      expect(result).toBe('content');
    });
  });
});
```

### Step 4.2: Create CI Matrix for Multi-Platform Testing

Add to `.github/workflows/test.yml`:

```yaml
jobs:
  cross-platform:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [22]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}

      - run: npm ci
      - run: npm run build

      - name: Run Cross-Platform Tests
        run: npm run test:vitest -- tests/vitest/platform/

      - name: Run Full Test Suite
        run: npm run test:vitest
```

### Step 4.3: Create Platform Detection Utility

Create `src/platform/detect.ts`:

```typescript
export interface PlatformInfo {
  os: 'windows' | 'darwin' | 'linux' | 'unknown';
  pathSeparator: '/' | '\\';
  lineEnding: '\n' | '\r\n';
  isCI: boolean;
}

export function detectPlatform(): PlatformInfo {
  const platform = process.platform;

  return {
    os: platform === 'win32' ? 'windows'
      : platform === 'darwin' ? 'darwin'
      : platform === 'linux' ? 'linux'
      : 'unknown',
    pathSeparator: platform === 'win32' ? '\\' : '/',
    lineEnding: platform === 'win32' ? '\r\n' : '\n',
    isCI: Boolean(process.env.CI || process.env.GITHUB_ACTIONS),
  };
}
```

### Step 4.4: Add Verification Script

Create `scripts/verify-cross-platform.ts`:

```typescript
import { detectPlatform } from '../src/platform/detect.js';
import { getPAL } from '../src/platform/index.js';

async function verify() {
  const platform = detectPlatform();
  console.log('Platform Detection:', platform);

  const pal = getPAL();
  console.log('\nPath Operations:');
  console.log('  join("a", "b"):', pal.join('a', 'b'));
  console.log('  resolve("."):', pal.resolve('.'));
  console.log('  isAbsolute("/foo"):', pal.isAbsolute('/foo'));

  console.log('\nFile Operations:');
  const testPath = pal.join('test-output', 'verify.txt');
  await pal.mkdir('test-output', { recursive: true });
  await pal.writeFile(testPath, 'verification test');
  const content = await pal.readFile(testPath);
  console.log('  Write/Read test:', content === 'verification test' ? 'PASS' : 'FAIL');
  await pal.unlink(testPath);

  console.log('\n✅ Cross-platform verification complete');
}

verify().catch(console.error);
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

- [spec.md](../../spec.md)
- [tasks.md](../../tasks.md)

---

*Task: T-059 | Phase: 4 | Priority: P1*
