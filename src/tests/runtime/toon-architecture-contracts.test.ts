/**
 * TOON architecture contracts test suite.
 *
 * Validates TOON session storage and persistence behavior.
 */

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { nanoid } from "nanoid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	ToonMemoryInterface,
	type ToonSessionContext,
} from "../../memory/toon-interface.js";
import { SessionManager } from "../../runtime/session-manager.js";

describe("TOON Architecture Contracts", () => {
	let toonInterface: ToonMemoryInterface;
	let sessionManager: SessionManager;
	let testDir: string;

	beforeEach(async () => {
		testDir = await mkdtemp(join(tmpdir(), `toon-${nanoid()}-`));
		toonInterface = new ToonMemoryInterface(testDir);
		sessionManager = new SessionManager({ baseDir: testDir });
	});

	afterEach(async () => {
		try {
			await rm(testDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	describe("TOON Session Context Structure", () => {
		it("should load TOON sessions with proper typing", async () => {
			const sessionId = "session-ABCDEFGHJKMN";
			const context: Partial<ToonSessionContext> = {
				context: {
					requestScope: "Test architectural decision making",
					constraints: ["must keep contracts explicit"],
					phase: "design",
				},
				progress: {
					completed: ["requirements gathered"],
					inProgress: ["architecture design"],
					blocked: [],
					next: ["implementation"],
				},
				memory: {
					keyInsights: ["TOON provides the reference session contract"],
					decisions: {},
					patterns: ["interface-first design"],
					warnings: [],
				},
			};

			await toonInterface.saveSessionContext(sessionId, context);
			const loaded = await toonInterface.loadSessionContext(sessionId);

			expect(loaded).toBeTruthy();
			expect(loaded?.context.requestScope).toBe(
				"Test architectural decision making",
			);
			expect(loaded?.progress.completed).toEqual(["requirements gathered"]);
			expect(loaded?.memory.keyInsights).toContain(
				"TOON provides the reference session contract",
			);
			expect(loaded?.meta.version).toBe("1.0.0");
			expect(loaded?.meta.sessionId).toBe(sessionId);
		});

		it("should preserve architectural decisions across sessions", async () => {
			const sessionId = await sessionManager.createSession({
				requestScope: "Test decisions",
			});

			await sessionManager.recordDecision(
				sessionId,
				"modelOrchestration",
				"free-first-then-strong: Saturate free tier before using paid models",
			);

			const session = await toonInterface.loadSessionContext(sessionId);
			expect(session).toBeTruthy();
			if (!session) {
				throw new Error("Expected session context to exist");
			}

			const decisions = Object.values(session.memory.decisions);
			expect(decisions.some((d) => d.includes("modelOrchestration"))).toBe(
				true,
			);
			expect(decisions.some((d) => d.includes("free-first-then-strong"))).toBe(
				true,
			);
		});
	});

	describe("TOON runtime integrity", () => {
		it("should demonstrate proper dependency management", async () => {
			const toonInterface = new ToonMemoryInterface();

			expect(toonInterface).toBeTruthy();

			await sessionManager.createSession({
				requestScope: "Test interface access",
			});

			const toonMemoryInterface = await sessionManager.getToonInterface();
			expect(toonMemoryInterface).toBeTruthy();
		});
	});
});
