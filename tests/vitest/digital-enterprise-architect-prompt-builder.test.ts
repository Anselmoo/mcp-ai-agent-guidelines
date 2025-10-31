import { describe, expect, it } from "vitest";
import { enterpriseArchitectPromptBuilder } from "../../src/tools/prompt/digital-enterprise-architect-prompt-builder.js";

describe("digital-enterprise-architect-prompt-builder", () => {
	it("produces the expected core sections and mentor guidance", async () => {
		const result = await enterpriseArchitectPromptBuilder({
			initiativeName: "Omnichannel Commerce Revamp",
			problemStatement:
				"Unify legacy storefronts into a scalable, experience-first digital platform",
			businessDrivers: [
				"Increase conversion by 12%",
				"Support global launch cadence",
			],
			researchFocus: [
				"Composable commerce reference architectures",
				"Event-driven inventory synchronization",
			],
		});

		const text = result.content[0].text;

		expect(text).toContain("Enterprise Architect Prompt");
		expect(text).toContain("## Initiative Overview");
		expect(text).toContain("## Virtual Mentor Panel");
		expect(text).toContain("Trade-Off Playbook");
		expect(text).toContain("Output Blueprint");
		expect(text).toContain("High-Level Summary");
		expect(text).toContain("Architectural Recommendation");
		expect(text).toContain("Security & Reliability Plan");
		expect(text).toContain("Next Steps");
	});

	it("highlights research focus topics when provided", async () => {
		const result = await enterpriseArchitectPromptBuilder({
			initiativeName: "AI Supply Chain Orchestrator",
			problemStatement:
				"Coordinate multi-party logistics using predictive signals",
			researchFocus: ["Data mesh maturity", "Responsible AI guardrails"],
			differentiators: ["Near real-time insights"],
			includeReferences: false,
		});

		const text = result.content[0].text;

		expect(text).toContain("Prioritize research emphasis on:");
		expect(text).toContain("Data mesh maturity");
		expect(text).toContain("Responsible AI guardrails");
	});

	it("respects includeMetadata flag", async () => {
		const result = await enterpriseArchitectPromptBuilder({
			initiativeName: "Modern Lending Core",
			problemStatement:
				"Build a resilient, compliant loan servicing foundation",
			includeMetadata: false,
		});

		const text = result.content[0].text;
		expect(text).not.toMatch(/\*\*Source Tool\*\*/);
	});

	it("respects includeFrontmatter when markdown enforcement is disabled", async () => {
		const result = await enterpriseArchitectPromptBuilder({
			initiativeName: "Healthcare Integration Fabric",
			problemStatement: "Integrate EHR partners with unified data models",
			includeFrontmatter: false,
			forcePromptMdStyle: false,
		});

		const text = result.content[0].text;
		expect(text.startsWith("---")).toBe(false);
	});
});
