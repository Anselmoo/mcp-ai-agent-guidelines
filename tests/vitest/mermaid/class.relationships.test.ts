import { expect, test } from "vitest";
import { ClassHandler } from "../../../src/tools/mermaid/handlers/class.handler.js";

test("Class handler extracts relationships when description contains 'has' pattern", () => {
	const h = new ClassHandler();
	const diagram = h.generate("User has Account");
	expect(diagram).toContain("User --> Account : has");
});

test("Class handler falls back to default template when no classes detected", () => {
	const h = new ClassHandler();
	const diagram = h.generate("no classes here");
	// fallback template includes 'class User' by design
	expect(diagram).toContain("class User");
});
