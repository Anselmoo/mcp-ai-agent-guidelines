import { describe, expect, it, vi } from "vitest";
import type { Sampler } from "../../contracts/runtime.js";
import { attachSamplerCapability } from "../../runtime/attach-sampler.js";

function fakeServer(caps: unknown) {
	return {
		getClientCapabilities: () => caps,
		createMessage: vi.fn().mockResolvedValue({
			content: { type: "text", text: "x" },
			model: "claude",
			role: "assistant",
		}),
	} as never;
}

describe("attachSamplerCapability", () => {
	it("attaches a sampler when the client advertises sampling", () => {
		const runtime: { sampler?: Sampler; clientSupportsSampling?: boolean } = {};
		attachSamplerCapability(runtime, fakeServer({ sampling: {} }));
		expect(runtime.clientSupportsSampling).toBe(true);
		expect(typeof runtime.sampler).toBe("function");
	});

	it("leaves sampler undefined when the client lacks sampling", () => {
		const runtime: { sampler?: Sampler; clientSupportsSampling?: boolean } = {};
		attachSamplerCapability(runtime, fakeServer({ roots: {} }));
		expect(runtime.clientSupportsSampling).toBe(false);
		expect(runtime.sampler).toBeUndefined();
	});

	it("treats absent capabilities as no sampling", () => {
		const runtime: { sampler?: Sampler; clientSupportsSampling?: boolean } = {};
		attachSamplerCapability(runtime, fakeServer(undefined));
		expect(runtime.clientSupportsSampling).toBe(false);
		expect(runtime.sampler).toBeUndefined();
	});
});
