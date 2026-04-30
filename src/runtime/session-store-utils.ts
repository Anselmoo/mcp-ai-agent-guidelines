import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import {
	dirname,
	isAbsolute,
	join,
	parse,
	relative,
	resolve,
	sep,
} from "node:path";

/**
 * Seam type for reading a text file.  Allows tests (and other callers) to
 * inject a custom reader without touching the real filesystem.
 */
export type ReadTextFileFn = (path: string) => Promise<string>;

/**
 * Production-default implementation: thin wrapper around `fs/promises.readFile`.
 */
export const defaultReadTextFile: ReadTextFileFn = (path: string) =>
	readFile(path, "utf8");

/**
 * Minimal set of IO seams shared by all session-store implementations.
 */
export interface SessionStoreSeams {
	/** Override the filesystem read used when loading session data. */
	readTextFile?: ReadTextFileFn;
}

import {
	createErrorContext,
	ValidationError,
} from "../validation/error-handling.js";

export const DEFAULT_SESSION_STATE_DIR = ".mcp-ai-agent-guidelines";
export const SESSION_STATE_DIR_ENV_VAR = "MCP_AI_AGENT_GUIDELINES_STATE_DIR";
export const WORKSPACE_ROOT_ENV_VAR = "MCP_WORKSPACE_ROOT";
const INVALID_LITERAL_STATE_DIRS = new Set(["undefined", "null"]);
const SESSION_STATE_GITIGNORE_PATH = ".gitignore";
const SESSION_STATE_GITIGNORE_REQUIRED_RULES = [
	"cache/",
	"sessions/",
	"session-*.json",
	"session-*.json.*",
	"config/*.key",
] as const;
const SESSION_STATE_GITIGNORE_TEMPLATE = [
	"# MCP runtime state",
	"# Keep this root visible so onboarding/docs and durable memory artifacts can be committed later.",
	"# Ignore ephemeral execution state and caches, including legacy flat session files.",
	...SESSION_STATE_GITIGNORE_REQUIRED_RULES,
].join("\n");
const SESSION_STATE_GITIGNORE_MANAGED_START =
	"# BEGIN MCP AI AGENT GUIDELINES STATE";
const SESSION_STATE_GITIGNORE_MANAGED_END =
	"# END MCP AI AGENT GUIDELINES STATE";

function renderManagedSessionStateGitignoreBlock(): string {
	return [
		SESSION_STATE_GITIGNORE_MANAGED_START,
		SESSION_STATE_GITIGNORE_TEMPLATE,
		SESSION_STATE_GITIGNORE_MANAGED_END,
	].join("\n");
}

function hasRequiredSessionStateGitignoreRules(contents: string): boolean {
	return SESSION_STATE_GITIGNORE_REQUIRED_RULES.every((rule) =>
		contents.includes(rule),
	);
}

function assertSafeStateDir(rawStateDir: string): void {
	const trimmedStateDir = rawStateDir.trim();
	if (trimmedStateDir.length === 0) {
		throw new ValidationError(
			"Session state directory cannot be empty.",
			createErrorContext("session-store"),
			SESSION_STATE_DIR_ENV_VAR,
		);
	}

	if (INVALID_LITERAL_STATE_DIRS.has(trimmedStateDir.toLowerCase())) {
		throw new ValidationError(
			`Session state directory cannot be the literal string '${trimmedStateDir}'.`,
			createErrorContext("session-store"),
			SESSION_STATE_DIR_ENV_VAR,
		);
	}

	const segments = trimmedStateDir.split(/[\\/]+/);
	if (segments.includes("..")) {
		throw new ValidationError(
			"Session state directory cannot contain '..' traversal segments.",
			createErrorContext("session-store"),
			SESSION_STATE_DIR_ENV_VAR,
		);
	}
}

/**
 * Walk up the directory tree from `startDir` looking for a `.git` directory
 * or `package.json` file that marks the workspace root. Returns `null` if no
 * workspace root is found before reaching the filesystem root.
 */
export async function findWorkspaceRoot(
	startDir: string,
): Promise<string | null> {
	let current = resolve(startDir);
	const fsRoot = parse(current).root;
	while (current !== fsRoot) {
		try {
			await access(join(current, ".git"));
			return current;
		} catch {
			// not found — try package.json
		}
		try {
			await access(join(current, "package.json"));
			return current;
		} catch {
			// not found — go up
		}
		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return null;
}

/**
 * Synchronous variant of `findWorkspaceRoot`.  Used by modules that must
 * resolve paths at initialisation time without an async context (e.g. the
 * orchestration config singleton).
 */
export function findWorkspaceRootSync(startDir: string): string | null {
	let current = resolve(startDir);
	const fsRoot = parse(current).root;
	while (current !== fsRoot) {
		if (existsSync(join(current, ".git"))) return current;
		if (existsSync(join(current, "package.json"))) return current;
		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return null;
}

/**
 * Resolve the workspace root directory.
 *
 * Priority order (first match wins):
 *  1. `MCP_WORKSPACE_ROOT` environment variable — explicitly set by the user,
 *     required when the MCP client launches the server via `npx` and does not
 *     preserve the terminal's working directory (Claude Desktop sets `cwd=~`,
 *     Windsurf sets `cwd=/`).
 *  2. Auto-detection: walk up from `fallback` looking for `.git` or `package.json`.
 *  3. `fallback` — the raw value passed by the caller (defaults to `process.cwd()`).
 */
export function resolveWorkspaceRoot(fallback = process.cwd()): string {
	const explicitRoot = process.env[WORKSPACE_ROOT_ENV_VAR];
	if (explicitRoot && explicitRoot.trim().length > 0) {
		return resolve(explicitRoot.trim());
	}
	const detected = findWorkspaceRootSync(fallback);
	return detected ?? fallback;
}

export function resolveSessionStateDir(rawStateDir?: string): string {
	const stateDir =
		rawStateDir ??
		process.env[SESSION_STATE_DIR_ENV_VAR] ??
		DEFAULT_SESSION_STATE_DIR;
	assertSafeStateDir(stateDir);
	return resolve(stateDir);
}

/**
 * Async variant of `resolveSessionStateDir` that scopes runtime state to the
 * current working directory when no explicit override is provided.
 *
 * The explicit override priority is:
 *   1. `rawStateDir` argument
 *   2. `MCP_AI_AGENT_GUIDELINES_STATE_DIR` env var
 *   3. `resolveWorkspaceRoot()` — respects `MCP_WORKSPACE_ROOT` or auto-detects
 *      via `.git` / `package.json` walk-up, then falls back to `process.cwd()`.
 *
 * This keeps writes project-local (e.g. `<workspace>/.mcp-ai-agent-guidelines`)
 * even when the MCP client launches the server via `npx` from the wrong cwd.
 */
export async function resolveSessionStateDirAsync(
	rawStateDir?: string,
): Promise<string> {
	const explicitDir = rawStateDir ?? process.env[SESSION_STATE_DIR_ENV_VAR];
	if (explicitDir) {
		assertSafeStateDir(explicitDir);
		return resolve(explicitDir);
	}
	return resolve(resolveWorkspaceRoot(), DEFAULT_SESSION_STATE_DIR);
}

export function resolveSessionPathWithinStateDir(
	pathSuffix: string,
	rawStateDir?: string,
): string {
	const stateDir = resolveSessionStateDir(rawStateDir);
	const resolvedPath = resolve(stateDir, pathSuffix);
	const relativePath = relative(stateDir, resolvedPath);

	if (
		relativePath === ".." ||
		relativePath.startsWith(`..${sep}`) ||
		isAbsolute(relativePath)
	) {
		throw new ValidationError(
			"Path traversal outside the session state directory is not allowed.",
			createErrorContext("session-store"),
			"path",
		);
	}

	return resolvedPath;
}

export async function ensureSessionStateGitignore(
	rootDir: string,
): Promise<void> {
	const resolvedRootDir = resolve(rootDir);
	await mkdir(resolvedRootDir, { recursive: true });
	const gitignorePath = join(resolvedRootDir, SESSION_STATE_GITIGNORE_PATH);
	const managedBlock = renderManagedSessionStateGitignoreBlock();

	try {
		const existingContents = await readFile(gitignorePath, "utf8");
		if (hasRequiredSessionStateGitignoreRules(existingContents)) {
			return;
		}

		if (
			existingContents.includes(SESSION_STATE_GITIGNORE_MANAGED_START) &&
			existingContents.includes(SESSION_STATE_GITIGNORE_MANAGED_END)
		) {
			const managedBlockPattern = new RegExp(
				`${SESSION_STATE_GITIGNORE_MANAGED_START}[\\s\\S]*?${SESSION_STATE_GITIGNORE_MANAGED_END}`,
				"m",
			);
			await writeFile(
				gitignorePath,
				`${existingContents.replace(managedBlockPattern, managedBlock).trimEnd()}\n`,
				"utf8",
			);
			return;
		}

		const prefix = existingContents.trimEnd();
		await writeFile(
			gitignorePath,
			`${prefix.length > 0 ? `${prefix}\n\n` : ""}${managedBlock}\n`,
			"utf8",
		);
	} catch (error) {
		const errorWithCode = error as NodeJS.ErrnoException;
		if (errorWithCode?.code !== "ENOENT") {
			throw error;
		}

		await writeFile(
			gitignorePath,
			`${SESSION_STATE_GITIGNORE_TEMPLATE}\n`,
			"utf8",
		);
	}
}

export async function writeTextFileAtomic(
	targetPath: string,
	contents: string,
): Promise<void> {
	await mkdir(dirname(targetPath), { recursive: true });
	const tempPath = `${targetPath}.${randomUUID()}.tmp`;
	await writeFile(tempPath, contents, "utf8");
	await rename(tempPath, targetPath);
}

/**
 * Returns `true` when `config/orchestration.toml` exists inside the given
 * state directory.  A `false` result means the workspace has never been
 * bootstrapped via `mcp-cli onboard init` (or `project-onboard`).
 *
 * Callers that perform filesystem mutations can use this to gate writes and
 * surface an actionable onboarding error when it returns `false`.
 */
export async function isWorkspaceInitialized(
	baseDir: string,
): Promise<boolean> {
	const configPath = join(baseDir, "config", "orchestration.toml");
	try {
		await access(configPath);
		return true;
	} catch {
		return false;
	}
}

export async function runExclusiveSessionOperation<T>(
	locks: Map<string, Promise<void>>,
	sessionId: string,
	operation: () => Promise<T>,
): Promise<T> {
	const previousLock = locks.get(sessionId) ?? Promise.resolve();
	let releaseLock!: () => void;
	const pendingLock = new Promise<void>((resolve) => {
		releaseLock = resolve;
	});
	const currentLock = previousLock.then(() => pendingLock);
	locks.set(sessionId, currentLock);

	await previousLock;
	try {
		return await operation();
	} finally {
		releaseLock();
		if (locks.get(sessionId) === currentLock) {
			locks.delete(sessionId);
		}
	}
}
