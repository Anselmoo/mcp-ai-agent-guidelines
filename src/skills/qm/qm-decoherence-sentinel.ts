import { z } from "zod";
import { qm_decoherence_sentinel_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
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
import { decoherenceTime, fmtNum } from "./qm-math-helpers.js";
import {
	DECOHERENCE_CHANNEL_LABELS,
	hasTestFlakinesSignal,
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	QM_STATIC_EVIDENCE_NOTE,
} from "./qm-physics-helpers.js";

// ISOLATION CONTRACT: qm-decoherence-sentinel classifies flaky tests by their
// decoherence channel (timing, resource, ordering, environment, external) and
// advises on remediation sequencing using coherence time T₂ as the priority signal.
//
// Scope boundaries — do NOT surface guidance belonging to:
//   qm-wavefunction-coverage — Born-rule test coverage probability vs. bug patterns
//   qual-review              — general code review and quality assessment
//   debug-reproduction       — specific bug reproduction strategies
//
// This handler is advisory only: it classifies failure modes and recommends
// remediation order; it does not inspect test code or run test suites.

const decoherenceSentinelInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			primaryChannel: z
				.enum(["timing", "resource", "ordering", "environment", "external"])
				.optional()
				.describe(
					"Primary decoherence channel to focus on: timing (race conditions, sleep assertions), resource (shared state, connection leaks), ordering (test execution order dependency), environment (CI drift, OS differences), or external (network, APIs, time-of-day).",
				),
			remediationPriority: z
				.enum(["fastest-fix", "highest-impact", "lowest-risk"])
				.optional()
				.describe(
					"Remediation prioritisation strategy: fastest-fix (tackle the quickest channel first), highest-impact (tackle the channel causing the most CI failures), or lowest-risk (tackle the safest channel to change first).",
				),
			timingRate: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Empirical failure rate for the timing decoherence channel (0–1). γ_timing in the Lindblad model.",
				),
			resourceRate: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Empirical failure rate for the resource-leak channel (0–1). γ_resource.",
				),
			orderingRate: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Empirical failure rate for the ordering-dependency channel (0–1). γ_ordering.",
				),
			envRate: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Empirical failure rate for the environment-instability channel (0–1). γ_environment.",
				),
			externalRate: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe(
					"Empirical failure rate for the external-dependency channel (0–1). γ_external.",
				),
		})
		.optional(),
});

type PrimaryChannel =
	| "timing"
	| "resource"
	| "ordering"
	| "environment"
	| "external";
type RemediationPriority = "fastest-fix" | "highest-impact" | "lowest-risk";

const DECOHERENCE_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(flak|flaky|intermittent|unreliable|non.deterministic|sometimes.pass|sometimes.fail)\b/i,
		detail:
			"Begin flakiness remediation by classifying each failing test into exactly one primary decoherence channel. A test assigned to multiple channels is not classified yet — it means the root cause is still unknown. Spend time isolating the dominant failure mode before attempting any fix. Tests with an unknown channel should be quarantined (skipped in CI with a tracking ticket) rather than re-run indefinitely, since unclassified retries mask other failures and inflate CI time.",
	},
	{
		pattern:
			/\b(timing|sleep|delay|timeout|race.condition|async|await|eventually|wait.for)\b/i,
		detail:
			"Timing-channel flakiness (Lindblad γ_timing) is the most common and fastest to fix. The diagnostic signature is: test passes when run in isolation but fails under parallel load, or passes when a `sleep()` is increased. The fix is to replace time-based waits with explicit state-readiness assertions: poll for a specific observable condition with a bounded retry loop rather than sleeping for an assumed duration. Never increase a sleep value as a fix — it defers the failure rather than resolving it.",
	},
	{
		pattern:
			/\b(shared.state|mutable|global|singleton|static|resource.leak|pool|connection|thread)\b/i,
		detail:
			"Resource-channel flakiness (Lindblad γ_resource) comes from shared mutable state that accumulates across test runs. Diagnostic signature: test fails after a sequence of other tests but passes when run first in a fresh process. The fix requires identifying every shared resource the test touches (database rows, in-process caches, file system state, connection pool slots) and establishing explicit setup/teardown that returns each resource to a known state. Shared test fixtures that are mutated are the primary cause — replace them with factory functions that create fresh instances per test.",
	},
	{
		pattern:
			/\b(order|sequence|depend.on.prev|depend.on.other|run.before|after|before.each|after.each)\b/i,
		detail:
			"Ordering-channel flakiness (Lindblad γ_ordering) indicates a test that assumes prior tests have run and left the system in a particular state. Diagnostic signature: test passes in a fixed execution order but fails when randomised. The fix is to make each test completely self-contained: every precondition the test needs must be established within the test's own setup block, not inherited from the surrounding suite. Randomise test execution order in CI to surface these dependencies before they reach production.",
	},
	{
		pattern:
			/\b(env|environment|ci|config|machine|platform|os|version|container|docker|runner)\b/i,
		detail:
			"Environment-channel flakiness (Lindblad γ_environment) is the hardest to reproduce locally because it is caused by differences between developer machines and CI runners (OS version, locale, timezone, file path conventions, available memory, CPU count). Diagnostic signature: test reliably passes locally but intermittently fails in CI. The fix requires pinning all environmental assumptions: use explicit UTC timestamps, normalise file paths, set locale explicitly in test setup, and version-pin runtime dependencies in the CI container. Add an environment-audit step that logs the runner configuration at the start of each CI run.",
	},
	{
		pattern:
			/\b(external|network|api|http|database|third.party|time.of.day|clock|date|now)\b/i,
		detail:
			"External-channel flakiness (Lindblad γ_external) comes from real network calls, third-party APIs, or clock-dependent logic in tests. Diagnostic signature: test failure correlates with network availability or time-of-day. The fix is to eliminate the external dependency in the test boundary: mock or stub the external call at the service boundary, inject a deterministic clock (use a fixed timestamp rather than `Date.now()`), and treat any test that makes a real network call as an integration test that belongs in a separate suite with explicit network access and longer timeouts.",
	},
	{
		pattern: /\b(quarantin|skip|disable|tag|mark|isolat|separate|suite)\b/i,
		detail:
			"Quarantine flaky tests as soon as they are identified rather than re-running them indefinitely. The quarantine protocol: (1) tag the test with `@flaky` or equivalent, (2) move it to a separate CI stage that does not block the main pipeline, (3) create a tracking ticket with the channel classification and failure rate, (4) set a maximum quarantine duration (two sprints is a common policy). Tests that remain quarantined beyond the deadline should be deleted — a test that cannot be made deterministic in two sprints is not a reliable safety net.",
	},
	{
		pattern:
			/\b(t2|coherence.time|priority|rank|which.first|worst|most.flak)\b/i,
		detail:
			"Prioritise remediation by effective coherence time T₂ = 1 / ∑γₖ, where γₖ is the empirical failure rate for each channel. Tests with the shortest T₂ (highest total failure rate across all channels) are the least coherent and should be addressed first — they are degrading CI reliability the most per unit time. Within the same T₂ tier, prioritise tests that cover high-risk code paths (critical payment flows, authentication, data writes) over tests that cover low-risk utility code.",
	},
	{
		pattern: /\b(retry|re.run|re-run|flake.attempt|attempt)\b/i,
		detail:
			"Do not rely on test retry mechanisms as a long-term flakiness strategy. Retries hide the failure rate rather than reducing it, they inflate CI time, and they create false confidence by masking tests that are only passing one out of three attempts. Retries are acceptable as a 24-hour emergency measure while a tracking ticket is created, but should be removed as soon as the root cause is classified. Measure and report the retry rate in CI metrics so it is visible in engineering reviews.",
	},
];

const channelLabels: Record<PrimaryChannel, string> = {
	timing: DECOHERENCE_CHANNEL_LABELS.timing,
	resource: DECOHERENCE_CHANNEL_LABELS.resource,
	ordering: DECOHERENCE_CHANNEL_LABELS.ordering,
	environment: DECOHERENCE_CHANNEL_LABELS.environment,
	external: DECOHERENCE_CHANNEL_LABELS.external,
};

const remediationLabels: Record<RemediationPriority, string> = {
	"fastest-fix": "fastest-fix (tackle the quickest-to-resolve channel first)",
	"highest-impact":
		"highest-impact (tackle the channel causing the most CI failures)",
	"lowest-risk": "lowest-risk (tackle the safest channel to change first)",
};

const decoherenceSentinelHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(decoherenceSentinelInputSchema, input);
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
				"Decoherence Sentinel needs a description of the flaky tests, their observed failure patterns, or the test suite context. Provide at least: (1) which tests are flaky, and (2) how the failures manifest (timing, ordering, environment, etc.).",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		if (!hasTestFlakinesSignal(combined) && signals.keywords.length < 4) {
			return buildInsufficientSignalResult(
				context,
				"Decoherence Sentinel requires signal about test flakiness or reliability issues (e.g., intermittent failures, race conditions, timing-dependent tests). Describe the test failure patterns so decoherence channel classification can be applied.",
			);
		}

		const optionGammas = [
			{ label: "timing", value: parsed.data.options?.timingRate },
			{ label: "resource", value: parsed.data.options?.resourceRate },
			{ label: "ordering", value: parsed.data.options?.orderingRate },
			{ label: "environment", value: parsed.data.options?.envRate },
			{ label: "external", value: parsed.data.options?.externalRate },
		].filter(
			(entry): entry is { label: string; value: number } =>
				entry.value !== undefined,
		);
		const gammaEntries = optionGammas;
		let numericDetail: string | undefined;
		if (gammaEntries.some(({ value }) => value > 0)) {
			const gammas = gammaEntries.map(({ value }) => value);
			const sumGamma = gammas.reduce((sum, gamma) => sum + gamma, 0);
			const T2 = decoherenceTime(gammas);
			const breakdown = gammaEntries
				.map(
					({ label, value }) =>
						`${label}=${fmtNum(value)} (${fmtNum((value / sumGamma) * 100)}%)`,
				)
				.join("; ");
			numericDetail = `Illustrative T₂ computation from provided failure rates. Σγ = ${fmtNum(sumGamma)}, T₂ = 1/Σγ = ${fmtNum(T2)}. ${breakdown}. ${T2 < 10 ? "Short T₂: this test is critically flaky — address immediately." : T2 < 50 ? "Moderate T₂: schedule remediation within one sprint." : "Long T₂: relatively stable — monitor but not urgent."} Rates are advisory inputs; calibrate against your actual CI failure data.`;
		}

		const primaryChannel = parsed.data.options?.primaryChannel;
		const remediationPriority =
			parsed.data.options?.remediationPriority ?? "highest-impact";

		const channelContext = primaryChannel
			? `focusing on the ${channelLabels[primaryChannel]} channel`
			: "across all decoherence channels";

		const details: string[] = [
			`Apply decoherence channel classification to the flaky test set, ${channelContext}, using the ${remediationLabels[remediationPriority]} prioritisation strategy. In plain test-infrastructure terms: each test is a signal that starts in a known clean state; a "decoherence channel" is the specific mechanism that corrupts it — timing jitter, shared-resource pollution, execution-order coupling, environment drift, or external-service instability. Each channel has a failure rate γ (fraction of CI runs that fail through that channel). The coherence time T₂ = 1/Σγₖ is the inverse of the total failure rate: a test failing on 20% of runs has T₂ ≈ 5, meaning it will corrupt your CI signal roughly every five runs. The Lindblad framing (the quantum-mechanics analogy) adds no physics beyond this — it is a structured vocabulary for separating the channels so each is diagnosed and fixed independently rather than treated as one undifferentiated "flakiness" problem. The classification maps each test's failure mode onto one of five channels: ${Object.values(DECOHERENCE_CHANNEL_LABELS).join("; ")}. Tests are then ranked by T₂ — shorter T₂ means the test is failing more often and should be remediated first.`,
		];

		if (numericDetail) {
			details.unshift(numericDetail);
		}

		details.push(...matchAdvisoryRules(DECOHERENCE_RULES, combined));

		if (details.length === 1) {
			details.push(
				"Start the classification by collecting failure-mode evidence for each flaky test: how often it fails, whether it is consistently reproducible under a specific condition (parallel load, specific execution order, specific CI runner), and what the failure message is. Without this evidence, channel classification is guesswork and remediation fixes the wrong problem.",
				"Produce a coherence register: a table with columns — test name, primary channel, estimated γ (failure rate), T₂ rank, and assigned remediation owner. This register is the input to the remediation sprint planning session. Teams without a coherence register typically address flakiness in the order tests are noticed rather than the order they matter.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the provided test context to anchor channel classification. Look for: (1) test names with 'async', 'wait', or timing verbs (timing channel), (2) tests that reference shared fixtures or databases (resource channel), (3) tests with explicit ordering annotations (ordering channel), (4) tests with CI-only failure comments (environment channel), (5) tests that call HTTP endpoints or external services (external channel).",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply remediation within these constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints on sprint capacity determine how many tests can be remediated per cycle. Use the coherence register to select the highest-T₂-impact tests that fit within the constraint budget — do not attempt to fix all channels simultaneously if the constraint is time.`,
			);
		}

		details.push(QM_STATIC_EVIDENCE_NOTE);
		details.push(QM_ADVISORY_DISCLAIMER);

		const sampleRates = {
			timing: parsed.data.options?.timingRate ?? 0.18,
			resource: parsed.data.options?.resourceRate ?? 0.04,
			ordering: parsed.data.options?.orderingRate ?? 0.09,
			environment: parsed.data.options?.envRate ?? 0.03,
			external: parsed.data.options?.externalRate ?? 0.02,
		};
		const sampleEntries = Object.entries(sampleRates);
		const sampleGammas = sampleEntries.map(([, value]) => value);
		const sampleT2 = decoherenceTime(sampleGammas);

		return createCapabilityResult(
			context,
			`Decoherence Sentinel produced ${details.length} flaky-test classification advisory items (${channelContext}, priority: ${remediationLabels[remediationPriority]}).`,
			createFocusRecommendations(
				"Decoherence sentinel guidance",
				details,
				context.model.modelClass,
			),
			[
				buildWorkedExampleArtifact(
					"Decoherence triage worked example",
					{
						primaryChannel: primaryChannel ?? "timing",
						remediationPriority,
						rates: sampleRates,
					},
					{
						totalFailureRate: fmtNum(
							sampleGammas.reduce((sum, value) => sum + value, 0),
						),
						coherenceTimeT2: fmtNum(sampleT2),
						dominantChannel:
							sampleEntries.sort((left, right) => right[1] - left[1])[0]?.[0] ??
							"timing",
						engineeringTranslation:
							"Classify the flaky test, rank it by observed failure rate, then fix the dominant channel before enabling it in the blocking CI lane again.",
					},
					"Shows how channel failure rates become a deterministic flaky-test triage order.",
				),
				buildComparisonMatrixArtifact(
					"Decoherence channel response matrix",
					["Channel", "Typical signal", "First engineering move"],
					[
						{
							label: "Timing jitter",
							values: [
								"Passes in isolation, fails under load or with sleeps",
								"Non-deterministic readiness checks",
								"Replace sleeps with explicit state assertions or fake timers",
							],
						},
						{
							label: "Resource leak",
							values: [
								"Fails after other tests have touched shared state",
								"Dirty fixtures or leaked handles",
								"Reset shared resources and create fresh fixtures per test",
							],
						},
						{
							label: "Ordering dependency",
							values: [
								"Depends on suite order or prior setup side effects",
								"Hidden test coupling",
								"Make setup self-contained and randomise order in CI",
							],
						},
						{
							label: "Environment / external",
							values: [
								"Fails only in CI, on some platforms, or around real services",
								"Runner drift or live dependency instability",
								"Pin environment inputs and stub network or clock boundaries",
							],
						},
					],
					"Use this matrix to move from channel label to the first fix attempt.",
				),
				buildOutputTemplateArtifact(
					"Coherence register template",
					`Test name:
Primary channel:
Observed failure rate γ:
Estimated T₂:
Blocking lane impact:
First remediation action:
Owner / deadline:`,
					[
						"Test name",
						"Primary channel",
						"Observed failure rate γ",
						"Estimated T₂",
						"Blocking lane impact",
						"First remediation action",
						"Owner / deadline",
					],
					"Template for recording flaky-test evidence before deciding whether to quarantine, fix, or delete.",
				),
				buildToolChainArtifact(
					"Decoherence evidence chain",
					[
						{
							tool: "CI failure log or flake dashboard",
							description:
								"Use observed retry/failure history as the input rate source instead of claiming live detection.",
						},
						{
							tool: "test quarantine register",
							description:
								"Record the primary channel, current owner, and deadline so retries do not become invisible debt.",
						},
						{
							tool: "deterministic test harness review",
							description:
								"Confirm timers, shared fixtures, and external stubs match the diagnosed channel before re-enabling the test.",
						},
					],
					"Ground flaky-test triage in existing CI evidence and explicit ownership.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	decoherenceSentinelHandler,
);
