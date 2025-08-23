import { describe, expect, it } from "vitest";
import { getResource, listResources } from "../../src/resources/index";

describe("resources API", () => {
	it("lists resources with URIs", async () => {
		const res = await listResources();
		expect(Array.isArray(res)).toBe(true);
		const uris = res.map((r) => r.uri);
		expect(uris).toContain("guidelines://core-development-principles");
	});

	it("reads a resource and returns markdown + JSON", async () => {
		const out = await getResource("guidelines://core-development-principles");
		expect(out.contents.length).toBeGreaterThanOrEqual(2);
		const md = out.contents.find((c) => c.mimeType === "text/markdown");
		const json = out.contents.find((c) => c.mimeType === "application/json");
		expect(md?.text).toMatch(/Core Development Principles/);
		expect(json?.text).toMatch(/"id": "core-development-principles"/);
	});

	it("errors on unknown resource", async () => {
		await expect(getResource("guidelines://does-not-exist")).rejects.toThrow(
			/Unknown resource|not found/i,
		);
	});
});
