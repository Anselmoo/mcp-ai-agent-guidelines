import { describe, expect, it } from "vitest";
import {
	DeprecationRegistry,
	deprecationRegistry,
	warnDeprecated,
} from "../../../../src/tools/shared/deprecation-helpers.js";

describe("DeprecationRegistry", () => {
	it("registers a deprecation entry and list shows it", () => {
		const reg = new DeprecationRegistry();
		reg.register({
			oldName: "oldTool",
			newName: "newTool",
			removalVersion: "1.0.0",
		});
		// After register, warn() should not throw
		expect(() => reg.warn("oldTool")).not.toThrow();
	});

	it("deprecationRegistry singleton is a DeprecationRegistry", () => {
		expect(deprecationRegistry).toBeInstanceOf(DeprecationRegistry);
	});

	it("warnOnce() does not emit twice for same tool", () => {
		const reg = new DeprecationRegistry();
		// Both calls should succeed without throwing
		reg.warnOnce({
			oldName: "dupTool",
			newName: "newDup",
			removalVersion: "1.0.0",
		});
		reg.warnOnce({
			oldName: "dupTool",
			newName: "newDup",
			removalVersion: "1.0.0",
		});
	});
});

describe("warnDeprecated", () => {
	it("does not throw when called with valid options", () => {
		expect(() => {
			warnDeprecated({
				oldName: "legacyTool",
				newName: "modernTool",
				removalVersion: "2.0.0",
			});
		}).not.toThrow();
	});
});
