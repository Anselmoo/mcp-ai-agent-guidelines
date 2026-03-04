/**
 * Plugin Manager for cross-cutting capabilities.
 * Manages plugins that generate additional artifacts alongside strategy output.
 * @module
 */

import type { CrossCuttingArtifacts, CrossCuttingCapability } from "./types.js";

/**
 * Plugin interface - all cross-cutting plugins must implement this.
 */
export interface CrossCuttingPlugin {
	/** Plugin identifier */
	readonly name: CrossCuttingCapability;

	/** Plugin version */
	readonly version: string;

	/**
	 * Execute the plugin on strategy output.
	 */
	execute<T>(strategyOutput: T, context: PluginContext): Promise<PluginResult>;
}

/**
 * Context provided to plugins during execution.
 */
export interface PluginContext {
	approach: string;
	requestId: string;
	metadata: Record<string, unknown>;
}

/**
 * Result from plugin execution.
 */
export interface PluginResult {
	success: boolean;
	artifacts?: Partial<CrossCuttingArtifacts>;
	error?: Error;
}

/**
 * Plugin Manager - manages cross-cutting capability plugins.
 *
 * Executes plugins in parallel using Promise.allSettled for resilience.
 *
 * @example
 * ```typescript
 * manager.register(new DiagramPlugin());
 * const artifacts = await manager.execute(['diagram'], output, context);
 * ```
 */
export class PluginManager {
	private readonly plugins = new Map<
		CrossCuttingCapability,
		CrossCuttingPlugin
	>();

	/**
	 * Register a plugin.
	 */
	register(plugin: CrossCuttingPlugin): void {
		if (this.plugins.has(plugin.name)) {
			throw new Error(`Plugin already registered: ${plugin.name}`);
		}
		this.plugins.set(plugin.name, plugin);
	}

	/**
	 * Execute selected plugins on strategy output in parallel.
	 */
	async execute<T>(
		capabilities: CrossCuttingCapability[],
		strategyOutput: T,
		context: PluginContext,
	): Promise<{
		artifacts: CrossCuttingArtifacts;
		executed: string[];
		errors: Array<{ plugin: string; error: Error }>;
	}> {
		const artifacts: CrossCuttingArtifacts = {};
		const executed: string[] = [];
		const errors: Array<{ plugin: string; error: Error }> = [];

		const results = await Promise.allSettled(
			capabilities.map(async (cap) => {
				const plugin = this.plugins.get(cap);
				if (!plugin) {
					return { capability: cap, result: null };
				}
				const result = await plugin.execute(strategyOutput, context);
				return { capability: cap, result };
			}),
		);

		for (const result of results) {
			if (result.status === "fulfilled") {
				const { capability, result: pluginResult } = result.value;

				if (pluginResult?.success && pluginResult.artifacts) {
					executed.push(capability);
					this.mergeArtifacts(artifacts, pluginResult.artifacts);
				} else if (pluginResult?.error) {
					errors.push({ plugin: capability, error: pluginResult.error });
				}
			} else {
				errors.push({
					plugin: "unknown",
					error: result.reason as Error,
				});
			}
		}

		return { artifacts, executed, errors };
	}

	/**
	 * Check if a capability is available.
	 */
	has(capability: CrossCuttingCapability): boolean {
		return this.plugins.has(capability);
	}

	/**
	 * List all registered plugins.
	 */
	list(): Array<{ name: CrossCuttingCapability; version: string }> {
		return Array.from(this.plugins.values()).map((p) => ({
			name: p.name,
			version: p.version,
		}));
	}

	private mergeArtifacts(
		target: CrossCuttingArtifacts,
		source: Partial<CrossCuttingArtifacts>,
	): void {
		if (source.diagrams) {
			target.diagrams = [...(target.diagrams ?? []), ...source.diagrams];
		}
		if (source.scripts) {
			target.scripts = [...(target.scripts ?? []), ...source.scripts];
		}
		if (source.configs) {
			target.configs = [...(target.configs ?? []), ...source.configs];
		}
		if (source.workflows) {
			target.workflows = [...(target.workflows ?? []), ...source.workflows];
		}
		if (source.issues) {
			target.issues = [...(target.issues ?? []), ...source.issues];
		}
	}
}

/**
 * Default singleton instance.
 */
export const pluginManager = new PluginManager();
