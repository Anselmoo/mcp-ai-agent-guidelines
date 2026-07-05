import type { InstructionInput } from "../../contracts/runtime.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	getTechnique,
	TECHNIQUE_CATALOG,
	type TechniqueCategory,
	type TechniqueEntry,
} from "./technique-catalog.js";

export interface TechniqueSelection {
	category: TechniqueCategory | "unclassified";
	primary: string | null;
	supplementary: string[];
	structureRequirements: string[];
	rationale: string;
	confident: boolean;
	/** Pointer to a worked card in technique-examples.ts; null for catalog-only or unclassified. */
	exampleRef: string | null;
}

/** Stable keyword scorer over the catalog (mirrors rankCandidateTools). */
function scoreTechniques(
	request: string,
): { entry: TechniqueEntry; score: number }[] {
	const lower = request.toLowerCase();
	return TECHNIQUE_CATALOG.map((entry, index) => ({
		entry,
		index,
		score: entry.keywords.filter((kw) => lower.includes(kw)).length,
	}))
		.sort((a, b) => b.score - a.score || a.index - b.index)
		.map(({ entry, score }) => ({ entry, score }));
}

export function selectTechniques(input: InstructionInput): TechniqueSelection {
	const signals = extractRequestSignals(input);
	const combined = `${input.request ?? ""} ${input.context ?? ""}`;
	const ranked = scoreTechniques(combined);
	const top = ranked[0];

	if (!top || top.score === 0 || signals.keywords.length === 0) {
		return {
			category: "unclassified",
			primary: null,
			supplementary: [],
			structureRequirements: [],
			rationale:
				"No technique keyword matched the request; defaulting to unclassified. Provide the task's reasoning/retrieval/tool-use shape to select a technique.",
			confident: false,
			exampleRef: null,
		};
	}

	const primary = top.entry;
	const supplementary = ranked
		.slice(1)
		.filter((r) => r.score > 0 && r.entry.category === primary.category)
		.slice(0, 2)
		.map((r) => r.entry.id);

	const escalation = primary.escalatesTo
		.map((id) => getTechnique(id)?.name)
		.filter((n): n is string => Boolean(n));

	const rationale = [
		`Classified as ${primary.category}: strongest keyword match is ${primary.name} (${top.score} signal${top.score === 1 ? "" : "s"}).`,
		supplementary.length ? `Supplementary: ${supplementary.join(", ")}.` : "",
		escalation.length
			? `Consider escalating to ${escalation.join(" or ")} if the primary technique underperforms.`
			: "",
	]
		.filter(Boolean)
		.join(" ");

	return {
		category: primary.category,
		primary: primary.id,
		supplementary,
		structureRequirements: [...primary.structureSignals],
		rationale,
		confident: true,
		exampleRef: primary.exampleRef ?? null,
	};
}
