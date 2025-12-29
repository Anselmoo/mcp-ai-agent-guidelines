import { describe, expect, it } from "vitest";
import { StateHandler } from "../../../src/tools/mermaid/handlers/state.handler.js";

const handler = new StateHandler();

describe("StateHandler branches", () => {
	it("parses states and transitions with 'to' pattern and final state handling", () => {
		const desc =
			"The system moves from idle to processing. Processing to complete.";
		const out = handler.generate(desc);
		expect(out).toMatch(/\[\*\] --> Idle/);
		expect(out).toMatch(/Idle --> Processing/);
		expect(out).toMatch(/Processing --> Complete/);
		expect(out).toMatch(/Complete --> \[\*\]/);
	});

	it("fallback template when no recognizable states", () => {
		const out = handler.generate("nothing here");
		expect(out).toMatch(/\[\*\] --> Idle/);
	});
});
