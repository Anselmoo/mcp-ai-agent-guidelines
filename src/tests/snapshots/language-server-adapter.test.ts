import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	LanguageServerAdapter,
	type LspClient,
} from "../../snapshots/language_server_adapter.js";
import type { RawLspSymbol } from "../../snapshots/types.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const DOC_SYMBOL: RawLspSymbol = {
	name: "MyClass",
	kind: 5,
	range: { start: { line: 0, character: 0 }, end: { line: 10, character: 1 } },
	selectionRange: {
		start: { line: 0, character: 6 },
		end: { line: 0, character: 13 },
	},
	children: [
		{
			name: "myMethod",
			kind: 6,
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

const SYM_INFORMATION: RawLspSymbol = {
	name: "myFunc",
	kind: 12,
	location: {
		uri: "file:///repo/foo.ts",
		range: { start: { line: 0, character: 0 }, end: { line: 2, character: 1 } },
	},
} as RawLspSymbol;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeClient(response: RawLspSymbol[] | null): LspClient {
	return {
		requestDocumentSymbol: vi.fn().mockResolvedValue(response),
	};
}

let tempDir: string;

beforeEach(async () => {
	tempDir = join(
		tmpdir(),
		`lsa-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	await mkdir(tempDir, { recursive: true });
});

afterEach(async () => {
	await rm(tempDir, { recursive: true, force: true });
});

function makeAdapter(client: LspClient) {
	return new LanguageServerAdapter({
		repositoryRoot: tempDir,
		cacheDir: join(tempDir, "cache"),
		lsClient: client,
	});
}

async function writeSourceFile(name: string, content: string) {
	await writeFile(join(tempDir, name), content);
}

// ─── requestDocumentSymbols — happy path (DocumentSymbol format) ──────────────

describe("LanguageServerAdapter.requestDocumentSymbols()", () => {
	it("returns DocumentSymbols with correct root symbol names", async () => {
		const client = makeClient([DOC_SYMBOL]);
		const adapter = makeAdapter(client);
		await writeSourceFile("foo.ts", "export class MyClass { myMethod() {} }");

		const result = await adapter.requestDocumentSymbols("foo.ts");
		expect(result.rootSymbols[0]?.name).toBe("MyClass");
	});

	it("wires parent references on children", async () => {
		const client = makeClient([DOC_SYMBOL]);
		const adapter = makeAdapter(client);
		await writeSourceFile("foo.ts", "export class MyClass { myMethod() {} }");

		const result = await adapter.requestDocumentSymbols("foo.ts");
		const cls = result.rootSymbols[0];
		const method = cls?.children[0];
		expect(method?.parent).toBe(cls);
	});

	it("returns empty DocumentSymbols when LS returns null", async () => {
		const client = makeClient(null);
		const adapter = makeAdapter(client);
		await writeSourceFile("foo.ts", "// empty");

		const result = await adapter.requestDocumentSymbols("foo.ts");
		expect(result.rootSymbols).toHaveLength(0);
	});

	it("returns empty DocumentSymbols when LS returns empty array", async () => {
		const client = makeClient([]);
		const adapter = makeAdapter(client);
		await writeSourceFile("foo.ts", "// empty");

		const result = await adapter.requestDocumentSymbols("foo.ts");
		expect(result.rootSymbols).toHaveLength(0);
	});

	it("handles SymbolInformation format (flat, no selectionRange)", async () => {
		const client = makeClient([SYM_INFORMATION]);
		const adapter = makeAdapter(client);
		await writeSourceFile("foo.ts", "export function myFunc() {}");

		const result = await adapter.requestDocumentSymbols("foo.ts");
		expect(result.rootSymbols[0]?.name).toBe("myFunc");
	});
});

// ─── Caching behavior ─────────────────────────────────────────────────────────

describe("LanguageServerAdapter — caching", () => {
	it("calls LSP only once for the same file (doc cache hit on second call)", async () => {
		const client = makeClient([DOC_SYMBOL]);
		const adapter = makeAdapter(client);
		await writeSourceFile("foo.ts", "export class MyClass {}");

		await adapter.requestDocumentSymbols("foo.ts");
		await adapter.requestDocumentSymbols("foo.ts"); // second call — cache hit

		// LSP should only be called once
		expect(client.requestDocumentSymbol).toHaveBeenCalledTimes(1);
	});

	it("calls LSP again for different file", async () => {
		const client = makeClient([DOC_SYMBOL]);
		const adapter = makeAdapter(client);
		await writeSourceFile("a.ts", "export class A {}");
		await writeSourceFile("b.ts", "export class B {}");

		await adapter.requestDocumentSymbols("a.ts");
		await adapter.requestDocumentSymbols("b.ts");

		expect(client.requestDocumentSymbol).toHaveBeenCalledTimes(2);
	});

	it("saveCache does not throw", async () => {
		const client = makeClient([]);
		const adapter = makeAdapter(client);
		await writeSourceFile("foo.ts", "// empty");
		await adapter.requestDocumentSymbols("foo.ts");

		expect(() => adapter.saveCache()).not.toThrow();
	});
});

// ─── Overload detection ───────────────────────────────────────────────────────

describe("LanguageServerAdapter — overload detection", () => {
	it("assigns overload_idx to duplicate-named symbols", async () => {
		const overload1: RawLspSymbol = {
			name: "process",
			kind: 12,
			range: {
				start: { line: 0, character: 0 },
				end: { line: 1, character: 1 },
			},
			selectionRange: {
				start: { line: 0, character: 9 },
				end: { line: 0, character: 16 },
			},
		} as RawLspSymbol;
		const overload2: RawLspSymbol = {
			name: "process",
			kind: 12,
			range: {
				start: { line: 2, character: 0 },
				end: { line: 3, character: 1 },
			},
			selectionRange: {
				start: { line: 2, character: 9 },
				end: { line: 2, character: 16 },
			},
		} as RawLspSymbol;

		const client = makeClient([overload1, overload2]);
		const adapter = makeAdapter(client);
		await writeSourceFile(
			"overloads.ts",
			"function process(x: string): void;\nfunction process(x: number): void;\n",
		);

		const result = await adapter.requestDocumentSymbols("overloads.ts");
		const indices = result.rootSymbols.map((s) => s.overload_idx);
		// At least one should have an overload_idx assigned (> 0)
		expect(indices.some((idx) => idx !== undefined && idx > 0)).toBe(true);
	});
});

// ─── pathToUri (indirectly via adapter) ──────────────────────────────────────

describe("LanguageServerAdapter — file URI in LSP request", () => {
	it("calls LSP with a file:// URI", async () => {
		const client = makeClient([]);
		const adapter = makeAdapter(client);
		await writeSourceFile("bar.ts", "// bar");

		await adapter.requestDocumentSymbols("bar.ts");

		const calledWith = (
			client.requestDocumentSymbol as ReturnType<typeof vi.fn>
		).mock.calls[0]?.[0] as string;
		expect(calledWith).toMatch(/^file:\/\//);
	});
});
