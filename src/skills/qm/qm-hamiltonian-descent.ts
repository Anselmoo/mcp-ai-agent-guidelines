import { z } from "zod";
import { qm_hamiltonian_descent_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
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
import {
	arithmeticMean,
	energyFromPenalty,
	fmtNum,
	qualityPenalty,
} from "./qm-math-helpers.js";
import {
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
} from "./qm-physics-helpers.js";

const moduleMetricSchema = z.object({
	name: z.string().min(1),
	complexity: z.number().min(0).max(1),
	coupling: z.number().min(0).max(1),
	coverage: z.number().min(0).max(1),
	churn: z.number().min(0).max(1),
});

const hamiltonianDescentInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			rankingMode: z
				.enum(["quality-first", "parallel-remediation", "repair-vector"])
				.optional(),
			modules: z.array(moduleMetricSchema).min(2).max(8).optional(),
		})
		.optional(),
});

const HAMILTONIAN_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(fix.first|what.should.i.fix|priority|rank|ground.state)\b/i,
		detail:
			"Use the ground-state metaphor to keep the priority rule honest: fix the module with the worst combined quality signal first unless an external factor explicitly overrides that choice. Teams often know which module is most broken but still spread effort thinly across easier cosmetic work.",
	},
	{
		pattern: /\b(complex|cyclomatic|branch|nested)\b/i,
		detail:
			"High complexity as the dominant penalty usually means the first repair vector is code-shape reduction: smaller functions, extracted decision objects, and simplified control flow. Do not start with naming cleanups if the energy is being driven by branching complexity.",
	},
	{
		pattern: /\b(coupl|depend|fan.out|fan.in|import)\b/i,
		detail:
			"When coupling dominates the penalty, the repair vector should target boundaries rather than internals: interface seams, dependency injection, or consolidation of repeated orchestration. Coupled modules rarely improve durably through local tidy-up alone.",
	},
	{
		pattern: /\b(coverage|test|untested|churn)\b/i,
		detail:
			"Coverage and churn together tell you whether a module is both unstable and unsafe to change. If a module sits low in energy because of high churn and poor coverage, add characterisation tests before structural work. Otherwise the ranking identifies the hotspot but not a safe way to move it upward.",
	},
];

const hamiltonianDescentHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(hamiltonianDescentInputSchema, input);
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
				"Hamiltonian Descent needs module-quality signals or a question about fix order. Describe the modules and metrics involved before requesting a repair ranking.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const hasDomainSignal =
			/\b(fix.first|rank|priority|ground.state|energy|penalty|module|quality|complexity|coupling|coverage|churn)\b/i.test(
				combined,
			) || parsed.data.options?.modules !== undefined;

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Hamiltonian Descent requires module-priority signal — for example fix order, quality ranking, ground state, or concrete quality metrics.",
			);
		}

		const rankingMode = parsed.data.options?.rankingMode ?? "quality-first";
		let numericDetail: string | undefined;
		if (parsed.data.options?.modules) {
			const ranked = parsed.data.options.modules
				.map((module) => {
					const penalty = qualityPenalty(
						module.complexity,
						module.coupling,
						module.coverage,
						module.churn,
					);
					const energy = energyFromPenalty(penalty);
					return { ...module, penalty, energy };
				})
				.sort((left, right) => left.energy - right.energy);
			const meanEnergy = arithmeticMean(ranked.map((module) => module.energy));
			const ground = ranked[0];
			const next = ranked[1];
			const gap = (next?.energy ?? ground?.energy ?? 0) - (ground?.energy ?? 0);
			const gapLabel =
				gap > 0.3
					? "clear priority"
					: gap > 0.1
						? "moderate separation"
						: "degenerate cluster";
			if (ground) {
				numericDetail = `Illustrative Hamiltonian ranking from supplied module metrics. Ground state: ${ground.name} with penalty ${fmtNum(ground.penalty)} and energy ${fmtNum(ground.energy)}. Ensemble mean energy ≈ ${fmtNum(meanEnergy)}, spectral gap Δ ≈ ${fmtNum(gap)} (${gapLabel}). ${gap > 0.3 ? "Concentrate on the worst module first." : "Multiple modules are similarly unhealthy — parallel remediation may be justified if capacity exists."} This is a supplementary quality-only ranking, not a business-priority decision.`;
			}
		}

		const details: string[] = [
			`Use Hamiltonian Descent to rank technical-quality hotspots under the ${rankingMode} mode. In plain engineering terms: combine complexity, coupling, coverage deficit, and churn into one penalty score, then fix the modules with the lowest quality energy first. This should remain supplementary to business impact, but it is a strong tie-breaker when several refactoring candidates feel equally painful.`,
		];

		if (numericDetail) details.unshift(numericDetail);
		details.push(...matchAdvisoryRules(HAMILTONIAN_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Normalise the metrics before ranking. If one input is raw cyclomatic complexity and another is already a 0–1 score, the ordering will look mathematically crisp but be operationally meaningless.",
				"Pair every ranked module with a repair vector in plain language: what boundary to reduce, what tests to add, or what churn source to stabilise. Ranking without the first remedial move only tells the team where to worry.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Treat the stated constraints as execution modifiers, not as quality inputs: ${signals.constraintList.slice(0, 3).join("; ")}. They may change what can be fixed this sprint, but they do not change which module is the technical ground state.`,
			);
		}

		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleModules = parsed.data.options?.modules ?? [
			{
				name: "auth-service",
				complexity: 0.8,
				coupling: 0.7,
				coverage: 0.4,
				churn: 0.6,
			},
			{
				name: "reporting-job",
				complexity: 0.5,
				coupling: 0.4,
				coverage: 0.7,
				churn: 0.3,
			},
		];
		const rankedModules = sampleModules
			.map((module) => {
				const penalty = qualityPenalty(
					module.complexity,
					module.coupling,
					module.coverage,
					module.churn,
				);
				const energy = energyFromPenalty(penalty);
				return {
					name: module.name,
					penalty: fmtNum(penalty),
					energy: fmtNum(energy),
				};
			})
			.sort((left, right) => Number(left.energy) - Number(right.energy));

		const artifacts = [
			buildWorkedExampleArtifact(
				"Hamiltonian ranking worked example",
				{
					modules: sampleModules,
				},
				{
					rankedModules,
					groundState: rankedModules[0]?.name ?? "auth-service",
					confidence: "high",
					recommendedAction:
						"Fix the highest-energy module first and pair it with a concrete repair vector.",
					engineeringTranslation:
						"The worst combined quality signal should usually be the first refactoring target unless business constraints say otherwise.",
				},
				"Worked example: show how the lowest-energy module becomes the first repair target and how to explain that to the team.",
			),
			buildEvalCriteriaArtifact(
				"Hamiltonian fix-order rubric",
				[
					"Penalty is computed from complexity, coupling, coverage deficit, and churn on a 0-1 scale.",
					"Energy should be compared relative to the rest of the module set, not as an absolute truth.",
					"Repair vectors must include one concrete boundary or test change.",
					"Constraints may change delivery order but should not change the ground-state ranking.",
				],
				"Criteria for deciding whether the rank is strong enough to drive a refactor plan.",
			),
			buildOutputTemplateArtifact(
				"Hamiltonian repair-plan template",
				"| Module | Complexity | Coupling | Coverage | Churn | Penalty | Energy | Confidence | First repair vector |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n|  |  |  |  |  |  |  |  |  |\n|  |  |  |  |  |  |  |  |  |",
				[
					"Module",
					"Complexity",
					"Coupling",
					"Coverage",
					"Churn",
					"Penalty",
					"Energy",
					"Confidence",
					"First repair vector",
				],
				"Template for translating the ranking into a scoped refactoring plan.",
			),
		];

		return createCapabilityResult(
			context,
			`Hamiltonian Descent produced ${details.length} fix-order advisory items (mode: ${rankingMode}).`,
			createFocusRecommendations(
				"Hamiltonian descent guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	hamiltonianDescentHandler,
);
