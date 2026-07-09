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

	it("keeps explicit regex flags when case-insensitive is already satisfied", () => {
		expect(
			NamePathMatcher.for("MyClass//^get/i")
				.withRegexSegments()
				.withCaseInsensitive()
				.build()
				.matchesPath("MyClass/getValue").matched,
		).toBe(true);
	});

	it("adds the case-insensitive flag to a regex segment missing it", () => {
		expect(
			NamePathMatcher.for("MyClass//^GET/x/getValue")
				.withRegexSegments()
				.withCaseInsensitive()
				.build()
				.matchesPath("MyClass/getMethod/x/getValue").matched,
		).toBe(true);
	});

	it("ignores a non-numeric bracket suffix in a pattern segment", () => {
		expect(
			new NamePathMatcher("MyClass/getValue[abc]").matchesPath(
				"MyClass/getValue[abc]",
			).matched,
		).toBe(true);
	});

	it("fails substring matching when the substring is absent", () => {
		expect(
			NamePathMatcher.for("MyClass/zzz")
				.withSubstringMatching()
				.build()
				.matchesPath("MyClass/getValue").matched,
		).toBe(false);
	});

	it("supports a regex segment with no trailing flags followed by more segments", () => {
		expect(
			NamePathMatcher.for("MyClass//^get/x/getValue")
				.withRegexSegments()
				.build()
				.matchesPath("MyClass/getValue/x/getValue").matched,
		).toBe(true);
	});

	it("treats consecutive separators in a pattern as a single boundary", () => {
		expect(
			new NamePathMatcher("MyClass//getValue").matchesPath("MyClass/getValue")
				.matched,
		).toBe(true);
	});

	it("throws when the pattern is an empty string", () => {
		expect(() => new NamePathMatcher("")).toThrow(
			"namePathPattern must not be empty",
		);
	});

	it("fails to match when the symbol path is shorter than the pattern", () => {
		const result = new NamePathMatcher("Outer/MyClass/getValue").matchesPath(
			"getValue",
		);
		expect(result.matched).toBe(false);
		expect(result.reason).toContain("symbol path is shorter");
	});

	it("parses an overload index suffix on the matched path itself", () => {
		expect(
			new NamePathMatcher("MyClass/getValue[1]").matchesPath(
				"MyClass/getValue[1]",
			).matched,
		).toBe(true);
	});

	it("treats a non-numeric bracket suffix on the matched path as a literal name", () => {
		expect(
			new NamePathMatcher("MyClass/getValue[abc]").matchesPath(
				"MyClass/getValue[abc]",
			).matched,
		).toBe(true);
	});

	it("exposes expression, isAbsolute, segmentCount, and toString", () => {
		const matcher = new NamePathMatcher("/MyClass/getValue");
		expect(matcher.expression).toBe("/MyClass/getValue");
		expect(matcher.isAbsolute).toBe(true);
		expect(matcher.segmentCount).toBe(2);
		expect(matcher.toString()).toBe("NamePathMatcher(/MyClass/getValue)");
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
