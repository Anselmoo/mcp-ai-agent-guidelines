import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Handler for entity-relationship diagrams.
 * Generates ER diagrams showing database relationships.
 */
export class ERHandler extends BaseDiagramHandler {
	readonly diagramType = "er";

	generate(description: string, theme?: string): string {
		this.validateInput(description);

		const lines: string[] = ["erDiagram"];
		if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		// Extract entities and relationships
		const { entities: _entities, relationships } =
			this.parseERDescription(description);

		if (relationships.length > 0) {
			for (const rel of relationships) {
				lines.push(rel);
			}
		} else {
			// Fallback template
			lines.push(
				"CUSTOMER ||--o{ ORDER : places",
				"ORDER ||--|{ LINE-ITEM : contains",
				'PRODUCT ||--o{ LINE-ITEM : "ordered in"',
			);
		}

		return lines.join("\n");
	}

	/**
	 * Parse natural language description to extract ER information.
	 */
	private parseERDescription(description: string): {
		entities: string[];
		relationships: string[];
	} {
		const entities: string[] = [];
		const relationships: string[] = [];
		const lower = description.toLowerCase();

		// Extract entity names (capitalized words or explicit mentions)
		const words = description.split(/\s+/);
		const entitySet = new Set<string>();

		for (const word of words) {
			const clean = word.replace(/[^a-zA-Z]/g, "");
			if (clean.length > 2 && clean[0] === clean[0].toUpperCase()) {
				entitySet.add(clean.toUpperCase());
			}
		}

		entities.push(...entitySet);

		// Extract relationships
		const entArray = Array.from(entitySet);
		for (let i = 0; i < entArray.length - 1; i++) {
			const e1 = entArray[i].toLowerCase();
			const e2 = entArray[i + 1].toLowerCase();

			if (
				lower.includes(`${e1} has ${e2}`) ||
				lower.includes(`${e1} contains ${e2}`)
			) {
				relationships.push(`${entArray[i]} ||--o{ ${entArray[i + 1]} : has`);
			} else if (lower.includes(`${e1} belongs to ${e2}`)) {
				relationships.push(
					`${entArray[i]} }o--|| ${entArray[i + 1]} : "belongs to"`,
				);
			} else {
				relationships.push(
					`${entArray[i]} ||--o{ ${entArray[i + 1]} : relates`,
				);
			}
		}

		return { entities, relationships };
	}
}
