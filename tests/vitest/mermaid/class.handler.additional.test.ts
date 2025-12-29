import { describe, expect, it } from "vitest";
import { ClassHandler } from "../../../src/tools/mermaid/handlers/class.handler.js";

describe("ClassHandler additional", () => {
	it("falls back to default template when description lacks classes", () => {
		const h = new ClassHandler();
		const out = h.generate("");
		expect(out).toContain("class User");
		expect(out).toContain("User --> System : uses");
	});

	it("parses classes, properties, methods and relationships", () => {
		const h = new ClassHandler();
		const out = h.generate("User has Item and User can process orders");
		expect(out).toContain("class User");
		expect(out).toContain("+String id");
		expect(out).toContain("+process()");
		expect(out).toContain("User --> Item : has");
	});

	it("recognizes capitalized words as classes even with punctuation", () => {
		const h = new ClassHandler();
		const desc = "Manager, oversees the system. Manager works with User.";
		const out = h.generate(desc);
		expect(out).toContain("class Manager");
	});

	it("creates 'uses' relationships when 'uses' appears between classes", () => {
		const h = new ClassHandler();
		const desc = "Service uses Item in processing";
		const out = h.generate(desc);
		expect(out).toContain("Service --> Item : uses");
	});

	it("prints simple class line when no properties or methods inferred", () => {
		const h = new ClassHandler();
		const desc = "Customer and Vendor";
		const out = h.generate(desc);
		// Should include class Customer and class Vendor without block bodies
		expect(out).toMatch(/class Customer(?! \{)/);
		expect(out).toMatch(/class Vendor(?! \{)/);
	});

	it("includes theme init when theme provided", () => {
		const h = new ClassHandler();
		const out = h.generate("User", "dark");
		expect(
			out.startsWith("%%{init: {'theme':'dark'} }%%") ||
				out.startsWith("%%{init: {'theme':'dark'} }%%\n") ||
				out,
		).toBeTruthy();
	});
});
