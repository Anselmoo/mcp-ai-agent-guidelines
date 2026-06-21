/**
 * Expand step: pure function that renders RankedCandidate into AnalogyReport.
 *
 * No LLM involved. Unwraps each entry and applies defaulting for optional
 * predictions and evidenceNeeded fields per the interface contract.
 */

import type { RankedCandidate } from "./matcher.js";

export interface AnalogyReport {
	id: string;
	name: string;
	domain: string;
	rank: number;
	mapping: Array<{ physics: string; engineering: string }>;
	predictions: string[];
	evidenceNeeded: string[];
	translationBack: string;
	antiPatterns: string[];
	confidence: "high" | "medium" | "low";
}

export function expandCandidates(
	cands: ReadonlyArray<RankedCandidate>,
): AnalogyReport[] {
	return cands.map((candidate) => ({
		id: candidate.entry.id,
		name: candidate.entry.name,
		domain: candidate.entry.domain,
		rank: candidate.rank,
		mapping: candidate.entry.mapping,
		predictions: candidate.entry.predictions ?? [],
		evidenceNeeded: candidate.entry.evidenceNeeded ?? [],
		translationBack: candidate.entry.translationBack,
		antiPatterns: candidate.entry.antiPatterns,
		confidence: candidate.entry.confidence,
	}));
}
