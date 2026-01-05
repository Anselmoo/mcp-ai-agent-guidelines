import { applyTechniques } from "../../tools/prompt/technique-applicator.js";
import { buildProviderTipsSection } from "../../tools/shared/prompt-sections.js";

export interface PromptSection {
	title: string;
	body: string;
}

export interface PromptMetadata {
	complexity: number;
	tokenEstimate: number;
	sections: number;
	techniques: string[];
	requirementsCount: number;
	issuesCount: number;
}

export interface HierarchicalPromptConfig {
	goal: string;
	context: string;
	requirements?: string[];
	constraints?: string[];
	issues?: string[];
	outputFormat?: string;
	audience?: string;
	techniques?: string[];
	includeTechniqueHints?: boolean;
	autoSelectTechniques?: boolean;
	provider?: string;
	style?: "markdown" | "xml";
}

function toNumberedList(items: string[]): string {
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function stripHeading(text: string, heading?: string): string {
	if (!text.trim()) return "";
	const normalized = text.trimStart();
	const lines = normalized.split("\n");
	if (lines[0].startsWith("#")) {
		lines.shift();
	}
	const body = lines.join("\n").trim();
	if (heading && body.startsWith(heading)) {
		return body.slice(heading.length).trimStart();
	}
	return body;
}

export function calculateComplexity(config: HierarchicalPromptConfig): number {
	const base = 20;
	const requirementWeight = (config.requirements?.length ?? 0) * 5;
	const constraintWeight = (config.constraints?.length ?? 0) * 4;
	const issueWeight = (config.issues?.length ?? 0) * 4;
	const techniqueWeight = (config.techniques?.length ?? 0) * 3;
	const audienceWeight = config.audience ? 2 : 0;
	const outputWeight = config.outputFormat ? 3 : 0;

	const score =
		base +
		requirementWeight +
		constraintWeight +
		issueWeight +
		techniqueWeight +
		audienceWeight +
		outputWeight;

	return Math.min(100, Math.max(0, score));
}

export function estimateTokens(sections: PromptSection[]): number {
	const totalChars = sections.reduce(
		(sum, section) => sum + section.title.length + section.body.length,
		0,
	);
	const estimate = Math.ceil(totalChars / 4);
	return Math.max(50, estimate);
}

export function buildHierarchicalPrompt(
	config: HierarchicalPromptConfig,
): PromptResult {
	const sections: PromptSection[] = [];

	sections.push({ title: "Context", body: config.context });
	sections.push({ title: "Goal", body: config.goal });

	if (config.requirements?.length) {
		sections.push({
			title: "Requirements",
			body: toNumberedList(config.requirements),
		});
	}

	if (config.constraints?.length) {
		sections.push({
			title: "Constraints",
			body: toNumberedList(config.constraints),
		});
	}

	if (config.issues?.length) {
		sections.push({
			title: "Problem Indicators",
			body: toNumberedList(config.issues),
		});
	}

	if (config.outputFormat) {
		sections.push({
			title: "Output Format",
			body: config.outputFormat,
		});
	}

	if (config.audience) {
		sections.push({
			title: "Target Audience",
			body: config.audience,
		});
	}

	if (config.includeTechniqueHints !== false) {
		const techniqueContent = applyTechniques({
			context: {
				context: config.context,
				goal: config.goal,
				requirements: config.requirements,
				outputFormat: config.outputFormat,
				audience: config.audience,
				issues: config.issues,
			},
			techniques: config.techniques,
			autoSelectTechniques: config.autoSelectTechniques,
		});

		const normalizedTechniqueContent = stripHeading(
			techniqueContent,
			"Approach",
		);

		if (normalizedTechniqueContent) {
			sections.push({
				title: "Approach",
				body: normalizedTechniqueContent,
			});
		}
	}

	const providerTipsRaw = buildProviderTipsSection(
		config.provider,
		config.style,
	);
	const providerTipsBody = stripHeading(providerTipsRaw, "Model-Specific Tips");
	if (providerTipsBody) {
		sections.push({
			title: "Model-Specific Tips",
			body: providerTipsBody,
		});
	}

	const instructions =
		"Follow the structure above. If you detect additional issues in the codebase, explicitly add them under Problem Indicators, propose minimal diffs, and flag risky changes. Treat tools/models as recommendations to validate against current provider documentation.";
	sections.push({ title: "Instructions", body: instructions });

	const metadata: PromptMetadata = {
		complexity: calculateComplexity(config),
		tokenEstimate: estimateTokens(sections),
		sections: sections.length,
		techniques: (config.techniques ?? []).map((tech) => tech.toLowerCase()),
		requirementsCount: config.requirements?.length ?? 0,
		issuesCount: config.issues?.length ?? 0,
	};

	return {
		sections,
		metadata,
	};
}

export interface PromptResult {
	sections: PromptSection[];
	metadata: PromptMetadata;
}
