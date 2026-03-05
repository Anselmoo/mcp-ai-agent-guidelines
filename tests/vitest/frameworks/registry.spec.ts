import { beforeEach, describe, expect, it } from "vitest";
import { FrameworkRouter } from "../../../src/frameworks/registry.js";

describe("FrameworkRouter", () => {
	let router: FrameworkRouter;

	beforeEach(() => {
		router = new FrameworkRouter();
	});

	it("registers and retrieves a framework", () => {
		const fw = {
			name: "test",
			description: "Test",
			version: "1.0.0",
			actions: ["run"],
			schema: {} as any,
			execute: async () => ({}),
		};
		router.register("test", fw);
		expect(router.get("test")).toBe(fw);
	});

	it("has() returns true for registered names", () => {
		const fw = {
			name: "x",
			description: "",
			version: "1.0.0",
			actions: [],
			schema: {} as any,
			execute: async () => ({}),
		};
		router.register("x", fw);
		expect(router.has("x")).toBe(true);
		expect(router.has("y")).toBe(false);
	});

	it("list() returns all registered names", () => {
		const fw = {
			name: "a",
			description: "",
			version: "1.0.0",
			actions: [],
			schema: {} as any,
			execute: async () => ({}),
		};
		router.register("a", fw);
		router.register("b", { ...fw, name: "b" });
		expect(router.list()).toContain("a");
		expect(router.list()).toContain("b");
	});

	it("get() throws for unknown framework", () => {
		expect(() => router.get("unknown")).toThrow("Unknown framework");
	});
});
