import { z } from "zod";
import {
	CATEGORY_CONFIG,
	type CategoryConfig,
} from "./config/guidelines-config.js";
import { buildReferencesSection } from "./shared/prompt-utils.js";

const GuidelinesValidationSchema = z.object({
	practiceDescription: z.string(),
	category: z.enum([
		"prompting",
		"code-management",
		"architecture",
		"visualization",
		"memory",
		"workflow",
	]),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
});

type GuidelinesValidationInput = z.infer<typeof GuidelinesValidationSchema>;

interface ValidationResult {
	compliance: "excellent" | "good" | "fair" | "poor";
	score: number;
	strengths: string[];
	issues: string[];
	recommendations: string[];
	bestPractices: string[];
}

export async function guidelinesValidator(args: unknown) {
	// Accept alias 'description' for practiceDescription for broader compatibility
	const pre = ((): unknown => {
		if (args && typeof args === "object" && args !== null) {
			const obj = args as Record<string, unknown>;
			if (
				obj.practiceDescription === undefined &&
				typeof obj.description === "string"
			) {
				return { ...obj, practiceDescription: obj.description };
			}
		}
		return args;
	})();
	const input = GuidelinesValidationSchema.parse(pre);

	const validation = validateAgainstGuidelines(input);
	const references = input.includeReferences
		? buildReferencesSection(
				buildCategoryReferences(input.category, true) as string[],
			)
		: undefined;
	const metadata = input.includeMetadata
		? [
				"### Metadata",
				`- Updated: ${new Date().toISOString().slice(0, 10)}`,
				"- Source tool: mcp_ai-agent-guid_guidelines-validator",
				input.inputFile ? `- Input file: ${input.inputFile}` : undefined,
				`- Category: ${input.category}`,
				"",
			]
				.filter(Boolean)
				.join("\n")
		: "";

	return {
		content: [
			{
				type: "text",
				text: `## ✅ AI Agent Development Guidelines Validation

${metadata}

### 📋 Practice Analysis
| Field | Value |
|---|---|
| Category | ${input.category} |
| Description | ${input.practiceDescription} |

### 📊 Compliance Assessment
| Metric | Value |
|---|---|
| Overall Score | ${validation.score}/100 |
| Compliance Level | ${validation.compliance.toUpperCase()} |

${
	validation.compliance === "excellent"
		? "🟢 **Excellent compliance** - Your practice aligns very well with established guidelines"
		: validation.compliance === "good"
			? "🟡 **Good compliance** - Minor improvements recommended"
			: validation.compliance === "fair"
				? "🟠 **Fair compliance** - Several areas need attention"
				: "🔴 **Poor compliance** - Significant improvements needed"
}

### ⭐ Strengths Identified
${validation.strengths.map((strength, index) => `${index + 1}. ✅ ${strength}`).join("\n")}

### 🐞 Issues Found
${
	validation.issues.length > 0
		? validation.issues
				.map((issue, index) => `${index + 1}. ❌ ${issue}`)
				.join("\n")
		: "*No significant issues identified*"
}

### 🔧 Recommendations
${validation.recommendations.map((rec, index) => `${index + 1}. 🔧 ${rec}`).join("\n")}

### 📚 Best Practices for ${input.category.charAt(0).toUpperCase() + input.category.slice(1)}
${validation.bestPractices.map((practice, index) => `${index + 1}. 📋 ${practice}`).join("\n")}

### 🔗 Guidelines Reference
For detailed information on AI agent development best practices, refer to:
- **Hierarchical Prompting**: Structure prompts in layers of increasing specificity
- **Code Hygiene**: Maintain clean, well-documented, and regularly refactored code
- **Memory Optimization**: Implement efficient context management and caching
- **Visualization**: Use Mermaid diagrams for clear system documentation
- **Sprint Planning**: Apply data-driven timeline estimation and risk assessment
- **Model Selection**: Choose appropriate models based on task requirements and constraints

### ♻️ Continuous Improvement
- Regular validation against updated guidelines
- Peer review of development practices
- Monitoring of industry best practices evolution
- Iterative refinement based on project outcomes
${references ? `\n${references}\n` : ""}
\n### ⚠️ Disclaimer\n- These are recommendations, not guarantees. Validate with your context and current provider documentation.
`,
			},
		],
	};
}

function validateAgainstGuidelines(
	input: GuidelinesValidationInput,
): ValidationResult {
	const { practiceDescription, category } = input;
	const config: CategoryConfig | undefined = CATEGORY_CONFIG[category];
	if (!config) {
		return {
			compliance: "poor",
			score: 0,
			strengths: [],
			issues: ["Unknown category"],
			recommendations: ["Use a supported category"],
			bestPractices: [],
		};
	}
	const text = practiceDescription.toLowerCase();
	let score = config.base;
	const strengths: string[] = [];
	const issues: string[] = [];
	const recommendations: string[] = [];
	for (const criterion of config.criteria) {
		const hit = criterion.keywords.some((k) => text.includes(k));
		if (hit) {
			score += criterion.weight;
			strengths.push(criterion.strength);
		} else if (!criterion.optional) {
			issues.push(criterion.issue);
			recommendations.push(criterion.recommendation);
		}
	}
	score = Math.min(100, score);
	let compliance: ValidationResult["compliance"];
	if (score >= 80) compliance = "excellent";
	else if (score >= 65) compliance = "good";
	else if (score >= 45) compliance = "fair";
	else compliance = "poor";
	return {
		compliance,
		score,
		strengths,
		issues,
		recommendations,
		bestPractices: config.bestPractices,
	};
}

function buildCategoryReferences(
	category: string,
	asList = false,
): string[] | string {
	const common = [
		"Prompt caching (Anthropic): https://www.anthropic.com/news/prompt-caching",
		"Mermaid.js: https://github.com/mermaid-js/mermaid",
	];
	const byCat: Record<string, string[]> = {
		prompting: [
			"Hierarchical Prompting: https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions",
			"Best Practices (2025): https://www.dataunboxed.io/blog/the-complete-guide-to-prompt-engineering-15-essential-techniques-for-2025",
		],
		"code-management": [
			"Refactoring legacy code: https://graphite.dev/guides/refactoring-legacy-code-best-practices-techniques",
		],
		architecture: ["Event-driven, microservices patterns (general references)"],
		visualization: [
			"Kubernetes diagram guide: https://kubernetes.io/docs/contribute/style/diagram-guide/",
		],
		memory: [
			"Prompt caching docs: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
		],
		workflow: [
			"Sprint planning tools overview (ZenHub 2025): https://www.zenhub.com/blog-posts/the-7-best-ai-assisted-sprint-planning-tools-for-agile-teams-in-2025",
		],
	} as const;
	const set = [...(byCat[category as keyof typeof byCat] || []), ...common];
	return asList ? set : set.join("\n");
}

// Legacy per-category validators replaced by config-driven approach above.
