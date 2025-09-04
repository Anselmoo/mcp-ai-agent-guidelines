import { z } from "zod";
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
	slugify,
} from "../shared/prompt-utils.js";

const DomainNeutralSchema = z.object({
	// Header
	title: z.string(),
	summary: z.string(),

	// Core planning
	objectives: z.array(z.string()).optional(),
	nonGoals: z.array(z.string()).optional(),

	// Scope & context
	background: z.string().optional(),
	stakeholdersUsers: z.string().optional(),
	environment: z.string().optional(),
	assumptions: z.string().optional(),
	constraints: z.string().optional(),
	dependencies: z.string().optional(),

	// IO & interfaces
	inputs: z.string().optional(),
	outputs: z.string().optional(),
	dataSchemas: z.array(z.string()).optional(),
	interfaces: z
		.array(
			z.object({
				name: z.string(),
				contract: z.string(),
			}),
		)
		.optional(),

	// Workflow
	workflow: z.array(z.string()).optional(),

	// Capabilities
	capabilities: z
		.array(
			z.object({
				name: z.string(),
				purpose: z.string(),
				preconditions: z.string().optional(),
				inputs: z.string().optional(),
				processing: z.string().optional(),
				outputs: z.string().optional(),
				successCriteria: z.string().optional(),
				errors: z.string().optional(),
				observability: z.string().optional(),
			}),
		)
		.optional(),

	// Edge cases
	edgeCases: z
		.array(
			z.object({
				name: z.string(),
				handling: z.string(),
			}),
		)
		.optional(),

	// Risks
	risks: z
		.array(
			z.object({
				description: z.string(),
				likelihoodImpact: z.string().optional(),
				mitigation: z.string().optional(),
			}),
		)
		.optional(),

	// Validation
	successMetrics: z.array(z.string()).optional(),
	acceptanceTests: z
		.array(
			z.object({
				setup: z.string(),
				action: z.string(),
				expected: z.string(),
			}),
		)
		.optional(),
	manualChecklist: z.array(z.string()).optional(),

	// Ops
	performanceScalability: z.string().optional(),
	reliabilityAvailability: z.string().optional(),
	securityPrivacy: z.string().optional(),
	compliancePolicy: z.string().optional(),
	observabilityOps: z.string().optional(),
	costBudget: z.string().optional(),

	// Versioning & changes
	versioningStrategy: z.string().optional(),
	migrationCompatibility: z.string().optional(),
	changelog: z.array(z.string()).optional(),

	// Timeline
	milestones: z
		.array(
			z.object({
				name: z.string(),
				deliverables: z.string().optional(),
				eta: z.string().optional(),
			}),
		)
		.optional(),

	// Questions & next steps
	openQuestions: z.array(z.string()).optional(),
	nextSteps: z.array(z.string()).optional(),

	// Prompt frontmatter controls
	mode: z.string().optional().default("agent"),
	model: z.string().optional().default("GPT-4.1"),
	tools: z
		.array(z.string())
		.optional()
		.default(["githubRepo", "codebase", "editFiles"]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeDisclaimer: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(false),
	includeTechniqueHints: z.boolean().optional().default(false),
	includePitfalls: z.boolean().optional().default(false),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),

	// Optional model tips
	techniques: z.array(TechniqueEnum).optional(),
	autoSelectTechniques: z.boolean().optional().default(false),
	provider: ProviderEnum.optional().default("gpt-4.1"),
	style: StyleEnum.optional(),
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
	const input = DomainNeutralSchema.parse(args);

	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const prompt = buildDomainNeutralPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildFrontmatterForDomainNeutral(input)}\n`
		: "";
	const disclaimer = input.includeDisclaimer ? buildSharedDisclaimer() : "";
	const references = input.includeReferences
		? buildProjectReferencesSection()
		: "";
	const filenameHint = `${slugify(input.title || input.summary || "prompt")}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_domain-neutral-prompt-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	const techniqueHints = input.includeTechniqueHints
		? `${buildTechniqueHintsSection({ techniques: input.techniques, autoSelectTechniques: input.autoSelectTechniques })}\n\n`
		: "";
	const providerTips = buildProviderTipsSection(input.provider, input.style);
	const pitfalls = input.includePitfalls ? buildPitfallsSection() : "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🧩 Domain-Neutral Prompt Template\n\n${metadata}\n${prompt}\n\n${techniqueHints}${providerTips}\n${pitfalls}${references ? `${references}\n` : ""}${disclaimer}`,
			},
		],
	};
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
