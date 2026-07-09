import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { InstructionManifestEntry } from "../../contracts/generated.js";
import type { StepExecutionRecord } from "../../contracts/runtime.js";
import { instructionModule as metaRoutingInstruction } from "../../generated/instructions/meta-routing.js";
import {
	bootstrapWorkflow,
	metaRoutingWorkflow,
	type WorkflowSpec,
} from "../../workflows/workflow-spec.js";
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

	it("rejects authoritative manifest drift when the workflow instructionId does not match the spec key", () => {
		const driftedManifest = cloneManifest(metaRoutingInstruction.manifest);
		driftedManifest.workflow.instructionId = "some-other-instruction";

		expect(() => resolveAuthoritativeWorkflowRuntime(driftedManifest)).toThrow(
			/does not match workflow spec key/i,
		);
	});

	it("rejects authoritative manifest drift when input schema keys do not match the spec", () => {
		const driftedManifest = cloneManifest(metaRoutingInstruction.manifest);
		driftedManifest.inputSchema.properties = {
			...driftedManifest.inputSchema.properties,
			extraneousField: { type: "string" },
		};

		expect(() => resolveAuthoritativeWorkflowRuntime(driftedManifest)).toThrow(
			/manifest input schema keys/i,
		);
	});

	it("treats a missing manifest required-keys array as an empty list", () => {
		const manifestWithoutRequired = cloneManifest(
			metaRoutingInstruction.manifest,
		);
		manifestWithoutRequired.inputSchema.required = undefined;

		expect(() =>
			resolveAuthoritativeWorkflowRuntime(manifestWithoutRequired),
		).toThrow(/workflow spec required keys/i);
	});

	it("rejects authoritative manifest drift when workflow steps do not match the spec runtime steps", () => {
		const driftedManifest = cloneManifest(metaRoutingInstruction.manifest);
		driftedManifest.workflow.steps = driftedManifest.workflow.steps.slice(
			0,
			-1,
		);

		expect(() => resolveAuthoritativeWorkflowRuntime(driftedManifest)).toThrow(
			/workflow steps do not match/i,
		);
	});

	it("does not throw when the input satisfies the authoritative spec", () => {
		expect(() =>
			assertWorkflowInputMatchesSpec(metaRoutingWorkflow, {
				request: "test request",
			}),
		).not.toThrow();
	});

	it("reports authoritative input validation errors without field context for issues at the root", () => {
		const rootRefinedWorkflow: WorkflowSpec = {
			...metaRoutingWorkflow,
			inputSchema: z
				.object({ request: z.string() })
				.refine(() => false, { message: "Root level failure." }),
		};

		expect(() =>
			assertWorkflowInputMatchesSpec(rootRefinedWorkflow, {
				request: "test request",
			} as Parameters<typeof assertWorkflowInputMatchesSpec>[1]),
		).toThrow(
			/^Workflow input failed authoritative spec validation for .*: Root level failure\.$/,
		);
	});

	it("does not validate execution steps when the spec has no runtime contract", () => {
		const noRuntimeSpec: WorkflowSpec = {
			key: "no-runtime",
			label: "No Runtime",
			states: [],
			transitions: [],
			inputSchema: z.object({ request: z.string() }),
		};

		expect(() =>
			assertWorkflowExecutionMatchesSpec(noRuntimeSpec, []),
		).not.toThrow();
	});

	it("rejects workflow execution records with a different number of top-level steps", () => {
		const tooFewSteps: StepExecutionRecord[] = (
			metaRoutingWorkflow.runtime?.steps ?? []
		)
			.slice(0, -1)
			.map((step) => ({
				label: step.label,
				kind: step.kind,
				summary: "ok",
			}));

		expect(() =>
			assertWorkflowExecutionMatchesSpec(metaRoutingWorkflow, tooFewSteps),
		).toThrow(/expected \d+ top-level steps, received \d+/i);
	});

	it("rejects workflow execution records with a missing step at an index", () => {
		const stepsWithHole: (StepExecutionRecord | undefined)[] = (
			metaRoutingWorkflow.runtime?.steps ?? []
		).map((step) => ({
			label: step.label,
			kind: step.kind,
			summary: "ok",
		}));
		stepsWithHole[1] = undefined;

		expect(() =>
			assertWorkflowExecutionMatchesSpec(
				metaRoutingWorkflow,
				stepsWithHole as StepExecutionRecord[],
			),
		).toThrow(/missing step at index 1/i);
	});

	it("rejects workflow execution records whose step label drifts from the spec", () => {
		const driftedLabelSteps: StepExecutionRecord[] = (
			metaRoutingWorkflow.runtime?.steps ?? []
		).map((step, index) => ({
			label: index === 1 ? "wrong-label" : step.label,
			kind: step.kind,
			summary: "ok",
		}));

		expect(() =>
			assertWorkflowExecutionMatchesSpec(
				metaRoutingWorkflow,
				driftedLabelSteps,
			),
		).toThrow(/expected step .*, received wrong-label/i);
	});

	it("accepts workflow execution records that fully match the authoritative runtime for multi-step workflows", () => {
		const matchingSteps: StepExecutionRecord[] = (
			bootstrapWorkflow.runtime?.steps ?? []
		).map((step) => ({
			label: step.label,
			kind: step.kind,
			summary: "ok",
		}));

		expect(() =>
			assertWorkflowExecutionMatchesSpec(bootstrapWorkflow, matchingSteps),
		).not.toThrow();
	});
});
