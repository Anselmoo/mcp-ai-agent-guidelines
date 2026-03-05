import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DomainNeutralGenerator } from "../../../../src/domain/prompts/generators/domain-neutral.js";
import { HierarchicalGenerator } from "../../../../src/domain/prompts/generators/hierarchical.js";
import { PromptRegistry } from "../../../../src/domain/prompts/registry.js";
import { UnifiedPromptBuilder } from "../../../../src/domain/prompts/unified-prompt-builder.js";

function makeRegistry() {
	PromptRegistry.resetInstance();
	const reg = PromptRegistry.getInstance();
	reg.register("hierarchical", () => new HierarchicalGenerator());
	reg.register("domain-neutral", () => new DomainNeutralGenerator());
	return reg;
}

describe("UnifiedPromptBuilder", () => {
	beforeEach(() => {
		PromptRegistry.resetInstance();
	});

	afterEach(() => {
		PromptRegistry.resetInstance();
	});

	it("build() returns PromptResult for hierarchical domain", async () => {
		const reg = makeRegistry();
		const builder = new UnifiedPromptBuilder(reg);
		const result = await builder.build({
			domain: "hierarchical",
			context: { context: "E-commerce", goal: "Implement checkout" },
		});
		expect(result.content).toContain("Context");
		expect(result.content).toContain("Goal");
		expect(result.metadata.domain).toBe("hierarchical");
		expect(result.techniques.length).toBeGreaterThan(0);
		expect(result.stats.sectionCount).toBeGreaterThan(0);
	});

	it("build() throws for unknown domain", async () => {
		const reg = makeRegistry();
		const builder = new UnifiedPromptBuilder(reg);
		await expect(
			builder.build({
				domain: "security" as "hierarchical",
				context: { context: "x", goal: "y" },
			}),
		).rejects.toThrow("No generator registered for domain");
	});

	it("buildBatch() processes multiple requests", async () => {
		const reg = makeRegistry();
		const builder = new UnifiedPromptBuilder(reg);
		const results = await builder.buildBatch([
			{ domain: "hierarchical", context: { context: "A", goal: "B" } },
			{ domain: "hierarchical", context: { context: "C", goal: "D" } },
		]);
		expect(results).toHaveLength(2);
		expect(results[0].content).toContain("A");
		expect(results[1].content).toContain("C");
	});

	it("getAvailableDomains() returns registered domains", () => {
		const reg = makeRegistry();
		const builder = new UnifiedPromptBuilder(reg);
		expect(builder.getAvailableDomains()).toContain("hierarchical");
		expect(builder.getAvailableDomains()).toContain("domain-neutral");
	});

	it("supportsDomain() returns correct booleans", () => {
		const reg = makeRegistry();
		const builder = new UnifiedPromptBuilder(reg);
		expect(builder.supportsDomain("hierarchical")).toBe(true);
		expect(builder.supportsDomain("security")).toBe(false);
	});

	it("getRecommendedTechniques() returns non-empty list", () => {
		const reg = makeRegistry();
		const builder = new UnifiedPromptBuilder(reg);
		const techniques = builder.getRecommendedTechniques("hierarchical", {
			context: "test",
			goal: "test",
		});
		expect(techniques.length).toBeGreaterThan(0);
	});

	it("includes metadata when includeMetadata=true", async () => {
		const reg = makeRegistry();
		const builder = new UnifiedPromptBuilder(reg);
		const result = await builder.build({
			domain: "hierarchical",
			context: { context: "E-commerce", goal: "Checkout" },
			includeMetadata: true,
		});
		expect(result.content).toContain("## Metadata");
	});

	it("renders XML format when outputFormat=xml", async () => {
		const reg = makeRegistry();
		const builder = new UnifiedPromptBuilder(reg);
		const result = await builder.build({
			domain: "hierarchical",
			context: { context: "SaaS", goal: "Implement API" },
			outputFormat: "xml",
		});
		expect(result.content).toContain("<section");
	});
});
