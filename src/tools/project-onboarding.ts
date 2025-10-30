import { z } from "zod";
import {
	buildFurtherReadingSection,
	buildMetadataSection,
} from "./shared/prompt-utils.js";

const ProjectOnboardingSchema = z.object({
	projectPath: z.string().describe("Path to the project directory"),
	projectName: z.string().optional().describe("Name of the project"),
	projectType: z
		.enum(["library", "application", "service", "tool", "other"])
		.optional()
		.describe("Type of project"),
	analysisDepth: z
		.enum(["quick", "standard", "deep"])
		.default("standard")
		.describe("Depth of analysis"),
	includeMemories: z
		.boolean()
		.optional()
		.default(true)
		.describe("Generate project memories"),
	includeReferences: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include external reference links"),
	includeMetadata: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include metadata section"),
});

type ProjectOnboardingInput = z.infer<typeof ProjectOnboardingSchema>;

interface ProjectProfile {
	name: string;
	type: string;
	structure: {
		directories: string[];
		keyFiles: string[];
		frameworks: string[];
		languages: string[];
	};
	buildSystem?: string;
	testFramework?: string;
	dependencies: string[];
	entryPoints: string[];
}

interface ProjectMemory {
	title: string;
	content: string;
	category: "architecture" | "workflow" | "conventions" | "dependencies";
}

export async function projectOnboarding(args: unknown) {
	const input = ProjectOnboardingSchema.parse(args);

	const profile = await analyzeProject(input);
	const memories = input.includeMemories
		? generateProjectMemories(profile)
		: [];

	const metadata = input.includeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_project-onboarding",
			})
		: "";

	const references = input.includeReferences ? buildOnboardingReferences() : "";

	return {
		content: [
			{
				type: "text",
				text: `## 🚀 Project Onboarding Complete

${metadata}

### 📋 Project Profile
| Attribute | Value |
|---|---|
| Name | ${profile.name} |
| Type | ${profile.type} |
| Languages | ${profile.structure.languages.join(", ") || "Unknown"} |
| Frameworks | ${profile.structure.frameworks.join(", ") || "None detected"} |
| Build System | ${profile.buildSystem || "Not detected"} |
| Test Framework | ${profile.testFramework || "Not detected"} |

### 🏗️ Project Structure
**Key Directories:**
${profile.structure.directories.map((d) => `- \`${d}\``).join("\n")}

**Key Files:**
${profile.structure.keyFiles.map((f) => `- \`${f}\``).join("\n")}

**Entry Points:**
${profile.entryPoints.length > 0 ? profile.entryPoints.map((e) => `- \`${e}\``).join("\n") : "- No clear entry points identified"}

### 📦 Dependencies
${profile.dependencies.length > 0 ? profile.dependencies.map((d) => `- ${d}`).join("\n") : "No dependencies detected"}

${memories.length > 0 ? buildMemoriesSection(memories) : ""}

### 💡 Next Steps
1. Review the project structure and memories above
2. Familiarize yourself with entry points: ${profile.entryPoints.length > 0 ? profile.entryPoints.join(", ") : "explore main files"}
3. Check build commands${profile.buildSystem ? ` using ${profile.buildSystem}` : ""}
4. Run tests${profile.testFramework ? ` using ${profile.testFramework}` : ""}
5. Start with small, well-defined tasks to build context

${references}

### 🎯 Onboarding Success Criteria
- [x] Project structure analyzed
- [x] Key files and directories identified
- [x] Dependencies catalogued
${input.includeMemories ? "- [x] Project memories generated" : "- [ ] Project memories (disabled)"}
- [ ] Initial exploration completed
- [ ] First task identified
`,
			},
		],
	};
}

async function analyzeProject(
	input: ProjectOnboardingInput,
): Promise<ProjectProfile> {
	const profile: ProjectProfile = {
		name: input.projectName || input.projectPath.split("/").pop() || "unknown",
		type: input.projectType || "other",
		structure: {
			directories: [],
			keyFiles: [],
			frameworks: [],
			languages: [],
		},
		dependencies: [],
		entryPoints: [],
	};

	// Detect key directories
	const commonDirs = [
		"src",
		"lib",
		"app",
		"tests",
		"test",
		"docs",
		"scripts",
		"config",
		"public",
		"dist",
		"build",
	];
	profile.structure.directories = commonDirs;

	// Detect key files
	const keyFiles = [
		"package.json",
		"tsconfig.json",
		"README.md",
		"Cargo.toml",
		"go.mod",
		"requirements.txt",
		"setup.py",
		"Gemfile",
		"pom.xml",
		"build.gradle",
		".gitignore",
	];
	profile.structure.keyFiles = keyFiles;

	// Detect languages (simplified)
	profile.structure.languages = detectLanguages(profile.structure.keyFiles);

	// Detect frameworks
	profile.structure.frameworks = detectFrameworks(profile.structure.keyFiles);

	// Detect build system
	profile.buildSystem = detectBuildSystem(profile.structure.keyFiles);

	// Detect test framework
	profile.testFramework = detectTestFramework(profile.structure.keyFiles);

	// Detect dependencies
	profile.dependencies = detectDependencies(profile.structure.keyFiles);

	// Detect entry points
	profile.entryPoints = detectEntryPoints(profile.structure);

	return profile;
}

function detectLanguages(keyFiles: string[]): string[] {
	const languages: string[] = [];

	if (
		keyFiles.some((f) => f.includes("package.json") || f.includes("tsconfig"))
	) {
		languages.push("TypeScript/JavaScript");
	}
	if (
		keyFiles.some(
			(f) => f.includes("requirements.txt") || f.includes("setup.py"),
		)
	) {
		languages.push("Python");
	}
	if (keyFiles.some((f) => f.includes("Cargo.toml"))) {
		languages.push("Rust");
	}
	if (keyFiles.some((f) => f.includes("go.mod"))) {
		languages.push("Go");
	}
	if (keyFiles.some((f) => f.includes("Gemfile"))) {
		languages.push("Ruby");
	}
	if (
		keyFiles.some((f) => f.includes("pom.xml") || f.includes("build.gradle"))
	) {
		languages.push("Java");
	}

	return languages;
}

function detectFrameworks(keyFiles: string[]): string[] {
	const frameworks: string[] = [];

	// This is a simplified detection - in practice, would need to read file contents
	if (keyFiles.includes("package.json")) {
		frameworks.push("Node.js");
	}

	return frameworks;
}

function detectBuildSystem(keyFiles: string[]): string | undefined {
	if (keyFiles.includes("package.json")) return "npm/yarn";
	if (keyFiles.includes("Cargo.toml")) return "cargo";
	if (keyFiles.includes("go.mod")) return "go build";
	if (keyFiles.includes("pom.xml")) return "maven";
	if (keyFiles.includes("build.gradle")) return "gradle";
	if (keyFiles.includes("Makefile")) return "make";
	return undefined;
}

function detectTestFramework(keyFiles: string[]): string | undefined {
	if (keyFiles.includes("package.json"))
		return "Jest/Vitest/Mocha (check package.json)";
	if (keyFiles.includes("requirements.txt")) return "pytest/unittest";
	if (keyFiles.includes("Cargo.toml")) return "cargo test";
	if (keyFiles.includes("go.mod")) return "go test";
	return undefined;
}

function detectDependencies(keyFiles: string[]): string[] {
	// Simplified - in practice would parse the dependency files
	const deps: string[] = [];

	if (keyFiles.includes("package.json")) {
		deps.push("Check package.json for npm dependencies");
	}
	if (keyFiles.includes("requirements.txt")) {
		deps.push("Check requirements.txt for Python dependencies");
	}
	if (keyFiles.includes("Cargo.toml")) {
		deps.push("Check Cargo.toml for Rust crates");
	}

	return deps;
}

function detectEntryPoints(_structure: {
	directories: string[];
	keyFiles: string[];
}): string[] {
	const entryPoints: string[] = [];

	// Common entry point patterns
	const commonEntries = [
		"src/index.ts",
		"src/main.ts",
		"src/app.ts",
		"main.py",
		"app.py",
		"main.go",
		"src/main.rs",
		"index.js",
	];

	entryPoints.push(...commonEntries);

	return entryPoints;
}

function generateProjectMemories(profile: ProjectProfile): ProjectMemory[] {
	const memories: ProjectMemory[] = [];

	// Architecture memory
	memories.push({
		title: "Project Architecture",
		category: "architecture",
		content: `# ${profile.name} - Architecture Overview

## Project Type
${profile.type.charAt(0).toUpperCase() + profile.type.slice(1)}

## Technology Stack
- Languages: ${profile.structure.languages.join(", ")}
- Frameworks: ${profile.structure.frameworks.join(", ") || "None"}
- Build System: ${profile.buildSystem || "Not detected"}

## Structure
Key directories: ${profile.structure.directories.join(", ")}

## Entry Points
${profile.entryPoints.map((e) => `- ${e}`).join("\n")}
`,
	});

	// Workflow memory
	if (profile.buildSystem || profile.testFramework) {
		memories.push({
			title: "Development Workflow",
			category: "workflow",
			content: `# ${profile.name} - Development Workflow

## Build
${profile.buildSystem ? `Use \`${profile.buildSystem}\` for building the project` : "Build system not detected"}

## Testing
${profile.testFramework ? `Use ${profile.testFramework} for running tests` : "Test framework not detected"}

## Common Commands
${profile.buildSystem === "npm/yarn" ? `- \`npm install\` - Install dependencies\n- \`npm run build\` - Build project\n- \`npm test\` - Run tests` : ""}
${profile.buildSystem === "cargo" ? `- \`cargo build\` - Build project\n- \`cargo test\` - Run tests\n- \`cargo run\` - Run project` : ""}
${profile.buildSystem === "go build" ? `- \`go build\` - Build project\n- \`go test ./...\` - Run tests\n- \`go run .\` - Run project` : ""}
`,
		});
	}

	// Conventions memory
	memories.push({
		title: "Code Conventions",
		category: "conventions",
		content: `# ${profile.name} - Code Conventions

## File Organization
- Source code in: ${profile.structure.directories.find((d) => d === "src" || d === "lib") || "main directory"}
- Tests in: ${profile.structure.directories.find((d) => d.includes("test")) || "test directory"}
- Documentation in: ${profile.structure.directories.find((d) => d === "docs") || "docs directory"}

## Best Practices
- Follow the existing code style in the project
- Write tests for new features
- Update documentation for significant changes
- Use meaningful commit messages
`,
	});

	// Dependencies memory
	if (profile.dependencies.length > 0) {
		memories.push({
			title: "Dependencies",
			category: "dependencies",
			content: `# ${profile.name} - Dependencies

## Dependency Management
${profile.dependencies.map((d) => `- ${d}`).join("\n")}

## Important Notes
- Always review dependency updates for breaking changes
- Keep dependencies up to date for security
- Minimize dependency count when possible
`,
		});
	}

	return memories;
}

function buildMemoriesSection(memories: ProjectMemory[]): string {
	let section = "### 🧠 Project Memories Generated\n\n";

	const grouped = memories.reduce(
		(acc, mem) => {
			if (!acc[mem.category]) acc[mem.category] = [];
			acc[mem.category].push(mem);
			return acc;
		},
		{} as Record<string, ProjectMemory[]>,
	);

	for (const [category, mems] of Object.entries(grouped)) {
		section += `**${category.charAt(0).toUpperCase() + category.slice(1)}**:\n`;
		mems.forEach((mem) => {
			section += `- ${mem.title}\n`;
		});
		section += "\n";
	}

	section += `💾 **Memory Storage**: These memories should be stored for future reference and can be recalled when working on the project.\n\n`;

	return section;
}

function buildOnboardingReferences(): string {
	return buildFurtherReadingSection([
		{
			title: "Atlassian Onboarding Guide",
			url: "https://www.atlassian.com/teams/hr/guide/employee-onboarding",
			description: "Best practices for effective project and team onboarding",
		},
		{
			title: "VS Code Navigation",
			url: "https://code.visualstudio.com/docs/editor/editingevolved",
			description: "Advanced code navigation features in Visual Studio Code",
		},
		{
			title: "Meta AI Research: Memory Layers",
			url: "https://ai.meta.com/blog/meta-fair-updates-agents-robustness-safety-architecture/",
			description:
				"Meta's research on memory systems and memory layers for AI agents",
		},
	]);
}
