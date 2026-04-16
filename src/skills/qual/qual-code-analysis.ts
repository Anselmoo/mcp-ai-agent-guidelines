import type { WorkspaceEntry } from "../../contracts/runtime.js";
import { qual_code_analysis_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const CODE_ANALYSIS_RULES: Array<{ pattern: RegExp; finding: string }> = [
	{
		pattern: /\b(complex|cyclomatic|cognitive|nesting|depth)\b/i,
		finding:
			"Measure cyclomatic and cognitive complexity per function: functions exceeding complexity 10 or nesting depth 3 are the highest-leverage refactoring targets — they accumulate bugs disproportionately.",
	},
	{
		pattern:
			/\b(coupling|depend|import|circular|entangle|afferent|efferent)\b/i,
		finding:
			"Map module coupling: count afferent (incoming) and efferent (outgoing) dependencies per module — modules with high afferent coupling are change amplifiers; modules with high efferent coupling are fragile.",
	},
	{
		pattern: /\b(cohesion|responsib|srp|single|concern|separation)\b/i,
		finding:
			"Evaluate cohesion by checking whether each module's public surface serves a single responsibility — low cohesion is the leading indicator of future coupling problems.",
	},
	{
		pattern: /\b(duplicate|clone|copy|dry|repeat|redundan)\b/i,
		finding:
			"Identify code clones: exact duplicates are easy; near-duplicates with parameter differences are the real debt — they diverge silently and create inconsistency bugs.",
	},
	{
		pattern: /\b(size|line|length|large|big|bloat|god.?class|god.?module)\b/i,
		finding:
			"Flag oversized modules: files exceeding 500 lines or classes with more than 10 public methods are strong candidates for decomposition — size correlates with defect density.",
	},
	{
		pattern: /\b(dead|unused|unreachable|orphan|stale)\b/i,
		finding:
			"Detect dead code: unused exports, unreachable branches, and orphaned modules increase cognitive load without providing value — remove them before they accumulate test and maintenance cost.",
	},
	{
		pattern: /\b(type|interface|contract|schema|any|unknown|assert)\b/i,
		finding:
			"Audit type coverage: `any` types, missing return types, and untyped function parameters are defect entry points — strengthen the type boundary before adding features.",
	},
];

function analyzeWorkspaceStructure(entries: WorkspaceEntry[]): string[] {
	const insights: string[] = [];
	const sourceFiles = entries.filter(
		(e) =>
			e.type === "file" && /\.(ts|js|tsx|jsx|py|go|rs|java)$/i.test(e.name),
	);
	const sourceDirs = entries.filter(
		(e) =>
			e.type === "directory" &&
			/^(src|lib|pkg|app|core|packages)$/.test(e.name),
	);

	if (sourceFiles.length > 0) {
		insights.push(
			`Found ${sourceFiles.length} source file${sourceFiles.length === 1 ? "" : "s"} at root level — analyze import graphs and module boundaries across these files.`,
		);
	}
	if (sourceDirs.length > 0) {
		const names = sourceDirs.map((e) => e.name).join(", ");
		insights.push(
			`Source directories (${names}) identified — analyze coupling between these directories as the primary structural boundary.`,
		);
	}

	return insights;
}

function buildStructuralHotspotExample() {
	return {
		module: "src/runtime/session-bootstrap.ts",
		evidence: {
			complexity: "High branching around routing and workflow bootstrap",
			coupling: "Depends on runtime, skill registry, and workflow state",
			cohesion:
				"Handles initialization, routing, and recovery concerns together",
		},
		nextAction:
			"Split bootstrap wiring from runtime policy decisions before adding more coordination features.",
	};
}

const qualCodeAnalysisHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Code Analysis needs code, a file path, or a description of the analysis target before it can produce structural findings.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = CODE_ANALYSIS_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ finding }) => finding);

		try {
			const entries = (await context.runtime.workspace?.listFiles()) ?? [];
			if (entries.length > 0) {
				findings.push(...analyzeWorkspaceStructure(entries));
			}
		} catch {
			// workspace unavailable — text-signal analysis stands alone
		}

		if (findings.length === 0) {
			findings.push(
				"Produce a structural hotspot table with module, complexity signal, dependency direction, cohesion concern, and next action. The output should identify the top modules to inspect rather than describe code quality abstractly.",
				signals.hasContext
					? "Apply the analysis to the provided code context: capture the highest-coupling and lowest-cohesion modules with concrete evidence for why each one is risky."
					: "Provide the code or specify which analysis dimension to target so the analysis can fill the hotspot table with concrete modules and evidence.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply analysis constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Focus on dimensions most affected by these constraints.`,
			);
		}

		return createCapabilityResult(
			context,
			`Code Analysis identified ${findings.length} structural finding${findings.length === 1 ? "" : "s"} across complexity, coupling, and cohesion dimensions.`,
			createFocusRecommendations(
				"Structural finding",
				findings,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Code analysis lens matrix",
					["Lens", "Primary evidence", "Concrete output"],
					[
						{
							label: "Complexity",
							values: [
								"Branch count, nesting depth, and path count",
								"Hotspot list with the most failure-prone functions",
								"Name the functions that should be simplified first",
							],
						},
						{
							label: "Coupling",
							values: [
								"Incoming and outgoing dependency counts",
								"Module dependency map with fragile boundaries",
								"Record the modules that amplify downstream change cost",
							],
						},
						{
							label: "Cohesion",
							values: [
								"Number of unrelated responsibilities per module",
								"Responsibility split proposal",
								"Show where one file is doing too many jobs",
							],
						},
						{
							label: "Type boundary",
							values: [
								"`any` usage, missing contracts, and assertion-heavy paths",
								"Type hardening targets",
								"Capture the weakest interfaces before adding features",
							],
						},
					],
					"Reference matrix for turning structural analysis into a concrete hotspot inventory.",
				),
				buildOutputTemplateArtifact(
					"Structural hotspot scorecard",
					[
						"# Structural hotspot",
						"## Module / file",
						"## Complexity signal",
						"## Coupling signal",
						"## Cohesion concern",
						"## Duplication / dead code note",
						"## Type boundary risk",
						"## Evidence",
						"## Recommended next action",
					].join("\n"),
					[
						"Module / file",
						"Complexity signal",
						"Coupling signal",
						"Cohesion concern",
						"Duplication / dead code note",
						"Type boundary risk",
						"Evidence",
						"Recommended next action",
					],
					"Use one scorecard per candidate hotspot so refactoring discussions stay evidence-backed.",
				),
				buildToolChainArtifact(
					"Code analysis evidence chain",
					[
						{
							tool: "hotspot identification",
							description:
								"find the modules with the most complexity, coupling, or weak type boundaries",
						},
						{
							tool: "evidence capture",
							description:
								"record the concrete function, dependency edge, or contract failure that makes the hotspot risky",
						},
						{
							tool: "ranking",
							description:
								"order the hotspots by change risk and leverage before proposing refactors",
						},
					],
					"Small analysis loop for converting code-reading into ranked structural findings.",
				),
				buildEvalCriteriaArtifact(
					"Structural analysis checklist",
					[
						"Every hotspot names a concrete module or function.",
						"Each finding cites evidence instead of general code-quality language.",
						"The analysis distinguishes complexity, coupling, and cohesion rather than blending them.",
						"Each hotspot ends with a next action the team can sequence or defer.",
					],
					"Checklist for deciding whether the analysis is concrete enough to guide refactoring decisions.",
				),
				buildWorkedExampleArtifact(
					"Structural hotspot example",
					{
						request:
							"Analyze coupling, complexity, duplicate code, and type coverage in the codebase",
					},
					buildStructuralHotspotExample(),
					"Worked example of the evidence and next-action shape expected from a code analysis finding.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	qualCodeAnalysisHandler,
);
