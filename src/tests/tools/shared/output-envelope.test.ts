import { describe, expect, it } from "vitest";
import {
	buildEnvelopeMeta,
	ENVELOPE_DEPRECATIONS,
	ENVELOPE_PREFIX,
	ENVELOPE_VERSION,
	type FieldDeprecation,
	parseEnvelopeBlock,
	toToolResult,
} from "../../../tools/shared/output-envelope.js";

describe("output envelope", () => {
	it("round-trips payload through the envelope text block", () => {
		const result = toToolResult({
			summaryMarkdown: "# Hello",
			payload: { recommendations: [{ id: "r1" }] },
			meta: buildEnvelopeMeta("evidence-research", "2026-06-17T00:00:00Z"),
		});
		expect(result.content[0].text).toBe("# Hello");
		expect(result.content[1].text).toMatch(/^__ENVELOPE_V1__:/);
		const parsed = parseEnvelopeBlock(result.content[1].text);
		expect(parsed.payload).toEqual({ recommendations: [{ id: "r1" }] });
		expect(parsed.meta.tool).toBe("evidence-research");
	});
});

describe("envelope versioning (ADR 0002)", () => {
	it("derives the prefix from the version constant", () => {
		expect(ENVELOPE_PREFIX).toBe(`__ENVELOPE_V${ENVELOPE_VERSION}__:`);
	});

	it("buildEnvelopeMeta stamps the current version", () => {
		const meta = buildEnvelopeMeta("code-review", "2026-07-04T00:00:00Z");
		expect(meta).toEqual({
			tool: "code-review",
			ts: "2026-07-04T00:00:00Z",
			version: ENVELOPE_VERSION,
		});
	});

	it("omits deprecations from meta while the registry is empty", () => {
		const meta = buildEnvelopeMeta("code-review", "2026-07-04T00:00:00Z");
		expect(meta).not.toHaveProperty("deprecations");
	});

	it("surfaces active deprecations in meta as a capability flag", () => {
		const sample: FieldDeprecation[] = [
			{
				field: "payload.situationMode",
				since: 1,
				removeInVersion: 2,
				replacement: "payload.mode",
				note: "always 'directive' once sampling was removed",
			},
		];
		const meta = buildEnvelopeMeta(
			"code-review",
			"2026-07-04T00:00:00Z",
			sample,
		);
		expect(meta.deprecations).toEqual(sample);

		// Round-trips so a consumer can read the heads-up before the field vanishes.
		const parsed = parseEnvelopeBlock(
			toToolResult({ summaryMarkdown: "x", payload: {}, meta }).content[1].text,
		);
		expect(parsed.meta.deprecations).toEqual(sample);
	});

	it("rejects an unsupported (future) envelope version explicitly", () => {
		const futureBlock = `__ENVELOPE_V2__:${Buffer.from(
			JSON.stringify({ payload: {}, meta: {} }),
			"utf8",
		).toString("base64")}`;
		expect(() => parseEnvelopeBlock(futureBlock)).toThrow(
			/unsupported envelope version 2/,
		);
	});

	it("rejects a non-envelope block", () => {
		expect(() => parseEnvelopeBlock("just some text")).toThrow(
			/not an envelope block/,
		);
	});

	it("preserves unknown payload fields (forward-compatible additive change)", () => {
		// Simulate a newer producer that added an optional field the current
		// parser doesn't know about. It must survive the round-trip untouched.
		const block = toToolResult({
			summaryMarkdown: "x",
			payload: { known: 1, futureOptionalField: { nested: true } },
			meta: buildEnvelopeMeta("system-design"),
		}).content[1].text;
		const parsed = parseEnvelopeBlock<{
			known: number;
			futureOptionalField: { nested: boolean };
		}>(block);
		expect(parsed.payload.futureOptionalField).toEqual({ nested: true });
	});

	it("registry invariant: no field is due for removal in the current version", () => {
		for (const entry of ENVELOPE_DEPRECATIONS) {
			expect(entry.removeInVersion).toBeGreaterThan(ENVELOPE_VERSION);
			expect(entry.removeInVersion).toBeGreaterThan(entry.since);
		}
	});
});
