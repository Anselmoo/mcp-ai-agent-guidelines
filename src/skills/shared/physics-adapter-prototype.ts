export type PhysicsLens = "qm" | "gr";

export type ConventionalEvidenceKind =
	| "metrics"
	| "static-analysis"
	| "tests"
	| "history"
	| "architecture"
	| "incident";

export interface ConventionalEvidence {
	kind: ConventionalEvidenceKind;
	detail: string;
}

export type PhysicsConcern =
	| "flakiness"
	| "candidate-ranking"
	| "coupling-cohesion"
	| "review-impact"
	| "history-drift"
	| "coverage-gap"
	| "coupling-gravity"
	| "debt-curvature"
	| "entropy-surface"
	| "split-pressure"
	| "abstraction-drift"
	| "topology-shock";

export interface PhysicsAdapterInput {
	request: string;
	context?: string;
	targetQuestion?: string;
	preferredLens?: PhysicsLens | "auto";
	conventionalEvidence?: ConventionalEvidence[];
}

export interface PhysicsGateDecision {
	allowed: boolean;
	reason: string;
	missingRequirements: string[];
}

export interface PhysicsLensRecommendation {
	lens: PhysicsLens;
	concern: PhysicsConcern;
	candidateSkills: string[];
	rationale: string;
	engineerQuestion: string;
	translationChecklist: string[];
}

interface ConcernBlueprint {
	lens: PhysicsLens;
	pattern: RegExp;
	candidateSkills: string[];
	rationale: string;
	engineerQuestion: string;
	translationChecklist: string[];
}

const QM_TRANSLATION_CHECKLIST = [
	"Name the concrete engineering metric before the metaphor.",
	"Keep the QM output advisory-only and supplementary.",
	"Translate every probability or channel label into a software risk statement.",
	"Validate the metaphor against conventional evidence before acting.",
];

const GR_TRANSLATION_CHECKLIST = [
	"State the real module metric alongside the gravity metaphor.",
	"Translate every horizon, curvature, or redshift label into a plain refactor implication.",
	"Keep the GR output advisory-only and supplementary.",
	"Validate the metaphor against conventional architecture evidence before acting.",
];

export const PHYSICS_ADAPTER_GUARDRAILS = [
	"Do not use the adapter unless conventional evidence already exists.",
	"Treat the output as advisory-only; the adapter is not a runtime tool surface.",
	"Map only explicit structured metrics into calibrated calculations; do not scrape opportunistic numerals from free-form prose.",
	"Always pair the metaphor output with a plain-language engineering translation.",
	"Reject or down-rank physics recommendations that disagree with conventional analysis without supporting evidence.",
	"Keep QM/GR selection lens-specific: quantum for uncertainty/selection/variance, relativity for coupling/debt/abstraction structure.",
] as const;

export const PHYSICS_ADAPTER_REPO_PLACEMENT = [
	"src/skills/shared/physics-adapter-prototype.ts",
	"src/tests/skills/shared/physics-adapter-prototype.test.ts",
] as const;

const CONCERN_BLUEPRINTS: Record<PhysicsConcern, ConcernBlueprint> = {
	flakiness: {
		lens: "qm",
		pattern:
			/\b(flak|intermittent|race.condition|timing|non.deterministic|resource.leak|order.dependent)\b/i,
		candidateSkills: ["qm-decoherence-sentinel"],
		rationale:
			"Flaky tests are best framed as decoherence channels because the real engineering question is which source of variance is destabilising the result.",
		engineerQuestion:
			"Which failure channel is making this test non-deterministic, and what deterministic control removes it?",
		translationChecklist: QM_TRANSLATION_CHECKLIST,
	},
	"candidate-ranking": {
		lens: "qm",
		pattern: /\b(candidate|rank|option|variant|winner|select|choice|best)\b/i,
		candidateSkills: ["qm-superposition-generator", "qm-bloch-interpolator"],
		rationale:
			"Candidate-ranking fits the QM lens because the metaphor helps compare multiple plausible implementations without pretending there is a single deterministic answer upfront.",
		engineerQuestion:
			"Which implementation options deserve deeper evaluation, and what evidence would collapse the choice safely?",
		translationChecklist: QM_TRANSLATION_CHECKLIST,
	},
	"coupling-cohesion": {
		lens: "qm",
		pattern:
			/\b(coupling|cohesion|mixed.concern|single.responsibility|tradeoff|pareto)\b/i,
		candidateSkills: ["qm-uncertainty-tradeoff", "qm-entanglement-mapper"],
		rationale:
			"The QM tradeoff lens is useful when the real question is whether improving one structural property worsens another and where hidden co-change makes that tradeoff sharper.",
		engineerQuestion:
			"Which modules sit on the worst coupling-versus-cohesion frontier, and what refactor order would reduce that tension?",
		translationChecklist: QM_TRANSLATION_CHECKLIST,
	},
	"review-impact": {
		lens: "qm",
		pattern:
			/\b(review|merge|decision|chosen|pick|backact|adjacent|neighbor|impact)\b/i,
		candidateSkills: ["qm-measurement-collapse"],
		rationale:
			"Review-impact is a QM-style backaction problem: choosing one change path can perturb nearby modules or future options.",
		engineerQuestion:
			"What adjacent modules or workflows are likely to be perturbed by adopting this reviewed change?",
		translationChecklist: QM_TRANSLATION_CHECKLIST,
	},
	"history-drift": {
		lens: "qm",
		pattern:
			/\b(history|drift|release|over.time|trajectory|evolution|snapshot|commit)\b/i,
		candidateSkills: ["qm-heisenberg-picture", "qm-path-integral-historian"],
		rationale:
			"Historical drift maps well to QM when the question is how metrics evolved across releases and which path changes had the highest architectural action.",
		engineerQuestion:
			"Which historical shifts changed the engineering trajectory, and what metric drift now matters most?",
		translationChecklist: QM_TRANSLATION_CHECKLIST,
	},
	"coverage-gap": {
		lens: "qm",
		pattern:
			/\b(coverage|uncovered|bug.pattern|regression|blind.spot|test.gap|probability)\b/i,
		candidateSkills: ["qm-wavefunction-coverage"],
		rationale:
			"The QM coverage lens is appropriate when conventional line coverage misses the actual question of which bug patterns are still weakly exercised.",
		engineerQuestion:
			"Which bug patterns are still weakly covered despite acceptable line or branch coverage?",
		translationChecklist: QM_TRANSLATION_CHECKLIST,
	},
	"coupling-gravity": {
		lens: "gr",
		pattern:
			/\b(coupling|dependents|fan.in|fan.out|core.module|radius|gravity|cascade)\b/i,
		candidateSkills: [
			"gr-schwarzschild-classifier",
			"gr-event-horizon-detector",
		],
		rationale:
			"GR is the right lens when the core question is whether coupling mass has grown so large that change now cascades through the surrounding system.",
		engineerQuestion:
			"Which modules have become gravitational centers where every change cascades outward?",
		translationChecklist: GR_TRANSLATION_CHECKLIST,
	},
	"debt-curvature": {
		lens: "gr",
		pattern:
			/\b(debt|curvature|complexity|cohesion|maintainability|hotspot|slowdown)\b/i,
		candidateSkills: ["gr-spacetime-debt-metric", "gr-dark-energy-forecaster"],
		rationale:
			"Debt-curvature is a relativity problem because the engineering concern is where accumulated coupling and complexity bend delivery speed the most.",
		engineerQuestion:
			"Where is technical-debt curvature highest, and which modules are slowing nearby work the most?",
		translationChecklist: GR_TRANSLATION_CHECKLIST,
	},
	"entropy-surface": {
		lens: "gr",
		pattern:
			/\b(api.surface|exports|entropy|public.api|surface.area|over.exposed|under.exposed)\b/i,
		candidateSkills: ["gr-hawking-entropy-auditor"],
		rationale:
			"API-surface hygiene is better served by the GR entropy metaphor because the real issue is how much information and coupling is concentrated on the public boundary.",
		engineerQuestion:
			"Is the public API surface exposing too much or too little relative to internal complexity?",
		translationChecklist: GR_TRANSLATION_CHECKLIST,
	},
	"split-pressure": {
		lens: "gr",
		pattern:
			/\b(split|decompose|tidal|refactor.path|shortest.path|break.apart|extract)\b/i,
		candidateSkills: ["gr-tidal-force-analyzer", "gr-geodesic-refactor"],
		rationale:
			"The GR split-pressure lens fits when a module is under uneven coupling forces and the engineering task is to sequence the least-disruptive split.",
		engineerQuestion:
			"Should this module split, and what is the lowest-risk refactor path?",
		translationChecklist: GR_TRANSLATION_CHECKLIST,
	},
	"abstraction-drift": {
		lens: "gr",
		pattern:
			/\b(abstraction|wrapper|adapter|facade|proxy|drift|redshift|layer)\b/i,
		candidateSkills: [
			"gr-redshift-velocity-mapper",
			"gr-equivalence-principle-checker",
		],
		rationale:
			"Abstraction drift is a GR problem because repeated wrappers and layers can distort the original contract as it travels through the system.",
		engineerQuestion:
			"How much interface drift has accumulated through our abstraction layers, and where should we reassert a canonical contract?",
		translationChecklist: GR_TRANSLATION_CHECKLIST,
	},
	"topology-shock": {
		lens: "gr",
		pattern:
			/\b(shockwave|merge|ripple|large.change|dependency.wave|after.refactor|topology)\b/i,
		candidateSkills: [
			"gr-gravitational-wave-detector",
			"gr-gravitational-lensing-tracer",
		],
		rationale:
			"Topology shock belongs to GR because the useful question is how large changes bend call paths and send coupling ripples through the architecture.",
		engineerQuestion:
			"Which hidden modules are bending call paths, and where are recent large changes sending ripples?",
		translationChecklist: GR_TRANSLATION_CHECKLIST,
	},
};

function normalizeText(input: PhysicsAdapterInput): string {
	return [
		input.request,
		input.context ?? "",
		input.targetQuestion ?? "",
		...(input.conventionalEvidence ?? []).map((item) => item.detail),
	].join(" ");
}

function dedupeConcerns(concerns: PhysicsConcern[]): PhysicsConcern[] {
	return [...new Set(concerns)];
}

export function derivePhysicsConcerns(
	input: PhysicsAdapterInput,
): PhysicsConcern[] {
	const combined = normalizeText(input);
	const matches: PhysicsConcern[] = [];

	for (const [concern, blueprint] of Object.entries(
		CONCERN_BLUEPRINTS,
	) as Array<[PhysicsConcern, ConcernBlueprint]>) {
		if (blueprint.pattern.test(combined)) {
			matches.push(concern);
		}
	}

	return dedupeConcerns(matches);
}

export function gatePhysicsAdapter(
	input: PhysicsAdapterInput,
	concerns = derivePhysicsConcerns(input),
): PhysicsGateDecision {
	const missingRequirements: string[] = [];
	const evidenceCount =
		input.conventionalEvidence?.filter((item) => item.detail.trim().length > 0)
			.length ?? 0;

	if (input.request.trim().length === 0) {
		missingRequirements.push("request");
	}
	if (evidenceCount === 0) {
		missingRequirements.push("conventional evidence");
	}
	if (concerns.length === 0) {
		missingRequirements.push("physics-worthy structural question");
	}

	if (missingRequirements.length > 0) {
		return {
			allowed: false,
			reason:
				"Keep the physics adapter gated until you have both conventional evidence and a structural question that benefits from a QM or GR lens.",
			missingRequirements,
		};
	}

	return {
		allowed: true,
		reason:
			"Physics translation is justified because conventional evidence already exists and the request maps to a structural question where QM or GR provides a supplementary lens.",
		missingRequirements: [],
	};
}

export function recommendPhysicsLenses(
	input: PhysicsAdapterInput,
	concerns = derivePhysicsConcerns(input),
): PhysicsLensRecommendation[] {
	const preferredLens = input.preferredLens ?? "auto";

	return concerns
		.map((concern) => ({ concern, blueprint: CONCERN_BLUEPRINTS[concern] }))
		.filter(({ blueprint }) =>
			preferredLens === "auto" ? true : blueprint.lens === preferredLens,
		)
		.map(({ concern, blueprint }) => ({
			lens: blueprint.lens,
			concern,
			candidateSkills: blueprint.candidateSkills,
			rationale: blueprint.rationale,
			engineerQuestion: blueprint.engineerQuestion,
			translationChecklist: blueprint.translationChecklist,
		}));
}
