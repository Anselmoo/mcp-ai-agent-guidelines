import { z } from "zod";
import { DEFAULT_MODEL, DEFAULT_MODEL_SLUG } from "../config/model-config.js";
import { handleToolError } from "../shared/error-handler.js";
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
	title: z.string().describe("Prompt title for the design card"),
	summary: z.string().describe("Brief summary or outlook for the design"),

	// Experience qualities
	experienceQualities: z
		.array(
			z.object({
				quality: z.string().describe("UX quality name"),
				detail: z.string().describe("Detailed description of the quality"),
			}),
		)
		.describe("List of UX qualities to emphasize")
		.optional(),

	// Complexity
	complexityLevel: z
		.string()
		.describe(
			"Complexity level of the design (e.g., simple, moderate, complex)",
		),
	complexityDescription: z
		.string()
		.describe("Description of the complexity characteristics")
		.optional(),
	primaryFocus: z.string().describe("Primary design focus area").optional(),

	// Features
	features: z
		.array(
			z.object({
				name: z.string().describe("Feature name"),
				functionality: z.string().describe("What the feature does"),
				purpose: z.string().describe("Why the feature exists"),
				trigger: z.string().describe("What triggers the feature"),
				progression: z
					.array(z.string())
					.describe("Step-by-step progression of the feature"),
				successCriteria: z.string().describe("Criteria for feature success"),
			}),
		)
		.describe("Interactive features with progression flows")
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

	// Design
	designDirection: z
		.string()
		.describe("Overall design direction or aesthetic approach"),

	// Colors
	colorSchemeType: z
		.string()
		.describe("Color scheme type (e.g., light, dark, high-contrast)"),
	colorPurpose: z.string().describe("Purpose and intent of the color palette"),
	primaryColor: z.string().describe("Primary color (name + OKLCH value)"),
	primaryColorPurpose: z
		.string()
		.describe("Purpose of the primary color in the design"),
	secondaryColors: z
		.array(
			z.object({
				name: z.string().describe("Color name"),
				oklch: z.string().describe("OKLCH color value"),
				usage: z.string().describe("Where and how this color is used"),
			}),
		)
		.describe("Secondary color palette entries")
		.optional(),
	accentColor: z.string().describe("Accent color (name + OKLCH value)"),
	accentColorPurpose: z
		.string()
		.describe("Purpose of the accent color in the design"),
	foregroundBackgroundPairings: z
		.array(
			z.object({
				container: z.string().describe("Container or surface name"),
				containerColor: z.string().describe("Container background color"),
				textColor: z.string().describe("Text color on this container"),
				ratio: z.string().describe("Contrast ratio (e.g., 12.6:1)"),
			}),
		)
		.describe("Foreground/background color pairings with contrast ratios")
		.optional(),

	// Fonts
	fontFamily: z.string().describe("Primary font family"),
	fontIntention: z.string().describe("Typographic intention and tone"),
	fontReasoning: z.string().describe("Reasoning for font selection"),
	typography: z
		.array(
			z.object({
				usage: z.string().describe("Typography usage context (e.g., H1, body)"),
				font: z.string().describe("Font family name"),
				weight: z.string().describe("Font weight"),
				size: z.string().describe("Font size"),
				spacing: z.string().describe("Letter or line spacing"),
			}),
		)
		.describe("Typography scale definitions")
		.optional(),

	// Animations
	animationPhilosophy: z
		.string()
		.describe("Overall animation philosophy and approach"),
	animationRestraint: z.string().describe("Constraints on animation usage"),
	animationPurpose: z.string().describe("Purpose of animations in the design"),
	animationHierarchy: z.string().describe("Animation priority and hierarchy"),

	// Prompting techniques (shared with hierarchical)
	techniques: z
		.array(TechniqueEnum)
		.describe("Prompting techniques to apply")
		.optional(),
	includeTechniqueHints: z
		.boolean()
		.describe("Whether to include technique hint annotations")
		.optional()
		.default(false),
	autoSelectTechniques: z
		.boolean()
		.describe("Automatically select appropriate techniques based on context")
		.optional()
		.default(false),
	provider: ProviderEnum.describe("AI provider family for tailored tips")
		.optional()
		.default(DEFAULT_MODEL_SLUG),
	style: StyleEnum.describe("Preferred prompt formatting style").optional(),

	// Components
	components: z
		.array(
			z.object({
				type: z.string().describe("Component type (e.g., Button, Card)"),
				usage: z.string().describe("How the component is used"),
				variation: z
					.string()
					.describe("Component variation or variant")
					.optional(),
				styling: z.string().describe("Styling specifications").optional(),
				state: z.string().describe("Component states to handle").optional(),
				functionality: z
					.string()
					.describe("Component functionality description")
					.optional(),
				purpose: z.string().describe("Purpose of this component").optional(),
			}),
		)
		.describe("UI component specifications")
		.optional(),
	customizations: z
		.string()
		.describe("Additional customization notes")
		.optional(),
	states: z
		.array(
			z.object({
				component: z.string().describe("Component name"),
				states: z.array(z.string()).describe("List of states to implement"),
				specialFeature: z
					.string()
					.describe("Special feature for this component's states")
					.optional(),
			}),
		)
		.describe("Component state specifications")
		.optional(),
	icons: z
		.array(z.string())
		.describe("Icon names or identifiers to use")
		.optional(),
	spacingRule: z.string().describe("Spacing system rule (e.g., 8px base grid)"),
	spacingContext: z.string().describe("Context for applying spacing rules"),
	mobileLayout: z.string().describe("Mobile layout strategy and breakpoints"),

	// YAML prompt frontmatter (optional, to mirror hierarchical builder)
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
	try {
		const input = SparkPromptSchema.parse(args);

		const enforce = input.forcePromptMdStyle ?? true;
		const effectiveIncludeFrontmatter = enforce
			? true
			: input.includeFrontmatter;
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
	} catch (error) {
		return handleToolError(error);
	}
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
