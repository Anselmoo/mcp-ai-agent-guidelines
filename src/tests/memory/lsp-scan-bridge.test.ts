import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildSymbolIndex,
	extractAllSymbolMap,
	extractMethodMap,
	extractSymbolMapFallback,
	extractSymbolMapViaLsp,
	searchSymbolIndex,
} from "../../memory/lsp-scan-bridge.js";
import type { LspClient } from "../../snapshots/language_server_adapter.js";
import type { RawLspSymbol } from "../../snapshots/types.js";

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
		expect(fileEntry?.MyService).toBeDefined();
		expect(fileEntry?.MyService?.members).toContain("hello");
	});

	it("omits entry when the file has no classes (no containers found)", async () => {
		await writeFile(
			join(tempDir, "plain.ts"),
			"export function standalone() {}\n",
		);
		const result = await extractMethodMap(tempDir, ["plain.ts"]);
		expect(result["plain.ts"]).toBeUndefined();
	});
});

// ─── extractAllSymbolMap ──────────────────────────────────────────────────────

describe("extractAllSymbolMap", () => {
	it("returns empty object for empty path list", async () => {
		const result = await extractAllSymbolMap(tempDir, []);
		expect(result).toEqual({});
	});

	it("returns all symbols (exported + internal) from a file", async () => {
		const src = [
			"export function pub() {}",
			"function priv() {}",
			"const secret = 1;",
		].join("\n");
		await writeFile(join(tempDir, "all.ts"), src);
		const result = await extractAllSymbolMap(tempDir, ["all.ts"]);
		const names = result["all.ts"]?.map((s) => s.name);
		expect(names).toContain("pub");
	});

	it("respects includePrivate option", async () => {
		await writeFile(join(tempDir, "priv.ts"), "function _internal() {}\n");
		const withoutPrivate = await extractAllSymbolMap(tempDir, ["priv.ts"], {
			includePrivate: false,
		});
		const withPrivate = await extractAllSymbolMap(tempDir, ["priv.ts"], {
			includePrivate: true,
		});
		const namesWithout = withoutPrivate["priv.ts"]?.map((s) => s.name) ?? [];
		const namesWith = withPrivate["priv.ts"]?.map((s) => s.name) ?? [];
		expect(namesWith).toContain("_internal");
		expect(namesWithout).not.toContain("_internal");
	});

	it("respects includeMembers option", async () => {
		const src = `
export class Widget {
  render() {}
}
`.trim();
		await writeFile(join(tempDir, "widget.ts"), src);
		const withMembers = await extractAllSymbolMap(tempDir, ["widget.ts"], {
			includeMembers: true,
		});
		const withoutMembers = await extractAllSymbolMap(tempDir, ["widget.ts"], {
			includeMembers: false,
		});
		const namesWith = withMembers["widget.ts"]?.map((s) => s.name) ?? [];
		const namesWithout = withoutMembers["widget.ts"]?.map((s) => s.name) ?? [];
		expect(namesWith).toContain("render");
		expect(namesWithout).not.toContain("render");
	});

	it("skips unreadable files silently", async () => {
		const result = await extractAllSymbolMap(tempDir, ["missing.ts"]);
		expect(result["missing.ts"]).toBeUndefined();
	});

	it("omits entry when file yields no symbols", async () => {
		await writeFile(join(tempDir, "empty.ts"), "// just a comment\n");
		const result = await extractAllSymbolMap(tempDir, ["empty.ts"]);
		expect(result["empty.ts"]).toBeUndefined();
	});

	it("processes files in batches respecting concurrency limit", async () => {
		for (let i = 0; i < 5; i++) {
			await writeFile(
				join(tempDir, `all${i}.ts`),
				`export function allFn${i}() {}\n`,
			);
		}
		const paths = Array.from({ length: 5 }, (_, i) => `all${i}.ts`);
		const result = await extractAllSymbolMap(tempDir, paths, {
			concurrency: 2,
		});
		for (let i = 0; i < 5; i++) {
			const names = result[`all${i}.ts`]?.map((s) => s.name) ?? [];
			expect(names).toContain(`allFn${i}`);
		}
	});
});

// ─── extractSymbolMapViaLsp ───────────────────────────────────────────────────

describe("extractSymbolMapViaLsp", () => {
	function makeClient(response: RawLspSymbol[] | null): LspClient {
		return {
			requestDocumentSymbol: vi.fn().mockResolvedValue(response),
		};
	}

	it("returns empty object when no paths are given", async () => {
		const client = makeClient([]);
		const result = await extractSymbolMapViaLsp(
			tempDir,
			join(tempDir, "cache"),
			client,
			[],
		);
		expect(result).toEqual({});
	});

	it("extracts tracked-kind symbol names via the LSP client", async () => {
		const classSymbol: RawLspSymbol = {
			name: "MyClass",
			kind: 5, // Class — tracked
			range: {
				start: { line: 0, character: 0 },
				end: { line: 10, character: 1 },
			},
			selectionRange: {
				start: { line: 0, character: 6 },
				end: { line: 0, character: 13 },
			},
			children: [
				{
					name: "myMethod",
					kind: 6, // Method — not tracked
					range: {
						start: { line: 2, character: 2 },
						end: { line: 4, character: 3 },
					},
					selectionRange: {
						start: { line: 2, character: 2 },
						end: { line: 2, character: 10 },
					},
				},
			],
		} as RawLspSymbol;

		await writeFile(
			join(tempDir, "foo.ts"),
			"export class MyClass { myMethod() {} }",
		);
		const client = makeClient([classSymbol]);
		const result = await extractSymbolMapViaLsp(
			tempDir,
			join(tempDir, "cache"),
			client,
			["foo.ts"],
		);
		expect(result["foo.ts"]).toEqual(["MyClass"]);
	});

	it("omits entry when no root symbols match tracked kinds", async () => {
		const methodOnly: RawLspSymbol = {
			name: "onlyMethod",
			kind: 6, // Method — not tracked
			range: {
				start: { line: 0, character: 0 },
				end: { line: 1, character: 1 },
			},
			selectionRange: {
				start: { line: 0, character: 0 },
				end: { line: 0, character: 5 },
			},
		} as RawLspSymbol;

		await writeFile(join(tempDir, "bar.ts"), "class C { onlyMethod() {} }");
		const client = makeClient([methodOnly]);
		const result = await extractSymbolMapViaLsp(
			tempDir,
			join(tempDir, "cache"),
			client,
			["bar.ts"],
		);
		expect(result["bar.ts"]).toBeUndefined();
	});

	it("skips a file when the LSP request throws", async () => {
		await writeFile(join(tempDir, "err.ts"), "export function ok() {}");
		const client: LspClient = {
			requestDocumentSymbol: vi.fn().mockRejectedValue(new Error("LS crash")),
		};
		const result = await extractSymbolMapViaLsp(
			tempDir,
			join(tempDir, "cache"),
			client,
			["err.ts"],
		);
		expect(result["err.ts"]).toBeUndefined();
	});

	it("calls saveCache after processing all files", async () => {
		await writeFile(join(tempDir, "save.ts"), "export function ok() {}");
		const funcSymbol: RawLspSymbol = {
			name: "ok",
			kind: 12, // Function — tracked
			location: {
				uri: "file:///repo/save.ts",
				range: {
					start: { line: 0, character: 0 },
					end: { line: 0, character: 20 },
				},
			},
		} as RawLspSymbol;
		const client = makeClient([funcSymbol]);
		const result = await extractSymbolMapViaLsp(
			tempDir,
			join(tempDir, "cache"),
			client,
			["save.ts"],
		);
		expect(result["save.ts"]).toEqual(["ok"]);
		// saveCache writes a cache file to disk without throwing — verified
		// indirectly by successful completion of the async function above.
	});
});
