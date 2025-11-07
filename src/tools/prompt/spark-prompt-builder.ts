import { z } from "zod";
import {
	buildDesignReferencesSection,
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

const SparkPromptSchema = z.object({
	// Header
	title: z.string(),
	summary: z.string(),

	// Experience qualities
	experienceQualities: z
		.array(
			z.object({
				quality: z.string(),
				detail: z.string(),
			}),
		)
		.optional(),

	// Complexity
	complexityLevel: z.string(),
	complexityDescription: z.string().optional(),
	primaryFocus: z.string().optional(),

	// Features
	features: z
		.array(
			z.object({
				name: z.string(),
				functionality: z.string(),
				purpose: z.string(),
				trigger: z.string(),
				progression: z.array(z.string()),
				successCriteria: z.string(),
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

	// Design
	designDirection: z.string(),

	// Colors
	colorSchemeType: z.string(),
	colorPurpose: z.string(),
	primaryColor: z.string(), // Allow embedding name + OKLCH in one string
	primaryColorPurpose: z.string(),
	secondaryColors: z
		.array(
			z.object({
				name: z.string(), // e.g., "Neutral Gray"
				oklch: z.string(), // e.g., "oklch(0.85 0.02 250)"
				usage: z.string(), // e.g., "backgrounds and supporting elements"
			}),
		)
		.optional(),
	accentColor: z.string(),
	accentColorPurpose: z.string(),
	foregroundBackgroundPairings: z
		.array(
			z.object({
				container: z.string(), // e.g., "Background" or "Accent"
				containerColor: z.string(), // e.g., "White oklch(1 0 0)" or "Vibrant Green oklch(0.65 0.18 130)"
				textColor: z.string(), // e.g., "Dark Gray (oklch(0.2 0.02 250))"
				ratio: z.string(), // e.g., "12.6:1"
			}),
		)
		.optional(),

	// Fonts
	fontFamily: z.string(),
	fontIntention: z.string(),
	fontReasoning: z.string(),
	typography: z
		.array(
			z.object({
				usage: z.string(), // e.g., "H1 (App Title)"
				font: z.string(), // e.g., "Inter"
				weight: z.string(), // e.g., "Bold"
				size: z.string(), // e.g., "32"
				spacing: z.string(), // e.g., "tight letter spacing"
			}),
		)
		.optional(),

	// Animations
	animationPhilosophy: z.string(),
	animationRestraint: z.string(),
	animationPurpose: z.string(),
	animationHierarchy: z.string(),

	// Prompting techniques (shared with hierarchical)
	techniques: z.array(TechniqueEnum).optional(),
	includeTechniqueHints: z.boolean().optional().default(false),
	autoSelectTechniques: z.boolean().optional().default(false),
	provider: ProviderEnum.optional().default("gpt-5"),
	style: StyleEnum.optional(),

	// Components
	components: z
		.array(
			z.object({
				type: z.string(), // e.g., "Button"
				usage: z.string(), // e.g., "primary action"
				variation: z.string().optional(),
				styling: z.string().optional(),
				state: z.string().optional(),
				functionality: z.string().optional(),
				purpose: z.string().optional(),
			}),
		)
		.optional(),
	customizations: z.string().optional(),
	states: z
		.array(
			z.object({
				component: z.string(),
				states: z.array(z.string()),
				specialFeature: z.string().optional(),
			}),
		)
		.optional(),
	icons: z.array(z.string()).optional(),
	spacingRule: z.string(),
	spacingContext: z.string(),
	mobileLayout: z.string(),

	// YAML prompt frontmatter (optional, to mirror hierarchical builder)
	mode: z.string().optional().default("agent"),
	model: z.string().optional().default("GPT-5"),
	tools: z
		.array(z.string())
		.optional()
		.default(["githubRepo", "codebase", "editFiles"]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeDisclaimer: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(false),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),
});

export type SparkPromptInput = z.infer<typeof SparkPromptSchema>;

function buildSparkFrontmatter(input: SparkPromptInput): string {
	const desc = input.summary || input.title || "Spark prompt template";
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function sparkPromptBuilder(args: unknown) {
	const input = SparkPromptSchema.parse(args);

	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const prompt = buildSparkPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildSparkFrontmatter(input)}\n`
		: "";
	const disclaimer = input.includeDisclaimer ? buildSharedDisclaimer() : "";
	const references = input.includeReferences
		? buildDesignReferencesSection()
		: "";
	const filenameHint = `${slugify(input.title || input.summary || "prompt")}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_spark-prompt-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## ⚡ Spark Prompt Template\n\n${metadata}\n${prompt}\n\n${input.includeTechniqueHints ? `${buildTechniqueHintsSection({ techniques: input.techniques, autoSelectTechniques: input.autoSelectTechniques })}\n\n` : ""}${buildProviderTipsSection(input.provider, input.style)}\n${references ? `${references}\n` : ""}${disclaimer}`,
			},
		],
	};
}

function buildSparkPrompt(input: SparkPromptInput): string {
	const lines: string[] = [];

	// Header
	lines.push(`# ${input.title}`);
	lines.push("");
	lines.push(`${input.summary}`);
	lines.push("");

	// Experience qualities
	lines.push(`**Experience Qualities**:`);
	if (input.experienceQualities?.length) {
		input.experienceQualities.forEach((q, i) => {
			lines.push(`${i + 1}. **${q.quality}** - ${q.detail}`);
		});
	}
	lines.push("");

	// Complexity
	lines.push(
		`**Complexity Level**: ${input.complexityLevel}${input.complexityDescription ? ` (${input.complexityDescription})` : ""}`,
	);
	if (input.primaryFocus) lines.push(`- ${input.primaryFocus}`);
	lines.push("");

	// Features
	lines.push(`## Essential Features`);
	if (input.features?.length) {
		input.features.forEach((f) => {
			lines.push("");
			lines.push(`### ${f.name}`);
			lines.push(`- **Functionality**: ${f.functionality}`);
			lines.push(`- **Purpose**: ${f.purpose}`);
			lines.push(`- **Trigger**: ${f.trigger}`);
			lines.push(`- **Progression**: ${f.progression.join(" → ")}`);
			lines.push(`- **Success criteria**: ${f.successCriteria}`);
		});
	}
	lines.push("");

	// Edge cases
	lines.push(`## Edge Case Handling`);
	if (input.edgeCases?.length) {
		input.edgeCases.forEach((e) => {
			lines.push(`- **${e.name}**: ${e.handling}`);
		});
	}
	lines.push("");

	// Design direction
	lines.push(`## Design Direction`);
	lines.push(`${input.designDirection}`);
	lines.push("");

	// Colors
	lines.push(`## Color Selection`);
	lines.push(`${input.colorSchemeType} to ${input.colorPurpose}.`);
	lines.push("");
	lines.push(
		`- **Primary Color**: ${input.primaryColor} - ${input.primaryColorPurpose}`,
	);
	if (input.secondaryColors?.length) {
		input.secondaryColors.forEach((c) => {
			lines.push(
				`- **Secondary Colors**: ${c.name} (${c.oklch}) for ${c.usage}`,
			);
		});
	}
	lines.push(
		`- **Accent Color**: ${input.accentColor} - ${input.accentColorPurpose}`,
	);
	lines.push(`- **Foreground/Background Pairings**:`);
	if (input.foregroundBackgroundPairings?.length) {
		input.foregroundBackgroundPairings.forEach((p) => {
			lines.push(
				`  - ${p.container} (${p.containerColor}): ${p.textColor} - Ratio ${p.ratio} ✓`,
			);
		});
	}
	lines.push("");

	// Fonts
	lines.push(`## Font Selection`);
	lines.push(
		`${input.fontFamily} to convey ${input.fontIntention} - ${input.fontReasoning}.`,
	);
	lines.push("");
	lines.push(`- **Typographic Hierarchy**:`);
	if (input.typography?.length) {
		input.typography.forEach((t) => {
			lines.push(
				`  - ${t.usage}: ${t.font} ${t.weight}/${t.size}px/${t.spacing}`,
			);
		});
	}
	lines.push("");

	// Animations
	lines.push(`## Animations`);
	lines.push(`${input.animationPhilosophy} and ${input.animationRestraint}.`);
	lines.push("");
	lines.push(`- **Purposeful Meaning**: ${input.animationPurpose}`);
	lines.push(`- **Hierarchy of Movement**: ${input.animationHierarchy}`);
	lines.push("");

	// Components
	lines.push(`## Component Selection`);
	lines.push(`- **Components**:`);
	if (input.components?.length) {
		input.components.forEach((c) => {
			lines.push(
				`  - ${c.type} for ${c.usage}${c.variation ? ` (${c.variation})` : ""}${c.styling ? ` with ${c.styling}` : ""}${c.state ? ` for ${c.state}` : ""}${c.functionality ? ` for ${c.functionality}` : ""}${c.purpose ? ` to ${c.purpose}` : ""}`,
			);
		});
	}
	if (input.customizations)
		lines.push(`- **Customizations**: ${input.customizations}`);
	lines.push(`- **States` + `**:`);
	if (input.states?.length) {
		input.states.forEach((s) => {
			lines.push(
				`  - ${s.component}: ${s.states.join(", ")}${s.specialFeature ? ` with ${s.specialFeature}` : ""}`,
			);
		});
	}
	lines.push(
		`- **Icon Selection**: ${input.icons?.length ? input.icons.join(", ") : ""} for various states`,
	);
	lines.push(
		`- **Spacing**: ${input.spacingRule} between ${input.spacingContext}`,
	);
	lines.push(`- **Mobile**: ${input.mobileLayout}`);

	return lines.join("\n");
}
