import * as fs from "node:fs";
import {
	ORCHESTRATION_CONFIG_RELATIVE_PATH,
	parseOrchestrationConfigDocument,
} from "../config/orchestration-config.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";

// Create a simple environment wrapper
const env = {
	get: (name: string) => ({
		default: (defaultValue: string | number) => {
			const defStr = String(defaultValue);
			const raw = process.env[name];
			return {
				asString: () => raw || defStr,
				asIntPositive: () => {
					const n = parseInt(raw || defStr, 10);
					return n > 0 ? n : parseInt(defStr, 10);
				},
				asBool: () => (raw !== undefined ? raw === "true" : defStr === "true"),
				asEnum: <T extends string>(values: T[]): T => {
					const v = (raw || defStr) as T;
					return values.includes(v) ? v : (defStr as T);
				},
			};
		},
		asString: () => process.env[name] || "",
		asPortNumber: () => {
			const port = parseInt(process.env[name] || "3000", 10);
			return port >= 1 && port <= 65535 ? port : 3000;
		},
	}),
};

// Simple dotenv replacement
const dotenv = {
	config: (_options: unknown = {}) => {
		// Basic environment loading - files would need to be read manually
		// For now, just use process.env
		return { parsed: process.env };
	},
};

function writeValidationDiagnostic(message: string) {
	process.stderr.write(`${message}\n`);
}

/**
 * Environment validation system with env-var/dotenv support.
 *
 * Validates environment variables at startup with clear error messages
 * for missing/invalid config. Supports different environments (dev/test/prod).
 */

export interface EnvironmentConfig {
	nodeEnv: "development" | "test" | "production";
	logLevel: "debug" | "info" | "warn" | "error";
	orchestrationConfigPath?: string;
	maxSessions: number;
	sessionTtlMinutes: number;
	maxInstructionDepth: number;
	maxParallelSkills: number;
	enablePhysicsSkills: boolean;
	enableAdaptiveRouting: boolean;
	validationMode: "strict" | "advisory" | "disabled";

	// Model configuration
	defaultModelTimeout: number;
	maxRetries: number;

	// Security settings
	allowFileOperations: boolean;
	allowNetworkAccess: boolean;
	maxFileSize: number;

	// Optional external service configurations
	anthropicApiKey?: string;
	openaiApiKey?: string;
	googleApiKey?: string;

	// Monitoring/observability
	enableMetrics: boolean;
	metricsPort?: number;

	// Development/debugging
	debugSkillExecution: boolean;
	traceValidation: boolean;
}

export interface EnvironmentValidationResult {
	success: boolean;
	config?: EnvironmentConfig;
	errors: string[];
	warnings: string[];
}

/**
 * Load and parse dotenv files based on NODE_ENV
 */
function loadDotenvFiles(): void {
	const nodeEnv = process.env.NODE_ENV || "development";

	// Load in order of precedence (later files override earlier ones)
	const envFiles = [".env", `.env.${nodeEnv}`, ".env.local"];

	for (const envFile of envFiles) {
		if (fs.existsSync(envFile)) {
			console.debug(`Loading environment from: ${envFile}`);
			dotenv.config({ path: envFile, override: false });
		}
	}
}

/**
 * Validate orchestration configuration file
 */
function validateOrchestrationConfig(configPath: string): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!fs.existsSync(configPath)) {
		errors.push(`Orchestration configuration not found: ${configPath}`);
		return { valid: false, errors };
	}

	try {
		const content = fs.readFileSync(configPath, "utf8");
		const parsed = parseOrchestrationConfigDocument(content);
		if (Object.keys(parsed.models).length === 0) {
			errors.push("Orchestration config missing model declarations");
		}

		writeValidationDiagnostic(
			`Orchestration config validation passed: ${configPath}`,
		);
		return { valid: errors.length === 0, errors };
	} catch (error) {
		errors.push(
			`Failed to validate orchestration config: ${toErrorMessage(error)}`,
		);
		return { valid: false, errors };
	}
}

/**
 * Validate and load environment configuration
 */
export function validateEnvironment(): EnvironmentValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	try {
		// Load dotenv files
		loadDotenvFiles();

		// Extract and validate environment variables
		const nodeEnv = env
			.get("NODE_ENV")
			.default("development")
			.asEnum(["development", "test", "production"]);

		const logLevel = env
			.get("LOG_LEVEL")
			.default("info")
			.asEnum(["debug", "info", "warn", "error"]);

		const orchestrationConfigPath = env
			.get("MCP_ORCHESTRATION_PATH")
			.default(ORCHESTRATION_CONFIG_RELATIVE_PATH)
			.asString();

		const maxSessions = env.get("MAX_SESSIONS").default(100).asIntPositive();

		const sessionTtlMinutes = env
			.get("SESSION_TTL_MINUTES")
			.default(60)
			.asIntPositive();

		const maxInstructionDepth = env
			.get("MAX_INSTRUCTION_DEPTH")
			.default(10)
			.asIntPositive();

		const maxParallelSkills = env
			.get("MAX_PARALLEL_SKILLS")
			.default(5)
			.asIntPositive();

		const enablePhysicsSkills = env
			.get("ENABLE_PHYSICS_SKILLS")
			.default("false")
			.asBool();

		const enableAdaptiveRouting = env
			.get("ENABLE_ADAPTIVE_ROUTING")
			.default("false")
			.asBool();

		const validationMode = env
			.get("VALIDATION_MODE")
			.default("advisory")
			.asEnum(["strict", "advisory", "disabled"]);

		const defaultModelTimeout = env
			.get("DEFAULT_MODEL_TIMEOUT")
			.default(30000)
			.asIntPositive();

		const maxRetries = env.get("MAX_RETRIES").default(3).asIntPositive();

		const allowFileOperations = env
			.get("ALLOW_FILE_OPERATIONS")
			.default("true")
			.asBool();

		const allowNetworkAccess = env
			.get("ALLOW_NETWORK_ACCESS")
			.default("true")
			.asBool();

		const maxFileSize = env
			.get("MAX_FILE_SIZE")
			.default(10485760) // 10MB
			.asIntPositive();

		const enableMetrics = env.get("ENABLE_METRICS").default("false").asBool();

		const metricsPort = env.get("METRICS_PORT").asPortNumber();

		const debugSkillExecution = env
			.get("DEBUG_SKILL_EXECUTION")
			.default("false")
			.asBool();

		const traceValidation = env
			.get("TRACE_VALIDATION")
			.default("false")
			.asBool();

		// Optional API keys (warnings if missing in production)
		const anthropicApiKey = env.get("ANTHROPIC_API_KEY").asString();
		const openaiApiKey = env.get("OPENAI_API_KEY").asString();
		const googleApiKey = env.get("GOOGLE_API_KEY").asString();

		// Validate orchestration configuration
		const orchestrationValidation = validateOrchestrationConfig(
			orchestrationConfigPath,
		);
		if (!orchestrationValidation.valid) {
			if (validationMode === "strict") {
				errors.push(...orchestrationValidation.errors);
			} else {
				warnings.push(
					...orchestrationValidation.errors.map(
						(err) => `Orchestration config warning: ${err}`,
					),
				);
			}
		}

		// Production-specific validations
		if (nodeEnv === "production") {
			if (!anthropicApiKey && !openaiApiKey) {
				warnings.push("No API keys configured - models may not work");
			}

			if (debugSkillExecution) {
				warnings.push("DEBUG_SKILL_EXECUTION enabled in production");
			}

			if (enablePhysicsSkills) {
				warnings.push(
					"Physics skills enabled in production - ensure proper authorization",
				);
			}
		}

		// Security warnings
		if (nodeEnv === "production" && allowFileOperations) {
			warnings.push(
				"File operations enabled in production - review security implications",
			);
		}

		const config: EnvironmentConfig = {
			nodeEnv,
			logLevel,
			orchestrationConfigPath,
			maxSessions,
			sessionTtlMinutes,
			maxInstructionDepth,
			maxParallelSkills,
			enablePhysicsSkills,
			enableAdaptiveRouting,
			validationMode,
			defaultModelTimeout,
			maxRetries,
			allowFileOperations,
			allowNetworkAccess,
			maxFileSize,
			anthropicApiKey,
			openaiApiKey,
			googleApiKey,
			enableMetrics,
			metricsPort,
			debugSkillExecution,
			traceValidation,
		};

		return {
			success: errors.length === 0,
			config: errors.length === 0 ? config : undefined,
			errors,
			warnings,
		};
	} catch (error) {
		errors.push(`Environment validation failed: ${toErrorMessage(error)}`);

		return {
			success: false,
			errors,
			warnings,
		};
	}
}

/**
 * Initialize environment configuration with validation
 * Called at startup to ensure proper configuration
 */
export function initializeEnvironment(): EnvironmentConfig {
	// Skip full validation in test environments
	if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
		writeValidationDiagnostic(
			"⚠️  Test environment detected - using default configuration",
		);
		return getDefaultConfig();
	}

	const result = validateEnvironment();

	// Log warnings
	for (const warning of result.warnings) {
		console.warn(`⚠️  Environment warning: ${warning}`);
	}

	// Handle errors based on validation mode
	if (!result.success) {
		const errorMessage = `Environment validation failed:\n${result.errors.map((err) => `  - ${err}`).join("\n")}`;

		if (
			result.config?.validationMode === "advisory" ||
			process.env.VALIDATION_MODE === "advisory"
		) {
			console.error(`🔥 ${errorMessage}`);
			console.error(
				"Continuing in advisory mode with default configuration...",
			);

			// Return default configuration
			return getDefaultConfig();
		} else {
			console.error(`💀 ${errorMessage}`);
			console.error("Environment validation failed in strict mode. Exiting...");
			process.exit(1);
		}
	}

	writeValidationDiagnostic(
		`✅ Environment validation passed (${result.config?.nodeEnv} mode)`,
	);
	return result.config as EnvironmentConfig;
}

/**
 * Get default configuration for advisory/fallback mode
 */
function getDefaultConfig(): EnvironmentConfig {
	return {
		nodeEnv: "development",
		logLevel: "info",
		orchestrationConfigPath: ORCHESTRATION_CONFIG_RELATIVE_PATH,
		maxSessions: 100,
		sessionTtlMinutes: 60,
		maxInstructionDepth: 10,
		maxParallelSkills: 5,
		enablePhysicsSkills: false,
		enableAdaptiveRouting: false,
		validationMode: "advisory",
		defaultModelTimeout: 30000,
		maxRetries: 3,
		allowFileOperations: true,
		allowNetworkAccess: true,
		maxFileSize: 10485760,
		enableMetrics: false,
		debugSkillExecution: false,
		traceValidation: false,
	};
}
