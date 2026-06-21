import { promisify } from "node:util";
import { deflate, inflate } from "node:zlib";
import { createId as cuid2 } from "@paralleldrive/cuid2";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { DEFAULT_SESSION_INTEGRITY_OPTIONS_VALUES } from "../config/runtime-defaults.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { createOperationalLogger } from "../infrastructure/observability.js";
import { parseOrThrow } from "../validation/schema-utilities.js";
import {
	defaultReadTextFile,
	ensureSessionStateGitignore,
	resolveSessionPathWithinStateDir,
	resolveSessionStateDir,
	runExclusiveSessionOperation,
	type SessionStoreSeams,
	writeTextFileAtomic,
} from "./session-store-utils.js";

// Compatibility functions
const uuidv4 = () => cuid2();
const CUID2_SESSION_ID_PATTERN = /^[a-z0-9]{24,32}$/;
const COMPACT_SESSION_ID_PATTERN =
	/^[0-9ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz]{12}$/;
const UUID_SESSION_ID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NANOID_SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{21}$/;
const validateCuid2Id = (id: string) => CUID2_SESSION_ID_PATTERN.test(id);
const secureSessionStoreLogger = createOperationalLogger("warn");

import type {
	ExecutionProgressRecord,
	SessionStateStore,
} from "../contracts/runtime.js";

const deflateAsync = promisify(deflate);
const inflateAsync = promisify(inflate);

// Custom alphabet for nanoid (URL-safe, no ambiguous chars)
const createId = customAlphabet(
	"0123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz",
	12,
);

const executionProgressRecordSchema = z
	.object({
		stepLabel: z.string(),
		kind: z.string(),
		summary: z.string(),
	})
	.strict();

const sessionDataSchema = z
	.object({
		sessionId: z.string().min(1),
		version: z.number().int().nonnegative(),
		timestamp: z.number().int().nonnegative(),
		records: z.union([z.array(executionProgressRecordSchema), z.string()]),
		compressed: z.boolean(),
		mac: z.string().optional(),
	})
	.strict()
	.superRefine((value, context) => {
		if (value.compressed && typeof value.records !== "string") {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["records"],
				message:
					"Compressed session payloads must store records as a base64 string.",
			});
		}
		if (!value.compressed && !Array.isArray(value.records)) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["records"],
				message:
					"Uncompressed session payloads must store records as an array.",
			});
		}
	});

/**
 * Session data with integrity protection
 */
interface SessionData {
	sessionId: string;
	version: number;
	timestamp: number;
	records: ExecutionProgressRecord[] | string; // String when compressed
	compressed: boolean;
	mac?: string;
}

function parseSessionDataEnvelope(input: unknown): SessionData {
	return parseOrThrow(sessionDataSchema, input);
}

function parseExecutionProgressRecords(
	input: unknown,
): ExecutionProgressRecord[] {
	return parseOrThrow(z.array(executionProgressRecordSchema), input);
}

/**
 * Session integrity options
 */
interface SessionIntegrityOptions {
	/** Enable compression for large session payloads */
	enableCompression: boolean;
	/** Compression threshold in bytes */
	compressionThreshold: number;
}

const DEFAULT_INTEGRITY_OPTIONS: SessionIntegrityOptions = {
	...DEFAULT_SESSION_INTEGRITY_OPTIONS_VALUES,
};

export interface SessionHistoryReadResult {
	records: ExecutionProgressRecord[];
	missing: boolean;
	integrityFailure: boolean;
	error?: string;
}

/**
 * Enhanced session store with integrity checking and compression
 */
export class SecureFileSessionStore implements SessionStateStore {
	private options: SessionIntegrityOptions;
	private readonly writeLocks = new Map<string, Promise<void>>();
	private readonly readTextFile: (path: string) => Promise<string>;

	constructor(
		options: Partial<SessionIntegrityOptions> = {},
		seams: SessionStoreSeams = {},
	) {
		this.options = { ...DEFAULT_INTEGRITY_OPTIONS, ...options };
		this.readTextFile = seams.readTextFile ?? defaultReadTextFile;
		// Validate the configured state directory eagerly (fail fast on traversal).
		resolveSessionStateDir();
	}

	private sessionFilePath(sessionId: string): string {
		return resolveSessionPathWithinStateDir(`${sessionId}.json`);
	}

	private async compressData(data: Buffer): Promise<Buffer> {
		if (
			!this.options.enableCompression ||
			data.length < this.options.compressionThreshold
		) {
			return data;
		}
		return deflateAsync(data);
	}

	private async decompressData(data: Buffer): Promise<Buffer> {
		// Try to decompress; if it fails, assume it wasn't compressed
		try {
			return await inflateAsync(data);
		} catch {
			return data;
		}
	}

	async readSessionHistoryResult(
		sessionId: string,
	): Promise<SessionHistoryReadResult> {
		try {
			resolveSessionStateDir();
			const contents = await this.readTextFile(this.sessionFilePath(sessionId));
			const sessionData = parseSessionDataEnvelope(JSON.parse(contents));

			if (sessionData.compressed) {
				if (typeof sessionData.records !== "string") {
					throw new Error(
						"Compressed session payload must store records as a base64 string.",
					);
				}
				const compressedData = Buffer.from(sessionData.records, "base64");
				const decompressedData = await this.decompressData(compressedData);
				return {
					records: parseExecutionProgressRecords(
						JSON.parse(decompressedData.toString("utf8")),
					),
					missing: false,
					integrityFailure: false,
				};
			}

			if (!Array.isArray(sessionData.records)) {
				throw new Error(
					"Uncompressed session payload must store records as an array.",
				);
			}

			return {
				records: sessionData.records,
				missing: false,
				integrityFailure: false,
			};
		} catch (error) {
			const errorWithCode = error as NodeJS.ErrnoException;
			if (errorWithCode?.code === "ENOENT") {
				return {
					records: [],
					missing: true,
					integrityFailure: false,
				};
			}

			return {
				records: [],
				missing: false,
				integrityFailure: false,
				error: toErrorMessage(error),
			};
		}
	}

	async readSessionHistory(
		sessionId: string,
	): Promise<ExecutionProgressRecord[]> {
		const result = await this.readSessionHistoryResult(sessionId);
		if (!result.missing && result.error) {
			secureSessionStoreLogger.log("warn", "Failed to read session history", {
				sessionId,
				error: result.error,
			});
		}

		return result.records;
	}

	async writeSessionHistory(
		sessionId: string,
		records: ExecutionProgressRecord[],
	): Promise<void> {
		const stateDir = resolveSessionStateDir();
		await ensureSessionStateGitignore(stateDir);

		let recordsData: ExecutionProgressRecord[] | string = records;
		let compressed = false;

		// Compress if enabled and data is large enough
		if (this.options.enableCompression) {
			const jsonData = JSON.stringify(records);
			const dataSize = Buffer.byteLength(jsonData, "utf8");

			if (dataSize >= this.options.compressionThreshold) {
				const compressedData = await this.compressData(
					Buffer.from(jsonData, "utf8"),
				);
				recordsData = compressedData.toString("base64");
				compressed = true;
			}
		}

		const sessionData: SessionData = {
			sessionId,
			version: 1,
			timestamp: Date.now(),
			records: recordsData,
			compressed,
		};

		await writeTextFileAtomic(
			this.sessionFilePath(sessionId),
			`${JSON.stringify(sessionData, null, "\t")}\n`,
		);
	}

	async appendSessionHistory(
		sessionId: string,
		record: ExecutionProgressRecord,
	): Promise<void> {
		await runExclusiveSessionOperation(this.writeLocks, sessionId, async () => {
			const existing = await this.readSessionHistory(sessionId);
			existing.push(record);
			await this.writeSessionHistory(sessionId, existing);
		});
	}
}

/**
 * Enhanced session ID creation with better randomness and validation
 */
export function createSessionId(): string {
	// Use nanoid for shorter, URL-safe IDs
	return `session-${createId()}`;
}

/**
 * Create a UUID-based session ID for maximum uniqueness
 */
export function createUuidSessionId(): string {
	return `session-${uuidv4()}`;
}

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
	if (sessionId.trim() !== sessionId || sessionId === "") {
		return false;
	}

	if (NANOID_SESSION_ID_PATTERN.test(sessionId)) {
		return true;
	}

	if (!sessionId.startsWith("session-")) {
		return false;
	}

	const id = sessionId.slice("session-".length);

	if (id === "") {
		return false;
	}

	return (
		validateCuid2Id(id) ||
		UUID_SESSION_ID_PATTERN.test(id) ||
		COMPACT_SESSION_ID_PATTERN.test(id)
	);
}

export function assertValidSessionId(
	sessionId: unknown,
	fieldName = "sessionId",
): string {
	if (typeof sessionId !== "string" || sessionId.trim() === "") {
		throw new Error(`${fieldName} must be a non-empty string.`);
	}

	if (!isValidSessionId(sessionId)) {
		throw new Error(
			`${fieldName} must be a valid session ID in a supported format.`,
		);
	}

	return sessionId;
}

/**
 * Legacy session store for backward compatibility
 */
export class FileSessionStore implements SessionStateStore {
	private readonly writeLocks = new Map<string, Promise<void>>();
	private readonly readTextFile: (path: string) => Promise<string>;

	constructor(seams: SessionStoreSeams = {}) {
		this.readTextFile = seams.readTextFile ?? defaultReadTextFile;
	}

	private sessionFilePath(sessionId: string): string {
		return resolveSessionPathWithinStateDir(`${sessionId}.json`);
	}

	async readSessionHistory(
		sessionId: string,
	): Promise<ExecutionProgressRecord[]> {
		resolveSessionStateDir();
		try {
			const contents = await this.readTextFile(this.sessionFilePath(sessionId));
			const parsed = JSON.parse(contents);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	async writeSessionHistory(
		sessionId: string,
		records: ExecutionProgressRecord[],
	): Promise<void> {
		await writeTextFileAtomic(
			this.sessionFilePath(sessionId),
			`${JSON.stringify(records, null, "\t")}\n`,
		);
	}

	async appendSessionHistory(
		sessionId: string,
		record: ExecutionProgressRecord,
	): Promise<void> {
		await runExclusiveSessionOperation(this.writeLocks, sessionId, async () => {
			const existing = await this.readSessionHistory(sessionId);
			existing.push(record);
			await this.writeSessionHistory(sessionId, existing);
		});
	}
}
