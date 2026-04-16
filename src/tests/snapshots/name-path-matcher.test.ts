import { describe, expect, it } from "vitest";
import { DocumentSymbols } from "../../snapshots/document_symbols.js";
import { NamePathMatcher } from "../../snapshots/name_path_matcher.js";
import {
	SymbolKind,
	type UnifiedSymbolInformation,
} from "../../snapshots/types.js";

function makeSymbol(
	name: string,
	kind: SymbolKind,
	children: UnifiedSymbolInformation[] = [],
	overload_idx?: number,
): UnifiedSymbolInformation {
	return {
		name,
		kind,
		location: {
			uri: "file:///repo/test.ts",
			range: {
				start: { line: 0, character: 0 },
				end: { line: 0, character: 1 },
			},
			absolutePath: "/repo/test.ts",
			relativePath: "test.ts",
		},
		children,
		parent: null,
		overload_idx,
	};
}

function wireParents(
	symbol: UnifiedSymbolInformation,
	parent: UnifiedSymbolInformation | null = null,
) {
	symbol.parent = parent;
	for (const child of symbol.children) {
		wireParents(child, symbol);
	}
}

describe("NamePathMatcher", () => {
	it("matches exact and absolute paths", () => {
		const matcher = new NamePathMatcher("MyClass/getValue");
		expect(matcher.matchesPath("MyClass/getValue").matched).toBe(true);
		expect(matcher.matchesPath("Other/getValue").matched).toBe(false);
		expect(
			new NamePathMatcher("/MyClass/getValue").matchesPath("MyClass/getValue")
				.matched,
		).toBe(true);
		expect(
			new NamePathMatcher("/MyClass/getValue").matchesPath(
				"Outer/MyClass/getValue",
			).matched,
		).toBe(false);
	});

	it("supports substring, wildcard, regex, and case-insensitive matching", () => {
		expect(
			NamePathMatcher.for("MyClass/get")
				.withSubstringMatching()
				.build()
				.matchesPath("MyClass/getValue").matched,
		).toBe(true);
		expect(
			NamePathMatcher.for("MyClass/*/getValue")
				.withWildcardSegments()
				.build()
				.matchesPath("MyClass/helpers/getValue").matched,
		).toBe(true);
		expect(
			NamePathMatcher.for("MyClass//^get/i")
				.withRegexSegments()
				.build()
				.matchesPath("MyClass/getValue").matched,
		).toBe(true);
		expect(
			NamePathMatcher.for("myclass/getvalue")
				.withCaseInsensitive()
				.build()
				.matchesPath("MyClass/GetValue").matched,
		).toBe(true);
	});
});

describe("DocumentSymbols.findByNamePath", () => {
	it("returns symbols that match bounded snapshot name paths", () => {
		const overload0 = makeSymbol("getValue", SymbolKind.Method, [], 0);
		const overload1 = makeSymbol("getValue", SymbolKind.Method, [], 1);
		const helper = makeSymbol("helper", SymbolKind.Method);
		const nested = makeSymbol("Nested", SymbolKind.Class, [helper]);
		const root = makeSymbol("MyClass", SymbolKind.Class, [
			overload0,
			overload1,
			nested,
		]);
		wireParents(root);

		const doc = new DocumentSymbols([root]);
		const regexMatches = doc.findByNamePath("MyClass//^get/i", {
			regexSegments: true,
		});
		const wildcardMatches = doc.findByNamePath("MyClass/*/helper", {
			wildcardSegments: true,
		});
		const overloadMatch = doc.findByNamePath("MyClass/getValue[1]");

		expect(regexMatches).toHaveLength(2);
		expect(wildcardMatches.map((symbol) => doc.getNamePath(symbol))).toEqual([
			"MyClass/Nested/helper",
		]);
		expect(overloadMatch.map((symbol) => doc.getNamePath(symbol))).toEqual([
			"MyClass/getValue[1]",
		]);
	});
});
