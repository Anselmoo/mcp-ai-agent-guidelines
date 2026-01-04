import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	emitDeprecationWarning,
	resetDeprecationWarnings,
} from "../../../../src/tools/shared/deprecation.js";
import { logger } from "../../../../src/tools/shared/logger.js";

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

	it("emits warnings for different tools independently", () => {
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

	it("resets warnings when resetDeprecationWarnings is called", () => {
		const warnSpy = vi.spyOn(logger, "warn");

		const options = {
			tool: "old-tool",
			replacement: "new-tool",
			deprecatedIn: "v0.14.0",
			removedIn: "v0.15.0",
		};

		emitDeprecationWarning(options);
		resetDeprecationWarnings();
		emitDeprecationWarning(options);

		expect(warnSpy).toHaveBeenCalledTimes(2);
	});

	it("includes all required information in the warning message", () => {
		const warnSpy = vi.spyOn(logger, "warn");

		emitDeprecationWarning({
			tool: "hierarchical-prompt-builder",
			replacement: "prompt-hierarchy",
			deprecatedIn: "v0.14.0",
			removedIn: "v0.15.0",
		});

		const call = warnSpy.mock.calls[0];
		const message = call[0];
		const context = call[1];

		expect(message).toContain("hierarchical-prompt-builder");
		expect(message).toContain("prompt-hierarchy");
		expect(message).toContain("v0.14.0");
		expect(message).toContain("v0.15.0");
		expect(message).toContain("deprecated");
		expect(message).toContain("removed");

		expect(context).toBeDefined();
		expect(context?.type).toBe("deprecation");
		expect(context?.tool).toBe("hierarchical-prompt-builder");
		expect(context?.replacement).toBe("prompt-hierarchy");
	});
});
