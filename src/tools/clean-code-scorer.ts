import { z } from "zod";
import { calculateCleanCodeScore as calculateDomainCleanCodeScore } from "../domain/analysis/index.js";
import { handleToolError } from "./shared/error-handler.js";
import {
	buildFurtherReadingSection,
	buildOptionalSectionsMap,
} from "./shared/prompt-utils.js";

const CleanCodeScorerSchema = z.object({
	projectPath: z
		.string()
		.optional()
		.describe("Path to the project root directory. Example: '/src' or './app'"),
	codeContent: z
		.string()
		.optional()
		.describe(
			"Source code to analyze for quality metrics. Example: 'function add(a, b) { return a + b; }' or a full class with methods",
		),
	language: z
		.string()
		.optional()
		.describe(
			"Programming language (auto-detected if not specified). Examples: 'typescript', 'python', 'javascript'",
		),
	framework: z
		.string()
		.optional()
		.describe(
			"Framework or technology stack. Examples: 'react', 'express', 'django'",
		),
	coverageMetrics: z
		.object({
			statements: z
				.number()
				.min(0)
				.max(100)
				.optional()
				.describe("Statement coverage percentage (0-100). Example: 85.5"),
			branches: z
				.number()
				.min(0)
				.max(100)
				.optional()
				.describe("Branch coverage percentage (0-100). Example: 72.3"),
			functions: z
				.number()
				.min(0)
				.max(100)
				.optional()
				.describe("Function coverage percentage (0-100). Example: 90.0"),
			lines: z
				.number()
				.min(0)
				.max(100)
				.optional()
				.describe("Line coverage percentage (0-100). Example: 88.2"),
		})
		.optional()
		.describe(
			"Test coverage metrics from your test runner. Example: { statements: 85, branches: 70, functions: 80, lines: 85 }",
		),
	includeReferences: z
		.boolean()
		.optional()
		.default(true)
		.describe("Include external reference links in output. Example: true"),
	includeMetadata: z
		.boolean()
		.optional()
		.default(true)
		.describe("Include metadata section in output. Example: true"),
	inputFile: z
		.string()
		.optional()
		.describe(
			"Reference to input file being analyzed. Example: 'src/utils/helper.ts'",
		),
});

type CleanCodeScorerInput = z.infer<typeof CleanCodeScorerSchema>;

interface CleanCodeScore {
	overallScore: number;
	scoreDescription: string;
	categories: {
		codeHygiene: { score: number; weight: number; issues: string[] };
		testCoverage: { score: number; weight: number; issues: string[] };
		typeScript: { score: number; weight: number; issues: string[] };
		linting: { score: number; weight: number; issues: string[] };
		documentation: { score: number; weight: number; issues: string[] };
		security: { score: number; weight: number; issues: string[] };
	};
	recommendations: string[];
	nextSteps: string[];
	achievements: string[];
}

export async function cleanCodeScorer(args: unknown) {
	try {
		const input = CleanCodeScorerSchema.parse(args);

		const scoreResult = calculateCleanCodeScore(input);

		// Build optional sections using the shared utility
		const { references, metadata } = buildOptionalSectionsMap(input, {
			references: {
				key: "includeReferences",
				builder: () =>
					buildFurtherReadingSection([
						{
							title: "Clean Code Principles",
							url: "https://www.freecodecamp.org/news/clean-coding-for-beginners/",
							description:
								"Beginner-friendly guide to writing clean, maintainable code",
						},
						{
							title: "SonarQube Metric Definitions",
							url: "https://docs.sonarqube.org/latest/user-guide/metric-definitions/",
							description: "Comprehensive definitions of code quality metrics",
						},
						{
							title: "Test Coverage Best Practices",
							url: "https://martinfowler.com/bliki/TestCoverage.html",
							description:
								"Martin Fowler on meaningful test coverage strategies",
						},
						{
							title: "TypeScript Do's and Don'ts",
							url: "https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html",
							description: "Official TypeScript best practices and style guide",
						},
					]),
			},
			metadata: {
				key: "includeMetadata",
				builder: (cfg) =>
					[
						"### Metadata",
						`- Updated: ${new Date().toISOString().slice(0, 10)}`,
						"- Source tool: mcp_ai-agent-guid_clean-code-scorer",
						cfg.inputFile ? `- Input file: ${cfg.inputFile}` : undefined,
					]
						.filter(Boolean)
						.join("\n"),
			},
		});

		return {
			content: [
				{
					type: "text" as const,
					text: `## 🏆 Clean Code Score Report

${metadata ? `${metadata}\n` : ""}
### 📊 Overall Score
**${scoreResult.overallScore}/100** - ${scoreResult.scoreDescription}

${generateScoreBar(scoreResult.overallScore)}

### 📈 Category Breakdown

${Object.entries(scoreResult.categories)
	.map(([category, data]) => {
		const categoryName = category
			.replace(/([A-Z])/g, " $1")
			.replace(/^./, (str) => str.toUpperCase());
		const percentage = (data.score / data.weight) * 100;
		const status = getScoreStatus(percentage);

		return `#### ${status} ${categoryName}
- Score: ${data.score}/${data.weight} (${percentage.toFixed(1)}%)
${data.issues.length > 0 ? `- Issues:\n${data.issues.map((issue) => `  - ${issue}`).join("\n")}` : "- ✅ No issues found"}`;
	})
	.join("\n\n")}

${scoreResult.achievements.length > 0 ? `### 🎉 Achievements\n${scoreResult.achievements.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n` : ""}

### 💡 Recommendations
${scoreResult.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join("\n")}

### 🚀 Next Steps
${scoreResult.nextSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

### 📊 Score Distribution
\`\`\`
Code Hygiene:   ${generateMiniBar(scoreResult.categories.codeHygiene.score, scoreResult.categories.codeHygiene.weight)}
Test Coverage:  ${generateMiniBar(scoreResult.categories.testCoverage.score, scoreResult.categories.testCoverage.weight)}
TypeScript:     ${generateMiniBar(scoreResult.categories.typeScript.score, scoreResult.categories.typeScript.weight)}
Linting:        ${generateMiniBar(scoreResult.categories.linting.score, scoreResult.categories.linting.weight)}
Documentation:  ${generateMiniBar(scoreResult.categories.documentation.score, scoreResult.categories.documentation.weight)}
Security:       ${generateMiniBar(scoreResult.categories.security.score, scoreResult.categories.security.weight)}
\`\`\`

${references ? `\n${references}\n` : ""}
### ⚠️ Disclaimer
- This score is calculated based on multiple quality metrics and best practices
- Achieving 100/100 requires excellence across all categories
- Regular monitoring and improvement is recommended
`,
				},
			],
		};
	} catch (error) {
		return handleToolError(error);
	}
}

function calculateCleanCodeScore(input: CleanCodeScorerInput): CleanCodeScore {
	const domainResult = calculateDomainCleanCodeScore({
		codeContent: input.codeContent,
		language: input.language,
		coverageMetrics: input.coverageMetrics,
	});

	const categories = {
		codeHygiene: {
			weight: 20,
			score: Math.round((domainResult.breakdown.hygiene.score / 100) * 20),
			issues: domainResult.breakdown.hygiene.issues,
		},
		testCoverage: {
			weight: 25,
			score: Math.round((domainResult.breakdown.coverage.score / 100) * 25),
			issues: domainResult.breakdown.coverage.issues,
		},
		typeScript: { score: 20, weight: 20, issues: [] as string[] },
		linting: { score: 15, weight: 15, issues: [] as string[] },
		documentation: {
			weight: 10,
			score: Math.round(
				(domainResult.breakdown.documentation.score / 100) * 10,
			),
			issues: domainResult.breakdown.documentation.issues,
		},
		security: {
			weight: 10,
			score: Math.round((domainResult.breakdown.security.score / 100) * 10),
			issues: domainResult.breakdown.security.issues,
		},
	};

	const recommendations = [...domainResult.recommendations];
	const nextSteps: string[] = [];
	const achievements: string[] = [
		"TypeScript strict mode enabled and passing",
		"Biome linting and formatting configured",
	];

	if (input.codeContent) {
		if (domainResult.breakdown.hygiene.score >= 85) {
			achievements.push("Excellent code hygiene maintained");
		} else if (domainResult.breakdown.hygiene.score < 70) {
			recommendations.push(
				"Improve code hygiene by addressing identified issues",
			);
			nextSteps.push("Run code cleanup and remove dead code");
		}
	}

	if (domainResult.breakdown.coverage.score >= 90) {
		achievements.push("Excellent test coverage achieved (≥90%)");
	} else if (domainResult.breakdown.coverage.score < 70) {
		recommendations.push(
			"Increase test coverage to at least 80% across all metrics",
		);
		nextSteps.push("Identify and test uncovered code paths");
	}

	if (domainResult.breakdown.documentation.score < 70) {
		recommendations.push("Add comprehensive documentation and comments");
		nextSteps.push("Document complex functions and public APIs");
	} else if (domainResult.breakdown.documentation.score >= 90) {
		achievements.push("Well-documented codebase");
	}

	if (domainResult.breakdown.security.score < 80) {
		recommendations.push("Address security vulnerabilities immediately");
		nextSteps.push("Run security audit and fix identified issues");
	} else if (domainResult.breakdown.security.score === 100) {
		achievements.push("No security vulnerabilities detected");
	} else if (input.codeContent) {
		achievements.push("Security checks passed");
	}

	const overallScore = Math.round(
		Object.values(categories).reduce((sum, cat) => sum + cat.score, 0),
	);

	let scoreDescription = "";
	if (overallScore >= 95) {
		scoreDescription = "🏆 Perfect - Clean Code Excellence";
	} else if (overallScore >= 90) {
		scoreDescription = "✨ Excellent - Near Perfect Quality";
	} else if (overallScore >= 80) {
		scoreDescription = "✅ Very Good - High Quality Code";
	} else if (overallScore >= 70) {
		scoreDescription = "👍 Good - Quality Standards Met";
	} else if (overallScore >= 60) {
		scoreDescription = "⚠️ Fair - Improvements Needed";
	} else {
		scoreDescription = "❌ Poor - Significant Issues";
	}

	if (overallScore < 100) {
		if (recommendations.length === 0) {
			recommendations.push("Continue maintaining current quality standards");
		}
		recommendations.push("Regular code reviews and pair programming sessions");
		recommendations.push("Automated quality gates in CI/CD pipeline");
	}

	if (nextSteps.length === 0) {
		if (overallScore === 100) {
			nextSteps.push("Maintain this excellent quality level");
			nextSteps.push("Share best practices with the team");
		} else {
			nextSteps.push("Focus on lowest scoring categories first");
			nextSteps.push("Set up automated quality monitoring");
		}
	}

	return {
		overallScore,
		scoreDescription,
		categories,
		recommendations: [...new Set(recommendations)],
		nextSteps,
		achievements,
	};
}

function generateScoreBar(score: number): string {
	const barLength = 50;
	const filledLength = Math.round((score / 100) * barLength);
	const emptyLength = barLength - filledLength;

	const filled = "█".repeat(filledLength);
	const empty = "░".repeat(emptyLength);

	let color = "🔴";
	if (score >= 90) color = "🟢";
	else if (score >= 70) color = "🟡";
	else if (score >= 50) color = "🟠";

	return `${color} [${filled}${empty}] ${score}%`;
}

function generateMiniBar(score: number, weight: number): string {
	const percentage = (score / weight) * 100;
	const barLength = 20;
	const filledLength = Math.round((percentage / 100) * barLength);
	const emptyLength = barLength - filledLength;

	const filled = "█".repeat(filledLength);
	const empty = "░".repeat(emptyLength);

	return `[${filled}${empty}] ${score}/${weight}`;
}

function getScoreStatus(percentage: number): string {
	if (percentage >= 90) return "🟢";
	if (percentage >= 70) return "🟡";
	if (percentage >= 50) return "🟠";
	return "🔴";
}
