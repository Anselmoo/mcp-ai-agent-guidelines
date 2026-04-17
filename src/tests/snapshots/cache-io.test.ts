import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { loadCache, saveCache } from "../../snapshots/cache_io.js";

let tempDir: string;

beforeEach(async () => {
	tempDir = await mkdtemp(join(tmpdir(), "cache-io-tests-"));
});

afterEach(async () => {
	await rm(tempDir, { recursive: true, force: true });
});

const SimpleSchema = z.object({ value: z.string() });

describe("loadCache", () => {
	it("returns null when the file does not exist", async () => {
		const result = loadCache(
			join(tempDir, "nonexistent.json"),
			1,
			SimpleSchema,
		);
		expect(result).toBeNull();
	});

	it("returns null when the file contains invalid JSON", async () => {
		const filePath = join(tempDir, "corrupt.json");
		await writeFile(filePath, "NOT JSON");
		const result = loadCache(filePath, 1, SimpleSchema);
		expect(result).toBeNull();
	});

	it("returns null when __cache_version is missing", async () => {
		const filePath = join(tempDir, "no-version.json");
		await writeFile(filePath, JSON.stringify({ obj: { value: "x" } }));
		const result = loadCache(filePath, 1, SimpleSchema);
		expect(result).toBeNull();
	});

	it("returns null when __cache_version mismatches (scalar)", async () => {
		const filePath = join(tempDir, "mismatch.json");
		const payload = { __cache_version: 2, obj: { value: "x" } };
		await writeFile(filePath, JSON.stringify(payload));
		const result = loadCache(filePath, 1, SimpleSchema);
		expect(result).toBeNull();
	});

	it("returns null when __cache_version mismatches (tuple)", async () => {
		const filePath = join(tempDir, "mismatch-tuple.json");
		const payload = { __cache_version: [1, 99], obj: { value: "x" } };
		await writeFile(filePath, JSON.stringify(payload));
		const result = loadCache(filePath, [1, 1], SimpleSchema);
		expect(result).toBeNull();
	});

	it("returns null when data fails schema validation", async () => {
		const filePath = join(tempDir, "invalid-schema.json");
		const payload = { __cache_version: 1, obj: { wrong_field: 42 } };
		await writeFile(filePath, JSON.stringify(payload));
		const result = loadCache(filePath, 1, SimpleSchema);
		expect(result).toBeNull();
	});

	it("returns parsed data when version and schema both match (scalar version)", async () => {
		const filePath = join(tempDir, "valid.json");
		const payload = { __cache_version: 1, obj: { value: "hello" } };
		await writeFile(filePath, JSON.stringify(payload));
		const result = loadCache(filePath, 1, SimpleSchema);
		expect(result).toEqual({ value: "hello" });
	});

	it("returns parsed data for tuple version", async () => {
		const filePath = join(tempDir, "valid-tuple.json");
		const payload = { __cache_version: [1, 2], obj: { value: "world" } };
		await writeFile(filePath, JSON.stringify(payload));
		const result = loadCache(filePath, [1, 2], SimpleSchema);
		expect(result).toEqual({ value: "world" });
	});
});

describe("saveCache + loadCache round-trip", () => {
	it("writes a file that can be reloaded", async () => {
		const filePath = join(tempDir, "roundtrip.json");
		const data = { value: "test-data" };
		saveCache(filePath, 3, data);
		const loaded = loadCache(filePath, 3, SimpleSchema);
		expect(loaded).toEqual(data);
	});

	it("uses atomic write (no partial file visible)", async () => {
		// Smoke test: saveCache should not throw and file should be present
		const filePath = join(tempDir, "atomic.json");
		expect(() => saveCache(filePath, 1, { value: "safe" })).not.toThrow();
		const loaded = loadCache(filePath, 1, SimpleSchema);
		expect(loaded).toEqual({ value: "safe" });
	});

	it("creates parent directories if they don't exist", async () => {
		// saveCache calls mkdirSync with { recursive: true }, so nested paths succeed.
		const filePath = join(tempDir, "missing-parent", "nested.json");
		expect(() => saveCache(filePath, 1, { value: "nested" })).not.toThrow();
		const loaded = loadCache(filePath, 1, SimpleSchema);
		expect(loaded).toEqual({ value: "nested" });
	});

	it("overwrites existing file on save", async () => {
		const filePath = join(tempDir, "overwrite.json");
		saveCache(filePath, 1, { value: "first" });
		saveCache(filePath, 1, { value: "second" });
		const loaded = loadCache(filePath, 1, SimpleSchema);
		expect(loaded).toEqual({ value: "second" });
	});

	it("tuple version is persisted and reloaded correctly", async () => {
		const filePath = join(tempDir, "tuple-version.json");
		saveCache(filePath, [2, 5, "fp"], { value: "fingerprinted" });
		const loaded = loadCache(filePath, [2, 5, "fp"], SimpleSchema);
		expect(loaded).toEqual({ value: "fingerprinted" });
	});
});
