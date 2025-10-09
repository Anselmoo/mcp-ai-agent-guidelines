/**
 * Bridge Connector for Project Onboarding
 *
 * Provides integration points between project onboarding and other tools
 * Enables onboarding data to enhance all other tools with project context
 */

/**
 * Integration helpers for project onboarding with other tools
 */

/**
 * Extract project context from onboarding results
 */
export function extractProjectContext(onboardingResult: string): {
	name: string;
	type: string;
	languages: string[];
	frameworks: string[];
	buildSystem: string;
	testFramework: string;
	structure: {
		directories: string[];
		keyFiles: string[];
		entryPoints: string[];
	};
} {
	const context = {
		name: "",
		type: "other",
		languages: [] as string[],
		frameworks: [] as string[],
		buildSystem: "",
		testFramework: "",
		structure: {
			directories: [] as string[],
			keyFiles: [] as string[],
			entryPoints: [] as string[],
		},
	};

	// Extract name
	const nameMatch = onboardingResult.match(/\| Name \| ([^|]+) \|/);
	if (nameMatch) context.name = nameMatch[1].trim();

	// Extract type
	const typeMatch = onboardingResult.match(/\| Type \| ([^|]+) \|/);
	if (typeMatch) context.type = typeMatch[1].trim();

	// Extract languages
	const langMatch = onboardingResult.match(/\| Languages \| ([^|]+) \|/);
	if (langMatch) {
		context.languages = langMatch[1].split(",").map((l) => l.trim());
	}

	// Extract frameworks
	const fwMatch = onboardingResult.match(/\| Frameworks \| ([^|]+) \|/);
	if (fwMatch) {
		context.frameworks = fwMatch[1].split(",").map((f) => f.trim());
	}

	// Extract build system
	const buildMatch = onboardingResult.match(/\| Build System \| ([^|]+) \|/);
	if (buildMatch) context.buildSystem = buildMatch[1].trim();

	// Extract test framework
	const testMatch = onboardingResult.match(/\| Test Framework \| ([^|]+) \|/);
	if (testMatch) context.testFramework = testMatch[1].trim();

	// Extract directories
	const dirSection = onboardingResult.match(
		/\*\*Key Directories:\*\*\n([^*]+)/,
	);
	if (dirSection) {
		context.structure.directories = dirSection[1]
			.split("\n")
			.map((l) => l.replace(/^-\s*`?([^`\n]+)`?/, "$1").trim())
			.filter(Boolean);
	}

	// Extract key files
	const filesSection = onboardingResult.match(/\*\*Key Files:\*\*\n([^*]+)/);
	if (filesSection) {
		context.structure.keyFiles = filesSection[1]
			.split("\n")
			.map((l) => l.replace(/^-\s*`?([^`\n]+)`?/, "$1").trim())
			.filter(Boolean);
	}

	// Extract entry points
	const entrySection = onboardingResult.match(/\*\*Entry Points:\*\*\n([^#]+)/);
	if (entrySection) {
		context.structure.entryPoints = entrySection[1]
			.split("\n")
			.map((l) => l.replace(/^-\s*`?([^`\n]+)`?/, "$1").trim())
			.filter(Boolean);
	}

	return context;
}

/**
 * Enhance any tool with project context
 */
export function enhanceToolWithProjectContext(
	toolInput: unknown,
	projectContext: ReturnType<typeof extractProjectContext>,
): unknown {
	if (typeof toolInput === "object" && toolInput !== null) {
		return {
			...toolInput,
			projectContext: {
				name: projectContext.name,
				type: projectContext.type,
				languages: projectContext.languages,
				buildSystem: projectContext.buildSystem,
			},
		};
	}
	return toolInput;
}

/**
 * Generate hierarchical prompt with project context
 */
export function generateContextualPrompt(
	projectContext: ReturnType<typeof extractProjectContext>,
	taskDescription: string,
): string {
	return `# Task: ${taskDescription}

## Project Context
- **Name**: ${projectContext.name}
- **Type**: ${projectContext.type}
- **Languages**: ${projectContext.languages.join(", ")}
- **Build System**: ${projectContext.buildSystem}
- **Test Framework**: ${projectContext.testFramework}

## Project Structure
### Entry Points
${projectContext.structure.entryPoints.map((ep) => `- ${ep}`).join("\n")}

### Key Directories
${projectContext.structure.directories
	.slice(0, 5)
	.map((d) => `- ${d}`)
	.join("\n")}

### Key Files
${projectContext.structure.keyFiles
	.slice(0, 5)
	.map((f) => `- ${f}`)
	.join("\n")}

## Task Requirements
Consider the project structure and conventions when completing this task.`;
}

/**
 * Generate code hygiene analysis with project-specific rules
 */
export function generateProjectSpecificHygieneRules(
	projectContext: ReturnType<typeof extractProjectContext>,
): string[] {
	const rules: string[] = [];

	// Language-specific rules
	if (projectContext.languages.includes("TypeScript/JavaScript")) {
		rules.push("Check for proper TypeScript type annotations");
		rules.push("Ensure ESLint/Biome rules are followed");
	}

	if (projectContext.languages.includes("Python")) {
		rules.push("Verify type hints are present");
		rules.push("Check for PEP 8 compliance");
	}

	if (projectContext.languages.includes("Rust")) {
		rules.push("Run clippy for Rust-specific lints");
		rules.push("Check for proper ownership and borrowing patterns");
	}

	// Build system specific
	if (projectContext.buildSystem.includes("npm")) {
		rules.push("Verify package.json scripts are documented");
		rules.push("Check for security vulnerabilities with npm audit");
	}

	// Test framework specific
	if (projectContext.testFramework) {
		rules.push(
			`Ensure tests follow ${projectContext.testFramework} best practices`,
		);
		rules.push("Verify test coverage meets project standards");
	}

	return rules;
}

/**
 * Generate strategy analysis with project context
 */
export function generateStrategyWithProjectContext(
	projectContext: ReturnType<typeof extractProjectContext>,
): {
	swot: {
		strengths: string[];
		weaknesses: string[];
		opportunities: string[];
		threats: string[];
	};
	recommendations: string[];
} {
	const swot = {
		strengths: [] as string[],
		weaknesses: [] as string[],
		opportunities: [] as string[],
		threats: [] as string[],
	};

	// Strengths based on project type
	if (projectContext.type === "library") {
		swot.strengths.push("Reusable component architecture");
	}

	if (projectContext.languages.length > 1) {
		swot.strengths.push("Multi-language support and versatility");
	}

	// Weaknesses
	if (
		!projectContext.testFramework ||
		projectContext.testFramework.includes("check")
	) {
		swot.weaknesses.push("Testing infrastructure may need improvement");
	}

	// Opportunities
	if (projectContext.buildSystem.includes("npm")) {
		swot.opportunities.push("Leverage npm ecosystem for rapid development");
	}

	// Threats
	if (projectContext.languages.includes("JavaScript")) {
		swot.threats.push(
			"Rapid JavaScript ecosystem evolution requires regular updates",
		);
	}

	const recommendations = [
		`Focus on ${projectContext.type} best practices`,
		`Leverage ${projectContext.buildSystem} for efficient builds`,
		`Maintain consistency across ${projectContext.languages.join(", ")} codebases`,
	];

	return { swot, recommendations };
}

/**
 * Create mode-specific project guidance
 */
export function generateModeGuidance(
	projectContext: ReturnType<typeof extractProjectContext>,
	mode: string,
): string {
	const guidance: string[] = [];

	switch (mode) {
		case "planning":
			guidance.push(
				`Plan changes considering ${projectContext.type} architecture`,
			);
			guidance.push(
				`Review project structure: ${projectContext.structure.directories.slice(0, 3).join(", ")}`,
			);
			break;
		case "editing":
			guidance.push(
				`Edit files in ${projectContext.languages.join(" or ")} following project conventions`,
			);
			guidance.push(
				`Entry points: ${projectContext.structure.entryPoints.slice(0, 2).join(", ")}`,
			);
			break;
		case "debugging":
			guidance.push(`Check ${projectContext.testFramework} test outputs`);
			guidance.push(`Use ${projectContext.buildSystem} for rebuilding`);
			break;
		case "refactoring":
			guidance.push(
				`Maintain ${projectContext.type} structure during refactoring`,
			);
			guidance.push(`Preserve ${projectContext.languages.join(", ")} idioms`);
			break;
	}

	return guidance.join("\n");
}
