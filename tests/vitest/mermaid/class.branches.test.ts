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

describe("ClassHandler additional branches", () => {
	it("adds properties when 'has' or 'contains' patterns present", () => {
		const outHas = handler.generate("Product has Item");
		expect(outHas).toMatch(/class Product/);
		expect(outHas).toMatch(/\+String id/);
		expect(outHas).toMatch(/\+String name/);
		expect(outHas).toMatch(/Product --> Item : has/);

		const outContains = handler.generate("Catalog contains Item");
		expect(outContains).toMatch(/class Catalog/);
		expect(outContains).toMatch(/\+String id/);
		expect(outContains).toMatch(/\+String name/);
	});

	it("creates 'uses' relationships for 'uses' and 'depends on'", () => {
		const out = handler.generate(
			"Service uses Manager and Manager depends on System",
		);
		expect(out).toMatch(/Service --> Manager : uses/);
		expect(out).toMatch(/Manager --> System : uses/);
	});

	it("deduplicates repeated class names and only emits class once", () => {
		const out = handler.generate("Order Order has Item Item");
		const matches = out.match(/class Order/g) || [];
		expect(matches.length).toBe(1);
	});

	it("adds common classes even when lowercased in description", () => {
		const out = handler.generate(
			"there is a product and a customer in the system",
		);
		expect(out).toMatch(/class Product/);
		expect(out).toMatch(/class Customer/);
	});

	it("omits braces when no properties or methods are found", () => {
		const out = handler.generate("Alpha Beta");
		// Should contain simple class declarations (no opening brace for those classes)
		expect(out).toMatch(/class Alpha\b(?! \{)/);
		expect(out).toMatch(/class Beta\b(?! \{)/);
	});

	it("includes theme init directive when theme parameter provided", () => {
		const out = handler.generate("Foo Bar", "dark");
		expect(out.split("\n")[0]).toContain("%%{init: {'theme':'dark'}}%%");
	});
});
