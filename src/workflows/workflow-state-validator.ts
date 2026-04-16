import type {
	InstructionManifestEntry,
	WorkflowStep,
} from "../contracts/generated.js";
import type {
	InstructionInput,
	StepExecutionRecord,
} from "../contracts/runtime.js";
import {
	getRequiredWorkflowSpecInputKeys,
	getWorkflowSpecById,
	getWorkflowSpecInputKeys,
	type WorkflowSpec,
} from "./workflow-spec.js";

function sameStringSet(
	left: readonly string[],
	right: readonly string[],
): boolean {
	if (left.length !== right.length) {
		return false;
	}

	return left.every((value) => right.includes(value));
}

function serializeWorkflowSteps(steps: readonly WorkflowStep[]): string {
	return JSON.stringify(steps);
}

export function resolveAuthoritativeWorkflowRuntime(
	manifest: InstructionManifestEntry,
): {
	spec: WorkflowSpec;
	steps: readonly WorkflowStep[];
} | null {
	const spec = getWorkflowSpecById(manifest.id);
	const runtimeSteps = spec?.runtime?.steps;
	if (!spec || !runtimeSteps) {
		return null;
	}

	if (manifest.workflow.instructionId !== spec.key) {
		throw new Error(
			`Workflow spec drift for ${spec.key}: manifest workflow instructionId "${manifest.workflow.instructionId}" does not match workflow spec key "${spec.key}".`,
		);
	}

	const specInputKeys = getWorkflowSpecInputKeys(spec);
	const manifestInputKeys = Object.keys(manifest.inputSchema.properties);
	if (!sameStringSet(specInputKeys, manifestInputKeys)) {
		throw new Error(
			`Workflow spec drift for ${spec.key}: manifest input schema keys [${manifestInputKeys.join(", ")}] do not match workflow spec keys [${specInputKeys.join(", ")}].`,
		);
	}

	const specRequiredKeys = getRequiredWorkflowSpecInputKeys(spec);
	const manifestRequiredKeys = manifest.inputSchema.required ?? [];
	if (!sameStringSet(specRequiredKeys, manifestRequiredKeys)) {
		throw new Error(
			`Workflow spec drift for ${spec.key}: manifest required keys [${manifestRequiredKeys.join(", ")}] do not match workflow spec required keys [${specRequiredKeys.join(", ")}].`,
		);
	}

	if (
		serializeWorkflowSteps(runtimeSteps) !==
		serializeWorkflowSteps(manifest.workflow.steps)
	) {
		throw new Error(
			`Workflow spec drift for ${spec.key}: manifest workflow steps do not match workflow-spec runtime steps.`,
		);
	}

	return {
		spec,
		steps: runtimeSteps,
	};
}

export function assertInstructionManifestMatchesWorkflowSpec(
	manifest: InstructionManifestEntry,
): WorkflowSpec | undefined {
	return resolveAuthoritativeWorkflowRuntime(manifest)?.spec;
}

export function assertWorkflowInputMatchesSpec(
	spec: WorkflowSpec,
	input: InstructionInput,
) {
	const result = spec.inputSchema.safeParse(input);
	if (result.success) {
		return;
	}

	const issues = result.error.issues
		.map((issue) =>
			issue.path.length > 0
				? `${issue.path.join(".")}: ${issue.message}`
				: issue.message,
		)
		.join("; ");

	throw new Error(
		`Workflow input failed authoritative spec validation for ${spec.key}: ${issues}`,
	);
}

export function assertWorkflowExecutionMatchesSpec(
	spec: WorkflowSpec,
	steps: readonly StepExecutionRecord[],
) {
	if (!spec.runtime) {
		return;
	}

	if (spec.runtime.steps.length !== steps.length) {
		throw new Error(
			`Workflow execution drift for ${spec.key}: expected ${spec.runtime.steps.length} top-level steps, received ${steps.length}.`,
		);
	}

	for (const [index, expectedStep] of spec.runtime.steps.entries()) {
		const executedStep = steps[index];
		if (!executedStep) {
			throw new Error(
				`Workflow execution drift for ${spec.key}: missing step at index ${index}.`,
			);
		}

		if (expectedStep.label !== executedStep.label) {
			throw new Error(
				`Workflow execution drift for ${spec.key}: expected step ${expectedStep.label}, received ${executedStep.label}.`,
			);
		}

		if (expectedStep.kind !== executedStep.kind) {
			throw new Error(
				`Workflow execution drift for ${spec.key}: expected step kind ${expectedStep.kind} for ${expectedStep.label}, received ${executedStep.kind}.`,
			);
		}
	}
}
