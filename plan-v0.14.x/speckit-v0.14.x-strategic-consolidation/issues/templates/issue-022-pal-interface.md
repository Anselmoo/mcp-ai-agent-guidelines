---
title: "Implement Platform Abstraction Layer (PAL)"
labels: ["feature", "v0.14.x", "P0", "phase-4"]
assignees: ["@mcp-tool-builder"]
milestone: "v0.14.0"
---

## Summary

Implement the Platform Abstraction Layer (PAL) to enable cross-platform support and improve testability by abstracting all file system and path operations.

## Context

Current codebase has:
- 46 shell scripts (Bash only)
- Direct `fs` and `path` calls throughout
- Unix path assumptions (`/` separator)
- No Windows support
- Hard to mock file operations in tests

PAL will abstract these operations, enabling:
- Cross-platform support (Windows, Linux, macOS)
- Easy mocking for tests
- Consistent path handling

## Acceptance Criteria

- [ ] `PlatformAbstractionLayer` interface defined in `src/platform/pal-interface.ts`
- [ ] `NodePAL` implementation in `src/platform/node-pal.ts`
- [ ] `MockPAL` implementation in `src/platform/mock-pal.ts`
- [ ] All `fs` and `path` imports replaced with PAL calls
- [ ] Zero direct `fs` imports in `src/` (excluding platform/)
- [ ] Cross-platform path handling (Windows, Unix)
- [ ] 90% test coverage on PAL
- [ ] All existing tests pass with PAL

## Technical Details

### Interface Design

```typescript
// pal-interface.ts
export interface PlatformAbstractionLayer {
  // File operations
  readFile(path: string): Promise<string>;
  readFileSync(path: string): string;
  writeFile(path: string, content: string): Promise<void>;
  writeFileSync(path: string, content: string): void;
  exists(path: string): Promise<boolean>;
  existsSync(path: string): boolean;

  // Directory operations
  listFiles(dir: string, pattern?: string): Promise<string[]>;
  createDir(path: string, recursive?: boolean): Promise<void>;
  removeDir(path: string, recursive?: boolean): Promise<void>;

  // Path operations
  resolvePath(...segments: string[]): string;
  joinPath(...segments: string[]): string;
  dirname(path: string): string;
  basename(path: string, ext?: string): string;
  extname(path: string): string;
  isAbsolute(path: string): boolean;
  normalize(path: string): string;

  // Environment
  getEnv(key: string): string | undefined;
  setEnv(key: string, value: string): void;
  getPlatform(): 'darwin' | 'linux' | 'win32';
  getHomeDir(): string;
  getTempDir(): string;
}
```

### NodePAL Implementation

```typescript
// node-pal.ts
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';

export class NodePAL implements PlatformAbstractionLayer {
  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  resolvePath(...segments: string[]): string {
    return path.resolve(...segments);
  }

  getPlatform(): 'darwin' | 'linux' | 'win32' {
    return process.platform as 'darwin' | 'linux' | 'win32';
  }
  // ... etc
}
```

### MockPAL Implementation

```typescript
// mock-pal.ts
export class MockPAL implements PlatformAbstractionLayer {
  private fileSystem: Map<string, string> = new Map();
  private platform: 'darwin' | 'linux' | 'win32' = 'linux';

  // Setup methods for tests
  setFileContent(path: string, content: string): void;
  setPlatform(platform: 'darwin' | 'linux' | 'win32'): void;
  reset(): void;

  async readFile(filePath: string): Promise<string> {
    const content = this.fileSystem.get(this.normalize(filePath));
    if (!content) throw new Error(`ENOENT: ${filePath}`);
    return content;
  }
  // ... etc
}
```

### File Structure

```
src/platform/
  pal-interface.ts       # Interface definition
  node-pal.ts           # Production implementation
  mock-pal.ts           # Testing implementation
  index.ts              # Barrel export + singleton
```

### Migration Pattern

```typescript
// Before
import * as fs from 'fs/promises';
import * as path from 'path';

const content = await fs.readFile(path.join(dir, 'file.txt'), 'utf-8');

// After
import { pal } from '../platform/index.js';

const content = await pal.readFile(pal.joinPath(dir, 'file.txt'));
```

## Dependencies

- **Depends on**: #21 (Phase 3 complete - frameworks stabilized)
- **Blocks**: #25 (fs/path migration)

## Effort Estimate

10 hours (interface + implementations)

## Testing Requirements

- All PAL methods on NodePAL
- MockPAL setup and assertions
- Cross-platform path handling
- Error cases (ENOENT, EACCES, etc.)
- Concurrent file access

## References

- [ADR-004](../adr.md#adr-004-platform-abstraction-layer-pal)
- [spec.md](../spec.md) - REQ-014, REQ-015, REQ-016
- [tasks.md](../tasks.md) - T-053, T-054, T-055

---

*Related Tasks: T-053, T-054, T-055*
*Phase: 4 - Platform*
