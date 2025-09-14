// Design Phase Workflow - Orchestrates the structured design process
import { z } from "zod";
import { confirmationModule } from "./confirmation-module.js";
import { constraintManager } from "./constraint-manager.js";
import { pivotModule } from "./pivot-module.js";
import type {
	Artifact,
	DesignPhase,
	DesignSessionConfig,
	DesignSessionState,
	SessionEvent,
} from "./types.js";

const _WorkflowRequestSchema = z.object({
	action: z.enum(["start", "advance", "complete", "reset", "status"]),
	sessionId: z.string(),
	phaseId: z.string().optional(),
	content: z.string().optional(),
	config: z.any().optional(), // DesignSessionConfig for start action
});

export interface WorkflowRequest {
	action: "start" | "advance" | "complete" | "reset" | "status";
	sessionId: string;
	phaseId?: string;
	content?: string;
	config?: DesignSessionConfig;
}

export interface WorkflowResponse {
	success: boolean;
	sessionState: DesignSessionState;
	currentPhase: string;
	nextPhase?: string;
	recommendations: string[];
	artifacts: Artifact[];
	message: string;
}

class DesignPhaseWorkflowImpl {
	private sessions: Map<string, DesignSessionState> = new Map();

	// Standard design phases in sequence
	private readonly PHASE_SEQUENCE = [
		"discovery",
		"requirements",
		"architecture",
		"specification",
		"planning",
	];

	async executeWorkflow(request: WorkflowRequest): Promise<WorkflowResponse> {
		const { action, sessionId } = request;

		switch (action) {
			case "start":
				if (!request.config) {
					throw new Error("Configuration is required for start action");
				}
				return this.startSession(sessionId, request.config);
			case "advance":
				return this.advancePhase(sessionId, request.phaseId, request.content);
			case "complete":
				if (!request.phaseId || !request.content) {
					throw new Error(
						"Phase ID and content are required for complete action",
					);
				}
				return this.completePhase(sessionId, request.phaseId, request.content);
			case "reset":
				return this.resetSession(sessionId);
			case "status":
				return this.getSessionStatus(sessionId);
			default:
				throw new Error(`Unknown workflow action: ${action}`);
		}
	}

	private async startSession(
		sessionId: string,
		config: DesignSessionConfig,
	): Promise<WorkflowResponse> {
		// Initialize phases based on configuration
		const phases: Record<string, DesignPhase> = {};

		for (const phaseId of this.PHASE_SEQUENCE) {
			const phaseReq = constraintManager.getPhaseRequirements(phaseId);

			phases[phaseId] = {
				id: phaseId,
				name: phaseReq?.name || phaseId,
				description: phaseReq?.description || `${phaseId} phase`,
				inputs: [],
				outputs: phaseReq?.required_outputs || [],
				criteria: phaseReq?.criteria || [],
				coverage: 0,
				status: phaseId === this.PHASE_SEQUENCE[0] ? "in-progress" : "pending",
				artifacts: [],
				dependencies: this.getPhaseDepedencies(phaseId),
			};
		}

		const sessionState: DesignSessionState = {
			config,
			currentPhase: this.PHASE_SEQUENCE[0],
			phases,
			coverage: {
				overall: 0,
				phases: {},
				constraints: {},
				assumptions: {},
				documentation: {},
				testCoverage: 0,
			},
			artifacts: [],
			history: [
				{
					timestamp: new Date().toISOString(),
					type: "phase-start",
					phase: this.PHASE_SEQUENCE[0],
					description: "Design session started",
					data: { sessionId, config },
				},
			],
			status: "active",
		};

		this.sessions.set(sessionId, sessionState);

		return {
			success: true,
			sessionState,
			currentPhase: sessionState.currentPhase,
			nextPhase: this.getNextPhase(sessionState.currentPhase),
			recommendations: [
				`Started design session in ${phases[sessionState.currentPhase].name} phase`,
				"Begin by establishing clear context and stakeholder analysis",
				"Ensure all requirements are captured before moving to next phase",
			],
			artifacts: [],
			message: `Design session ${sessionId} started successfully`,
		};
	}

	private async advancePhase(
		sessionId: string,
		targetPhaseId?: string,
		content?: string,
	): Promise<WorkflowResponse> {
		const sessionState = this.sessions.get(sessionId);
		if (!sessionState) {
			throw new Error(`Session ${sessionId} not found`);
		}

		const currentPhase = sessionState.phases[sessionState.currentPhase];
		const nextPhaseId =
			targetPhaseId || this.getNextPhase(sessionState.currentPhase);

		if (!nextPhaseId) {
			return {
				success: false,
				sessionState,
				currentPhase: sessionState.currentPhase,
				recommendations: [
					"All phases completed. Session ready for finalization.",
				],
				artifacts: [],
				message: "No more phases to advance to",
			};
		}

		// Check if current phase can be completed
		if (content) {
			const confirmation = await confirmationModule.confirmPhaseCompletion({
				sessionState,
				phaseId: sessionState.currentPhase,
				content,
				autoAdvance: true,
			});

			if (!confirmation.canProceed) {
				return {
					success: false,
					sessionState,
					currentPhase: sessionState.currentPhase,
					recommendations: confirmation.recommendations,
					artifacts: [],
					message: `Cannot advance: ${confirmation.issues.join(", ")}`,
				};
			}

			// Mark current phase as completed
			currentPhase.status = "completed";
			currentPhase.coverage = confirmation.coverage;
		}

		// Advance to next phase
		const nextPhase = sessionState.phases[nextPhaseId];
		nextPhase.status = "in-progress";
		sessionState.currentPhase = nextPhaseId;

		// Add event to history
		this.addSessionEvent(sessionState, {
			type: "phase-complete",
			phase: currentPhase.id,
			description: `Completed ${currentPhase.name} phase`,
		});

		this.addSessionEvent(sessionState, {
			type: "phase-start",
			phase: nextPhaseId,
			description: `Started ${nextPhase.name} phase`,
		});

		// Check if a pivot is recommended
		const pivotDecision = content
			? await pivotModule.evaluatePivotNeed({
					sessionState,
					currentContent: content,
				})
			: null;

		const recommendations: string[] = [
			`Advanced to ${nextPhase.name} phase`,
			`Focus on: ${nextPhase.criteria.join(", ")}`,
		];

		if (pivotDecision?.triggered) {
			recommendations.push(`⚠️ Pivot recommended: ${pivotDecision.reason}`);
			recommendations.push(...pivotDecision.alternatives.slice(0, 2));
		}

		return {
			success: true,
			sessionState,
			currentPhase: nextPhaseId,
			nextPhase: this.getNextPhase(nextPhaseId),
			recommendations,
			artifacts: [],
			message: `Advanced to ${nextPhase.name} phase`,
		};
	}

	private async completePhase(
		sessionId: string,
		phaseId: string,
		content: string,
	): Promise<WorkflowResponse> {
		const sessionState = this.sessions.get(sessionId);
		if (!sessionState) {
			throw new Error(`Session ${sessionId} not found`);
		}

		const phase = sessionState.phases[phaseId];
		if (!phase) {
			throw new Error(`Phase ${phaseId} not found in session`);
		}

		// Validate phase completion
		const confirmation = await confirmationModule.confirmPhaseCompletion({
			sessionState,
			phaseId,
			content,
			strictMode: true,
		});

		if (!confirmation.passed) {
			return {
				success: false,
				sessionState,
				currentPhase: sessionState.currentPhase,
				recommendations: confirmation.recommendations,
				artifacts: [],
				message: `Phase completion failed: ${confirmation.issues.join(", ")}`,
			};
		}

		// Mark phase as completed
		phase.status = "completed";
		phase.coverage = confirmation.coverage;

		// Update overall coverage
		this.updateSessionCoverage(sessionState, content);

		// Add completion event
		this.addSessionEvent(sessionState, {
			type: "phase-complete",
			phase: phaseId,
			description: `Successfully completed ${phase.name} phase`,
			data: { coverage: confirmation.coverage },
		});

		const recommendations = [
			`✅ ${phase.name} phase completed successfully`,
			`Coverage: ${confirmation.coverage.toFixed(1)}%`,
		];

		// Check if all phases are complete
		const allPhasesComplete = this.PHASE_SEQUENCE.every(
			(id) => sessionState.phases[id].status === "completed",
		);

		if (allPhasesComplete) {
			sessionState.status = "completed";
			recommendations.push(
				"🎉 All design phases completed! Session ready for artifact generation.",
			);
		}

		return {
			success: true,
			sessionState,
			currentPhase: sessionState.currentPhase,
			nextPhase: this.getNextPhase(sessionState.currentPhase),
			recommendations,
			artifacts: phase.artifacts,
			message: `${phase.name} phase completed successfully`,
		};
	}

	private async resetSession(sessionId: string): Promise<WorkflowResponse> {
		const sessionState = this.sessions.get(sessionId);
		if (!sessionState) {
			throw new Error(`Session ${sessionId} not found`);
		}

		// Reset all phases to initial state
		for (const phaseId of this.PHASE_SEQUENCE) {
			const phase = sessionState.phases[phaseId];
			phase.status =
				phaseId === this.PHASE_SEQUENCE[0] ? "in-progress" : "pending";
			phase.coverage = 0;
			phase.artifacts = [];
		}

		sessionState.currentPhase = this.PHASE_SEQUENCE[0];
		sessionState.status = "active";
		sessionState.artifacts = [];

		this.addSessionEvent(sessionState, {
			type: "phase-start",
			description: "Session reset to initial state",
		});

		return {
			success: true,
			sessionState,
			currentPhase: sessionState.currentPhase,
			nextPhase: this.getNextPhase(sessionState.currentPhase),
			recommendations: [
				"Session reset successfully",
				"Starting from discovery phase",
			],
			artifacts: [],
			message: "Session reset to initial state",
		};
	}

	private async getSessionStatus(sessionId: string): Promise<WorkflowResponse> {
		const sessionState = this.sessions.get(sessionId);
		if (!sessionState) {
			throw new Error(`Session ${sessionId} not found`);
		}

		const completedPhases = Object.values(sessionState.phases).filter(
			(p) => p.status === "completed",
		).length;
		const totalPhases = this.PHASE_SEQUENCE.length;

		const recommendations = [
			`Session progress: ${completedPhases}/${totalPhases} phases completed`,
			`Current phase: ${sessionState.phases[sessionState.currentPhase].name}`,
			`Overall coverage: ${sessionState.coverage.overall.toFixed(1)}%`,
		];

		if (sessionState.status === "completed") {
			recommendations.push("🎉 Session completed successfully!");
		}

		return {
			success: true,
			sessionState,
			currentPhase: sessionState.currentPhase,
			nextPhase: this.getNextPhase(sessionState.currentPhase),
			recommendations,
			artifacts: sessionState.artifacts,
			message: `Session status: ${sessionState.status}`,
		};
	}

	private getNextPhase(currentPhaseId: string): string | undefined {
		const currentIndex = this.PHASE_SEQUENCE.indexOf(currentPhaseId);
		return currentIndex >= 0 && currentIndex < this.PHASE_SEQUENCE.length - 1
			? this.PHASE_SEQUENCE[currentIndex + 1]
			: undefined;
	}

	private getPhaseDepedencies(phaseId: string): string[] {
		const index = this.PHASE_SEQUENCE.indexOf(phaseId);
		return index > 0 ? [this.PHASE_SEQUENCE[index - 1]] : [];
	}

	private updateSessionCoverage(
		sessionState: DesignSessionState,
		content: string,
	): void {
		const coverageReport = constraintManager.generateCoverageReport(
			sessionState.config,
			content,
		);

		sessionState.coverage = {
			overall: coverageReport.overall,
			phases: coverageReport.phases,
			constraints: coverageReport.constraints,
			assumptions: {},
			documentation: {},
			testCoverage: 0,
		};

		this.addSessionEvent(sessionState, {
			type: "coverage-update",
			description: `Coverage updated: ${coverageReport.overall.toFixed(1)}%`,
			data: { coverage: coverageReport.overall },
		});
	}

	private addSessionEvent(
		sessionState: DesignSessionState,
		event: Omit<SessionEvent, "timestamp">,
	): void {
		sessionState.history.push({
			timestamp: new Date().toISOString(),
			...event,
		});
	}

	// Utility methods for external access
	getSession(sessionId: string): DesignSessionState | undefined {
		return this.sessions.get(sessionId);
	}

	listSessions(): string[] {
		return Array.from(this.sessions.keys());
	}

	getPhaseSequence(): string[] {
		return [...this.PHASE_SEQUENCE];
	}
}

// Export singleton instance
export const designPhaseWorkflow = new DesignPhaseWorkflowImpl();
