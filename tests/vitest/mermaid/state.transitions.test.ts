import { expect, test } from "vitest";
import { StateHandler } from "../../../src/tools/mermaid/handlers/state.handler.js";

test("State handler extracts states and transitions and final state mapping", () => {
	const h = new StateHandler();
	const description =
		"Idle to Processing when start. Processing to Complete on finish.";
	const diagram = h.generate(description);
	expect(diagram).toContain("[*] --> Idle");
	expect(diagram).toContain("Idle --> Processing");
	expect(diagram).toContain("Processing --> Complete");
	expect(diagram).toContain("Complete --> [*]");
});
