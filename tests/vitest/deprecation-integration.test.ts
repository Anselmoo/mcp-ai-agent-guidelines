import { beforeEach, describe, expect, it, vi } from "vitest";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder.js";
import { resetDeprecationWarnings } from "../../src/tools/shared/deprecation.js";
import { logger } from "../../src/tools/shared/logger.js";

describe("hierarchicalPromptBuilder - deprecation warning", () => {
	beforeEach(() => {
		resetDeprecationWarnings();
		vi.clearAllMocks();
	});

	it("emits deprecation warning on first call", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await hierarchicalPromptBuilder({
			context: "Test context",
			goal: "Test goal",
		});

		expect(warnSpy).toHaveBeenCalled();
		const firstCall = warnSpy.mock.calls.find(
			(call) =>
				typeof call[0] === "string" &&
				call[0].includes("hierarchical-prompt-builder"),
		);
		expect(firstCall).toBeDefined();
		expect(firstCall?.[0]).toContain("deprecated since v0.14.0");
		expect(firstCall?.[0]).toContain('Use "prompt-hierarchy" instead');
		expect(firstCall?.[0]).toContain("Will be removed in v0.15.0");
	});

	it("does not emit deprecation warning on subsequent calls", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		// First call
		await hierarchicalPromptBuilder({
			context: "Test context",
			goal: "Test goal",
		});

		// Clear the spy to count only subsequent calls
		warnSpy.mockClear();

		// Second call
		await hierarchicalPromptBuilder({
			context: "Test context 2",
			goal: "Test goal 2",
		});

		// Should not have any deprecation warnings
		const deprecationWarnings = warnSpy.mock.calls.filter(
			(call) =>
				typeof call[0] === "string" &&
				call[0].includes("hierarchical-prompt-builder"),
		);
		expect(deprecationWarnings).toHaveLength(0);
	});
});
