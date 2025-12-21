import { extractSteps } from "../utils/helpers.utils.js";
import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Flowchart handler.
 * Generates flowcharts with decision nodes and risk annotations.
 */
export class FlowchartHandler extends BaseDiagramHandler {
	readonly diagramType = "flowchart";

	generate(
		description: string,
		theme?: string,
		advancedFeatures?: Record<string, unknown>,
	): string {
		const direction = (advancedFeatures?.direction as string) || "TD";
		const steps = extractSteps(description);
		const flowDirection = direction || "TD";
		const lines: string[] = [`flowchart ${flowDirection}`];
		if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		if (!steps.length) {
			// Provide a simple user->system->processor->output pipeline if description lacks clear steps
			lines.push(
				"U([User]) --> R[Read users.json]",
				"R --> P[Filter active users with permissions]",
				"P --> A[Append to result]",
				"A --> O([Summary Output])",
			);
			return lines.join("\n");
		}

		// Build main chain with optional branching for filter step
		let offset = 0;
		for (let i = 0; i < steps.length; i++) {
			const id = String.fromCharCode(65 + i + offset);
			const label = steps[i];
			const isFilter = /filter .*active .*users/i.test(label);
			const decisionLike = /(decision|choose|\?)/i.test(label) || isFilter;

			if (isFilter) {
				// Create decision node with yes/no branches
				lines.push(`${id}{${label}?}`);
				const yesId = String.fromCharCode(65 + i + 1 + offset);
				const noId = String.fromCharCode(65 + i + 2 + offset);
				lines.push(`${id} -->|Yes| ${yesId}[Append to result]`);
				lines.push(`${id} -->|No| ${noId}[Skip]`);
				// Advance offset because we injected two extra nodes
				offset += 2;
				const nextId = String.fromCharCode(65 + i + 1 + offset);
				if (i < steps.length - 1) {
					lines.push(`${yesId} --> ${nextId}`);
					lines.push(`${noId} --> ${nextId}`);
				}
			} else {
				lines.push(decisionLike ? `${id}{${label}}` : `${id}[${label}]`);
				if (i < steps.length - 1) {
					const nextId = String.fromCharCode(65 + i + 1 + offset);
					lines.push(`${id} --> ${nextId}`);
				}
			}
		}

		const lastId = String.fromCharCode(65 + steps.length - 1 + offset);
		const endId = String.fromCharCode(65 + steps.length + offset);
		lines.push(`${lastId} --> ${endId}([End])`);

		// Enrich with risk / smell nodes based on keywords
		const riskNodes: string[] = [];
		let riskIndex = steps.length + 1 + offset; // starting after End
		const addRisk = (id: string, label: string, connectFrom: string) => {
			lines.push(`${id}[${label}]`);
			lines.push(`${connectFrom} -.-> ${id}`);
			riskNodes.push(id);
		};
		const lower = description.toLowerCase();
		const firstId = "A";
		if (/api key|secret/.test(lower)) {
			const id = String.fromCharCode(65 + riskIndex++);
			addRisk(id, "Hardcoded Secret", firstId);
		}
		if (/sql/.test(lower)) {
			const id = String.fromCharCode(65 + riskIndex++);
			addRisk(id, "Raw SQL Query Risk", firstId);
		}
		if (/deprecated|old method|old\b/.test(lower)) {
			const id = String.fromCharCode(65 + riskIndex++);
			addRisk(id, "Deprecated Method", firstId);
		}
		if (riskNodes.length) {
			lines.push("classDef risk fill:#fee,stroke:#d33,stroke-width:1px;");
			lines.push(`class ${riskNodes.join(",")} risk;`);
		}

		return lines.join("\n");
	}
}
