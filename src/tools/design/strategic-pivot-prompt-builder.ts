// Strategic Pivot Prompt Builder - Generates adaptive, context-aware prompts for design pivots
import { z } from "zod";
import { constraintManager } from "./constraint-manager.js";
import type {
	ArtifactType,
	DesignSessionState,
	PivotDecision,
	PivotGuidance,
	PivotImpact,
	RiskLevel,
	StrategicPivotPromptRequest,
	StrategicPivotPromptResult,
} from "./types.js";

const StrategicPivotPromptRequestSchema = z.object({
	sessionState: z.any(), // DesignSessionState
	pivotDecision: z.any(), // PivotDecision
	context: z.string().optional(),
	includeTemplates: z.boolean().optional().default(true),
	includeSpace7Instructions: z.boolean().optional().default(true),
	outputFormat: z
		.enum(["markdown", "mermaid", "yaml", "json", "typescript", "javascript"])
		.optional()
		.default("markdown"),
	customInstructions: z.array(z.string()).optional().default([]),
});

class StrategicPivotPromptBuilderImpl {
	private initialized = false;

	async initialize(): Promise<void> {
		if (this.initialized) return;
		this.initialized = true;
	}

	async generateStrategicPivotPrompt(
		request: StrategicPivotPromptRequest,
	): Promise<StrategicPivotPromptResult> {
		const validatedRequest = StrategicPivotPromptRequestSchema.parse(request);
		const {
			sessionState,
			pivotDecision,
			context,
			includeTemplates,
			includeSpace7Instructions,
			outputFormat,
		} = validatedRequest;

		// Analyze pivot context and generate impact assessment
		const pivotImpact = await this.assessPivotImpact(
			pivotDecision,
			sessionState,
		);
		const pivotGuidance = await this.generatePivotGuidance(
			pivotDecision,
			sessionState,
			pivotImpact,
		);

		// Generate different prompt content based on whether pivot is triggered
		const promptSections = pivotDecision.triggered
			? [
					this.generateHeader(pivotDecision, sessionState),
					this.generateContextSection(sessionState, context),
					this.generatePivotAnalysis(pivotDecision, pivotImpact),
					await this.generateGuidanceSection(
						pivotGuidance,
						includeSpace7Instructions,
					),
					await this.generateTemplateReferences(
						pivotDecision,
						includeTemplates,
					),
					this.generateNextStepsSection(pivotGuidance),
					this.generateConversationStarters(pivotDecision, sessionState),
				]
			: [
					this.generateHeader(pivotDecision, sessionState),
					this.generateContextSection(sessionState, context),
					this.generateMonitoringGuidance(pivotDecision, pivotImpact),
					this.generateMonitoringSteps(sessionState),
				];

		const prompt = promptSections
			.filter((section) => section.trim())
			.join("\n\n");

		// Determine suggested artifacts based on pivot type
		const suggestedArtifacts = this.determineSuggestedArtifacts(
			pivotDecision,
			pivotImpact,
		);

		// Generate next steps and conversation starters
		const nextSteps = pivotDecision.triggered
			? pivotGuidance.implementationSteps
			: this.getMonitoringSteps();
		const conversationStarters = this.generateConversationStartersList(
			pivotDecision,
			sessionState,
		);

		return {
			success: true,
			prompt,
			metadata: {
				pivotReason: pivotDecision.reason,
				complexityScore: pivotDecision.complexity,
				entropyLevel: pivotDecision.entropy,
				templatesIncluded:
					includeTemplates && pivotDecision.triggered
						? this.getIncludedTemplates(pivotDecision)
						: [],
				space7Integration:
					(includeSpace7Instructions && pivotDecision.triggered) || false,
				recommendedActions: pivotDecision.alternatives,
				estimatedImpact: pivotImpact,
			},
			suggestedArtifacts,
			nextSteps,
			conversationStarters,
		};
	}

	private generateHeader(
		pivotDecision: PivotDecision,
		sessionState: DesignSessionState,
	): string {
		const severity =
			pivotDecision.complexity > 90
				? "Critical"
				: pivotDecision.complexity > 75
					? "High"
					: pivotDecision.complexity > 60
						? "Medium"
						: "Low";

		return `# 🔄 Strategic Pivot Guidance

## Current Situation
**Session**: ${sessionState.config.sessionId}
**Current Phase**: ${sessionState.currentPhase}
**Pivot Severity**: ${severity}
**Complexity Score**: ${pivotDecision.complexity}/100
**Entropy Level**: ${pivotDecision.entropy}/100

## Pivot Trigger
${pivotDecision.reason}`;
	}

	private generateContextSection(
		sessionState: DesignSessionState,
		additionalContext?: string,
	): string {
		const currentPhase = sessionState.phases[sessionState.currentPhase];
		const coverage = sessionState.coverage.overall;

		return `## Context Analysis

**Project Goal**: ${sessionState.config.goal}
**Current Phase**: ${currentPhase.name} - ${currentPhase.description}
**Coverage**: ${coverage.toFixed(1)}% overall
**Constraints**: ${sessionState.config.constraints.length} active constraints
**Artifacts**: ${sessionState.artifacts.length} generated

${additionalContext ? `**Additional Context**: ${additionalContext}` : ""}`;
	}

	private generatePivotAnalysis(
		pivotDecision: PivotDecision,
		impact: PivotImpact,
	): string {
		return `## Pivot Analysis

### Detected Issues
- **Complexity**: ${this.getComplexityDescription(pivotDecision.complexity)}
- **Uncertainty**: ${this.getEntropyDescription(pivotDecision.entropy)}
- **Timeline Impact**: ${impact.timelineChange}
- **Resource Requirements**: ${impact.resourcesRequired}
- **Risk Level**: ${impact.riskLevel}

### Available Alternatives
${pivotDecision.alternatives.map((alt, index) => `${index + 1}. ${alt}`).join("\n")}`;
	}

	private async generateGuidanceSection(
		guidance: PivotGuidance,
		includeSpace7: boolean,
	): Promise<string> {
		let section = `## Strategic Guidance

### Recommended Decision
${guidance.decision}

### Rationale
${guidance.rationale}

### Trade-offs Analysis
**Pros:**
${guidance.tradeoffs.pros.map((pro) => `- ✅ ${pro}`).join("\n")}

**Cons:**
${guidance.tradeoffs.cons.map((con) => `- ❌ ${con}`).join("\n")}

**Risks:**
${guidance.tradeoffs.risks.map((risk) => `- ⚠️ ${risk}`).join("\n")}

**Opportunities:**
${guidance.tradeoffs.opportunities.map((opp) => `- 🚀 ${opp}`).join("\n")}`;

		if (includeSpace7) {
			section += `\n\n### Space 7 General Instructions Integration
${await this.getSpace7Guidance(guidance)}`;
		}

		return section;
	}

	private async generateTemplateReferences(
		pivotDecision: PivotDecision,
		includeTemplates: boolean,
	): Promise<string> {
		if (!includeTemplates) return "";

		const templateRefs = constraintManager.getTemplateReferences();
		const relevantTemplates = this.getRelevantTemplates(
			pivotDecision,
			templateRefs,
		);

		if (relevantTemplates.length === 0) {
			// Always provide at least basic template references when requested
			return `## Template References

### Relevant Templates for This Pivot
- **Design Process Template**: Structured approach for managing design pivots
  *Reference*: reference/DESIGN_PROCESS_TEMPLATE.md

- **Architecture Templates**: Patterns and guidelines for architectural decisions
  *Reference*: reference/ARCHITECTURE_TEMPLATES.md

- **Conversation Starter**: Templates for stakeholder communication during pivots
  *Reference*: reference/CONVERSATION_STARTER.md`;
		}

		return `## Template References

### Relevant Templates for This Pivot
${relevantTemplates.map((template) => `- **${template.name}**: ${template.description}\n  *Reference*: ${template.path}`).join("\n\n")}`;
	}

	private generateNextStepsSection(guidance: PivotGuidance): string {
		return `## Implementation Steps

### Immediate Actions
${guidance.implementationSteps
	.slice(0, 3)
	.map((step, index) => `${index + 1}. ${step}`)
	.join("\n")}

### Follow-up Actions
${guidance.implementationSteps
	.slice(3)
	.map((step, index) => `${index + 4}. ${step}`)
	.join("\n")}

${
	guidance.rollbackPlan
		? `### Rollback Plan (if needed)
${guidance.rollbackPlan.map((step, index) => `${index + 1}. ${step}`).join("\n")}`
		: ""
}`;
	}

	private generateConversationStarters(
		pivotDecision: PivotDecision,
		sessionState: DesignSessionState,
	): string {
		const starters = this.generateConversationStartersList(
			pivotDecision,
			sessionState,
		);

		return `## Conversation Starters

Use these prompts to facilitate stakeholder discussions:

${starters
	.map(
		(starter, index) => `### ${index + 1}. ${starter.split(":")[0]}
${starter.split(":").slice(1).join(":").trim()}`,
	)
	.join("\n\n")}`;
	}

	private generateMonitoringGuidance(
		pivotDecision: PivotDecision,
		impact: PivotImpact,
	): string {
		return `## Status Assessment

### Current Metrics
- **Complexity**: ${this.getComplexityDescription(pivotDecision.complexity)}
- **Uncertainty**: ${this.getEntropyDescription(pivotDecision.entropy)}
- **Timeline Impact**: ${impact.timelineChange}
- **Resource Status**: ${impact.resourcesRequired}
- **Risk Level**: ${impact.riskLevel}

## Recommendation

**Continue with current approach** while maintaining vigilant monitoring of complexity and uncertainty levels.

### Monitoring Focus Areas
- Track complexity metrics to ensure they remain below threshold (${pivotDecision.threshold})
- Monitor requirement uncertainty and stakeholder alignment
- Watch for signs of technical debt accumulation
- Keep an eye on team velocity and delivery quality

### Success Indicators
- Complexity score remains below ${pivotDecision.threshold}
- Uncertainty levels stay manageable (< 70)
- Team maintains delivery momentum
- Stakeholder satisfaction remains high`;
	}

	private generateMonitoringSteps(sessionState: DesignSessionState): string {
		return `## Monitoring Actions

### Immediate Actions
1. Set up regular complexity assessment checkpoints
2. Establish uncertainty tracking mechanisms
3. Schedule weekly progress reviews
4. Monitor coverage metrics and quality indicators

### Ongoing Monitoring
- Weekly complexity score reviews
- Bi-weekly stakeholder check-ins
- Monthly architecture health assessments
- Quarterly strategic alignment reviews

*Current session status: ${sessionState.status} with ${sessionState.coverage.overall.toFixed(1)}% coverage*`;
	}

	private getMonitoringSteps(): string[] {
		return [
			"Set up regular complexity assessment checkpoints",
			"Establish uncertainty tracking mechanisms",
			"Schedule weekly progress reviews",
			"Monitor coverage metrics and quality indicators",
			"Conduct bi-weekly stakeholder check-ins",
			"Perform monthly architecture health assessments",
		];
	}

	private async assessPivotImpact(
		pivotDecision: PivotDecision,
		sessionState: DesignSessionState,
	): Promise<PivotImpact> {
		// Assess timeline change based on complexity and current phase
		const timelineChange =
			pivotDecision.complexity > 85
				? "major"
				: pivotDecision.complexity > 70
					? "significant"
					: pivotDecision.complexity > 50
						? "moderate"
						: "minimal";

		// Assess resource requirements
		const resourcesRequired =
			pivotDecision.entropy > 80
				? "critical"
				: pivotDecision.entropy > 60
					? "high"
					: pivotDecision.entropy > 40
						? "medium"
						: "low";

		// Determine risk level
		const riskLevel: RiskLevel =
			(pivotDecision.complexity + pivotDecision.entropy) / 2 > 80
				? "critical"
				: (pivotDecision.complexity + pivotDecision.entropy) / 2 > 60
					? "high"
					: (pivotDecision.complexity + pivotDecision.entropy) / 2 > 40
						? "medium"
						: "low";

		// Calculate confidence level (inverse of uncertainty)
		const confidenceLevel = Math.max(0, 100 - pivotDecision.entropy);

		// Determine affected phases
		const currentPhaseIndex = Object.keys(sessionState.phases).indexOf(
			sessionState.currentPhase,
		);
		const affectedPhases = Object.keys(sessionState.phases).slice(
			currentPhaseIndex,
		);

		return {
			timelineChange,
			resourcesRequired,
			riskLevel,
			confidenceLevel,
			affectedPhases,
		};
	}

	private async generatePivotGuidance(
		pivotDecision: PivotDecision,
		sessionState: DesignSessionState,
		impact: PivotImpact,
	): Promise<PivotGuidance> {
		// Generate decision recommendation
		const decision = this.generateDecisionRecommendation(pivotDecision, impact);

		// Generate rationale
		const rationale = this.generateRationale(
			pivotDecision,
			sessionState,
			impact,
		);

		// Generate trade-offs analysis
		const tradeoffs = this.generateTradeOffs(pivotDecision, impact);

		// Generate implementation steps
		const implementationSteps = this.generateImplementationSteps(
			pivotDecision,
			sessionState,
			impact,
		);

		// Generate rollback plan if needed
		const rollbackPlan =
			impact.riskLevel === "high" || impact.riskLevel === "critical"
				? this.generateRollbackPlan(pivotDecision, sessionState)
				: undefined;

		return {
			decision,
			rationale,
			tradeoffs,
			implementationSteps,
			rollbackPlan,
		};
	}

	private generateDecisionRecommendation(
		pivotDecision: PivotDecision,
		impact: PivotImpact,
	): string {
		if (pivotDecision.alternatives.length === 0) {
			return "Continue with current approach while monitoring complexity and uncertainty levels.";
		}

		const primaryAlternative = pivotDecision.alternatives[0];
		return `Recommended: ${primaryAlternative}

This pivot is necessary due to ${pivotDecision.reason.toLowerCase()}. The estimated impact is ${impact.timelineChange} with ${impact.resourcesRequired} resource requirements.`;
	}

	private generateRationale(
		pivotDecision: PivotDecision,
		sessionState: DesignSessionState,
		impact: PivotImpact,
	): string {
		const coverageIssue =
			sessionState.coverage.overall < 80
				? "Current coverage is below target thresholds. "
				: "";
		const complexityIssue =
			pivotDecision.complexity > 75
				? "System complexity has exceeded manageable levels. "
				: "";
		const entropyIssue =
			pivotDecision.entropy > 70
				? "Uncertainty levels are too high to proceed confidently. "
				: "";

		return `${coverageIssue}${complexityIssue}${entropyIssue}

A strategic pivot at this point will:
- Reduce complexity from ${pivotDecision.complexity} to an estimated ${Math.max(30, pivotDecision.complexity - 25)}
- Lower uncertainty from ${pivotDecision.entropy} to approximately ${Math.max(20, pivotDecision.entropy - 30)}
- Improve project success probability by ${impact.confidenceLevel}%

The confidence level for this recommendation is ${impact.confidenceLevel}% based on current session data and historical patterns.`;
	}

	private generateTradeOffs(
		_pivotDecision: PivotDecision,
		impact: PivotImpact,
	): PivotGuidance["tradeoffs"] {
		const pros = [
			"Reduces technical complexity and risk",
			"Improves long-term maintainability",
			"Aligns better with available resources",
		];

		const cons = [
			`Timeline will be ${impact.timelineChange}ly affected`,
			`Requires ${impact.resourcesRequired} additional resources`,
			"May require stakeholder re-alignment",
		];

		const risks = [
			"Scope creep during pivot execution",
			"Team morale impact from direction change",
			"Potential integration challenges",
		];

		const opportunities = [
			"Adopt more modern/efficient approaches",
			"Improve overall system architecture",
			"Enhance team learning and capabilities",
		];

		return { pros, cons, risks, opportunities };
	}

	private generateImplementationSteps(
		_pivotDecision: PivotDecision,
		_sessionState: DesignSessionState,
		impact: PivotImpact,
	): string[] {
		const steps = [
			"Document current state and pivot rationale in ADR",
			"Communicate pivot decision to all stakeholders",
			"Update project timeline and resource allocation",
			"Revise current phase deliverables and acceptance criteria",
			"Update architecture documentation and constraints",
			"Schedule team alignment sessions",
			"Begin execution of pivot strategy",
			"Monitor progress and validate assumptions",
		];

		// Add specific steps based on pivot complexity
		if (impact.riskLevel === "high" || impact.riskLevel === "critical") {
			steps.splice(
				3,
				0,
				"Conduct detailed risk assessment and mitigation planning",
			);
			steps.splice(5, 0, "Set up additional monitoring and checkpoints");
		}

		return steps;
	}

	private generateRollbackPlan(
		_pivotDecision: PivotDecision,
		_sessionState: DesignSessionState,
	): string[] {
		return [
			"Assess pivot execution progress and blockers",
			"Document lessons learned and failure points",
			"Restore previous session state and artifacts",
			"Re-engage original approach with improvements",
			"Update stakeholders on rollback rationale",
			"Implement safeguards to prevent similar issues",
		];
	}

	private determineSuggestedArtifacts(
		pivotDecision: PivotDecision,
		impact: PivotImpact,
	): ArtifactType[] {
		if (!pivotDecision.triggered) {
			return []; // No artifacts needed for monitoring scenarios
		}

		const artifacts: ArtifactType[] = ["adr"]; // Always generate ADR for pivots

		// Add specification if complexity is high
		if (pivotDecision.complexity > 70) {
			artifacts.push("specification");
		}

		// Add roadmap if timeline impact is significant
		if (
			impact.timelineChange === "significant" ||
			impact.timelineChange === "major"
		) {
			artifacts.push("roadmap");
		}

		// Add diagram for architectural changes
		if (
			pivotDecision.alternatives.some(
				(alt) => alt.includes("architecture") || alt.includes("design"),
			)
		) {
			artifacts.push("diagram");
		}

		return artifacts;
	}

	private generateConversationStartersList(
		_pivotDecision: PivotDecision,
		_sessionState: DesignSessionState,
	): string[] {
		return [
			"Pivot Necessity: What specific indicators suggest we need to change direction now?",
			"Impact Assessment: How will this pivot affect our current timeline and deliverables?",
			"Resource Planning: What additional resources or expertise do we need for this pivot?",
			"Stakeholder Alignment: Which stakeholders need to be informed and how?",
			"Success Metrics: How will we measure the success of this pivot decision?",
			"Risk Mitigation: What are the key risks and how can we mitigate them?",
		];
	}

	private getComplexityDescription(complexity: number): string {
		if (complexity > 90) return "Critical - System complexity is unmanageable";
		if (complexity > 75)
			return "High - Complexity significantly impacts development";
		if (complexity > 60) return "Medium - Manageable but requires attention";
		return "Low - Complexity is within acceptable bounds";
	}

	private getEntropyDescription(entropy: number): string {
		if (entropy > 80)
			return "Critical - Too much uncertainty to proceed confidently";
		if (entropy > 65)
			return "High - Significant uncertainty affecting decisions";
		if (entropy > 45) return "Medium - Some uncertainty but manageable";
		return "Low - Uncertainty is within acceptable bounds";
	}

	private async getSpace7Guidance(_guidance: PivotGuidance): Promise<string> {
		return `Based on Space 7 General Instructions:
- Prioritize modular architecture and clear separation of concerns
- Ensure security considerations are built into the pivot decision
- Maintain comprehensive documentation throughout the transition
- Follow agile principles with iterative validation
- Implement automated testing and CI/CD practices

*Reference: Space 7 Architecture Guidelines and MCP Best Practices*`;
	}

	private getRelevantTemplates(
		pivotDecision: PivotDecision,
		templateRefs: Record<string, string>,
	) {
		const templates = [];

		// Always include design process template for pivots
		if (templateRefs.design_process) {
			templates.push({
				name: "Design Process Template",
				description: "Structured approach for managing design pivots",
				path: templateRefs.design_process,
			});
		}

		// Include architecture templates if complexity is architectural
		if (
			pivotDecision.alternatives.some(
				(alt) =>
					alt.includes("architecture") ||
					alt.includes("component") ||
					alt.includes("microservices"),
			) &&
			templateRefs.architecture_templates
		) {
			templates.push({
				name: "Architecture Templates",
				description: "Patterns and guidelines for architectural decisions",
				path: templateRefs.architecture_templates,
			});
		}

		// Include conversation starter for stakeholder management
		if (templateRefs.conversation_starter) {
			templates.push({
				name: "Conversation Starter",
				description: "Templates for stakeholder communication during pivots",
				path: templateRefs.conversation_starter,
			});
		}

		// Include Space 7 instructions if available
		if (templateRefs.space7_instructions) {
			templates.push({
				name: "Space 7 General Instructions",
				description: "Best practices and guidelines for MCP design",
				path: templateRefs.space7_instructions,
			});
		}

		return templates;
	}

	private getIncludedTemplates(pivotDecision: PivotDecision): string[] {
		const templates = ["Design Process Template"];

		if (
			pivotDecision.alternatives.some(
				(alt) =>
					alt.includes("architecture") ||
					alt.includes("component") ||
					alt.includes("microservices"),
			)
		) {
			templates.push("Architecture Templates");
		}

		templates.push("Conversation Starter");
		templates.push("Space 7 General Instructions");
		return templates;
	}
}

// Export singleton instance
export const strategicPivotPromptBuilder =
	new StrategicPivotPromptBuilderImpl();
