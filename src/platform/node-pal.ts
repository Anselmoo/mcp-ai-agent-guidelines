/**
 * NodePAL — Node.js implementation of PlatformAbstractionLayer.
 * Uses node:fs/promises and node:path.
 * @module
 */

import * as fsSync from "node:fs";
import * as fsPromises from "node:fs/promises";
import * as nodeOs from "node:os";
import * as nodePath from "node:path";
import type {
	FileStats,
	ListFilesOptions,
	Platform,
	PlatformAbstractionLayer,
} from "./pal.interface.js";

/**
 * Production Node.js PAL implementation.
 *
 * @example
 * ```typescript
 * const pal = new NodePAL();
 * const content = await pal.readFile('/some/file.txt');
 * ```
 */
export class NodePAL implements PlatformAbstractionLayer {
	// ============================================
	// File Operations (Async)
	// ============================================

	async readFile(path: string): Promise<string> {
		return fsPromises.readFile(path, "utf-8");
	}

	readFileSync(path: string): string {
		return fsSync.readFileSync(path, "utf-8");
	}

	async writeFile(path: string, content: string): Promise<void> {
		const dir = nodePath.dirname(path);
		await fsPromises.mkdir(dir, { recursive: true });
		await fsPromises.writeFile(path, content, "utf-8");
	}

	writeFileSync(path: string, content: string): void {
		const dir = nodePath.dirname(path);
		fsSync.mkdirSync(dir, { recursive: true });
		fsSync.writeFileSync(path, content, "utf-8");
	}

	async exists(path: string): Promise<boolean> {
		try {
			await fsPromises.access(path);
			return true;
		} catch {
			return false;
		}
	}

	existsSync(path: string): boolean {
		return fsSync.existsSync(path);
	}

	async deleteFile(path: string, options?: { force?: boolean }): Promise<void> {
		try {
			await fsPromises.unlink(path);
		} catch (err) {
			if (!options?.force) {
				throw err;
			}
		}
	}

	async copyFile(
		src: string,
		dest: string,
		options?: { overwrite?: boolean },
	): Promise<void> {
		const destDir = nodePath.dirname(dest);
		await fsPromises.mkdir(destDir, { recursive: true });

		const flags =
			options?.overwrite === false ? fsSync.constants.COPYFILE_EXCL : 0;
		await fsPromises.copyFile(src, dest, flags);
	}

	async stat(path: string): Promise<FileStats> {
		const s = await fsPromises.stat(path);
		return {
			size: s.size,
			isFile: s.isFile(),
			isDirectory: s.isDirectory(),
			createdAt: s.birthtime,
			modifiedAt: s.mtime,
			accessedAt: s.atime,
		};
	}

	// ============================================
	// Directory Operations
	// ============================================

	async listFiles(dir: string, options?: ListFilesOptions): Promise<string[]> {
		const recursive = options?.recursive ?? false;

		const entries = fsSync.readdirSync(dir, { recursive }) as string[];
		let files = entries
			.map((e) => nodePath.join(dir, e))
			.filter((f) => fsSync.statSync(f).isFile());

		if (options?.pattern) {
			const pat = options.pattern;
			files = files.filter((f) =>
				nodePath.basename(f).includes(pat.replace(/\*/g, "")),
			);
		}

		if (options?.exclude) {
			const excl = options.exclude;
			files = files.filter(
				(f) => !nodePath.basename(f).includes(excl.replace(/\*/g, "")),
			);
		}

		return files;
	}

	async createDir(path: string): Promise<void> {
		await fsPromises.mkdir(path, { recursive: true });
	}

	async removeDir(
		path: string,
		options?: { recursive?: boolean; force?: boolean },
	): Promise<void> {
		await fsPromises.rm(path, {
			recursive: options?.recursive ?? false,
			force: options?.force ?? false,
		});
	}

	// ============================================
	// Path Operations
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
		return process.cwd();
	}

	getHomeDir(): string {
		return nodeOs.homedir();
	}

	getEnv(name: string): string | undefined {
		return process.env[name];
	}

	getPlatform(): Platform {
		const p = process.platform;
		if (p === "linux" || p === "darwin" || p === "win32") {
			return p;
		}
		return "linux";
	}
}

/**
 * Default NodePAL instance.
 */
export const nodePal = new NodePAL();
