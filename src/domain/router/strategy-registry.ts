/**
 * Strategy Registry for the Framework Router.
 * Manages strategy registration and lifecycle.
 * @module
 */

import type { BaseStrategy } from "../../strategies/shared/base-strategy.js";
import type { OutputApproach } from "./types.js";

/**
 * Factory function that creates a strategy instance.
 */
type StrategyFactory<TInput, TOutput> = () => BaseStrategy<TInput, TOutput>;

/**
 * Registry entry with metadata.
 */
interface RegistryEntry {
	factory: StrategyFactory<unknown, unknown>;
	version: string;
	description: string;
	singleton: boolean;
	instance?: BaseStrategy<unknown, unknown>;
}

/**
 * Strategy Registry - manages strategy registration and instantiation.
 *
 * Features:
 * - Lazy instantiation for performance
 * - Singleton support for stateless strategies
 * - Version tracking for debugging
 *
 * @example
 * ```typescript
 * registry.register('speckit', () => new SpecKitStrategy(), {
 *   version: '2.0.0',
 *   description: 'Generate project specification artifacts',
 *   singleton: true,
 * });
 *
 * const strategy = registry.get('speckit');
 * ```
 */
export class StrategyRegistry {
	private readonly strategies = new Map<OutputApproach, RegistryEntry>();

	/**
	 * Register a strategy factory.
	 */
	register<TInput, TOutput>(
		approach: OutputApproach,
		factory: StrategyFactory<TInput, TOutput>,
		options: {
			version: string;
			description: string;
			singleton?: boolean;
		},
	): void {
		if (this.strategies.has(approach)) {
			throw new Error(`Strategy already registered for approach: ${approach}`);
		}

		this.strategies.set(approach, {
			factory: factory as StrategyFactory<unknown, unknown>,
			version: options.version,
			description: options.description,
			singleton: options.singleton ?? true,
		});
	}

	/**
	 * Get a strategy instance for an approach.
	 *
	 * @throws If no strategy registered for approach
	 */
	get<TInput, TOutput>(
		approach: OutputApproach,
	): BaseStrategy<TInput, TOutput> {
		const entry = this.strategies.get(approach);

		if (!entry) {
			throw new Error(`No strategy registered for approach: ${approach}`);
		}

		if (entry.singleton) {
			if (!entry.instance) {
				entry.instance = entry.factory();
			}
			return entry.instance as BaseStrategy<TInput, TOutput>;
		}

		return entry.factory() as BaseStrategy<TInput, TOutput>;
	}

	/**
	 * Check if an approach is registered.
	 */
	has(approach: OutputApproach): boolean {
		return this.strategies.has(approach);
	}

	/**
	 * Get the registered version for an approach.
	 */
	getVersion(approach: OutputApproach): string | undefined {
		return this.strategies.get(approach)?.version;
	}

	/**
	 * Get metadata for all registered strategies.
	 */
	list(): Array<{
		approach: OutputApproach;
		version: string;
		description: string;
	}> {
		return Array.from(this.strategies.entries()).map(([approach, entry]) => ({
			approach,
			version: entry.version,
			description: entry.description,
		}));
	}

	/**
	 * Clear all registered strategies (for testing).
	 */
	clear(): void {
		this.strategies.clear();
	}
}

/**
 * Default singleton instance.
 */
export const strategyRegistry = new StrategyRegistry();
