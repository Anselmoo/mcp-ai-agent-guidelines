import { describe, expect, it } from "vitest";
import { skillModule as reqAcceptanceCriteriaModule } from "../skills/req/req-acceptance-criteria.js";
import { skillModule as reqAmbiguityDetectionModule } from "../skills/req/req-ambiguity-detection.js";
import { skillModule as reqAnalysisModule } from "../skills/req/req-analysis.js";
import { skillModule as reqScopeModule } from "../skills/req/req-scope.js";
import {
	createHandlerRuntime,
	recommendationText,
} from "./test-helpers/handler-runtime.js";

describe("req handlers", () => {
	it("req-analysis maps deliverables, constraints, and priority limits", async () => {
		const result = await reqAnalysisModule.run(
			{
				request:
					"Analyze requirements for a tenant-safe workflow editor with audit history and rollback",
				context: "There is an existing draft spec and benchmark data.",
				deliverable: "requirements packet",
				constraints: ["HIPAA", "two-engineer team"],
				options: { includeConstraintMapping: true, maxRequirements: 4 },
			},
			createHandlerRuntime(),
		);

		const text = recommendationText(result);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/deliverable: defined|constraints: 2/i);
		expect(text).toMatch(
			/Constraint mapping|Cross-reference requirements against existing artifacts|at most 4 high-priority requirements/i,
		);
		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"worked-example",
		]);
	});

	it("req-analysis returns insufficient-signal guidance for underspecified requests", async () => {
		const result = await reqAnalysisModule.run(
			{ request: "x" },
			createHandlerRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Requirements Analysis needs more detail");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("req-acceptance-criteria respects format and sad-path options", async () => {
		const result = await reqAcceptanceCriteriaModule.run(
			{
				request:
					"Generate acceptance criteria for an approval workflow feature",
				deliverable: "approval audit trail",
				successCriteria: "approvals are visible and exportable",
				options: { format: "gherkin", includeSadPath: false },
			},
			createHandlerRuntime(),
		);

		const text = recommendationText(result);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("format: gherkin, sad-path: false");
		expect(text).toMatch(/Happy-path criterion \(gherkin\)/i);
		expect(text).not.toMatch(/Sad-path criterion/i);
		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"eval-criteria",
			"worked-example",
		]);
	});

	it("req-ambiguity-detection flags subjective, vague, absolute, and actor-free language", async () => {
		const result = await reqAmbiguityDetectionModule.run(
			{
				request:
					"It should always be fast, simple, and flexible, with several export options and more",
			},
			createHandlerRuntime(),
		);

		const text = recommendationText(result);
		expect(result.executionMode).toBe("capability");
		expect(text).toMatch(/Subjective terms found: fast, simple, flexible/i);
		expect(text).toMatch(/Vague expansion language found/i);
		expect(text).toMatch(/Absolute language found: always/i);
		expect(text).toMatch(/Passive\/actor-free language found/i);
		expect(text).toMatch(/Clarifying question/i);
		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"eval-criteria",
			"worked-example",
		]);
	});

	it("req-scope identifies in-scope, out-of-scope, and phased delivery boundaries", async () => {
		const result = await reqScopeModule.run(
			{
				request:
					"Clarify scope for notifications, approvals, and admin controls",
				deliverable: "phase one launch plan",
				constraints: ["six-week deadline"],
				options: { includeOutOfScope: true, phaseCount: 3 },
			},
			createHandlerRuntime(),
		);

		const text = recommendationText(result);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(
			/constraints: provided|deliverable: defined/i,
		);
		expect(text).toMatch(
			/in-scope boundary|out-of-scope items|3 phases|phase one launch plan/i,
		);
		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"comparison-matrix",
			"eval-criteria",
			"worked-example",
		]);
	});
});
