import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as promptChainingModule } from "../skills/prompt/prompt-chaining.js";
import { skillModule as promptEngineeringModule } from "../skills/prompt/prompt-engineering.js";
import { skillModule as promptHierarchyModule } from "../skills/prompt/prompt-hierarchy.js";
import { skillModule as promptRefinementModule } from "../skills/prompt/prompt-refinement.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

const promptChainingManifest = promptChainingModule.manifest;
const promptEngineeringManifest = promptEngineeringModule.manifest;
const promptHierarchyManifest = promptHierarchyModule.manifest;
const promptRefinementManifest = promptRefinementModule.manifest;

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

describe("prompt-chaining handler", () => {
	it("returns advisory capability guidance driven by chaining signals", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [promptChainingModule],
			workspace: null,
		});

		const result = await registry.execute(
			promptChainingManifest.id,
			{
				request:
					"Chain an extraction step into a summarization step, validate the output schema, and keep citations from the source documents",
				context:
					"We pass policy PDFs into the workflow before generating a decision brief.",
				deliverable: "validated executive summary packet",
				options: {
					stageCount: 4,
					handoffStyle: "schema-first",
					includeValidation: true,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Chaining produced");
		expect(result.recommendations[0]?.title).toMatch(
			/^Prompt chaining guidance/,
		);
		expect(result.recommendations[0]?.detail).not.toBe(
			promptChainingManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/schema|artifact|handoff/i);
		expect(allDetail).toMatch(/citation|provenance|source/i);
		expect(allDetail).toContain("validated executive summary packet");
	});

	it("returns an insufficient-signal guardrail for an empty request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [promptChainingModule],
			workspace: null,
		});

		const result = await registry.execute(
			promptChainingManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Chaining needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("prompt-engineering handler", () => {
	it("frames reusable prompt assets with signal-sensitive guidance", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [promptEngineeringModule],
			workspace: null,
		});

		const result = await registry.execute(
			promptEngineeringManifest.id,
			{
				request:
					"Build a reusable system prompt with JSON output fields, few-shot examples, and strict safety guardrails",
				deliverable: "versioned support-assistant system prompt",
				successCriteria:
					"outputs valid JSON and refuses unsupported account actions",
				options: {
					promptType: "system",
					includeVersioning: true,
					includeVariables: true,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Engineering produced");
		expect(result.recommendations[0]?.detail).not.toBe(
			promptEngineeringManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/field names|schema|output contract/i);
		expect(allDetail).toMatch(/few.?shot|example/i);
		expect(allDetail).toMatch(/version header|versioned/i);
		expect(allDetail).toContain("versioned support-assistant system prompt");
	});

	it("guards when the prompt goal is underspecified", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [promptEngineeringModule],
			workspace: null,
		});

		const result = await registry.execute(
			promptEngineeringManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Engineering needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("prompt-hierarchy handler", () => {
	it("calibrates autonomy and control surfaces from request signals", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [promptHierarchyModule],
			workspace: null,
		});

		const result = await registry.execute(
			promptHierarchyManifest.id,
			{
				request:
					"Set up bounded autonomy with approval gates for tool execution, escalation on ambiguity, and audit logging",
				context:
					"The agent can draft vendor responses but must never send them without human review.",
				options: {
					autonomyLevel: "bounded",
					includeApprovalGates: true,
					includeFallbacks: true,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Hierarchy produced");
		expect(result.recommendations[0]?.detail).not.toBe(
			promptHierarchyManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/approval|state transitions|approver/i);
		expect(allDetail).toMatch(/audit|trace|log/i);
		expect(allDetail).toMatch(/escalat|fallback/i);
	});

	it("returns a control-surface guardrail when signal is missing", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [promptHierarchyModule],
			workspace: null,
		});

		const result = await registry.execute(
			promptHierarchyManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Hierarchy needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});

describe("prompt-refinement handler", () => {
	it("produces experiment-oriented guidance from failure evidence", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [promptRefinementModule],
			workspace: null,
		});

		const result = await registry.execute(
			promptRefinementManifest.id,
			{
				request:
					"Improve my prompt because it hallucinates citations, drifts from JSON format, and shows flaky output variance",
				context:
					"Eval runs show unsupported citations on 3 of 10 examples and malformed JSON on long documents.",
				successCriteria:
					"supported citations and valid JSON across the regression set",
				options: {
					evidenceMode: "eval-results",
					maxExperiments: 2,
					preserveStructure: true,
				},
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Refinement produced");
		expect(result.recommendations[0]?.detail).not.toBe(
			promptRefinementManifest.purpose,
		);
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/one causal variable|one controlled edit/i);
		expect(allDetail).toMatch(/citation|grounding/i);
		expect(allDetail).toMatch(/json|schema|contract/i);
		expect(allDetail).toContain(
			"supported citations and valid JSON across the regression set",
		);
	});

	it("requires failure evidence or target criteria before refining", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [promptRefinementModule],
			workspace: null,
		});

		const result = await registry.execute(
			promptRefinementManifest.id,
			{ request: "Improve this" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Prompt Refinement needs");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});
