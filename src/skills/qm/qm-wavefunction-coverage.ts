import { z } from "zod";
import { qm_wavefunction_coverage_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	bornCoverageProbability,
	bornWeightedRisk,
	dotProduct,
	fmtNum,
	normalizeVector,
} from "./qm-math-helpers.js";
import {
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
} from "./qm-physics-helpers.js";

const embeddedTestSchema = z.object({
	name: z.string().min(1),
	vector: z.array(z.number()).min(2).max(8),
});

const bugPatternSchema = z.object({
	name: z.string().min(1),
	risk: z.number().min(0).max(1),
	vector: z.array(z.number()).min(2).max(8),
});

const wavefunctionCoverageInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			tests: z.array(embeddedTestSchema).min(1).max(8).optional(),
			bugs: z.array(bugPatternSchema).min(1).max(8).optional(),
		})
		.optional(),
});

const WAVEFUNCTION_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(coverage|covered|blind.spot|uncovered|gap)\b/i,
		detail:
			"Use the wavefunction metaphor to rank probable blind spots, not to replace traditional coverage tooling. It is most helpful when line coverage looks healthy but the team suspects certain bug patterns still lack representative tests.",
	},
	{
		pattern: /\b(risk|severity|priority|p0|critical)\b/i,
		detail:
			"Weighted risk is the action signal. A bug pattern that is slightly uncovered but critical should outrank a completely uncovered low-severity edge case. Tie the ranking back to real severity policy before scheduling test work.",
	},
	{
		pattern: /\b(test|template|augment|edge.case|characterisation)\b/i,
		detail:
			"Top-covering tests are templates, not proof of adequacy. When a bug pattern has partial overlap with an existing test, extend that test with the missing edge condition rather than writing an unrelated new one from scratch.",
	},
	{
		pattern: /\b(embedding|same.space|comparable|vector)\b/i,
		detail:
			"Make sure test and bug embeddings are comparable. Mixing vectors from different encoders, preprocessing pipelines, or abstraction levels makes the squared-overlap number look scientific while actually saying very little.",
	},
];

const wavefunctionCoverageHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(wavefunctionCoverageInputSchema, input);
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
				"Wavefunction Coverage needs tests, bug patterns, or a question about uncovered high-risk behaviour.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const hasDomainSignal =
			/\b(test|bug|coverage|covered|blind.spot|risk|born.rule|wavefunction)\b/i.test(
				combined,
			) ||
			(parsed.data.options?.tests !== undefined &&
				parsed.data.options?.bugs !== undefined);

		if (!hasDomainSignal) {
			return buildInsufficientSignalResult(
				context,
				"Wavefunction Coverage requires test-versus-bug coverage signal — for example which bug patterns are covered, uncovered, or highest risk.",
			);
		}

		let numericDetail: string | undefined;
		if (parsed.data.options?.tests && parsed.data.options?.bugs) {
			const dimensions = new Set([
				...parsed.data.options.tests.map((test) => test.vector.length),
				...parsed.data.options.bugs.map((bug) => bug.vector.length),
			]);
			if (dimensions.size !== 1) {
				return buildInsufficientSignalResult(
					context,
					"Wavefunction Coverage received incompatible vector dimensions.",
					"Ensure every test and bug vector uses the same dimensionality before computing overlap-based coverage guidance.",
				);
			}
			const tests = parsed.data.options.tests.map((test) => ({
				...test,
				vector: normalizeVector(test.vector),
			}));
			const rankedBugs = parsed.data.options.bugs
				.map((bug) => {
					const bugVector = normalizeVector(bug.vector);
					const overlaps = tests.map((test) =>
						dotProduct(test.vector, bugVector),
					);
					const coverage = bornCoverageProbability(overlaps);
					const weightedRisk = bornWeightedRisk(bug.risk, coverage);
					return { ...bug, coverage, weightedRisk };
				})
				.sort((left, right) => right.weightedRisk - left.weightedRisk);
			const topBug = rankedBugs[0];
			if (topBug) {
				numericDetail = `Illustrative Born-rule coverage ranking: highest weighted risk is ${topBug.name} with coverage ≈ ${fmtNum(topBug.coverage)} and weighted risk ≈ ${fmtNum(topBug.weightedRisk)}. ${topBug.coverage < 0.2 ? "This looks like a near-blind spot — write or adapt tests immediately." : topBug.coverage < 0.7 ? "Partial coverage exists — extend the nearest tests with the missing scenario." : "Coverage looks comparatively healthy in this lens."} Treat overlap probabilities as supplementary guidance alongside conventional test analysis.`;
			}
		}

		const details: string[] = [
			"Use wavefunction coverage to prioritise bug patterns by risk-weighted uncovered probability. In plain engineering terms: estimate which classes of failure are poorly represented by the existing tests, then spend test-writing effort where low coverage and high severity intersect.",
		];

		if (numericDetail) details.unshift(numericDetail);
		details.push(...matchAdvisoryRules(WAVEFUNCTION_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Start with a small catalogue of important bug patterns — null handling, boundary conditions, retry behaviour, or type coercion errors. A focused bug vocabulary produces more actionable coverage prioritisation than an open-ended list of vague 'issues'.",
				"Treat total coverage and top-covering tests separately. One tells you whether the bug is protected at all; the other tells you which existing tests are closest to being useful templates.",
			);
		}

		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleTests = parsed.data.options?.tests ?? [
			{ name: "boundary test", vector: [1, 0, 0] },
			{ name: "retry test", vector: [0, 1, 0] },
		];
		const sampleBugs = parsed.data.options?.bugs ?? [
			{ name: "null pointer", risk: 0.9, vector: [0.9, 0.1, 0] },
			{ name: "timing race", risk: 0.7, vector: [0.2, 0.8, 0] },
		];
		const rankedSampleBugs = sampleBugs
			.map((bug) => {
				const bugVector = normalizeVector(bug.vector);
				const overlaps = sampleTests.map((test) =>
					dotProduct(normalizeVector(test.vector), bugVector),
				);
				const coverage = bornCoverageProbability(overlaps);
				const weightedRisk = bornWeightedRisk(bug.risk, coverage);
				return {
					name: bug.name,
					coverage: fmtNum(coverage),
					weightedRisk: fmtNum(weightedRisk),
				};
			})
			.sort(
				(left, right) => Number(right.weightedRisk) - Number(left.weightedRisk),
			);

		const artifacts = [
			buildWorkedExampleArtifact(
				"Wavefunction coverage worked example",
				{
					tests: sampleTests,
					bugs: sampleBugs,
				},
				{
					rankedSampleBugs,
					highestPriorityBug: rankedSampleBugs[0]?.name ?? "null pointer",
					confidence: "medium",
					recommendedAction:
						"Extend the nearest test template before adding brand-new coverage.",
					engineeringTranslation:
						"Focus test effort where the existing suite and the most severe bug pattern barely overlap.",
				},
				"Worked example: rank bug patterns by risk-weighted coverage and translate the result into a test-writing move.",
			),
			buildOutputTemplateArtifact(
				"Wavefunction coverage matrix",
				"| Bug pattern | Risk | Coverage | Weighted risk | Nearest test template | Recommended action |\n| --- | --- | --- | --- | --- | --- |\n|  |  |  |  |  |  |\n|  |  |  |  |  |  |",
				[
					"Bug pattern",
					"Risk",
					"Coverage",
					"Weighted risk",
					"Nearest test template",
					"Recommended action",
				],
				"Template for turning coverage probabilities into a test backlog.",
			),
			buildEvalCriteriaArtifact(
				"Coverage prioritisation rubric",
				[
					"Risk-weighted uncovered probability should rank first.",
					"Coverage below 0.2 is a near-blind spot.",
					"Partial coverage should extend the nearest existing test rather than spawning a duplicate.",
					"Vector dimensions must be comparable before any overlap ranking is trusted.",
				],
				"Criteria for deciding whether a bug pattern deserves immediate test work.",
			),
		];

		return createCapabilityResult(
			context,
			`Wavefunction Coverage produced ${details.length} risk-weighted test-gap advisory items.`,
			createFocusRecommendations(
				"Wavefunction-coverage guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	wavefunctionCoverageHandler,
);
