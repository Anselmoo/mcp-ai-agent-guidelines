import { describe, expect, it } from "vitest";
import {
	toonToMarkdown,
	valueToMarkdown,
} from "../../snapshots/toon_markdown.js";

describe("toon-to-markdown script", () => {
	it("renders primitive arrays as bullet lists", () => {
		expect(valueToMarkdown(["a", "b"])).toContain("- a");
		expect(valueToMarkdown(["a", "b"])).toContain("- b");
	});

	it("renders TOON object arrays as markdown tables", () => {
		const toon = `items[2]{sku,qty}:\n  A1,2\n  B2,1\n`;
		const markdown = toonToMarkdown(toon, "Inventory");

		expect(markdown).toContain("# Inventory");
		expect(markdown).toContain("| sku | qty |");
		expect(markdown).toContain("| A1 | 2 |");
	});
});
