import { describe, expect, it, test } from "vitest";
import { domainNeutralPromptBuilder } from "../../src/tools/prompt/domain-neutral-prompt-builder";

describe("domain-neutral-prompt-builder", () => {
	test.each([
		{
			name: "enforced md style on, forces frontmatter+metadata",
			input: {
				title: "Project",
				summary: "Summary text",
				includeFrontmatter: false,
				includeMetadata: false,
				includeReferences: true,
				includeTechniqueHints: true,
				includePitfalls: true,
				tools: ["githubRepo", "codebase", "unknown"],
				model: "gpt-5",
			},
			asserts: (text: string) => {
				expect(text).toMatch(/^---/m); // frontmatter enforced
				expect(text).toMatch(/### Metadata/);
				expect(text).toMatch(/## Further Reading/);
				expect(text).toMatch(/# Technique Hints/);
				expect(text).toMatch(/# Pitfalls to Avoid/);
				// ensure unknown tool dropped comment appears in frontmatter comments area
				expect(text).toMatch(/Dropped unknown tools: unknown/);
				// model normalization should uppercase GPT-5 in frontmatter
				expect(text).toMatch(/model: GPT-5/);
				// tools list should only contain allowed tools
				expect(text).toMatch(
					/tools: \['githubRepo', 'codebase'(, 'editFiles')?\]/,
				);
			},
		},
		{
			name: "no enforce allows disabling frontmatter+metadata",
			input: {
				title: "Lite",
				summary: "Quick",
				forcePromptMdStyle: false,
				includeFrontmatter: false,
				includeMetadata: false,
				includeTechniqueHints: false,
				includePitfalls: false,
				includeReferences: false,
				tools: ["editFiles"],
				model: "claude-4",
				provider: "claude-4",
				style: "xml",
			},
			asserts: (text: string) => {
				expect(text).not.toMatch(/^---/m); // no frontmatter
				expect(text).not.toMatch(/### Metadata/);
				// Provider tips heading always present
				expect(text).toMatch(/# Model-Specific Tips/);
				// Preferred style shown and XML sample present for claude
				expect(text).toMatch(/Preferred Style: XML/);
				expect(text).toMatch(/```xml/);
			},
		},
	])("%s", async ({ input, asserts }) => {
		const res = await domainNeutralPromptBuilder(input);
		const text = res.content[0].text;
		asserts(text);
	});

	it("includes core sections when optional arrays are provided", async () => {
		const res = await domainNeutralPromptBuilder({
			title: "Deep",
			summary: "Summary",
			objectives: ["o1"],
			nonGoals: ["ng1"],
			background: "bg",
			stakeholdersUsers: "users",
			environment: "env",
			assumptions: "assume",
			constraints: "constraints",
			dependencies: "deps",
			inputs: "in",
			outputs: "out",
			dataSchemas: ["SchemaA"],
			interfaces: [{ name: "IF", contract: "json" }],
			workflow: ["step1", "step2"],
			capabilities: [
				{
					name: "CapA",
					purpose: "do",
					inputs: "i",
					processing: "p",
					outputs: "o",
				},
			],
			edgeCases: [{ name: "case", handling: "do x" }],
			risks: [{ description: "risk", mitigation: "mit" }],
			successMetrics: ["m1"],
			acceptanceTests: [{ setup: "s", action: "a", expected: "e" }],
			manualChecklist: ["c1"],
			performanceScalability: "perf",
			reliabilityAvailability: "rel",
			securityPrivacy: "sec",
			compliancePolicy: "comp",
			observabilityOps: "obs",
			costBudget: "$",
			versioningStrategy: "semver",
			migrationCompatibility: "mc",
			changelog: ["c1"],
			milestones: [{ name: "M1", deliverables: "D", eta: "soon" }],
			openQuestions: ["q1"],
			nextSteps: ["n1"],
		});
		const text = res.content[0].text;
		expect(text).toMatch(/## Objectives/);
		expect(text).toMatch(/## Non-Goals/);
		expect(text).toMatch(/## Scope and Context/);
		expect(text).toMatch(/## Inputs and Outputs/);
		expect(text).toMatch(/## Workflow/);
		expect(text).toMatch(/## Capabilities/);
		expect(text).toMatch(/## Edge Cases/);
		expect(text).toMatch(/## Risks and Mitigations/);
		expect(text).toMatch(/## Validation and Acceptance/);
		expect(text).toMatch(/## Operational Requirements/);
		expect(text).toMatch(/## Versioning and Change Management/);
		expect(text).toMatch(/## Milestones and Timeline/);
		expect(text).toMatch(/## Open Questions/);
		expect(text).toMatch(/## Next Steps/);
	});
});
