/**
 * gr-frame-dragging-detector.ts
 *
 * Handwritten capability handler for the gr-frame-dragging-detector skill.
 *
 * Physics metaphor: rotating massive objects drag spacetime around them
 * (Lense-Thirring effect). In code: high-churn modules with high coupling
 * drag neighboring modules into unnecessary changes. Frame dragging force
 * ∝ churn_rate × coupling.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-event-horizon-detector      — cascade propagation from fan-in
 *   gr-gravitational-wave-detector — refactor-induced coupling shockwaves
 *   gr-schwarzschild-classifier    — coupling zone classification
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace churn
 * analysis tools (git log --stat, code-churn analyzers).
 */

import { z } from "zod";
import { gr_frame_dragging_detector_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
			churnRate: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Churn rate: number of commits or lines changed per unit time (e.g., per week).",
				),
			coupling: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Coupling count: total afferent + efferent dependency count for the module.",
				),
		})
		.optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Frame dragging force analogue:
 *   F_drag = churn_rate × coupling
 *
 * High F_drag means the module's frequent changes force neighboring modules
 * to update even when they shouldn't.
 */
function frameDraggingForce(churnRate: number, coupling: number): number {
	return churnRate * coupling;
}

type FrameDraggingClass = "critical_drag" | "elevated_drag" | "stable";

function classifyFrameDragging(force: number): FrameDraggingClass {
	if (force > 100) return "critical_drag";
	if (force > 50) return "elevated_drag";
	return "stable";
}

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(frame.?dragging|drag|lense.?thirring|rotating|spin|pull|force)\b/i,
		guidance:
			"Frame dragging force F_drag = churn_rate × coupling. Modules with high churn and high coupling drag their dependents into unnecessary rebuild/retest cycles. Critical drag (F_drag > 100) requires emergency stabilization — freeze the public API and introduce a stable facade layer to shield dependents from internal churn.",
	},
	{
		pattern: /\b(churn|change|volatil|unstable|frequent|commits)\b/i,
		guidance:
			"Churn rate is the rotational velocity analogue. Measure it as commits-per-week or lines-changed-per-sprint for each module. High churn alone is tolerable if coupling is low (internal refactoring). High churn + high coupling creates frame dragging — every internal change propagates to dependents.",
	},
	{
		pattern: /\b(coupling|depend|import|afferent|efferent|consumer)\b/i,
		guidance:
			"Coupling is the mass analogue in frame dragging. A module with 50 dependents and 10 commits/week has F_drag = 500, meaning each commit potentially affects 50 other modules. Reduce coupling via dependency inversion or event-driven decoupling to lower the drag coefficient even if churn remains high.",
	},
	{
		pattern: /\b(shield|stabilize|freeze|isolate|facade|buffer)\b/i,
		guidance:
			"Frame dragging mitigation: introduce a stable facade or adapter layer between the high-churn module and its dependents. Pin dependents to the facade interface, which changes rarely; absorb internal churn behind the facade. This decouples churn from coupling, reducing F_drag to near zero.",
	},
	{
		pattern: /\b(detect|identify|find|scan|measure|discover)\b/i,
		guidance:
			"Detection workflow: (1) compute churn_rate per module from git log (e.g., `git log --since='4 weeks ago' --oneline <file> | wc -l`), (2) measure coupling from dependency graph, (3) compute F_drag = churn × coupling per module, (4) rank by F_drag descending, (5) flag F_drag > 100 as CRITICAL_DRAG.",
	},
	{
		pattern: /\b(neighbor|adjacent|downstream|dependent|consumer|caller)\b/i,
		guidance:
			"Frame dragging affects neighboring modules asymmetrically. Modules directly coupled to the high-churn source suffer the highest drag. Second-degree dependents experience reduced but non-zero drag. Use a dependency walk to quantify the drag radius — modules within 2 edges of a critical-drag source should be flagged for review.",
	},
	{
		pattern: /\b(refactor|redesign|architect|decouple|extract)\b/i,
		guidance:
			"Structural remediation: if a module has persistently high churn due to its core responsibility (e.g., config loader, schema validator), extract it into a separate service or package with a versioned API contract. This isolates the churn and prevents frame dragging across the monolith boundary.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grFrameDraggingDetectorHandler: SkillHandler = {
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
				"Frame Dragging Detector needs a module description, churn metrics, or a change-propagation concern before it can produce drag analysis.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		const opts = parsed.data.options;

		if (opts?.churnRate !== undefined && opts?.coupling !== undefined) {
			const churnRate = opts.churnRate;
			const coupling = opts.coupling;
			const force = frameDraggingForce(churnRate, coupling);
			const cls = classifyFrameDragging(force);

			const clsLabel: Record<typeof cls, string> = {
				critical_drag: "CRITICAL_DRAG",
				elevated_drag: "ELEVATED_DRAG",
				stable: "STABLE",
			};

			guidances.unshift(
				`Advisory computation — churn_rate=${fmtNum(churnRate)}, coupling=${fmtNum(coupling)}: F_drag=${fmtNum(force)} (${clsLabel[cls]}). ` +
					"Validate against your git history and dependency graph before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Frame Dragging Detector: measure churn_rate (commits or LOC changes per time period) and coupling (afferent + efferent) per module. Compute F_drag = churn × coupling. Values > 100 indicate critical drag requiring immediate stabilization.",
				"Mitigation target: introduce stable facade layers for high-drag modules, freeze public APIs, and decouple dependents via dependency inversion or event-driven patterns.",
			);
		}

		if (guidances.length < 2) {
			guidances.push(
				"Operational translation: rank the direct dependents of the highest-drag module and identify which of them are repeatedly touched only because the source module will not hold a stable contract. Those neighbours are the first candidates for shielding or contract tests.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply frame dragging analysis under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure stabilization strategies remain compliant.`,
			);
		}

		guidances.push(GR_STATIC_EVIDENCE_NOTE);

		const sampleChurnRate = opts?.churnRate ?? 9;
		const sampleCoupling = opts?.coupling ?? 14;
		const sampleForce = frameDraggingForce(sampleChurnRate, sampleCoupling);
		const artifacts = [
			buildWorkedExampleArtifact(
				"Frame dragging worked example",
				{
					churnRate: sampleChurnRate,
					coupling: sampleCoupling,
				},
				{
					frameDraggingForce: fmtNum(sampleForce),
					classification: classifyFrameDragging(sampleForce),
					engineeringTranslation:
						"Shield high-churn shared modules behind a stable facade so their edits stop pulling neighbours into the blast radius.",
				},
				"Turns churn and coupling into a concrete stabilization decision.",
			),
			buildComparisonMatrixArtifact(
				"Frame dragging mitigation matrix",
				["Situation", "Meaning", "Recommended move"],
				[
					{
						label: "High churn, high coupling",
						values: [
							"Critical drag source",
							"Neighbouring modules absorb repeated change cost",
							"Freeze the public API and add a stable facade",
						],
					},
					{
						label: "High churn, low coupling",
						values: [
							"Localized volatility",
							"Mostly internal refactoring pressure",
							"Improve tests and internal module structure",
						],
					},
					{
						label: "Low churn, high coupling",
						values: [
							"Load-bearing but stable",
							"Change risk spikes when edits eventually happen",
							"Protect with review gates and dependency reduction",
						],
					},
				],
				"Use this matrix to choose between shielding, monitoring, and decoupling.",
			),
			buildToolChainArtifact(
				"Frame dragging evidence chain",
				[
					{
						tool: "git churn report",
						description:
							"Use existing churn windows or commit summaries instead of claiming live repository recomputation.",
					},
					{
						tool: "dependency graph",
						description:
							"Measure which modules sit closest to the drag source.",
					},
					{
						tool: "stability review",
						description:
							"Decide whether a facade, adapter, or contract freeze is the lowest-risk shield.",
					},
				],
				"Ground the drag metaphor in concrete historical and dependency evidence.",
			),
		];

		return createCapabilityResult(
			context,
			`Frame Dragging Detector produced ${guidances.length} churn-coupling guideline${guidances.length === 1 ? "" : "s"} for change-propagation analysis. Results are advisory.`,
			createFocusRecommendations(
				"Frame dragging guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grFrameDraggingDetectorHandler,
);
