// ─── usage_example.ts ─────────────────────────────────────────────────────────
// Shows how the pieces assemble, and what the cache files look like on disk.
import { fileURLToPath } from "node:url";
import type { LspClient, RawLspSymbol } from "./language_server_adapter.js";
import { LanguageServerAdapter } from "./language_server_adapter.js";
import { SymbolKind } from "./types.js";

// ── Minimal stub LspClient ────────────────────────────────────────────────────

class StubLspClient implements LspClient {
	async requestDocumentSymbol(fileUri: string): Promise<RawLspSymbol[]> {
		void fileUri;
		// Pretend the LS returned a DocumentSymbol tree for a Python file
		return [
			{
				name: "MyClass",
				kind: SymbolKind.Class,
				range: {
					start: { line: 0, character: 0 },
					end: { line: 20, character: 0 },
				},
				selectionRange: {
					start: { line: 0, character: 6 },
					end: { line: 0, character: 13 },
				},
				detail: "class MyClass:",
				children: [
					{
						name: "__init__(self, value: int) -> None",
						kind: SymbolKind.Method,
						range: {
							start: { line: 1, character: 4 },
							end: { line: 5, character: 0 },
						},
						selectionRange: {
							start: { line: 1, character: 8 },
							end: { line: 1, character: 16 },
						},
						children: [],
					},
					{
						name: "compute(self) -> int",
						kind: SymbolKind.Method,
						range: {
							start: { line: 6, character: 4 },
							end: { line: 10, character: 0 },
						},
						selectionRange: {
							start: { line: 6, character: 8 },
							end: { line: 6, character: 15 },
						},
						children: [],
					},
					// Overloaded method — same name, different signature
					{
						name: "compute(self, x: int) -> int",
						kind: SymbolKind.Method,
						range: {
							start: { line: 11, character: 4 },
							end: { line: 15, character: 0 },
						},
						selectionRange: {
							start: { line: 11, character: 8 },
							end: { line: 11, character: 15 },
						},
						children: [],
					},
				],
			},
		];
	}
}

// ── Wire it up ────────────────────────────────────────────────────────────────

async function main() {
	const adapter = new LanguageServerAdapter({
		repositoryRoot: "/tmp/my-project",
		cacheDir: "/tmp/my-project/.serena/cache/python",
		lsClient: new StubLspClient(),
		lsSpecificRawVersion: 1, // bump when your LS output format changes
		cacheFingerprint: null, // set to e.g. hash of build flags if needed
	});

	// First call: hits the LS, stores in both caches
	const docSymbols = await adapter.requestDocumentSymbols("src/my_module.py");

	for (const symbol of docSymbols.iterSymbols()) {
		const overloadStr =
			symbol.overload_idx !== undefined
				? ` [overload #${symbol.overload_idx}]`
				: "";
		const parentStr = symbol.parent ? ` (parent: ${symbol.parent.name})` : "";
		console.log(`  ${symbol.name}${overloadStr}${parentStr}`);
		// body is available lazily:
		// console.log(symbol.body?.getText());
	}
	// Output:
	//   MyClass
	//   __init__ (parent: MyClass)        ← name normalized by subclass override
	//   compute [overload #0] (parent: MyClass)
	//   compute [overload #1] (parent: MyClass)

	// Second call: returns from in-memory doc cache instantly
	const docSymbols2 = await adapter.requestDocumentSymbols("src/my_module.py");
	console.assert(
		docSymbols === docSymbols2,
		"Should be the same object from cache",
	);

	// Flush to disk on shutdown
	adapter.saveCache();
	// → writes /tmp/my-project/.serena/cache/python/raw_document_symbols.json
	// → writes /tmp/my-project/.serena/cache/python/document_symbols.json
}

// Guard: only run main() when executed directly (not when imported as a module).
// Without this guard, any accidental import would auto-execute against /tmp/my-project
// and could corrupt the MCP stdout stream if console.log fires during startup.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch(console.error);
}
