import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/orch/orch-multi-agent.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("orch-multi-agent extra branch coverage", () => {
	it("infers hierarchical architecture by default (no keywords)", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design a multi-agent system with coordinator and role boundaries",
			},
			{
				summaryIncludes: ["topology: hierarchical"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers pipeline architecture from 'pipeline' keyword", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design a sequential stage pipeline for processing agents",
			},
			{
				summaryIncludes: ["topology: pipeline"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers hub-and-spoke architecture from 'hub' keyword", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design a hub and spoke star topology for agent coordination",
			},
			{
				summaryIncludes: ["topology: hub-and-spoke"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers peer-to-peer architecture from 'peer' keyword", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design a peer-to-peer mesh network for agent communication",
			},
			{
				summaryIncludes: ["topology: peer-to-peer"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("explicit agentArchitecture hub-and-spoke overrides inference", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design an agent orchestration system with message passing",
				options: {
					agentArchitecture: "hub-and-spoke",
					communicationPattern: "message-passing",
				},
			},
			{
				summaryIncludes: [
					"topology: hub-and-spoke",
					"communication: message-passing",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("explicit agentArchitecture peer-to-peer with shared-state", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design peer agents with shared state coordination",
				options: {
					agentArchitecture: "peer-to-peer",
					communicationPattern: "shared-state",
				},
			},
			{
				summaryIncludes: [
					"topology: peer-to-peer",
					"communication: shared-state",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("includeObservability: false produces guidance without observability sidecar detail", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "design a hierarchical agent system with trust and permissions",
				options: {
					agentArchitecture: "hierarchical",
					communicationPattern: "event-driven",
					includeObservability: false,
				},
			},
			{
				summaryIncludes: ["topology: hierarchical"],
				recommendationCountAtLeast: 3,
			},
		);
		// Without observability, should not have the sidecar detail
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).not.toContain("dedicated observability agent or sidecar");
	});

	it("emits artifacts for hierarchical topology", async () => {
		const result = await skillModule.run(
			{
				request: "design a hierarchical coordinator with scale backpressure and test isolation",
				options: {
					agentArchitecture: "hierarchical",
					communicationPattern: "message-passing",
					includeObservability: true,
				},
			},
			createMockSkillRuntime(),
		);

		expect(result.artifacts).toBeDefined();
		const artifactKinds =
			result.artifacts?.map((artifact) => artifact.kind) ?? [];
		expect(artifactKinds).toContain("comparison-matrix");
		expect(artifactKinds).toContain("output-template");
		expect(artifactKinds).toContain("worked-example");
	});

	it("emits artifacts for hub-and-spoke topology", async () => {
		const result = await skillModule.run(
			{
				request: "design hub agents with monitoring observability and failure recovery",
				options: {
					agentArchitecture: "hub-and-spoke",
					communicationPattern: "event-driven",
					includeObservability: true,
				},
			},
			createMockSkillRuntime(),
		);

		expect(result.artifacts).toBeDefined();
	});

	it("applies constraint details when constraints are provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "coordinate agents for a multi-step pipeline workflow",
				constraints: ["max 3 agents", "no shared mutable state"],
				options: {
					agentArchitecture: "pipeline",
				},
			},
			{
				summaryIncludes: ["topology: pipeline"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
