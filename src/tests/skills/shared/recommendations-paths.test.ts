import { describe, expect, it } from "vitest";
import { extractReferencedPaths } from "../../../skills/shared/recommendations.js";

describe("extractReferencedPaths", () => {
	it("extracts a path named in the request", () => {
		expect(
			extractReferencedPaths({
				request:
					"the test in src/tests/tools/tool-call-handler.test.ts is flaky",
			}),
		).toContain("src/tests/tools/tool-call-handler.test.ts");
	});

	it("extracts paths from context and dedupes against the request", () => {
		const paths = extractReferencedPaths({
			request: "review src/index.ts",
			context: "also src/index.ts and package.json",
		});
		expect(paths).toContain("src/index.ts");
		expect(paths).toContain("package.json");
		expect(paths.filter((p) => p === "src/index.ts")).toHaveLength(1);
	});

	it("returns [] when no paths are present", () => {
		expect(
			extractReferencedPaths({ request: "make it faster please" }),
		).toEqual([]);
	});
});
