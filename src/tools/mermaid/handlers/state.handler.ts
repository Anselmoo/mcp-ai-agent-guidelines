import { extractTrigger } from "../utils/helpers.utils.js";
import { BaseDiagramHandler } from "./base.handler.js";

/**
 * State diagram handler.
 * Generates state machine diagrams showing states and transitions.
 */
export class StateHandler extends BaseDiagramHandler {
	readonly diagramType = "state";

	generate(
		description: string,
		theme?: string,
		_advancedFeatures?: Record<string, unknown>,
	): string {
		const lines: string[] = ["stateDiagram-v2"];
		if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		// Parse description to extract states and transitions
		const { states, transitions } = this.parseStateDescription(description);

		if (states.length > 0 && transitions.length > 0) {
			for (const transition of transitions) {
				lines.push(transition);
			}
		} else {
			// Fallback to default template
			lines.push(
				"[*] --> Idle",
				"Idle --> Processing : start",
				"Processing --> Complete : finish",
				"Processing --> Error : fail",
				"Complete --> [*]",
				"Error --> Idle : retry",
			);
		}

		return lines.join("\n");
	}

	private parseStateDescription(description: string): {
		states: string[];
		transitions: string[];
	} {
		const states: string[] = [];
		const transitions: string[] = [];
		const stateMap = new Map<string, string>();

		// Extract state names (look for status/state keywords)
		const commonStates = [
			"idle",
			"active",
			"processing",
			"complete",
			"error",
			"pending",
			"ready",
			"waiting",
			"done",
			"failed",
		];
		const words = description.toLowerCase().split(/\s+/);

		for (const word of words) {
			const clean = word.replace(/[^a-z]/g, "");
			if (commonStates.includes(clean) && !stateMap.has(clean)) {
				const stateName = clean.charAt(0).toUpperCase() + clean.slice(1);
				stateMap.set(clean, stateName);
				states.push(stateName);
			}
		}

		// Extract transitions from sentences
		const sentences = description
			.split(/[.!?\n]+/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		const stateArray = Array.from(stateMap.entries());

		if (stateArray.length > 0) {
			// Add initial state
			transitions.push(`[*] --> ${stateArray[0][1]}`);

			// Extract transitions between states
			for (const sentence of sentences) {
				const lower = sentence.toLowerCase();
				for (let i = 0; i < stateArray.length; i++) {
					for (let j = 0; j < stateArray.length; j++) {
						if (i !== j) {
							const [state1Key, state1Name] = stateArray[i];
							const [state2Key, state2Name] = stateArray[j];

							if (
								lower.includes(`${state1Key} to ${state2Key}`) ||
								lower.includes(`from ${state1Key} to ${state2Key}`)
							) {
								const trigger = extractTrigger(sentence);
								transitions.push(
									`${state1Name} --> ${state2Name} : ${trigger}`,
								);
							}
						}
					}
				}
			}

			// Add final state if we have a complete or done state
			const finalStates = ["Complete", "Done", "Finished"];
			for (const state of states) {
				if (finalStates.includes(state)) {
					transitions.push(`${state} --> [*]`);
					break;
				}
			}
		}

		return { states, transitions };
	}
}
