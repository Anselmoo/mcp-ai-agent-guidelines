// ─── cache_io.ts ──────────────────────────────────────────────────────────────
// Mirrors solidlsp/util/cache.py — versioned JSON persistence with atomic writes.
//
// Python used pickle. Here we use JSON + Zod for runtime-safe (de)serialization.
// Atomic write: write to <path>.tmp → fsync → rename, so a crash never
// leaves a half-written file (Python's pickle had the same corruption risk).

import * as fs from "node:fs";
import * as path from "node:path";
import type { ZodSchema } from "zod";

const log = (msg: string) => console.log(`[cache_io] ${msg}`);

export type CacheVersion = string | number | readonly (string | number)[];

interface CacheEnvelope<T> {
	__cache_version: CacheVersion;
	obj: T;
}

/**
 * Load a versioned JSON cache file.
 * Returns `null` if the file doesn't exist, is corrupt, or has a version mismatch.
 *
 * @param filePath   Absolute path to the .json cache file
 * @param version    Expected version (compared with ===  / JSON-equal for arrays)
 * @param schema     Zod schema to validate the `obj` field at runtime
 */
export function loadCache<T>(
	filePath: string,
	version: CacheVersion,
	schema: ZodSchema<T>,
): T | null {
	if (!fs.existsSync(filePath)) return null;

	let raw: string;
	try {
		raw = fs.readFileSync(filePath, "utf8");
	} catch (e) {
		log(`Could not read cache at ${filePath}: ${e}`);
		return null;
	}

	let envelope: unknown;
	try {
		envelope = JSON.parse(raw);
	} catch (e) {
		log(`Corrupt JSON cache at ${filePath}: ${e}`);
		return null;
	}

	if (
		typeof envelope !== "object" ||
		envelope === null ||
		!("__cache_version" in envelope)
	) {
		log(`Missing __cache_version in cache at ${filePath}`);
		return null;
	}

	const savedVersion = (envelope as CacheEnvelope<unknown>).__cache_version;
	if (JSON.stringify(savedVersion) !== JSON.stringify(version)) {
		log(
			`Version mismatch at ${filePath}: expected ${JSON.stringify(version)}, got ${JSON.stringify(savedVersion)}`,
		);
		return null;
	}

	const parsed = schema.safeParse((envelope as CacheEnvelope<unknown>).obj);
	if (!parsed.success) {
		log(
			`Schema validation failed for cache at ${filePath}: ${parsed.error.message}`,
		);
		return null;
	}

	return parsed.data;
}

/**
 * Save a versioned JSON cache file atomically.
 * Writes to <path>.tmp first, then renames — crash-safe.
 */
export function saveCache<T>(
	filePath: string,
	version: CacheVersion,
	obj: T,
): void {
	const envelope: CacheEnvelope<T> = { __cache_version: version, obj };
	const json = JSON.stringify(envelope, null, 0); // compact for speed
	const tmp = filePath + ".tmp";

	try {
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(tmp, json, "utf8");
		// On Linux/macOS this is atomic; on Windows it's best-effort
		fs.renameSync(tmp, filePath);
	} catch (e) {
		log(`Failed to save cache to ${filePath}: ${e}`);
		// Clean up tmp if it exists
		try {
			fs.unlinkSync(tmp);
		} catch {
			/* ignore */
		}
		throw e;
	}
}
