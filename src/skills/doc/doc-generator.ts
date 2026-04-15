import type { WorkspaceEntry } from "../../contracts/runtime.js";
import { doc_generator_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import {
	extractRequestSignals,
	summarizeContextEvidence,
} from "../shared/recommendations.js";

const DOC_TYPE_RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(api|endpoint|function|method|interface|module|export|openapi|swagger)\b/i,
		guidance:
			"Generate API reference documentation from exported interfaces, function signatures, and type annotations — include parameter contracts, return types, and error conditions for every public surface.",
	},
	{
		pattern:
			/\b(readme|overview|introduction|getting.?started|quickstart|onboard)\b/i,
		guidance:
			"Structure the README for three distinct audiences: a quickstart path for evaluators (< 5 min to first result), a configuration reference for integrators, and a contribution guide for maintainers.",
	},
	{
		pattern:
			/\b(runbook|operation|deploy|incident|oncall|sre|alert|remediat)\b/i,
		guidance:
			"Write the runbook as a decision tree: each section should answer 'what symptom am I seeing?' and lead to a concrete command, configuration change, or escalation step — not just a description.",
	},
	{
		pattern: /\b(architecture|system.?design|adr|decision|overview|diagram)\b/i,
		guidance:
			"Document the architecture as rationale-first: record the key decisions, the alternatives considered, and the trade-offs accepted — the 'current state' description is a side effect, not the goal.",
	},
	{
		pattern:
			/\b(tutorial|guide|walkthrough|example|how.?to|learn|step.?by.?step)\b/i,
		guidance:
			"Write the tutorial as a working example: each section should produce a real, verifiable artifact by its end — the reader learns by doing, not by reading about concepts.",
	},
	{
		pattern: /\b(changelog|release|version|migration|upgrade|breaking)\b/i,
		guidance:
			"Structure the changelog by impact: breaking changes first, then new capabilities, then fixes — each entry should link to the motivation and include migration instructions where behavior changed.",
	},
];

interface DocInventory {
	sourceDirs: WorkspaceEntry[];
	existingDocs: WorkspaceEntry[];
	configFiles: WorkspaceEntry[];
	total: number;
}

function buildDocInventory(entries: WorkspaceEntry[]): DocInventory {
	return {
		sourceDirs: entries.filter(
			(e) =>
				e.type === "directory" &&
				/^(src|lib|pkg|app|core|packages)$/.test(e.name),
		),
		existingDocs: entries.filter(
			(e) => e.type === "file" && /\.(md|mdx|rst|txt|adoc)$/i.test(e.name),
		),
		configFiles: entries.filter(
			(e) =>
				e.type === "file" &&
				/\.(json|toml|yaml|yml|env\.example)$/i.test(e.name),
		),
		total: entries.length,
	};
}

const docGeneratorHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Documentation Generator needs a description of what to document — code, system, API, or workflow — before it can produce a structured documentation plan.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = DOC_TYPE_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);
		let inventory: DocInventory | undefined;

		try {
			const entries = (await context.runtime.workspace?.listFiles()) ?? [];
			if (entries.length > 0) {
				inventory = buildDocInventory(entries);
				if (inventory.sourceDirs.length > 0) {
					const names = inventory.sourceDirs.map((e) => e.name).join(", ");
					findings.push(
						`Found ${inventory.sourceDirs.length} source director${inventory.sourceDirs.length === 1 ? "y" : "ies"} (${names}) — generate module-level and API documentation from these directories first.`,
					);
				}
				if (inventory.existingDocs.length > 0) {
					const names = inventory.existingDocs
						.map((e) => e.name)
						.slice(0, 4)
						.join(", ");
					const more =
						inventory.existingDocs.length > 4
							? ` and ${inventory.existingDocs.length - 4} more`
							: "";
					findings.push(
						`Found ${inventory.existingDocs.length} existing document${inventory.existingDocs.length === 1 ? "" : "s"} (${names}${more}) — audit and integrate these rather than creating duplicates.`,
					);
				}
				if (
					inventory.configFiles.length > 0 &&
					inventory.sourceDirs.length === 0
				) {
					findings.push(
						`Found ${inventory.configFiles.length} configuration file${inventory.configFiles.length === 1 ? "" : "s"} — document configuration keys, their defaults, valid ranges, and interactions as a first documentation artifact.`,
					);
				}
			}
		} catch {
			// workspace unavailable — text-signal guidance stands alone
		}

		if (findings.length === 0) {
			findings.push(
				"Identify the primary audience (developers, operators, end users) before choosing documentation structure — each audience requires a different information architecture and level of assumed knowledge.",
				signals.hasContext
					? (summarizeContextEvidence(signals) ??
							"Use the provided context to enumerate documentation targets and prioritize by the audience most likely to be blocked without them.")
					: "List the main modules, APIs, and workflows before drafting — scoping prevents incomplete documentation sets that become misleading over time.",
			);
		}

		if ("deliverable" in input && input.deliverable) {
			findings.push(
				`Target deliverable: "${String(input.deliverable)}" — structure documentation phases so each phase delivers a usable subset rather than requiring everything before publishing.`,
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply the stated documentation constraints: ${signals.constraintList.slice(0, 3).join("; ")}.`,
			);
		}

		return createCapabilityResult(
			context,
			`Documentation Generator identified ${findings.length} documentation target${findings.length === 1 ? "" : "s"} and structure recommendation${findings.length === 1 ? "" : "s"}.`,
			createFocusRecommendations(
				"Documentation target",
				findings,
				context.model.modelClass,
			),
			[
				buildOutputTemplateArtifact(
					"Documentation plan template",
					[
						"# Documentation plan",
						"## Audience",
						"## Source inventory",
						"## Primary sections",
						"## Examples to include",
						"## Publication checklist",
						"## Validation checklist",
					].join("\n"),
					[
						"Audience",
						"Source inventory",
						"Primary sections",
						"Examples to include",
						"Publication checklist",
						"Validation checklist",
					],
					"Use this template to turn a documentation request into a publishable plan.",
				),
				buildEvalCriteriaArtifact(
					"Documentation publication checklist",
					[
						"Audience and deliverable are explicit before drafting begins.",
						"Source inventory lists the code, docs, configs, or workflows that anchor the plan.",
						"Every planned section has a source of truth and a verification step.",
						"Examples are chosen for the highest-friction user journeys.",
					],
					"Checklist for deciding whether the documentation set is ready to publish.",
				),
				buildToolChainArtifact(
					"Documentation workflow",
					[
						{
							tool: "workspace inventory",
							description:
								"identify source directories, existing docs, and config files",
						},
						{
							tool: "section outline",
							description:
								"choose the documentation structure that matches the audience",
						},
						{
							tool: "review pass",
							description:
								"check for duplicate content, missing examples, and stale references",
						},
					],
					"Reference workflow for producing documentation that stays close to the source material.",
				),
				buildWorkedExampleArtifact(
					"Documentation generator example",
					{
						request:
							"Generate docs for the current workspace with installation, API, and contribution sections",
						sourceDirs: inventory?.sourceDirs.map((entry) => entry.name) ?? [],
						existingDocs:
							inventory?.existingDocs.map((entry) => entry.name) ?? [],
						configFiles:
							inventory?.configFiles.map((entry) => entry.name) ?? [],
					},
					{
						audience: "Developers and integrators",
						sections: [
							"Installation",
							"API reference",
							"Configuration",
							"Contribution guide",
						],
						validation: [
							"Every public surface has a section",
							"Existing docs are reconciled instead of duplicated",
						],
					},
					"Concrete example of how the workspace inventory feeds a documentation plan.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	docGeneratorHandler,
);
