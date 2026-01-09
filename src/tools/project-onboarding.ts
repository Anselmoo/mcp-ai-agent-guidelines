import { z } from "zod";
import {
	type DirectoryNode,
	type ProjectStructure,
	projectScanner,
} from "./bridge/project-scanner.js";
import {
	buildFurtherReadingSection,
	buildMetadataSection,
} from "./shared/prompt-utils.js";
import { createMcpResponse } from "./shared/response-utils.js";

const ProjectOnboardingSchema = z.object({
	projectPath: z.string().describe("Path to the project directory"),
	includeDetailedStructure: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include detailed directory structure"),
	focusAreas: z
		.array(z.enum(["dependencies", "scripts", "structure", "frameworks"]))
		.optional()
		.describe("Specific areas to focus on"),
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

/**
 * Format directory tree structure into human-readable tree format
 */
function formatDirectoryTree(
	node: DirectoryNode,
	prefix = "",
	isLast = true,
): string {
	const lines: string[] = [];
	const connector = isLast ? "└── " : "├── ";
	const extension = isLast ? "    " : "│   ";

	// Add current node
	lines.push(prefix + connector + node.name);

	// Add children if it's a directory
	if (node.type === "directory" && node.children && node.children.length > 0) {
		const children = node.children;
		children.forEach((child, index) => {
			const childIsLast = index === children.length - 1;
			lines.push(
				...formatDirectoryTree(child, prefix + extension, childIsLast).split(
					"\n",
				),
			);
		});
	}

	return lines.join("\n");
}

/**
 * Generate onboarding documentation from project structure
 */
function generateOnboardingDoc(
	project: ProjectStructure,
	options: {
		includeDetailedStructure?: boolean;
		focusAreas?: string[];
		includeMetadata?: boolean;
		includeReferences?: boolean;
	},
): string {
	const sections: string[] = [];

	// Header
	sections.push(`# Project Onboarding: ${project.name}`);
	sections.push(`\n**Type**: ${project.type}`);
	sections.push(`**Root**: ${project.rootPath}`);

	// Metadata section
	if (options.includeMetadata) {
		sections.push(
			`\n${buildMetadataSection({
				sourceTool: "mcp_ai-agent-guidelines_project-onboarding",
			})}`,
		);
	}

	// Focus areas or show all
	const shouldShowFrameworks =
		!options.focusAreas || options.focusAreas.includes("frameworks");
	const shouldShowDependencies =
		!options.focusAreas || options.focusAreas.includes("dependencies");
	const shouldShowScripts =
		!options.focusAreas || options.focusAreas.includes("scripts");
	const shouldShowStructure =
		!options.focusAreas || options.focusAreas.includes("structure");

	// Frameworks
	if (shouldShowFrameworks && project.frameworks.length > 0) {
		sections.push("\n## Frameworks Detected\n");
		for (const f of project.frameworks) {
			sections.push(
				`- **${f.name}** ${f.version ?? ""} (confidence: ${f.confidence})`,
			);
		}
	}

	// Entry Points
	if (shouldShowStructure) {
		sections.push("\n## Entry Points\n");
		if (project.entryPoints.length > 0) {
			for (const ep of project.entryPoints) {
				sections.push(`- \`${ep}\``);
			}
		} else {
			sections.push("- No entry points detected");
		}
	}

	// Dependencies
	if (shouldShowDependencies) {
		const totalDeps =
			project.dependencies.length + project.devDependencies.length;
		sections.push(`\n## Dependencies (${totalDeps})\n`);

		if (project.dependencies.length > 0) {
			sections.push("### Production Dependencies\n");
			const displayDeps = project.dependencies.slice(0, 20);
			for (const d of displayDeps) {
				sections.push(`- ${d.name}@${d.version}`);
			}
			if (project.dependencies.length > 20) {
				sections.push(`- ... and ${project.dependencies.length - 20} more`);
			}
		}

		if (project.devDependencies.length > 0) {
			sections.push("\n### Development Dependencies\n");
			const displayDevDeps = project.devDependencies.slice(0, 10);
			for (const d of displayDevDeps) {
				sections.push(`- ${d.name}@${d.version}`);
			}
			if (project.devDependencies.length > 10) {
				sections.push(`- ... and ${project.devDependencies.length - 10} more`);
			}
		}

		if (totalDeps === 0) {
			sections.push("No dependencies detected");
		}
	}

	// Scripts
	if (shouldShowScripts && Object.keys(project.scripts).length > 0) {
		sections.push("\n## Available Scripts\n");
		for (const [name, cmd] of Object.entries(project.scripts)) {
			sections.push(`- \`npm run ${name}\`: ${cmd}`);
		}
	}

	// Structure (if requested)
	if (shouldShowStructure && options.includeDetailedStructure) {
		sections.push("\n## Directory Structure\n");
		sections.push("```");
		sections.push(formatDirectoryTree(project.directoryStructure));
		sections.push("```");
	}

	// References
	if (options.includeReferences) {
		sections.push(`\n${buildOnboardingReferences()}`);
	}

	return sections.join("\n");
}

/**
 * Main project onboarding function
 */
export async function projectOnboarding(args: unknown) {
	const input = ProjectOnboardingSchema.parse(args);

	// Scan actual project
	const project = await projectScanner.scan(input.projectPath);

	// Generate documentation
	const content = generateOnboardingDoc(project, {
		includeDetailedStructure: input.includeDetailedStructure,
		focusAreas: input.focusAreas,
		includeMetadata: input.includeMetadata,
		includeReferences: input.includeReferences,
	});

	return createMcpResponse({ content });
}

/**
 * Build references section for onboarding documentation
 */
export function buildOnboardingReferences(): string {
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
