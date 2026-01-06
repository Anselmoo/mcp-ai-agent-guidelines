import { z } from "zod";
import { emitDeprecationWarning } from "../shared/deprecation.js";
import { buildFurtherReadingSection } from "../shared/prompt-utils.js";
import { handleToolError } from "../shared/error-handler.js";
import {
	type HierarchyLevelDefinition,
	type NumericEvaluation,
	PromptingHierarchyLevel as PromptingHierarchyLevelEnum,
	type PromptingHierarchyLevelType,
} from "./types/index.js";

export const PromptingHierarchyLevel = PromptingHierarchyLevelEnum;
export type PromptingHierarchyLevel = PromptingHierarchyLevelType;
export type { NumericEvaluation, HierarchyLevelDefinition };

export const HIERARCHY_LEVEL_DEFINITIONS: HierarchyLevelDefinition[] = [
	{
		level: "independent",
		name: "Independent",
		description:
			"Minimal guidance; agent operates autonomously with broad objectives",
		characteristics: [
			"High-level goals only",
			"No specific instructions",
			"Maximum agent autonomy",
			"Assumes high competence",
		],
		examples: [
			"Improve the codebase",
			"Optimize the system",
			"Research and implement best solution",
		],
		useCases: [
			"Highly capable agents",
			"Exploratory tasks",
			"Creative problem solving",
		],
		cognitiveLoad: "high",
		autonomyLevel: "high",
	},
	{
		level: "indirect",
		name: "Indirect Guidance",
		description: "Subtle hints and environmental cues to guide agent behavior",
		characteristics: [
			"Contextual clues provided",
			"Implicit expectations",
			"Guided discovery approach",
			"Moderate autonomy",
		],
		examples: [
			"Consider performance implications when refactoring",
			"Look at similar implementations in the codebase",
			"Think about edge cases in user input",
		],
		useCases: [
			"Learning scenarios",
			"Skill development",
			"Encouraging best practices",
		],
		cognitiveLoad: "medium",
		autonomyLevel: "medium",
	},
	{
		level: "direct",
		name: "Direct Instructions",
		description: "Clear, explicit instructions without detailed steps",
		characteristics: [
			"Specific goals stated",
			"Clear expectations",
			"No step-by-step breakdown",
			"Assumes task understanding",
		],
		examples: [
			"Refactor the authentication module to use JWT tokens",
			"Add input validation for all user-facing forms",
			"Implement caching for the database queries",
		],
		useCases: ["Standard tasks", "Experienced agents", "Clear requirements"],
		cognitiveLoad: "medium",
		autonomyLevel: "medium",
	},
	{
		level: "modeling",
		name: "Modeling/Demonstration",
		description: "Provides examples and demonstrations of expected behavior",
		characteristics: [
			"Concrete examples given",
			"Patterns demonstrated",
			"Learning by example",
			"Templates provided",
		],
		examples: [
			"Here's an example of proper error handling: [code example]",
			"Follow this pattern for API endpoints: [pattern]",
			"Use this template for component structure: [template]",
		],
		useCases: [
			"New patterns or technologies",
			"Ensuring consistency",
			"Teaching specific approaches",
		],
		cognitiveLoad: "low",
		autonomyLevel: "low",
	},
	{
		level: "scaffolding",
		name: "Scaffolding",
		description: "Step-by-step guidance with structured support",
		characteristics: [
			"Sequential steps provided",
			"Structured approach",
			"Checkpoints included",
			"Progressive support",
		],
		examples: [
			"1. First, analyze the current implementation\n2. Then, identify bottlenecks\n3. Next, propose optimizations\n4. Finally, implement and test",
			"Step 1: Create the interface\nStep 2: Implement the base class\nStep 3: Add error handling\nStep 4: Write tests",
		],
		useCases: [
			"Complex multi-step tasks",
			"Less experienced agents",
			"Critical procedures",
		],
		cognitiveLoad: "low",
		autonomyLevel: "low",
	},
	{
		level: "full-physical",
		name: "Full Physical Guidance",
		description:
			"Complete detailed specification with explicit instructions for every step",
		characteristics: [
			"Every detail specified",
			"No ambiguity",
			"Minimal decision-making required",
			"Maximum support",
		],
		examples: [
			"1. Open file at path/to/file.ts\n2. Find line 42\n3. Replace 'const x = 5' with 'const x = 10'\n4. Save the file\n5. Run npm test\n6. Verify all tests pass",
			"Add exactly this code block at line 15:\n```typescript\nconst config = {\n  apiKey: process.env.API_KEY,\n  timeout: 5000\n};\n```",
		],
		useCases: [
			"Precise requirements",
			"High-risk operations",
			"Exact replication needed",
		],
		cognitiveLoad: "low",
		autonomyLevel: "high",
	},
];

const PromptingHierarchyEvaluatorSchema = z.object({
	promptText: z.string().describe("The prompt text to evaluate"),
	targetLevel: PromptingHierarchyLevel.optional().describe(
		"Expected hierarchy level (if known)",
	),
	context: z.string().optional().describe("Additional context about the task"),
	includeRecommendations: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
});

type PromptingHierarchyEvaluatorInput = z.infer<
	typeof PromptingHierarchyEvaluatorSchema
>;

/**
 * Evaluate a prompt against the hierarchy levels and provide numeric scoring
 */
function evaluatePromptHierarchy(
	input: PromptingHierarchyEvaluatorInput,
): NumericEvaluation {
	const { promptText, targetLevel } = input;

	// Analyze prompt characteristics
	const hasSteps = /\d+\.|step \d+|first.*then.*finally/i.test(promptText);
	const hasExamples = /example|e\.g\.|for instance|such as|```/i.test(
		promptText,
	);
	const hasHints = /consider|think about|look at|keep in mind/i.test(
		promptText,
	);
	const isVague =
		/improve|optimize|enhance|better/i.test(promptText) &&
		promptText.length < 100;
	const isDetailed = promptText.length > 500;
	const hasSpecificInstructions =
		/implement|add|create|refactor|update|change/i.test(promptText);

	// Determine hierarchy level
	let detectedLevel: PromptingHierarchyLevel;
	let hierarchyConfidence = 75;

	if (isVague && !hasSpecificInstructions) {
		detectedLevel = "independent";
	} else if (hasHints && !hasExamples && !hasSteps) {
		detectedLevel = "indirect";
	} else if (hasSpecificInstructions && !hasSteps && !hasExamples) {
		detectedLevel = "direct";
	} else if (hasExamples && !hasSteps) {
		detectedLevel = "modeling";
	} else if (hasSteps && !isDetailed) {
		detectedLevel = "scaffolding";
	} else if (hasSteps && isDetailed) {
		detectedLevel = "full-physical";
		hierarchyConfidence = 85;
	} else {
		detectedLevel = "direct";
		hierarchyConfidence = 60;
	}

	// Calculate clarity score
	const wordCount = promptText.split(/\s+/).length;
	const sentenceCount = promptText.split(/[.!?]+/).length;
	const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
	const clarity = Math.min(
		100,
		Math.max(0, 100 - Math.abs(avgWordsPerSentence - 15) * 2),
	);

	// Calculate specificity score
	const specificWords = (
		promptText.match(
			/\b(implement|create|add|update|refactor|configure|set|define)\b/gi,
		) || []
	).length;
	const specificity = Math.min(
		100,
		specificWords * 15 + (hasSpecificInstructions ? 30 : 0),
	);

	// Calculate completeness score
	const hasContext = /context|background|because|due to|in order to/i.test(
		promptText,
	);
	const hasGoal = /goal|objective|purpose|aim/i.test(promptText);
	const hasConstraints = /must|should|requirement|constraint|limit/i.test(
		promptText,
	);
	const completeness =
		(hasContext ? 25 : 0) +
		(hasGoal ? 25 : 0) +
		(hasConstraints ? 25 : 0) +
		(wordCount > 50 ? 25 : wordCount / 2);

	// Calculate structure score
	const hasHeadings = /^#+\s/m.test(promptText);
	const hasBullets = /^[-*]\s/m.test(promptText);
	const hasNumbering = /^\d+\.\s/m.test(promptText);
	const structure =
		(hasHeadings ? 35 : 0) + (hasBullets ? 35 : 0) + (hasNumbering ? 30 : 0);

	// Calculate cognitive complexity
	const complexWords = (promptText.match(/\b\w{10,}\b/g) || []).length;
	const technicalTerms = (
		promptText.match(
			/\b(API|SDK|framework|architecture|algorithm|implementation)\b/gi,
		) || []
	).length;
	const cognitiveComplexity = Math.min(
		100,
		complexWords * 2 + technicalTerms * 3 + (isDetailed ? 20 : 0),
	);

	// Calculate hierarchy score (how well it matches detected/target level)
	const hierarchyScore = targetLevel
		? targetLevel === detectedLevel
			? 90
			: 50
		: hierarchyConfidence;

	// Calculate overall score
	const overallScore = Math.round(
		(clarity + specificity + completeness + structure + hierarchyScore) / 5,
	);

	// Predict effectiveness (RL-inspired reward signal)
	// Higher scores for appropriate complexity and clear structure
	const effectivenessFactors = [
		clarity > 60 ? 20 : 10,
		specificity > 50 ? 20 : 10,
		completeness > 60 ? 20 : 10,
		structure > 40 ? 20 : 10,
		hierarchyScore > 70 ? 20 : 10,
	];
	const predictedEffectiveness = effectivenessFactors.reduce(
		(sum, val) => sum + val,
		0,
	);

	return {
		overallScore: Math.round(overallScore),
		clarity: Math.round(clarity),
		specificity: Math.round(specificity),
		completeness: Math.round(completeness),
		structure: Math.round(structure),
		hierarchyLevel: detectedLevel,
		hierarchyScore: Math.round(hierarchyScore),
		cognitiveComplexity: Math.round(cognitiveComplexity),
		predictedEffectiveness: Math.round(predictedEffectiveness),
		confidence: Math.round(hierarchyConfidence),
	};
}

/**
 * Generate recommendations based on evaluation
 */
function generateRecommendations(
	evaluation: NumericEvaluation,
	targetLevel?: PromptingHierarchyLevel,
): string[] {
	const recommendations: string[] = [];

	if (evaluation.clarity < 60) {
		recommendations.push(
			"📝 Improve clarity: Use shorter sentences (12-20 words) and clearer language",
		);
	}

	if (evaluation.specificity < 50) {
		recommendations.push(
			"🎯 Increase specificity: Add concrete action verbs and detailed requirements",
		);
	}

	if (evaluation.completeness < 60) {
		recommendations.push(
			"✅ Enhance completeness: Include context, goals, and constraints",
		);
	}

	if (evaluation.structure < 40) {
		recommendations.push(
			"🏗️ Improve structure: Use headings, bullet points, or numbered steps",
		);
	}

	if (targetLevel && evaluation.hierarchyLevel !== targetLevel) {
		const currentDef = HIERARCHY_LEVEL_DEFINITIONS.find(
			(d) => d.level === evaluation.hierarchyLevel,
		);
		const targetDef = HIERARCHY_LEVEL_DEFINITIONS.find(
			(d) => d.level === targetLevel,
		);
		recommendations.push(
			`🎚️ Adjust hierarchy level: Current level is "${currentDef?.name}", target is "${targetDef?.name}". ${getHierarchyAdjustmentAdvice(evaluation.hierarchyLevel, targetLevel)}`,
		);
	}

	if (evaluation.cognitiveComplexity > 70) {
		recommendations.push(
			"🧠 Reduce cognitive complexity: Simplify language and break down complex concepts",
		);
	}

	if (evaluation.predictedEffectiveness < 60) {
		recommendations.push(
			"⚡ Boost effectiveness: Combine clear structure, specific instructions, and appropriate support level",
		);
	}

	return recommendations;
}

function getHierarchyAdjustmentAdvice(
	current: PromptingHierarchyLevel,
	target: PromptingHierarchyLevel,
): string {
	const levels = [
		"independent",
		"indirect",
		"direct",
		"modeling",
		"scaffolding",
		"full-physical",
	];
	const currentIdx = levels.indexOf(current);
	const targetIdx = levels.indexOf(target);

	if (targetIdx > currentIdx) {
		return "Add more structure, examples, or step-by-step guidance to increase support level.";
	} else {
		return "Remove some detailed instructions or steps to give more autonomy.";
	}
}

export async function promptingHierarchyEvaluator(args: unknown) {
\ttry {
\t\temitDeprecationWarning({
\t\t\ttool: "prompting-hierarchy-evaluator",
\t\t\treplacement: "prompt-hierarchy",
\t\t\tdeprecatedIn: "v0.14.0",
\t\t\tremovedIn: "v0.15.0",
\t\t});

\t\tconst input = PromptingHierarchyEvaluatorSchema.parse(args);

\t\tconst evaluation = evaluatePromptHierarchy(input);
\t\tconst recommendations = input.includeRecommendations
\t\t\t? generateRecommendations(evaluation, input.targetLevel)
\t\t\t: [];

\t\tconst levelDefinition = HIERARCHY_LEVEL_DEFINITIONS.find(
\t\t\t(d) => d.level === evaluation.hierarchyLevel,
\t\t);

\t\tlet output = `# Prompting Hierarchy Evaluation\n\n`;

\t\t// Overview
\t\toutput += `## 📊 Evaluation Summary\n\n`;
\t\toutput += `**Overall Score**: ${evaluation.overallScore}/100\n`;
\t\toutput += `**Predicted Effectiveness**: ${evaluation.predictedEffectiveness}/100\n`;
\t\toutput += `**Confidence**: ${evaluation.confidence}%\n\n`;

\t\t// Hierarchy Level
\t\toutput += `## 🎚️ Hierarchy Level: ${levelDefinition?.name}\n\n`;
\t\toutput += `${levelDefinition?.description}\n\n`;
\t\toutput += `**Characteristics**:\n`;
\t\tfor (const char of levelDefinition?.characteristics || []) {
\t\t\toutput += `- ${char}\n`;
\t\t}
\t\toutput += `\n**Cognitive Load**: ${levelDefinition?.cognitiveLoad}\n`;
\t\toutput += `**Autonomy Level**: ${levelDefinition?.autonomyLevel}\n\n`;

\t\t// Component Scores
\t\toutput += `## 📈 Component Scores\n\n`;
\t\toutput += `| Component | Score | Status |\n`;
\t\toutput += `|-----------|-------|--------|\n`;
\t\toutput += `| Clarity | ${evaluation.clarity}/100 | ${getScoreEmoji(evaluation.clarity)} |\n`;
\t\toutput += `| Specificity | ${evaluation.specificity}/100 | ${getScoreEmoji(evaluation.specificity)} |\n`;
\t\toutput += `| Completeness | ${evaluation.completeness}/100 | ${getScoreEmoji(evaluation.completeness)} |\n`;
\t\toutput += `| Structure | ${evaluation.structure}/100 | ${getScoreEmoji(evaluation.structure)} |\n`;

\t\t// Recommendations
\t\tif (recommendations.length > 0) {
\t\t\toutput += `\n## 🛠️ Recommendations\n\n`;
\t\t\tfor (const rec of recommendations) {
\t\t\t\toutput += `- ${rec}\n`;
\t\t\t}
\t\t}

\t\t// Additional Guidance
\t\toutput += `\n## 📚 Additional Guidance\n`;
\t\toutput += `- Adjust prompt hierarchy level to match agent capability\n`;
\t\toutput += `- Use modeling/scaffolding for less capable agents or complex tasks\n`;
\t\toutput += `- Provide examples and intermediate outputs for higher reliability\n`;
\t\toutput += `- Balance autonomy and guidance based on risk and complexity\n`;

\t\t// Further reading references
\t\toutput += `\n${buildFurtherReadingSection()}\n`;

\t\treturn {
\t\t\tcontent: [
\t\t\t\t{
\t\t\t\t\ttype: "text",
\t\t\t\t\ttext: output,
\t\t\t\t},
\t\t\t],
\t\t};
\t} catch (error) {
\t\treturn handleToolError(error);
\t}
}


function getScoreEmoji(score: number): string {
	if (score >= 85) return "✅ Excellent";
	if (score >= 70) return "👍 Good";
	if (score >= 50) return "⚠️ Fair";
	return "❌ Needs Improvement";
}

function getComplexityEmoji(complexity: number): string {
	if (complexity >= 70) return "🔴 High";
	if (complexity >= 40) return "🟡 Medium";
	return "🟢 Low";
}
