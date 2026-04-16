import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

describe("orchestration-config bootstrap", () => {
	afterEach(() => {
		process.env.NODE_ENV = ORIGINAL_NODE_ENV;
		vi.resetModules();
	});

	it("loads the orchestration config module in development mode", async () => {
		process.env.NODE_ENV = "development";
		vi.resetModules();

		await expect(
			import("../../config/orchestration-config.js"),
		).resolves.toBeDefined();
	});
});
