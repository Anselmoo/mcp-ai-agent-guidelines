/**
 * Session Manager Tests
 * 100% coverage of pure domain session management logic
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
	clearAllSessions,
	createSession,
	deleteSession,
	getCurrentPhase,
	getSession,
	getSessionHistory,
	listSessions,
	updateSessionContext,
	updateSessionPhase,
} from "../../../../src/domain/design/session-manager.js";
import type {
	PhaseId,
	SessionContext,
} from "../../../../src/domain/design/types.js";

describe("Session Manager - Domain Logic", () => {
	beforeEach(() => {
		// Clear all sessions before each test
		clearAllSessions();
	});

	describe("createSession", () => {
		it("should create a new session with minimal data", () => {
			const context: SessionContext = {
				goal: "Build authentication system",
			};

			const session = createSession("session-1", context);

			expect(session).toBeDefined();
			expect(session.id).toBe("session-1");
			expect(session.phase).toBe("discovery");
			expect(session.currentPhase).toBe("discovery");
			expect(session.context).toEqual(context);
			expect(session.history).toEqual([]);
			expect(session.status).toBe("active");
		});

		it("should create a session with full configuration", () => {
			const context: SessionContext = {
				goal: "Build system",
				requirements: ["OAuth", "JWT"],
			};

			const config = {
				sessionId: "session-2",
				context,
				goal: "Auth system",
			};

			const session = createSession("session-2", context, config);

			expect(session.id).toBe("session-2");
			expect(session.config).toEqual(config);
			expect(session.context).toEqual(context);
		});

		it("should store session for later retrieval", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-3", context);

			const retrieved = getSession("session-3");
			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe("session-3");
		});
	});

	describe("getSession", () => {
		it("should return session if it exists", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			const session = getSession("session-1");

			expect(session).toBeDefined();
			expect(session?.id).toBe("session-1");
		});

		it("should return undefined for non-existent session", () => {
			const session = getSession("non-existent");

			expect(session).toBeUndefined();
		});
	});

	describe("updateSessionPhase", () => {
		it("should update phase and record transition", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			const updated = updateSessionPhase("session-1", "requirements");

			expect(updated.phase).toBe("requirements");
			expect(updated.currentPhase).toBe("requirements");
			expect(updated.history.length).toBe(1);
			expect(updated.history[0].from).toBe("discovery");
			expect(updated.history[0].to).toBe("requirements");
			expect(updated.history[0].type).toBe("phase-advance");
		});

		it("should include custom content in transition", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			const updated = updateSessionPhase(
				"session-1",
				"requirements",
				"Discovery phase complete",
			);

			expect(updated.history[0].description).toBe("Discovery phase complete");
		});

		it("should generate default description if no content provided", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			const updated = updateSessionPhase("session-1", "requirements");

			expect(updated.history[0].description).toContain("discovery");
			expect(updated.history[0].description).toContain("requirements");
		});

		it("should include timestamp in transition", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			const before = new Date().toISOString();
			const updated = updateSessionPhase("session-1", "requirements");
			const after = new Date().toISOString();

			expect(updated.history[0].timestamp).toBeDefined();
			expect(updated.history[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			// Timestamp should be between before and after
			expect(updated.history[0].timestamp! >= before).toBe(true);
			expect(updated.history[0].timestamp! <= after).toBe(true);
		});

		it("should throw error for non-existent session", () => {
			expect(() => updateSessionPhase("non-existent", "requirements")).toThrow(
				"Session not found: non-existent",
			);
		});

		it("should support multiple phase transitions", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			updateSessionPhase("session-1", "requirements");
			updateSessionPhase("session-1", "planning");
			const final = updateSessionPhase("session-1", "architecture");

			expect(final.phase).toBe("architecture");
			expect(final.history.length).toBe(3);
			expect(final.history[0].from).toBe("discovery");
			expect(final.history[1].from).toBe("requirements");
			expect(final.history[2].from).toBe("planning");
		});
	});

	describe("updateSessionContext", () => {
		it("should merge new context data", () => {
			const context: SessionContext = { goal: "Test", version: "1.0" };
			createSession("session-1", context);

			const updated = updateSessionContext("session-1", {
				stakeholders: ["team-a", "team-b"],
			});

			expect(updated.context.goal).toBe("Test");
			expect(updated.context.version).toBe("1.0");
			expect(updated.context.stakeholders).toEqual(["team-a", "team-b"]);
		});

		it("should overwrite existing context keys", () => {
			const context: SessionContext = { goal: "Original" };
			createSession("session-1", context);

			const updated = updateSessionContext("session-1", { goal: "Updated" });

			expect(updated.context.goal).toBe("Updated");
		});

		it("should throw error for non-existent session", () => {
			expect(() =>
				updateSessionContext("non-existent", { goal: "Test" }),
			).toThrow("Session not found: non-existent");
		});

		it("should handle empty updates", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			const updated = updateSessionContext("session-1", {});

			expect(updated.context).toEqual(context);
		});
	});

	describe("deleteSession", () => {
		it("should delete existing session and return true", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			const deleted = deleteSession("session-1");

			expect(deleted).toBe(true);
			expect(getSession("session-1")).toBeUndefined();
		});

		it("should return false for non-existent session", () => {
			const deleted = deleteSession("non-existent");

			expect(deleted).toBe(false);
		});

		it("should not affect other sessions", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);
			createSession("session-2", context);

			deleteSession("session-1");

			expect(getSession("session-1")).toBeUndefined();
			expect(getSession("session-2")).toBeDefined();
		});
	});

	describe("listSessions", () => {
		it("should return empty array when no sessions exist", () => {
			const sessions = listSessions();

			expect(sessions).toEqual([]);
		});

		it("should return all session IDs", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);
			createSession("session-2", context);
			createSession("session-3", context);

			const sessions = listSessions();

			expect(sessions).toHaveLength(3);
			expect(sessions).toContain("session-1");
			expect(sessions).toContain("session-2");
			expect(sessions).toContain("session-3");
		});

		it("should update list after session deletion", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);
			createSession("session-2", context);

			deleteSession("session-1");
			const sessions = listSessions();

			expect(sessions).toHaveLength(1);
			expect(sessions).toContain("session-2");
			expect(sessions).not.toContain("session-1");
		});
	});

	describe("clearAllSessions", () => {
		it("should remove all sessions", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);
			createSession("session-2", context);
			createSession("session-3", context);

			clearAllSessions();

			expect(listSessions()).toEqual([]);
			expect(getSession("session-1")).toBeUndefined();
			expect(getSession("session-2")).toBeUndefined();
			expect(getSession("session-3")).toBeUndefined();
		});

		it("should handle clearing when no sessions exist", () => {
			clearAllSessions();

			expect(listSessions()).toEqual([]);
		});
	});

	describe("getCurrentPhase", () => {
		it("should return current phase for existing session", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			const phase = getCurrentPhase("session-1");

			expect(phase).toBe("discovery");
		});

		it("should return updated phase after transition", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);
			updateSessionPhase("session-1", "requirements");

			const phase = getCurrentPhase("session-1");

			expect(phase).toBe("requirements");
		});

		it("should return undefined for non-existent session", () => {
			const phase = getCurrentPhase("non-existent");

			expect(phase).toBeUndefined();
		});
	});

	describe("getSessionHistory", () => {
		it("should return empty array for new session", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			const history = getSessionHistory("session-1");

			expect(history).toEqual([]);
		});

		it("should return all transitions", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);
			updateSessionPhase("session-1", "requirements");
			updateSessionPhase("session-1", "planning");

			const history = getSessionHistory("session-1");

			expect(history).toHaveLength(2);
			expect(history[0].to).toBe("requirements");
			expect(history[1].to).toBe("planning");
		});

		it("should return empty array for non-existent session", () => {
			const history = getSessionHistory("non-existent");

			expect(history).toEqual([]);
		});

		it("should preserve transition order", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			const phases: PhaseId[] = [
				"requirements",
				"planning",
				"specification",
				"architecture",
			];
			for (const phase of phases) {
				updateSessionPhase("session-1", phase);
			}

			const history = getSessionHistory("session-1");

			expect(history).toHaveLength(4);
			for (let i = 0; i < phases.length; i++) {
				expect(history[i].to).toBe(phases[i]);
			}
		});
	});

	describe("Edge Cases", () => {
		it("should handle session with complex context structure", () => {
			const context: SessionContext = {
				goal: "Test",
				nested: {
					data: {
						value: 123,
						array: [1, 2, 3],
					},
				},
				metadata: {
					tags: ["tag1", "tag2"],
				},
			};

			const session = createSession("session-1", context);

			expect(session.context).toEqual(context);
		});

		it("should maintain session state across operations", () => {
			const context: SessionContext = { goal: "Test" };
			const session1 = createSession("session-1", context);

			const session2 = getSession("session-1");
			expect(session2).toBe(session1); // Same object reference

			updateSessionPhase("session-1", "requirements");
			const session3 = getSession("session-1");
			expect(session3).toBe(session1); // Still same object
		});

		it("should handle rapid phase transitions", () => {
			const context: SessionContext = { goal: "Test" };
			createSession("session-1", context);

			// Rapid transitions
			for (let i = 0; i < 10; i++) {
				updateSessionPhase("session-1", "requirements");
				updateSessionPhase("session-1", "discovery");
			}

			const session = getSession("session-1");
			expect(session?.history.length).toBe(20);
		});
	});
});
