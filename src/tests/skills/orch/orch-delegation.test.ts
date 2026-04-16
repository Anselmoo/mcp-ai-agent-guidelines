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
});
