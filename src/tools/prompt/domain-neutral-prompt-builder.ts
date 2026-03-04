import { z } from "zod";
import { DEFAULT_MODEL, DEFAULT_MODEL_SLUG } from "../config/model-config.js";
import { handleToolError } from "../shared/error-handler.js";
import {
	buildPitfallsSection,
	buildProjectReferencesSection,
	buildProviderTipsSection,
	buildDisclaimer as buildSharedDisclaimer,
	buildTechniqueHintsSection,
	ProviderEnum,
	StyleEnum,
	TechniqueEnum,
} from "../shared/prompt-sections.js";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildMetadataSection,
	buildOptionalSectionsMap,
	slugify,
} from "../shared/prompt-utils.js";

const DomainNeutralSchema = z.object({
	// Header
	title: z.string().describe("Document title for the domain-neutral prompt"),
	summary: z
		.string()
		.describe("One-paragraph summary of what the prompt accomplishes"),

	// Core planning
	objectives: z
		.array(z.string())
		.describe("Primary objectives or goals to achieve")
		.optional(),
	nonGoals: z
		.array(z.string())
		.describe("Explicitly out-of-scope items")
		.optional(),

	// Scope & context
	background: z
		.string()
		.describe("Background information and problem context")
		.optional(),
	stakeholdersUsers: z
		.string()
		.describe("Primary stakeholders or user segments")
		.optional(),
	environment: z
		.string()
		.describe("Operating environment or deployment context")
		.optional(),
	assumptions: z.string().describe("Key assumptions being made").optional(),
	constraints: z
		.string()
		.describe("Constraints or limitations to respect")
		.optional(),
	dependencies: z
		.string()
		.describe("External dependencies or prerequisites")
		.optional(),

	// IO & interfaces
	inputs: z
		.string()
		.describe("Expected inputs to the system or process")
		.optional(),
	outputs: z
		.string()
		.describe("Expected outputs produced by the system or process")
		.optional(),
	dataSchemas: z
		.array(z.string())
		.describe("Data schemas or models used")
		.optional(),
	interfaces: z
		.array(
			z.object({
				name: z.string().describe("Interface name"),
				contract: z.string().describe("Interface contract or specification"),
			}),
		)
		.describe("External interfaces and their contracts")
		.optional(),

	// Workflow
	workflow: z
		.array(z.string())
		.describe("Ordered list of workflow steps")
		.optional(),

	// Capabilities
	capabilities: z
		.array(
			z.object({
				name: z.string().describe("Capability name"),
				purpose: z.string().describe("Purpose of the capability"),
				preconditions: z.string().describe("Preconditions required").optional(),
				inputs: z
					.string()
					.describe("Inputs consumed by the capability")
					.optional(),
				processing: z
					.string()
					.describe("Processing logic description")
					.optional(),
				outputs: z
					.string()
					.describe("Outputs produced by the capability")
					.optional(),
				successCriteria: z
					.string()
					.describe("Success criteria for the capability")
					.optional(),
				errors: z.string().describe("Error conditions and handling").optional(),
				observability: z
					.string()
					.describe("Observability and monitoring requirements")
					.optional(),
			}),
		)
		.describe("System capabilities and their specifications")
		.optional(),

	// Edge cases
	edgeCases: z
		.array(
			z.object({
				name: z.string().describe("Edge case name"),
				handling: z.string().describe("How the edge case is handled"),
			}),
		)
		.describe("Edge cases and their handling strategies")
		.optional(),

	// Risks
	risks: z
		.array(
			z.object({
				description: z.string().describe("Risk description"),
				likelihoodImpact: z
					.string()
					.describe("Likelihood and impact assessment")
					.optional(),
				mitigation: z.string().describe("Mitigation strategy").optional(),
			}),
		)
		.describe("Identified risks and mitigations")
		.optional(),

	// Validation
	successMetrics: z
		.array(z.string())
		.describe("Metrics defining success")
		.optional(),
	acceptanceTests: z
		.array(
			z.object({
				setup: z.string().describe("Test setup or preconditions"),
				action: z.string().describe("Action to perform"),
				expected: z.string().describe("Expected outcome"),
			}),
		)
		.describe("Acceptance test cases")
		.optional(),
	manualChecklist: z
		.array(z.string())
		.describe("Manual verification checklist items")
		.optional(),

	// Ops
	performanceScalability: z
		.string()
		.describe("Performance and scalability requirements")
		.optional(),
	reliabilityAvailability: z
		.string()
		.describe("Reliability and availability requirements")
		.optional(),
	securityPrivacy: z
		.string()
		.describe("Security and privacy requirements")
		.optional(),
	compliancePolicy: z
		.string()
		.describe("Compliance and policy requirements")
		.optional(),
	observabilityOps: z
		.string()
		.describe("Observability and operational requirements")
		.optional(),
	costBudget: z.string().describe("Cost and budget constraints").optional(),

	// Versioning & changes
	versioningStrategy: z
		.string()
		.describe("Versioning strategy for the artifact")
		.optional(),
	migrationCompatibility: z
		.string()
		.describe("Migration and backward compatibility notes")
		.optional(),
	changelog: z.array(z.string()).describe("Changelog entries").optional(),

	// Timeline
	milestones: z
		.array(
			z.object({
				name: z.string().describe("Milestone name"),
				deliverables: z.string().describe("Expected deliverables").optional(),
				eta: z.string().describe("Estimated completion date").optional(),
			}),
		)
		.describe("Project milestones and deliverables")
		.optional(),

	// Questions & next steps
	openQuestions: z
		.array(z.string())
		.describe("Open questions requiring resolution")
		.optional(),
	nextSteps: z.array(z.string()).describe("Recommended next steps").optional(),

	// Prompt frontmatter controls
	mode: z
		.string()
		.describe("Execution mode for the generated prompt")
		.optional()
		.default("agent"),
	model: z
		.string()
		.describe("AI model identifier to use for generation")
		.optional()
		.default(DEFAULT_MODEL),
	tools: z
		.array(z.string())
		.describe("List of tools available to the agent")
		.optional()
		.default(["githubRepo", "codebase", "editFiles"]),
	includeFrontmatter: z
		.boolean()
		.describe("Whether to include YAML frontmatter in output")
		.optional()
		.default(true),
	includeDisclaimer: z
		.boolean()
		.describe("Whether to include a disclaimer section")
		.optional()
		.default(true),
	includeReferences: z
		.boolean()
		.describe("Whether to include reference links")
		.optional()
		.default(false),
	includeTechniqueHints: z
		.boolean()
		.describe("Whether to include technique hint annotations")
		.optional()
		.default(false),
	includePitfalls: z
		.boolean()
		.describe("Whether to include common pitfalls section")
		.optional()
		.default(false),
	includeMetadata: z
		.boolean()
		.describe("Whether to include metadata section")
		.optional()
		.default(true),
	inputFile: z.string().describe("Input file path for reference").optional(),
	forcePromptMdStyle: z
		.boolean()
		.describe("Force *.prompt.md file style with frontmatter")
		.optional()
		.default(true),

	// Optional model tips
	techniques: z
		.array(TechniqueEnum)
		.describe("Prompting techniques to apply")
		.optional(),
	autoSelectTechniques: z
		.boolean()
		.describe("Automatically select appropriate techniques based on context")
		.optional()
		.default(false),
	provider: ProviderEnum.describe("AI provider family for tailored tips")
		.optional()
		.default(DEFAULT_MODEL_SLUG),
	style: StyleEnum.describe("Preferred prompt formatting style").optional(),
});

export type DomainNeutralInput = z.infer<typeof DomainNeutralSchema>;

function buildFrontmatterForDomainNeutral(input: DomainNeutralInput): string {
	const desc = input.summary || input.title || "Domain-neutral prompt";
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function domainNeutralPromptBuilder(args: unknown) {
	try {
		const input = DomainNeutralSchema.parse(args);

		const enforce = input.forcePromptMdStyle ?? true;
		const effectiveIncludeFrontmatter = enforce
			? true
			: input.includeFrontmatter;
		const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

		const prompt = buildDomainNeutralPrompt(input);
		const filenameHint = `${slugify(input.title || input.summary || "prompt")}.prompt.md`;

		// Build optional sections using the shared utility
		// Note: effectiveIncludeFrontmatter and effectiveIncludeMetadata override the input values
		const configWithOverrides = {
			...input,
			includeFrontmatter: effectiveIncludeFrontmatter,
			includeMetadata: effectiveIncludeMetadata,
		};

		const {
			frontmatter,
			metadata,
			disclaimer,
			references,
			techniqueHints,
			pitfalls,
		} = buildOptionalSectionsMap(configWithOverrides, {
			frontmatter: {
				key: "includeFrontmatter",
				builder: (cfg) => `${buildFrontmatterForDomainNeutral(cfg)}\n`,
			},
			metadata: {
				key: "includeMetadata",
				builder: () =>
					buildMetadataSection({
						sourceTool: "mcp_ai-agent-guid_domain-neutral-prompt-builder",
						inputFile: input.inputFile,
						filenameHint,
					}),
			},
			disclaimer: {
				key: "includeDisclaimer",
				builder: () => buildSharedDisclaimer(),
			},
			references: {
				key: "includeReferences",
				builder: () => buildProjectReferencesSection(),
			},
			techniqueHints: {
				key: "includeTechniqueHints",
				builder: (cfg) =>
					`${buildTechniqueHintsSection({ techniques: cfg.techniques, autoSelectTechniques: cfg.autoSelectTechniques })}\n\n`,
			},
			pitfalls: {
				key: "includePitfalls",
				builder: () => buildPitfallsSection(),
			},
		});

		const providerTips = buildProviderTipsSection(input.provider, input.style);

		return {
			content: [
				{
					type: "text",
					text: `${frontmatter}## 🧩 Domain-Neutral Prompt Template\n\n${metadata}\n${prompt}\n\n${techniqueHints}${providerTips}\n${pitfalls}${references ? `${references}\n` : ""}${disclaimer}`,
				},
			],
		};
	} catch (error) {
		return handleToolError(error);
	}
}

function buildDomainNeutralPrompt(input: DomainNeutralInput): string {
	const lines: string[] = [];

	// Header
	lines.push(`# ${input.title}`);
	lines.push("");
	lines.push(`${input.summary}`);
	lines.push("");

	// Objectives / Non-Goals
	if (input.objectives?.length) {
		lines.push(`## Objectives`);
		input.objectives.forEach((o) => {
			lines.push(`- ${o}`);
		});
		lines.push("");
	}
	if (input.nonGoals?.length) {
		lines.push(`## Non-Goals`);
		input.nonGoals.forEach((n) => {
			lines.push(`- ${n}`);
		});
		lines.push("");
	}

	// Scope & Context
	const scopeBits: string[] = [];
	if (input.background) scopeBits.push(`- Background: ${input.background}`);
	if (input.stakeholdersUsers)
		scopeBits.push(`- Stakeholders/Users: ${input.stakeholdersUsers}`);
	if (input.environment) scopeBits.push(`- Environment: ${input.environment}`);
	if (input.assumptions) scopeBits.push(`- Assumptions: ${input.assumptions}`);
	if (input.constraints) scopeBits.push(`- Constraints: ${input.constraints}`);
	if (input.dependencies)
		scopeBits.push(`- Dependencies: ${input.dependencies}`);
	if (scopeBits.length) {
		lines.push(`## Scope and Context`);
		lines.push(...scopeBits);
		lines.push("");
	}

	// Inputs & Outputs
	const ioBits: string[] = [];
	if (input.inputs) ioBits.push(`- Inputs: ${input.inputs}`);
	if (input.outputs) ioBits.push(`- Outputs: ${input.outputs}`);
	if (input.dataSchemas?.length)
		ioBits.push(`- Data Schemas: ${input.dataSchemas.join(", ")}`);
	if (input.interfaces?.length) {
		ioBits.push(`- Interfaces:`);
		input.interfaces.forEach((i) => {
			ioBits.push(`  - ${i.name}: ${i.contract}`);
		});
	}
	if (ioBits.length) {
		lines.push(`## Inputs and Outputs`);
		lines.push(...ioBits);
		lines.push("");
	}

	// Workflow
	if (input.workflow?.length) {
		lines.push(`## Workflow`);
		input.workflow.forEach((s, idx) => {
			lines.push(`${idx + 1}) ${s}`);
		});
		lines.push("");
	}

	// Capabilities
	if (input.capabilities?.length) {
		lines.push(`## Capabilities`);
		input.capabilities.forEach((c) => {
			lines.push("");
			lines.push(`### ${c.name}`);
			lines.push(`- Purpose: ${c.purpose}`);
			if (c.preconditions)
				lines.push(`- Preconditions/Triggers: ${c.preconditions}`);
			if (c.inputs) lines.push(`- Inputs: ${c.inputs}`);
			if (c.processing) lines.push(`- Processing: ${c.processing}`);
			if (c.outputs) lines.push(`- Outputs: ${c.outputs}`);
			if (c.successCriteria)
				lines.push(`- Success Criteria: ${c.successCriteria}`);
			if (c.errors) lines.push(`- Errors/Failures: ${c.errors}`);
			if (c.observability) lines.push(`- Observability: ${c.observability}`);
		});
		lines.push("");
	}

	// Edge cases
	if (input.edgeCases?.length) {
		lines.push(`## Edge Cases`);
		input.edgeCases.forEach((e) => {
			lines.push(`- ${e.name} → ${e.handling}`);
		});
		lines.push("");
	}

	// Risks
	if (input.risks?.length) {
		lines.push(`## Risks and Mitigations`);
		input.risks.forEach((r) => {
			lines.push(
				`- Risk: ${r.description}${r.likelihoodImpact ? ` — Likelihood/Impact: ${r.likelihoodImpact}` : ""}${r.mitigation ? ` — Mitigation: ${r.mitigation}` : ""}`,
			);
		});
		lines.push("");
	}

	// Validation & Acceptance
	const valBits: string[] = [];
	if (input.successMetrics?.length) {
		valBits.push(`- Success Metrics:`);
		input.successMetrics.forEach((m) => {
			valBits.push(`  - ${m}`);
		});
	}
	if (input.acceptanceTests?.length) {
		valBits.push(`- Acceptance Tests:`);
		input.acceptanceTests.forEach((t) => {
			valBits.push(`  - ${t.setup} → ${t.action} → ${t.expected}`);
		});
	}
	if (input.manualChecklist?.length) {
		valBits.push(`- Manual QA/Review:`);
		input.manualChecklist.forEach((c) => {
			valBits.push(`  - ${c}`);
		});
	}
	if (valBits.length) {
		lines.push(`## Validation and Acceptance`);
		lines.push(...valBits);
		lines.push("");
	}

	// Operational Requirements
	const opsBits: string[] = [];
	if (input.performanceScalability)
		opsBits.push(`- Performance/Scalability: ${input.performanceScalability}`);
	if (input.reliabilityAvailability)
		opsBits.push(
			`- Reliability/Availability: ${input.reliabilityAvailability}`,
		);
	if (input.securityPrivacy)
		opsBits.push(`- Security/Privacy: ${input.securityPrivacy}`);
	if (input.compliancePolicy)
		opsBits.push(`- Compliance/Policy: ${input.compliancePolicy}`);
	if (input.observabilityOps)
		opsBits.push(`- Observability: ${input.observabilityOps}`);
	if (input.costBudget) opsBits.push(`- Cost/Budget: ${input.costBudget}`);
	if (opsBits.length) {
		lines.push(`## Operational Requirements (as applicable)`);
		lines.push(...opsBits);
		lines.push("");
	}

	// Versioning & Change Management
	const verBits: string[] = [];
	if (input.versioningStrategy)
		verBits.push(`- Versioning Strategy: ${input.versioningStrategy}`);
	if (input.migrationCompatibility)
		verBits.push(
			`- Migration/Backwards Compatibility: ${input.migrationCompatibility}`,
		);
	if (input.changelog?.length)
		verBits.push(`- Changelog: ${input.changelog.join(", ")}`);
	if (verBits.length) {
		lines.push(`## Versioning and Change Management`);
		lines.push(...verBits);
		lines.push("");
	}

	// Milestones & Timeline
	if (input.milestones?.length) {
		lines.push(`## Milestones and Timeline`);
		input.milestones.forEach((m) => {
			lines.push(
				`- ${m.name}: ${m.deliverables ?? ""}${m.eta ? ` (ETA: ${m.eta})` : ""}`,
			);
		});
		lines.push("");
	}

	// Open Questions
	if (input.openQuestions?.length) {
		lines.push(`## Open Questions`);
		input.openQuestions.forEach((q) => {
			lines.push(`- ${q}`);
		});
		lines.push("");
	}

	// Next Steps
	if (input.nextSteps?.length) {
		lines.push(`## Next Steps`);
		input.nextSteps.forEach((s) => {
			lines.push(`- ${s}`);
		});
	}

	return lines.join("\n");
}
