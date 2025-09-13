// Constraint Manager - Loads and validates design constraints from YAML/JSON config
import { z } from "zod";
import type { ConstraintRule, ValidationRule, DesignSessionConfig } from "./types.js";

// Validation schemas for constraint configuration
const ValidationRuleSchema = z.object({
	schema: z.record(z.unknown()).optional(),
	keywords: z.array(z.string()).optional(),
	minCoverage: z.number().optional(),
	customValidator: z.string().optional(),
});

const ConstraintRuleSchema = z.object({
	name: z.string(),
	description: z.string(),
	keywords: z.array(z.string()),
	weight: z.number(),
	mandatory: z.boolean(),
	validation: ValidationRuleSchema,
	source: z.string(),
});

const ConstraintConfigSchema = z.object({
	meta: z.object({
		version: z.string(),
		updated: z.string(),
		source: z.string(),
		coverage_threshold: z.number(),
	}),
	phases: z.record(z.object({
		name: z.string(),
		description: z.string(),
		min_coverage: z.number(),
		required_outputs: z.array(z.string()),
		criteria: z.array(z.string()),
	})),
	constraints: z.record(z.record(ConstraintRuleSchema)),
	coverage_rules: z.object({
		overall_minimum: z.number(),
		phase_minimum: z.number(),
		constraint_minimum: z.number(),
		documentation_minimum: z.number(),
		test_minimum: z.number(),
		pivot_thresholds: z.object({
			complexity_threshold: z.number(),
			entropy_threshold: z.number(),
			coverage_drop_threshold: z.number(),
		}),
	}),
	template_references: z.record(z.string()),
	micro_methods: z.record(z.array(z.string())),
	output_formats: z.record(z.object({
		format: z.string(),
		template: z.string().optional(),
		sections: z.array(z.string()).optional(),
		types: z.array(z.string()).optional(),
	})),
});

export type ConstraintConfig = z.infer<typeof ConstraintConfigSchema>;

export interface ConstraintValidationResult {
	passed: boolean;
	coverage: number;
	violations: ConstraintViolation[];
	recommendations: string[];
}

export interface ConstraintViolation {
	constraintId: string;
	severity: 'error' | 'warning' | 'info';
	message: string;
	suggestion: string;
}

class ConstraintManagerImpl {
	private config: ConstraintConfig | null = null;
	private loadedConstraints: Map<string, ConstraintRule> = new Map();

	async loadConstraintsFromConfig(configData: unknown): Promise<void> {
		try {
			this.config = ConstraintConfigSchema.parse(configData);
			this.loadedConstraints.clear();

			// Load constraints from config into a flat map for easy access
			for (const [category, constraints] of Object.entries(this.config.constraints)) {
				for (const [id, constraint] of Object.entries(constraints)) {
					const rule: ConstraintRule = {
						id: `${category}.${id}`,
						type: category as any,
						category,
						...constraint,
					};
					this.loadedConstraints.set(rule.id, rule);
				}
			}
		} catch (error) {
			throw new Error(`Failed to load constraint config: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	getConstraints(category?: string): ConstraintRule[] {
		const constraints = Array.from(this.loadedConstraints.values());
		return category ? constraints.filter(c => c.category === category) : constraints;
	}

	getConstraint(id: string): ConstraintRule | undefined {
		return this.loadedConstraints.get(id);
	}

	getMandatoryConstraints(): ConstraintRule[] {
		return Array.from(this.loadedConstraints.values()).filter(c => c.mandatory);
	}

	getPhaseRequirements(phaseId: string) {
		return this.config?.phases[phaseId] || null;
	}

	getCoverageThresholds() {
		return this.config?.coverage_rules || {
			overall_minimum: 85,
			phase_minimum: 80,
			constraint_minimum: 70,
			documentation_minimum: 75,
			test_minimum: 80,
			pivot_thresholds: {
				complexity_threshold: 85,
				entropy_threshold: 75,
				coverage_drop_threshold: 20,
			},
		};
	}

	getMicroMethods(category: string): string[] {
		return this.config?.micro_methods[category] || [];
	}

	getTemplateReferences(): Record<string, string> {
		return this.config?.template_references || {};
	}

	getOutputFormatSpec(type: string) {
		return this.config?.output_formats[type] || null;
	}

	validateConstraints(
		content: string,
		selectedConstraints?: string[]
	): ConstraintValidationResult {
		const constraintsToCheck = selectedConstraints
			? selectedConstraints.map(id => this.loadedConstraints.get(id)).filter(Boolean) as ConstraintRule[]
			: this.getMandatoryConstraints();

		const violations: ConstraintViolation[] = [];
		const recommendations: string[] = [];
		let totalCoverage = 0;
		let coveredConstraints = 0;

		for (const constraint of constraintsToCheck) {
			const coverage = this.calculateConstraintCoverage(content, constraint);
			const minCoverage = constraint.validation.minCoverage || 70;

			if (coverage >= minCoverage) {
				coveredConstraints++;
			} else {
				const severity = constraint.mandatory ? 'error' : 'warning';
				violations.push({
					constraintId: constraint.id,
					severity,
					message: `${constraint.name} coverage (${coverage}%) below threshold (${minCoverage}%)`,
					suggestion: `Consider addressing: ${constraint.description}`,
				});

				if (constraint.validation.keywords) {
					recommendations.push(
						`To improve ${constraint.name} coverage, include more content about: ${constraint.validation.keywords.join(', ')}`
					);
				}
			}

			totalCoverage += coverage;
		}

		const averageCoverage = constraintsToCheck.length > 0 ? totalCoverage / constraintsToCheck.length : 0;
		const passed = violations.filter(v => v.severity === 'error').length === 0;

		return {
			passed,
			coverage: averageCoverage,
			violations,
			recommendations,
		};
	}

	private calculateConstraintCoverage(content: string, constraint: ConstraintRule): number {
		const contentLower = content.toLowerCase();
		let coverage = 0;

		if (constraint.validation.keywords) {
			const keywordMatches = constraint.validation.keywords.filter(
				keyword => contentLower.includes(keyword.toLowerCase())
			);
			coverage = (keywordMatches.length / constraint.validation.keywords.length) * 100;
		}

		// Additional validation logic could be added here for schema-based validation
		// or custom validators

		return Math.min(coverage, 100);
	}

	generateCoverageReport(sessionConfig: DesignSessionConfig, content: string): {
		overall: number;
		phases: Record<string, number>;
		constraints: Record<string, number>;
		details: ConstraintValidationResult;
	} {
		const validation = this.validateConstraints(content, sessionConfig.constraints.map(c => c.id));
		
		// Calculate phase coverage (placeholder - would integrate with actual phase tracking)
		const phases: Record<string, number> = {};
		if (this.config) {
			for (const phaseId of Object.keys(this.config.phases)) {
				phases[phaseId] = this.calculatePhaseCoverage(content, phaseId);
			}
		}

		// Calculate individual constraint coverage
		const constraints: Record<string, number> = {};
		for (const constraint of sessionConfig.constraints) {
			constraints[constraint.id] = this.calculateConstraintCoverage(content, constraint);
		}

		return {
			overall: validation.coverage,
			phases,
			constraints,
			details: validation,
		};
	}

	private calculatePhaseCoverage(content: string, phaseId: string): number {
		const phase = this.config?.phases[phaseId];
		if (!phase) return 0;

		const contentLower = content.toLowerCase();
		let coverage = 0;
		let totalCriteria = phase.criteria.length;

		for (const criterion of phase.criteria) {
			if (contentLower.includes(criterion.toLowerCase())) {
				coverage++;
			}
		}

		return totalCriteria > 0 ? (coverage / totalCriteria) * 100 : 0;
	}
}

// Export singleton instance
export const constraintManager = new ConstraintManagerImpl();

// Default constraint configuration (embedded fallback)
export const DEFAULT_CONSTRAINT_CONFIG = {
	meta: {
		version: "1.0.0",
		updated: new Date().toISOString().slice(0, 10),
		source: "Default MCP Guidelines",
		coverage_threshold: 85,
	},
	phases: {
		discovery: {
			name: "Discovery & Context",
			description: "Establish context and objectives",
			min_coverage: 80,
			required_outputs: ["context", "objectives"],
			criteria: ["Clear problem definition", "Stakeholder identification"],
		},
		requirements: {
			name: "Requirements Analysis", 
			description: "Define requirements",
			min_coverage: 85,
			required_outputs: ["requirements"],
			criteria: ["Functional requirements", "Non-functional requirements"],
		},
		architecture: {
			name: "Architecture Design",
			description: "Design system architecture",
			min_coverage: 85,
			required_outputs: ["architecture"],
			criteria: ["Component design", "Interface definitions"],
		},
	},
	constraints: {
		technical: {
			documentation: {
				name: "Documentation Standards",
				description: "Proper documentation required",
				keywords: ["documentation", "docs", "readme"],
				weight: 10,
				mandatory: true,
				validation: { min_coverage: 80, keywords: ["documented", "explained"] },
				source: "Default Standards",
			},
		},
	},
	coverage_rules: {
		overall_minimum: 85,
		phase_minimum: 80,
		constraint_minimum: 70,
		documentation_minimum: 75,
		test_minimum: 80,
		pivot_thresholds: {
			complexity_threshold: 85,
			entropy_threshold: 75,
			coverage_drop_threshold: 20,
		},
	},
	template_references: {},
	micro_methods: {
		confirmation: ["validate_phase_completion", "check_coverage_threshold"],
		pivot: ["calculate_complexity_score", "suggest_alternatives"],
		coverage: ["calculate_phase_coverage", "generate_coverage_report"],
	},
	output_formats: {
		markdown: { format: "markdown", sections: ["Overview", "Details"] },
		mermaid: { format: "mermaid", types: ["flowchart", "sequence"] },
	},
};