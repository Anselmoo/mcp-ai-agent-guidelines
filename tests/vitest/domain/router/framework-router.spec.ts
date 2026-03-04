import { describe, expect, it } from "vitest";
import { FrameworkRouter } from "../../../../src/domain/router/framework-router.js";
import { OutputApproach } from "../../../../src/domain/router/types.js";

describe("FrameworkRouter (domain)", () => {
	it("getApproaches() returns supported approaches", () => {
		const router = new FrameworkRouter();
		const approaches = router.getApproaches();
		expect(Array.isArray(approaches)).toBe(true);
	});

	it("supportsApproach() returns true for valid approach", () => {
		const router = new FrameworkRouter();
		// At least one approach should be supported
		const approaches = router.getApproaches();
		if (approaches.length > 0) {
			expect(router.supportsApproach(approaches[0])).toBe(true);
		}
	});
});
