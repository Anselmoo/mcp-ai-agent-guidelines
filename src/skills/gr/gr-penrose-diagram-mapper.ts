/**
 * gr-penrose-diagram-mapper.ts
 *
 * Handwritten capability handler for the gr-penrose-diagram-mapper skill.
 *
 * Physics metaphor: Penrose diagrams map spacetime using conformal compactification,
 * revealing causal structure. In code: maps commit history and dependency structure
 * to a causal diagram, classifying module pairs as TIMELIKE (dependency chain),
 * LIGHTLIKE (single direct edge), or SPACELIKE (no connection). Identifies
 * spacelike islands — isolated module clusters.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-geodesic-refactor           — refactoring path optimization
 *   gr-event-horizon-detector      — fan-in cascade propagation
 *   gr-gravitational-lensing       — load-bearing module detection
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace dependency
 * graph visualization tools (Graphviz, dependency-cruiser --output-type dot).
 */

import { z } from "zod";
import { gr_penrose_diagram_mapper_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildInsufficientSignalResult,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import { fmtNum, GR_STATIC_EVIDENCE_NOTE } from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			pathLength: z
				.number()
				.int()
				.nonnegative()
				.optional()
				.describe(
					"Shortest dependency path length between two modules (0 = no connection, 1 = direct edge, >1 = transitive chain).",
				),
			moduleCount: z
				.number()
				.int()
				.positive()
				.optional()
				.describe("Total number of modules in the codebase."),
		})
		.optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

type CausalClass = "timelike" | "lightlike" | "spacelike";

/**
 * Classify causal relationship between module pairs:
 *   TIMELIKE   — dependency chain (path length > 1)
 *   LIGHTLIKE  — direct dependency (path length = 1)
 *   SPACELIKE  — no connection (path length = 0 or ∞)
 */
function classifyCausalRelation(pathLength: number): CausalClass {
	if (pathLength === 0) return "spacelike";
	if (pathLength === 1) return "lightlike";
	return "timelike";
}

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(penrose|diagram|conformal|causal|structure|map)\b/i,
		guidance:
			"Penrose diagram mapping classifies module pairs by causal relationship. TIMELIKE pairs have a dependency chain (A → B → C); changes in A eventually affect C. LIGHTLIKE pairs have a direct edge (A → B). SPACELIKE pairs are disconnected — they can be developed independently. Use causal classification to identify safe parallelization boundaries.",
	},
	{
		pattern: /\b(timelike|chain|transitive|path|cascade|downstream)\b/i,
		guidance:
			"TIMELIKE module pairs are causally connected through a dependency chain (path length > 1). Changes propagate along the chain with time delay proportional to path length. Long chains (> 5 edges) indicate architectural coupling debt — consider introducing a direct interface or event bus to shorten the causal path.",
	},
	{
		pattern: /\b(lightlike|direct|edge|immediate|neighbor|adjacent)\b/i,
		guidance:
			"LIGHTLIKE module pairs have a single direct dependency edge (path length = 1). Changes propagate immediately. High LIGHTLIKE fan-out (> 10 direct dependents) indicates a potential load-bearing module — apply gravitational lensing analysis to quantify the risk.",
	},
	{
		pattern:
			/\b(spacelike|island|isolated|disconnected|independent|cluster)\b/i,
		guidance:
			"SPACELIKE module pairs are causally disconnected (no dependency path). They form spacelike islands — isolated clusters that can be developed, tested, and deployed independently. Identify islands using connected-component analysis on the dependency graph. Islands are candidates for extraction into separate packages or microservices.",
	},
	{
		pattern: /\b(detect|identify|find|discover|map|visualize)\b/i,
		guidance:
			"Detection workflow: (1) construct the dependency graph (e.g., `dependency-cruiser --output-type json`), (2) compute all-pairs shortest paths using Floyd-Warshall or BFS, (3) classify each module pair as TIMELIKE (path > 1), LIGHTLIKE (path = 1), or SPACELIKE (path = 0), (4) identify connected components to find spacelike islands.",
	},
	{
		pattern: /\b(dependency|import|require|depend|coupling|call.?graph)\b/i,
		guidance:
			"Dependency graph is the spacetime fabric. Each module is an event; each import/dependency is a causal edge. Path length measures causal distance. Modules with high average path length to the rest of the graph are architecturally distant — they're either deep in a subsystem or poorly integrated. Flag modules with mean path > 5 for architectural review.",
	},
	{
		pattern:
			/\b(split|extract|separate|modularize|microservice|package|isolate)\b/i,
		guidance:
			"Spacelike island extraction strategy: (1) identify connected components in the dependency graph, (2) for each island with > 5 modules, evaluate if it represents a coherent domain (e.g., auth, billing, reporting), (3) if coherent, extract the island into a separate package or service with a versioned API contract, (4) verify no hidden runtime coupling remains (e.g., shared globals, message queues).",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grPenroseDiagramMapperHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(inputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Penrose Diagram Mapper needs a dependency scenario, path metrics, or a causal-structure concern before it can produce causal classification guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		const opts = parsed.data.options;

		if (opts?.pathLength !== undefined) {
			const pathLength = opts.pathLength;
			const causal = classifyCausalRelation(pathLength);

			const causalLabel: Record<typeof causal, string> = {
				timelike: "TIMELIKE",
				lightlike: "LIGHTLIKE",
				spacelike: "SPACELIKE",
			};

			guidances.unshift(
				`Advisory computation — path_length=${fmtNum(pathLength)}: causal_class=${causalLabel[causal]}. ` +
					"Validate against your dependency graph before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Penrose Diagram Mapper: compute all-pairs shortest paths in the dependency graph. Classify module pairs as TIMELIKE (path > 1), LIGHTLIKE (path = 1), or SPACELIKE (path = 0). Use connected-component analysis to identify spacelike islands — candidates for extraction.",
				"Strategic use: spacelike islands can be developed in parallel, deployed independently, and extracted into separate packages or services with minimal integration risk.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply causal mapping under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure island extraction strategies remain compliant.`,
			);
		}

		guidances.push(GR_STATIC_EVIDENCE_NOTE);

		const samplePathLength = opts?.pathLength ?? 3;
		const sampleCausal = classifyCausalRelation(samplePathLength);
		const artifacts = [
			buildWorkedExampleArtifact(
				"Penrose causal mapping worked example",
				{
					pathLength: samplePathLength,
					moduleCount: opts?.moduleCount ?? 18,
				},
				{
					causalClass: sampleCausal,
					engineeringTranslation:
						sampleCausal === "spacelike"
							? "These modules are good candidates for parallel work or extraction."
							: sampleCausal === "lightlike"
								? "Changes propagate immediately, so coordinate direct dependents."
								: "Expect transitive effects along the chain before you refactor.",
				},
				"Turns causal classes into a dependency planning decision.",
			),
			buildComparisonMatrixArtifact(
				"Causal relationship matrix",
				["Class", "Meaning", "Engineering move"],
				[
					{
						label: "SPACELIKE",
						values: [
							"No dependency path",
							"Independent island",
							"Develop or extract in parallel after checking hidden runtime coupling",
						],
					},
					{
						label: "LIGHTLIKE",
						values: [
							"One direct edge",
							"Immediate propagation path",
							"Coordinate the neighbour and verify contract tests",
						],
					},
					{
						label: "TIMELIKE",
						values: [
							"Transitive dependency chain",
							"Changes ripple through intermediates",
							"Map the sequence before touching upstream nodes",
						],
					},
				],
				"Use this matrix when turning the Penrose metaphor into dependency-ordering work.",
			),
			buildToolChainArtifact(
				"Causal mapping evidence chain",
				[
					{
						tool: "dependency graph export",
						description:
							"Use an existing graph snapshot rather than claiming live all-pairs path recomputation.",
					},
					{
						tool: "connected component analysis",
						description:
							"Identify spacelike islands and check whether they align with real domain seams.",
					},
					{
						tool: "runtime contract review",
						description:
							"Confirm that apparently disconnected islands are not still coupled by globals or queues.",
					},
				],
				"Keep the causal diagram grounded in static graph evidence and explicit follow-up checks.",
			),
		];

		return createCapabilityResult(
			context,
			`Penrose Diagram Mapper produced ${guidances.length} causal-structure guideline${guidances.length === 1 ? "" : "s"}. Results are advisory.`,
			createFocusRecommendations(
				"Penrose diagram guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grPenroseDiagramMapperHandler,
);
