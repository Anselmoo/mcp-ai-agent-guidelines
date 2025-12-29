import { describe, expect, it } from "vitest";
import { ClassHandler } from "../../../src/tools/mermaid/handlers/class.handler.js";

const handler = new ClassHandler();

describe("ClassHandler branches", () => {
	it("parses properties and relationships with 'has' pattern", () => {
		const desc = "Product has Order and Order has Item";
		const out = handler.generate(desc);
		// Should include defined classes
		expect(out).toMatch(/class Product/);
		expect(out).toMatch(/class Order/);
		// Relationship should indicate 'has'
		expect(out).toMatch(/Product --> Order : has/);
	});

	it("parses methods when 'can' present and falls back when no classes", () => {
		const descWithMethod = "User can login and logout";
		const out = handler.generate(descWithMethod);
		expect(out).toMatch(/class User/);
		expect(out).toMatch(/\+process\(\)/);

		// fallback (no class words)
		const fallback = handler.generate("no classes here");
		expect(fallback).toMatch(/class User \{/);
	});

	it("handles explicit capitalized class names and empty property/method lists", () => {
		const out = handler.generate("FooBar BazQux uses AnotherThing");
		expect(out).toMatch(/class FooBar/);
		expect(out).toMatch(/class BazQux/);
	});
});
