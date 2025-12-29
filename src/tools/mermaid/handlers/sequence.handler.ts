import { extractAction } from "../utils/helpers.utils.js";
import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Sequence diagram handler.
 * Generates UML sequence diagrams showing interactions between participants.
 */
export class SequenceHandler extends BaseDiagramHandler {
	readonly diagramType = "sequence";

	generate(
		description: string,
		theme?: string,
		advancedFeatures?: Record<string, unknown>,
	): string {
		const header: string[] = ["sequenceDiagram"];
		if (theme) header.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		// Parse description to extract participants and interactions
		const { participants, interactions } =
			this.parseSequenceDescription(description);

		// Add participants
		if (participants.length > 0) {
			for (const p of participants) {
				header.push(`participant ${p.id} as ${p.name}`);
			}
		}

		// Add interactions
		if (interactions.length > 0) {
			for (const interaction of interactions) {
				header.push(interaction);
			}
		} else {
			// Fallback to default template if parsing fails
			const body = [
				"participant U as User",
				"participant S as System",
				"participant D as Database",
				"U->>S: Request",
				"S->>D: Query",
				"D-->>S: Data",
				"S-->>U: Response",
			];
			return [...header, ...body].join("\n");
		}

		// Add advanced features like loops, alt blocks, etc.
		if (advancedFeatures?.autonumber === true) {
			header.splice(1, 0, "autonumber");
		}

		return header.join("\n");
	}

	private parseSequenceDescription(description: string): {
		participants: Array<{ id: string; name: string }>;
		interactions: string[];
	} {
		const participants: Array<{ id: string; name: string }> = [];
		const interactions: string[] = [];
		const participantMap = new Map<string, string>();

		// Extract participant names (nouns that appear frequently or are explicitly mentioned)
		const words = description.toLowerCase().split(/\s+/);
		const commonParticipants = [
			"user",
			"system",
			"server",
			"client",
			"database",
			"api",
			"service",
			"admin",
			"customer",
		];

		let participantId = 65; // ASCII 'A'
		for (const word of words) {
			const clean = word.replace(/[^a-z]/g, "");
			if (commonParticipants.includes(clean) && !participantMap.has(clean)) {
				const id = String.fromCharCode(participantId++);
				const name = clean.charAt(0).toUpperCase() + clean.slice(1);
				participantMap.set(clean, id);
				participants.push({ id, name });
			}
		}

		// Extract interactions from sentences
		const sentences = description
			.split(/[.!?\n]+/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		for (const sentence of sentences) {
			const lower = sentence.toLowerCase();

			// Look for interaction patterns
			for (const [name1, id1] of participantMap) {
				for (const [name2, id2] of participantMap) {
					if (name1 !== name2) {
						// Check for various interaction patterns
						if (
							lower.includes(`${name1} sends`) ||
							lower.includes(`${name1} to ${name2}`)
						) {
							const action = extractAction(sentence);
							interactions.push(`${id1}->>${id2}: ${action}`);
						} else if (
							lower.includes(`${name2} responds`) ||
							lower.includes(`${name2} returns`)
						) {
							const action = extractAction(sentence);
							interactions.push(`${id2}-->>${id1}: ${action}`);
						}
					}
				}
			}
		}

		return { participants, interactions };
	}
}
