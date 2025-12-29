import { describe, expect, it } from "vitest";
import { ClassHandler } from "../../../src/tools/mermaid/handlers/class.handler.js";

const handler = new ClassHandler();

describe("ClassHandler extra branches", () => {
	it("parses compound relationships and methods in one description", () => {
		const desc =
			"Order has Item and Item can be shipped. User can login and logout";
		const out = handler.generate(desc);
		// classes and relationship should be present
		expect(out).toMatch(/class Order/);
		expect(out).toMatch(/class Item/);
		expect(out).toMatch(/Order --> Item : has/);
		// method parsed for User should be present (normalised to generic process())
		expect(out).toMatch(/class User/);
		expect(out).toMatch(/\+process\(\)/);
	});
});
