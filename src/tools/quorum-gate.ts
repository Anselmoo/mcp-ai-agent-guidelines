/**
 * QuorumGate — A8
 *
 * Three-way consensus check that all physics-tier (`qm-*`, `gr-*`) dispatch
 * calls must pass before the skill handler is invoked.
 *
 * The gate runs three independent heuristic validators in parallel and requires
 * a majority (≥ 2 out of 3) to approve the request.  This mirrors the
 * "Pattern 3 — Majority Vote for Classification" in the orchestration strategy:
 * defer to a strong-model tiebreaker only when the cheap-heuristic panel splits.
 *
 * Validators:
 *   V1 — Physics-trigger phrase detector: at least one recognised trigger phrase
 *        must appear in the request.
 *   V2 — Justification depth checker: justification must be ≥ 40 characters
 *        and contain at least one "insufficiency signal" keyword.
 *   V3 — Skill-prefix coherence verify: skill ID prefix must be `qm-` or `gr-`.
 *
 * Usage:
 *   const gate = new QuorumGate();
 *   gate.check(skillId, request, justification); // throws on quorum failure
 */

// ---------------------------------------------------------------------------
// Trigger-phrase corpus
// ---------------------------------------------------------------------------

const PHYSICS_TRIGGER_PHRASES: ReadonlyArray<string> = [
	"co-change",
	"co change",
	"coupling",
	"entanglement",
	"entangled",
	"quantum",
	"qm",
	"general relativity",
	"geodesic",
	"schwarzschild",
	"von neumann entropy",
	"hamiltonian",
	"wave function",
	"wavefunction",
	"uncertainty principle",
	"bloch sphere",
	"path integral",
	"decoherence",
	"superposition",
	"born rule",
	"spacetime",
	"curvature",
	"event horizon",
	"gravitational",
	"hawking",
	"penrose",
	"neutron star",
	"dark energy",
	"tidal force",
	"frame dragging",
];

const INSUFFICIENCY_SIGNALS: ReadonlyArray<string> = [
	"insufficient",
	"not enough",
	"cannot capture",
	"beyond",
	"conventional",
	"standard metric",
	"standard analysis",
	"traditional",
	"linear",
	"simple",
	"entropy",
	"topology",
	"metaphor",
	"analogy",
];

// ---------------------------------------------------------------------------
// QuorumGate
// ---------------------------------------------------------------------------

export interface QuorumVote {
	/** Validator index (1-3). */
	validator: 1 | 2 | 3;
	/** `true` = approved, `false` = rejected. */
	approved: boolean;
	/** Human-readable rationale for the vote. */
	reason: string;
}

export function isPhysicsSkillId(skillId: string): boolean {
	return skillId.startsWith("qm-") || skillId.startsWith("gr-");
}

export function assertPhysicsSkillQuorum(
	skillId: string,
	request: string,
	justification: string | undefined,
): void {
	if (!isPhysicsSkillId(skillId)) {
		return;
	}

	if (typeof justification !== "string" || justification.trim().length < 20) {
		throw new Error(
			"Physics skills require physicsAnalysisJustification (≥ 20 non-whitespace chars) explaining why physics-analysis metaphors are appropriate.",
		);
	}

	new QuorumGate().check(skillId, request, justification);
}

export class QuorumGate {
	/**
	 * Run all three validators and throw if the majority rejects the request.
	 *
	 * @param skillId       - The `qm-*` or `gr-*` skill being dispatched.
	 * @param request       - The raw `input.request` string.
	 * @param justification - The pre-validated justification string (≥ 20 chars).
	 * @throws Error when fewer than 2 validators approve.
	 */
	check(skillId: string, request: string, justification: string): void {
		const votes = [
			this.v1TriggerPhraseDetector(request),
			this.v2JustificationDepthChecker(justification),
			this.v3SkillPrefixCoherence(skillId),
		] as const;

		const approvals = votes.filter((v) => v.approved).length;

		if (approvals < 2) {
			const rejections = votes
				.filter((v) => !v.approved)
				.map((v) => `[V${v.validator}] ${v.reason}`)
				.join("; ");
			throw new Error(
				`Physics-tier quorum gate rejected skill "${skillId}" ` +
					`(${approvals}/3 validators approved). ` +
					`Rejection reasons: ${rejections}`,
			);
		}
	}

	/**
	 * Return all three votes without throwing — useful for diagnostics and tests.
	 */
	vote(
		skillId: string,
		request: string,
		justification: string,
	): readonly QuorumVote[] {
		return [
			this.v1TriggerPhraseDetector(request),
			this.v2JustificationDepthChecker(justification),
			this.v3SkillPrefixCoherence(skillId),
		];
	}

	// ---------------------------------------------------------------------------
	// Validators
	// ---------------------------------------------------------------------------

	/** V1: At least one recognised physics-trigger phrase in the request. */
	private v1TriggerPhraseDetector(request: string): QuorumVote {
		const lower = request.toLowerCase();
		const matched = PHYSICS_TRIGGER_PHRASES.find((p) => lower.includes(p));
		return {
			validator: 1,
			approved: matched !== undefined,
			reason:
				matched !== undefined
					? `Trigger phrase matched: "${matched}"`
					: `No recognised physics trigger phrase found in request. ` +
						`Expected one of: ${PHYSICS_TRIGGER_PHRASES.slice(0, 5).join(", ")} ...`,
		};
	}

	/** V2: Justification has ≥ 40 characters and contains an insufficiency signal. */
	private v2JustificationDepthChecker(justification: string): QuorumVote {
		const trimmed = justification.trim();
		if (trimmed.length < 40) {
			return {
				validator: 2,
				approved: false,
				reason: `Justification too shallow (${trimmed.length} chars; minimum 40).`,
			};
		}
		const lower = trimmed.toLowerCase();
		const signal = INSUFFICIENCY_SIGNALS.find((s) => lower.includes(s));
		return {
			validator: 2,
			approved: signal !== undefined,
			reason:
				signal !== undefined
					? `Insufficiency signal found: "${signal}"`
					: "Justification does not explain why conventional analysis is insufficient.",
		};
	}

	/** V3: Skill ID must start with `qm-` or `gr-`. */
	private v3SkillPrefixCoherence(skillId: string): QuorumVote {
		const isPhysics = isPhysicsSkillId(skillId);
		return {
			validator: 3,
			approved: isPhysics,
			reason: isPhysics
				? `Skill prefix coherent: "${skillId.split("-")[0]}-"`
				: `Skill ID "${skillId}" does not carry a physics prefix (qm- / gr-).`,
		};
	}
}
