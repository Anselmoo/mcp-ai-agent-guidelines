import { z } from "zod";
import {
	CATEGORY_CONFIG,
	type CategoryConfig,
} from "./config/guidelines-config.js";
import { handleToolError } from "./shared/error-handler.js";

const GuidelinesValidationSchema = z.object({
	practiceDescription: z
		.string()
		.describe("Description of the development practice to validate"),
	category: z
		.enum([
			"prompting",
			"code-management",
			"architecture",
			"visualization",
			"memory",
			"workflow",
		])
		.describe("Category of practice to validate against guidelines"),
	includeReferences: z
		.boolean()
		.describe("Include external reference links")
		.optional()
		.default(true),
	includeMetadata: z
		.boolean()
		.describe("Include metadata section")
		.optional()
		.default(true),
	inputFile: z.string().describe("Input file path for reference").optional(),
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
	try {
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
`,
				},
			],
		};
	} catch (error) {
		return handleToolError(error);
	}
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

// Legacy per-category validators replaced by config-driven approach above.
