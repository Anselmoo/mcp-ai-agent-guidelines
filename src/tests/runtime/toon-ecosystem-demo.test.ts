import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ToonMemoryInterface } from "../../memory/toon-interface.js";
import { SessionManager } from "../../runtime/session-manager.js";
import { ToonDevelopmentWorkflow } from "../../runtime/toon-ecosystem-demo.js";

describe("runtime/toon-ecosystem-demo", () => {
	it("tracks a TOON-first workflow from bootstrap through quality evaluation", async () => {
		const baseDir = mkdtempSync(join(tmpdir(), "toon-demo-"));
		const workflow = new ToonDevelopmentWorkflow() as unknown as {
			sessionManager: SessionManager;
			memoryInterface: ToonMemoryInterface;
			bootstrapProject: (scope: string) => Promise<string>;
			designArchitecture: (sessionId: string) => Promise<void>;
			evaluateQuality: (sessionId: string) => Promise<void>;
			getWorkflowStatus: (sessionId: string) => Promise<{
				qualityMetrics: {
					currentPhase: string;
					completedTasks: number;
					blockedTasks: number;
				};
			}>;
		};
		workflow.sessionManager = new SessionManager({
			baseDir,
			enableMetrics: false,
		});
		workflow.memoryInterface = new ToonMemoryInterface(baseDir);

		const sessionId = await workflow.bootstrapProject(
			"elevate runtime quality",
		);
		await workflow.designArchitecture(sessionId);
		await workflow.evaluateQuality(sessionId);
		const status = await workflow.getWorkflowStatus(sessionId);

		expect(status.qualityMetrics.currentPhase).toBe("evaluate");
		expect(status.qualityMetrics.completedTasks).toBeGreaterThan(0);
		expect(status.qualityMetrics.blockedTasks).toBe(0);
	});
});
