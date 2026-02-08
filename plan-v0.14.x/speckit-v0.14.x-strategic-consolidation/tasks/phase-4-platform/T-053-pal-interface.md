# T-053: Design and Implement Platform Abstraction Layer (PAL)

**Task ID**: T-053
**Phase**: 4 - Platform Abstraction
**Priority**: P1
**Estimate**: 3 hours (interface) + 6 hours (NodePAL) + 4 hours (MockPAL) = 13 hours total
**Owner**: @mcp-tool-builder
**Reviewer**: @architecture-advisor
**Dependencies**: Phase 3 complete
**Blocks**: T-057 (fs/path migration)

---

## 1. Overview

### What

Create a Platform Abstraction Layer (PAL) that abstracts all file system and path operations, enabling:
- Cross-platform support (Windows, Linux, macOS)
- Easy mocking for tests
- Consistent path handling

### Why

Current codebase has:
- 46 shell scripts (Bash only)
- Direct `fs` and `path` calls scattered throughout
- Unix path assumptions (`/` separator)
- No Windows support
- Hard to mock file operations in tests

### Target Files

| File                            | Purpose                |
| ------------------------------- | ---------------------- |
| `src/platform/pal.interface.ts` | Interface definition   |
| `src/platform/node-pal.ts`      | Node.js implementation |
| `src/platform/mock-pal.ts`      | Testing implementation |
| `src/platform/index.ts`         | Barrel + singleton     |

---

## 2. Prerequisites

### Files to Audit

Run this command to find all fs/path usage:

```bash
# Find all direct fs imports
grep -rn "from 'fs" src/ --include="*.ts" | grep -v platform/
grep -rn "from 'node:fs" src/ --include="*.ts" | grep -v platform/

# Find all path imports
grep -rn "from 'path" src/ --include="*.ts" | grep -v platform/
grep -rn "from 'node:path" src/ --include="*.ts" | grep -v platform/

# Count total
echo "Total files to migrate:"
grep -rln "from 'fs\|from 'node:fs\|from 'path\|from 'node:path" src/ --include="*.ts" | wc -l
```

### Expected Output

```
src/tools/speckit-generator.ts:10:import { promises as fs } from "node:fs";
src/strategies/speckit/spec-validator.ts:8:import * as fs from "node:fs";
... (more files)

Total files to migrate: ~15-20
```

---

## 3. Implementation Guide

### Step 3.1: Define PAL Interface

```typescript
// src/platform/pal.interface.ts

/**
 * Platform Abstraction Layer Interface.
 *
 * Abstracts all file system and path operations to enable:
 * - Cross-platform support (Windows, Linux, macOS)
 * - Easy mocking for tests
 * - Consistent path handling
 *
 * All implementations MUST be thread-safe and handle edge cases
 * like missing files, permission errors, and concurrent access.
 *
 * @example
 * ```typescript
 * import { pal } from './platform/index.js';
 *
 * // Read a file
 * const content = await pal.readFile('/path/to/file.txt');
 *
 * // Join paths (cross-platform)
 * const fullPath = pal.joinPath(pal.getHomeDir(), '.config', 'app.json');
 * ```
 */
export interface PlatformAbstractionLayer {
  // ============================================
  // File Operations (Async)
  // ============================================

  /**
   * Read file contents as UTF-8 string.
   *
   * @param path - Absolute or relative file path
   * @returns File contents
   * @throws PalError with code 'ENOENT' if file not found
   * @throws PalError with code 'EACCES' if permission denied
   */
  readFile(path: string): Promise<string>;

  /**
   * Read file contents synchronously.
   *
   * ⚠️ Use sparingly - prefer async version for better performance.
   */
  readFileSync(path: string): string;

  /**
   * Write content to file, creating parent directories if needed.
   *
   * @param path - File path to write to
   * @param content - String content to write
   * @throws PalError with code 'EACCES' if permission denied
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * Write content to file synchronously.
   */
  writeFileSync(path: string, content: string): void;

  /**
   * Check if file or directory exists.
   */
  exists(path: string): Promise<boolean>;

  /**
   * Check if file or directory exists (sync).
   */
  existsSync(path: string): boolean;

  /**
   * Delete a file.
   *
   * @param path - File to delete
   * @param options - Optional settings
   * @throws PalError if file doesn't exist and force is false
   */
  deleteFile(path: string, options?: { force?: boolean }): Promise<void>;

  /**
   * Copy a file.
   *
   * @param src - Source file path
   * @param dest - Destination file path
   * @param options - Optional settings
   */
  copyFile(src: string, dest: string, options?: { overwrite?: boolean }): Promise<void>;

  /**
   * Get file stats (size, modified time, etc.).
   */
  stat(path: string): Promise<FileStats>;

  // ============================================
  // Directory Operations
  // ============================================

  /**
   * List files in a directory.
   *
   * @param dir - Directory to list
   * @param options - Optional filtering and recursion settings
   * @returns Array of file paths (absolute)
   */
  listFiles(
    dir: string,
    options?: ListFilesOptions
  ): Promise<string[]>;

  /**
   * Create a directory, including parent directories.
   *
   * @param path - Directory path to create
   */
  createDir(path: string): Promise<void>;

  /**
   * Remove a directory.
   *
   * @param path - Directory to remove
   * @param options - Optional settings (recursive, force)
   */
  removeDir(
    path: string,
    options?: { recursive?: boolean; force?: boolean }
  ): Promise<void>;

  // ============================================
  // Path Operations
  // ============================================

  /**
   * Resolve path segments to absolute path.
   *
   * @param segments - Path segments to resolve
   * @returns Absolute path
   *
   * @example
   * ```typescript
   * pal.resolvePath('/home/user', 'docs', 'file.txt');
   * // Returns: '/home/user/docs/file.txt'
   * ```
   */
  resolvePath(...segments: string[]): string;

  /**
   * Join path segments with platform-specific separator.
   *
   * @param segments - Path segments to join
   * @returns Joined path
   */
  joinPath(...segments: string[]): string;

  /**
   * Get directory name of a path.
   *
   * @example
   * ```typescript
   * pal.dirname('/home/user/file.txt'); // '/home/user'
   * ```
   */
  dirname(path: string): string;

  /**
   * Get base name of a path.
   *
   * @param path - File path
   * @param ext - Extension to remove (optional)
   *
   * @example
   * ```typescript
   * pal.basename('/home/user/file.txt'); // 'file.txt'
   * pal.basename('/home/user/file.txt', '.txt'); // 'file'
   * ```
   */
  basename(path: string, ext?: string): string;

  /**
   * Get file extension.
   *
   * @example
   * ```typescript
   * pal.extname('/home/user/file.txt'); // '.txt'
   * ```
   */
  extname(path: string): string;

  /**
   * Check if path is absolute.
   */
  isAbsolute(path: string): boolean;

  /**
   * Normalize a path (resolve '..' and '.' segments).
   */
  normalize(path: string): string;

  /**
   * Get relative path from one location to another.
   */
  relativePath(from: string, to: string): string;

  /**
   * Get platform-specific path separator.
   */
  readonly separator: string;

  // ============================================
  // Environment
  // ============================================

  /**
   * Get environment variable.
   *
   * @param key - Variable name
   * @returns Value or undefined if not set
   */
  getEnv(key: string): string | undefined;

  /**
   * Set environment variable.
   */
  setEnv(key: string, value: string): void;

  /**
   * Get current platform.
   */
  getPlatform(): Platform;

  /**
   * Get user's home directory.
   */
  getHomeDir(): string;

  /**
   * Get system temp directory.
   */
  getTempDir(): string;

  /**
   * Get current working directory.
   */
  getCwd(): string;
}

/**
 * Supported platforms.
 */
export type Platform = 'darwin' | 'linux' | 'win32';

/**
 * File stats returned by stat().
 */
export interface FileStats {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
}

/**
 * Options for listFiles().
 */
export interface ListFilesOptions {
  /** Recursively list subdirectories */
  recursive?: boolean;
  /** Glob pattern to match (e.g., '*.ts') */
  pattern?: string;
  /** Include hidden files (starting with .) */
  includeHidden?: boolean;
  /** Only return files (not directories) */
  filesOnly?: boolean;
  /** Maximum depth for recursive listing */
  maxDepth?: number;
}

/**
 * PAL-specific error with platform-agnostic error codes.
 */
export class PalError extends Error {
  constructor(
    message: string,
    public readonly code: PalErrorCode,
    public readonly path?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PalError';
  }
}

/**
 * Platform-agnostic error codes.
 */
export type PalErrorCode =
  | 'ENOENT'      // File or directory not found
  | 'EACCES'      // Permission denied
  | 'EEXIST'      // File already exists
  | 'ENOTDIR'     // Not a directory
  | 'EISDIR'      // Is a directory
  | 'ENOTEMPTY'   // Directory not empty
  | 'ETIMEDOUT'   // Operation timed out
  | 'UNKNOWN';    // Unknown error
```

### Step 3.2: Implement NodePAL

```typescript
// src/platform/node-pal.ts

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { glob } from 'glob';
import type {
  FileStats,
  ListFilesOptions,
  PalErrorCode,
  Platform,
  PlatformAbstractionLayer,
} from './pal.interface.js';
import { PalError } from './pal.interface.js';

/**
 * Node.js implementation of Platform Abstraction Layer.
 *
 * Production implementation using Node.js built-in modules.
 *
 * @example
 * ```typescript
 * const pal = new NodePAL();
 * const content = await pal.readFile('./config.json');
 * ```
 */
export class NodePAL implements PlatformAbstractionLayer {
  readonly separator = path.sep;

  // ============================================
  // File Operations
  // ============================================

  async readFile(filePath: string): Promise<string> {
    try {
      return await fsp.readFile(filePath, 'utf-8');
    } catch (error) {
      throw this.wrapError(error, filePath);
    }
  }

  readFileSync(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw this.wrapError(error, filePath);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure parent directory exists
      const dir = path.dirname(filePath);
      await fsp.mkdir(dir, { recursive: true });
      await fsp.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw this.wrapError(error, filePath);
    }
  }

  writeFileSync(filePath: string, content: string): void {
    try {
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (error) {
      throw this.wrapError(error, filePath);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fsp.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  existsSync(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  async deleteFile(filePath: string, options?: { force?: boolean }): Promise<void> {
    try {
      await fsp.unlink(filePath);
    } catch (error) {
      if (options?.force && this.isNotFoundError(error)) {
        return;
      }
      throw this.wrapError(error, filePath);
    }
  }

  async copyFile(
    src: string,
    dest: string,
    options?: { overwrite?: boolean }
  ): Promise<void> {
    try {
      const flags = options?.overwrite ? 0 : fs.constants.COPYFILE_EXCL;
      await fsp.copyFile(src, dest, flags);
    } catch (error) {
      throw this.wrapError(error, `${src} -> ${dest}`);
    }
  }

  async stat(filePath: string): Promise<FileStats> {
    try {
      const stats = await fsp.stat(filePath);
      return {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        accessedAt: stats.atime,
      };
    } catch (error) {
      throw this.wrapError(error, filePath);
    }
  }

  // ============================================
  // Directory Operations
  // ============================================

  async listFiles(
    dir: string,
    options?: ListFilesOptions
  ): Promise<string[]> {
    try {
      if (options?.pattern) {
        // Use glob for pattern matching
        const pattern = options.recursive
          ? `**/${options.pattern}`
          : options.pattern;

        return await glob(pattern, {
          cwd: dir,
          absolute: true,
          dot: options.includeHidden ?? false,
          nodir: options.filesOnly ?? false,
          maxDepth: options.maxDepth,
        });
      }

      // Simple directory listing
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      const results: string[] = [];

      for (const entry of entries) {
        // Skip hidden files unless requested
        if (!options?.includeHidden && entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (options?.recursive) {
            // Recurse into subdirectory
            const subFiles = await this.listFiles(fullPath, options);
            results.push(...subFiles);
          }
          if (!options?.filesOnly) {
            results.push(fullPath);
          }
        } else if (entry.isFile()) {
          results.push(fullPath);
        }
      }

      return results;
    } catch (error) {
      throw this.wrapError(error, dir);
    }
  }

  async createDir(dirPath: string): Promise<void> {
    try {
      await fsp.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw this.wrapError(error, dirPath);
    }
  }

  async removeDir(
    dirPath: string,
    options?: { recursive?: boolean; force?: boolean }
  ): Promise<void> {
    try {
      await fsp.rm(dirPath, {
        recursive: options?.recursive ?? false,
        force: options?.force ?? false,
      });
    } catch (error) {
      throw this.wrapError(error, dirPath);
    }
  }

  // ============================================
  // Path Operations
  // ============================================

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

  isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  normalize(filePath: string): string {
    return path.normalize(filePath);
  }

  relativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  // ============================================
  // Environment
  // ============================================

  getEnv(key: string): string | undefined {
    return process.env[key];
  }

  setEnv(key: string, value: string): void {
    process.env[key] = value;
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

  // ============================================
  // Private Helpers
  // ============================================

  private wrapError(error: unknown, path?: string): PalError {
    if (error instanceof PalError) {
      return error;
    }

    const nodeError = error as NodeJS.ErrnoException;
    const code = this.mapErrorCode(nodeError.code);
    const message = nodeError.message || 'Unknown file system error';

    return new PalError(message, code, path, nodeError);
  }

  private mapErrorCode(code?: string): PalErrorCode {
    switch (code) {
      case 'ENOENT':
        return 'ENOENT';
      case 'EACCES':
      case 'EPERM':
        return 'EACCES';
      case 'EEXIST':
        return 'EEXIST';
      case 'ENOTDIR':
        return 'ENOTDIR';
      case 'EISDIR':
        return 'EISDIR';
      case 'ENOTEMPTY':
        return 'ENOTEMPTY';
      case 'ETIMEDOUT':
        return 'ETIMEDOUT';
      default:
        return 'UNKNOWN';
    }
  }

  private isNotFoundError(error: unknown): boolean {
    return (error as NodeJS.ErrnoException).code === 'ENOENT';
  }
}
```

### Step 3.3: Implement MockPAL

```typescript
// src/platform/mock-pal.ts

import type {
  FileStats,
  ListFilesOptions,
  Platform,
  PlatformAbstractionLayer,
} from './pal.interface.js';
import { PalError } from './pal.interface.js';

/**
 * Mock entry in the virtual file system.
 */
interface MockEntry {
  type: 'file' | 'directory';
  content?: string;
  createdAt: Date;
  modifiedAt: Date;
}

/**
 * Mock implementation of Platform Abstraction Layer.
 *
 * In-memory implementation for testing. Allows full control over
 * file system state without touching the real file system.
 *
 * @example
 * ```typescript
 * const pal = new MockPAL();
 *
 * // Set up test fixtures
 * pal.setFile('/project/config.json', '{"key": "value"}');
 * pal.setDirectory('/project/src');
 *
 * // Run test
 * const content = await pal.readFile('/project/config.json');
 * expect(content).toBe('{"key": "value"}');
 *
 * // Clean up
 * pal.reset();
 * ```
 */
export class MockPAL implements PlatformAbstractionLayer {
  private fileSystem: Map<string, MockEntry> = new Map();
  private environment: Map<string, string> = new Map();
  private currentPlatform: Platform = 'linux';
  private cwd: string = '/mock';

  readonly separator = '/';

  // ============================================
  // Test Setup Methods
  // ============================================

  /**
   * Add a file to the mock file system.
   */
  setFile(path: string, content: string): void {
    const normalizedPath = this.normalizePath(path);
    this.fileSystem.set(normalizedPath, {
      type: 'file',
      content,
      createdAt: new Date(),
      modifiedAt: new Date(),
    });

    // Ensure parent directories exist
    this.ensureParentDirs(normalizedPath);
  }

  /**
   * Add a directory to the mock file system.
   */
  setDirectory(path: string): void {
    const normalizedPath = this.normalizePath(path);
    this.fileSystem.set(normalizedPath, {
      type: 'directory',
      createdAt: new Date(),
      modifiedAt: new Date(),
    });

    this.ensureParentDirs(normalizedPath);
  }

  /**
   * Set the mock platform.
   */
  setPlatform(platform: Platform): void {
    this.currentPlatform = platform;
  }

  /**
   * Set the mock current working directory.
   */
  setCwd(cwd: string): void {
    this.cwd = cwd;
  }

  /**
   * Reset all mock state.
   */
  reset(): void {
    this.fileSystem.clear();
    this.environment.clear();
    this.currentPlatform = 'linux';
    this.cwd = '/mock';
  }

  /**
   * Get all files in the mock file system (for assertions).
   */
  getFiles(): Map<string, string> {
    const files = new Map<string, string>();
    for (const [path, entry] of this.fileSystem) {
      if (entry.type === 'file' && entry.content !== undefined) {
        files.set(path, entry.content);
      }
    }
    return files;
  }

  // ============================================
  // File Operations
  // ============================================

  async readFile(path: string): Promise<string> {
    return this.readFileSync(path);
  }

  readFileSync(path: string): string {
    const normalizedPath = this.normalizePath(path);
    const entry = this.fileSystem.get(normalizedPath);

    if (!entry) {
      throw new PalError(`File not found: ${path}`, 'ENOENT', path);
    }
    if (entry.type === 'directory') {
      throw new PalError(`Is a directory: ${path}`, 'EISDIR', path);
    }

    return entry.content ?? '';
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.writeFileSync(path, content);
  }

  writeFileSync(path: string, content: string): void {
    const normalizedPath = this.normalizePath(path);
    this.ensureParentDirs(normalizedPath);

    const existing = this.fileSystem.get(normalizedPath);
    this.fileSystem.set(normalizedPath, {
      type: 'file',
      content,
      createdAt: existing?.createdAt ?? new Date(),
      modifiedAt: new Date(),
    });
  }

  async exists(path: string): Promise<boolean> {
    return this.existsSync(path);
  }

  existsSync(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.fileSystem.has(normalizedPath);
  }

  async deleteFile(path: string, options?: { force?: boolean }): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    const entry = this.fileSystem.get(normalizedPath);

    if (!entry) {
      if (options?.force) return;
      throw new PalError(`File not found: ${path}`, 'ENOENT', path);
    }

    this.fileSystem.delete(normalizedPath);
  }

  async copyFile(
    src: string,
    dest: string,
    options?: { overwrite?: boolean }
  ): Promise<void> {
    const content = await this.readFile(src);

    if (!options?.overwrite && this.existsSync(dest)) {
      throw new PalError(`File exists: ${dest}`, 'EEXIST', dest);
    }

    await this.writeFile(dest, content);
  }

  async stat(path: string): Promise<FileStats> {
    const normalizedPath = this.normalizePath(path);
    const entry = this.fileSystem.get(normalizedPath);

    if (!entry) {
      throw new PalError(`File not found: ${path}`, 'ENOENT', path);
    }

    return {
      size: entry.content?.length ?? 0,
      isFile: entry.type === 'file',
      isDirectory: entry.type === 'directory',
      createdAt: entry.createdAt,
      modifiedAt: entry.modifiedAt,
      accessedAt: new Date(),
    };
  }

  // ============================================
  // Directory Operations
  // ============================================

  async listFiles(
    dir: string,
    options?: ListFilesOptions
  ): Promise<string[]> {
    const normalizedDir = this.normalizePath(dir);
    const results: string[] = [];

    for (const [path, entry] of this.fileSystem) {
      if (!path.startsWith(normalizedDir)) continue;
      if (path === normalizedDir) continue;

      const relativePath = path.substring(normalizedDir.length + 1);
      const depth = relativePath.split('/').length;

      // Check depth for non-recursive
      if (!options?.recursive && depth > 1) continue;

      // Check max depth
      if (options?.maxDepth && depth > options.maxDepth) continue;

      // Filter hidden files
      const basename = relativePath.split('/').pop()!;
      if (!options?.includeHidden && basename.startsWith('.')) continue;

      // Filter directories if filesOnly
      if (options?.filesOnly && entry.type === 'directory') continue;

      // Pattern matching (simple glob)
      if (options?.pattern) {
        const pattern = options.pattern.replace(/\*/g, '.*');
        if (!new RegExp(`^${pattern}$`).test(basename)) continue;
      }

      results.push(path);
    }

    return results;
  }

  async createDir(path: string): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    this.setDirectory(normalizedPath);
  }

  async removeDir(
    path: string,
    options?: { recursive?: boolean; force?: boolean }
  ): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    const entry = this.fileSystem.get(normalizedPath);

    if (!entry) {
      if (options?.force) return;
      throw new PalError(`Directory not found: ${path}`, 'ENOENT', path);
    }

    if (options?.recursive) {
      // Remove all entries under this path
      for (const key of this.fileSystem.keys()) {
        if (key.startsWith(normalizedPath)) {
          this.fileSystem.delete(key);
        }
      }
    } else {
      // Check if directory is empty
      for (const key of this.fileSystem.keys()) {
        if (key !== normalizedPath && key.startsWith(normalizedPath)) {
          throw new PalError(`Directory not empty: ${path}`, 'ENOTEMPTY', path);
        }
      }
      this.fileSystem.delete(normalizedPath);
    }
  }

  // ============================================
  // Path Operations
  // ============================================

  resolvePath(...segments: string[]): string {
    if (segments.length === 0) return this.cwd;

    let result = segments[0];
    if (!this.isAbsolute(result)) {
      result = this.joinPath(this.cwd, result);
    }

    for (let i = 1; i < segments.length; i++) {
      result = this.joinPath(result, segments[i]);
    }

    return this.normalize(result);
  }

  joinPath(...segments: string[]): string {
    return segments.join('/').replace(/\/+/g, '/');
  }

  dirname(path: string): string {
    const lastSlash = path.lastIndexOf('/');
    return lastSlash === -1 ? '.' : path.substring(0, lastSlash) || '/';
  }

  basename(path: string, ext?: string): string {
    const base = path.split('/').pop() || '';
    if (ext && base.endsWith(ext)) {
      return base.substring(0, base.length - ext.length);
    }
    return base;
  }

  extname(path: string): string {
    const base = this.basename(path);
    const lastDot = base.lastIndexOf('.');
    return lastDot === -1 ? '' : base.substring(lastDot);
  }

  isAbsolute(path: string): boolean {
    return path.startsWith('/');
  }

  normalize(path: string): string {
    const parts = path.split('/');
    const result: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        result.pop();
      } else if (part !== '.' && part !== '') {
        result.push(part);
      }
    }

    return '/' + result.join('/');
  }

  relativePath(from: string, to: string): string {
    const fromParts = this.normalize(from).split('/').filter(Boolean);
    const toParts = this.normalize(to).split('/').filter(Boolean);

    let common = 0;
    while (
      common < fromParts.length &&
      common < toParts.length &&
      fromParts[common] === toParts[common]
    ) {
      common++;
    }

    const ups = fromParts.length - common;
    const remainder = toParts.slice(common);

    return [...Array(ups).fill('..'), ...remainder].join('/') || '.';
  }

  // ============================================
  // Environment
  // ============================================

  getEnv(key: string): string | undefined {
    return this.environment.get(key);
  }

  setEnv(key: string, value: string): void {
    this.environment.set(key, value);
  }

  getPlatform(): Platform {
    return this.currentPlatform;
  }

  getHomeDir(): string {
    return '/mock/home';
  }

  getTempDir(): string {
    return '/mock/tmp';
  }

  getCwd(): string {
    return this.cwd;
  }

  // ============================================
  // Private Helpers
  // ============================================

  private normalizePath(path: string): string {
    if (!this.isAbsolute(path)) {
      path = this.joinPath(this.cwd, path);
    }
    return this.normalize(path);
  }

  private ensureParentDirs(path: string): void {
    const parts = path.split('/').filter(Boolean);
    let current = '';

    for (let i = 0; i < parts.length - 1; i++) {
      current += '/' + parts[i];
      if (!this.fileSystem.has(current)) {
        this.fileSystem.set(current, {
          type: 'directory',
          createdAt: new Date(),
          modifiedAt: new Date(),
        });
      }
    }
  }
}
```

### Step 3.4: Create Barrel with Singleton

```typescript
// src/platform/index.ts

import { NodePAL } from './node-pal.js';
import type { PlatformAbstractionLayer } from './pal.interface.js';

export type { PlatformAbstractionLayer, Platform, FileStats, ListFilesOptions } from './pal.interface.js';
export { PalError } from './pal.interface.js';
export { NodePAL } from './node-pal.js';
export { MockPAL } from './mock-pal.js';

/**
 * Default PAL singleton for application use.
 *
 * Use this for all file system operations instead of direct fs/path imports.
 *
 * @example
 * ```typescript
 * import { pal } from './platform/index.js';
 *
 * const content = await pal.readFile('./config.json');
 * const fullPath = pal.joinPath(pal.getHomeDir(), '.config', 'app.json');
 * ```
 */
export const pal: PlatformAbstractionLayer = new NodePAL();

/**
 * Create a new PAL instance (useful for tests or custom implementations).
 */
export function createPAL(impl: 'node' | 'mock' = 'node'): PlatformAbstractionLayer {
  if (impl === 'mock') {
    const { MockPAL } = require('./mock-pal.js');
    return new MockPAL();
  }
  return new NodePAL();
}
```

---

## 4. Migration Guide

### Before (Direct fs/path)

```typescript
// ❌ Old pattern
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

const configPath = path.join(process.cwd(), 'config.json');
const content = await fs.readFile(configPath, 'utf-8');
```

### After (Using PAL)

```typescript
// ✅ New pattern
import { pal } from '../platform/index.js';

const configPath = pal.joinPath(pal.getCwd(), 'config.json');
const content = await pal.readFile(configPath);
```

### Test Setup

```typescript
// ✅ Easy mocking
import { MockPAL } from '../platform/mock-pal.js';

describe('MyModule', () => {
  let mockPal: MockPAL;

  beforeEach(() => {
    mockPal = new MockPAL();
    mockPal.setFile('/project/config.json', '{"key": "value"}');
  });

  it('should read config', async () => {
    const result = await myFunction(mockPal);
    expect(result.key).toBe('value');
  });
});
```

---

## 5. Acceptance Criteria

| Criterion                              | Status | Verification        |
| -------------------------------------- | ------ | ------------------- |
| PAL interface with all methods defined | ⬜      | Interface compiles  |
| NodePAL implements all methods         | ⬜      | All tests pass      |
| MockPAL implements all methods         | ⬜      | All tests pass      |
| Error wrapping with PalError           | ⬜      | Error codes correct |
| Singleton export `pal`                 | ⬜      | Can import and use  |
| Cross-platform path handling           | ⬜      | Windows paths work  |
| 90% test coverage                      | ⬜      | Coverage report     |

---

## 6. References

| Document                            | Link                                                     |
| ----------------------------------- | -------------------------------------------------------- |
| ADR-004: Platform Abstraction Layer | [adr.md](../../adr.md#adr-004)                           |
| Spec REQ-014, REQ-015, REQ-016      | [spec.md](../../spec.md)                                 |
| Node.js fs module                   | [nodejs.org/api/fs.html](https://nodejs.org/api/fs.html) |

---

*Task: T-053 | Phase: 4 | Priority: P1*
