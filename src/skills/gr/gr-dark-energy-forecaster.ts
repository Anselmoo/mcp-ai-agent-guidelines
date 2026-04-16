/**
 * gr-dark-energy-forecaster.ts
 *
 * Handwritten capability handler for the gr-dark-energy-forecaster skill.
 *
 * Physics metaphor: "dark energy" drives invisible complexity expansion in
 * codebases. Convention-driven growth (boilerplate, implicit config, naming
 * violations) increases module volume without proportional functional benefit,
 * analogous to cosmological dark energy pushing spacetime apart.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-inflation-detector         — exponential module-size growth detection
 *   gr-spacetime-debt-metric       — overall curvature score
 *   gr-hawking-entropy-auditor     — public API surface entropy
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace static
 * analysis tools (eslint, sonar, code coverage).
 */

import { z } from "zod";
import { gr_dark_energy_forecaster_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import { fmtNum } from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			linesOfCode: z
				.number()
				.nonnegative()
				.optional()
				.describe("Total lines of code in the module."),
			conventionLines: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Lines devoted to convention adherence (boilerplate, naming prefixes, config stubs).",
				),
			functionalLines: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Lines contributing directly to functional requirements (actual business logic).",
				),
		})
		.optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Dark energy density analogue:
 *   ρ_Λ = convention_lines / (functional_lines + ε)
 *
 * High ρ_Λ indicates invisible complexity growth without value.
 */
function darkEnergyDensity(
	conventionLines: number,
	functionalLines: number,
): number {
	return conventionLines / Math.max(functionalLines, 1);
}

type DarkEnergyClass = "cosmological_constant" | "elevated" | "normal";

function classifyDarkEnergy(density: number): DarkEnergyClass {
	if (density > 1.5) return "cosmological_constant";
	if (density > 0.8) return "elevated";
	return "normal";
}

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(dark.?energy|invisible|hidden|expansion|cosmological|constant)\b/i,
		guidance:
			"Dark energy density ρ_Λ = convention_lines / functional_lines. Values > 1.5 indicate COSMOLOGICAL_CONSTANT regime — the module is expanding driven by convention overhead rather than functional requirements. Remediation: refactor shared conventions into reusable base classes or code-gen templates; aim to reduce ρ_Λ below 0.5.",
	},
	{
		pattern: /\b(boilerplate|template|scaffold|repetit|copy.?paste)\b/i,
		guidance:
			"Boilerplate is the primary dark energy source. Each repeated pattern (factory constructor, error-handling wrapper, type guard) increases convention_lines without adding unique functional behavior. Extract common patterns into shared utilities or introduce code generation for high-frequency repetitive blocks.",
	},
	{
		pattern: /\b(naming|convention|prefix|suffix|pattern|standard)\b/i,
		guidance:
			"Naming convention overhead contributes to dark energy when prefixes/suffixes encode metadata already available through type systems or module boundaries (e.g., `IUserService`, `UserServiceImpl`, `AbstractBaseUserService`). Collapse redundant naming layers; rely on directory structure and types to convey intent instead of string tokens.",
	},
	{
		pattern: /\b(config|setup|initiali[sz]|bootstrap|wire|plumb)\b/i,
		guidance:
			"Implicit configuration and wiring code are invisible expansion drivers. Each module that requires manual dependency injection setup or environment config adds convention_lines. Adopt convention-over-configuration frameworks or auto-wiring containers; centralize setup logic in a single initialization module to isolate the dark energy density spike.",
	},
	{
		pattern: /\b(reduction|remediat|shrink|compress|eliminate|clean)\b/i,
		guidance:
			"Dark energy remediation operator: (1) measure ρ_Λ per module, (2) identify the dominant source (boilerplate, naming, config, test setup), (3) apply the corresponding reduction tactic (extraction, renaming, auto-wiring, shared fixtures), (4) re-measure ρ_Λ and verify reduction > 30% before marking complete.",
	},
	{
		pattern: /\b(test|fixture|mock|stub|harness)\b/i,
		guidance:
			"Test setup and fixture boilerplate are often the highest dark energy contributors. A functional test requires 5 lines but 40 lines of mock setup → ρ_Λ = 8. Consolidate test fixtures into shared builders or factory functions; prefer inline data literals over heavy object graph construction when test intent permits.",
	},
	{
		pattern: /\b(forecast|predict|trend|growth|rate|accelerat)\b/i,
		guidance:
			"Dark energy forecast: if convention_lines are growing faster than functional_lines across sprints, the module is entering accelerated expansion. Track ρ_Λ = convention / functional over time. A rising trend indicates compounding technical debt; trigger a cleanup sprint before ρ_Λ > 1.5.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grDarkEnergyForecasterHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Dark Energy Forecaster needs a module description, LOC metrics, or a convention-debt concern before it can produce expansion analysis.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		// Lightweight numeric computation when explicit options are provided.
		const parsed = parseSkillInput(inputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		if (
			opts?.conventionLines !== undefined &&
			opts?.functionalLines !== undefined
		) {
			const conventionLines = opts.conventionLines;
			const functionalLines = opts.functionalLines;
			const density = darkEnergyDensity(conventionLines, functionalLines);
			const cls = classifyDarkEnergy(density);

			const clsLabel: Record<typeof cls, string> = {
				cosmological_constant: "COSMOLOGICAL_CONSTANT",
				elevated: "ELEVATED",
				normal: "NORMAL",
			};

			guidances.unshift(
				`Advisory computation — convention_lines=${fmtNum(conventionLines)}, functional_lines=${fmtNum(functionalLines)}: ρ_Λ=${fmtNum(density)} (${clsLabel[cls]}). ` +
					"Validate against your codebase metrics before acting.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Dark Energy Forecaster: separate LOC into convention_lines (boilerplate, config, naming ceremony) and functional_lines (actual business logic). Compute ρ_Λ = convention / functional. Values > 1.5 warrant immediate cleanup; values > 0.8 should be monitored.",
				"Target remediation: extract shared patterns into libraries, switch to convention-over-configuration frameworks, and collapse redundant naming layers to drive ρ_Λ toward 0.5 or below.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply dark energy analysis under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure convention reduction strategies remain compliant.`,
			);
		}

		return createCapabilityResult(
			context,
			`Dark Energy Forecaster produced ${guidances.length} convention-debt guideline${guidances.length === 1 ? "" : "s"} for invisible complexity expansion analysis. Results are advisory.`,
			createFocusRecommendations(
				"Dark energy guidance",
				guidances,
				context.model.modelClass,
			),
			[
				buildWorkedExampleArtifact(
					"Dark energy translation example",
					{
						conventionLines: 42,
						functionalLines: 28,
						moduleShape: "service wrapper with repeated setup blocks",
					},
					{
						rhoLambda: 1.5,
						classification: "cosmological_constant",
						plainEnglish:
							"The module is growing mostly by ceremony, so remove repetition before adding new features.",
					},
					"Shows how invisible expansion becomes an engineering decision in plain language.",
				),
				buildComparisonMatrixArtifact(
					"Dark energy remediation matrix",
					["Use when", "What changes", "Tradeoff"],
					[
						{
							label: "Extract shared helper",
							values: [
								"Many files repeat the same boilerplate",
								"Moves convention lines into one reusable place",
								"Can hide logic if the helper grows too broad",
							],
						},
						{
							label: "Introduce codegen template",
							values: [
								"Several modules differ only by naming or wiring",
								"Automates repetitive structure",
								"Adds tooling overhead and template upkeep",
							],
						},
						{
							label: "Collapse naming ceremony",
							values: [
								"Prefixes/suffixes add no semantic value",
								"Reduces surface noise",
								"Requires team agreement on new conventions",
							],
						},
					],
					"Use this when you need a quick choice between the most common dark-energy reductions.",
				),
				buildOutputTemplateArtifact(
					"Dark energy cleanup note",
					`Module:
Convention lines:
Functional lines:
ρΛ = convention / functional:
Primary source of expansion:
Recommended fix:
Plain-language translation:`,
					[
						"Module",
						"Convention lines",
						"Functional lines",
						"ρΛ",
						"Primary source of expansion",
						"Recommended fix",
						"Plain-language translation",
					],
					"Use this template when turning the metaphor into a short refactoring note.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grDarkEnergyForecasterHandler,
);
