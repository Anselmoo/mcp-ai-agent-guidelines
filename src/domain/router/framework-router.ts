/**
 * Framework Router - unified entry point for strategy-based output generation.
 * Routes requests to appropriate strategies based on OutputApproach.
 * @module
 */

import { randomUUID } from "node:crypto";
import type { PluginManager } from "./plugin-manager.js";
import { pluginManager as defaultPluginManager } from "./plugin-manager.js";
import type { StrategyRegistry } from "./strategy-registry.js";
import { strategyRegistry as defaultRegistry } from "./strategy-registry.js";
import type {
	OutputApproach,
	RouterError,
	RouterRequest,
	RouterResponse,
} from "./types.js";

/**
 * FrameworkRouter - the core routing layer for the unified output ecosystem.
 *
 * Responsibilities:
 * 1. Validate the requested approach
 * 2. Retrieve the appropriate strategy
 * 3. Execute the strategy
 * 4. Run cross-cutting plugins in parallel
 * 5. Assemble the final RouterResponse
 *
 * @example
 * ```typescript
 * const response = await frameworkRouter.execute({
 *   approach: 'speckit',
 *   input: { projectName: 'MyApp' },
 *   capabilities: ['diagram'],
 * });
 *
 * if (response.success) {
 *   console.log(response.output);
 * }
 * ```
 */
export class FrameworkRouter {
	constructor(
		private readonly registry: StrategyRegistry = defaultRegistry,
		private readonly plugins: PluginManager = defaultPluginManager,
	) {}

	/**
	 * Execute a request through the appropriate strategy.
	 */
	async execute<TInput, TOutput>(
		request: RouterRequest<TInput>,
	): Promise<RouterResponse<TOutput>> {
		const requestId = request.metadata?.requestId ?? randomUUID();
		const startedAt = new Date();

		// Validate approach
		if (!this.registry.has(request.approach)) {
			const error: RouterError = {
				code: "UNKNOWN_APPROACH",
				message: `No strategy registered for approach: ${request.approach}`,
				approach: request.approach,
			};

			return {
				success: false,
				error,
				trace: {
					requestId,
					approach: request.approach,
					startedAt,
					completedAt: new Date(),
					durationMs: 0,
					strategyVersion: "unknown",
					pluginsExecuted: [],
					metrics: {},
				},
			};
		}

		// Execute strategy
		const strategy = this.registry.get<TInput, TOutput>(request.approach);
		const strategyResult = await strategy.run(request.input);

		const completedAt = new Date();
		const durationMs = completedAt.getTime() - startedAt.getTime();
		const strategyVersion =
			this.registry.getVersion(request.approach) ?? "0.0.0";

		if (!strategyResult.success) {
			const errorMessages = strategyResult.errors
				.map((e) => e.message)
				.join("; ");

			return {
				success: false,
				error: {
					code: "EXECUTION_FAILED",
					message: errorMessages,
					approach: request.approach,
				},
				trace: {
					requestId,
					approach: request.approach,
					startedAt,
					completedAt,
					durationMs,
					strategyVersion,
					pluginsExecuted: [],
					metrics: {},
				},
			};
		}

		// Run cross-cutting plugins
		const pluginsExecuted: string[] = [];
		let artifacts = {};

		if (request.capabilities && request.capabilities.length > 0) {
			const pluginContext = {
				approach: request.approach,
				requestId,
				metadata: (request.metadata as Record<string, unknown>) ?? {},
			};

			const pluginExecution = await this.plugins.execute(
				request.capabilities,
				strategyResult.data,
				pluginContext,
			);

			artifacts = pluginExecution.artifacts;
			pluginsExecuted.push(...pluginExecution.executed);
		}

		return {
			success: true,
			output: strategyResult.data,
			artifacts: Object.keys(artifacts).length > 0 ? artifacts : undefined,
			trace: {
				requestId,
				approach: request.approach,
				startedAt,
				completedAt,
				durationMs,
				strategyVersion,
				pluginsExecuted,
				metrics: {},
			},
		};
	}

	/**
	 * List all registered output approaches.
	 */
	getApproaches(): OutputApproach[] {
		return this.registry.list().map((e) => e.approach);
	}

	/**
	 * Check if an approach is supported.
	 */
	supportsApproach(approach: OutputApproach): boolean {
		return this.registry.has(approach);
	}
}

/**
 * Default singleton instance.
 */
export const frameworkRouter = new FrameworkRouter();
