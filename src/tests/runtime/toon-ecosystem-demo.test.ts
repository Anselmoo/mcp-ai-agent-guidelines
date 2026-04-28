import { mkdtempSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToonMemoryInterface } from "../../memory/toon-interface.js";
import { SessionManager } from "../../runtime/session-manager.js";
import {
	demonstrateToonWorkflow,
	ToonDevelopmentWorkflow,
} from "../../runtime/toon-ecosystem-demo.js";

type WorkflowHarness = {
	sessionManager: SessionManager;
	memoryInterface: ToonMemoryInterface;
	bootstrapProject: (scope: string) => Promise<string>;
	designArchitecture: (sessionId: string) => Promise<void>;
	implementWithToonPatterns: (sessionId: string) => Promise<void>;
	evaluateQuality: (sessionId: string) => Promise<void>;
	getWorkflowStatus: (sessionId: string) => Promise<{
		progress: {
			completedTasks: string[];
			blockedTasks: string[];
			warnings: string[];
		};
		decisions: Record<string, string>;
		qualityMetrics: {
			completedTasks: number;
			blockedTasks: number;
			currentPhase: string;
			meetsQualityChecks: boolean;
		};
	}>;
	recordArchitecturalMemory: (
		insight: string,
		relevance?: number,
	) => Promise<void>;
	evaluateQualityCheck: (check: string) => Promise<boolean>;
};

describe("runtime/toon-ecosystem-demo", () => {
	let baseDir: string;

	beforeEach(() => {
		baseDir = mkdtempSync(join(tmpdir(), "toon-demo-"));
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await rm(baseDir, {
			recursive: true,
			force: true,
			maxRetries: 5,
			retryDelay: 50,
		});
	});

	function createWorkflow(): WorkflowHarness {
		const workflow =
			new ToonDevelopmentWorkflow() as unknown as WorkflowHarness;
		workflow.sessionManager = new SessionManager({
			baseDir,
			enableMetrics: false,
		});
		workflow.memoryInterface = new ToonMemoryInterface(baseDir);
		return workflow;
	}

	it("completes implementation tasks and records the implementation decision", async () => {
		const workflow = createWorkflow();
		const sessionId = await workflow.bootstrapProject(
			"elevate runtime quality",
		);

		await workflow.implementWithToonPatterns(sessionId);
		const status = await workflow.getWorkflowStatus(sessionId);

		expect(status.progress.completedTasks).toEqual(
			expect.arrayContaining([
				"create-interfaces-following-toon-pattern",
				"implement-error-handling-like-toon",
				"add-proper-esm-imports-like-toon",
				"write-tests-like-toon-architecture-contracts",
			]),
		);
		expect(Object.values(status.decisions)).toContain(
			"implementationComplete: Implementation aligns with the documented interface and runtime constraints",
		);
	});

	it("reports blocked quality checks when evaluation fails", async () => {
		const workflow = createWorkflow();
		const sessionId = await workflow.bootstrapProject("gate quality failures");
		vi.spyOn(workflow, "evaluateQualityCheck").mockImplementation(
			async (check: string) => check !== "proper-typescript-esm",
		);

		await workflow.evaluateQuality(sessionId);
		const status = await workflow.getWorkflowStatus(sessionId);

		expect(status.progress.blockedTasks).toContain("proper-typescript-esm");
		expect(status.progress.warnings).toContain(
			"Task blocked: proper-typescript-esm - Does not meet the workflow quality checks",
		);
		expect(status.qualityMetrics).toMatchObject({
			currentPhase: "evaluate",
			blockedTasks: 1,
			meetsQualityChecks: false,
		});
	});

	it("returns success metrics and rejects unknown workflow sessions", async () => {
		const workflow = createWorkflow();
		const sessionId = await workflow.bootstrapProject("ship TOON workflow");

		await workflow.designArchitecture(sessionId);
		await workflow.implementWithToonPatterns(sessionId);
		await workflow.evaluateQuality(sessionId);

		await expect(workflow.getWorkflowStatus("missing-session")).rejects.toThrow(
			"Session not found: missing-session",
		);

		const status = await workflow.getWorkflowStatus(sessionId);
		expect(status.qualityMetrics).toMatchObject({
			currentPhase: "evaluate",
			blockedTasks: 0,
			meetsQualityChecks: true,
		});
		expect(status.qualityMetrics.completedTasks).toBeGreaterThanOrEqual(9);
	});

	it("persists architectural memory artifacts for later retrieval", async () => {
		const workflow = createWorkflow();

		await workflow.recordArchitecturalMemory(
			"TOON keeps workflow memory actionable",
			0.9,
		);

		const persistedMemory = new ToonMemoryInterface(baseDir);
		const artifacts = await persistedMemory.findMemoryArtifacts({
			tags: ["architecture"],
			minRelevance: 0.9,
		});

		expect(artifacts).toHaveLength(1);
		expect(artifacts[0]).toMatchObject({
			meta: {
				relevance: 0.9,
				tags: expect.arrayContaining(["architecture", "toon", "quality"]),
			},
			content: {
				summary: "TOON keeps workflow memory actionable",
				details: "Architectural insight from the TOON-backed workflow",
				context: "TOON-backed development workflow",
				actionable: true,
			},
			links: {
				sources: ["toon-interface.ts", "workflow-review"],
			},
		});
		expect(artifacts[0]?.meta.id).toMatch(/^arch-/);
	});

	it("logs the happy-path TOON demo summary", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(
			ToonDevelopmentWorkflow.prototype,
			"bootstrapProject",
		).mockResolvedValue("session-123");
		vi.spyOn(
			ToonDevelopmentWorkflow.prototype,
			"designArchitecture",
		).mockResolvedValue();
		vi.spyOn(
			ToonDevelopmentWorkflow.prototype,
			"implementWithToonPatterns",
		).mockResolvedValue();
		vi.spyOn(
			ToonDevelopmentWorkflow.prototype,
			"evaluateQuality",
		).mockResolvedValue();
		vi.spyOn(
			ToonDevelopmentWorkflow.prototype,
			"getWorkflowStatus",
		).mockResolvedValue({
			progress: {
				sessionId: "session-123",
				phase: "evaluate",
				completedTasks: ["bootstrap", "implement"],
				inProgressTasks: [],
				blockedTasks: [],
				nextTasks: [],
				insights: ["TOON contracts stayed explicit"],
				decisions: {
					implementationComplete: "implementationComplete: done",
				},
				warnings: [],
			},
			insights: ["TOON contracts stayed explicit"],
			decisions: {
				implementationComplete: "implementationComplete: done",
			},
			qualityMetrics: {
				completedTasks: 2,
				blockedTasks: 0,
				currentPhase: "evaluate",
				meetsQualityChecks: true,
			},
		});
		const recordArchitecturalMemorySpy = vi
			.spyOn(ToonDevelopmentWorkflow.prototype, "recordArchitecturalMemory")
			.mockResolvedValue();

		await demonstrateToonWorkflow();

		expect(recordArchitecturalMemorySpy).toHaveBeenCalledWith(
			"TOON interface demonstrates a complete architecture contract for session-backed runtime components",
			10,
		);
		expect(logSpy.mock.calls.map(([message]) => message)).toEqual(
			expect.arrayContaining([
				"🚀 Starting TOON workflow demo...\n",
				"📋 Session created: session-123",
				"🎨 Architecture designed following TOON patterns",
				"⚡ Implementation completed",
				"✅ Quality evaluation completed",
				"\n📊 Final Workflow Status:",
				"Phase: evaluate",
				"Completed Tasks: 2",
				"Blocked Tasks: 0",
				"Quality checks passed: ✅",
				"\n💡 Key Insights:",
				"  • TOON contracts stayed explicit",
				"\n🏛️ Architectural Decisions:",
				"  • implementationComplete: implementationComplete: done",
				"\n🎯 TOON workflow demo complete!",
			]),
		);
	});
});
