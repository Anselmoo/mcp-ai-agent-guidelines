import type { FeatureExtractor } from "./clarify.js";
import { type AnalogyReport, expandCandidates } from "./expand.js";
import type { Ranker } from "./matcher.js";
import { matchCandidates } from "./matcher.js";

const HEADER = "Metaphor, not theorem.";

export interface AnalogyEnvelopePayload {
	candidates: AnalogyReport[];
	noMatchHint?: string;
	degradedRanking?: boolean;
}

export async function runAnalogyWorkflow(
	input: { request: string; context?: string },
	deps: { extract: FeatureExtractor; rank: Ranker },
): Promise<{ summaryMarkdown: string; payload: AnalogyEnvelopePayload }> {
	const clarify = await deps.extract(input.request, input.context);
	const ranked = await matchCandidates(
		{ features: clarify.features, problemSummary: clarify.problemSummary },
		deps.rank,
	);
	const reports = expandCandidates(ranked);
	if (reports.length === 0) {
		const summaryMarkdown = `${HEADER}\n\nNo strong physical analogy gates open for this problem. The methodology gate (issue-debug / system-design) may still help.`;
		return {
			summaryMarkdown,
			payload: {
				candidates: [],
				noMatchHint:
					"Try issue-debug or system-design — the methodology gate is appended to both.",
			},
		};
	}
	const sections = reports.map((r) => renderReport(r)).join("\n\n---\n\n");
	const summaryMarkdown = `${HEADER}\n\n# Analogy candidates\n\n${sections}`;
	return { summaryMarkdown, payload: { candidates: reports } };
}

function renderReport(r: AnalogyReport): string {
	// pure template; spec lists required sections; antiPatterns rendered alongside predictions
	return [
		`## ${r.name} (${r.domain}, ${r.confidence})`,
		"",
		"### Mapping",
		...r.mapping.map((m) => `- ${m.physics} -> ${m.engineering}`),
		r.predictions.length ? "\n### Predictions" : "",
		...r.predictions.map((p) => `- ${p}`),
		r.evidenceNeeded.length ? "\n### Evidence needed" : "",
		...r.evidenceNeeded.map((e) => `- ${e}`),
		"\n### Translation back",
		r.translationBack,
		"\n### When NOT to apply",
		...r.antiPatterns.map((a) => `- ${a}`),
	]
		.filter(Boolean)
		.join("\n");
}
