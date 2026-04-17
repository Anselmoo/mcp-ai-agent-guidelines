import { describe, expect, it } from "vitest";
import {
	toonToMarkdown,
	valueToMarkdown,
} from "../../snapshots/toon_markdown.js";

// ─── valueToMarkdown ──────────────────────────────────────────────────────────

describe("valueToMarkdown — null / undefined", () => {
	it("renders null as _null_", () => {
		expect(valueToMarkdown(null)).toBe("_null_\n");
	});

	it("renders undefined as _null_", () => {
		expect(valueToMarkdown(undefined)).toBe("_null_\n");
	});
});

describe("valueToMarkdown — scalars", () => {
	it("renders a string directly", () => {
		expect(valueToMarkdown("hello")).toBe("hello\n");
	});

	it("renders a number as string", () => {
		expect(valueToMarkdown(42)).toBe("42\n");
	});

	it("renders a boolean as string", () => {
		expect(valueToMarkdown(true)).toBe("true\n");
	});
});

describe("valueToMarkdown — empty array", () => {
	it("renders _empty list_", () => {
		expect(valueToMarkdown([])).toBe("_empty list_\n");
	});
});

describe("valueToMarkdown — array of scalars", () => {
	it("renders bullet list", () => {
		const result = valueToMarkdown(["a", "b", "c"]);
		expect(result).toBe("- a\n- b\n- c\n");
	});

	it("renders null items in list as _null_", () => {
		const result = valueToMarkdown([null]);
		expect(result).toContain("_null_");
	});
});

describe("valueToMarkdown — array of objects (table)", () => {
	it("renders a markdown table with header + separator + rows", () => {
		const result = valueToMarkdown([
			{ name: "Alice", age: 30 },
			{ name: "Bob", age: 25 },
		]);
		expect(result).toContain("| name | age |");
		expect(result).toContain("| --- | --- |");
		expect(result).toContain("| Alice | 30 |");
		expect(result).toContain("| Bob | 25 |");
	});

	it("collects all keys across rows (union)", () => {
		const result = valueToMarkdown([{ a: 1 }, { a: 2, b: "extra" }]);
		expect(result).toContain("| a | b |");
	});

	it("escapes pipe characters in cells", () => {
		const result = valueToMarkdown([{ text: "a|b" }]);
		expect(result).toContain("a\\|b");
	});

	it("escapes newlines in cells with <br />", () => {
		const result = valueToMarkdown([{ text: "line1\nline2" }]);
		expect(result).toContain("<br />");
	});

	it("fills missing keys with empty string", () => {
		const result = valueToMarkdown([{ a: 1 }, { b: 2 }]);
		// row with missing 'a' should have empty cell
		expect(result).toContain("| 2 |");
	});
});

describe("valueToMarkdown — plain object", () => {
	it("renders scalar properties as bold key: value", () => {
		const result = valueToMarkdown({ name: "test", count: 3 });
		expect(result).toContain("**name:** test");
		expect(result).toContain("**count:** 3");
	});

	it("renders null scalar value as _null_", () => {
		const result = valueToMarkdown({ x: null });
		expect(result).toContain("**x:** _null_");
	});

	it("renders nested object with heading", () => {
		const result = valueToMarkdown({ nested: { a: 1 } });
		expect(result).toContain("## nested");
		expect(result).toContain("**a:** 1");
	});

	it("increases heading depth for deeper nesting", () => {
		const result = valueToMarkdown({ outer: { inner: { deep: 1 } } }, 2);
		expect(result).toContain("## outer");
		expect(result).toContain("### inner");
	});
});

// ─── toonToMarkdown ───────────────────────────────────────────────────────────

describe("toonToMarkdown", () => {
	it("decodes a simple toon string and converts to markdown", () => {
		// toon format: 'key: value' (not TOML)
		const toon = "status: ok";
		const result = toonToMarkdown(toon);
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("prepends title heading when provided", () => {
		const toon = "status: ok";
		const result = toonToMarkdown(toon, "My Title");
		expect(result.startsWith("# My Title\n")).toBe(true);
	});

	it("does not prepend heading when title is omitted", () => {
		const toon = "status: ok";
		const result = toonToMarkdown(toon);
		expect(result.startsWith("# ")).toBe(false);
	});

	it("always ends with exactly one newline", () => {
		const toon = "status: ok";
		const result = toonToMarkdown(toon, "T");
		expect(result.endsWith("\n")).toBe(true);
		expect(result.endsWith("\n\n")).toBe(false);
	});
});
