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
 * AgentHandoffCoordinator - manages agent-to-agent handoffs.
 */
export class AgentHandoffCoordinator {
	/**
	 * Prepare a handoff package.
	 */
	static prepareHandoff(request: CreateHandoffRequest): HandoffPackage {
		const now = new Date();
		const expirationMinutes =
			request.expirationMinutes ?? DEFAULT_EXPIRATION_MINUTES;

		const instructions =
			typeof request.instructions === "string"
				? { task: request.instructions }
				: request.instructions;

		const traceSnapshot = request.trace
			? AgentHandoffCoordinator.createTraceSnapshot(request.trace)
			: undefined;

		return {
			id: randomUUID(),
			version: HANDOFF_VERSION,
			sourceAgent: request.sourceAgent,
			targetAgent: request.targetAgent,
			priority: request.priority ?? "normal",
			status: "pending",
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
	 */
	static parseHandoff(json: string | object): HandoffPackage {
		const data = (
			typeof json === "string" ? JSON.parse(json) : json
		) as Partial<HandoffPackage> & { version?: string };

		if (!data.version) {
			throw new Error("Invalid handoff: missing version");
		}

		const [major] = data.version.split(".");
		const [currentMajor] = HANDOFF_VERSION.split(".");

		if (major !== currentMajor) {
			throw new Error(
				`Incompatible handoff version: ${data.version} (expected ${HANDOFF_VERSION})`,
			);
		}

		return {
			...(data as HandoffPackage),
			createdAt: new Date(data.createdAt as unknown as string),
			expiresAt: data.expiresAt
				? new Date(data.expiresAt as unknown as string)
				: undefined,
			instructions: {
				...(data.instructions as HandoffPackage["instructions"]),
				deadline:
					data.instructions?.deadline !== undefined
						? new Date(data.instructions.deadline as unknown as string)
						: undefined,
			},
		};
	}

	private handoffs = new Map<string, HandoffPackage>();

	/**
	 * Register a handoff.
	 */
	register(handoff: HandoffPackage): void {
		this.handoffs.set(handoff.id, handoff);
	}

	/**
	 * Get a handoff by ID.
	 */
	get(id: string): HandoffPackage | undefined {
		return this.handoffs.get(id);
	}

	/**
	 * Update handoff status.
	 */
	updateStatus(id: string, status: HandoffStatus): boolean {
		const handoff = this.handoffs.get(id);
		if (!handoff) {
			return false;
		}

		handoff.status = status;
		return true;
	}

	/**
	 * Check if handoff is expired.
	 */
	isExpired(handoff: HandoffPackage): boolean {
		if (!handoff.expiresAt) {
			return false;
		}

		return new Date() > handoff.expiresAt;
	}

	/**
	 * List pending handoffs for an agent.
	 */
	listPendingForAgent(agentId: AgentId): HandoffPackage[] {
		const priorityOrder: Record<HandoffPriority, number> = {
			immediate: 0,
			normal: 1,
			background: 2,
		};

		return Array.from(this.handoffs.values())
			.filter(
				(handoff) =>
					handoff.targetAgent === agentId &&
					handoff.status === "pending" &&
					!this.isExpired(handoff),
			)
			.sort((a, b) => {
				const priorityDiff =
					priorityOrder[a.priority] - priorityOrder[b.priority];
				if (priorityDiff !== 0) {
					return priorityDiff;
				}

				return a.createdAt.getTime() - b.createdAt.getTime();
			});
	}

	/**
	 * Clear expired handoffs.
	 */
	clearExpired(): number {
		let cleared = 0;
		for (const [id, handoff] of this.handoffs.entries()) {
			if (this.isExpired(handoff)) {
				this.handoffs.delete(id);
				cleared += 1;
			}
		}
		return cleared;
	}

	/**
	 * Create a serializable snapshot from an execution trace.
	 */
	static createTraceSnapshot(trace: ExecutionTrace): ExecutionTraceSnapshot {
		const data = trace.toJSON();
		return {
			operation: data.operation,
			timestamp: data.timestamp,
			durationMs: data.durationMs,
			decisions: data.decisions.map((decision) => ({
				point: decision.point,
				choice: decision.choice,
				reason: decision.reason,
			})),
			metrics: data.metrics.map((metric) => ({
				name: metric.name,
				value: metric.value,
				unit: metric.unit,
			})),
			errors: data.errors.map((error) => ({
				code: error.code,
				message: error.message,
			})),
			success: data.success,
		};
	}

	/**
	 * Convert handoff to JSON string.
	 */
	static toJSON(handoff: HandoffPackage): string {
		return JSON.stringify(handoff, null, 2);
	}

	/**
	 * Generate markdown summary of handoff.
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

		lines.push("## Instructions");
		lines.push("");
		lines.push(`**Task**: ${handoff.instructions.task}`);

		if (handoff.instructions.constraints?.length) {
			lines.push("");
			lines.push("**Constraints**:");
			for (const constraint of handoff.instructions.constraints) {
				lines.push(`- ${constraint}`);
			}
		}

		if (handoff.instructions.focusAreas?.length) {
			lines.push("");
			lines.push("**Focus Areas**:");
			for (const focusArea of handoff.instructions.focusAreas) {
				lines.push(`- ${focusArea}`);
			}
		}

		if (handoff.context.artifacts?.length) {
			lines.push("");
			lines.push("## Artifacts");
			lines.push("");
			for (const artifact of handoff.context.artifacts) {
				lines.push(`- \`${artifact}\``);
			}
		}

		if (handoff.context.decisions?.length) {
			lines.push("");
			lines.push("## Prior Decisions");
			lines.push("");
			for (const decision of handoff.context.decisions) {
				lines.push(`- **${decision.what}**: ${decision.why}`);
			}
		}

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
