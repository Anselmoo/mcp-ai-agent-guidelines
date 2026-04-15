import type { z } from "zod";
import type { InstructionInput } from "../contracts/runtime.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import {
	physicsSkillSchema,
	safeValidate,
	type ValidationResult,
} from "./core-schemas.js";
import {
	type ErrorContext,
	InputSanitizer,
	ValidationError,
} from "./error-handling.js";

/**
 * Input sanitization and validation guards.
 *
 * Protects against malformed inputs, validates skill parameters before execution,
 * and adds safety checks for file operations and external calls.
 */

export interface ValidationOptions {
	strict?: boolean;
	sanitize?: boolean;
	allowPhysicsSkills?: boolean;
	maxInputLength?: number;
	allowFileOperations?: boolean;
	allowNetworkAccess?: boolean;
	traceValidation?: boolean;
}

export interface ValidationGuardResult<T> {
	success: boolean;
	data?: T;
	errors: string[];
	warnings: string[];
	sanitized: boolean;
	context?: ErrorContext;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Main validation guard for skill inputs
 */
export async function validateSkillInput<T = InstructionInput>(
	input: unknown,
	schema: z.ZodType<T>,
	context: Partial<ErrorContext>,
	options: ValidationOptions = {},
): Promise<ValidationGuardResult<T>> {
	const {
		strict = false,
		sanitize = true,
		allowPhysicsSkills = false,
		maxInputLength = 10000,
		allowFileOperations = true,
		allowNetworkAccess = true,
		traceValidation = false,
	} = options;

	const errors: string[] = [];
	const warnings: string[] = [];
	let sanitized = false;
	let processedInput = input;

	const errorContext = {
		timestamp: new Date().toISOString(),
		...context,
	};

	try {
		// Step 1: Basic type and structure validation
		if (!isRecord(input)) {
			errors.push("Input must be an object");
			return {
				success: false,
				errors,
				warnings,
				sanitized,
				context: errorContext,
			};
		}

		const inputObj = input;

		// Step 2: Check for required 'request' field
		if (!inputObj.request || typeof inputObj.request !== "string") {
			errors.push(
				"Input must contain a 'request' field with a non-empty string",
			);
			return {
				success: false,
				errors,
				warnings,
				sanitized,
				context: errorContext,
			};
		}

		// Step 3: Input sanitization (if enabled)
		if (sanitize) {
			try {
				const sanitizedObj = await sanitizeInputObject(inputObj, {
					maxInputLength,
					allowFileOperations,
					allowNetworkAccess,
				});
				processedInput = sanitizedObj;
				sanitized = true;

				if (traceValidation) {
					console.debug(
						`Input sanitized for ${context.skillId || "unknown skill"}`,
					);
				}
			} catch (error) {
				const message = toErrorMessage(error);
				errors.push(`Sanitization failed: ${message}`);

				if (strict) {
					return {
						success: false,
						errors,
						warnings,
						sanitized,
						context: errorContext,
					};
				} else {
					warnings.push(
						`Sanitization warning: ${message} (proceeding with original input)`,
					);
				}
			}
		}

		// Step 4: Physics skills gate check
		if (
			context.skillId?.startsWith("qm-") ||
			context.skillId?.startsWith("gr-")
		) {
			if (!allowPhysicsSkills) {
				errors.push(
					"Physics skills are disabled. Enable with ENABLE_PHYSICS_SKILLS=true or check authorization.",
				);
				return {
					success: false,
					errors,
					warnings,
					sanitized,
					context: errorContext,
				};
			}

			// Physics skills require physicsAnalysisJustification
			const physicsValidation = safeValidate(
				physicsSkillSchema,
				processedInput,
			);
			if (!physicsValidation.success) {
				errors.push(
					`Physics skill validation failed: ${physicsValidation.error.message}`,
				);

				if (strict) {
					return {
						success: false,
						errors,
						warnings,
						sanitized,
						context: errorContext,
					};
				} else {
					warnings.push(
						"Physics skill missing physicsAnalysisJustification — provide ≥ 20 non-whitespace chars explaining why physics-analysis metaphors are appropriate",
					);
				}
			}
		}

		// Step 5: Schema validation
		const validation = safeValidate(schema, processedInput, errorContext);
		if (!validation.success) {
			errors.push(`Schema validation failed: ${validation.error.message}`);

			if (validation.error.path) {
				errors.push(`Field path: ${validation.error.path.join(".")}`);
			}

			return {
				success: false,
				errors,
				warnings,
				sanitized,
				context: errorContext,
			};
		}

		// Step 6: Content-specific validations
		const contentWarnings = validateInputContent(
			validation.data as InstructionInput,
		);
		warnings.push(...contentWarnings);

		if (traceValidation) {
			console.debug(
				`Validation passed for ${context.skillId || "unknown skill"} with ${warnings.length} warnings`,
			);
		}

		return {
			success: true,
			data: validation.data,
			errors,
			warnings,
			sanitized,
			context: errorContext,
		};
	} catch (error) {
		const message = toErrorMessage(error);
		errors.push(`Validation guard error: ${message}`);

		return {
			success: false,
			errors,
			warnings,
			sanitized,
			context: {
				...errorContext,
				stackTrace: error instanceof Error ? error.stack : undefined,
			},
		};
	}
}

/**
 * Sanitize input object recursively
 */
export async function sanitizeInputObject(
	obj: Record<string, unknown>,
	options: {
		maxInputLength: number;
		allowFileOperations: boolean;
		allowNetworkAccess: boolean;
	},
): Promise<Record<string, unknown>> {
	const sanitized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === "string") {
			// Sanitize string values
			try {
				let sanitizedValue = InputSanitizer.sanitizeString(
					value,
					options.maxInputLength,
				);

				// Special handling for specific fields
				if (
					key.toLowerCase().includes("path") ||
					key.toLowerCase().includes("file")
				) {
					if (!options.allowFileOperations) {
						throw new ValidationError("File operations are disabled", {
							timestamp: new Date().toISOString(),
						});
					}
					sanitizedValue = InputSanitizer.sanitizeFilePath(sanitizedValue);
				}

				if (key.toLowerCase().includes("url") || value.match(/^https?:\/\//)) {
					if (!options.allowNetworkAccess) {
						throw new ValidationError("Network access is disabled", {
							timestamp: new Date().toISOString(),
						});
					}
					sanitizedValue = InputSanitizer.sanitizeUrl(sanitizedValue);
				}

				sanitized[key] = sanitizedValue;
			} catch (error) {
				throw new ValidationError(
					`Failed to sanitize field '${key}': ${toErrorMessage(error)}`,
					{ timestamp: new Date().toISOString() },
				);
			}
		} else if (Array.isArray(value)) {
			// Sanitize array values
			sanitized[key] = await Promise.all(
				value.map(async (item) => {
					if (typeof item === "string") {
						return InputSanitizer.sanitizeString(item, options.maxInputLength);
					} else if (isRecord(item)) {
						return sanitizeInputObject(item, options);
					}
					return item;
				}),
			);
		} else if (isRecord(value)) {
			// Recursively sanitize nested objects
			sanitized[key] = await sanitizeInputObject(value, options);
		} else {
			// Keep other types as-is
			sanitized[key] = value;
		}
	}

	return sanitized;
}

/**
 * Validate input content for common issues
 */
function validateInputContent(input: InstructionInput): string[] {
	const warnings: string[] = [];

	// Check request quality
	if (input.request.length < 10) {
		warnings.push(
			"Request is very short - consider providing more detail for better results",
		);
	}

	if (input.request.length > 5000) {
		warnings.push(
			"Request is very long - consider breaking into smaller, focused requests",
		);
	}

	// Check for vague language
	const vagueTerms = [
		"fix",
		"improve",
		"better",
		"good",
		"bad",
		"thing",
		"stuff",
		"some",
	];

	const requestLower = input.request.toLowerCase();
	const foundVagueTerms = vagueTerms.filter((term) =>
		requestLower.includes(term),
	);

	if (foundVagueTerms.length > 2) {
		warnings.push(
			`Request contains vague terms (${foundVagueTerms.join(", ")}) - be more specific for better results`,
		);
	}

	// Check context/constraint relationship
	if (
		input.context &&
		input.constraints &&
		input.context.length > input.request.length
	) {
		warnings.push(
			"Context is longer than request - consider moving key requirements to the main request",
		);
	}

	// Check for conflicting constraints
	if (input.constraints && input.constraints.length > 5) {
		warnings.push(
			"Many constraints specified - consider prioritizing the most important ones",
		);
	}

	return warnings;
}

/**
 * Pre-execution guard for critical skills
 */
export async function criticalSkillGuard(
	skillId: string,
	input: InstructionInput,
	_context: ErrorContext,
): Promise<{ allowed: boolean; reason?: string }> {
	if (skillId.startsWith("gov-")) {
		const hasGovAccess = process.env.ALLOW_GOVERNANCE_SKILLS === "true";
		if (!hasGovAccess) {
			return {
				allowed: false,
				reason:
					"Governance skills require explicit authorization. Set ALLOW_GOVERNANCE_SKILLS=true.",
			};
		}
	}

	if (skillId.startsWith("qm-") || skillId.startsWith("gr-")) {
		const physicsValidation = safeValidate(physicsSkillSchema, input);
		if (!physicsValidation.success) {
			return {
				allowed: false,
				reason:
					"Physics skills require physicsAnalysisJustification (≥ 20 non-whitespace chars) explaining why physics-analysis metaphors are appropriate.",
			};
		}
	}

	if (skillId.startsWith("adapt-")) {
		const allowAdaptive = process.env.ENABLE_ADAPTIVE_ROUTING === "true";
		if (!allowAdaptive) {
			return {
				allowed: false,
				reason:
					"Adaptive routing skills are disabled. Enable with ENABLE_ADAPTIVE_ROUTING=true.",
			};
		}
	}

	const resourceIntensiveSkills = [
		"bench-eval-suite",
		"eval-prompt-bench",
		"qm-path-integral-historian",
		"gr-spacetime-debt-metric",
	];

	if (resourceIntensiveSkills.includes(skillId)) {
		const allowIntensive = process.env.ALLOW_INTENSIVE_SKILLS === "true";
		if (!allowIntensive) {
			return {
				allowed: false,
				reason:
					"Resource-intensive skills are disabled. Enable with ALLOW_INTENSIVE_SKILLS=true.",
			};
		}
	}

	return { allowed: true };
}

/**
 * Validate output before returning to user
 */
export function validateSkillOutput(
	output: unknown,
	skillId: string,
): ValidationResult<unknown> {
	try {
		// Accept plain string output (tools return formatted text strings)
		if (typeof output === "string") {
			if (output.trim().length === 0) {
				return {
					success: false,
					error: {
						code: "empty_output",
						message: "Skill output must not be empty",
						context: { skillId, timestamp: new Date().toISOString() },
					},
				};
			}
			return { success: true, data: output };
		}

		// Check basic structure for object outputs
		if (typeof output !== "object" || output === null) {
			return {
				success: false,
				error: {
					code: "invalid_output_structure",
					message: "Skill output must be a string or object",
					context: { skillId, timestamp: new Date().toISOString() },
				},
			};
		}

		const outputObj = output as Record<string, unknown>;

		// Check for required fields
		if (!outputObj.summary || typeof outputObj.summary !== "string") {
			return {
				success: false,
				error: {
					code: "missing_output_summary",
					message: "Skill output must include a summary field",
					context: { skillId, timestamp: new Date().toISOString() },
				},
			};
		}

		// Validate summary content
		if (outputObj.summary.length < 10) {
			console.warn(
				`Skill ${skillId} produced very short summary: "${outputObj.summary}"`,
			);
		}

		// Check for sensitive information in output
		const sensitivePatterns = [
			/api[_-]?key/gi,
			/password/gi,
			/secret/gi,
			/token/gi,
			/credential/gi,
		];

		const summaryStr = String(outputObj.summary);
		for (const pattern of sensitivePatterns) {
			if (pattern.test(summaryStr)) {
				console.warn(
					`Skill ${skillId} output may contain sensitive information`,
				);
				break;
			}
		}

		return { success: true, data: output };
	} catch (error) {
		return {
			success: false,
			error: {
				code: "output_validation_error",
				message: `Output validation failed: ${toErrorMessage(error)}`,
				context: { skillId, timestamp: new Date().toISOString() },
			},
		};
	}
}
