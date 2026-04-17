import { describe, expect, it } from "vitest";
import {
	DocumentSymbolsCacheEntrySchema,
	DocumentSymbolsCacheSchema,
	LocationSchema,
	PersistedUnifiedSymbolSchema,
	PositionSchema,
	RangeSchema,
	RawCacheEntrySchema,
	RawDocumentSymbolSchema,
	RawDocumentSymbolsCacheSchema,
	RawLspSymbolSchema,
	RawSymbolInformationSchema,
} from "../../snapshots/schemas.js";

// ─── Primitives ───────────────────────────────────────────────────────────────

describe("PositionSchema", () => {
	it("accepts valid line/character", () => {
		const result = PositionSchema.safeParse({ line: 0, character: 5 });
		expect(result.success).toBe(true);
	});

	it("rejects negative line", () => {
		expect(PositionSchema.safeParse({ line: -1, character: 0 }).success).toBe(
			false,
		);
	});

	it("rejects non-integer character", () => {
		expect(PositionSchema.safeParse({ line: 0, character: 1.5 }).success).toBe(
			false,
		);
	});
});

describe("RangeSchema", () => {
	const validRange = {
		start: { line: 0, character: 0 },
		end: { line: 1, character: 5 },
	};

	it("accepts a valid range", () => {
		expect(RangeSchema.safeParse(validRange).success).toBe(true);
	});

	it("rejects missing end", () => {
		expect(
			RangeSchema.safeParse({ start: { line: 0, character: 0 } }).success,
		).toBe(false);
	});
});

describe("LocationSchema", () => {
	const validLocation = {
		uri: "file:///repo/foo.ts",
		range: {
			start: { line: 0, character: 0 },
			end: { line: 5, character: 1 },
		},
		absolutePath: "/repo/foo.ts",
		relativePath: "foo.ts",
	};

	it("accepts a valid location", () => {
		expect(LocationSchema.safeParse(validLocation).success).toBe(true);
	});

	it("accepts null relativePath", () => {
		expect(
			LocationSchema.safeParse({ ...validLocation, relativePath: null })
				.success,
		).toBe(true);
	});

	it("rejects missing absolutePath", () => {
		const { absolutePath: _, ...withoutAbsPath } = validLocation;
		expect(LocationSchema.safeParse(withoutAbsPath).success).toBe(false);
	});
});

// ─── RawDocumentSymbolSchema ──────────────────────────────────────────────────

const minimalDocSymbol = {
	name: "MyClass",
	kind: 5,
	range: { start: { line: 0, character: 0 }, end: { line: 10, character: 1 } },
	selectionRange: {
		start: { line: 0, character: 6 },
		end: { line: 0, character: 13 },
	},
};

describe("RawDocumentSymbolSchema", () => {
	it("accepts a minimal doc symbol", () => {
		expect(RawDocumentSymbolSchema.safeParse(minimalDocSymbol).success).toBe(
			true,
		);
	});

	it("accepts optional fields (detail, tags, deprecated)", () => {
		const result = RawDocumentSymbolSchema.safeParse({
			...minimalDocSymbol,
			detail: "class description",
			tags: [1],
			deprecated: false,
		});
		expect(result.success).toBe(true);
	});

	it("parses recursively nested children", () => {
		const withChildren = {
			...minimalDocSymbol,
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
		};
		const result = RawDocumentSymbolSchema.safeParse(withChildren);
		expect(result.success).toBe(true);
	});

	it("rejects missing name", () => {
		const { name: _, ...noName } = minimalDocSymbol;
		expect(RawDocumentSymbolSchema.safeParse(noName).success).toBe(false);
	});
});

// ─── RawSymbolInformationSchema ───────────────────────────────────────────────

describe("RawSymbolInformationSchema", () => {
	const validSymInfo = {
		name: "myFunc",
		kind: 12,
		location: {
			uri: "file:///repo/foo.ts",
			range: {
				start: { line: 5, character: 0 },
				end: { line: 8, character: 1 },
			},
		},
	};

	it("accepts a minimal symbol information", () => {
		expect(RawSymbolInformationSchema.safeParse(validSymInfo).success).toBe(
			true,
		);
	});

	it("accepts optional containerName", () => {
		expect(
			RawSymbolInformationSchema.safeParse({
				...validSymInfo,
				containerName: "MyClass",
			}).success,
		).toBe(true);
	});

	it("rejects missing location", () => {
		const { location: _, ...noLoc } = validSymInfo;
		expect(RawSymbolInformationSchema.safeParse(noLoc).success).toBe(false);
	});
});

// ─── RawLspSymbolSchema (union) ───────────────────────────────────────────────

describe("RawLspSymbolSchema", () => {
	it("accepts a DocumentSymbol (has selectionRange)", () => {
		expect(RawLspSymbolSchema.safeParse(minimalDocSymbol).success).toBe(true);
	});

	it("accepts a SymbolInformation (has location.uri)", () => {
		const symInfo = {
			name: "fn",
			kind: 12,
			location: {
				uri: "file:///repo/foo.ts",
				range: {
					start: { line: 0, character: 0 },
					end: { line: 2, character: 1 },
				},
			},
		};
		expect(RawLspSymbolSchema.safeParse(symInfo).success).toBe(true);
	});
});

// ─── RawCacheEntrySchema ──────────────────────────────────────────────────────

describe("RawCacheEntrySchema", () => {
	it("accepts [hash, null] for missing symbols", () => {
		expect(RawCacheEntrySchema.safeParse(["abc123", null]).success).toBe(true);
	});

	it("accepts [hash, [symbols]] for populated cache", () => {
		const entry = ["abc123", [minimalDocSymbol]];
		expect(RawCacheEntrySchema.safeParse(entry).success).toBe(true);
	});

	it("rejects non-tuple (object)", () => {
		expect(
			RawCacheEntrySchema.safeParse({ hash: "abc", symbols: [] }).success,
		).toBe(false);
	});
});

// ─── RawDocumentSymbolsCacheSchema ────────────────────────────────────────────

describe("RawDocumentSymbolsCacheSchema", () => {
	it("accepts a valid dict of file → cache entries", () => {
		const cache = {
			"src/foo.ts": ["hash1", [minimalDocSymbol]],
			"src/bar.ts": ["hash2", null],
		};
		expect(RawDocumentSymbolsCacheSchema.safeParse(cache).success).toBe(true);
	});

	it("accepts empty object", () => {
		expect(RawDocumentSymbolsCacheSchema.safeParse({}).success).toBe(true);
	});
});

// ─── PersistedUnifiedSymbolSchema ─────────────────────────────────────────────

const minimalPersisted = {
	name: "Foo",
	kind: 5,
	location: {
		uri: "file:///foo.ts",
		range: { start: { line: 0, character: 0 }, end: { line: 5, character: 1 } },
		absolutePath: "/foo.ts",
		relativePath: "foo.ts",
	},
	children: [],
};

describe("PersistedUnifiedSymbolSchema", () => {
	it("accepts a minimal persisted symbol", () => {
		expect(
			PersistedUnifiedSymbolSchema.safeParse(minimalPersisted).success,
		).toBe(true);
	});

	it("accepts optional fields", () => {
		const withOptionals = {
			...minimalPersisted,
			detail: "a class",
			tags: [1],
			containerName: "Outer",
			deprecated: false,
			overload_idx: 0,
		};
		expect(PersistedUnifiedSymbolSchema.safeParse(withOptionals).success).toBe(
			true,
		);
	});

	it("parses recursively nested children", () => {
		const withChildren = {
			...minimalPersisted,
			children: [{ ...minimalPersisted, name: "child", children: [] }],
		};
		const result = PersistedUnifiedSymbolSchema.safeParse(withChildren);
		expect(result.success).toBe(true);
	});

	it("rejects missing children array", () => {
		const { children: _, ...noChildren } = minimalPersisted;
		expect(PersistedUnifiedSymbolSchema.safeParse(noChildren).success).toBe(
			false,
		);
	});

	it("rejects negative overload_idx", () => {
		expect(
			PersistedUnifiedSymbolSchema.safeParse({
				...minimalPersisted,
				overload_idx: -1,
			}).success,
		).toBe(false);
	});
});

// ─── DocumentSymbolsCacheEntrySchema ─────────────────────────────────────────

describe("DocumentSymbolsCacheEntrySchema", () => {
	it("accepts [hash, [symbols]]", () => {
		const entry = ["deadbeef", [minimalPersisted]];
		expect(DocumentSymbolsCacheEntrySchema.safeParse(entry).success).toBe(true);
	});

	it("accepts [hash, []] for empty file", () => {
		expect(
			DocumentSymbolsCacheEntrySchema.safeParse(["hash", []]).success,
		).toBe(true);
	});
});

// ─── DocumentSymbolsCacheSchema ───────────────────────────────────────────────

describe("DocumentSymbolsCacheSchema", () => {
	it("accepts a valid cache dict", () => {
		const cache = {
			"src/foo.ts": ["hash1", [minimalPersisted]],
			"src/bar.ts": ["hash2", []],
		};
		expect(DocumentSymbolsCacheSchema.safeParse(cache).success).toBe(true);
	});

	it("accepts empty dict", () => {
		expect(DocumentSymbolsCacheSchema.safeParse({}).success).toBe(true);
	});
});
