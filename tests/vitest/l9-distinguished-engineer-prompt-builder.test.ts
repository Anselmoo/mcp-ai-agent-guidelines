import { describe, expect, it } from "vitest";
import { l9DistinguishedEngineerPromptBuilder } from "../../src/tools/prompt/l9-distinguished-engineer-prompt-builder.js";

describe("l9-distinguished-engineer-prompt-builder", () => {
	it("generates a fully structured prompt with frontmatter and metadata for minimal input", async () => {
		const result = await l9DistinguishedEngineerPromptBuilder({
			projectName: "Aurora Observability",
			technicalChallenge: "Re-architect telemetry ingestion at global scale",
		});

		const text = result.content[0].text;

		expect(text.startsWith("---\n# Note: Dropped unknown tools:")).toBe(true);
		expect(text).toContain("mode: 'agent'");
		expect(text).toContain("tools: ['githubRepo']");
		expect(text).toContain("## 🎯 Distinguished Engineer (L9) Prompt");
		expect(text).toContain("## Project Context");
		expect(text).toContain("- **Project:** Aurora Observability");
		expect(text).toContain(
			"- Clarify technical objectives, performance targets, and timeline before designing solutions.",
		);
		expect(text).toContain("## Further Reading");

		const suggested = text.match(/Suggested filename: (.*)/);
		expect(suggested?.[1]).toBe(
			"aurora-observability-l9-distinguished-engineer.prompt.md",
		);
	});

	it("includes detailed sections built from trimmed list inputs", async () => {
		const result = await l9DistinguishedEngineerPromptBuilder({
			projectName: "Helios Edge",
			technicalChallenge: "Scale streaming analytics for edge devices",
			technicalDrivers: [" ultra-low latency ", "", " geographic resiliency"],
			technicalDifferentiators: ["Edge inference pipeline"],
			engineeringConstraints: ["Zero downtime deployments", " p99 < 45ms "],
			securityRequirements: ["FedRAMP High"],
			techStack: ["Go", "  Rust  ", ""],
			experimentationAreas: ["WASM runtime"],
			benchmarkingFocus: ["Google Spanner", "Kafka"],
			tradeoffPriorities: ["consistency vs availability"],
			technicalRisks: ["Cache stampede when scaling regions"],
			observabilityRequirements: ["Distributed tracing"],
			performanceTargets: ["p99 latency < 40ms"],
			codeQualityStandards: ["100% typed APIs"],
			deliveryTimeline: "Q3 milestone",
			migrationStrategy: "Incremental regional rollout",
			teamContext: "Platform SWAT team",
			userScale: "50k req/s",
		});

		const text = result.content[0].text;

		expect(text).toContain("- **Technical Drivers:**");
		expect(text).toContain("  - ultra-low latency");
		expect(text).toContain("  - geographic resiliency");
		expect(text).toContain("- **Engineering Constraints:**");
		expect(text).toContain("  - Zero downtime deployments");
		expect(text).toContain("  - p99 < 45ms");
		expect(text).toContain("- **Security Requirements:**");
		expect(text).toContain("  - FedRAMP High");
		expect(text).toContain("- **Tech Stack:**");
		expect(text).toContain("  - Go");
		expect(text).toContain("  - Rust");
		expect(text).toContain("Incremental regional rollout");
		expect(text).toContain("Platform SWAT team");
		expect(text).toContain("Trade-off Analysis");
		expect(text).toContain("consistency vs availability");
		expect(text).toContain("Risk Register");
		expect(text).toContain("Cache stampede when scaling regions");
	});

	it("respects include flags when prompt-md enforcement is disabled", async () => {
		const result = await l9DistinguishedEngineerPromptBuilder({
			projectName: "Nova Fabric",
			technicalChallenge: "Introduce multi-region fabric coordinator",
			includeFrontmatter: false,
			includeMetadata: false,
			includeReferences: false,
			forcePromptMdStyle: false,
		});

		const text = result.content[0].text;

		expect(text.startsWith("## 🎯 Distinguished Engineer (L9) Prompt")).toBe(
			true,
		);
		expect(text).not.toContain("### Metadata");
		expect(text).not.toContain("## Further Reading");
		expect(text).not.toContain("mode: 'agent'");
	});
});
