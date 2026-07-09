import { describe, expect, it } from "vitest";
import {
	aliasForPhysicalModelId,
	loadOrchestrationConfig,
} from "../../config/orchestration-config.js";

describe("aliasForPhysicalModelId", () => {
	it("maps a configured physical model id back to its role alias", () => {
		const config = loadOrchestrationConfig();
		const entries = Object.entries(config.models);
		expect(entries.length).toBeGreaterThan(0);
		const [alias, model] = entries[0];
		expect(aliasForPhysicalModelId(model.id)).toBe(alias);
	});

	it("returns null for an unknown physical model id", () => {
		expect(aliasForPhysicalModelId("no-such-model-xyz-123")).toBeNull();
	});
});
