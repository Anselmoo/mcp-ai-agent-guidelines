import { describe, expect, it } from "vitest";
import type { InstructionManifestEntry } from "../../contracts/generated.js";
import type { StepExecutionRecord } from "../../contracts/runtime.js";
import { instructionModule as onboardProjectInstruction } from "../../generated/instructions/onboard_project.js";
import { onboardProjectWorkflow } from "../../workflows/workflow-spec.js";
import {
	assertInstructionManifestMatchesWorkflowSpec,
	assertWorkflowExecutionMatchesSpec,
	assertWorkflowInputMatchesSpec,
	resolveAuthoritativeWorkflowRuntime,
} from "../../workflows/workflow-state-validator.js";

function cloneManifest(
	manifest: InstructionManifestEntry,
): InstructionManifestEntry {
	return {
		...manifest,
		inputSchema: {
			...manifest.inputSchema,
			properties: { ...manifest.inputSchema.properties },
			required: manifest.inputSchema.required
				? [...manifest.inputSchema.required]
				: undefined,
		},
		workflow: {
			...manifest.workflow,
			steps: manifest.workflow.steps.map((step) => ({ ...step })),
		},
	};
}

describe("workflow-state-validator", () => {
	it("resolves the authoritative runtime for implemented workflows", () => {
		const resolved = resolveAuthoritativeWorkflowRuntime(
			onboardProjectInstruction.manifest,
		);

		expect(resolved?.spec).toBe(onboardProjectWorkflow);
		expect(resolved?.steps).toBe(onboardProjectWorkflow.runtime?.steps);
		expect(
			assertInstructionManifestMatchesWorkflowSpec(
				onboardProjectInstruction.manifest,
			),
		).toBe(onboardProjectWorkflow);
	});

	it("returns null when no authoritative workflow spec exists", () => {
		const manifest: InstructionManifestEntry = {
			id: "custom-instruction",
			toolName: "custom-instruction",
			displayName: "Custom Instruction",
			description: "Synthetic test manifest",
			sourcePath: "tests/custom-instruction.ts",
			mission: "Test validator null resolution",
			inputSchema: {
				type: "object",
				properties: {
					request: { type: "string" },
				},
				required: ["request"],
			},
			workflow: {
				instructionId: "custom-instruction",
				steps: [],
			},
			chainTo: [],
			preferredModelClass: "cheap",
		};

		expect(resolveAuthoritativeWorkflowRuntime(manifest)).toBeNull();
		expect(
			assertInstructionManifestMatchesWorkflowSpec(manifest),
		).toBeUndefined();
	});

	it("rejects authoritative manifest drift in required input keys", () => {
		const driftedManifest = cloneManifest(onboardProjectInstruction.manifest);
		driftedManifest.inputSchema.required = [];

		expect(() => resolveAuthoritativeWorkflowRuntime(driftedManifest)).toThrow(
			/workflow spec required keys/i,
		);
	});

	it("reports authoritative input validation errors with field context", () => {
		expect(() =>
			assertWorkflowInputMatchesSpec(
				onboardProjectWorkflow,
				{} as Parameters<typeof assertWorkflowInputMatchesSpec>[1],
			),
		).toThrow(/request: Required/);
	});

	it("rejects workflow execution records that drift from the authoritative runtime", () => {
		const driftedSteps: StepExecutionRecord[] = [
			{
				label: "req-scope",
				kind: "note",
				summary: "Wrong kind.",
			},
			{
				label: "req-ambiguity-detection",
				kind: "invokeSkill",
				summary: "ok",
			},
			{
				label: "synth-research",
				kind: "invokeSkill",
				summary: "ok",
			},
			{
				label: "arch-system",
				kind: "invokeSkill",
				summary: "ok",
			},
			{
				label: "Finalize",
				kind: "finalize",
				summary: "ok",
			},
		];

		expect(() =>
			assertWorkflowExecutionMatchesSpec(onboardProjectWorkflow, driftedSteps),
		).toThrow(/expected step kind invokeSkill/i);
	});
});
