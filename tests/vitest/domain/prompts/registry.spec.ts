import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HierarchicalGenerator } from "../../../../src/domain/prompts/generators/hierarchical.js";
import { PromptRegistry } from "../../../../src/domain/prompts/registry.js";

describe("PromptRegistry", () => {
	beforeEach(() => {
		PromptRegistry.resetInstance();
	});

	afterEach(() => {
		PromptRegistry.resetInstance();
	});

	it("returns the same singleton instance", () => {
		const a = PromptRegistry.getInstance();
		const b = PromptRegistry.getInstance();
		expect(a).toBe(b);
	});

	it("resetInstance creates a new instance", () => {
		const a = PromptRegistry.getInstance();
		PromptRegistry.resetInstance();
		const b = PromptRegistry.getInstance();
		expect(a).not.toBe(b);
	});

	it("register and get a generator", () => {
		const reg = PromptRegistry.getInstance();
		reg.register("hierarchical", () => new HierarchicalGenerator());
		const gen = reg.get("hierarchical");
		expect(gen).toBeDefined();
		expect(gen?.domain).toBe("hierarchical");
	});

	it("lazy-instantiates generator only once", () => {
		const reg = PromptRegistry.getInstance();
		let calls = 0;
		reg.register("hierarchical", () => {
			calls++;
			return new HierarchicalGenerator();
		});
		const g1 = reg.get("hierarchical");
		const g2 = reg.get("hierarchical");
		expect(g1).toBe(g2);
		expect(calls).toBe(1);
	});

	it("has() returns true after registration", () => {
		const reg = PromptRegistry.getInstance();
		reg.register("hierarchical", () => new HierarchicalGenerator());
		expect(reg.has("hierarchical")).toBe(true);
		expect(reg.has("security")).toBe(false);
	});

	it("listDomains() returns all registered domains", () => {
		const reg = PromptRegistry.getInstance();
		reg.register("hierarchical", () => new HierarchicalGenerator());
		reg.register("security", () => new HierarchicalGenerator());
		expect(reg.listDomains()).toContain("hierarchical");
		expect(reg.listDomains()).toContain("security");
	});

	it("listGenerators() returns metadata", () => {
		const reg = PromptRegistry.getInstance();
		reg.register("hierarchical", () => new HierarchicalGenerator());
		const list = reg.listGenerators();
		expect(list[0].domain).toBe("hierarchical");
		expect(list[0].version).toBe("1.0.0");
	});

	it("get() returns undefined for unregistered domain", () => {
		const reg = PromptRegistry.getInstance();
		expect(reg.get("architecture")).toBeUndefined();
	});

	it("unregister removes a domain", () => {
		const reg = PromptRegistry.getInstance();
		reg.register("hierarchical", () => new HierarchicalGenerator());
		reg.unregister("hierarchical");
		expect(reg.has("hierarchical")).toBe(false);
	});
});
