import { describe, expect, it, vi } from "vitest";
import { PluginManager } from "../../../../src/domain/router/plugin-manager.js";
import type { CrossCuttingCapability } from "../../../../src/domain/router/types.js";

describe("PluginManager", () => {
	it("registers a plugin", () => {
		const pm = new PluginManager();
		const plugin = {
			name: "diagram" as CrossCuttingCapability,
			version: "1.0.0",
			execute: vi.fn().mockResolvedValue({ success: true, artifacts: {} }),
		};
		pm.register(plugin);
		const list = pm.list();
		expect(list.some((p) => p.name === "diagram")).toBe(true);
	});

	it("throws when registering duplicate plugin", () => {
		const pm = new PluginManager();
		const plugin = {
			name: "diagram" as CrossCuttingCapability,
			version: "1.0.0",
			execute: vi.fn(),
		};
		pm.register(plugin);
		expect(() => pm.register(plugin)).toThrow();
	});

	it("execute() returns result with executed list when plugin handles capability", async () => {
		const pm = new PluginManager();
		const plugin = {
			name: "diagram" as CrossCuttingCapability,
			version: "1.0.0",
			execute: vi.fn().mockResolvedValue({ success: true, artifacts: {} }),
		};
		pm.register(plugin);
		const result = await pm.execute(
			["diagram" as CrossCuttingCapability],
			{},
			{ approach: "chat", requestId: "req-1" },
		);
		expect(result.executed).toContain("diagram");
	});
});
