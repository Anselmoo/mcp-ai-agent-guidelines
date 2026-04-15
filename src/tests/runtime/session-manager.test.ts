import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";
import { isValidSessionId } from "../../runtime/secure-session-store.js";
import {
	createSessionManager,
	createToonSessionManager,
	SessionManager,
} from "../../runtime/session-manager.js";

describe("runtime/session-manager", () => {
	it("creates sessions, updates phase, and exposes progress snapshots", async () => {
		const baseDir = mkdtempSync(join(tmpdir(), "session-manager-"));
		const manager = new SessionManager({ baseDir, enableMetrics: true });
		const sessionId = await manager.createSession({
			requestScope: "stabilize runtime",
			phase: "bootstrap",
		});

		await manager.updateSessionPhase(sessionId, "implement");
		await manager.completeTask(sessionId, "fix-tests");
		const progress = await manager.getSessionProgress(sessionId);
		const history = await manager.readSessionHistory(sessionId);

		expect(progress?.phase).toBe("implement");
		expect(isValidSessionId(sessionId)).toBe(true);
		expect(progress?.completedTasks).toContain("fix-tests");
		expect(history[0]?.summary).toContain("Completed");
	});

	it("finds sessions by phase and constraint", async () => {
		const baseDir = mkdtempSync(join(tmpdir(), "session-manager-find-"));
		const manager = new SessionManager({ baseDir });
		await manager.createSession({
			requestScope: "stabilize runtime",
			phase: "implement",
			constraints: ["keep tests green"],
		});
		await manager.createSession({
			requestScope: "document APIs",
			phase: "document",
			constraints: ["update examples"],
		});

		const implementSessions = await manager.findSessions({
			phase: "implement",
		});
		const constrainedSessions = await manager.findSessions({
			hasConstraint: "keep tests green",
		});

		expect(implementSessions).toHaveLength(1);
		expect(implementSessions[0]?.context.requestScope).toBe(
			"stabilize runtime",
		);
		expect(constrainedSessions).toHaveLength(1);
		expect(constrainedSessions[0]?.context.phase).toBe("implement");
	});

	it("exposes factory helpers for default manager creation", () => {
		expect(createSessionManager()).toBeInstanceOf(SessionManager);
		expect(createToonSessionManager()).toBeInstanceOf(SessionManager);
	});

	it("keeps next records when appending session history", async () => {
		const baseDir = mkdtempSync(join(tmpdir(), "session-manager-next-"));
		const manager = new SessionManager({ baseDir });
		const sessionId = await manager.createSession({
			requestScope: "stabilize runtime",
			phase: "implement",
		});

		await manager.appendSessionHistory(sessionId, {
			stepLabel: "next-task",
			kind: "next",
			summary: "Plan the next task",
		});

		const history = await manager.readSessionHistory(sessionId);
		expect(history).toEqual([
			expect.objectContaining({
				stepLabel: "next-task",
				kind: "next",
			}),
		]);
	});

	it("records blocked tasks and warning insights", async () => {
		const baseDir = mkdtempSync(join(tmpdir(), "session-manager-block-"));
		const manager = new SessionManager({ baseDir });
		const sessionId = await manager.createSession({
			requestScope: "triage failures",
			phase: "debug",
		});

		await manager.blockTask(sessionId, "fix-timeouts", "waiting on repro");
		const progress = await manager.getSessionProgress(sessionId);

		expect(progress?.blockedTasks).toContain("fix-timeouts");
		expect(progress?.warnings).toContain(
			"Task blocked: fix-timeouts - waiting on repro",
		);
	});

	it("records custom insights", async () => {
		const baseDir = mkdtempSync(join(tmpdir(), "session-manager-insight-"));
		const manager = new SessionManager({ baseDir });
		const sessionId = await manager.createSession({
			requestScope: "document patterns",
			phase: "review",
		});

		await manager.addInsight(sessionId, "Prefer direct contracts", "pattern");
		const toon = await manager.getToonInterface();
		const context = await toon.loadSessionContext(sessionId);

		expect(context?.memory.patterns).toContain("Prefer direct contracts");
	});

	it("writes all record kinds through the legacy history adapter", async () => {
		const baseDir = mkdtempSync(join(tmpdir(), "session-manager-history-"));
		const manager = new SessionManager({ baseDir });
		const sessionId = await manager.createSession({
			requestScope: "sync legacy adapter",
			phase: "implement",
		});

		await manager.writeSessionHistory(sessionId, [
			{ stepLabel: "done", kind: "completed", summary: "done" },
			{ stepLabel: "doing", kind: "in_progress", summary: "doing" },
			{ stepLabel: "stuck", kind: "blocked", summary: "stuck" },
			{ stepLabel: "next-up", kind: "next", summary: "next-up" },
		]);

		const progress = await manager.getSessionProgress(sessionId);
		expect(progress?.completedTasks).toEqual(["done"]);
		expect(progress?.inProgressTasks).toEqual(["doing"]);
		expect(progress?.blockedTasks).toEqual(["stuck"]);
		expect(progress?.nextTasks).toEqual(["next-up"]);
	});

	it("preserves existing session context when rewriting legacy history", async () => {
		const baseDir = mkdtempSync(join(tmpdir(), "session-manager-merge-"));
		const manager = new SessionManager({ baseDir });
		const sessionId = await manager.createSession({
			requestScope: "keep adapter context intact",
			constraints: ["preserve request scope", "preserve memory"],
			successCriteria: "history updates do not reset context",
			phase: "implement",
		});

		await manager.updateSessionPhase(sessionId, "review");
		await manager.addInsight(sessionId, "retain existing insight");
		await manager.recordDecision(
			sessionId,
			"keep-canonical-runtime",
			"compatibility adapters must not drop TOON context",
		);

		const toon = await manager.getToonInterface();
		const beforeWrite = await toon.loadSessionContext(sessionId);

		await manager.writeSessionHistory(sessionId, [
			{ stepLabel: "done", kind: "completed", summary: "done" },
			{ stepLabel: "queued", kind: "next", summary: "queued" },
		]);

		const afterWrite = await toon.loadSessionContext(sessionId);
		expect(afterWrite).toMatchObject({
			context: {
				requestScope: "keep adapter context intact",
				constraints: ["preserve request scope", "preserve memory"],
				successCriteria: "history updates do not reset context",
				phase: "review",
			},
			progress: {
				completed: ["done"],
				inProgress: [],
				blocked: [],
				next: ["queued"],
			},
			memory: {
				keyInsights: ["retain existing insight"],
			},
		});
		expect(Object.values(afterWrite?.memory.decisions ?? {})).toContain(
			"keep-canonical-runtime: compatibility adapters must not drop TOON context",
		);
		expect(afterWrite?.meta.created).toBe(beforeWrite?.meta.created);
	});

	it("preserves existing session context when rewriting legacy history", async () => {
		const baseDir = mkdtempSync(join(tmpdir(), "session-manager-merge-"));
		const manager = new SessionManager({ baseDir });
		const sessionId = await manager.createSession({
			requestScope: "preserve session context",
			phase: "review",
			constraints: ["keep continuity"],
			successCriteria: "history rewrite keeps context",
		});

		await manager.recordDecision(
			sessionId,
			"preserve-session-context",
			"history rewrites should not reset session state",
		);
		await manager.addInsight(sessionId, "Do not drop warnings", "warning");
		await manager.writeSessionHistory(sessionId, [
			{ stepLabel: "done", kind: "completed", summary: "done" },
			{ stepLabel: "next-up", kind: "next", summary: "next-up" },
		]);

		const context = await (await manager.getToonInterface()).loadSessionContext(
			sessionId,
		);
		expect(context).toMatchObject({
			context: {
				requestScope: "preserve session context",
				constraints: ["keep continuity"],
				successCriteria: "history rewrite keeps context",
				phase: "review",
			},
			progress: {
				completed: ["done"],
				inProgress: [],
				blocked: [],
				next: ["next-up"],
			},
			memory: {
				warnings: ["Do not drop warnings"],
			},
		});
		expect(Object.values(context?.memory.decisions ?? {})).toContain(
			"preserve-session-context: history rewrites should not reset session state",
		);
	});

	it("backs up sessions only when auto backup is enabled and context exists", async () => {
		const baseDir = mkdtempSync(join(tmpdir(), "session-manager-backup-"));
		const disabledManager = new SessionManager({ baseDir, autoBackup: false });
		const enabledManager = new SessionManager({ baseDir, autoBackup: true });
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});
		const sessionId = await enabledManager.createSession({
			requestScope: "backup session",
			phase: "review",
		});

		try {
			await disabledManager.backupSession(sessionId);
			await enabledManager.backupSession("session-ABCDEFGHJKMN");
			await enabledManager.backupSession(sessionId);

			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(logSpy).toHaveBeenCalledWith(
				"info",
				"Session backup requested but cloud export is not implemented",
				{ sessionId },
			);
		} finally {
			logSpy.mockRestore();
		}
	});
});
