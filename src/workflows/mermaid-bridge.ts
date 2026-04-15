// src/workflows/mermaid-bridge.ts
// Thin helper to convert WorkflowSpec to Mermaid stateDiagram-v2
import type { WorkflowStep } from "../contracts/generated.js";
import type { WorkflowSpec } from "./workflow-spec.js";

export function workflowSpecToMermaid(spec: WorkflowSpec): string {
	const lines: string[] = ["stateDiagram-v2"];
	for (const t of spec.transitions) {
		const label = t.label ? `: ${t.label}` : "";
		lines.push(`    ${t.from} --> ${t.to}${label}`);
	}
	return lines.join("\n");
}

/**
 * Converts the runtime execution steps (actual workflow logic) to a Mermaid
 * flowchart, which more accurately represents what the WorkflowEngine runs
 * compared to the FSM-level `workflowSpecToMermaid`.
 *
 * Returns `null` when `spec.runtime` is undefined (spec is definition-only).
 */
export function workflowRuntimeToMermaid(spec: WorkflowSpec): string | null {
	if (!spec.runtime) return null;

	const lines: string[] = [`flowchart TD`];
	let nodeCounter = 0;

	function nodeId(): string {
		return `n${nodeCounter++}`;
	}

	function sanitize(text: string): string {
		return text.replace(/"/g, "'");
	}

	function renderSteps(steps: WorkflowStep[], parentId: string | null): string {
		let prevId: string | null = parentId;
		for (const step of steps) {
			const id = nodeId();
			switch (step.kind) {
				case "invokeSkill":
					lines.push(`    ${id}["skill: ${sanitize(step.skillId)}"]`);
					break;
				case "invokeInstruction":
					lines.push(`    ${id}[["instr: ${sanitize(step.instructionId)}"]]`);
					break;
				case "gate": {
					lines.push(`    ${id}{{"gate: ${sanitize(step.condition)}"}}`);
					if (prevId) lines.push(`    ${prevId} --> ${id}`);
					prevId = null;
					renderSteps(step.ifTrue, id + "_if");
					lines.push(`    ${id} -->|true| ${id}_if`);
					if (step.ifFalse && step.ifFalse.length > 0) {
						renderSteps(step.ifFalse, id + "_else");
						lines.push(`    ${id} -->|false| ${id}_else`);
					} else {
						lines.push(`    ${id} -->|false| skip_${id}[ ]`);
					}
					continue;
				}
				case "finalize":
					lines.push(`    ${id}(["finalize"])`);
					break;
				case "note":
					lines.push(`    ${id}>"note: ${sanitize(step.label)}"]`);
					break;
				case "serial": {
					lines.push(`    ${id}["serial: ${sanitize(step.label)}"]`);
					if (prevId) lines.push(`    ${prevId} --> ${id}`);
					renderSteps(step.steps, id);
					prevId = id;
					continue;
				}
				case "parallel": {
					lines.push(`    ${id}["parallel: ${sanitize(step.label)}"]`);
					if (prevId) lines.push(`    ${prevId} --> ${id}`);
					renderSteps(step.steps, id);
					prevId = id;
					continue;
				}
				default:
					lines.push(
						`    ${id}["${sanitize((step as WorkflowStep & { label: string }).label)}"]`,
					);
			}
			if (prevId) lines.push(`    ${prevId} --> ${id}`);
			prevId = id;
		}
		return prevId ?? parentId ?? "start";
	}

	renderSteps(spec.runtime.steps, null);
	return lines.join("\n");
}
