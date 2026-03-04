import { describe, expect, it } from "vitest";
import { StrategyRegistry } from "../../../../src/domain/router/strategy-registry.js";
import type { OutputApproach } from "../../../../src/domain/router/types.js";

describe("StrategyRegistry", () => {
	it("registers and retrieves a strategy via factory", () => {
		const reg = new StrategyRegistry();
		const mockStrategy = { run: async (i: unknown) => i as any };
		reg.register("chat" as OutputApproach, () => mockStrategy as any, {
			version: "1.0.0",
			description: "test",
		});
		const s = reg.get("chat" as OutputApproach);
		expect(s).toBe(mockStrategy);
	});

	it("list() returns registered strategy metadata", () => {
		const reg = new StrategyRegistry();
		reg.register(
			"chat" as OutputApproach,
			() => ({ run: async (i: unknown) => i as any }),
			{ version: "1.0.0", description: "chat" },
		);
		const list = reg.list();
		expect(list.some((e) => e.approach === "chat")).toBe(true);
	});

	it("getVersion() returns registered version", () => {
		const reg = new StrategyRegistry();
		reg.register(
			"adr" as OutputApproach,
			() => ({ run: async (i: unknown) => i as any }),
			{ version: "2.0.0", description: "adr" },
		);
		expect(reg.getVersion("adr" as OutputApproach)).toBe("2.0.0");
	});

	it("throws for unregistered approach", () => {
		const reg = new StrategyRegistry();
		expect(() => reg.get("rfc" as OutputApproach)).toThrow();
	});
});
