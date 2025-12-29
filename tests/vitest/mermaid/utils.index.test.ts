import { describe, expect, it } from "vitest";
import {
	getDirection,
	isValidDirection,
} from "../../../src/tools/mermaid/utils/direction.utils.js";

describe("direction.utils", () => {
	it("returns default TD when no direction provided", () => {
		expect(getDirection()).toBe("TD");
	});

	it("returns provided valid direction", () => {
		expect(getDirection("LR")).toBe("LR");
		expect(getDirection("RL")).toBe("RL");
	});

	it("falls back to default for invalid direction", () => {
		expect(getDirection("INVALID")).toBe("TD");
	});

	it("validates directions correctly", () => {
		expect(isValidDirection("LR")).toBe(true);
		expect(isValidDirection("TD")).toBe(true);
		expect(isValidDirection("INVALID")).toBe(false);
	});
});
