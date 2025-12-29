import { describe, expect, it } from "vitest";
import { parseLCOV } from "../../../scripts/coverage-patch.mjs";

describe("branch coverage diagnostics", () => {
	it("computes per-file branch totals and missing lines", () => {
		const lcov = `SF:src/a.js
BRDA:10,0,0,1
BRDA:11,0,0,0
SF:src/b.js
BRDA:2,0,0,1
`;
		const parsed = parseLCOV(lcov);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const p = parsed as unknown as Record<string, any>;
		expect(Object.keys(p)).toContain("src/a.js");
		expect(Object.keys(p)).toContain("src/b.js");
		// src/a.js: two branch entries (1 covered, 1 uncovered)
		const plain = JSON.parse(JSON.stringify(parsed));
		expect(plain["src/a.js"].branches["10"]).toEqual([1]);
		expect(plain["src/a.js"].branches["11"]).toEqual([0]);
		// src/b.js: one branch entry covered
		expect(plain["src/b.js"].branches["2"]).toEqual([1]);
	});
});
