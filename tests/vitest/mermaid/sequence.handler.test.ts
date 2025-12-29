import { describe, expect, it } from "vitest";
import { SequenceHandler } from "../../../src/tools/mermaid/handlers/sequence.handler.js";

describe("SequenceHandler", () => {
	const handler = new SequenceHandler();

	it("returns fallback template when no interactions parsed", () => {
		const out = handler.generate("This text mentions nothing relevant");
		expect(out).toContain("participant U as User");
		expect(out).toContain("U->>S: Request");
	});

	it("parses participants and interactions and includes theme", () => {
		const desc = "User sends a request to System. System responds with data.";
		const out = handler.generate(desc, "dark");
		expect(out.startsWith("%%{init: {'theme':'dark'}}%%")).toBe(true);
		// should include at least two participants and two interactions
		expect(out).toMatch(/participant [A-Z] as User/);
		expect(out).toMatch(/participant [A-Z] as System/);
		expect(out).toMatch(/->>/);
		expect(out).toMatch(/-->>/);
	});

	it("inserts autonumber when advancedFeatures.autonumber=true", () => {
		const desc = "User sends a request to System";
		const out = handler.generate(desc, undefined, { autonumber: true });
		// 'autonumber' should appear on its own line near the header
		expect(out).toContain("autonumber");
	});

	it("parses interactions using 'to' pattern and 'responds' pattern", () => {
		const desc =
			"User sends a request to System. System responds with data. Client to Server sends payload.";
		const out = handler.generate(desc);
		// Should contain multiple interactions and at least one '->>' and one '-->>'
		expect((out.match(/->>/g) || []).length).toBeGreaterThanOrEqual(1);
		expect((out.match(/-->>/g) || []).length).toBeGreaterThanOrEqual(1);
		expect(out).toMatch(/participant [A-Z] as Client/);
		expect(out).toMatch(/participant [A-Z] as Server/);
	});
});
