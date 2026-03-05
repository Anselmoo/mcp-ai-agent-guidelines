/**
 * Framework registry — maps framework names to their FrameworkDefinition.
 * This is the T-038 "FrameworkRouter" implementation (simple name→handler map).
 */

import type { FrameworkDefinition } from "./types.js";

export class FrameworkRouter {
	private readonly registry = new Map<string, FrameworkDefinition>();

	/**
	 * Register a framework by its name slug.
	 */
	register(name: string, framework: FrameworkDefinition): void {
		this.registry.set(name, framework);
	}

	/**
	 * Retrieve a registered framework by name. Throws if unknown.
	 */
	get(name: string): FrameworkDefinition {
		const framework = this.registry.get(name);
		if (!framework) {
			throw new Error(`Unknown framework: ${name}`);
		}
		return framework;
	}

	/**
	 * Check whether a framework name is registered.
	 */
	has(name: string): boolean {
		return this.registry.has(name);
	}

	/**
	 * List all registered framework names.
	 */
	list(): string[] {
		return Array.from(this.registry.keys());
	}
}

/** Singleton router used by the application. */
export const frameworkRouter = new FrameworkRouter();
