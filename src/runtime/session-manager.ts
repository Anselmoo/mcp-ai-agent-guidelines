/**
 * TOON-backed session manager.
 *
 * Uses TOON as a convenience storage layer for higher-level session context.
 */

import { randomUUID } from "node:crypto";
import type {
	ExecutionProgressRecord,
	SessionStateStore,
} from "../contracts/runtime.js";
import { createOperationalLogger } from "../infrastructure/observability.js";
import {
	ToonMemoryInterface,
	type ToonSessionContext,
} from "../memory/toon-interface.js";
import {
	replaceSessionProgress,
	splitProgressRecords,
} from "../memory/toon-memory-helpers.js";
import { createSessionId } from "./secure-session-store.js";

export interface SessionManagerConfig {
	baseDir?: string;
	enableMetrics?: boolean;
	autoBackup?: boolean;
}

export interface SessionCreationRequest {
	requestScope: string;
	constraints?: string[];
	successCriteria?: string;
	phase?: string;
	priority?: "low" | "medium" | "high" | "critical";
}

export interface SessionProgress {
	sessionId: string;
	phase: string;
	completedTasks: string[];
	inProgressTasks: string[];
	blockedTasks: string[];
	nextTasks: string[];
	insights: string[];
	decisions: Record<string, string>;
	warnings: string[];
}

const sessionManagerLogger = createOperationalLogger("info");

/**
 * Compatibility/demo session manager backed by TOON storage.
 *
 * The MCP server runtime uses `SecureFileSessionStore` as the canonical
 * execution-history store. This manager remains available for tests, demos, and
 * higher-level TOON workflows that want a richer convenience API on top of
 * `ToonMemoryInterface`.
 */
export class SessionManager implements SessionStateStore {
	private toon: ToonMemoryInterface;
	private config: SessionManagerConfig;

	constructor(config: SessionManagerConfig = {}) {
		this.config = config;
		this.toon = new ToonMemoryInterface(config.baseDir);
	}

	/**
	 * Create a new session in TOON storage.
	 */
	async createSession(request: SessionCreationRequest): Promise<string> {
		const sessionId = createSessionId();

		const context: ToonSessionContext = {
			meta: {
				version: "1.0.0",
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				sessionId,
			},
			context: {
				requestScope: request.requestScope,
				constraints: request.constraints || [],
				successCriteria: request.successCriteria,
				phase: request.phase || "bootstrap",
			},
			progress: {
				completed: [],
				inProgress: [],
				blocked: [],
				next: [],
			},
			memory: {
				keyInsights: [],
				decisions: {},
				patterns: [],
				warnings: [],
			},
		};

		await this.toon.saveSessionContext(sessionId, context);

		if (this.config.enableMetrics) {
			await this.recordMetric(sessionId, "session_created", 1);
		}

		return sessionId;
	}

	/**
	 * Get current session progress in structured format
	 */
	async getSessionProgress(sessionId: string): Promise<SessionProgress | null> {
		const context = await this.toon.loadSessionContext(sessionId);
		if (!context) return null;

		return {
			sessionId,
			phase: context.context.phase,
			completedTasks: context.progress.completed,
			inProgressTasks: context.progress.inProgress,
			blockedTasks: context.progress.blocked,
			nextTasks: context.progress.next,
			insights: context.memory.keyInsights,
			decisions: context.memory.decisions,
			warnings: context.memory.warnings,
		};
	}

	/**
	 * Update session phase (bootstrap -> implement -> review -> etc.)
	 */
	async updateSessionPhase(sessionId: string, phase: string): Promise<void> {
		const context = await this.toon.loadSessionContext(sessionId);
		if (!context) {
			throw new Error(`Session not found: ${sessionId}`);
		}

		context.context.phase = phase;
		context.meta.updated = new Date().toISOString();

		await this.toon.saveSessionContext(sessionId, context);

		if (this.config.enableMetrics) {
			await this.recordMetric(sessionId, "phase_transition", 1);
		}
	}

	/**
	 * Add architectural decision to session memory
	 */
	async recordDecision(
		sessionId: string,
		decision: string,
		rationale: string,
	): Promise<void> {
		const context = await this.toon.loadSessionContext(sessionId);
		if (!context) {
			throw new Error(`Session not found: ${sessionId}`);
		}

		const decisionKey = randomUUID();
		context.memory.decisions[decisionKey] = `${decision}: ${rationale}`;
		context.meta.updated = new Date().toISOString();

		await this.toon.saveSessionContext(sessionId, context);
	}

	/**
	 * Mark task as completed and move to next phase
	 */
	async completeTask(sessionId: string, task: string): Promise<void> {
		await this.toon.updateSessionProgress(sessionId, {
			completed: [task],
		});

		if (this.config.enableMetrics) {
			await this.recordMetric(sessionId, "task_completed", 1);
		}
	}

	/**
	 * Start working on a task (move to in-progress)
	 */
	async startTask(sessionId: string, task: string): Promise<void> {
		await this.toon.updateSessionProgress(sessionId, {
			inProgress: [task],
		});
	}

	/**
	 * Block a task with reason
	 */
	async blockTask(
		sessionId: string,
		task: string,
		reason: string,
	): Promise<void> {
		await this.toon.updateSessionProgress(sessionId, {
			blocked: [task],
		});

		await this.toon.addSessionInsight(
			sessionId,
			`Task blocked: ${task} - ${reason}`,
			"warning",
		);
	}

	/**
	 * Add an architectural insight to the session.
	 */
	async addInsight(
		sessionId: string,
		insight: string,
		type: "insight" | "pattern" | "warning" = "insight",
	): Promise<void> {
		await this.toon.addSessionInsight(sessionId, insight, type);
	}

	// ===== SessionStateStore interface (legacy compatibility) =====

	async readSessionHistory(
		sessionId: string,
	): Promise<ExecutionProgressRecord[]> {
		const context = await this.toon.loadSessionContext(sessionId);
		if (!context) return [];

		const records: ExecutionProgressRecord[] = [];

		// Convert TOON context to ExecutionProgressRecord format
		for (const completed of context.progress.completed) {
			records.push({
				stepLabel: completed,
				kind: "completed",
				summary: `✅ Completed: ${completed}`,
			});
		}

		for (const inProgress of context.progress.inProgress) {
			records.push({
				stepLabel: inProgress,
				kind: "in_progress",
				summary: `🔄 In Progress: ${inProgress}`,
			});
		}

		for (const blocked of context.progress.blocked) {
			records.push({
				stepLabel: blocked,
				kind: "blocked",
				summary: `🚫 Blocked: ${blocked}`,
			});
		}

		for (const next of context.progress.next) {
			records.push({
				stepLabel: next,
				kind: "next",
				summary: `⏭️ Next: ${next}`,
			});
		}

		return records;
	}

	async writeSessionHistory(
		sessionId: string,
		records: ExecutionProgressRecord[],
	): Promise<void> {
		const context = await this.toon.loadSessionContext(sessionId);
		const { completed, inProgress, blocked, next } =
			splitProgressRecords(records);

		await this.toon.saveSessionContext(
			sessionId,
			replaceSessionProgress(context, {
				completed,
				inProgress,
				blocked,
				next,
			}),
		);
	}

	async appendSessionHistory(
		sessionId: string,
		record: ExecutionProgressRecord,
	): Promise<void> {
		const updateMap: Record<string, string> = {
			completed: "completed",
			in_progress: "inProgress",
			blocked: "blocked",
			next: "next",
		};

		const field = updateMap[record.kind];
		if (field) {
			await this.toon.updateSessionProgress(sessionId, {
				[field]: [record.stepLabel],
			});
		}
	}

	// ===== TOON-specific advanced methods =====

	/**
	 * Get the TOON memory interface for advanced operations.
	 */
	async getToonInterface(): Promise<ToonMemoryInterface> {
		return this.toon;
	}

	/**
	 * Find sessions by phase or constraint.
	 */
	async findSessions(filter: {
		phase?: string;
		hasConstraint?: string;
		createdAfter?: Date;
	}): Promise<ToonSessionContext[]> {
		const sessionIds = await this.toon.listSessionIds();
		const sessions = await Promise.all(
			sessionIds.map((sessionId) => this.toon.loadSessionContext(sessionId)),
		);

		return sessions.filter((session): session is ToonSessionContext => {
			if (!session) {
				return false;
			}
			if (filter.phase && session.context.phase !== filter.phase) {
				return false;
			}
			if (
				filter.hasConstraint &&
				!session.context.constraints.includes(filter.hasConstraint)
			) {
				return false;
			}
			if (
				filter.createdAfter &&
				new Date(session.meta.created) <= filter.createdAfter
			) {
				return false;
			}
			return true;
		});
	}

	/**
	 * Record performance metrics (if enabled)
	 */
	private async recordMetric(
		sessionId: string,
		metric: string,
		value: number,
	): Promise<void> {
		if (!this.config.enableMetrics) return;

		// Store metric in session memory for later analysis
		await this.toon.addSessionInsight(
			sessionId,
			`Metric: ${metric} = ${value} at ${new Date().toISOString()}`,
			"pattern",
		);
	}

	/**
	 * Backup session to external storage (if enabled).
	 */
	async backupSession(sessionId: string): Promise<void> {
		if (!this.config.autoBackup) return;

		const context = await this.toon.loadSessionContext(sessionId);
		if (!context) return;

		sessionManagerLogger.log(
			"info",
			"Session backup requested but cloud export is not implemented",
			{ sessionId },
		);
	}
}

/**
 * Create a session manager instance.
 */
export function createSessionManager(
	config?: SessionManagerConfig,
): SessionManager {
	return new SessionManager(config);
}

/**
 * Create default session manager for TOON ecosystem
 */
export function createToonSessionManager(): SessionManager {
	return new SessionManager({
		enableMetrics: true,
		autoBackup: false, // Disable until cloud integration ready
	});
}
