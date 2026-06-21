/**
 * Matcher: structural gate + injectable ranker.
 *
 * Two-stage: first filter the catalog so only entries whose required features
 * are a subset of the problem's features AND whose excluding features do not
 * overlap survive. Then call the supplied ranker (LLM-backed in production,
 * deterministic in tests) and return the top 3 sorted by descending score.
 *
 * The injection of the ranker is deliberate — the matcher itself stays pure
 * and unit-testable. The conceptual analysis explains why the old adapter's
 * regex-on-step-labels approach was brittle; this matcher's gate is
 * structural-feature-based instead.
 */

import { METAPHOR_CATALOG } from "./catalog.js";
import type { MetaphorEntry, ProblemFeature } from "./types.js";

export interface MatchInput {
	features: ReadonlyArray<ProblemFeature>;
	problemSummary: string;
}

export interface RankedCandidate {
	entry: MetaphorEntry;
	rank: number;
	gateResult: "passed";
}

export type Ranker = (
	summary: string,
	candidates: ReadonlyArray<MetaphorEntry>,
) => Promise<ReadonlyArray<{ id: string; score: number }>>;

export async function matchCandidates(
	input: MatchInput,
	rank: Ranker,
	catalog: ReadonlyArray<MetaphorEntry> = METAPHOR_CATALOG,
): Promise<ReadonlyArray<RankedCandidate>> {
	const features = new Set(input.features);
	const gated = catalog.filter((e) => {
		const requiredOk = e.requiredFeatures.every((f) => features.has(f));
		const excludedOk = !e.excludingFeatures.some((f) => features.has(f));
		return requiredOk && excludedOk;
	});
	if (gated.length === 0) return [];
	const ranked = await rank(input.problemSummary, gated);
	const byId = new Map(gated.map((e) => [e.id, e] as const));
	return ranked
		.slice()
		.sort((a, b) => b.score - a.score)
		.slice(0, 3)
		.map((r, i) => {
			const entry = byId.get(r.id);
			if (!entry) {
				throw new Error(`ranker returned unknown id ${r.id}`);
			}
			return { entry, rank: i, gateResult: "passed" as const };
		});
}
