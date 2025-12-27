import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Class diagram handler.
 * Generates UML class diagrams showing class structures and relationships.
 */
export class ClassHandler extends BaseDiagramHandler {
	readonly diagramType = "class";

	generate(
		description: string,
		theme?: string,
		_advancedFeatures?: Record<string, unknown>,
	): string {
		const lines: string[] = ["classDiagram"];
		if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		// Parse description to extract classes and relationships
		const { classes, relationships } = this.parseClassDescription(description);

		if (classes.length > 0) {
			// Add parsed classes
			for (const cls of classes) {
				if (cls.properties.length > 0 || cls.methods.length > 0) {
					lines.push(`class ${cls.name} {`);
					for (const prop of cls.properties) {
						lines.push(`  ${prop}`);
					}
					for (const method of cls.methods) {
						lines.push(`  ${method}`);
					}
					lines.push("}");
				} else {
					lines.push(`class ${cls.name}`);
				}
			}

			// Add relationships
			for (const rel of relationships) {
				lines.push(rel);
			}
		} else {
			// Fallback to default template
			lines.push(
				"class User {",
				"  +String name",
				"  +String email",
				"  +login()",
				"  +logout()",
				"}",
				"class System {",
				"  +processRequest()",
				"  +validateUser()",
				"}",
				"User --> System : uses",
			);
		}

		return lines.join("\n");
	}

	private parseClassDescription(description: string): {
		classes: Array<{ name: string; properties: string[]; methods: string[] }>;
		relationships: string[];
	} {
		const classes: Array<{
			name: string;
			properties: string[];
			methods: string[];
		}> = [];
		const relationships: string[] = [];
		const classNames = new Set<string>();

		// Extract class names (capitalized words or explicit mentions)
		const words = description.split(/\s+/);
		for (const word of words) {
			const clean = word.replace(/[^a-zA-Z]/g, "");
			if (clean.length > 2 && clean[0] === clean[0].toUpperCase()) {
				classNames.add(clean);
			}
		}

		// Look for common class-related keywords
		const commonClasses = [
			"User",
			"Product",
			"Order",
			"Customer",
			"Account",
			"Item",
			"Service",
			"Manager",
		];
		for (const cls of commonClasses) {
			if (description.toLowerCase().includes(cls.toLowerCase())) {
				classNames.add(cls);
			}
		}

		// Create class definitions
		for (const name of classNames) {
			const properties: string[] = [];
			const methods: string[] = [];

			// Extract properties (look for "has", "contains", "with" patterns)
			const lower = description.toLowerCase();
			if (
				lower.includes(`${name.toLowerCase()} has`) ||
				lower.includes(`${name.toLowerCase()} contains`)
			) {
				properties.push("+String id");
				properties.push("+String name");
			}

			// Extract methods (look for action verbs)
			if (
				lower.includes(`${name.toLowerCase()} can`) ||
				lower.includes(`${name.toLowerCase()} does`)
			) {
				methods.push("+process()");
			}

			classes.push({ name, properties, methods });
		}

		// Extract relationships
		const classArray = Array.from(classNames);
		for (let i = 0; i < classArray.length - 1; i++) {
			const lower = description.toLowerCase();
			const cls1 = classArray[i].toLowerCase();
			const cls2 = classArray[i + 1].toLowerCase();

			if (
				lower.includes(`${cls1} has ${cls2}`) ||
				lower.includes(`${cls1} contains ${cls2}`)
			) {
				relationships.push(`${classArray[i]} --> ${classArray[i + 1]} : has`);
			} else if (
				lower.includes(`${cls1} uses ${cls2}`) ||
				lower.includes(`${cls1} depends on ${cls2}`)
			) {
				relationships.push(`${classArray[i]} --> ${classArray[i + 1]} : uses`);
			}
		}

		return { classes, relationships };
	}
}
