import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/orch/orch-delegation.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("orch-delegation", () => {
	it("uses negotiated delegation with controlled subdelegation", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"delegate specialist tasks through negotiated bids with result contracts",
				deliverable: "merged report",
				successCriteria: "typed completion status",
				options: {
					delegationMode: "negotiated",
					allowSubdelegation: true,
					maxDelegationDepth: 3,
				},
			},
			{
				summaryIncludes: [
					"Delegation Strategy designed",
					"mode: negotiated",
					"depth 3",
				],
				detailIncludes: [
					"typed result with a clear status",
					"Subdelegation is permitted up to depth 3",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("emits a delegation contract artifact set", async () => {
		const result = await skillModule.run(
			{
				request:
					"delegate specialist tasks through negotiated bids with result contracts",
				deliverable: "merged report",
				successCriteria: "typed completion status",
				options: {
					delegationMode: "negotiated",
					allowSubdelegation: true,
					maxDelegationDepth: 3,
				},
			},
			createMockSkillRuntime(),
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"worked-example",
		]);

		const template = result.artifacts?.find(
			(artifact) => artifact.kind === "output-template",
		);
		expect(template).toMatchObject({
			title: "Delegation contract template",
			fields: expect.arrayContaining(["Authority boundary", "Exit artifact"]),
		});

		const example = result.artifacts?.find(
			(artifact) => artifact.kind === "worked-example",
		) as
			| {
					expectedOutput?: {
						taskPacket?: Record<string, unknown>;
						exitContract?: Record<string, unknown>;
					};
			  }
			| undefined;
		expect(example?.expectedOutput?.taskPacket).toBeTruthy();
		expect(example?.expectedOutput?.exitContract).toBeTruthy();
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("auto-detects pull mode and applies defaults when options/context/deliverable/successCriteria are absent", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "self-assign the pending subtask directly",
			},
			{
				summaryIncludes: ["mode: pull", "subdelegation: disabled"],
				detailIncludes: ["Subdelegation is disabled"],
			},
		);

		const example = result.artifacts?.find(
			(artifact) => artifact.kind === "worked-example",
		) as
			| {
					expectedOutput?: {
						authorityBoundary?: { subdelegation?: string };
					};
			  }
			| undefined;
		expect(example?.expectedOutput?.authorityBoundary?.subdelegation).toBe(
			"not allowed",
		);
	});

	it("auto-detects negotiated mode from agreement/auction language without an explicit option", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"agree on task ownership through an auction-style selection process",
			},
			{
				summaryIncludes: ["mode: negotiated"],
			},
		);
	});

	it("falls back to push mode when no delegation-mode keywords are present", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "coordinate the reporting workflow ownership carefully",
			},
			{
				summaryIncludes: ["mode: push"],
			},
		);
	});

	it("treats an all-stop-word request with context and constraints as sufficient signal", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "this is not it",
				context: "background from the prior planning session",
				constraints: ["Keep ownership auditable"],
			},
			{
				detailIncludes: [
					"the requested task",
					"Propagate the stated constraints",
					"Include a context-scoped snapshot",
				],
			},
		);
	});

	it("reports insufficient signal when keywords are all stop words and no context is provided", async () => {
		const result = await skillModule.run(
			{ request: "this is not it" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain(
			"Delegation Strategy needs the task to be delegated",
		);
	});

	// Two branches in orch-delegation.ts are intentionally left uncovered — both
	// are defensive fallbacks that the current schema/logic make unreachable:
	// - `input.request || "(unspecified)"` in buildDelegationContract: the base
	//   skill input schema enforces `request: z.string().min(1)`, so a parsed
	//   request is always truthy by the time the contract is built.
	// - `details.length === 1 ? "" : "s"` in the summary pluralization: details
	//   always starts with 2 unconditional entries plus exactly one more from
	//   the allowSubdelegation if/else, so details.length is never 1.
});
