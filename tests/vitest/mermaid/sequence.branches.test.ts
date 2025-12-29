import { describe, expect, it } from "vitest";
import { SequenceHandler } from "../../../src/tools/mermaid/handlers/sequence.handler.js";

const handler = new SequenceHandler();

describe("SequenceHandler branches", () => {
	it("parses participants and interactions and supports autonumber", () => {
		const desc = "User sends request to system. System responds with data.";
		const out = handler.generate(desc, undefined, { autonumber: true });
		// participants and interactions should be present
		expect(out).toMatch(/participant A as User/);
		expect(out).toMatch(/->>/);
		expect(out).toMatch(/autonumber/);
	});

	it("fallback template when no interactions", () => {
		const out = handler.generate("just random text with nothing");
		expect(out).toMatch(/participant U as User/);
		expect(out).toMatch(/Request/);
	});
});
