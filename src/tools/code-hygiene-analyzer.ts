import { z } from "zod";

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
		? [
				"- Refactoring legacy code best practices: https://graphite.dev/guides/refactoring-legacy-code-best-practices-techniques",
				"- General code hygiene checklist (community resources)",
			].join("\n")
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
${references ? `\n### 🔗 References\n${references}\n` : ""}
\n### ⚠️ Disclaimer\n- Findings are heuristic and may not capture project-specific conventions. Validate changes via code review and tests.
`,
			},
		],
	};
}

function analyzeCodeHygiene(input: CodeHygieneInput) {
	const issues: Array<{ type: string; description: string }> = [];
	const recommendations: string[] = [];
	const nextSteps: string[] = [];

	const code = input.codeContent;
	const language = input.language.toLowerCase();

	// Common code hygiene checks
	if (code.includes("TODO") || code.includes("FIXME")) {
		issues.push({
			type: "Technical Debt",
			description: "Found TODO or FIXME comments indicating incomplete work",
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
		});
		recommendations.push("Remove debug console.log statements");
	}

	if (code.includes("print(") && language === "python") {
		issues.push({
			type: "Debug Code",
			description: "Found print statements that should use proper logging",
		});
		recommendations.push("Replace print statements with proper logging");
	}

	// Check for long functions (simple heuristic)
	const lines = code.split("\n");
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
			});
			recommendations.push("Replace var declarations with let or const");
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
		});
		recommendations.push("Add try-catch blocks around async operations");
	}

	// Calculate score
	let score = 100;
	score -= issues.length * 10;
	score = Math.max(0, score);

	let scoreDescription = "";
	if (score >= 90) scoreDescription = "Excellent";
	else if (score >= 80) scoreDescription = "Good";
	else if (score >= 70) scoreDescription = "Fair";
	else if (score >= 60) scoreDescription = "Needs Improvement";
	else scoreDescription = "Poor";

	// Generate next steps
	if (issues.length === 0) {
		nextSteps.push(
			"Code hygiene looks good! Consider adding automated linting if not already present.",
		);
	} else {
		nextSteps.push("Address the identified issues in order of priority");
		nextSteps.push(
			"Set up automated code quality checks (ESLint, Prettier, Biome, etc.)",
		);
		nextSteps.push("Consider implementing pre-commit hooks");
	}

	return {
		issues,
		recommendations,
		score,
		scoreDescription,
		nextSteps,
	};
}
