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
		const physics = await validateSkillInput(
			{
				request: "investigate anomaly in detail",
				conventionalEvidence: "baseline logs",
				targetQuestion: "what changed?",
			},
			z.object({
				request: z.string(),
				conventionalEvidence: z.string(),
				targetQuestion: z.string(),
			}),
			{ skillId: "qm-entanglement-mapper" },
		);
		const governanceGuard = await criticalSkillGuard(
			"gov-policy-validation",
			{ request: "audit policy" },
			{ timestamp: new Date().toISOString() },
		);
		const output = validateSkillOutput({ detail: "missing summary" }, "review");

		expect(physics.success).toBe(false);
		expect(physics.errors[0]).toContain("Physics skills are disabled");
		expect(governanceGuard.allowed).toBe(false);
		expect(output.success).toBe(false);
	});

	it("warns for permissive physics validation and traces sanitized input when requested", async () => {
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
			{ skillId: "qm-wavefunction-coverage" },
			{
				allowPhysicsSkills: true,
				traceValidation: true,
			},
		);

		expect(result.success).toBe(true);
		expect(result.warnings).toContain(
			"Physics skill missing physicsAnalysisJustification — provide ≥ 20 non-whitespace chars explaining why physics-analysis metaphors are appropriate",
		);
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

		process.env.ENABLE_ADAPTIVE_ROUTING = "true";
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
				"Adaptive routing skills are disabled. Enable with ENABLE_ADAPTIVE_ROUTING=true.",
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
});
