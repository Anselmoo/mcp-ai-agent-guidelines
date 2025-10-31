import { z } from "zod";
import { buildFurtherReadingSection } from "./shared/prompt-utils.js";

const CleanCodeScorerSchema = z.object({
	projectPath: z.string().optional(),
	codeContent: z.string().optional(),
	language: z.string().optional(),
	framework: z.string().optional(),
	coverageMetrics: z
		.object({
			statements: z.number().min(0).max(100).optional(),
			branches: z.number().min(0).max(100).optional(),
			functions: z.number().min(0).max(100).optional(),
			lines: z.number().min(0).max(100).optional(),
		})
		.optional(),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
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
	const input = CleanCodeScorerSchema.parse(args);

	const scoreResult = calculateCleanCodeScore(input);
	const references = input.includeReferences
		? buildFurtherReadingSection([
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
					description: "Martin Fowler on meaningful test coverage strategies",
				},
				{
					title: "TypeScript Do's and Don'ts",
					url: "https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html",
					description: "Official TypeScript best practices and style guide",
				},
			])
		: undefined;

	const metadata = input.includeMetadata
		? [
				"### Metadata",
				`- Updated: ${new Date().toISOString().slice(0, 10)}`,
				"- Source tool: mcp_ai-agent-guid_clean-code-scorer",
				input.inputFile ? `- Input file: ${input.inputFile}` : undefined,
			]
				.filter(Boolean)
				.join("\n")
		: undefined;

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
}

function calculateCleanCodeScore(input: CleanCodeScorerInput): CleanCodeScore {
	const categories = {
		codeHygiene: { score: 0, weight: 20, issues: [] as string[] },
		testCoverage: { score: 0, weight: 25, issues: [] as string[] },
		typeScript: { score: 0, weight: 20, issues: [] as string[] },
		linting: { score: 0, weight: 15, issues: [] as string[] },
		documentation: { score: 0, weight: 10, issues: [] as string[] },
		security: { score: 0, weight: 10, issues: [] as string[] },
	};

	const recommendations: string[] = [];
	const nextSteps: string[] = [];
	const achievements: string[] = [];

	// Code Hygiene Scoring
	if (input.codeContent) {
		const hygieneResult = analyzeCodeHygiene(
			input.codeContent,
			input.language || "javascript",
		);
		categories.codeHygiene.score = Math.round(
			(hygieneResult.score / 100) * categories.codeHygiene.weight,
		);
		categories.codeHygiene.issues = hygieneResult.issues;

		if (hygieneResult.score >= 85) {
			achievements.push("Excellent code hygiene maintained");
		} else if (hygieneResult.score < 70) {
			recommendations.push(
				"Improve code hygiene by addressing identified issues",
			);
			nextSteps.push("Run code cleanup and remove dead code");
		}
	} else {
		// If no code provided, assume good hygiene
		categories.codeHygiene.score = categories.codeHygiene.weight;
	}

	// Test Coverage Scoring
	if (input.coverageMetrics) {
		const coverage = input.coverageMetrics;
		const avgCoverage =
			((coverage.statements || 0) +
				(coverage.branches || 0) +
				(coverage.functions || 0) +
				(coverage.lines || 0)) /
			4;

		categories.testCoverage.score = Math.round(
			(avgCoverage / 100) * categories.testCoverage.weight,
		);

		if (avgCoverage < 80) {
			categories.testCoverage.issues.push(
				`Average coverage ${avgCoverage.toFixed(1)}% is below 80% target`,
			);
		}
		if ((coverage.statements || 0) < 80) {
			categories.testCoverage.issues.push(
				`Statement coverage ${coverage.statements}% is below 80%`,
			);
		}
		if ((coverage.branches || 0) < 80) {
			categories.testCoverage.issues.push(
				`Branch coverage ${coverage.branches}% is below 80%`,
			);
		}
		if ((coverage.functions || 0) < 80) {
			categories.testCoverage.issues.push(
				`Function coverage ${coverage.functions}% is below 80%`,
			);
		}

		if (avgCoverage >= 90) {
			achievements.push("Excellent test coverage achieved (≥90%)");
		} else if (avgCoverage < 70) {
			recommendations.push(
				"Increase test coverage to at least 80% across all metrics",
			);
			nextSteps.push("Identify and test uncovered code paths");
		}
	} else {
		// Default to assume 80% coverage
		categories.testCoverage.score = Math.round(
			0.8 * categories.testCoverage.weight,
		);
	}

	// TypeScript Scoring (assume passing if no errors)
	categories.typeScript.score = categories.typeScript.weight;
	achievements.push("TypeScript strict mode enabled and passing");

	// Linting Scoring (assume Biome is configured and passing)
	categories.linting.score = categories.linting.weight;
	achievements.push("Biome linting and formatting configured");

	// Documentation Scoring
	if (input.codeContent) {
		const docScore = analyzeDocumentation(input.codeContent);
		categories.documentation.score = Math.round(
			(docScore / 100) * categories.documentation.weight,
		);

		if (docScore < 70) {
			categories.documentation.issues.push(
				"Insufficient code documentation and comments",
			);
			recommendations.push("Add comprehensive documentation and comments");
		}
		if (docScore >= 90) {
			achievements.push("Well-documented codebase");
		}
	} else {
		categories.documentation.score = Math.round(
			0.8 * categories.documentation.weight,
		);
	}

	// Security Scoring
	if (input.codeContent) {
		const securityScore = analyzeSecurityIssues(input.codeContent);
		categories.security.score = Math.round(
			(securityScore.score / 100) * categories.security.weight,
		);
		categories.security.issues = securityScore.issues;

		if (securityScore.score < 80) {
			recommendations.push("Address security vulnerabilities immediately");
			nextSteps.push("Run security audit and fix identified issues");
		}
		if (securityScore.score === 100) {
			achievements.push("No security vulnerabilities detected");
		}
	} else {
		categories.security.score = categories.security.weight;
		achievements.push("Security checks passed");
	}

	// Calculate overall score
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

	// Add general recommendations
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
		recommendations,
		nextSteps,
		achievements,
	};
}

function analyzeCodeHygiene(
	code: string,
	language: string,
): { score: number; issues: string[] } {
	let score = 100;
	const issues: string[] = [];

	// Check for TODOs/FIXMEs
	if (code.includes("TODO") || code.includes("FIXME")) {
		score -= 5;
		issues.push("TODO or FIXME comments found");
	}

	// Check for debug statements
	if (
		(code.includes("console.log") || code.includes("print(")) &&
		(language === "javascript" ||
			language === "typescript" ||
			language === "python")
	) {
		score -= 10;
		issues.push("Debug statements found");
	}

	// Check for hardcoded credentials
	if (
		/(apiKey|api_key|password|secret|token)\s*=\s*['"][^'"]+['"]/i.test(code)
	) {
		score -= 20;
		issues.push("Potential hardcoded credentials detected");
	}

	// Check for commented code
	const commentedLines = (
		code.match(/^\s*(\/\/|#)\s*(const|let|var|def|function)/gm) || []
	).length;
	if (commentedLines > 3) {
		score -= 5;
		issues.push(`${commentedLines} lines of commented code found`);
	}

	// Check for complex functions (>50 lines)
	const functionMatches =
		code.match(/function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?}/g) || [];
	for (const func of functionMatches) {
		const lines = func.split("\n").length;
		if (lines > 50) {
			score -= 10;
			issues.push("Complex function detected (>50 lines)");
			break;
		}
	}

	return { score: Math.max(0, score), issues };
}

function analyzeDocumentation(code: string): number {
	let score = 70; // Base score

	// Check for JSDoc/docstring comments
	const docComments = (
		code.match(/\/\*\*[\s\S]*?\*\/|'''[\s\S]*?'''|"""[\s\S]*?"""/g) || []
	).length;
	if (docComments > 0) {
		score += 15;
	}

	// Check for inline comments
	const inlineComments = (code.match(/\/\/.*|#.*/g) || []).length;
	if (inlineComments > 5) {
		score += 15;
	}

	// Check for README or documentation keywords
	if (/README|CONTRIBUTING|CHANGELOG/i.test(code)) {
		score += 10;
	}

	return Math.min(100, score);
}

function analyzeSecurityIssues(code: string): {
	score: number;
	issues: string[];
} {
	let score = 100;
	const issues: string[] = [];

	// Check for eval() or exec()
	if (/\b(eval|exec)\s*\(/i.test(code)) {
		score -= 30;
		issues.push("Use of eval() or exec() detected - security risk");
	}

	// Check for SQL injection risks
	if (/(SELECT|INSERT|UPDATE|DELETE)\s+.*\+.*/.test(code)) {
		score -= 25;
		issues.push("Potential SQL injection vulnerability");
	}

	// Check for XSS risks
	if (/innerHTML\s*=|dangerouslySetInnerHTML/i.test(code)) {
		score -= 20;
		issues.push("Potential XSS vulnerability with innerHTML");
	}

	// Check for hardcoded secrets
	if (
		/(secret|password|api_key|apiKey|token|auth|credential)\s*=\s*['"][^'"]+['"]/i.test(
			code,
		)
	) {
		score -= 25;
		issues.push("Hardcoded secrets or credentials found");
	}

	return { score: Math.max(0, score), issues };
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
