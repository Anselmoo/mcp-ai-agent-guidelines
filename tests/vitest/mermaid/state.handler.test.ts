import { describe, expect, it } from "vitest";
import { StateHandler } from "../../../src/tools/mermaid/handlers/state.handler.js";

describe("StateHandler", () => {
	const handler = new StateHandler();

	it("returns fallback template when no states parsed", () => {
		const out = handler.generate("No state words here");
		expect(out).toContain("[*] --> Idle");
		expect(out).toContain("Idle --> Processing : start");
	});

	it("parses states and transitions and includes triggers", () => {
		const desc =
			"Idle to Processing on start. Processing to Complete on finish.";
		const out = handler.generate(desc, "light");
		expect(out.startsWith("%%{init: {'theme':'light'}}%%")).toBe(true);
		expect(out).toMatch(/Idle --> Processing : /);
		expect(out).toMatch(/Processing --> Complete : /);
		expect(out).toContain("[*] --> Idle");
	});
});
