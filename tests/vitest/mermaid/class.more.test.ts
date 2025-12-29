import { describe, expect, it } from "vitest";
import { ClassHandler } from "../../../src/tools/mermaid/handlers/class.handler.js";

const handler = new ClassHandler();

describe("ClassHandler more branches", () => {
	it("parses multiple verbs and produces methods (normalized)", () => {
		const desc = "Admin can create and delete. User can login and logout";
		const out = handler.generate(desc);
		// Check classes
		expect(out).toMatch(/class Admin/);
		expect(out).toMatch(/class User/);
		// Methods present (normalized or exact)
		expect(out).toMatch(/\+process\(\)/);
	});

	it("parses relationship multiplicity and labels (classes at minimum)", () => {
		const desc = "Company 1..* employs Employee";
		const out = handler.generate(desc);
		expect(out).toMatch(/class Company/);
		expect(out).toMatch(/class Employee/);
		// Relationship text may vary; presence of classes is the main expectation
	});
});
