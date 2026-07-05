import { describe, expect, it } from "vitest";
import { selectTechniques } from "../../../skills/prompt/technique-selector.js";

const sel = (request: string) => selectTechniques({ request });

describe("technique-selector (refutable triggers)", () => {
	it("selects react for tool-observation agent tasks, not for plain summaries", () => {
		expect(
			sel("an agent that calls an API tool then observes the result").primary,
		).toBe("react");
		expect(sel("write a short summary of this paragraph").primary).not.toBe(
			"react",
		);
	});

	it("selects rag for retrieval/citation tasks, not for pure arithmetic", () => {
		expect(
			sel("answer from the knowledge base and cite the source document")
				.primary,
		).toBe("rag");
		expect(sel("compute the factorial of 12").primary).not.toBe("rag");
	});

	it("selects pal for compute/math tasks, not for tone rewriting", () => {
		expect(
			sel("calculate and compute the numeric result with code").primary,
		).toBe("pal");
		expect(sel("make this email sound friendlier").primary).not.toBe("pal");
	});

	it("selects self-consistency when reliability via voting is asked", () => {
		expect(
			sel("sample multiple answers and take the majority vote for reliability")
				.primary,
		).toBe("self-consistency");
		expect(sel("design the system architecture").primary).not.toBe(
			"self-consistency",
		);
	});

	it("selects tree-of-thoughts for branch/backtrack exploration", () => {
		expect(
			sel("explore alternative branches and backtrack to search options")
				.primary,
		).toBe("tree-of-thoughts");
		expect(sel("write a short poem about autumn").primary).not.toBe(
			"tree-of-thoughts",
		);
	});

	it("selects reflexion for self-critique/iterate loops", () => {
		expect(
			sel("reflect on the failure, self-critique, and iterate with feedback")
				.primary,
		).toBe("reflexion");
		expect(sel("calculate the sum of 1 to 100").primary).not.toBe("reflexion");
	});

	it("selects meta-prompting for regenerating the prompt itself", () => {
		expect(
			sel("critique the prompt and regenerate a refined prompt").primary,
		).toBe("meta-prompting");
		expect(sel("retrieve documents from the knowledge base").primary).not.toBe(
			"meta-prompting",
		);
	});

	it("emits ≤2 supplementary techniques and a rationale string", () => {
		const r = sel(
			"an agent that calls a tool then observes and cites a document",
		);
		expect(r.supplementary.length).toBeLessThanOrEqual(2);
		expect(r.rationale.length).toBeGreaterThan(0);
	});

	it("is low-confidence + unclassified when no technique keyword matches", () => {
		const r = sel("hello");
		expect(r.confident).toBe(false);
		expect(r.primary).toBeNull();
	});

	it("is deterministic (same input → same output)", () => {
		const a = sel("an agent that calls a tool then observes");
		const b = sel("an agent that calls a tool then observes");
		expect(a).toEqual(b);
	});

	it("rationale mentions 'escalating' when primary technique has escalatesTo targets", () => {
		// react escalates to ["rag", "reflexion"] — a confident match should surface the escalation
		const r = sel("an agent that calls an API tool then observes the result");
		expect(r.primary).toBe("react");
		expect(r.confident).toBe(true);
		expect(r.rationale.toLowerCase()).toContain("escalating");
	});

	// NOTE: Every technique in the catalog has at least one escalatesTo target,
	// so no contrast case (primary with empty escalatesTo) exists. This is
	// documented here as a deliberate design decision per Stage D specification.
});
