import { z } from "zod";
import { buildReferencesSection } from "./shared/prompt-utils.js";

const CodeHygieneSchema = z.object({
	codeContent: z.string(),
	language: z.string(),
	framework: z.string().optional(),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
});

type CodeHygieneInput = z.infer<typeof CodeHygieneSchema>;

export async function codeHygieneAnalyzer(args: unknown) {
	const input = CodeHygieneSchema.parse(args);

	const analysis = analyzeCodeHygiene(input);
	const references = input.includeReferences
		? buildReferencesSection([
				"Refactoring legacy code best practices: https://graphite.dev/guides/refactoring-legacy-code-best-practices-techniques",
				"General code hygiene checklist (community resources)",
			])
		: undefined;

	const metadata = input.includeMetadata
		? [
				"### Metadata",
				`- Updated: ${new Date().toISOString().slice(0, 10)}`,
				"- Source tool: mcp_ai-agent-guid_code-hygiene-analyzer",
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
				text: `## 🧹 Code Hygiene Analysis Report

${metadata}

### 📋 Summary
| Key | Value |
|---|---|
| Language | ${input.language} |
| Framework | ${input.framework || "Not specified"} |
| Issues Found | ${analysis.issues.length} |
| Recommendations | ${analysis.recommendations.length} |

### ❗ Issues Detected
${analysis.issues.map((issue, index) => `${index + 1}. **${issue.type}**: ${issue.description}`).join("\n")}

${
	analysis.issues.length > 0
		? `### 🗂️ Issues Table\n| Type | Description |\n|---|---|\n${analysis.issues
				.map((issue) => `| ${issue.type} | ${issue.description} |`)
				.join("\n")}\n`
		: ""
}

### ✅ Recommendations
${analysis.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join("\n")}

### 🧮 Hygiene Score
**${analysis.score}/100** - ${analysis.scoreDescription}

### ▶️ Next Steps
${analysis.nextSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}
${references ? `\n${references}\n` : ""}
\n### ⚠️ Disclaimer\n- Findings are heuristic and may not capture project-specific conventions. Validate changes via code review and tests.
`,
			},
		],
	};
}

function analyzeCodeHygiene(input: CodeHygieneInput) {
	const issues: Array<{
		type: string;
		description: string;
		severity: "critical" | "major" | "minor";
	}> = [];
	const recommendations: string[] = [];
	const nextSteps: string[] = [];

	const code = input.codeContent;
	const language = input.language.toLowerCase();

	// Check for empty or minimal code
	const trimmedCode = code.trim();
	if (trimmedCode.length === 0) {
		issues.push({
			type: "Empty Code",
			description: "No code provided for analysis",
			severity: "critical",
		});
		recommendations.push("Provide code content for meaningful analysis");
	} else if (trimmedCode.length < 20) {
		issues.push({
			type: "Insufficient Code",
			description:
				"Code too short for comprehensive analysis (less than 20 characters)",
			severity: "minor",
		});
		recommendations.push("Provide more substantial code for better analysis");
	}

	// Check for code complexity metrics
	const lines = code.split("\n");
	const nonEmptyLines = lines.filter((line) => line.trim().length > 0).length;
	const codeOnlyLines = lines.filter((line) => {
		const trimmed = line.trim();
		// Count lines that are not comments
		return (
			trimmed.length > 0 &&
			!trimmed.startsWith("//") &&
			!trimmed.startsWith("#") &&
			!trimmed.startsWith("*") &&
			!trimmed.startsWith("/*")
		);
	}).length;

	// Check for lack of documentation
	const hasDocComments =
		/\/\*\*[\s\S]*?\*\/|\/\/\/|#\s*@|"""[\s\S]*?"""|'''[\s\S]*?'''/g.test(code);
	if (codeOnlyLines > 15 && !hasDocComments) {
		issues.push({
			type: "Documentation",
			description: "No documentation comments found in substantial codebase",
			severity: "minor",
		});
		recommendations.push(
			"Add documentation comments for functions and classes",
		);
	}

	// Check for magic numbers
	const magicNumberPattern =
		/(?:^|[^\w.])([2-9]\d{2,}|[1-9]\d{4,})(?:[^\w.]|$)/g;
	const magicNumbers = code.match(magicNumberPattern);
	if (magicNumbers && magicNumbers.length > 2) {
		issues.push({
			type: "Code Quality",
			description: `Found ${magicNumbers.length} potential magic numbers - consider using named constants`,
			severity: "minor",
		});
		recommendations.push(
			"Replace magic numbers with named constants for clarity",
		);
	}

	// Check for deep nesting
	let maxIndentation = 0;
	for (const line of lines) {
		const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
		const indentLevel = Math.floor(leadingSpaces / 2);
		if (indentLevel > maxIndentation) {
			maxIndentation = indentLevel;
		}
	}
	if (maxIndentation > 4) {
		issues.push({
			type: "Code Complexity",
			description: `Deep nesting detected (${maxIndentation} levels) - consider refactoring`,
			severity: "major",
		});
		recommendations.push(
			"Reduce nesting depth by extracting functions or using early returns",
		);
	}

	// Common code hygiene checks
	if (code.includes("TODO") || code.includes("FIXME")) {
		issues.push({
			type: "Technical Debt",
			description: "Found TODO or FIXME comments indicating incomplete work",
			severity: "minor",
		});
		recommendations.push(
			"Address pending TODO and FIXME items before production",
		);
	}

	if (
		code.includes("console.log") &&
		(language === "javascript" || language === "typescript")
	) {
		issues.push({
			type: "Debug Code",
			description:
				"Found console.log statements that should be removed in production",
			severity: "major",
		});
		recommendations.push("Remove debug console.log statements");
	}

	if (code.includes("print(") && language === "python") {
		issues.push({
			type: "Debug Code",
			description: "Found print statements that should use proper logging",
			severity: "major",
		});
		recommendations.push("Replace print statements with proper logging");
	}

	// Check for long functions (simple heuristic)
	let functionLines = 0;
	let inFunction = false;

	for (const line of lines) {
		if (
			line.includes("function") ||
			line.includes("def ") ||
			(line.includes("const ") && line.includes("=>"))
		) {
			inFunction = true;
			functionLines = 1;
		} else if (inFunction) {
			functionLines++;
			if (
				line.trim() === "}" ||
				(language === "python" && line.match(/^[a-zA-Z]/) && functionLines > 1)
			) {
				if (functionLines > 50) {
					issues.push({
						type: "Code Complexity",
						description: `Found function with ${functionLines} lines - consider breaking into smaller functions`,
						severity: "major",
					});
				}
				inFunction = false;
			}
		}
	}

	// Check for outdated patterns
	if (language === "javascript" || language === "typescript") {
		if (code.includes("var ")) {
			issues.push({
				type: "Outdated Pattern",
				description: "Using var instead of let/const",
				severity: "minor",
			});
			recommendations.push("Replace var declarations with let or const");
		}

		// Check for potential callback hell
		const nestedCallbacks = (code.match(/\)\s*{\s*[^}]*\([^)]*\)\s*{/g) || [])
			.length;
		if (nestedCallbacks > 2) {
			issues.push({
				type: "Code Complexity",
				description: `Potential callback hell detected (${nestedCallbacks} nested callbacks)`,
				severity: "major",
			});
			recommendations.push(
				"Consider using async/await or Promise chains instead of nested callbacks",
			);
		}

		// Check for missing type annotations in TypeScript
		if (language === "typescript" && codeOnlyLines > 10) {
			const functionDeclarations = (
				code.match(/function\s+\w+\s*\([^)]*\)\s*{/g) || []
			).length;
			const typedFunctions = (
				code.match(/function\s+\w+\s*\([^)]*\)\s*:\s*\w+/g) || []
			).length;
			if (
				functionDeclarations > 0 &&
				typedFunctions / functionDeclarations < 0.5
			) {
				issues.push({
					type: "Type Safety",
					description: "Many functions lack return type annotations",
					severity: "minor",
				});
				recommendations.push(
					"Add explicit return type annotations to functions",
				);
			}
		}
	}

	// Check for missing error handling
	if (
		code.includes("await ") &&
		!code.includes("try") &&
		!code.includes("catch")
	) {
		issues.push({
			type: "Error Handling",
			description: "Async code without proper error handling",
			severity: "critical",
		});
		recommendations.push("Add try-catch blocks around async operations");
	}

	// Check for hardcoded credentials or sensitive data
	if (
		/password\s*=\s*["']|api[_-]?key\s*=\s*["']|secret\s*=\s*["']/i.test(code)
	) {
		issues.push({
			type: "Security Risk",
			description: "Potential hardcoded credentials or API keys detected",
			severity: "critical",
		});
		recommendations.push(
			"Move sensitive data to environment variables or secure configuration",
		);
	}

	// Check for commented out code
	const commentedLines = lines.filter((line) => {
		const trimmed = line.trim();
		return (
			(trimmed.startsWith("//") && /[a-zA-Z0-9()]/.test(trimmed.slice(2))) ||
			(trimmed.startsWith("#") &&
				language === "python" &&
				/[a-zA-Z0-9()]/.test(trimmed.slice(1)))
		);
	}).length;

	if (commentedLines > 3) {
		issues.push({
			type: "Dead Code",
			description: `Found ${commentedLines} lines of commented code - consider removing`,
			severity: "minor",
		});
		recommendations.push(
			"Remove commented out code or move to version control history",
		);
	}

	// Calculate score with severity-based penalties
	let score = 100;
	for (const issue of issues) {
		if (issue.severity === "critical") {
			score -= 20;
		} else if (issue.severity === "major") {
			score -= 12;
		} else {
			score -= 5;
		}
	}
	score = Math.max(0, score);

	// Apply additional scoring adjustments for overall code quality
	if (trimmedCode.length > 0 && codeOnlyLines > 0) {
		// Reward code with good practices
		let qualityBonus = 0;

		// Check for good practices
		if (hasDocComments && codeOnlyLines > 10) {
			qualityBonus += 0; // Neutral - documentation is expected, not bonus
		}

		// Penalize very short code that might not be representative
		if (codeOnlyLines < 5 && trimmedCode.length < 100) {
			score = Math.max(70, score - 10); // Cap simple code at 80 max
		}

		// Penalize code with low comment ratio (if substantial)
		if (codeOnlyLines > 15) {
			const commentLines = nonEmptyLines - codeOnlyLines;
			const commentRatio = commentLines / codeOnlyLines;
			if (commentRatio < 0.1) {
				score -= 5;
				if (!issues.some((i) => i.type === "Documentation")) {
					issues.push({
						type: "Documentation",
						description: "Low comment-to-code ratio (< 10%)",
						severity: "minor",
					});
					recommendations.push("Consider adding more explanatory comments");
				}
			}
		}

		score = Math.max(0, Math.min(100, score + qualityBonus));
	}

	let scoreDescription = "";
	if (score >= 85) scoreDescription = "Excellent";
	else if (score >= 70) scoreDescription = "Good";
	else if (score >= 50) scoreDescription = "Fair";
	else if (score >= 30) scoreDescription = "Needs Improvement";
	else scoreDescription = "Poor";

	// Generate next steps
	if (issues.length === 0) {
		nextSteps.push(
			"Code hygiene looks good! Consider adding automated linting if not already present.",
		);
	} else {
		const criticalIssues = issues.filter(
			(i) => i.severity === "critical",
		).length;
		const majorIssues = issues.filter((i) => i.severity === "major").length;

		if (criticalIssues > 0) {
			nextSteps.push(`Address ${criticalIssues} critical issue(s) immediately`);
		}
		if (majorIssues > 0) {
			nextSteps.push(`Fix ${majorIssues} major issue(s) before merging`);
		}
		nextSteps.push(
			"Address the identified issues in order of priority (critical > major > minor)",
		);
		nextSteps.push(
			"Set up automated code quality checks (ESLint, Prettier, Biome, etc.)",
		);
		nextSteps.push("Consider implementing pre-commit hooks");
	}

	return {
		issues: issues.map(({ severity, ...rest }) => rest),
		recommendations,
		score,
		scoreDescription,
		nextSteps,
	};
}
