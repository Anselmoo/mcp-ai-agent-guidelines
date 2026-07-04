import { describe, expect, it } from "vitest";
import type { InstructionManifestEntry } from "../../contracts/generated.js";
import type { StepExecutionRecord } from "../../contracts/runtime.js";
import { instructionModule as metaRoutingInstruction } from "../../generated/instructions/meta-routing.js";
import { metaRoutingWorkflow } from "../../workflows/workflow-spec.js";
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
			metaRoutingInstruction.manifest,
		);

		expect(resolved?.spec).toBe(metaRoutingWorkflow);
		expect(resolved?.steps).toBe(metaRoutingWorkflow.runtime?.steps);
		expect(
			assertInstructionManifestMatchesWorkflowSpec(
				metaRoutingInstruction.manifest,
			),
		).toBe(metaRoutingWorkflow);
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
		const driftedManifest = cloneManifest(metaRoutingInstruction.manifest);
		driftedManifest.inputSchema.required = [];

		expect(() => resolveAuthoritativeWorkflowRuntime(driftedManifest)).toThrow(
			/workflow spec required keys/i,
		);
	});

	it("reports authoritative input validation errors with field context", () => {
		expect(() =>
			assertWorkflowInputMatchesSpec(
				metaRoutingWorkflow,
				{} as Parameters<typeof assertWorkflowInputMatchesSpec>[1],
			),
		).toThrow(/request: Required/);
	});

	it("rejects workflow execution records that drift from the authoritative runtime", () => {
		const driftedSteps: StepExecutionRecord[] = (
			metaRoutingWorkflow.runtime?.steps ?? []
		).map((step, index) => ({
			label: step.label,
			kind: index === 0 ? "note" : step.kind,
			summary: index === 0 ? "Wrong kind." : "ok",
		}));

		expect(() =>
			assertWorkflowExecutionMatchesSpec(metaRoutingWorkflow, driftedSteps),
		).toThrow(/expected step kind invokeSkill/i);
	});
});
