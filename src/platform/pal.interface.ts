/**
 * Platform Abstraction Layer Interface.
 *
 * Abstracts all file system and path operations to enable:
 * - Cross-platform support (Windows, Linux, macOS)
 * - Easy mocking for tests
 * - Consistent path handling
 *
 * @module
 */

/**
 * File metadata returned by stat().
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
	/** Include subdirectories recursively */
	recursive?: boolean;
	/** Only include files matching this pattern (glob) */
	pattern?: string;
	/** Exclude files matching this pattern */
	exclude?: string;
}

/**
 * Supported platform identifiers.
 */
export type Platform = "linux" | "darwin" | "win32";

/**
 * Platform Abstraction Layer Interface.
 *
 * @example
 * ```typescript
 * import { pal } from './platform/index.js';
 *
 * const content = await pal.readFile('/path/to/file.txt');
 * const fullPath = pal.joinPath(pal.getHomeDir(), '.config', 'app.json');
 * ```
 */
export interface PlatformAbstractionLayer {
	// ============================================
	// File Operations (Async)
	// ============================================

	/** Read file contents as UTF-8 string. */
	readFile(path: string): Promise<string>;

	/** Read file contents synchronously. */
	readFileSync(path: string): string;

	/** Write content to file, creating parent directories if needed. */
	writeFile(path: string, content: string): Promise<void>;

	/** Write content synchronously. */
	writeFileSync(path: string, content: string): void;

	/** Check if file or directory exists. */
	exists(path: string): Promise<boolean>;

	/** Check if file or directory exists (sync). */
	existsSync(path: string): boolean;

	/** Delete a file. */
	deleteFile(path: string, options?: { force?: boolean }): Promise<void>;

	/** Copy a file. */
	copyFile(
		src: string,
		dest: string,
		options?: { overwrite?: boolean },
	): Promise<void>;

	/** Get file stats. */
	stat(path: string): Promise<FileStats>;

	// ============================================
	// Directory Operations
	// ============================================

	/** List files in a directory. */
	listFiles(dir: string, options?: ListFilesOptions): Promise<string[]>;

	/** Create a directory, including parent directories. */
	createDir(path: string): Promise<void>;

	/** Remove a directory. */
	removeDir(
		path: string,
		options?: { recursive?: boolean; force?: boolean },
	): Promise<void>;

	// ============================================
	// Path Operations
	// ============================================

	/** Resolve path segments to absolute path. */
	resolvePath(...segments: string[]): string;

	/** Join path segments with platform-specific separator. */
	joinPath(...segments: string[]): string;

	/** Get directory name of a path. */
	dirname(path: string): string;

	/** Get base name of a path. */
	basename(path: string, ext?: string): string;

	/** Get extension of a path. */
	extname(path: string): string;

	/** Check if path is absolute. */
	isAbsolute(path: string): boolean;

	/** Get relative path between two paths. */
	relativePath(from: string, to: string): string;

	// ============================================
	// Environment
	// ============================================

	/** Get current working directory. */
	getCwd(): string;

	/** Get user home directory. */
	getHomeDir(): string;

	/** Get environment variable value. */
	getEnv(name: string): string | undefined;

	/** Get current platform. */
	getPlatform(): Platform;
}
