import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	ArchitectureGenerator,
	CodeAnalysisGenerator,
	DomainNeutralGenerator,
	HierarchicalGenerator,
	PromptRegistry,
	SecurityGenerator,
	UnifiedPromptBuilder,
} from "../../../../src/domain/prompts/index.js";

function makeFullRegistry() {
	PromptRegistry.resetInstance();
	const reg = PromptRegistry.getInstance();
	reg.register("hierarchical", () => new HierarchicalGenerator());
	reg.register("security", () => new SecurityGenerator());
	reg.register("architecture", () => new ArchitectureGenerator());
	reg.register("code-analysis", () => new CodeAnalysisGenerator());
	reg.register("domain-neutral", () => new DomainNeutralGenerator());
	return reg;
}

describe("Phase 2.5 Integration: UnifiedPromptBuilder with all generators", () => {
	beforeEach(() => {
		PromptRegistry.resetInstance();
	});

	afterEach(() => {
		PromptRegistry.resetInstance();
	});

	it("builds a hierarchical prompt end-to-end", async () => {
		const builder = new UnifiedPromptBuilder(makeFullRegistry());
		const result = await builder.build({
			domain: "hierarchical",
			context: { context: "SaaS startup", goal: "Implement auth" },
			title: "Auth Prompt",
		});
		expect(result.content).toContain("# Auth Prompt");
		expect(result.content).toContain("SaaS startup");
		expect(result.metadata.domain).toBe("hierarchical");
	});

	it("builds a security prompt with compliance standards", async () => {
		const builder = new UnifiedPromptBuilder(makeFullRegistry());
		const result = await builder.build({
			domain: "security",
			context: {
				codeContext: "function processPayment(card) {}",
				complianceStandards: ["PCI-DSS"],
			},
		});
		expect(result.content).toContain("PCI-DSS");
	});

	it("builds an architecture prompt", async () => {
		const builder = new UnifiedPromptBuilder(makeFullRegistry());
		const result = await builder.build({
			domain: "architecture",
			context: { systemRequirements: "Handle 100k requests/sec" },
		});
		expect(result.content).toContain("100k requests");
	});

	it("builds a code-analysis prompt", async () => {
		const builder = new UnifiedPromptBuilder(makeFullRegistry());
		const result = await builder.build({
			domain: "code-analysis",
			context: { codebase: "src/auth/", focusArea: "security" },
		});
		expect(result.content).toContain("src/auth/");
	});

	it("builds a domain-neutral prompt", async () => {
		const builder = new UnifiedPromptBuilder(makeFullRegistry());
		const result = await builder.build({
			domain: "domain-neutral",
			context: {
				title: "Integration Test",
				summary: "A neutral prompt for testing",
				objectives: ["Ensure reliability"],
			},
		});
		expect(result.content).toContain("neutral prompt");
	});

	it("batch build processes all 5 domains", async () => {
		const builder = new UnifiedPromptBuilder(makeFullRegistry());
		const results = await builder.buildBatch([
			{ domain: "hierarchical", context: { context: "A", goal: "B" } },
			{ domain: "security", context: { codeContext: "function f() {}" } },
			{ domain: "architecture", context: { systemRequirements: "HA system" } },
			{ domain: "code-analysis", context: { codebase: "src/" } },
			{ domain: "domain-neutral", context: { title: "T", summary: "S" } },
		]);
		expect(results).toHaveLength(5);
		for (const r of results) {
			expect(r.content.length).toBeGreaterThan(0);
		}
	});

	it("registry lists all 5 domains", () => {
		const reg = makeFullRegistry();
		const domains = reg.listDomains();
		expect(domains).toContain("hierarchical");
		expect(domains).toContain("security");
		expect(domains).toContain("architecture");
		expect(domains).toContain("code-analysis");
		expect(domains).toContain("domain-neutral");
	});
});
