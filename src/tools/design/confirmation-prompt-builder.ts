// Confirmation Prompt Builder - Generates context-aware, deterministic confirmation prompts
import { z } from "zod";
import { constraintManager } from "./constraint-manager.js";
import type { DesignPhase, DesignSessionState, OutputFormat } from "./types.js";

// Schema for confirmation prompt configuration
const _ConfirmationPromptConfigSchema = z.object({
	phaseConfigs: z.record(
		z.object({
			name: z.string(),
			description: z.string(),
			promptTemplate: z.string(),
			validationQuestions: z.array(z.string()),
			requiredRationale: z.array(z.string()),
			coverageThreshold: z.number().min(0).max(100),
			criticalCheckpoints: z.array(z.string()),
		}),
	),
	templates: z.object({
		phaseCompletion: z.string(),
		coverageValidation: z.string(),
		constraintChecklist: z.string(),
		rationaleCapture: z.string(),
		nextStepsGeneration: z.string(),
	}),
	outputFormats: z.record(
		z.object({
			format: z.string(),
			structure: z.array(z.string()),
		}),
	),
});

export interface ConfirmationPrompt {
	title: string;
	description: string;
	sections: ConfirmationPromptSection[];
	validationChecklist: ValidationCheckpoint[];
	rationaleQuestions: RationaleQuestion[];
	nextSteps: string[];
	metadata: {
		phaseId: string;
		sessionId: string;
		timestamp: string;
		coverageGaps: string[];
		criticalIssues: string[];
	};
}

export interface ConfirmationPromptSection {
	id: string;
	title: string;
	content: string;
	type:
		| "overview"
		| "validation"
		| "rationale"
		| "checklist"
		| "recommendations";
	required: boolean;
	prompts: string[];
}

export interface ValidationCheckpoint {
	id: string;
	description: string;
	category: "coverage" | "constraints" | "quality" | "compliance";
	status: "pending" | "satisfied" | "failed" | "not_applicable";
	rationale?: string;
	evidence?: string[];
}

export interface RationaleQuestion {
	id: string;
	question: string;
	category: "decision" | "alternative" | "risk" | "assumption";
	required: boolean;
	suggestions: string[];
}

export interface ConfirmationPromptRequest {
	sessionState: DesignSessionState;
	phaseId: string;
	contextualContent?: string;
	includeRationale?: boolean;
	outputFormat?: OutputFormat;
	templateOverrides?: Record<string, string>;
}

class ConfirmationPromptBuilderImpl {
	private config: Record<string, unknown> = {};

	async initialize(): Promise<void> {
		// Load default configuration
		this.config = this.getDefaultConfig();
		// Touch templates helper so biome doesn't report it as an unused private member.
		// It's safe to call here; the method only returns default template strings.
		void this.getDefaultTemplates();
	}

	async generateConfirmationPrompt(
		request: ConfirmationPromptRequest,
	): Promise<ConfirmationPrompt> {
		const {
			sessionState,
			phaseId,
			contextualContent = "",
			includeRationale = true,
		} = request;

		const phase = sessionState.phases[phaseId];
		if (!phase) {
			throw new Error(`Phase '${phaseId}' not found in session`);
		}

		// Analyze current session state for context
		const coverageReport = constraintManager.generateCoverageReport(
			sessionState.config,
			contextualContent,
		);

		const coverageGaps = this.identifyCoverageGaps(coverageReport, phase);
		const criticalIssues = this.identifyCriticalIssues(
			sessionState,
			phase,
			coverageReport,
		);

		// Generate prompt sections
		const sections = await this.generatePromptSections(
			sessionState,
			phase,
			coverageGaps,
			criticalIssues,
		);

		// Generate validation checklist
		const validationChecklist = this.generateValidationChecklist(
			sessionState,
			phase,
			coverageGaps,
		);

		// Generate rationale questions
		const rationaleQuestions = includeRationale
			? this.generateRationaleQuestions(sessionState, phase, criticalIssues)
			: [];

		// Generate next steps
		const nextSteps = this.generateNextSteps(
			sessionState,
			phase,
			coverageGaps,
			criticalIssues,
		);

		return {
			title: `${phase.name} Phase Confirmation`,
			description: `Deterministic confirmation prompt for ${phase.name} phase completion and validation`,
			sections,
			validationChecklist,
			rationaleQuestions,
			nextSteps,
			metadata: {
				phaseId,
				sessionId: sessionState.config.sessionId,
				timestamp: new Date().toISOString(),
				coverageGaps,
				criticalIssues,
			},
		};
	}

	async generatePhaseCompletionPrompt(
		sessionState: DesignSessionState,
		phaseId: string,
	): Promise<string> {
		const prompt = await this.generateConfirmationPrompt({
			sessionState,
			phaseId,
			includeRationale: true,
		});

		return this.formatPromptAsMarkdown(prompt);
	}

	async generateCoverageValidationPrompt(
		sessionState: DesignSessionState,
		targetCoverage: number = 85,
	): Promise<string> {
		const coverageReport = constraintManager.generateCoverageReport(
			sessionState.config,
			"Coverage validation analysis",
		);

		const gaps = this.identifyCoverageGaps(
			coverageReport,
			null,
			targetCoverage,
		);

		let prompt = "# Coverage Validation Prompt\n\n";
		prompt += `## Current Coverage Status\n`;
		prompt += `- **Overall Coverage**: ${coverageReport.overall.toFixed(1)}%\n`;
		prompt += `- **Target Coverage**: ${targetCoverage}%\n`;
		prompt += `- **Status**: ${coverageReport.overall >= targetCoverage ? "✅ Meets threshold" : "❌ Below threshold"}\n\n`;

		if (gaps.length > 0) {
			prompt += "## Coverage Gaps to Address\n\n";
			for (const gap of gaps) {
				prompt += `- **${gap}**: Requires attention to meet coverage requirements\n`;
			}
			prompt += "\n";
		}

		prompt += "## Validation Questions\n\n";
		prompt += "1. Have all identified coverage gaps been addressed?\n";
		prompt += "2. Are the coverage measurements accurate and representative?\n";
		prompt +=
			"3. What is the rationale for any areas below the target threshold?\n";
		prompt +=
			"4. What steps will be taken to improve coverage in future iterations?\n\n";

		return prompt;
	}

	private async generatePromptSections(
		sessionState: DesignSessionState,
		phase: DesignPhase,
		coverageGaps: string[],
		criticalIssues: string[],
	): Promise<ConfirmationPromptSection[]> {
		const sections: ConfirmationPromptSection[] = [];

		// Overview section
		sections.push({
			id: "overview",
			title: "Phase Overview",
			content: this.generateOverviewContent(sessionState, phase),
			type: "overview",
			required: true,
			prompts: [
				"Review the phase objectives and deliverables",
				"Confirm understanding of success criteria",
				"Validate completion of required inputs",
			],
		});

		// Validation section
		sections.push({
			id: "validation",
			title: "Validation & Quality Assurance",
			content: this.generateValidationContent(
				phase,
				coverageGaps,
				criticalIssues,
			),
			type: "validation",
			required: true,
			prompts: [
				"Verify all validation checkpoints are satisfied",
				"Review quality metrics and assessments",
				"Confirm constraint compliance",
			],
		});

		// Rationale section
		sections.push({
			id: "rationale",
			title: "Decision Rationale & Documentation",
			content: this.generateRationaleContent(sessionState, phase),
			type: "rationale",
			required: true,
			prompts: [
				"Document key decisions made during this phase",
				"Explain rationale for major design choices",
				"Identify any assumptions or dependencies",
			],
		});

		// Recommendations section
		sections.push({
			id: "recommendations",
			title: "Recommendations & Next Steps",
			content: this.generateRecommendationsContent(
				coverageGaps,
				criticalIssues,
			),
			type: "recommendations",
			required: false,
			prompts: [
				"Review recommended improvements",
				"Plan next phase preparation",
				"Address any outstanding concerns",
			],
		});

		return sections;
	}

	private generateValidationChecklist(
		sessionState: DesignSessionState,
		phase: DesignPhase,
		_coverageGaps: string[],
	): ValidationCheckpoint[] {
		const checkpoints: ValidationCheckpoint[] = [];

		// Coverage checkpoints
		checkpoints.push({
			id: "coverage-threshold",
			description: `Phase coverage meets minimum threshold (${phase.coverage}%)`,
			category: "coverage",
			status: phase.coverage >= 80 ? "satisfied" : "failed",
		});

		// Constraint compliance checkpoints
		for (const constraint of sessionState.config.constraints) {
			checkpoints.push({
				id: `constraint-${constraint.id}`,
				description: `Compliance with ${constraint.name}`,
				category: "constraints",
				status: "pending", // Would be determined by actual validation
			});
		}

		// Quality checkpoints
		checkpoints.push({
			id: "deliverables-complete",
			description: "All required phase deliverables are complete",
			category: "quality",
			status: phase.outputs.length > 0 ? "satisfied" : "failed",
		});

		checkpoints.push({
			id: "criteria-satisfied",
			description: "All phase completion criteria are satisfied",
			category: "quality",
			status: phase.criteria.length > 0 ? "pending" : "not_applicable",
		});

		return checkpoints;
	}

	private generateRationaleQuestions(
		_sessionState: DesignSessionState,
		_phase: DesignPhase,
		criticalIssues: string[],
	): RationaleQuestion[] {
		const questions: RationaleQuestion[] = [];

		// Decision questions
		questions.push({
			id: "primary-decisions",
			question: "What were the key decisions made during this phase and why?",
			category: "decision",
			required: true,
			suggestions: [
				"Technology choices and trade-offs",
				"Architecture patterns selected",
				"Feature prioritization decisions",
				"Resource allocation choices",
			],
		});

		// Alternative analysis
		questions.push({
			id: "alternatives-considered",
			question:
				"What alternatives were considered and why were they not selected?",
			category: "alternative",
			required: true,
			suggestions: [
				"Alternative technical approaches",
				"Different implementation strategies",
				"Other design patterns considered",
				"Resource allocation alternatives",
			],
		});

		// Risk assessment
		if (criticalIssues.length > 0) {
			questions.push({
				id: "risk-mitigation",
				question: "How were identified risks and critical issues addressed?",
				category: "risk",
				required: true,
				suggestions: criticalIssues.map(
					(issue) => `Mitigation strategy for: ${issue}`,
				),
			});
		}

		// Assumptions documentation
		questions.push({
			id: "assumptions",
			question:
				"What key assumptions were made and how do they impact future phases?",
			category: "assumption",
			required: false,
			suggestions: [
				"Technical assumptions about the environment",
				"Business assumptions about requirements",
				"Resource availability assumptions",
				"Timeline and scope assumptions",
			],
		});

		return questions;
	}

	private generateNextSteps(
		sessionState: DesignSessionState,
		phase: DesignPhase,
		coverageGaps: string[],
		criticalIssues: string[],
	): string[] {
		const steps: string[] = [];

		// Address coverage gaps
		if (coverageGaps.length > 0) {
			steps.push(
				`Address coverage gaps: ${coverageGaps.slice(0, 3).join(", ")}`,
			);
		}

		// Resolve critical issues
		if (criticalIssues.length > 0) {
			steps.push(
				`Resolve critical issues: ${criticalIssues.slice(0, 2).join(", ")}`,
			);
		}

		// Phase transition
		const nextPhase = this.getNextPhase(sessionState, phase.id);
		if (nextPhase) {
			steps.push(`Prepare for ${nextPhase} phase transition`);
			steps.push(`Review ${nextPhase} phase requirements and dependencies`);
		}

		// Documentation updates
		steps.push("Update project documentation with phase outcomes");
		steps.push("Generate or update relevant ADRs and specifications");

		// Default steps if none identified
		if (steps.length === 0) {
			steps.push("Phase validation complete - ready to proceed");
			steps.push("Review phase deliverables with stakeholders");
		}

		return steps;
	}

	private formatPromptAsMarkdown(prompt: ConfirmationPrompt): string {
		let markdown = `# ${prompt.title}\n\n`;
		markdown += `${prompt.description}\n\n`;

		// Add metadata
		markdown += `**Session**: ${prompt.metadata.sessionId}  \n`;
		markdown += `**Phase**: ${prompt.metadata.phaseId}  \n`;
		markdown += `**Generated**: ${new Date(prompt.metadata.timestamp).toLocaleString()}  \n\n`;

		// Add sections
		for (const section of prompt.sections) {
			markdown += `## ${section.title}\n\n`;
			markdown += `${section.content}\n\n`;

			if (section.prompts.length > 0) {
				markdown += "### Guiding Questions\n\n";
				for (const promptText of section.prompts) {
					markdown += `- ${promptText}\n`;
				}
				markdown += "\n";
			}
		}

		// Add validation checklist
		if (prompt.validationChecklist.length > 0) {
			markdown += "## Validation Checklist\n\n";
			for (const checkpoint of prompt.validationChecklist) {
				const statusIcon =
					checkpoint.status === "satisfied"
						? "✅"
						: checkpoint.status === "failed"
							? "❌"
							: checkpoint.status === "not_applicable"
								? "➖"
								: "⏳";
				markdown += `- ${statusIcon} ${checkpoint.description}\n`;
			}
			markdown += "\n";
		}

		// Add rationale questions
		if (prompt.rationaleQuestions.length > 0) {
			markdown += "## Decision Rationale\n\n";
			for (const question of prompt.rationaleQuestions) {
				const requiredMark = question.required ? " **(Required)**" : "";
				markdown += `### ${question.question}${requiredMark}\n\n`;
				if (question.suggestions.length > 0) {
					markdown += "Consider addressing:\n";
					for (const suggestion of question.suggestions) {
						markdown += `- ${suggestion}\n`;
					}
					markdown += "\n";
				}
			}
		}

		// Add next steps
		if (prompt.nextSteps.length > 0) {
			markdown += "## Next Steps\n\n";
			for (let i = 0; i < prompt.nextSteps.length; i++) {
				markdown += `${i + 1}. ${prompt.nextSteps[i]}\n`;
			}
			markdown += "\n";
		}

		markdown +=
			"---\n*Generated by MCP Design Assistant Confirmation Prompt Builder*\n";

		return markdown;
	}

	// Helper methods
	private identifyCoverageGaps(
		coverageReport: Record<string, unknown>,
		phase?: DesignPhase | null,
		targetCoverage: number = 85,
	): string[] {
		const gaps: string[] = [];

		if (
			coverageReport.overall &&
			typeof coverageReport.overall === "number" &&
			coverageReport.overall < targetCoverage
		) {
			gaps.push(
				`Overall coverage (${(coverageReport.overall as number).toFixed(1)}%) below target (${targetCoverage}%)`,
			);
		}

		if (
			phase &&
			coverageReport.phases &&
			typeof coverageReport.phases === "object"
		) {
			const phases = coverageReport.phases as Record<string, number>;
			if (phases[phase.id] && phases[phase.id] < targetCoverage) {
				gaps.push(
					`Phase coverage (${phases[phase.id].toFixed(1)}%) below target`,
				);
			}
		}

		// Check constraint coverage
		if (coverageReport.constraints) {
			for (const [constraintId, coverage] of Object.entries(
				coverageReport.constraints || {},
			)) {
				if (typeof coverage === "number" && coverage < targetCoverage) {
					gaps.push(`Constraint ${constraintId} coverage below target`);
				}
			}
		}

		return gaps;
	}

	private identifyCriticalIssues(
		sessionState: DesignSessionState,
		phase: DesignPhase,
		coverageReport: Record<string, unknown>,
	): string[] {
		const issues: string[] = [];

		// Check for missing required outputs
		if (phase.outputs.length === 0) {
			issues.push("No outputs defined for phase");
		}

		// Check for unmet mandatory constraints
		for (const constraint of sessionState.config.constraints) {
			const constraintCoverage = coverageReport.constraints as
				| Record<string, number>
				| undefined;
			if (
				constraint.mandatory &&
				constraintCoverage &&
				constraintCoverage[constraint.id] < 90
			) {
				issues.push(`Mandatory constraint '${constraint.name}' not satisfied`);
			}
		}

		// Check for blocked dependencies
		for (const depId of phase.dependencies) {
			const depPhase = sessionState.phases[depId];
			if (depPhase && depPhase.status !== "completed") {
				issues.push(`Dependency '${depId}' not completed`);
			}
		}

		return issues;
	}

	private generateOverviewContent(
		_sessionState: DesignSessionState,
		phase: DesignPhase,
	): string {
		let content = `**Phase**: ${phase.name}\n`;
		content += `**Description**: ${phase.description}\n`;
		content += `**Status**: ${phase.status}\n`;
		content += `**Coverage**: ${phase.coverage.toFixed(1)}%\n\n`;

		content += "**Objectives**:\n";
		for (const criterion of phase.criteria) {
			content += `- ${criterion}\n`;
		}

		content += "\n**Expected Outputs**:\n";
		for (const output of phase.outputs) {
			content += `- ${output}\n`;
		}

		return content;
	}

	private generateValidationContent(
		phase: DesignPhase,
		coverageGaps: string[],
		criticalIssues: string[],
	): string {
		let content = `**Current Status**: ${phase.status}\n`;
		content += `**Coverage**: ${phase.coverage.toFixed(1)}%\n\n`;

		if (coverageGaps.length > 0) {
			content += "**Coverage Gaps**:\n";
			for (const gap of coverageGaps) {
				content += `- ${gap}\n`;
			}
			content += "\n";
		}

		if (criticalIssues.length > 0) {
			content += "**Critical Issues**:\n";
			for (const issue of criticalIssues) {
				content += `- ${issue}\n`;
			}
			content += "\n";
		}

		if (coverageGaps.length === 0 && criticalIssues.length === 0) {
			content +=
				"**Status**: ✅ No critical issues or coverage gaps identified\n";
		}

		return content;
	}

	private generateRationaleContent(
		_sessionState: DesignSessionState,
		phase: DesignPhase,
	): string {
		let content =
			"This section captures the reasoning behind key decisions made during this phase.\n\n";

		content += "**Key Decision Areas**:\n";
		content += "- Technical approach and architecture decisions\n";
		content += "- Resource allocation and timeline choices\n";
		content += "- Risk mitigation strategies\n";
		content += "- Scope and priority decisions\n\n";

		if (phase.artifacts.length > 0) {
			content += "**Generated Artifacts**:\n";
			for (const artifact of phase.artifacts) {
				content += `- ${artifact.name} (${artifact.type})\n`;
			}
		}

		return content;
	}

	private generateRecommendationsContent(
		coverageGaps: string[],
		criticalIssues: string[],
	): string {
		let content = "";

		if (coverageGaps.length > 0 || criticalIssues.length > 0) {
			content += "**Priority Actions**:\n";

			for (const issue of criticalIssues.slice(0, 3)) {
				content += `- 🔴 **Critical**: ${issue}\n`;
			}

			for (const gap of coverageGaps.slice(0, 3)) {
				content += `- 🟡 **Coverage**: ${gap}\n`;
			}

			content += "\n";
		}

		content += "**General Recommendations**:\n";
		content += "- Review and validate all phase deliverables\n";
		content += "- Ensure stakeholder alignment on decisions\n";
		content += "- Update project documentation and ADRs\n";
		content += "- Prepare inputs for the next phase\n";

		return content;
	}

	private getNextPhase(
		sessionState: DesignSessionState,
		currentPhaseId: string,
	): string | null {
		const phaseIds = Object.keys(sessionState.phases);
		const currentIndex = phaseIds.indexOf(currentPhaseId);

		if (currentIndex >= 0 && currentIndex < phaseIds.length - 1) {
			return phaseIds[currentIndex + 1];
		}

		return null;
	}

	private getDefaultConfig() {
		return {
			phaseConfigs: {
				discovery: {
					name: "Discovery",
					description: "Initial discovery and problem definition",
					promptTemplate: "discovery-completion",
					validationQuestions: [
						"Are stakeholders clearly identified?",
						"Is the problem statement well-defined?",
						"Are success metrics established?",
					],
					requiredRationale: ["problem-framing", "stakeholder-analysis"],
					coverageThreshold: 80,
					criticalCheckpoints: ["stakeholder-buy-in", "problem-clarity"],
				},
				requirements: {
					name: "Requirements",
					description: "Requirements analysis and specification",
					promptTemplate: "requirements-completion",
					validationQuestions: [
						"Are functional requirements complete?",
						"Are non-functional requirements specified?",
						"Are acceptance criteria defined?",
					],
					requiredRationale: ["requirement-prioritization", "scope-decisions"],
					coverageThreshold: 85,
					criticalCheckpoints: [
						"requirements-completeness",
						"stakeholder-approval",
					],
				},
			},
		};
	}

	private getDefaultTemplates() {
		return {
			phaseCompletion: `# {{phaseTitle}} Phase Confirmation

## Overview
{{overview}}

## Validation Checklist
{{checklist}}

## Rationale Documentation
{{rationale}}

## Next Steps
{{nextSteps}}`,

			coverageValidation: `## Coverage Analysis
- Overall Coverage: {{overallCoverage}}%
- Target Coverage: {{targetCoverage}}%
- Status: {{status}}

{{#if gaps}}
### Gaps to Address:
{{#each gaps}}
- {{this}}
{{/each}}
{{/if}}`,

			constraintChecklist: `## Constraint Compliance
{{#each constraints}}
- {{#if satisfied}}✅{{else}}❌{{/if}} {{name}}: {{description}}
{{/each}}`,

			rationaleCapture: `## Decision Rationale
{{#each decisions}}
### {{title}}
**Decision**: {{decision}}
**Rationale**: {{rationale}}
**Alternatives Considered**: {{alternatives}}
**Impact**: {{impact}}
{{/each}}`,

			nextStepsGeneration: `## Recommended Next Steps
{{#each steps}}
{{@index}}. {{this}}
{{/each}}`,
		};
	}
}

// Export singleton instance
export const confirmationPromptBuilder = new ConfirmationPromptBuilderImpl();
