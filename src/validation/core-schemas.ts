import { z } from "zod";

/**
 * Core Zod schemas for common skill parameters.
 *
 * These schemas provide robust input validation for all skill requests
 * with graceful error handling and runtime type safety.
 */

// Common parameter schemas
export const nonEmptyStringSchema = z
	.string()
	.min(1, "Must be a non-empty string");
export const optionalStringSchema = z.string().optional();
export const urlSchema = z.string().url("Must be a valid URL");
export const emailSchema = z.string().email("Must be a valid email address");
export const positiveIntSchema = z
	.number()
	.int()
	.positive("Must be a positive integer");
export const nonNegativeIntSchema = z
	.number()
	.int()
	.min(0, "Must be non-negative");

export const evidenceAuthoritySchema = z.enum([
	"official",
	"implementation",
	"ecosystem",
	"user",
]);

export const evidenceSourceTierSchema = z.union([
	z.literal(1),
	z.literal(2),
	z.literal(3),
	z.literal(4),
]);

export const evidenceSourceTypeSchema = z.enum([
	"webpage",
	"github-code",
	"github-issues",
	"github-repositories",
	"github-file",
	"context7-docs",
	"orchestration-config",
	"snapshot",
	"workspace-file",
	"other",
]);

export const instructionEvidenceItemSchema = z
	.object({
		sourceType: evidenceSourceTypeSchema,
		toolName: nonEmptyStringSchema.describe(
			"Name of the tool that retrieved this evidence",
		),
		locator: nonEmptyStringSchema.describe(
			"Canonical locator for the evidence (URL, path, issue ref, etc.)",
		),
		title: optionalStringSchema.describe(
			"Human-readable label for the evidence",
		),
		query: optionalStringSchema.describe(
			"Query or search phrase used to gather the evidence",
		),
		summary: optionalStringSchema.describe(
			"Normalized summary of the evidence",
		),
		excerpt: optionalStringSchema.describe(
			"Relevant excerpt from the evidence",
		),
		retrievedAt: z
			.string()
			.datetime()
			.optional()
			.describe("When the evidence was retrieved"),
		authority: evidenceAuthoritySchema.optional(),
		sourceTier: evidenceSourceTierSchema.optional(),
	})
	.passthrough();

export const evidenceOptionsSchema = z
	.object({
		evidence: z
			.array(instructionEvidenceItemSchema)
			.max(24, "Evidence is limited to 24 items")
			.optional()
			.describe("Structured evidence gathered from read-only tools"),
	})
	.passthrough();

// Skill-specific parameter schemas
export const skillRequestSchema = z
	.object({
		request: nonEmptyStringSchema.describe(
			"The primary task request for this skill",
		),
		context: optionalStringSchema.describe("Relevant background context"),
		constraints: z
			.array(z.string())
			.optional()
			.describe("Known constraints or limitations"),
		successCriteria: optionalStringSchema.describe("How to measure success"),
		deliverable: optionalStringSchema.describe(
			"Expected output format or deliverable type",
		),
		options: z
			.record(z.unknown())
			.optional()
			.describe("Additional skill-specific options"),
	})
	.passthrough()
	.describe("Base schema for all skill inputs");

// Model class validation
export const modelClassSchema = z
	.enum(["free", "cheap", "strong", "reviewer"])
	.describe("Valid model classification");

// Priority levels for planning/strategy skills
export const priorityLevelSchema = z
	.enum(["low", "medium", "high", "critical"])
	.describe("Priority classification");

// File path validation (for security)
export const safeFilePathSchema = z
	.string()
	.refine(
		(path) => !path.includes("..") && !path.startsWith("/tmp"),
		"File path must be safe (no .. traversal or /tmp access)",
	);

// Architecture-specific schemas
export const architectureRequirementSchema = z.object({
	type: z.enum(["functional", "non-functional", "constraint"]),
	priority: priorityLevelSchema,
	description: nonEmptyStringSchema,
	measurable: z.boolean().optional(),
	deadline: z.string().optional(),
});

export const comparisonAxisSchema = z.object({
	name: nonEmptyStringSchema,
	weight: z.number().min(0).max(1),
	description: optionalStringSchema,
});

// Quality metrics
export const qualityMetricSchema = z.object({
	name: nonEmptyStringSchema,
	value: z.number(),
	threshold: z.number().optional(),
	unit: optionalStringSchema,
	trend: z.enum(["improving", "degrading", "stable"]).optional(),
});

// Physics skill input (gated)
// Aligns with the `hasPhysicsJustification` gate used throughout the runtime
// (workflow-engine.ts, skill-handler.ts, workflow-spec.ts, InstructionInput).
// `physicsAnalysisJustification` is REQUIRED here so that criticalSkillGuard
// correctly blocks physics skills that lack a valid justification.
export const physicsSkillSchema = skillRequestSchema.extend({
	physicsAnalysisJustification: nonEmptyStringSchema
		.refine(
			(val) => val.replace(/\s/g, "").length >= 20,
			"physicsAnalysisJustification must contain at least 20 non-whitespace characters explaining why physics-analysis metaphors are appropriate",
		)
		.describe(
			"Why physics-analysis metaphors are appropriate for this task (≥ 20 non-whitespace chars). Required by the hasPhysicsJustification gate.",
		),
	confidenceTier: z.enum(["proven", "experimental", "exploratory"]).optional(),
});

// Governance and compliance schemas
export const complianceRequirementSchema = z.object({
	domain: z.enum([
		"healthcare",
		"finance",
		"government",
		"gdpr",
		"hipaa",
		"sox",
	]),
	level: z.enum(["advisory", "required", "mandatory"]),
	description: nonEmptyStringSchema,
	auditRequired: z.boolean().default(false),
});

// Evaluation schemas
export const evaluationCriteriaSchema = z.object({
	metric: nonEmptyStringSchema,
	expectedValue: z.union([z.number(), z.string(), z.boolean()]),
	tolerance: z.number().optional(),
	required: z.boolean().default(true),
});

export const benchmarkConfigSchema = z.object({
	name: nonEmptyStringSchema,
	description: optionalStringSchema,
	criteria: z.array(evaluationCriteriaSchema),
	iterations: positiveIntSchema.default(1),
	timeout: positiveIntSchema.optional(),
});

// Adaptive routing schemas
export const routingMetricSchema = z.object({
	pathId: nonEmptyStringSchema,
	successRate: z.number().min(0).max(1),
	avgLatency: z.number().min(0),
	lastUsed: z.string().datetime().optional(),
});

// Persistence / session-state schemas
// Validates ExecutionProgressRecord written to and read from SessionStateStore.
export const executionProgressRecordSchema = z.object({
	stepLabel: nonEmptyStringSchema.describe(
		"Human-readable label for this execution step",
	),
	kind: nonEmptyStringSchema.describe(
		"Step kind discriminator (e.g. 'skill', 'workflow', 'gate')",
	),
	summary: nonEmptyStringSchema.describe("Brief summary of the step outcome"),
});

// Error boundary schemas
export const errorContextSchema = z.object({
	skillId: nonEmptyStringSchema,
	inputHash: optionalStringSchema,
	timestamp: z.string().datetime(),
	errorType: z.enum(["validation", "execution", "timeout", "model", "network"]),
	recoverable: z.boolean().default(true),
});

// Schema validation result type
export type ValidationResult<T> =
	| { success: true; data: T }
	| { success: false; error: ValidationError };

export interface ValidationError {
	code: string;
	message: string;
	path?: (string | number)[];
	context?: Record<string, unknown>;
}

/**
 * Safe parsing utility that returns a consistent result format
 */
export function safeValidate<T>(
	schema: z.ZodType<T>,
	data: unknown,
	context?: Record<string, unknown>,
): ValidationResult<T> {
	const result = schema.safeParse(data);

	if (result.success) {
		return { success: true, data: result.data };
	}

	const firstIssue = result.error.issues[0];
	const error: ValidationError = {
		code: firstIssue?.code || "validation_error",
		message: firstIssue?.message || "Validation failed",
		path: firstIssue?.path,
		context,
	};

	return { success: false, error };
}

/**
 * Create a schema validator function
 */
export function createValidator<T>(schema: z.ZodType<T>) {
	return (data: unknown, context?: Record<string, unknown>) =>
		safeValidate(schema, data, context);
}

// Common validators ready for use
export const validateSkillRequest = createValidator(skillRequestSchema);
export const validatePhysicsSkillRequest = createValidator(physicsSkillSchema);
export const validateBenchmarkConfig = createValidator(benchmarkConfigSchema);
export const validateComplianceRequirement = createValidator(
	complianceRequirementSchema,
);
export const validateExecutionProgressRecord = createValidator(
	executionProgressRecordSchema,
);
