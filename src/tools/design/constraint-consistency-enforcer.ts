// Cross-Session Constraint Consistency Enforcer
// Validates constraint usage and documentation across design sessions for alignment with Space 7 Instructions and templates
import { z } from "zod";
import { adrGenerator } from "./adr-generator.js";
import {
	type ConstraintValidationResult,
	type ConstraintViolation,
	constraintManager,
} from "./constraint-manager.js";
import type { Artifact, ConstraintRule, DesignSessionState } from "./types.js";

// Cross-session constraint enforcement types
export interface ConstraintEnforcementHistory {
	constraintId: string;
	sessionId: string;
	timestamp: string;
	phase: string;
	decision: string;
	rationale: string;
	enforcement: boolean;
	violation?: string;
	resolution?: string;
	context: string;
}

export interface CrossSessionValidationResult {
	passed: boolean;
	consistencyScore: number;
	violations: ConstraintConsistencyViolation[];
	recommendations: string[];
	enforcementActions: EnforcementAction[];
	historicalContext: ConstraintEnforcementHistory[];
}

export interface ConstraintConsistencyViolation {
	constraintId: string;
	currentSessionId: string;
	conflictingSessionId: string;
	violationType:
		| "decision_conflict"
		| "rationale_inconsistency"
		| "enforcement_mismatch";
	description: string;
	severity: "critical" | "warning" | "info";
	suggestedResolution: string;
}

export interface EnforcementAction {
	id: string;
	type: "prompt_for_clarification" | "auto_align" | "generate_adr" | "escalate";
	constraintId: string;
	description: string;
	interactive: boolean;
	prompt?: string;
	expectedOutcome?: string;
}

export interface ConsistencyEnforcementRequest {
	sessionState: DesignSessionState;
	constraintId?: string;
	phaseId?: string;
	context?: string;
	strictMode?: boolean;
}

export interface ConsistencyEnforcementResult {
	success: boolean;
	consistencyScore: number;
	enforcementActions: EnforcementAction[];
	generatedArtifacts: Artifact[];
	interactivePrompts: string[];
	recommendations: string[];
	historicalAlignments: string[];
}

// Schema for persistence
const ConstraintEnforcementHistorySchema = z.object({
	constraintId: z.string(),
	sessionId: z.string(),
	timestamp: z.string(),
	phase: z.string(),
	decision: z.string(),
	rationale: z.string(),
	enforcement: z.boolean(),
	violation: z.string().optional(),
	resolution: z.string().optional(),
	context: z.string(),
});

class ConstraintConsistencyEnforcerImpl {
	private enforcementHistory: Map<string, ConstraintEnforcementHistory[]> =
		new Map();
	private initialized = false;

	async initialize(): Promise<void> {
		if (this.initialized) return;

		try {
			// Load any persisted enforcement history
			await this.loadEnforcementHistory();
			this.initialized = true;
		} catch (error) {
			throw new Error(
				`Failed to initialize Constraint Consistency Enforcer: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Enforce cross-session constraint consistency
	 */
		async enforceConsistency(
			request: ConsistencyEnforcementRequest | DesignSessionState,
		): Promise<ConsistencyEnforcementResult> {
			await this.initialize();

			// Backwards-compat: allow passing sessionState directly
				const reqObj = request as unknown as Record<string, unknown>;
				const isSessionOnly =
					request && typeof request === "object" &&
					!("sessionState" in reqObj) &&
					("config" in reqObj || "currentPhase" in reqObj);

			const sessionState = (isSessionOnly
				? (request as DesignSessionState)
				: (request as ConsistencyEnforcementRequest).sessionState) as DesignSessionState;
				const constraintId = isSessionOnly
				? undefined
				: (request as ConsistencyEnforcementRequest).constraintId;
				const phaseId = isSessionOnly
				? undefined
				: (request as ConsistencyEnforcementRequest).phaseId;
				const context = isSessionOnly
				? ""
				: (request as ConsistencyEnforcementRequest).context ?? "";
				const strictMode = isSessionOnly
				? false
				: (request as ConsistencyEnforcementRequest).strictMode ?? false;

		// Validate constraints for current session
		const currentValidation = constraintManager.validateConstraints(
			sessionState,
			constraintId ? [constraintId] : undefined,
		);

		// Perform cross-session validation
		const crossSessionValidation = await this.validateCrossSessionConsistency(
			sessionState,
			constraintId,
		);

		// Generate enforcement actions based on validation results
		const enforcementActions = this.generateEnforcementActions(
			currentValidation,
			crossSessionValidation,
			strictMode,
		);

		// Generate interactive prompts for user validation
		const interactivePrompts = this.generateInteractivePrompts(
			crossSessionValidation,
			phaseId || sessionState.currentPhase,
		);

		// Generate artifacts (ADRs, specs) for enforcement decisions
		const generatedArtifacts = await this.generateEnforcementArtifacts(
			sessionState,
			crossSessionValidation,
			enforcementActions,
		);

		// Store enforcement decisions for future consistency checks
		await this.storeEnforcementDecisions(
			sessionState,
			enforcementActions,
			context,
		);

		// Calculate consistency score
		const consistencyScore = this.calculateConsistencyScore(
			crossSessionValidation,
		);

		return {
			success: crossSessionValidation.passed,
			consistencyScore,
			enforcementActions,
			generatedArtifacts,
			interactivePrompts,
			recommendations: [
				...currentValidation.recommendations,
				...crossSessionValidation.recommendations,
			],
			historicalAlignments: this.generateHistoricalAlignments(
				crossSessionValidation,
			),
		};
	}

		/**
		 * Backwards-compatible wrapper: detect violations for a session
		 */
		async detectViolations(
			request: { sessionState: DesignSessionState; constraintId?: string } | DesignSessionState,
		): Promise<ConstraintConsistencyViolation[]> {
			await this.initialize();
			const reqObj = request as unknown as Record<string, unknown>;
			const isSessionOnly = request && typeof request === "object" && !("sessionState" in reqObj);
			const sessionState = (isSessionOnly
				? (request as DesignSessionState)
				: (request as { sessionState: DesignSessionState }).sessionState) as DesignSessionState;
			const constraintId = isSessionOnly
				? undefined
				: (request as { sessionState: DesignSessionState; constraintId?: string }).constraintId;

			const result = await this.validateCrossSessionConsistency(sessionState, constraintId);
			return result.violations;
		}

		/**
		 * Backwards-compatible wrapper: generate a simple string report
		 */
		async generateReport(
			request: { sessionState: DesignSessionState; constraintId?: string } | DesignSessionState,
		): Promise<string> {
			await this.initialize();
			const reqObj = request as unknown as Record<string, unknown>;
			const isSessionOnly = request && typeof request === "object" && !("sessionState" in reqObj);
			const sessionState = (isSessionOnly
				? (request as DesignSessionState)
				: (request as { sessionState: DesignSessionState }).sessionState) as DesignSessionState;
			const constraintId = isSessionOnly
				? undefined
				: (request as { sessionState: DesignSessionState; constraintId?: string }).constraintId;

			const validation = await this.validateCrossSessionConsistency(sessionState, constraintId);
			const lines = [
				`Cross-Session Constraint Consistency Report for ${sessionState?.config?.sessionId || "unknown-session"}`,
				`Consistency Score: ${validation.consistencyScore}%`,
				`Violations: ${validation.violations.length}`,
			];
			if (validation.violations.length > 0) {
				lines.push("Details:");
				for (const v of validation.violations.slice(0, 5)) {
					lines.push(`- [${v.severity}] ${v.constraintId}: ${v.description}`);
				}
			}
			return lines.join("\n");
		}

	/**
	 * Validate constraint consistency across previous sessions
	 */
	async validateCrossSessionConsistency(
		sessionState: DesignSessionState,
		constraintId?: string,
	): Promise<CrossSessionValidationResult> {
		const violations: ConstraintConsistencyViolation[] = [];
		const recommendations: string[] = [];
		const enforcementActions: EnforcementAction[] = [];

		// Get constraints to validate
		const constraintsToCheck = constraintId
			? [constraintManager.getConstraint(constraintId)].filter(Boolean)
			: constraintManager.getMandatoryConstraints();

		// Get historical context for comparison
		const historicalContext = this.getRelevantHistory(
			sessionState,
			constraintId,
		);

		for (const constraint of constraintsToCheck) {
			if (!constraint) continue; // Skip undefined constraints

			const constraintHistory = historicalContext.filter(
				(h) => h.constraintId === constraint.id,
			);

			if (constraintHistory.length === 0) {
				// No previous history - first time using this constraint
				recommendations.push(
					`First usage of constraint "${constraint.name}". Consider establishing baseline rationale.`,
				);
				continue;
			}

			// Check for decision conflicts
			const decisions = constraintHistory.map((h) => h.decision);
			const uniqueDecisions = [...new Set(decisions)];

			if (uniqueDecisions.length > 1) {
				violations.push({
					constraintId: constraint.id,
					currentSessionId: sessionState.config.sessionId,
					conflictingSessionId: constraintHistory[0].sessionId,
					violationType: "decision_conflict",
					description: `Conflicting decisions found for constraint "${constraint.name}": ${uniqueDecisions.join(" vs ")}`,
					severity: constraint.mandatory ? "critical" : "warning",
					suggestedResolution:
						"Review previous decisions and align approach or document rationale for deviation",
				});

				enforcementActions.push({
					id: `conflict-${constraint.id}`,
					type: "prompt_for_clarification",
					constraintId: constraint.id,
					description: `Resolve decision conflict for ${constraint.name}`,
					interactive: true,
					prompt: this.generateConflictResolutionPrompt(
						constraint,
						constraintHistory,
					),
					expectedOutcome:
						"Alignment with previous decisions or documented deviation rationale",
				});
			}

			// Check for enforcement consistency
			const enforcementPatterns = constraintHistory.map((h) => h.enforcement);
			const inconsistentEnforcement = enforcementPatterns.some(
				(e) => e !== enforcementPatterns[0],
			);

			if (inconsistentEnforcement) {
				violations.push({
					constraintId: constraint.id,
					currentSessionId: sessionState.config.sessionId,
					conflictingSessionId:
						constraintHistory.find(
							(h) => h.enforcement !== enforcementPatterns[0],
						)?.sessionId || "",
					violationType: "enforcement_mismatch",
					description: `Inconsistent enforcement pattern for constraint "${constraint.name}"`,
					severity: "warning",
					suggestedResolution:
						"Establish consistent enforcement approach across sessions",
				});
			}
		}

		const passed =
			violations.filter((v) => v.severity === "critical").length === 0;
		const consistencyScore = this.calculateRawConsistencyScore(
			violations,
			constraintsToCheck.length,
		);

		return {
			passed,
			consistencyScore,
			violations,
			recommendations,
			enforcementActions,
			historicalContext,
		};
	}

	/**
	 * Generate enforcement actions based on validation results
	 */
	private generateEnforcementActions(
		currentValidation: ConstraintValidationResult,
		crossSessionValidation: CrossSessionValidationResult,
		strictMode: boolean,
	): EnforcementAction[] {
		const actions: EnforcementAction[] = [];

		// Add cross-session enforcement actions
		actions.push(...crossSessionValidation.enforcementActions);

		// Add current session enforcement actions based on violations
		for (const violation of currentValidation.violations) {
			if (
				violation.severity === "error" ||
				(strictMode && violation.severity === "warning")
			) {
				actions.push({
					id: `current-${violation.constraintId}`,
					type: "prompt_for_clarification",
					constraintId: violation.constraintId,
					description: `Address current session violation: ${violation.message}`,
					interactive: true,
					prompt: this.generateViolationResolutionPrompt(violation),
					expectedOutcome: "Constraint compliance or documented exception",
				});
			}
		}

		// Generate ADR actions for significant enforcement decisions
		const significantActions = actions.filter(
			(a) => a.type === "prompt_for_clarification",
		);
		if (significantActions.length > 0) {
			actions.push({
				id: "enforcement-adr",
				type: "generate_adr",
				constraintId: "enforcement-decisions",
				description: "Document constraint enforcement decisions",
				interactive: false,
				expectedOutcome: "ADR documenting enforcement rationale and decisions",
			});
		}

		return actions;
	}

	/**
	 * Generate interactive validation prompts
	 */
	private generateInteractivePrompts(
		crossSessionValidation: CrossSessionValidationResult,
		phaseId: string,
	): string[] {
		const prompts: string[] = [];

		// Generate prompts for critical violations
		const criticalViolations = crossSessionValidation.violations.filter(
			(v) => v.severity === "critical",
		);

		for (const violation of criticalViolations) {
			prompts.push(this.generateContextDrivenPrompt(violation, phaseId));
		}

		// Add Space 7 alignment prompts if needed
		if (crossSessionValidation.consistencyScore < 80) {
			prompts.push(
				this.generateSpace7AlignmentPrompt(phaseId, crossSessionValidation),
			);
		}

		return prompts;
	}

	/**
	 * Generate enforcement artifacts (ADRs, specs, etc.)
	 */
	private async generateEnforcementArtifacts(
		sessionState: DesignSessionState,
		crossSessionValidation: CrossSessionValidationResult,
		enforcementActions: EnforcementAction[],
	): Promise<Artifact[]> {
		const artifacts: Artifact[] = [];

		// Generate ADRs for enforcement decisions
		const adrActions = enforcementActions.filter(
			(a) => a.type === "generate_adr",
		);
		for (const action of adrActions) {
			try {
				const adrResult = await adrGenerator.generateADR({
					sessionState,
					title: `Constraint Enforcement Decision: ${action.description}`,
					context: `Cross-session constraint consistency enforcement for ${sessionState.config.context}`,
					decision: this.generateEnforcementDecisionText(
						crossSessionValidation,
						enforcementActions,
					),
					consequences: this.generateEnforcementConsequences(
						crossSessionValidation,
					),
					status: "accepted",
					metadata: {
						consistencyScore: crossSessionValidation.consistencyScore,
						violationsCount: crossSessionValidation.violations.length,
						enforcementType: "cross-session-consistency",
					},
				});
				artifacts.push(adrResult.artifact);
			} catch (error) {
				// Continue with other artifacts if ADR generation fails
				console.warn(
					`Failed to generate enforcement ADR: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}

		return artifacts;
	}

	/**
	 * Store enforcement decisions for future consistency checks
	 */
	private async storeEnforcementDecisions(
		sessionState: DesignSessionState,
		enforcementActions: EnforcementAction[],
		context: string,
	): Promise<void> {
		const timestamp = new Date().toISOString();
		const sessionId = sessionState.config.sessionId;
		const phase = sessionState.currentPhase;

		for (const action of enforcementActions) {
			const history: ConstraintEnforcementHistory = {
				constraintId: action.constraintId,
				sessionId,
				timestamp,
				phase,
				decision: action.description,
				rationale: action.expectedOutcome || "Automated enforcement action",
				enforcement: true,
				context,
			};

			// Store in memory (in production, this would persist to disk/database)
			const constraintHistory =
				this.enforcementHistory.get(action.constraintId) || [];
			constraintHistory.push(history);
			this.enforcementHistory.set(action.constraintId, constraintHistory);
		}

		// Persist to storage (mock implementation)
		await this.persistEnforcementHistory();
	}

	/**
	 * Calculate consistency score based on validation results
	 */
	private calculateConsistencyScore(
		crossSessionValidation: CrossSessionValidationResult,
	): number {
		return crossSessionValidation.consistencyScore;
	}

	private calculateRawConsistencyScore(
		violations: ConstraintConsistencyViolation[],
		totalConstraints: number,
	): number {
		if (totalConstraints === 0) return 100;

		const criticalViolations = violations.filter(
			(v) => v.severity === "critical",
		).length;
		const warningViolations = violations.filter(
			(v) => v.severity === "warning",
		).length;

		// Critical violations have more impact
		const violationScore = criticalViolations * 10 + warningViolations * 3;
		const maxScore = totalConstraints * 10;

		return Math.max(
			0,
			Math.round(((maxScore - violationScore) / maxScore) * 100),
		);
	}

	/**
	 * Get relevant constraint enforcement history
	 */
	private getRelevantHistory(
		sessionState: DesignSessionState,
		constraintId?: string,
	): ConstraintEnforcementHistory[] {
		const allHistory: ConstraintEnforcementHistory[] = [];

		if (constraintId) {
			const constraintHistory = this.enforcementHistory.get(constraintId) || [];
			allHistory.push(...constraintHistory);
		} else {
			// Get history for all constraints used in current session
			const constraints = sessionState?.config?.constraints || [];
			for (const constraint of constraints) {
				const constraintHistory =
					this.enforcementHistory.get(constraint.id) || [];
				allHistory.push(...constraintHistory);
			}
		}

		// Filter out current session to get cross-session history
		const currentSessionId = sessionState?.config?.sessionId;
		return currentSessionId
			? allHistory.filter((h) => h.sessionId !== currentSessionId)
			: allHistory;
	}

	/**
	 * Generate context-driven validation prompts
	 */
	private generateContextDrivenPrompt(
		violation: ConstraintConsistencyViolation,
		phaseId: string,
	): string {
		const phaseContext = this.getPhaseContext(phaseId);

		return `## Constraint Consistency Validation Required

**Phase**: ${phaseContext.name}
**Constraint**: ${violation.constraintId}
**Issue**: ${violation.description}

**Previous Sessions Context**:
Sessions with conflicting approaches have been detected. This may indicate:
1. Evolution in requirements or understanding
2. Different project contexts requiring different approaches
3. Inconsistent application of guidelines

**Resolution Options**:
1. **Align with Previous**: ${violation.suggestedResolution}
2. **Document Deviation**: Provide rationale for why this session requires a different approach
3. **Update Guidelines**: If this represents an improved approach, consider updating the constraint definition

**Space 7 Guidance**: ${this.getSpace7GuidanceForConstraint(violation.constraintId)}

Please specify your approach and rationale:`;
	}

	/**
	 * Generate Space 7 alignment prompts
	 */
	private generateSpace7AlignmentPrompt(
		phaseId: string,
		crossSessionValidation: CrossSessionValidationResult,
	): string {
		const phaseContext = this.getPhaseContext(phaseId);

		return `## Space 7 Instructions Alignment Check

**Current Phase**: ${phaseContext.name}
**Consistency Score**: ${crossSessionValidation.consistencyScore}%

Based on Space 7 General Instructions and design process templates, please verify:

1. **Phase Coverage**: Are all required outputs for ${phaseContext.name} being addressed consistently?
2. **Constraint Application**: Are constraints being applied uniformly across sessions?
3. **Documentation Standards**: Is rationale being documented according to Space 7 guidelines?

**Template References**:
${this.getRelevantTemplateReferences(phaseId)
	.map((ref) => `- ${ref}`)
	.join("\n")}

**Recommendations**:
${crossSessionValidation.recommendations.map((rec) => `- ${rec}`).join("\n")}

Please confirm alignment or document deviations:`;
	}

	/**
	 * Generate conflict resolution prompts
	 */
	private generateConflictResolutionPrompt(
		constraint: ConstraintRule,
		history: ConstraintEnforcementHistory[],
	): string {
		return `## Constraint Decision Conflict Resolution

**Constraint**: ${constraint.name}
**Description**: ${constraint.description}

**Previous Decisions**:
${history.map((h, i) => `${i + 1}. Session ${h.sessionId} (${h.phase}): ${h.decision}\n   Rationale: ${h.rationale}`).join("\n")}

**Current Session Context**: Please specify how this constraint should be applied in the current context.

**Options**:
1. **Follow Previous Pattern**: Adopt the same approach as previous sessions
2. **Justify Deviation**: Explain why current context requires different approach
3. **Escalate**: Flag for broader team discussion if constraint definition needs clarification

Your decision and rationale:`;
	}

	/**
	 * Generate violation resolution prompts
	 */
	private generateViolationResolutionPrompt(
		violation: ConstraintViolation,
	): string {
		return `## Constraint Violation Resolution

**Constraint**: ${violation.constraintId}
**Violation**: ${violation.message}
**Suggested Fix**: ${violation.suggestion}

Please address this violation by:
1. Implementing the suggested fix
2. Providing rationale for acceptable deviation
3. Requesting constraint modification if inappropriate

Your resolution:`;
	}

	/**
	 * Helper methods
	 */
	private getPhaseContext(phaseId: string) {
		const phaseRequirements = constraintManager.getPhaseRequirements(phaseId);
		return (
			phaseRequirements || { name: phaseId, description: `${phaseId} phase` }
		);
	}

	private getSpace7GuidanceForConstraint(constraintId: string): string {
		const constraint = constraintManager.getConstraint(constraintId);
		return (
			constraint?.source ||
			"Refer to Space 7 General Instructions for constraint guidance"
		);
	}

		private getRelevantTemplateReferences(_phaseId: string): string[] {
		const templateRefs = constraintManager.getTemplateReferences();
		return Object.values(templateRefs).slice(0, 3); // Return first 3 relevant templates
	}

	private generateEnforcementDecisionText(
		crossSessionValidation: CrossSessionValidationResult,
		enforcementActions: EnforcementAction[],
	): string {
		return `Cross-session constraint consistency enforcement resulted in ${enforcementActions.length} enforcement actions with ${crossSessionValidation.violations.length} violations detected. Consistency score: ${crossSessionValidation.consistencyScore}%.`;
	}

	private generateEnforcementConsequences(
		crossSessionValidation: CrossSessionValidationResult,
	): string {
		const consequences = [
			`Improved constraint consistency across design sessions`,
			`${crossSessionValidation.violations.length} consistency issues identified and addressed`,
		];

		if (crossSessionValidation.consistencyScore < 70) {
			consequences.push(
				"May require additional review and alignment of constraint application patterns",
			);
		}

		return consequences.join("; ");
	}

	private generateHistoricalAlignments(
		crossSessionValidation: CrossSessionValidationResult,
	): string[] {
		return crossSessionValidation.historicalContext.map(
			(h) => `${h.constraintId}: ${h.decision} (${h.sessionId})`,
		);
	}

	/**
	 * Persistence methods (mock implementation - in production would use file system or database)
	 */
	private async loadEnforcementHistory(): Promise<void> {
		// Mock implementation - in production, load from persistent storage
		// For now, start with empty history
	}

	private async persistEnforcementHistory(): Promise<void> {
		// Mock implementation - in production, save to persistent storage
		// Could save to JSON files, database, etc.
	}
}

export const constraintConsistencyEnforcer =
	new ConstraintConsistencyEnforcerImpl();
