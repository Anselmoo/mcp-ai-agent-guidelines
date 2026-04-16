import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/orch/orch-multi-agent.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("orch-multi-agent", () => {
	it("chooses pipeline event-driven multi-agent topology", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"run multiple agents through a staged pipeline and publish events between them",
				options: {
					agentArchitecture: "pipeline",
					communicationPattern: "event-driven",
					includeObservability: true,
				},
			},
			{
				summaryIncludes: [
					"Multi-Agent Design produced",
					"topology: pipeline",
					"communication: event-driven",
				],
				detailIncludes: [
					"pipeline topology",
					"dedicated observability agent or sidecar",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("emits a topology blueprint with role and handoff contracts", async () => {
		const result = await skillModule.run(
			{
				request:
					"design peer agents with typed messages, observability, and resilience under backpressure",
				deliverable: "multi-agent architecture spec",
				options: {
					agentArchitecture: "peer-to-peer",
					communicationPattern: "event-driven",
					includeObservability: true,
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
			title: "Agent role contract template",
			fields: expect.arrayContaining([
				"Responsibility boundary",
				"Input contract",
				"Output contract",
				"Failure mode",
			]),
		});

		const example = result.artifacts?.find(
			(artifact) => artifact.kind === "worked-example",
		) as
			| {
					expectedOutput?: {
						agentRoles?: Array<Record<string, unknown>>;
						handoffContract?: { messageEnvelope?: string[] };
					};
			  }
			| undefined;
		expect(example?.expectedOutput?.agentRoles?.length).toBeGreaterThan(0);
		expect(example?.expectedOutput?.handoffContract?.messageEnvelope).toContain(
			"correlationId",
		);
	});

	it("uses structured evidence to avoid generic constraint echo", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design the agent topology for the MCP tool surface",
				constraints: [
					"prefer a small number of tools",
					"keep snapshot semantics distinct from memory",
				],
				options: {
					evidence: [
						{
							sourceType: "webpage",
							toolName: "fetch_webpage",
							locator:
								"https://modelcontextprotocol.io/docs/learn/architecture",
							authority: "official",
							sourceTier: 1,
						},
						{
							sourceType: "github-file",
							toolName: "mcp_github_get_file_contents",
							locator: "docs/tool-renaming.md",
							authority: "implementation",
							sourceTier: 2,
						},
					],
				},
			},
			{
				detailIncludes: [
					"Structured evidence is already attached",
					"docs/tool-renaming.md",
					"Enforce the stated constraints against the retrieved evidence set",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});
});
