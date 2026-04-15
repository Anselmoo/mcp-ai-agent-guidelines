import type { WorkspaceEntry } from "../../contracts/runtime.js";
import { doc_readme_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const README_SECTION_RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(install|setup|getting.?started|quickstart|bootstrap)\b/i,
		guidance:
			"Write the installation section as a single copy-pasteable block that works on a clean machine: prerequisites, install command, verify command — if it takes more than 3 commands to get started, the onboarding is too complex.",
	},
	{
		pattern: /\b(config|setting|option|parameter|env|environment)\b/i,
		guidance:
			"Document every configuration option in a table: name, type, default value, description, and an example — undocumented configuration is invisible configuration.",
	},
	{
		pattern: /\b(contribut|pr|pull.?request|develop|fork|branch)\b/i,
		guidance:
			"Include a contribution guide section: how to fork, branch, test locally, and submit a PR — projects without contribution guidelines receive lower-quality contributions and more maintainer overhead.",
	},
	{
		pattern: /\b(example|usage|demo|sample|how.?to|tutorial)\b/i,
		guidance:
			"Lead with a minimal working example: the reader should see the tool doing something useful within 30 seconds of reading — theory and architecture explanations belong after the first success.",
	},
	{
		pattern: /\b(badge|status|ci|build|coverage|version|shield)\b/i,
		guidance:
			"Add status badges (build, coverage, version) at the top of the README — they communicate project health at a glance and reduce 'is this maintained?' questions.",
	},
	{
		pattern: /\b(license|legal|copyright|mit|apache|gpl)\b/i,
		guidance:
			"State the license clearly in the README and link to the full LICENSE file — projects without visible license information are legally unusable by most organizations.",
	},
];

function deriveProjectInsights(entries: WorkspaceEntry[]): string[] {
	const insights: string[] = [];
	const hasPackageJson = entries.some(
		(e) => e.type === "file" && e.name === "package.json",
	);
	const hasReadme = entries.some(
		(e) => e.type === "file" && /^readme/i.test(e.name),
	);
	const hasSrc = entries.some(
		(e) => e.type === "directory" && e.name === "src",
	);

	if (hasPackageJson) {
		insights.push(
			"package.json detected — extract the project name, description, and scripts to populate README metadata automatically.",
		);
	}
	if (hasReadme) {
		insights.push(
			"Existing README found — audit and update it rather than starting from scratch. Identify stale sections and missing topics.",
		);
	}
	if (hasSrc) {
		insights.push(
			"Source directory found — include a project structure section showing the directory layout and explaining what each top-level directory contains.",
		);
	}

	return insights;
}

const docReadmeHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"README Generator needs a description of the project, its audience, or the specific sections to include before it can produce a structured README.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = README_SECTION_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		try {
			const entries = (await context.runtime.workspace?.listFiles()) ?? [];
			if (entries.length > 0) {
				findings.push(...deriveProjectInsights(entries));
			}
		} catch {
			// workspace unavailable — text-signal guidance stands alone
		}

		if (findings.length === 0) {
			findings.push(
				"Structure the README for three audiences: evaluators (< 5 min to first result), integrators (API/config reference), and contributors (development setup and guidelines).",
				"Include these minimum sections: project description (one sentence), installation, quickstart example, configuration, and license.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply README constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Tailor depth and sections to the stated audience.`,
			);
		}

		return createCapabilityResult(
			context,
			`README Generator identified ${findings.length} section${findings.length === 1 ? "" : "s"} and structure recommendation${findings.length === 1 ? "" : "s"}.`,
			createFocusRecommendations(
				"README section",
				findings,
				context.model.modelClass,
			),
			[
				buildOutputTemplateArtifact(
					"README publication template",
					[
						"# Project name",
						"## What it does",
						"## Quickstart",
						"## Configuration",
						"## Usage examples",
						"## Project structure",
						"## Development",
						"## Contributing",
						"## License",
					].join("\n"),
					[
						"Project name",
						"What it does",
						"Quickstart",
						"Configuration",
						"Usage examples",
						"Project structure",
						"Development",
						"Contributing",
						"License",
					],
					"README skeleton for onboarding, integration, and contributor workflow.",
				),
				buildToolChainArtifact(
					"README drafting workflow",
					[
						{
							tool: "workspace inventory",
							description:
								"collect package metadata, source directories, and any existing README or onboarding docs",
						},
						{
							tool: "quickstart block",
							description:
								"write install, verify, and first-success commands as a single copy-pasteable sequence",
						},
						{
							tool: "publish review",
							description:
								"check that links, commands, and config examples are current before publishing the README",
						},
					],
					"Concrete workflow for turning repository facts into an onboarding-ready README.",
				),
				buildEvalCriteriaArtifact(
					"README publication checklist",
					[
						"The first successful command appears within the quickstart section.",
						"Configuration values are presented in a table with defaults and examples.",
						"Contribution and development instructions are present when the project is maintained in-repo.",
						"License and project status are visible near the top or end of the document.",
					],
					"Validation checks for a README that is ready to publish.",
				),
				buildWorkedExampleArtifact(
					"README quickstart example",
					{
						workspace: ["package.json", "src", "README.md"],
						request:
							"Refresh the README with installation, configuration, contribution, and example sections",
					},
					{
						sections: [
							"Project summary",
							"Install",
							"Verify",
							"Configuration table",
							"Usage example",
							"Development workflow",
						],
						validation: [
							"Install is copy-pasteable",
							"README uses workspace structure as a source of truth",
							"Contribution guidance is included for maintainers",
						],
					},
					"Worked example showing how repository inventory becomes a publishable README outline.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(skillManifest, docReadmeHandler);
