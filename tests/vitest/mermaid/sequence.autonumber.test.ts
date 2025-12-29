import { expect, test } from "vitest";
import { SequenceHandler } from "../../../src/tools/mermaid/handlers/sequence.handler.js";

test("Sequence handler extracts participants and interactions and supports autonumber", () => {
	const h = new SequenceHandler();
	const description =
		"User sends request to System. System responds with data.";
	const diagram = h.generate(description, undefined, { autonumber: true });
	expect(diagram).toContain("autonumber");
	expect(diagram).toContain("participant A as User");
	expect(diagram).toContain("participant B as System");
	expect(diagram).toMatch(/A->>B: /);
	expect(diagram).toMatch(/B-->>A: /);
});
