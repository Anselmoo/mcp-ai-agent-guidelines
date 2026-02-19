/**
 * AgentHandoffCoordinator - manages agent-to-agent handoffs.
 *
 * Packages execution context for handoffs, generates structured instructions,
 * supports serialization for MCP transport, and tracks handoff lifecycle.
 *
 * @module domain/coordination/agent-handoff-coordinator
 */

import { randomUUID } from "node:crypto";
import type { ExecutionTrace } from "./execution-trace.js";
import type {
	AgentId,
	CreateHandoffRequest,
	ExecutionTraceSnapshot,
	HandoffPackage,
	HandoffPriority,
	HandoffStatus,
} from "./handoff-types.js";

/**
 * Current handoff protocol version.
 */
const HANDOFF_VERSION = "1.0.0";

/**
 * Default expiration in minutes.
 */
const DEFAULT_EXPIRATION_MINUTES = 60;

/**
 * Priority order for sorting (lower = higher priority).
 */
const PRIORITY_ORDER: Record<HandoffPriority, number> = {
	immediate: 0,
	normal: 1,
	background: 2,
};

/**
 * AgentHandoffCoordinator - manages agent-to-agent handoffs.
 *
 * Features:
 * - Packages execution context for handoffs
 * - Generates structured instructions
 * - Supports serialization for MCP transport
 * - Tracks handoff lifecycle
 *
 * @example
 * ```typescript
 * const handoff = AgentHandoffCoordinator.prepareHandoff({
 *   sourceAgent: 'speckit-generator',
 *   targetAgent: 'code-reviewer',
 *   trace: executionTrace,
 *   context: { artifacts: ['spec.md'] },
 *   instructions: 'Review the spec for completeness.',
 * });
 *
 * // Serialize for transport
 * const json = AgentHandoffCoordinator.toJSON(handoff);
 *
 * // Parse on receiving side
 * const received = AgentHandoffCoordinator.parseHandoff(json);
 * ```
 */
export class AgentHandoffCoordinator {
	private handoffs = new Map<string, HandoffPackage>();

	// ============================================
	// Static Factory Methods
	// ============================================

	/**
	 * Prepare a handoff package.
	 *
	 * @param request - The handoff creation request
	 * @returns A complete handoff package ready for transport
	 */
	static prepareHandoff(request: CreateHandoffRequest): HandoffPackage {
		const now = new Date();
		const expirationMinutes =
			request.expirationMinutes ?? DEFAULT_EXPIRATION_MINUTES;

		// Normalize instructions
		const instructions =
			typeof request.instructions === "string"
				? { task: request.instructions }
				: request.instructions;

		// Create trace snapshot if provided
		const traceSnapshot = request.trace
			? AgentHandoffCoordinator.createTraceSnapshot(request.trace)
			: undefined;

		return {
			id: randomUUID(),
			version: HANDOFF_VERSION,
			sourceAgent: request.sourceAgent,
			targetAgent: request.targetAgent,
			priority: request.priority ?? "normal",
			status: "pending" as HandoffStatus,
			context: request.context,
			instructions,
			trace: traceSnapshot,
			createdAt: now,
			expiresAt: new Date(now.getTime() + expirationMinutes * 60 * 1000),
			metadata: request.metadata,
		};
	}

	/**
	 * Parse a serialized handoff.
	 *
	 * @param json - JSON string or plain object representing a handoff
	 * @returns The deserialized HandoffPackage with restored Date objects
	 * @throws Error if the version is missing or incompatible
	 */
	static parseHandoff(json: string | object): HandoffPackage {
		const data =
			typeof json === "string"
				? (JSON.parse(json) as Record<string, unknown>)
				: (json as Record<string, unknown>);

		// Validate version compatibility
		if (!data.version) {
			throw new Error("Invalid handoff: missing version");
		}

		const version = data.version as string;
		const [major] = version.split(".");
		const [currentMajor] = HANDOFF_VERSION.split(".");

		if (major !== currentMajor) {
			throw new Error(
				`Incompatible handoff version: ${version} (expected ${HANDOFF_VERSION})`,
			);
		}

		// Restore dates
		return {
			...(data as unknown as HandoffPackage),
			createdAt: new Date(data.createdAt as string),
			expiresAt: data.expiresAt
				? new Date(data.expiresAt as string)
				: undefined,
		};
	}

	// ============================================
	// Instance Methods
	// ============================================

	/**
	 * Register a handoff for tracking.
	 *
	 * @param handoff - The handoff package to register
	 */
	register(handoff: HandoffPackage): void {
		this.handoffs.set(handoff.id, handoff);
	}

	/**
	 * Get a handoff by ID.
	 *
	 * @param id - The handoff ID
	 * @returns The handoff package, or undefined if not found
	 */
	get(id: string): HandoffPackage | undefined {
		return this.handoffs.get(id);
	}

	/**
	 * Update handoff status.
	 *
	 * Creates a new HandoffPackage object with the updated status rather than
	 * mutating the existing entry, preserving immutability of stored values.
	 *
	 * @param id - The handoff ID
	 * @param status - New status value
	 * @returns true if updated, false if not found
	 */
	updateStatus(id: string, status: HandoffStatus): boolean {
		const handoff = this.handoffs.get(id);
		if (!handoff) return false;

		this.handoffs.set(id, { ...handoff, status });
		return true;
	}

	/**
	 * Check if handoff is expired.
	 *
	 * @param handoff - The handoff to check
	 * @returns true if the handoff is past its expiration time
	 */
	isExpired(handoff: HandoffPackage): boolean {
		if (!handoff.expiresAt) return false;
		return new Date() > handoff.expiresAt;
	}

	/**
	 * List pending handoffs for an agent, sorted by priority then creation time.
	 *
	 * @param agentId - The target agent ID
	 * @returns Array of pending, non-expired handoffs targeting this agent
	 */
	listPendingForAgent(agentId: AgentId): HandoffPackage[] {
		return Array.from(this.handoffs.values())
			.filter(
				(h) =>
					h.targetAgent === agentId &&
					h.status === "pending" &&
					!this.isExpired(h),
			)
			.sort((a, b) => {
				const priorityDiff =
					PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
				if (priorityDiff !== 0) return priorityDiff;
				return a.createdAt.getTime() - b.createdAt.getTime();
			});
	}

	/**
	 * Clear all expired handoffs from the registry.
	 *
	 * @returns Number of handoffs cleared
	 */
	clearExpired(): number {
		let cleared = 0;

		for (const [id, handoff] of this.handoffs) {
			if (this.isExpired(handoff)) {
				this.handoffs.delete(id);
				cleared++;
			}
		}

		return cleared;
	}

	// ============================================
	// Trace Snapshot
	// ============================================

	/**
	 * Create a serializable snapshot from an execution trace.
	 *
	 * @param trace - The ExecutionTrace to snapshot
	 * @returns A plain-object snapshot suitable for JSON serialization
	 */
	static createTraceSnapshot(trace: ExecutionTrace): ExecutionTraceSnapshot {
		const data = trace.toJSON();

		return {
			operation: data.operation,
			timestamp: data.timestamp,
			durationMs: data.durationMs,
			decisions: data.decisions.map((d) => ({
				point: d.point,
				choice: d.choice,
				reason: d.reason,
			})),
			metrics: data.metrics.map((m) => ({
				name: m.name,
				value: m.value,
				unit: m.unit,
			})),
			errors: data.errors.map((e) => ({
				code: e.code,
				message: e.message,
			})),
			success: data.success,
		};
	}

	// ============================================
	// Serialization Helpers
	// ============================================

	/**
	 * Convert handoff to JSON string.
	 *
	 * @param handoff - The handoff package to serialize
	 * @returns Pretty-printed JSON string
	 */
	static toJSON(handoff: HandoffPackage): string {
		return JSON.stringify(handoff, null, 2);
	}

	/**
	 * Generate a markdown summary of a handoff.
	 *
	 * @param handoff - The handoff package to summarize
	 * @returns Markdown-formatted summary string
	 */
	static toMarkdown(handoff: HandoffPackage): string {
		const lines: string[] = [];

		lines.push(
			`# Agent Handoff: ${handoff.sourceAgent} → ${handoff.targetAgent}`,
		);
		lines.push("");
		lines.push(`**ID**: \`${handoff.id}\``);
		lines.push(`**Status**: ${handoff.status}`);
		lines.push(`**Priority**: ${handoff.priority}`);
		lines.push(`**Created**: ${handoff.createdAt.toISOString()}`);
		if (handoff.expiresAt) {
			lines.push(`**Expires**: ${handoff.expiresAt.toISOString()}`);
		}
		lines.push("");

		// Instructions
		lines.push("## Instructions");
		lines.push("");
		lines.push(`**Task**: ${handoff.instructions.task}`);

		if (handoff.instructions.constraints?.length) {
			lines.push("");
			lines.push("**Constraints**:");
			for (const c of handoff.instructions.constraints) {
				lines.push(`- ${c}`);
			}
		}

		if (handoff.instructions.focusAreas?.length) {
			lines.push("");
			lines.push("**Focus Areas**:");
			for (const f of handoff.instructions.focusAreas) {
				lines.push(`- ${f}`);
			}
		}

		// Context
		if (handoff.context.artifacts?.length) {
			lines.push("");
			lines.push("## Artifacts");
			lines.push("");
			for (const a of handoff.context.artifacts) {
				lines.push(`- \`${a}\``);
			}
		}

		if (handoff.context.decisions?.length) {
			lines.push("");
			lines.push("## Prior Decisions");
			lines.push("");
			for (const d of handoff.context.decisions) {
				lines.push(`- **${d.what}**: ${d.why}`);
			}
		}

		// Trace summary
		if (handoff.trace) {
			lines.push("");
			lines.push("## Execution Trace Summary");
			lines.push("");
			lines.push(`- **Operation**: ${handoff.trace.operation}`);
			lines.push(`- **Duration**: ${handoff.trace.durationMs}ms`);
			lines.push(`- **Success**: ${handoff.trace.success ? "✅" : "❌"}`);
			lines.push(`- **Decisions**: ${handoff.trace.decisions.length}`);
			lines.push(`- **Errors**: ${handoff.trace.errors.length}`);
		}

		return lines.join("\n");
	}
}

/**
 * Default coordinator instance.
 */
export const agentHandoffCoordinator = new AgentHandoffCoordinator();
