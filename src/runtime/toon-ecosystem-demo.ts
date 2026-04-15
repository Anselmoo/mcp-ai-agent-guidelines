/**
 * TOON workflow demonstration.
 *
 * Shows how TOON session storage can support a structured project workflow.
 */

import { nanoid } from "nanoid";
import { ToonMemoryInterface } from "../memory/toon-interface.js";
import {
	createToonSessionManager,
	type SessionManager,
	type SessionProgress,
} from "./session-manager.js";

/**
 * Example TOON-backed development workflow.
 */
export class ToonDevelopmentWorkflow {
	private sessionManager: SessionManager;
	private memoryInterface: ToonMemoryInterface;

	constructor() {
		this.sessionManager = createToonSessionManager();
		this.memoryInterface = new ToonMemoryInterface();
	}

	/**
	 * Phase 1: Bootstrap the project context.
	 */
	async bootstrapProject(projectScope: string): Promise<string> {
		const sessionId = await this.sessionManager.createSession({
			requestScope: projectScope,
			constraints: [
				"Keep architecture decisions explicit",
				"Complete interface contracts",
				"Zero compilation errors",
				"No phantom imports",
				"Proper TypeScript ESM patterns",
			],
			successCriteria: "All components meet the documented interface contract",
			phase: "bootstrap",
		});

		await this.sessionManager.addInsight(
			sessionId,
			"TOON interface provides a concrete reference for session-backed runtime behavior",
			"insight",
		);

		await this.sessionManager.recordDecision(
			sessionId,
			"referenceImplementation",
			"TOON interface serves as a reference for adjacent runtime components",
		);

		return sessionId;
	}

	/**
	 * Phase 2: Design the architecture.
	 */
	async designArchitecture(sessionId: string): Promise<void> {
		await this.sessionManager.updateSessionPhase(sessionId, "design");

		await this.sessionManager.startTask(sessionId, "analyze-toon-patterns");

		await this.sessionManager.addInsight(
			sessionId,
			"TOON demonstrates complete interfaces, explicit error handling, and ESM imports",
			"pattern",
		);

		await this.sessionManager.completeTask(sessionId, "analyze-toon-patterns");

		await this.sessionManager.startTask(sessionId, "design-components");

		await this.sessionManager.recordDecision(
			sessionId,
			"componentStructure",
			"Use interface-first design patterns similar to ToonMemoryInterface where appropriate",
		);

		await this.sessionManager.completeTask(sessionId, "design-components");
	}

	/**
	 * Phase 3: Implement the design.
	 */
	async implementWithToonPatterns(sessionId: string): Promise<void> {
		await this.sessionManager.updateSessionPhase(sessionId, "implement");

		const tasks = [
			"create-interfaces-following-toon-pattern",
			"implement-error-handling-like-toon",
			"add-proper-esm-imports-like-toon",
			"write-tests-like-toon-architecture-contracts",
		];

		for (const task of tasks) {
			await this.sessionManager.startTask(sessionId, task);

			// Simulate implementation work
			await this.simulateWork(task);

			await this.sessionManager.completeTask(sessionId, task);
		}

		await this.sessionManager.recordDecision(
			sessionId,
			"implementationComplete",
			"Implementation aligns with the documented interface and runtime constraints",
		);
	}

	/**
	 * Phase 4: Evaluate quality gates.
	 */
	async evaluateQuality(sessionId: string): Promise<void> {
		await this.sessionManager.updateSessionPhase(sessionId, "evaluate");

		const qualityChecks = [
			"zero-compilation-errors",
			"complete-interface-contracts",
			"no-phantom-imports",
			"proper-typescript-esm",
			"full-implementation-no-todos",
		];

		for (const check of qualityChecks) {
			await this.sessionManager.startTask(sessionId, check);

			// Simulate quality evaluation
			const passed = await this.evaluateQualityCheck(check);

			if (passed) {
				await this.sessionManager.completeTask(sessionId, check);
				await this.sessionManager.addInsight(
					sessionId,
					`✅ ${check} passed the workflow quality checks`,
					"insight",
				);
			} else {
				await this.sessionManager.blockTask(
					sessionId,
					check,
					"Does not meet the workflow quality checks",
				);
			}
		}
	}

	/**
	 * Get comprehensive workflow status
	 */
	async getWorkflowStatus(sessionId: string): Promise<{
		progress: SessionProgress;
		insights: string[];
		decisions: Record<string, string>;
		qualityMetrics: {
			completedTasks: number;
			blockedTasks: number;
			currentPhase: string;
			meetsQualityChecks: boolean;
		};
	}> {
		const progress = await this.sessionManager.getSessionProgress(sessionId);
		if (!progress) throw new Error(`Session not found: ${sessionId}`);

		const qualityMetrics = {
			completedTasks: progress.completedTasks.length,
			blockedTasks: progress.blockedTasks.length,
			currentPhase: progress.phase,
			meetsQualityChecks:
				progress.blockedTasks.length === 0 &&
				progress.completedTasks.includes("zero-compilation-errors"),
		};

		return {
			progress,
			insights: progress.insights,
			decisions: progress.decisions,
			qualityMetrics,
		};
	}

	/**
	 * Store architectural memory for future sessions.
	 */
	async recordArchitecturalMemory(
		insight: string,
		relevance: number = 8,
	): Promise<void> {
		const memoryId = `arch-${nanoid()}`;

		await this.memoryInterface.saveMemoryArtifact({
			meta: {
				id: memoryId,
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				tags: ["architecture", "toon", "quality"],
				relevance,
			},
			content: {
				summary: insight,
				details: "Architectural insight from the TOON-backed workflow",
				context: "TOON-backed development workflow",
				actionable: true,
			},
			links: {
				relatedSessions: [],
				relatedMemories: [],
				sources: ["toon-interface.ts", "workflow-review"],
			},
		});
	}

	private async simulateWork(_task: string): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	private async evaluateQualityCheck(check: string): Promise<boolean> {
		const qualityChecks: Record<string, boolean> = {
			"zero-compilation-errors": true,
			"complete-interface-contracts": true,
			"no-phantom-imports": true,
			"proper-typescript-esm": true,
			"full-implementation-no-todos": true,
		};

		return qualityChecks[check] ?? false;
	}
}

/**
 * Example usage: TOON-backed development cycle.
 */
export async function demonstrateToonWorkflow(): Promise<void> {
	const workflow = new ToonDevelopmentWorkflow();

	console.log("🚀 Starting TOON workflow demo...\n");

	const sessionId = await workflow.bootstrapProject(
		"Demonstrate TOON-backed workflow coordination",
	);
	console.log(`📋 Session created: ${sessionId}`);

	await workflow.designArchitecture(sessionId);
	console.log("🎨 Architecture designed following TOON patterns");

	await workflow.implementWithToonPatterns(sessionId);
	console.log("⚡ Implementation completed");

	await workflow.evaluateQuality(sessionId);
	console.log("✅ Quality evaluation completed");

	const status = await workflow.getWorkflowStatus(sessionId);

	console.log("\n📊 Final Workflow Status:");
	console.log(`Phase: ${status.qualityMetrics.currentPhase}`);
	console.log(`Completed Tasks: ${status.qualityMetrics.completedTasks}`);
	console.log(`Blocked Tasks: ${status.qualityMetrics.blockedTasks}`);
	console.log(
		`Quality checks passed: ${status.qualityMetrics.meetsQualityChecks ? "✅" : "❌"}`,
	);

	console.log("\n💡 Key Insights:");
	status.insights.forEach((insight) => {
		console.log(`  • ${insight}`);
	});

	console.log("\n🏛️ Architectural Decisions:");
	Object.entries(status.decisions).forEach(([key, decision]) => {
		console.log(`  • ${key}: ${decision}`);
	});

	await workflow.recordArchitecturalMemory(
		"TOON interface demonstrates a complete architecture contract for session-backed runtime components",
		10,
	);

	console.log("\n🎯 TOON workflow demo complete!");
}
