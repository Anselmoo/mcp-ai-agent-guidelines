import { describe, expect, it } from "vitest";
import { getPal, setPal } from "../../../src/platform/index.js";
import { MockPAL } from "../../../src/platform/mock-pal.js";

describe("PAL singleton (index)", () => {
	it("getPal() returns current PAL instance", () => {
		const p = getPal();
		expect(p).toBeDefined();
	});

	it("setPal() allows injecting a MockPAL", () => {
		const mock = new MockPAL();
		setPal(mock);
		expect(getPal()).toBe(mock);
		// Reset to default
		setPal(undefined as any);
	});
});
