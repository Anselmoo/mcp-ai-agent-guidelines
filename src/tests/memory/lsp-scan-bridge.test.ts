import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	buildSymbolIndex,
	extractMethodMap,
	extractSymbolMapFallback,
	searchSymbolIndex,
} from "../../memory/lsp-scan-bridge.js";

let tempDir: string;

beforeEach(async () => {
	tempDir = join(
		tmpdir(),
		`lsp-bridge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	await mkdir(tempDir, { recursive: true });
});

afterEach(async () => {
	await rm(tempDir, { recursive: true, force: true });
});

// ─── extractSymbolMapFallback ─────────────────────────────────────────────────

describe("extractSymbolMapFallback", () => {
	it("returns empty object for empty path list", async () => {
		const result = await extractSymbolMapFallback(tempDir, []);
		expect(result).toEqual({});
	});

	it("extracts exported function names from a TS file", async () => {
		await writeFile(join(tempDir, "foo.ts"), "export function hello() {}\n");
		const result = await extractSymbolMapFallback(tempDir, ["foo.ts"]);
		expect(result["foo.ts"]).toContain("hello");
	});

	it("extracts exported class names", async () => {
		await writeFile(join(tempDir, "cls.ts"), "export class MyService {}\n");
		const result = await extractSymbolMapFallback(tempDir, ["cls.ts"]);
		expect(result["cls.ts"]).toContain("MyService");
	});

	it("extracts exported interface, enum, type aliases", async () => {
		const src = [
			"export interface IFoo {}",
			"export enum Color { Red }",
			"export type Alias = string;",
		].join("\n");
		await writeFile(join(tempDir, "types.ts"), src);
		const result = await extractSymbolMapFallback(tempDir, ["types.ts"]);
		expect(result["types.ts"]).toContain("IFoo");
		expect(result["types.ts"]).toContain("Color");
		expect(result["types.ts"]).toContain("Alias");
	});

	it("extracts exported const/let declarations", async () => {
		await writeFile(
			join(tempDir, "vars.ts"),
			"export const VERSION = '1.0';\nexport let count = 0;\n",
		);
		const result = await extractSymbolMapFallback(tempDir, ["vars.ts"]);
		expect(result["vars.ts"]).toContain("VERSION");
	});

	it("omits unexported declarations", async () => {
		await writeFile(
			join(tempDir, "private.ts"),
			"function internal() {}\nconst secret = 42;\n",
		);
		const result = await extractSymbolMapFallback(tempDir, ["private.ts"]);
		expect(result["private.ts"]).toBeUndefined();
	});

	it("skips unreadable files silently", async () => {
		const result = await extractSymbolMapFallback(tempDir, ["nonexistent.ts"]);
		expect(result["nonexistent.ts"]).toBeUndefined();
	});

	it("processes files in batches respecting concurrency limit", async () => {
		// Write 5 files
		for (let i = 0; i < 5; i++) {
			await writeFile(
				join(tempDir, `f${i}.ts`),
				`export function fn${i}() {}\n`,
			);
		}
		const paths = Array.from({ length: 5 }, (_, i) => `f${i}.ts`);
		const result = await extractSymbolMapFallback(tempDir, paths, 2);
		for (let i = 0; i < 5; i++) {
			expect(result[`f${i}.ts`]).toContain(`fn${i}`);
		}
	});
});

// ─── buildSymbolIndex ─────────────────────────────────────────────────────────

describe("buildSymbolIndex", () => {
	it("returns empty array for empty symbol map", () => {
		const index = buildSymbolIndex({});
		expect(index).toHaveLength(0);
	});

	it("creates an entry for each symbol", () => {
		const symbolMap = {
			"src/foo.ts": ["hello", "world"],
			"src/bar.ts": ["greet"],
		};
		const index = buildSymbolIndex(symbolMap);
		expect(index).toHaveLength(3);
	});

	it("each entry contains name, file, and exported flag", () => {
		const symbolMap = { "src/foo.ts": ["hello"] };
		const index = buildSymbolIndex(symbolMap);
		expect(index[0]).toMatchObject({
			name: "hello",
			file: "src/foo.ts",
			exported: true,
		});
	});

	it("entries are sorted (smoke test: multiple symbols)", () => {
		const symbolMap = { "src/z.ts": ["z_sym"], "src/a.ts": ["a_sym"] };
		const index = buildSymbolIndex(symbolMap);
		expect(index.length).toBe(2);
		// Sorted by name lexicographically
		const names = index.map((e) => e.name);
		expect([...names].sort()).toEqual(names);
	});
});

// ─── searchSymbolIndex ────────────────────────────────────────────────────────

describe("searchSymbolIndex", () => {
	const index = buildSymbolIndex({
		"src/users.ts": ["UserService", "UserModel", "createUser"],
		"src/auth.ts": ["AuthService", "validateToken"],
	});

	it("returns all entries when query is empty", () => {
		const results = searchSymbolIndex(index, "");
		expect(results).toHaveLength(index.length);
	});

	it("finds entries matching a substring of the name", () => {
		const results = searchSymbolIndex(index, "Service");
		const names = results.map((r) => r.name);
		expect(names).toContain("UserService");
		expect(names).toContain("AuthService");
	});

	it("returns empty array when no match", () => {
		const results = searchSymbolIndex(index, "NonExistent");
		expect(results).toHaveLength(0);
	});

	it("respects the limit parameter", () => {
		const all = searchSymbolIndex(index, "");
		const limited = searchSymbolIndex(index, "", 2);
		expect(limited.length).toBeLessThanOrEqual(2);
		expect(limited.length).toBeLessThanOrEqual(all.length);
	});

	it("returns exact match when query equals symbol name", () => {
		const results = searchSymbolIndex(index, "createUser");
		expect(results.some((r) => r.name === "createUser")).toBe(true);
	});
});

// ─── extractMethodMap ─────────────────────────────────────────────────────────

describe("extractMethodMap", () => {
	it("returns empty object for empty path list", async () => {
		const result = await extractMethodMap(tempDir, []);
		expect(result).toEqual({});
	});

	it("extracts class methods from a TypeScript file", async () => {
		const src = `
export class MyService {
  hello() {}
  private _internal() {}
}
`.trim();
		await writeFile(join(tempDir, "service.ts"), src);
		const result = await extractMethodMap(tempDir, ["service.ts"]);
		// result is keyed by relative path, then by class name
		const fileEntry = result["service.ts"];
		expect(fileEntry).toBeDefined();
		expect(fileEntry?.["MyService"]).toBeDefined();
		expect(fileEntry?.["MyService"]?.members).toContain("hello");
	});
});
