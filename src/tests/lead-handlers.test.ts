import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as leadCapabilityMappingModule } from "../skills/lead/lead-capability-mapping.js";
import { skillModule as leadDigitalArchitectModule } from "../skills/lead/lead-digital-architect.js";
import { skillModule as leadExecBriefingModule } from "../skills/lead/lead-exec-briefing.js";
import { skillModule as leadL9EngineerModule } from "../skills/lead/lead-l9-engineer.js";
import { skillModule as leadStaffMentorModule } from "../skills/lead/lead-staff-mentor.js";
import { skillModule as leadTransformationRoadmapModule } from "../skills/lead/lead-transformation-roadmap.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

const leadCapabilityMappingManifest = leadCapabilityMappingModule.manifest;
const leadDigitalArchitectManifest = leadDigitalArchitectModule.manifest;
const leadExecBriefingManifest = leadExecBriefingModule.manifest;
const leadL9EngineerManifest = leadL9EngineerModule.manifest;
const leadStaffMentorManifest = leadStaffMentorModule.manifest;
const leadTransformationRoadmapManifest =
	leadTransformationRoadmapModule.manifest;

function createWorkflowRuntime() {
	const instructionRegistry = new InstructionRegistry();
	const skillRegistry = new SkillRegistry({ workspace: null });
	const modelRouter = new ModelRouter();

	return {
		sessionId: "test-session",
		executionState: { instructionStack: [], progressRecords: [] },
		sessionStore: {
			async readSessionHistory() {
				return [];
			},
			async writeSessionHistory() {
				return;
			},
			async appendSessionHistory() {
				return;
			},
		},
		instructionRegistry,
		skillRegistry,
		modelRouter,
		workflowEngine: new WorkflowEngine(),
	};
}

describe("lead-capability-mapping handler", () => {
	it("maps current and target capabilities without echoing manifest text", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadCapabilityMappingModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadCapabilityMappingManifest.id,
			{
				request:
					"Map our current AI platform, governance, and talent capabilities against the target state for enterprise rollout",
				context:
					"We have pilots in two product lines, no shared observability, and limited internal model operations experience.",
				deliverable: "capability gap analysis for the CIO",
				options: {
					targetHorizonMonths: 24,
					includeHeatmap: true,
					mappingDepth: "function",
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Capability Mapping produced");
		expect(result.recommendations[0]?.detail).not.toBe(
			leadCapabilityMappingManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/current capability|target capability|gap/i);
		expect(allDetail).toMatch(/heatmap|red, amber, and green/i);
		expect(allDetail).toContain("capability gap analysis for the CIO");
	});

	it("guards when the organisational mapping scope is missing", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadCapabilityMappingModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadCapabilityMappingManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Capability Mapping needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("lead-digital-architect handler", () => {
	it("frames enterprise architecture with operating-model and transition guidance", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadDigitalArchitectModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadDigitalArchitectManifest.id,
			{
				request:
					"Design our enterprise AI platform with shared observability, governance controls, and legacy integration boundaries",
				context:
					"Our business units currently run separate copilots with inconsistent policy enforcement and no common routing layer.",
				options: {
					architectureLens: "platform",
					includeOperatingModel: true,
					includeTransitionStates: true,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Digital Enterprise Architect produced");
		expect(result.recommendations[0]?.detail).not.toBe(
			leadDigitalArchitectManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/layers|routing|observability/i);
		expect(allDetail).toMatch(/ownership|operating-model overlay/i);
		expect(allDetail).toMatch(/transition state|coexist/i);
	});

	it("requires enterprise scope or baseline context", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadDigitalArchitectModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadDigitalArchitectManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Digital Enterprise Architect needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("lead-exec-briefing handler", () => {
	it("translates technical strategy into executive decision framing", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadExecBriefingModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadExecBriefingManifest.id,
			{
				request:
					"Prepare a board-level AI update covering business value, investment ask, risk posture, and the next milestone decision",
				context:
					"We have completed two pilots and need approval to scale the shared platform to three business units.",
				deliverable: "board AI briefing memo",
				options: {
					audience: "board",
					briefingLength: "decision-memo",
					includeRisks: true,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Executive Technical Briefing produced");
		expect(result.recommendations[0]?.detail).not.toBe(
			leadExecBriefingManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/business outcome|investment ask|decision/i);
		expect(allDetail).toMatch(/risk slide|risk|mitigation/i);
		expect(allDetail).toContain("board AI briefing memo");
	});

	it("returns an insufficient-signal briefing guardrail for empty input", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadExecBriefingModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadExecBriefingManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Executive Technical Briefing needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("lead-l9-engineer handler", () => {
	it("offers high-leverage strategic engineering guidance with counterpoints", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadL9EngineerModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadL9EngineerManifest.id,
			{
				request:
					"Give me a distinguished engineer perspective on the tradeoffs, failure modes, and sequencing for our AI platform architecture",
				context:
					"We must support multiple product teams, isolate blast radius, and avoid premature vendor lock-in over the next year.",
				successCriteria:
					"clear commit threshold for the shared routing layer decision",
				options: {
					reviewMode: "architecture",
					includeCounterpoints: true,
					decisionHorizon: "annual",
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("L9 Distinguished Engineer produced");
		expect(result.recommendations[0]?.detail).not.toBe(
			leadL9EngineerManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/architectural invariants|failure modes/i);
		expect(allDetail).toMatch(/rejected alternative|competing path/i);
		expect(allDetail).toContain(
			"clear commit threshold for the shared routing layer decision",
		);
	});

	it("guards when the strategic decision surface is missing", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadL9EngineerModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadL9EngineerManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("L9 Distinguished Engineer needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("lead-staff-mentor handler", () => {
	it("gives advisory staff-level mentoring grounded in the stated challenge", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadStaffMentorModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadStaffMentorManifest.id,
			{
				request:
					"How do I grow my influence without authority, create leverage through decision docs, and mentor other engineers as a staff engineer?",
				context:
					"I lead cross-team design reviews but struggle to move roadmap decisions outside my direct org.",
				deliverable: "staff growth plan for the next review cycle",
				options: {
					growthFocus: "influence",
					includePracticePlan: true,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Staff Engineering Mentor produced");
		expect(result.recommendations[0]?.detail).not.toBe(
			leadStaffMentorManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/decision owner|artifact|influence/i);
		expect(allDetail).toMatch(/practice loop|repeatable practice/i);
		expect(allDetail).toContain("staff growth plan for the next review cycle");
	});

	it("requires a concrete growth challenge before mentoring", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadStaffMentorModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadStaffMentorManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Staff Engineering Mentor needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("lead-transformation-roadmap handler", () => {
	it("produces phased enterprise transformation guidance with governance framing", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadTransformationRoadmapModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadTransformationRoadmapManifest.id,
			{
				request:
					"Phase our AI transformation roadmap with platform, operating-model, governance, and adoption workstreams",
				context:
					"We have isolated pilots, fragmented data access, and no shared risk review process across the enterprise.",
				deliverable: "24-month AI transformation roadmap",
				successCriteria:
					"shared platform adopted by three business units with auditable controls",
				options: {
					phaseCount: 4,
					horizonMonths: 24,
					includeGovernanceTrack: true,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Transformation Roadmap produced");
		expect(result.recommendations[0]?.detail).not.toBe(
			leadTransformationRoadmapManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/platform-foundation track|platform/i);
		expect(allDetail).toMatch(/governance checkpoints|governance/i);
		expect(allDetail).toContain("24-month AI transformation roadmap");
		expect(allDetail).toContain(
			"shared platform adopted by three business units with auditable controls",
		);
	});

	it("guards when the transformation target is underspecified", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [leadTransformationRoadmapModule],
			workspace: null,
		});

		const result = await registry.execute(
			leadTransformationRoadmapManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Transformation Roadmap needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});
