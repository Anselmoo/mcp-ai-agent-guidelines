import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	criticalSkillGuard,
	sanitizeInputObject,
	validateSkillInput,
	validateSkillOutput,
} from "../../validation/input-guards.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
	process.env = { ...ORIGINAL_ENV };
});

describe("input-guards", () => {
	it("sanitizes valid input and returns quality warnings for underspecified requests", async () => {
		const result = await validateSkillInput(
			{
				request: "<fix>",
				context: "very long context",
				constraints: ["a", "b", "c", "d", "e", "f"],
			},
			z.object({
				request: z.string(),
				context: z.string().optional(),
				constraints: z.array(z.string()).optional(),
			}),
			{ skillId: "debug-root-cause" },
		);

		expect(result.success).toBe(true);
		expect(result.sanitized).toBe(true);
		expect(result.data?.request).toBe("&lt;fix&gt;");
		expect(result.warnings.length).toBeGreaterThan(0);
	});

	it("blocks gated skill categories and invalid output structures", async () => {
		const governanceGuard = await criticalSkillGuard(
			"gov-policy-validation",
			{ request: "audit policy" },
			{ timestamp: new Date().toISOString() },
		);
		const output = validateSkillOutput({ detail: "missing summary" }, "review");

		expect(governanceGuard.allowed).toBe(false);
		expect(output.success).toBe(false);
	});

	it("traces sanitized input when requested", async () => {
		const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
		const result = await validateSkillInput(
			{
				request: "investigate production anomaly with more context",
				context: "baseline logs and rollout details",
			},
			z.object({
				request: z.string(),
				context: z.string().optional(),
			}),
			{ skillId: "debug-root-cause" },
			{
				traceValidation: true,
			},
		);

		expect(result.success).toBe(true);
		expect(debugSpy).toHaveBeenCalled();
	});

	it("fails fast in strict mode when sanitization cannot process restricted fields", async () => {
		const result = await validateSkillInput(
			{
				request: "review the attached artifact carefully",
				filePath: "docs/spec.md",
			},
			z.object({
				request: z.string(),
				filePath: z.string().optional(),
			}),
			{ skillId: "debug-root-cause" },
			{
				strict: true,
				allowFileOperations: false,
			},
		);

		expect(result.success).toBe(false);
		expect(result.errors[0]).toContain("Sanitization failed");
		expect(result.errors[0]).toContain("File operations are disabled");
	});

	it("exports recursive input sanitization for callers that need a reusable boundary", async () => {
		const sanitized = await sanitizeInputObject(
			{
				request: "<ship>",
				options: {
					filePath: "docs/spec.md",
					callbackUrl: "https://example.com/hook",
				},
				steps: [{ note: "<review>" }],
			},
			{
				maxInputLength: 200,
				allowFileOperations: true,
				allowNetworkAccess: true,
			},
		);

		expect(sanitized.request).toBe("&lt;ship&gt;");
		expect(sanitized.options).toEqual({
			filePath: "docs/spec.md",
			callbackUrl: "https://example.com/hook",
		});
		expect(sanitized.steps).toEqual([{ note: "&lt;review&gt;" }]);
	});

	it("rejects file and network fields when sanitization policy disallows them", async () => {
		await expect(
			sanitizeInputObject(
				{
					options: {
						filePath: "docs/spec.md",
					},
				},
				{
					maxInputLength: 200,
					allowFileOperations: false,
					allowNetworkAccess: true,
				},
			),
		).rejects.toThrow("File operations are disabled");

		await expect(
			sanitizeInputObject(
				{
					options: {
						callbackUrl: "https://example.com/hook",
					},
				},
				{
					maxInputLength: 200,
					allowFileOperations: true,
					allowNetworkAccess: false,
				},
			),
		).rejects.toThrow("Network access is disabled");
	});

	it("guards adaptive, intensive, and physics skills based on environment and evidence", async () => {
		const timestamp = new Date().toISOString();
		process.env.DISABLE_ADAPTIVE_ROUTING = "true";
		const adaptiveBlocked = await criticalSkillGuard(
			"adapt-aco-router",
			{ request: "optimize routes" },
			{ timestamp },
		);
		const intensiveBlocked = await criticalSkillGuard(
			"bench-eval-suite",
			{ request: "run the full benchmark" },
			{ timestamp },
		);

		delete process.env.DISABLE_ADAPTIVE_ROUTING;
		process.env.ALLOW_INTENSIVE_SKILLS = "true";

		const adaptiveAllowed = await criticalSkillGuard(
			"adapt-aco-router",
			{ request: "optimize routes" },
			{ timestamp },
		);
		const intensiveAllowed = await criticalSkillGuard(
			"bench-eval-suite",
			{ request: "run the full benchmark" },
			{ timestamp },
		);
		const physicsAllowed = await criticalSkillGuard(
			"qm-entanglement-mapper",
			{
				request: "compare the architectural deltas",
				physicsAnalysisJustification:
					"conventional dependency analysis is insufficient for this cross-cutting entanglement pattern",
			},
			{ timestamp },
		);

		expect(adaptiveBlocked).toEqual({
			allowed: false,
			reason:
				"Adaptive routing skills are disabled. Unset DISABLE_ADAPTIVE_ROUTING to re-enable.",
		});
		expect(intensiveBlocked).toEqual({
			allowed: false,
			reason:
				"Resource-intensive skills are disabled. Enable with ALLOW_INTENSIVE_SKILLS=true.",
		});
		expect(adaptiveAllowed).toEqual({ allowed: true });
		expect(intensiveAllowed).toEqual({ allowed: true });
		expect(physicsAllowed).toEqual({ allowed: true });
	});

	it("warns for short or sensitive summaries and surfaces validation exceptions", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const shortSummary = validateSkillOutput({ summary: "tiny" }, "review");
		const sensitiveSummary = validateSkillOutput(
			{ summary: "contains API_KEY token and secret material" },
			"review",
		);
		const explodingOutput = validateSkillOutput(
			Object.defineProperty({}, "summary", {
				get() {
					throw new Error("summary exploded");
				},
			}),
			"review",
		);

		expect(shortSummary.success).toBe(true);
		expect(sensitiveSummary.success).toBe(true);
		expect(warnSpy).toHaveBeenCalledWith(
			'Skill review produced very short summary: "tiny"',
		);
		expect(warnSpy).toHaveBeenCalledWith(
			"Skill review output may contain sensitive information",
		);
		expect(explodingOutput.success).toBe(false);
		if (!explodingOutput.success) {
			expect(explodingOutput.error.message).toContain("summary exploded");
		}
	});

	it("rejects non-object input (non-record path)", async () => {
		const result = await validateSkillInput(
			"not-an-object" as unknown as Record<string, unknown>,
			z.object({ request: z.string() }),
			{ skillId: "debug-root-cause" },
		);
		expect(result.success).toBe(false);
		expect(result.errors[0]).toContain("must be an object");
	});

	it("rejects input with missing request field", async () => {
		const result = await validateSkillInput(
			{ context: "no request here" } as unknown as Record<string, unknown>,
			z.object({ request: z.string(), context: z.string().optional() }),
			{ skillId: "debug-root-cause" },
		);
		expect(result.success).toBe(false);
		expect(result.errors[0]).toContain("'request' field");
	});

	it("skips sanitization when sanitize:false is passed", async () => {
		const result = await validateSkillInput(
			{ request: "<tag>test content</tag>" },
			z.object({ request: z.string() }),
			{ skillId: "req-analysis" },
			{ sanitize: false },
		);
		// No sanitization => request is unchanged
		expect(result.success).toBe(true);
		expect(result.sanitized).toBe(false);
		expect((result.data as { request: string }).request).toBe(
			"<tag>test content</tag>",
		);
	});

	it("non-strict sanitization error produces warning instead of failure", async () => {
		const result = await validateSkillInput(
			{ request: "look at this file", filePath: "src/index.ts" },
			z.object({ request: z.string(), filePath: z.string().optional() }),
			{ skillId: "debug-root-cause" },
			{ strict: false, allowFileOperations: false },
		);
		// Non-strict mode: sanitization failure becomes a warning
		expect(
			result.warnings.some((w) => w.includes("Sanitization warning")),
		).toBe(true);
	});

	it("governance skill is allowed when env var is set", async () => {
		process.env.ALLOW_GOVERNANCE_SKILLS = "true";
		const result = await criticalSkillGuard(
			"gov-policy-validation",
			{ request: "audit policy" },
			{ timestamp: new Date().toISOString() },
		);
		expect(result.allowed).toBe(true);
	});

	it("validateSkillOutput returns failure for empty string", () => {
		const result = validateSkillOutput("   ", "debug-root-cause");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("empty_output");
		}
	});

	it("validateSkillOutput returns success for non-empty string", () => {
		const result = validateSkillOutput("Here is the analysis.", "req-analysis");
		expect(result.success).toBe(true);
	});

	it("validateSkillOutput returns failure for null/number output", () => {
		const result = validateSkillOutput(42, "req-analysis");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("invalid_output_structure");
		}
	});

	it("sanitizeInputObject passes non-string/non-array/non-object values through unchanged", async () => {
		const result = await sanitizeInputObject(
			{ count: 5, active: true, nothing: null },
			{
				maxInputLength: 200,
				allowFileOperations: false,
				allowNetworkAccess: false,
			},
		);
		expect(result.count).toBe(5);
		expect(result.active).toBe(true);
		expect(result.nothing).toBeNull();
	});

	it("sanitizeInputObject handles array items that are records", async () => {
		const result = await sanitizeInputObject(
			{ items: [{ note: "<hello>" }, 42, "plain"] },
			{
				maxInputLength: 200,
				allowFileOperations: false,
				allowNetworkAccess: false,
			},
		);
		expect((result.items as Array<{ note: string }>)[0].note).toBe(
			"&lt;hello&gt;",
		);
		expect((result.items as number[])[1]).toBe(42);
		expect((result.items as string[])[2]).toBe("plain");
	});

	it("traces sanitized input with a fallback skill label when skillId is absent", async () => {
		const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
		const result = await validateSkillInput(
			{ request: "investigate the anomaly with more detail please" },
			z.object({ request: z.string() }),
			{},
			{ traceValidation: true },
		);

		expect(result.success).toBe(true);
		expect(debugSpy).toHaveBeenCalledWith("Input sanitized for unknown skill");
		expect(debugSpy).toHaveBeenCalledWith(
			expect.stringContaining("Validation passed for unknown skill"),
		);
	});

	it("fails schema validation and reports the offending field path", async () => {
		const result = await validateSkillInput(
			{ request: "a well formed request describing the task" },
			z.object({ request: z.string(), count: z.number() }),
			{ skillId: "debug-root-cause" },
		);

		expect(result.success).toBe(false);
		expect(result.errors[0]).toContain("Schema validation failed");
		expect(result.errors[1]).toBe("Field path: count");
	});

	it("fails schema validation without a field path when no issue is reported", async () => {
		const pathlessFailureSchema = {
			safeParse: () => ({
				success: false,
				error: { issues: [] },
			}),
		} as unknown as z.ZodType<{ request: string }>;

		const result = await validateSkillInput(
			{ request: "a well formed request describing the task" },
			pathlessFailureSchema,
			{ skillId: "debug-root-cause" },
		);

		expect(result.success).toBe(false);
		expect(result.errors).toEqual([
			"Schema validation failed: Validation failed",
		]);
	});

	it("wraps unexpected non-ValidationError exceptions from schema parsing", async () => {
		const throwingSchema = {
			safeParse: () => {
				throw new Error("schema exploded");
			},
		} as unknown as z.ZodType<{ request: string }>;

		const result = await validateSkillInput(
			{ request: "a well formed request describing the task" },
			throwingSchema,
			{ skillId: "debug-root-cause" },
		);

		expect(result.success).toBe(false);
		expect(result.errors[0]).toContain("Validation guard error");
		expect(result.errors[0]).toContain("schema exploded");
		expect(result.context?.stackTrace).toBeDefined();
	});

	it("wraps unexpected non-Error throws from schema parsing without a stack trace", async () => {
		const throwingSchema = {
			safeParse: () => {
				// biome-ignore lint/style/useThrowOnlyError: exercising the non-Error catch branch
				throw "schema exploded as a string";
			},
		} as unknown as z.ZodType<{ request: string }>;

		const result = await validateSkillInput(
			{ request: "a well formed request describing the task" },
			throwingSchema,
			{ skillId: "debug-root-cause" },
		);

		expect(result.success).toBe(false);
		expect(result.errors[0]).toContain("Validation guard error");
		expect(result.context?.stackTrace).toBeUndefined();
	});

	it("warns when the request is very short", async () => {
		const result = await validateSkillInput(
			{ request: "hi" },
			z.object({ request: z.string() }),
			{ skillId: "debug-root-cause" },
			{ sanitize: false },
		);

		expect(result.success).toBe(true);
		expect(result.warnings).toContain(
			"Request is very short - consider providing more detail for better results",
		);
	});

	it("warns when the request is very long", async () => {
		const longRequest = "a".repeat(5001);
		const result = await validateSkillInput(
			{ request: longRequest },
			z.object({ request: z.string() }),
			{ skillId: "debug-root-cause" },
			{ sanitize: false },
		);

		expect(result.success).toBe(true);
		expect(result.warnings).toContain(
			"Request is very long - consider breaking into smaller, focused requests",
		);
	});

	it("does not warn about vague terms when two or fewer are present", async () => {
		const result = await validateSkillInput(
			{ request: "please fix and improve this specific module carefully" },
			z.object({ request: z.string() }),
			{ skillId: "debug-root-cause" },
			{ sanitize: false },
		);

		expect(result.success).toBe(true);
		expect(
			result.warnings.some((w) => w.includes("contains vague terms")),
		).toBe(false);
	});

	it("warns when more than two vague terms are present", async () => {
		const result = await validateSkillInput(
			{ request: "please fix and improve some bad stuff, thanks" },
			z.object({ request: z.string() }),
			{ skillId: "debug-root-cause" },
			{ sanitize: false },
		);

		expect(result.success).toBe(true);
		expect(
			result.warnings.some((w) => w.includes("contains vague terms")),
		).toBe(true);
	});
});
