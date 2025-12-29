import { describe, expect, it } from "vitest";
import { ClassHandler } from "../../../src/tools/mermaid/handlers/class.handler.js";

describe("ClassHandler", () => {
	it("falls back to default template when description empty", () => {
		const h = new ClassHandler();
		const out = h.generate("");
		expect(out).toContain("class User {");
		expect(out).toContain("User --> System : uses");
	});

	it("parses class names and adds class blocks with properties/methods", () => {
		const h = new ClassHandler();
		const desc =
			"User has accounts and User can process payments. Order contains Item.";
		const out = h.generate(desc);
		// Should include class definitions for User, Order, Item
		expect(out).toContain("class User");
		expect(out).toContain("class Order");
		expect(out).toContain("class Item");
		// User should have properties and methods inferred
		expect(out).toContain("+String id");
		expect(out).toContain("+process()");
	});

	it("creates relationships when pattern like 'X has Y' appears", () => {
		const h = new ClassHandler();
		const desc = "User has Order and Order has Item";
		const out = h.generate(desc);
		expect(out).toContain("User --> Order : has");
		expect(out).toContain("Order --> Item : has");
	});

	it("prepends theme init when theme provided", () => {
		const h = new ClassHandler();
		const out = h.generate("User has Order", "forest");
		expect(out.startsWith("%%{init:")).toBe(true);
		expect(out).toContain("forest");
	});
});
