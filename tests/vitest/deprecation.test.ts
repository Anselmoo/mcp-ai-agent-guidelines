import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	emitDeprecationWarning,
	resetDeprecationWarnings,
} from "../../src/tools/shared/deprecation.js";
import { logger } from "../../src/tools/shared/logger.js";

describe("emitDeprecationWarning", () => {
	beforeEach(() => {
		resetDeprecationWarnings();
		vi.clearAllMocks();
	});

	it("emits warning on first call", () => {
		const warnSpy = vi.spyOn(logger, "warn");

		emitDeprecationWarning({
			tool: "old-tool",
			replacement: "new-tool",
			deprecatedIn: "v0.14.0",
			removedIn: "v0.15.0",
		});

		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy).toHaveBeenCalledWith(
			'Tool "old-tool" is deprecated since v0.14.0. Use "new-tool" instead. Will be removed in v0.15.0.',
			{
				type: "deprecation",
				tool: "old-tool",
				replacement: "new-tool",
				deprecatedIn: "v0.14.0",
				removedIn: "v0.15.0",
			},
		);
	});

	it("does not emit warning on subsequent calls for same tool", () => {
		const warnSpy = vi.spyOn(logger, "warn");

		const options = {
			tool: "old-tool",
			replacement: "new-tool",
			deprecatedIn: "v0.14.0",
			removedIn: "v0.15.0",
		};

		emitDeprecationWarning(options);
		emitDeprecationWarning(options);
		emitDeprecationWarning(options);

		expect(warnSpy).toHaveBeenCalledOnce();
	});

	it("emits separate warnings for different tools", () => {
		const warnSpy = vi.spyOn(logger, "warn");

		emitDeprecationWarning({
			tool: "tool-a",
			replacement: "new-tool",
			deprecatedIn: "v0.14.0",
			removedIn: "v0.15.0",
		});

		emitDeprecationWarning({
			tool: "tool-b",
			replacement: "new-tool",
			deprecatedIn: "v0.14.0",
			removedIn: "v0.15.0",
		});

		expect(warnSpy).toHaveBeenCalledTimes(2);
	});

	it("includes all required fields in the warning context", () => {
		const warnSpy = vi.spyOn(logger, "warn");

		emitDeprecationWarning({
			tool: "test-tool",
			replacement: "replacement-tool",
			deprecatedIn: "v1.0.0",
			removedIn: "v2.0.0",
		});

		const callArgs = warnSpy.mock.calls[0];
		const context = callArgs[1];

		expect(context).toHaveProperty("type", "deprecation");
		expect(context).toHaveProperty("tool", "test-tool");
		expect(context).toHaveProperty("replacement", "replacement-tool");
		expect(context).toHaveProperty("deprecatedIn", "v1.0.0");
		expect(context).toHaveProperty("removedIn", "v2.0.0");
	});
});

describe("resetDeprecationWarnings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("allows warnings to be emitted again after reset", () => {
		const warnSpy = vi.spyOn(logger, "warn");

		const options = {
			tool: "old-tool",
			replacement: "new-tool",
			deprecatedIn: "v0.14.0",
			removedIn: "v0.15.0",
		};

		// First call
		emitDeprecationWarning(options);
		expect(warnSpy).toHaveBeenCalledOnce();

		// Second call without reset - no warning
		emitDeprecationWarning(options);
		expect(warnSpy).toHaveBeenCalledOnce();

		// Reset
		resetDeprecationWarnings();

		// Third call after reset - warning should emit
		emitDeprecationWarning(options);
		expect(warnSpy).toHaveBeenCalledTimes(2);
	});
});
