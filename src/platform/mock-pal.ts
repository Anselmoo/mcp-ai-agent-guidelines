/**
 * MockPAL — In-memory implementation of PlatformAbstractionLayer for testing.
 * @module
 */

import * as nodePath from "node:path";
import type {
	FileStats,
	ListFilesOptions,
	Platform,
	PlatformAbstractionLayer,
} from "./pal.interface.js";

interface MockFile {
	content: string;
	mtime: Date;
}

export interface MockPALOptions {
	platform?: Platform;
	cwd?: string;
	homeDir?: string;
	env?: Record<string, string>;
}

/**
 * In-memory PAL for use in tests.
 *
 * @example
 * ```typescript
 * const pal = new MockPAL();
 * pal.setFile('/project/README.md', '# Hello');
 * const content = await pal.readFile('/project/README.md');
 * ```
 */
export class MockPAL implements PlatformAbstractionLayer {
	private files = new Map<string, MockFile>();
	private directories = new Set<string>();
	private errorOnPath = new Map<string, Error>();

	private readonly _platform: Platform;
	private readonly _cwd: string;
	private readonly _homeDir: string;
	private readonly _env: Record<string, string>;

	constructor(options: MockPALOptions = {}) {
		this._platform = options.platform ?? "linux";
		this._cwd = options.cwd ?? "/mock/cwd";
		this._homeDir = options.homeDir ?? "/mock/home";
		this._env = options.env ?? {};
		this.directories.add("/");
		this.directories.add(this._cwd);
		this.directories.add(this._homeDir);
	}

	// ============================================
	// Test Helpers
	// ============================================

	setFile(path: string, content: string): void {
		this.files.set(this.normalize(path), { content, mtime: new Date() });
		this.ensureParentDirs(path);
	}

	setFiles(fileMap: Record<string, string>): void {
		for (const [p, content] of Object.entries(fileMap)) {
			this.setFile(p, content);
		}
	}

	setErrorOnPath(path: string, error: Error): void {
		this.errorOnPath.set(this.normalize(path), error);
	}

	reset(): void {
		this.files.clear();
		this.directories.clear();
		this.errorOnPath.clear();
		this.directories.add("/");
		this.directories.add(this._cwd);
		this.directories.add(this._homeDir);
	}

	getAllFiles(): Map<string, string> {
		const out = new Map<string, string>();
		for (const [p, f] of this.files) {
			out.set(p, f.content);
		}
		return out;
	}

	// ============================================
	// File Operations (Async)
	// ============================================

	async readFile(path: string): Promise<string> {
		this.checkError(path);
		const f = this.files.get(this.normalize(path));
		if (!f) throw new Error(`ENOENT: no such file or directory: ${path}`);
		return f.content;
	}

	readFileSync(path: string): string {
		this.checkError(path);
		const f = this.files.get(this.normalize(path));
		if (!f) throw new Error(`ENOENT: no such file or directory: ${path}`);
		return f.content;
	}

	async writeFile(path: string, content: string): Promise<void> {
		this.checkError(path);
		this.ensureParentDirs(path);
		this.files.set(this.normalize(path), { content, mtime: new Date() });
	}

	writeFileSync(path: string, content: string): void {
		this.checkError(path);
		this.ensureParentDirs(path);
		this.files.set(this.normalize(path), { content, mtime: new Date() });
	}

	async exists(path: string): Promise<boolean> {
		const n = this.normalize(path);
		return this.files.has(n) || this.directories.has(n);
	}

	existsSync(path: string): boolean {
		const n = this.normalize(path);
		return this.files.has(n) || this.directories.has(n);
	}

	async deleteFile(path: string, options?: { force?: boolean }): Promise<void> {
		const n = this.normalize(path);
		if (!this.files.has(n) && !options?.force) {
			throw new Error(`ENOENT: no such file or directory: ${path}`);
		}
		this.files.delete(n);
	}

	async copyFile(
		src: string,
		dest: string,
		options?: { overwrite?: boolean },
	): Promise<void> {
		const srcNorm = this.normalize(src);
		const f = this.files.get(srcNorm);
		if (!f) throw new Error(`ENOENT: no such file: ${src}`);

		const destNorm = this.normalize(dest);
		if (this.files.has(destNorm) && options?.overwrite === false) {
			throw new Error(`EEXIST: file already exists: ${dest}`);
		}

		this.ensureParentDirs(dest);
		this.files.set(destNorm, { ...f });
	}

	async stat(path: string): Promise<FileStats> {
		this.checkError(path);
		const n = this.normalize(path);
		const f = this.files.get(n);
		if (f) {
			return {
				size: f.content.length,
				isFile: true,
				isDirectory: false,
				createdAt: f.mtime,
				modifiedAt: f.mtime,
				accessedAt: new Date(),
			};
		}
		if (this.directories.has(n)) {
			return {
				size: 0,
				isFile: false,
				isDirectory: true,
				createdAt: new Date(0),
				modifiedAt: new Date(0),
				accessedAt: new Date(),
			};
		}
		throw new Error(`ENOENT: no such file or directory: ${path}`);
	}

	// ============================================
	// Directory Operations
	// ============================================

	async listFiles(dir: string, options?: ListFilesOptions): Promise<string[]> {
		const prefix = this.normalize(dir);
		const recursive = options?.recursive ?? false;

		let files = Array.from(this.files.keys()).filter((p) => {
			if (!p.startsWith(prefix + "/")) return false;
			const rest = p.slice(prefix.length + 1);
			if (!recursive && rest.includes("/")) return false;
			return true;
		});

		if (options?.pattern) {
			const pat = options.pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
			const re = new RegExp(pat);
			files = files.filter((f) => re.test(nodePath.basename(f)));
		}

		return files;
	}

	async createDir(path: string): Promise<void> {
		this.directories.add(this.normalize(path));
		this.ensureParentDirs(path + "/__placeholder__");
	}

	async removeDir(
		path: string,
		options?: { recursive?: boolean; force?: boolean },
	): Promise<void> {
		const n = this.normalize(path);
		if (!this.directories.has(n) && !options?.force) {
			throw new Error(`ENOENT: no such directory: ${path}`);
		}

		if (options?.recursive) {
			for (const p of Array.from(this.files.keys())) {
				if (p.startsWith(n + "/")) this.files.delete(p);
			}
			for (const d of Array.from(this.directories)) {
				if (d.startsWith(n + "/")) this.directories.delete(d);
			}
		}
		this.directories.delete(n);
	}

	// ============================================
	// Path Operations (delegate to node:path)
	// ============================================

	resolvePath(...segments: string[]): string {
		return nodePath.resolve(...segments);
	}

	joinPath(...segments: string[]): string {
		return nodePath.join(...segments);
	}

	dirname(path: string): string {
		return nodePath.dirname(path);
	}

	basename(path: string, ext?: string): string {
		return nodePath.basename(path, ext);
	}

	extname(path: string): string {
		return nodePath.extname(path);
	}

	isAbsolute(path: string): boolean {
		return nodePath.isAbsolute(path);
	}

	relativePath(from: string, to: string): string {
		return nodePath.relative(from, to);
	}

	// ============================================
	// Environment
	// ============================================

	getCwd(): string {
		return this._cwd;
	}

	getHomeDir(): string {
		return this._homeDir;
	}

	getEnv(name: string): string | undefined {
		return this._env[name];
	}

	getPlatform(): Platform {
		return this._platform;
	}

	// ============================================
	// Private helpers
	// ============================================

	private normalize(path: string): string {
		return nodePath.normalize(path);
	}

	private checkError(path: string): void {
		const err = this.errorOnPath.get(this.normalize(path));
		if (err) throw err;
	}

	private ensureParentDirs(filePath: string): void {
		const parts = nodePath.dirname(filePath).split(nodePath.sep);
		let current = "";
		for (const part of parts) {
			current = current ? nodePath.join(current, part) : part || "/";
			this.directories.add(current);
		}
	}
}
