import { describe, expect, it } from "vitest";
import { ERHandler } from "../../../src/tools/mermaid/handlers/er.handler.js";

describe("ERHandler", () => {
	const handler = new ERHandler();

	it("returns fallback template when no relationships found", () => {
		const out = handler.generate("no ER here");
		expect(out).toContain("CUSTOMER ||--o{ ORDER : places");
	});

	it("parses 'has' relationship between capitalized entities", () => {
		const out = handler.generate("Customer has Order");
		expect(out).toMatch(/CUSTOMER \|\|--o\{ ORDER : has/);
	});

	it("parses 'belongs to' relationship with correct symbol and label", () => {
		const out = handler.generate("Item belongs to Order");
		expect(out).toMatch(/ITEM }o--\|\| ORDER : "belongs to"/);
	});

	it("includes theme when provided", () => {
		const out = handler.generate("Customer has Order", "neutral");
		expect(out.startsWith("%%{init: {'theme':'neutral'}}%%")).toBe(true);
	});
});
