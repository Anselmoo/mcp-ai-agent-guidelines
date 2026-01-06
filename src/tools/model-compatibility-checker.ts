import { z } from "zod";
import {
	BUDGET_ADJUSTMENTS,
	BUDGET_BONUS,
	BUDGET_PENALTY,
	CAPABILITY_WEIGHTS,
	MODELS,
	REQUIREMENT_KEYWORDS,
	type ScoredModel,
} from "./config/model-config.js";
import {
	generatePythonExample,
	generateTypeScriptExample,
} from "./config/model-examples.js";
import { handleToolError } from "./shared/error-handler.js";

const ModelCompatibilitySchema = z.object({
	taskDescription: z.string(),
	requirements: z.array(z.string()).optional(),
	budget: z.enum(["low", "medium", "high"]).optional(),
	// Optional additions
	language: z.string().optional(), // for example snippets (e.g., 'typescript', 'python')
	includeReferences: z.boolean().optional().default(true),
	includeCodeExamples: z.boolean().optional().default(true),
	linkFiles: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
});

type ModelCompatibilityInput = z.infer<typeof ModelCompatibilitySchema>;

interface ModelRecommendation extends ScoredModel {}

export async function modelCompatibilityChecker(args: unknown) {
	try {
		const input = ModelCompatibilitySchema.parse(args);

		const analysis = analyzeModelCompatibility(input);

		const codeExamples = input.includeCodeExamples
			? buildCodeExamples(input.language)
			: undefined;
		const fileLinks = input.linkFiles ? buildFileLinks() : undefined;

		const metadata = input.includeMetadata
			? [
					"### Metadata",
					`- Updated: ${new Date().toISOString().slice(0, 10)}`,
					"- Source tool: mcp_ai-agent-guid_model-compatibility-checker",
					input.inputFile ? `- Input file: ${input.inputFile}` : undefined,
					"",
				]
					.filter(Boolean)
					.join("\n")
			: "";

		return {
			content: [
				{
					type: "text",
					text: `## 🤖 AI Model Compatibility Analysis (Qualitative)

${metadata}

### Task Analysis
**Description**: ${input.taskDescription}
**Requirements**: ${input.requirements?.join(", ") || "None specified"}
**Budget**: ${input.budget || "Not specified"}


### Top Recommendations (Qualitative)

${analysis.recommendations
	.slice(0, 3)
	.map(
		(model, index) =>
			`#### ${index + 1}. ${model.name} (${model.provider})
**Fit Summary**: ${model.strengths[0] || "General purpose"}
**Context Handling**: ${model.contextWindow} (refer to provider docs)
**Notes**: ${model.limitations[0] || "No major caveats documented"}

**Highlights**:
${(model.specialFeatures || []).map((f) => `- ${f}`).join("\n")}
`,
	)
	.join("\n")}

### Selection Snapshot

| Model | Provider | Best For |
|-------|----------|----------|
${(analysis.recommendations || [])
	.map(
		(model) =>
			`| ${model.name} | ${model.provider} | ${model.strengths[0] || "General use"} |`,
	)
	.join("\n")}

### Selection Guidelines

**For Code Generation**: Choose models with strong reasoning capabilities and code-specific training
**For Analysis Tasks**: Prioritize models with large context windows and analytical strength
**For Creative Tasks**: Select models optimized for creative writing and diverse outputs
**For Production Use**: Consider latency, cost, and reliability alongside capability

### Usage Optimization Tips
1. **Start with smaller models** for prototyping and testing
2. **Use prompt caching** for repeated system messages
3. **Implement model switching** based on task complexity
4. **Monitor token usage** and optimize prompts for efficiency
5. **Consider fine-tuning** for specialized, high-volume use cases

### Evaluation Method
Heuristic fit against requirement keywords; qualitative only. Validate with quick benchmarks in your stack.

### Rolling Model Updates
- Config-driven list (context windows, tiers, capabilities) periodically refreshed
- Capability weights & budget adjustments may evolve

${codeExamples ? `### Code Examples
${codeExamples}
` : ""}
${fileLinks ? `### Configuration & Files
${fileLinks}
` : ""}
${
	input.includeReferences
		? `### References
- GitHub Copilot model comparison (task-based): https://docs.github.com/en/copilot/reference/ai-models/model-comparison#recommended-models-by-task
- OpenAI models overview: https://platform.openai.com/docs/models
- Anthropic Claude models: https://docs.anthropic.com/en/docs/about-claude/models
- Google Gemini models: https://ai.google.dev/gemini-api/docs/models

`
		: ""
}### Disclaimer
- This tool provides qualitative recommendations and links to official docs.
- Capabilities evolve; verify with provider docs and test in your environment before adoption.
`,
				},
			],
		};
	} catch (error) {
		return handleToolError(error);
	}
}

function analyzeModelCompatibility(input: ModelCompatibilityInput): {
	recommendations: ModelRecommendation[];
} {
	const text = [input.taskDescription, ...(input.requirements || [])]
		.join(" ")
		.toLowerCase();
	const matchedCaps = new Set<string>();
	for (const [cap, words] of Object.entries(REQUIREMENT_KEYWORDS)) {
		if (words.some((w) => text.includes(w))) matchedCaps.add(cap);
	}
	const budgetAdj = input.budget ? BUDGET_ADJUSTMENTS[input.budget] : undefined;
	const scored: ModelRecommendation[] = MODELS.map((m) => {
		let score = m.baseScore;
		const breakdown: string[] = [`Base: ${m.baseScore}`];
		for (const cap of matchedCaps) {
			if (m.capabilities.includes(cap)) {
				const add = CAPABILITY_WEIGHTS[cap] || 0;
				score += add;
				breakdown.push(`+${add} ${cap}`);
			}
		}
		if (budgetAdj && input.budget) {
			if (budgetAdj.bonus.includes(m.pricingTier)) {
				score += BUDGET_BONUS;
				breakdown.push(`+${BUDGET_BONUS} budget alignment (${input.budget})`);
			}
			if (budgetAdj.penalty.includes(m.pricingTier)) {
				score -= BUDGET_PENALTY;
				breakdown.push(`-${BUDGET_PENALTY} budget penalty (${m.pricingTier})`);
			}
		}
		score = Math.max(0, Math.min(100, score));
		return {
			name: m.name,
			provider: m.provider,
			pricing: m.pricing,
			contextWindow: `${Intl.NumberFormat().format(m.contextTokens)} tokens`,
			strengths: m.strengths,
			limitations: m.limitations,
			specialFeatures: m.specialFeatures,
			score,
			breakdown,
		};
	});
	return { recommendations: scored.sort((a, b) => b.score - a.score) };
}

// references moved inline in output for simplicity and always-on links

function buildCodeExamples(language?: string): string {
	const lang = (language || "typescript").toLowerCase();
	if (lang.includes("python")) {
		return generatePythonExample();
	}
	// default TypeScript/JavaScript
	return generateTypeScriptExample();
}

function buildFileLinks(): string {
	return [
		"- Update model profiles in: src/tools/config/model-config.ts",
		"- See selection guidance resource: guidelines://model-selection",
		"- Server tool exposing this analysis: src/tools/model-compatibility-checker.ts",
	].join("\n");
}
