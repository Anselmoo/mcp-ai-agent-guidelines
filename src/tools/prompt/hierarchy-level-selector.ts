import { z } from "zod";
import { emitDeprecationWarning } from "../shared/deprecation.js";
import { buildFurtherReadingSection } from "../shared/prompt-utils.js";
import {
	HIERARCHY_LEVEL_DEFINITIONS,
	type PromptingHierarchyLevel,
} from "./prompting-hierarchy-evaluator.js";

/**
 * Hierarchy Level Selector
 *
 * Selects the most appropriate prompting hierarchy level based on task characteristics,
 * agent capability, and autonomy preferences.
 *
 * Based on research from:
 * - Hierarchical Prompting Taxonomy (HPT): https://arxiv.org/abs/2406.12644
 * - HPT Implementation: https://github.com/devichand579/HPT
 * - ACL Anthology research: https://github.com/acl-org/acl-anthology
 *
 * @see https://github.com/devichand579/HPT - Reference implementation
 * @see https://github.com/acl-org/acl-anthology - Research papers on prompt engineering
 */

const HierarchyLevelSelectorSchema = z.object({
	taskDescription: z
		.string()
		.describe("Description of the task the prompt will address"),
	agentCapability: z
		.enum(["novice", "intermediate", "advanced", "expert"])
		.optional()
		.default("intermediate"),
	taskComplexity: z
		.enum(["simple", "moderate", "complex", "very-complex"])
		.optional()
		.default("moderate"),
	autonomyPreference: z
		.enum(["low", "medium", "high"])
		.optional()
		.default("medium"),
	includeExamples: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
});

type HierarchyLevelSelectorInput = z.infer<typeof HierarchyLevelSelectorSchema>;

interface LevelRecommendation {
	level: PromptingHierarchyLevel;
	score: number;
	rationale: string;
}

/**
 * Select the most appropriate hierarchy level based on task and agent characteristics
 */
function selectHierarchyLevel(
	input: HierarchyLevelSelectorInput,
): LevelRecommendation[] {
	const {
		taskDescription,
		agentCapability,
		taskComplexity,
		autonomyPreference,
	} = input;

	const recommendations: LevelRecommendation[] = [];

	// Analyze task characteristics
	const isOpenEnded = /research|explore|investigate|discover|innovate/i.test(
		taskDescription,
	);
	const isWellDefined = /implement|create|add|update|fix|refactor/i.test(
		taskDescription,
	);
	const isHighRisk =
		/production|critical|security|deployment|database|payment/i.test(
			taskDescription,
		);
	const requiresPrecision = /exact|precise|specific|must|requirement/i.test(
		taskDescription,
	);

	// Scoring matrix for each level
	const levelScores: Record<PromptingHierarchyLevel, number> = {
		independent: 0,
		indirect: 0,
		direct: 0,
		modeling: 0,
		scaffolding: 0,
		"full-physical": 0,
	};

	// Factor 1: Agent Capability
	const capabilityScores: Record<
		typeof agentCapability,
		Partial<typeof levelScores>
	> = {
		expert: { independent: 30, indirect: 20, direct: 15 },
		advanced: { indirect: 25, direct: 30, modeling: 15 },
		intermediate: { direct: 25, modeling: 25, scaffolding: 20 },
		novice: { modeling: 20, scaffolding: 30, "full-physical": 20 },
	};

	Object.entries(capabilityScores[agentCapability]).forEach(
		([level, score]) => {
			levelScores[level as PromptingHierarchyLevel] += score;
		},
	);

	// Factor 2: Task Complexity
	const complexityScores: Record<
		typeof taskComplexity,
		Partial<typeof levelScores>
	> = {
		simple: { independent: 20, indirect: 15, direct: 20 },
		moderate: { indirect: 20, direct: 25, modeling: 20 },
		complex: { direct: 15, modeling: 25, scaffolding: 25 },
		"very-complex": { scaffolding: 30, "full-physical": 25 },
	};

	Object.entries(complexityScores[taskComplexity]).forEach(([level, score]) => {
		levelScores[level as PromptingHierarchyLevel] += score;
	});

	// Factor 3: Autonomy Preference
	const autonomyScores: Record<
		typeof autonomyPreference,
		Partial<typeof levelScores>
	> = {
		high: { independent: 25, indirect: 20, direct: 10 },
		medium: { indirect: 15, direct: 25, modeling: 15 },
		low: { modeling: 15, scaffolding: 25, "full-physical": 20 },
	};

	Object.entries(autonomyScores[autonomyPreference]).forEach(
		([level, score]) => {
			levelScores[level as PromptingHierarchyLevel] += score;
		},
	);

	// Factor 4: Task Characteristics
	if (isOpenEnded) {
		levelScores.independent += 20;
		levelScores.indirect += 15;
	}

	if (isWellDefined) {
		levelScores.direct += 15;
		levelScores.modeling += 10;
	}

	if (isHighRisk) {
		levelScores.scaffolding += 20;
		levelScores["full-physical"] += 25;
		levelScores.independent -= 15;
	}

	if (requiresPrecision) {
		levelScores["full-physical"] += 20;
		levelScores.scaffolding += 15;
		levelScores.independent -= 10;
	}

	// Convert scores to recommendations
	Object.entries(levelScores).forEach(([level, score]) => {
		let rationale = `Score: ${score} - `;

		if (score >= 60) {
			rationale +=
				"Highly recommended based on task requirements and agent capability.";
		} else if (score >= 40) {
			rationale += "Good fit for this scenario.";
		} else if (score >= 20) {
			rationale += "Possible option but not optimal.";
		} else {
			rationale += "Not recommended for this use case.";
		}

		recommendations.push({
			level: level as PromptingHierarchyLevel,
			score,
			rationale,
		});
	});

	// Sort by score descending
	recommendations.sort((a, b) => b.score - a.score);

	return recommendations;
}

export async function hierarchyLevelSelector(args: unknown) {
	emitDeprecationWarning({
		tool: "hierarchy-level-selector",
		replacement: "prompt-hierarchy",
		deprecatedIn: "v0.14.0",
		removedIn: "v0.15.0",
	});

	const input = HierarchyLevelSelectorSchema.parse(args);

	const recommendations = selectHierarchyLevel(input);
	const topRecommendation = recommendations[0];
	const topLevelDef = HIERARCHY_LEVEL_DEFINITIONS.find(
		(d) => d.level === topRecommendation.level,
	);

	let output = `# Hierarchy Level Recommendation\n\n`;

	// Task Analysis
	output += `## 📋 Task Analysis\n\n`;
	output += `**Task**: ${input.taskDescription}\n\n`;
	output += `**Agent Capability**: ${input.agentCapability}\n`;
	output += `**Task Complexity**: ${input.taskComplexity}\n`;
	output += `**Autonomy Preference**: ${input.autonomyPreference}\n\n`;

	// Top Recommendation
	output += `## 🎯 Recommended Level: ${topLevelDef?.name}\n\n`;
	output += `${topLevelDef?.description}\n\n`;
	output += `**Why This Level?**\n${topRecommendation.rationale}\n\n`;

	// Level Characteristics
	output += `### Characteristics\n`;
	for (const char of topLevelDef?.characteristics || []) {
		output += `- ${char}\n`;
	}
	output += `\n`;

	// Use Cases
	output += `### Ideal For\n`;
	for (const useCase of topLevelDef?.useCases || []) {
		output += `- ${useCase}\n`;
	}
	output += `\n`;

	// Examples
	if (input.includeExamples && topLevelDef?.examples) {
		output += `### Example Prompts at This Level\n\n`;
		for (const example of topLevelDef.examples) {
			output += `> ${example}\n\n`;
		}
	}

	// All Recommendations
	output += `## 📊 All Level Scores\n\n`;
	output += `| Rank | Level | Score | Assessment |\n`;
	output += `|------|-------|-------|------------|\n`;

	recommendations.forEach((rec, idx) => {
		const levelDef = HIERARCHY_LEVEL_DEFINITIONS.find(
			(d) => d.level === rec.level,
		);
		const emoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "▫️";
		output += `| ${emoji} ${idx + 1} | ${levelDef?.name} | ${rec.score} | ${getScoreAssessment(rec.score)} |\n`;
	});
	output += `\n`;

	// Guidance on Using the Level
	output += `## 💡 How to Use ${topLevelDef?.name}\n\n`;

	switch (topRecommendation.level) {
		case "independent":
			output += `- Provide high-level objectives and constraints\n`;
			output += `- Trust the agent to determine the approach\n`;
			output += `- Focus on outcomes rather than methods\n`;
			output += `- Allow for creative problem-solving\n`;
			break;
		case "indirect":
			output += `- Offer contextual hints and clues\n`;
			output += `- Reference related resources or patterns\n`;
			output += `- Encourage exploration within boundaries\n`;
			output += `- Provide guidance without prescribing exact steps\n`;
			break;
		case "direct":
			output += `- State clear, specific goals\n`;
			output += `- Define requirements and constraints\n`;
			output += `- Let the agent determine implementation details\n`;
			output += `- Include expected outcomes\n`;
			break;
		case "modeling":
			output += `- Provide concrete examples of desired outcomes\n`;
			output += `- Show patterns to follow\n`;
			output += `- Include code snippets or templates\n`;
			output += `- Demonstrate the approach with 2-3 examples\n`;
			break;
		case "scaffolding":
			output += `- Break down the task into clear steps\n`;
			output += `- Provide structured guidance for each phase\n`;
			output += `- Include checkpoints and validation criteria\n`;
			output += `- Offer support while maintaining some autonomy\n`;
			break;
		case "full-physical":
			output += `- Specify every detail explicitly\n`;
			output += `- Leave no room for interpretation\n`;
			output += `- Provide exact code, paths, and values\n`;
			output += `- Include verification steps\n`;
			break;
	}
	output += `\n`;

	// Alternative Considerations
	const alternatives = recommendations.slice(1, 3);
	if (alternatives.length > 0) {
		output += `## 🔄 Alternative Considerations\n\n`;
		for (const alt of alternatives) {
			const altDef = HIERARCHY_LEVEL_DEFINITIONS.find(
				(d) => d.level === alt.level,
			);
			output += `### ${altDef?.name} (Score: ${alt.score})\n`;
			output += `${altDef?.description}\n\n`;
		}
	}

	// References
	if (input.includeReferences) {
		const references = buildFurtherReadingSection([
			{
				title: "Prompting Hierarchy Techniques",
				url: "https://www.aiforeducation.io/ai-resources/prompting-techniques-for-specialized-llms",
				description:
					"Techniques for specialized LLM prompting and task adaptation",
			},
			{
				title: "Hierarchical Prompting Framework",
				url: "https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions",
				description: "Framework for structuring AI interactions hierarchically",
			},
			{
				title: "Task-Based Prompt Design",
				url: "https://www.promptopti.com/best-3-prompting-hierarchy-tiers-for-ai-interaction/",
				description: "Three-tier approach to hierarchical prompt optimization",
			},
		]);
		output += `\n${references}\n`;
	}

	output += `\n## ⚠️ Note\n`;
	output += `This recommendation is based on the provided parameters. Adjust the hierarchy level based on actual agent performance and task outcomes. Consider starting at a higher support level and reducing as the agent demonstrates capability.\n`;

	return {
		content: [
			{
				type: "text" as const,
				text: output,
			},
		],
	};
}

function getScoreAssessment(score: number): string {
	if (score >= 60) return "Highly Recommended ✅";
	if (score >= 40) return "Good Fit 👍";
	if (score >= 20) return "Consider ⚠️";
	return "Not Recommended ❌";
}
