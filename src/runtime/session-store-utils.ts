import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

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
const INVALID_LITERAL_STATE_DIRS = new Set(["undefined", "null"]);
const SESSION_STATE_GITIGNORE_PATH = ".gitignore";
const SESSION_STATE_GITIGNORE_REQUIRED_RULES = [
	"cache/",
	"sessions/",
	"snapshots/",
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

export function resolveSessionStateDir(rawStateDir?: string): string {
	const stateDir =
		rawStateDir ??
		process.env[SESSION_STATE_DIR_ENV_VAR] ??
		DEFAULT_SESSION_STATE_DIR;
	assertSafeStateDir(stateDir);
	return resolve(stateDir);
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
