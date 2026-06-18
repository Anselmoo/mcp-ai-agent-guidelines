import { describe, expect, it } from "vitest";
import {
	parseEnvelopeBlock,
	toToolResult,
} from "../../../tools/shared/output-envelope.js";

describe("output envelope", () => {
	it("round-trips payload through the envelope text block", () => {
		const result = toToolResult({
			summaryMarkdown: "# Hello",
			payload: { recommendations: [{ id: "r1" }] },
			meta: {
				tool: "evidence-research",
				ts: "2026-06-17T00:00:00Z",
				version: 1,
			},
		});
		expect(result.content[0].text).toBe("# Hello");
		expect(result.content[1].text).toMatch(/^__ENVELOPE_V1__:/);
		const parsed = parseEnvelopeBlock(result.content[1].text);
		expect(parsed.payload).toEqual({ recommendations: [{ id: "r1" }] });
		expect(parsed.meta.tool).toBe("evidence-research");
	});
});
