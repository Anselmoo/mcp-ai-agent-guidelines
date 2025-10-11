// Design Phase Workflow - Orchestrates the structured design process
import { z } from "zod";
import {
	ConfigurationError,
	PhaseError,
	SessionError,
} from "../shared/errors.js";
import { confirmationModule } from "./confirmation-module.js";
import { constraintManager } from "./constraint-manager.js";
import { pivotModule } from "./pivot-module.js";
import type {
	Artifact,
	DesignPhase,
	DesignSessionConfig,
	DesignSessionState,
	MethodologyProfile,
	MethodologySignals,
	SessionEvent,
} from "./types/index.js";

const _WorkflowRequestSchema = z.object({
	action: z.enum(["start", "advance", "complete", "reset", "status"]),
	sessionId: z.string(),
	phaseId: z.string().optional(),
	content: z.string().optional(),
	config: z.any().optional(), // DesignSessionConfig for start action
	methodologyProfile: z.any().optional(), // MethodologyProfile for methodology-driven sessions
});

export interface WorkflowRequest {
	action: "start" | "advance" | "complete" | "reset" | "status";
	sessionId: string;
	phaseId?: string;
	content?: string;
	config?: DesignSessionConfig;
	methodologyProfile?: MethodologyProfile;
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

	async initialize(): Promise<void> {
		// No-op initializer for test compatibility
	}

	async executeWorkflow(request: WorkflowRequest): Promise<WorkflowResponse> {
		const { action, sessionId } = request;

		switch (action) {
			case "start":
				if (!request.config) {
					throw new ConfigurationError(
						"Configuration is required for start action",
						{ sessionId, action },
					);
				}
				return this.startSession(
					sessionId,
					request.config,
					request.methodologyProfile,
				);
			case "advance":
				return this.advancePhase(sessionId, request.phaseId, request.content);
			case "complete":
				if (!request.phaseId || !request.content) {
					throw new ConfigurationError(
						"Phase ID and content are required for complete action",
						{ sessionId, action },
					);
				}
				return this.completePhase(sessionId, request.phaseId, request.content);
			case "reset":
				return this.resetSession(sessionId);
			case "status":
				return this.getSessionStatus(sessionId);
			default:
				throw new ConfigurationError(`Unknown workflow action: ${action}`, {
					action,
					sessionId,
				});
		}
	}

	private async startSession(
		sessionId: string,
		config: DesignSessionConfig,
		methodologyProfile?: MethodologyProfile,
	): Promise<WorkflowResponse> {
		// Determine phase sequence: use methodology-specific phases if available, otherwise default
		const phaseSequence =
			methodologyProfile?.methodology.phases ||
			(config.metadata?.customPhaseSequence as string[]) ||
			this.PHASE_SEQUENCE;

		// Initialize phases based on methodology profile or default configuration
		const phases: Record<string, DesignPhase> = {};

		for (const phaseId of phaseSequence) {
			// Use methodology profile phase mapping if available
			if (methodologyProfile?.phaseMapping[phaseId]) {
				phases[phaseId] = {
					...methodologyProfile.phaseMapping[phaseId],
					status: phaseId === phaseSequence[0] ? "in-progress" : "pending",
					coverage: 0,
					artifacts: [],
				};
			} else {
				// Fallback to constraint manager or default phase
				const phaseReq = constraintManager.getPhaseRequirements(phaseId);
				phases[phaseId] = {
					id: phaseId,
					name: phaseReq?.name || phaseId,
					description: phaseReq?.description || `${phaseId} phase`,
					inputs: [],
					outputs: phaseReq?.required_outputs || [],
					criteria: phaseReq?.criteria || [],
					coverage: 0,
					status: phaseId === phaseSequence[0] ? "in-progress" : "pending",
					artifacts: [],
					dependencies: this.getPhaseDepedencies(phaseId),
				};
			}
		}

		const sessionState: DesignSessionState = {
			config,
			currentPhase: phaseSequence[0],
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
					type: methodologyProfile ? "methodology-selected" : "phase-start",
					phase: phaseSequence[0],
					description: methodologyProfile
						? `Design session started with ${methodologyProfile.methodology.name} methodology`
						: "Design session started",
					data: {
						sessionId,
						config,
						methodology: methodologyProfile?.methodology.id,
					},
				},
			],
			status: "active",
			// Add methodology information to session state
			methodologySelection: methodologyProfile
				? {
						selected: methodologyProfile.methodology,
						alternatives: [],
						signals: config.methodologySignals || ({} as MethodologySignals),
						timestamp: new Date().toISOString(),
						selectionRationale: `Using ${methodologyProfile.methodology.name} methodology`,
					}
				: undefined,
			methodologyProfile,
		};

		this.sessions.set(sessionId, sessionState);

		return {
			success: true,
			sessionState,
			currentPhase: sessionState.currentPhase,
			nextPhase: this.computeNextPhase(sessionState.currentPhase, sessionState),
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
			throw new SessionError(`Session ${sessionId} not found`, { sessionId });
		}

		const currentPhase = sessionState.phases[sessionState.currentPhase];
		const nextPhaseId =
			targetPhaseId ||
			this.computeNextPhase(sessionState.currentPhase, sessionState);

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
			nextPhase: this.computeNextPhase(nextPhaseId, sessionState),
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
			throw new SessionError(`Session ${sessionId} not found`, { sessionId });
		}

		const phase = sessionState.phases[phaseId];
		if (!phase) {
			throw new PhaseError(`Phase ${phaseId} not found in session`, {
				sessionId,
				phaseId,
			});
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
			nextPhase: this.computeNextPhase(sessionState.currentPhase, sessionState),
			recommendations,
			artifacts: phase.artifacts,
			message: `${phase.name} phase completed successfully`,
		};
	}

	private async resetSession(sessionId: string): Promise<WorkflowResponse> {
		const sessionState = this.sessions.get(sessionId);
		if (!sessionState) {
			throw new SessionError(`Session ${sessionId} not found`, { sessionId });
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
			nextPhase: this.computeNextPhase(sessionState.currentPhase, sessionState),
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
			throw new SessionError(`Session ${sessionId} not found`, { sessionId });
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
			nextPhase: this.computeNextPhase(sessionState.currentPhase, sessionState),
			recommendations,
			artifacts: sessionState.artifacts,
			message: `Session status: ${sessionState.status}`,
		};
	}

	private computeNextPhase(
		currentPhaseId: string,
		sessionState?: DesignSessionState,
	): string | undefined {
		// Determine phase sequence: from sessionState phases, methodology selection, or default
		let phaseSequence: string[];
		if (sessionState?.phases && Object.keys(sessionState.phases).length > 0) {
			phaseSequence = Object.keys(sessionState.phases);
		} else {
			// Safe extraction of methodologySelection phases when present
			const maybeMethodology = sessionState as unknown as {
				methodologySelection?: { phases?: unknown };
			};
			const phasesCandidate = maybeMethodology.methodologySelection?.phases;
			if (phasesCandidate && Array.isArray(phasesCandidate)) {
				phaseSequence = (phasesCandidate as string[]).slice();
			} else {
				phaseSequence = this.PHASE_SEQUENCE;
			}
		}

		const effectiveCurrent = currentPhaseId || phaseSequence[0];
		const currentIndex = phaseSequence.indexOf(effectiveCurrent);
		return currentIndex >= 0 && currentIndex < phaseSequence.length - 1
			? phaseSequence[currentIndex + 1]
			: undefined;
	}

	// Public convenience for tests: accepts sessionState only
	getNextPhase(sessionState: DesignSessionState): string | undefined {
		return this.computeNextPhase(sessionState.currentPhase, sessionState);
	}

	private getPhaseDepedencies(
		phaseId: string,
		phaseSequence?: string[],
	): string[] {
		const sequence = phaseSequence || this.PHASE_SEQUENCE;
		const index = sequence.indexOf(phaseId);
		return index > 0 ? [sequence[index - 1]] : [];
	}

	async generateWorkflowGuide(
		sessionState: DesignSessionState,
	): Promise<{ currentPhase: string; nextPhase?: string; steps: string[] }> {
		const current = sessionState.currentPhase;
		const next = this.computeNextPhase(current, sessionState);
		const steps = [
			`Complete ${current} phase criteria`,
			next ? `Prepare for ${next} phase` : "Finalize artifacts",
		];
		return { currentPhase: current, nextPhase: next, steps };
	}

	// Backwards-compatible helpers expected by tests
	async canTransitionToPhase(
		sessionState: DesignSessionState,
		targetPhaseId: string,
	): Promise<boolean> {
		const next = this.computeNextPhase(sessionState.currentPhase, sessionState);
		return next ? next === targetPhaseId : false;
	}

	async transitionToPhase(
		sessionState: DesignSessionState,
		targetPhaseId: string,
	): Promise<{ success: boolean; from: string; to?: string }> {
		const can = await this.canTransitionToPhase(sessionState, targetPhaseId);
		return {
			success: can,
			from: sessionState.currentPhase,
			to: can ? targetPhaseId : undefined,
		};
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

// Module Implementation Status Sentinel
export const IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
