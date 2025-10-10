// Methodology Selector - Space 7-Driven methodology selection for collaborative design sessions
import { z } from "zod";
import type {
	DesignPhase,
	MethodologyCandidate,
	MethodologyProfile,
	MethodologySelection,
	MethodologySignals,
	Milestone,
	PhaseStatus,
} from "./types/index.js";

const MethodologySignalsSchema = z.object({
	projectType: z.enum([
		"analytics-overhaul",
		"safety-protocol",
		"interactive-feature",
		"large-refactor",
		"new-application",
		"integration-project",
		"optimization-project",
		"compliance-initiative",
		"research-exploration",
		"platform-migration",
	]),
	problemFraming: z.enum([
		"uncertain-modeling",
		"policy-first",
		"empathy-focused",
		"performance-first",
		"security-focused",
		"scalability-focused",
		"user-experience",
		"technical-debt",
		"innovation-driven",
		"compliance-driven",
	]),
	riskLevel: z.enum(["low", "medium", "high", "critical"]),
	timelinePressure: z.enum(["urgent", "normal", "relaxed", "flexible"]),
	stakeholderMode: z.enum([
		"technical",
		"business",
		"mixed",
		"external",
		"regulatory",
	]),
	domainContext: z.string().optional(),
	additionalContext: z.record(z.unknown()).optional(),
});

interface MethodologyConfig {
	methodologies: Record<string, MethodologyCandidate>;
	selectionRules: SelectionRule[];
	phaseTemplates: Record<string, DesignPhase>;
}

interface SelectionRule {
	id: string;
	name: string;
	conditions: RuleCondition[];
	methodologyId: string;
	confidenceBase: number;
	modifiers: RuleModifier[];
}

interface RuleCondition {
	field: keyof MethodologySignals;
	operator: "equals" | "in" | "not_equals" | "not_in";
	value: string | string[];
}

interface RuleModifier {
	condition: RuleCondition;
	confidenceAdjustment: number;
}

class MethodologySelectorImpl {
	private config: MethodologyConfig | null = null;

	private readonly DEFAULT_METHODOLOGIES: Record<string, MethodologyCandidate> =
		{
			"dual-track-discovery-agile": {
				id: "dual-track-discovery-agile",
				name: "Dual Track Discovery + Agile Execution",
				description:
					"Combines discovery and delivery tracks for uncertain modeling paths with iterative execution",
				phases: [
					"discovery",
					"validation",
					"exploration",
					"development",
					"iteration",
					"delivery",
				],
				confidenceScore: 0,
				rationale:
					"Ideal for projects with uncertain requirements and need for iterative validation",
				strengths: [
					"Reduces uncertainty through continuous discovery",
					"Maintains delivery momentum",
					"Adapts to changing requirements",
					"Balances innovation with execution",
				],
				considerations: [
					"Requires dedicated discovery resources",
					"May have longer initial phases",
					"Needs strong product ownership",
				],
				suitableFor: [
					"analytics-overhaul",
					"research-exploration",
					"new-application",
				],
				source: "Space 7 General Instructions",
			},

			"policy-first-risk-evaluation": {
				id: "policy-first-risk-evaluation",
				name: "Policy-First + Risk-Based Evaluation",
				description:
					"Adaptation of Double Diamond emphasizing policy development and risk assessment",
				phases: [
					"policy-discover",
					"risk-assessment",
					"policy-define",
					"risk-mitigation",
					"validation",
					"implementation",
				],
				confidenceScore: 0,
				rationale:
					"Best suited for safety protocols and compliance-driven initiatives",
				strengths: [
					"Prioritizes safety and compliance",
					"Systematic risk evaluation",
					"Clear governance structure",
					"Traceable decision making",
				],
				considerations: [
					"May be slower to execute",
					"Requires regulatory expertise",
					"Heavy documentation needs",
				],
				suitableFor: ["safety-protocol", "compliance-initiative"],
				source: "Space 7 General Instructions",
			},

			"design-thinking-empathy": {
				id: "design-thinking-empathy",
				name: "Design Thinking (Empathy-Focused)",
				description:
					"Human-centered design approach emphasizing early empathy interviews and user needs",
				phases: [
					"empathize",
					"define",
					"ideate",
					"prototype",
					"test",
					"implement",
				],
				confidenceScore: 0,
				rationale:
					"Optimal for user-facing features requiring deep user understanding",
				strengths: [
					"Deep user insights",
					"Human-centered solutions",
					"Creative problem solving",
					"Validated user needs",
				],
				considerations: [
					"Time-intensive user research",
					"May lack technical depth",
					"Requires user access",
				],
				suitableFor: ["interactive-feature", "new-application"],
				source: "Design Thinking Guidelines",
			},

			"architecture-decision-mapping": {
				id: "architecture-decision-mapping",
				name: "Architecture Decision Mapping + Lightweight Iterative Loop",
				description:
					"Architecture-focused methodology for large refactors with iterative risk containment",
				phases: [
					"architecture-analysis",
					"decision-mapping",
					"risk-assessment",
					"iterative-refactor",
					"validation",
					"deployment",
				],
				confidenceScore: 0,
				rationale:
					"Designed for complex refactoring projects requiring architectural changes",
				strengths: [
					"Systematic architecture evolution",
					"Risk-controlled refactoring",
					"Clear decision traceability",
					"Incremental delivery",
				],
				considerations: [
					"Requires architectural expertise",
					"May slow initial progress",
					"Complex dependency management",
				],
				suitableFor: [
					"large-refactor",
					"platform-migration",
					"optimization-project",
				],
				source: "Architecture Guidelines",
			},

			"lean-ux-rapid": {
				id: "lean-ux-rapid",
				name: "Lean UX Rapid Validation",
				description:
					"Fast feedback loops with minimum viable solutions for time-pressured projects",
				phases: ["assume", "design", "validate", "iterate", "scale"],
				confidenceScore: 0,
				rationale:
					"Best for urgent projects requiring rapid validation and iteration",
				strengths: [
					"Fast time to market",
					"Continuous validation",
					"Minimal waste",
					"User-focused outcomes",
				],
				considerations: [
					"May lack depth",
					"Requires frequent stakeholder engagement",
					"Risk of technical debt",
				],
				suitableFor: ["interactive-feature", "optimization-project"],
				source: "Lean UX Guidelines",
			},

			"double-diamond-comprehensive": {
				id: "double-diamond-comprehensive",
				name: "Double Diamond Comprehensive",
				description:
					"Thorough problem exploration and solution development with clear diverge/converge cycles",
				phases: ["discover", "define", "develop", "deliver"],
				confidenceScore: 0,
				rationale:
					"Comprehensive approach for well-scoped projects with clear timelines",
				strengths: [
					"Thorough problem understanding",
					"Systematic solution development",
					"Clear phase gates",
					"Well-documented process",
				],
				considerations: [
					"Can be time-intensive",
					"May be too structured for urgent projects",
					"Requires discipline",
				],
				suitableFor: ["new-application", "integration-project"],
				source: "Design Process Templates",
			},
		};

	private readonly DEFAULT_SELECTION_RULES: SelectionRule[] = [
		{
			id: "analytics-overhaul-rule",
			name: "Analytics Overhaul → Dual Track Discovery",
			conditions: [
				{
					field: "projectType",
					operator: "equals",
					value: "analytics-overhaul",
				},
				{
					field: "problemFraming",
					operator: "equals",
					value: "uncertain-modeling",
				},
			],
			methodologyId: "dual-track-discovery-agile",
			confidenceBase: 85,
			modifiers: [
				{
					condition: {
						field: "riskLevel",
						operator: "in",
						value: ["high", "critical"],
					},
					confidenceAdjustment: 10,
				},
				{
					condition: {
						field: "timelinePressure",
						operator: "equals",
						value: "urgent",
					},
					confidenceAdjustment: -15,
				},
			],
		},

		{
			id: "safety-protocol-rule",
			name: "Safety Protocol → Policy-First Risk Evaluation",
			conditions: [
				{ field: "projectType", operator: "equals", value: "safety-protocol" },
			],
			methodologyId: "policy-first-risk-evaluation",
			confidenceBase: 90,
			modifiers: [
				{
					condition: {
						field: "stakeholderMode",
						operator: "equals",
						value: "regulatory",
					},
					confidenceAdjustment: 10,
				},
				{
					condition: {
						field: "riskLevel",
						operator: "equals",
						value: "critical",
					},
					confidenceAdjustment: 15,
				},
			],
		},

		{
			id: "interactive-feature-rule",
			name: "Interactive Feature → Design Thinking",
			conditions: [
				{
					field: "projectType",
					operator: "equals",
					value: "interactive-feature",
				},
				{
					field: "problemFraming",
					operator: "equals",
					value: "empathy-focused",
				},
			],
			methodologyId: "design-thinking-empathy",
			confidenceBase: 85,
			modifiers: [
				{
					condition: {
						field: "stakeholderMode",
						operator: "equals",
						value: "business",
					},
					confidenceAdjustment: 10,
				},
				{
					condition: {
						field: "timelinePressure",
						operator: "equals",
						value: "urgent",
					},
					confidenceAdjustment: -20,
				},
			],
		},

		{
			id: "large-refactor-rule",
			name: "Large Refactor → Architecture Decision Mapping",
			conditions: [
				{ field: "projectType", operator: "equals", value: "large-refactor" },
			],
			methodologyId: "architecture-decision-mapping",
			confidenceBase: 88,
			modifiers: [
				{
					condition: {
						field: "riskLevel",
						operator: "in",
						value: ["high", "critical"],
					},
					confidenceAdjustment: 12,
				},
				{
					condition: {
						field: "stakeholderMode",
						operator: "equals",
						value: "technical",
					},
					confidenceAdjustment: 8,
				},
			],
		},

		{
			id: "urgent-timeline-rule",
			name: "Urgent Timeline → Lean UX Rapid",
			conditions: [
				{ field: "timelinePressure", operator: "equals", value: "urgent" },
				{
					field: "projectType",
					operator: "in",
					value: ["interactive-feature", "optimization-project"],
				},
			],
			methodologyId: "lean-ux-rapid",
			confidenceBase: 80,
			modifiers: [
				{
					condition: { field: "riskLevel", operator: "equals", value: "low" },
					confidenceAdjustment: 15,
				},
			],
		},
	];

	async initialize(): Promise<void> {
		if (this.config) return;

		// Load from configuration file or use defaults
		this.config = {
			methodologies: { ...this.DEFAULT_METHODOLOGIES },
			selectionRules: [...this.DEFAULT_SELECTION_RULES],
			phaseTemplates: this.generatePhaseTemplates(),
		};
	}

	async selectMethodology(
		signals:
			| MethodologySignals
			| { context?: string; requirements?: string[]; constraints?: string[] },
	): Promise<
		MethodologySelection & {
			methodology: MethodologyCandidate;
			confidence: number;
		}
	> {
		await this.initialize();

		// Validate input signals, fallback to inferred defaults when absent
		const parsed = MethodologySignalsSchema.safeParse(signals);
		const validatedSignals: MethodologySignals = parsed.success
			? parsed.data
			: {
					projectType: "new-application",
					problemFraming:
						typeof signals === "object" &&
						signals &&
						"context" in signals &&
						typeof signals.context === "string" &&
						signals.context.toLowerCase().includes("safety")
							? "policy-first"
							: "innovation-driven",
					riskLevel: "medium",
					timelinePressure: "normal",
					stakeholderMode: "mixed",
					domainContext:
						typeof signals === "object" &&
						signals &&
						"context" in signals &&
						typeof (signals as { context?: string }).context === "string"
							? (signals as { context?: string }).context
							: undefined,
					additionalContext: {},
				};

		// Apply selection rules to rank methodologies
		const candidates = this.rankMethodologies(validatedSignals);

		// Select the top candidate
		const selected = candidates[0];
		const alternatives = candidates.slice(1, 4); // Top 3 alternatives

		// Generate selection rationale
		const selectionRationale = this.generateSelectionRationale(
			selected,
			validatedSignals,
		);

		const result: MethodologySelection = {
			selected,
			alternatives,
			signals: validatedSignals,
			timestamp: new Date().toISOString(),
			selectionRationale,
		};

		// Backwards-compatible fields expected by some tests
		return Object.assign({}, result, {
			methodology: result.selected,
			confidence: result.selected.confidenceScore || 75,
		});
	}

	async generateMethodologyProfile(
		selection: MethodologySelection,
	): Promise<MethodologyProfile> {
		await this.initialize();

		const methodology = selection.selected;
		const phaseMapping = this.generatePhaseMapping(methodology);
		const milestones = this.generateMilestones(methodology, phaseMapping);
		const successMetrics = this.generateSuccessMetrics(
			methodology,
			selection.signals,
		);
		const dialoguePrompts = this.generateDialoguePrompts(
			methodology,
			selection.signals,
		);

		return {
			methodology,
			phaseMapping,
			milestones,
			successMetrics,
			dialoguePrompts,
			artifacts: [], // Will be populated as phases progress
		};
	}

	private rankMethodologies(
		signals: MethodologySignals,
	): MethodologyCandidate[] {
		if (!this.config) throw new Error("Methodology selector not initialized");

		const candidates: MethodologyCandidate[] = [];

		// Apply each rule and calculate confidence scores
		for (const rule of this.config.selectionRules) {
			if (this.evaluateRuleConditions(rule.conditions, signals)) {
				const methodology = {
					...this.config.methodologies[rule.methodologyId],
				};
				if (methodology) {
					methodology.confidenceScore = this.calculateConfidenceScore(
						rule,
						signals,
					);
					methodology.rationale = this.generateRuleRationale(rule, signals);
					candidates.push(methodology);
				}
			}
		}

		// Add fallback methodologies for uncovered cases
		const coveredMethodologies = new Set(candidates.map((c) => c.id));
		for (const [id, methodology] of Object.entries(this.config.methodologies)) {
			if (!coveredMethodologies.has(id)) {
				const fallbackCandidate = { ...methodology };
				fallbackCandidate.confidenceScore = this.calculateFallbackScore(
					methodology,
					signals,
				);
				fallbackCandidate.rationale =
					"Fallback selection based on project characteristics";
				candidates.push(fallbackCandidate);
			}
		}

		// Sort by confidence score (descending)
		return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
	}

	private evaluateRuleConditions(
		conditions: RuleCondition[],
		signals: MethodologySignals,
	): boolean {
		return conditions.every((condition) => {
			const signalValue = signals[condition.field];
			switch (condition.operator) {
				case "equals":
					return signalValue === condition.value;
				case "in":
					return (
						Array.isArray(condition.value) &&
						condition.value.includes(signalValue as string)
					);
				case "not_equals":
					return signalValue !== condition.value;
				case "not_in":
					return (
						!Array.isArray(condition.value) ||
						!condition.value.includes(signalValue as string)
					);
				default:
					return false;
			}
		});
	}

	private calculateConfidenceScore(
		rule: SelectionRule,
		signals: MethodologySignals,
	): number {
		let score = rule.confidenceBase;

		for (const modifier of rule.modifiers) {
			if (this.evaluateRuleConditions([modifier.condition], signals)) {
				score += modifier.confidenceAdjustment;
			}
		}

		return Math.max(0, Math.min(100, score));
	}

	private calculateFallbackScore(
		methodology: MethodologyCandidate,
		signals: MethodologySignals,
	): number {
		// Simple heuristic based on project type suitability
		const baseScore = methodology.suitableFor.includes(signals.projectType)
			? 50
			: 30;

		// Adjust based on risk and timeline
		let adjustment = 0;
		if (signals.riskLevel === "high" || signals.riskLevel === "critical") {
			adjustment += methodology.name.toLowerCase().includes("risk") ? 10 : -5;
		}
		if (signals.timelinePressure === "urgent") {
			adjustment +=
				methodology.name.toLowerCase().includes("rapid") ||
				methodology.name.toLowerCase().includes("lean")
					? 15
					: -10;
		}

		return Math.max(0, Math.min(100, baseScore + adjustment));
	}

	private generateRuleRationale(
		rule: SelectionRule,
		signals: MethodologySignals,
	): string {
		const conditions = rule.conditions
			.map((c) => `${c.field}: ${signals[c.field]}`)
			.join(", ");
		return `Selected based on rule "${rule.name}" matching conditions: ${conditions}`;
	}

	private generateSelectionRationale(
		methodology: MethodologyCandidate,
		signals: MethodologySignals,
	): string {
		return `Selected "${methodology.name}" with ${methodology.confidenceScore}% confidence for ${signals.projectType} project. ${methodology.rationale}`;
	}

	private generatePhaseMapping(
		methodology: MethodologyCandidate,
	): Record<string, DesignPhase> {
		if (!this.config) throw new Error("Methodology selector not initialized");

		const phaseMapping: Record<string, DesignPhase> = {};

		methodology.phases.forEach((phaseId, index) => {
			const template =
				this.config?.phaseTemplates[phaseId] ||
				this.createDefaultPhase(phaseId);
			phaseMapping[phaseId] = {
				...template,
				id: phaseId,
				status: (index === 0 ? "in-progress" : "pending") as PhaseStatus,
				coverage: 0,
				artifacts: [],
			};
		});

		return phaseMapping;
	}

	private generateMilestones(
		methodology: MethodologyCandidate,
		phaseMapping: Record<string, DesignPhase>,
	): Milestone[] {
		return methodology.phases.map((phaseId, index) => ({
			id: `milestone-${index + 1}`,
			name: `${phaseMapping[phaseId]?.name || phaseId} Completion`,
			description: `Complete all deliverables for the ${phaseId} phase`,
			phaseId,
			deliverables: phaseMapping[phaseId]?.outputs || [],
			criteria: phaseMapping[phaseId]?.criteria || [],
			estimatedDuration: this.estimatePhaseDuration(phaseId, methodology),
		}));
	}

	private generateSuccessMetrics(
		methodology: MethodologyCandidate,
		_signals: MethodologySignals,
	): string[] {
		const baseMetrics = [
			"All phase deliverables completed",
			"Coverage thresholds met (≥85%)",
			"Stakeholder approval obtained",
		];

		// Add methodology-specific metrics
		if (methodology.name.includes("Risk")) {
			baseMetrics.push(
				"Risk assessment completed",
				"Mitigation strategies defined",
			);
		}
		if (methodology.name.includes("Empathy")) {
			baseMetrics.push("User interviews conducted", "User needs validated");
		}
		if (methodology.name.includes("Architecture")) {
			baseMetrics.push(
				"Architecture decisions documented",
				"Technical debt assessed",
			);
		}

		return baseMetrics;
	}

	private generateDialoguePrompts(
		methodology: MethodologyCandidate,
		signals: MethodologySignals,
	): string[] {
		return [
			`Begin ${methodology.name} process for ${signals.projectType} project`,
			`Focus on ${signals.problemFraming} aspects during discovery`,
			`Consider ${signals.riskLevel} risk level throughout process`,
			`Maintain ${signals.timelinePressure} timeline expectations`,
			`Engage ${signals.stakeholderMode} stakeholders appropriately`,
		];
	}

	private generatePhaseTemplates(): Record<string, DesignPhase> {
		return {
			discovery: {
				id: "discovery",
				name: "Discovery & Exploration",
				description: "Understand the problem space and gather requirements",
				inputs: ["project-context", "stakeholder-input"],
				outputs: ["problem-statement", "requirements", "constraints"],
				criteria: ["Clear problem definition", "Stakeholder alignment"],
				coverage: 0,
				status: "pending",
				artifacts: [],
				dependencies: [],
			},
			validation: {
				id: "validation",
				name: "Validation & Verification",
				description: "Validate assumptions and verify requirements",
				inputs: ["requirements", "assumptions"],
				outputs: ["validated-requirements", "assumptions-log"],
				criteria: ["Requirements validated", "Assumptions tested"],
				coverage: 0,
				status: "pending",
				artifacts: [],
				dependencies: ["discovery"],
			},
			exploration: {
				id: "exploration",
				name: "Solution Exploration",
				description: "Explore potential solutions and approaches",
				inputs: ["validated-requirements", "constraints"],
				outputs: ["solution-options", "trade-offs"],
				criteria: ["Multiple options evaluated", "Trade-offs documented"],
				coverage: 0,
				status: "pending",
				artifacts: [],
				dependencies: ["validation"],
			},
			define: {
				id: "define",
				name: "Problem Definition",
				description: "Synthesize insights into clear problem statement",
				inputs: ["discovery-insights", "user-needs"],
				outputs: ["problem-statement", "design-brief"],
				criteria: ["Problem clearly defined", "Success criteria set"],
				coverage: 0,
				status: "pending",
				artifacts: [],
				dependencies: ["discover"],
			},
			empathize: {
				id: "empathize",
				name: "Empathize",
				description: "Understand users and their needs through research",
				inputs: ["user-research-plan"],
				outputs: ["user-personas", "journey-maps", "insights"],
				criteria: ["User needs understood", "Empathy established"],
				coverage: 0,
				status: "pending",
				artifacts: [],
				dependencies: [],
			},
			// Add more phase templates as needed
		};
	}

	private createDefaultPhase(phaseId: string): DesignPhase {
		return {
			id: phaseId,
			name: phaseId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
			description: `Complete ${phaseId} phase activities`,
			inputs: [],
			outputs: [],
			criteria: [],
			coverage: 0,
			status: "pending",
			artifacts: [],
			dependencies: [],
		};
	}

	private estimatePhaseDuration(
		phaseId: string,
		_methodology: MethodologyCandidate,
	): string {
		// Simple heuristic for duration estimation
		const durationMap: Record<string, string> = {
			discovery: "1-2 weeks",
			empathize: "2-3 weeks",
			validation: "1 week",
			exploration: "2-3 weeks",
			define: "1 week",
			"architecture-analysis": "2-4 weeks",
			"policy-discover": "3-4 weeks",
			"risk-assessment": "1-2 weeks",
		};

		return durationMap[phaseId] || "1-2 weeks";
	}
}

// Export singleton instance
export const methodologySelector = new MethodologySelectorImpl();

// Module Implementation Status Sentinel
export const IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
