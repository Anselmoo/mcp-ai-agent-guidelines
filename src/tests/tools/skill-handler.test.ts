import { describe, expect, it, vi } from "vitest";
import {
	applyContextMembrane,
	SkillHandler,
	tierForSkill,
} from "../../tools/skill-handler.js";

describe("skill-handler", () => {
	it("derives execution tiers from skill prefixes", () => {
		expect(tierForSkill("qm-entanglement-mapper")).toBe("physics");
		expect(tierForSkill("gov-policy-validation")).toBe("governance");
		expect(tierForSkill("adv-meta-research")).toBe("advanced");
		expect(tierForSkill("debug-root-cause")).toBe("core");
	});

	it("dispatches through the registered tier handler", async () => {
		const handler = new SkillHandler();
		const execute = vi.fn().mockResolvedValue({
			skillId: "debug-root-cause",
			displayName: "Root Cause",
			summary: "Found issue",
			detail: "Detailed analysis",
			model: {
				id: "gpt-5.1-mini",
				label: "GPT-5.1 mini",
				provider: "openai",
				costTier: "free",
				contextWindow: 128000,
			},
			recommendations: [],
		});
		handler.register("core", execute);

		const result = await handler.dispatch(
			{
				id: "debug-root-cause",
				canonicalId: "debug-root-cause",
				domain: "debug",
				displayName: "Root Cause",
				description: "Find the root cause",
				sourcePath: "src/skills/debug.ts",
				purpose: "Diagnose",
				triggerPhrases: [],
				antiTriggerPhrases: [],
				usageSteps: [],
				intakeQuestions: [],
				relatedSkills: [],
				outputContract: [],
				recommendationHints: [],
				preferredModelClass: "free",
			},
			{ request: "debug failure" },
		);

		expect(result.tier).toBe("core");
		expect(execute).toHaveBeenCalled();
		expect(handler.registeredTiers()).toEqual(["core"]);
	});
});

describe("applyContextMembrane", () => {
	const fullInput = {
		request: "analyze",
		context: "sensitive data",
		options: { verbose: true },
		constraints: ["must-pass"],
		successCriteria: "green",
		deliverable: "report",
	};

	it("strips context from governance-tier input", () => {
		const filtered = applyContextMembrane("governance", fullInput);
		expect(filtered.request).toBe("analyze");
		expect(filtered.context).toBeUndefined();
		expect(filtered.options).toEqual({ verbose: true });
	});

	it("strips options from physics-tier input", () => {
		const filtered = applyContextMembrane("physics", fullInput);
		expect(filtered.context).toBe("sensitive data");
		expect(filtered.options).toBeUndefined();
		expect(filtered.request).toBe("analyze");
	});

	it("passes all fields through for core and advanced tiers", () => {
		for (const tier of ["core", "advanced"] as const) {
			const filtered = applyContextMembrane(tier, fullInput);
			expect(filtered.request).toBe("analyze");
			expect(filtered.context).toBe("sensitive data");
			expect(filtered.options).toEqual({ verbose: true });
		}
	});

	it("drops unknown index-signature keys regardless of tier", () => {
		const withExtra = { ...fullInput, _injected: "payload" };
		const filtered = applyContextMembrane("core", withExtra);
		expect("_injected" in filtered).toBe(false);
	});
});

describe("SkillHandler — Hebbian weights", () => {
	it("starts with zero weight for any skill", () => {
		const handler = new SkillHandler();
		expect(handler.getHebbianWeight("core-quality-review")).toBe(0);
	});

	it("accumulates weight via depositHebbianSignal", () => {
		const handler = new SkillHandler();
		handler.depositHebbianSignal("core-quality-review", 1.0);
		handler.depositHebbianSignal("core-quality-review", 0.5);
		expect(handler.getHebbianWeight("core-quality-review")).toBeCloseTo(1.5);
	});

	it("decays all weights by the given factor", () => {
		const handler = new SkillHandler();
		handler.depositHebbianSignal("core-quality-review", 2.0);
		handler.depositHebbianSignal("adv-redundant-voter", 4.0);
		handler.hebbianDecay(0.5);
		expect(handler.getHebbianWeight("core-quality-review")).toBeCloseTo(1.0);
		expect(handler.getHebbianWeight("adv-redundant-voter")).toBeCloseTo(2.0);
	});

	it("snapshot returns skills sorted by weight descending", () => {
		const handler = new SkillHandler();
		handler.depositHebbianSignal("core-research-assistant", 1.0);
		handler.depositHebbianSignal("adv-aco-router", 3.0);
		handler.depositHebbianSignal("gov-policy-validation", 2.0);
		const snap = handler.hebbianSnapshot();
		expect(snap[0].skillId).toBe("adv-aco-router");
		expect(snap[1].skillId).toBe("gov-policy-validation");
		expect(snap[2].skillId).toBe("core-research-assistant");
	});

	it("dispatch deposits a Hebbian signal automatically", async () => {
		const handler = new SkillHandler();
		handler.register(
			"core",
			vi.fn().mockResolvedValue({
				skillId: "core-quality-review",
				displayName: "Quality Review",
				summary: "ok",
				detail: "",
				model: {
					id: "gpt-4.1",
					label: "GPT-4.1",
					provider: "openai",
					costTier: "free",
					contextWindow: 128000,
				},
				recommendations: [],
			}),
		);
		await handler.dispatch(
			{
				id: "core-quality-review",
				canonicalId: "core-quality-review",
				domain: "qual",
				displayName: "Quality Review",
				description: "Review code",
				sourcePath: "",
				purpose: "",
				triggerPhrases: [],
				antiTriggerPhrases: [],
				usageSteps: [],
				intakeQuestions: [],
				relatedSkills: [],
				outputContract: [],
				recommendationHints: [],
				preferredModelClass: "free",
			},
			{ request: "review this" },
		);
		expect(handler.getHebbianWeight("core-quality-review")).toBeCloseTo(1.0);
	});
});

describe("SkillHandler — physics justification gate (A3)", () => {
	const physicsManifest = {
		id: "qm-entanglement-mapper",
		canonicalId: "qm-entanglement-mapper",
		domain: "qm",
		displayName: "Entanglement Mapper",
		description: "Map entanglement",
		sourcePath: "",
		purpose: "",
		triggerPhrases: [],
		antiTriggerPhrases: [],
		usageSteps: [],
		intakeQuestions: [],
		relatedSkills: [],
		outputContract: [],
		recommendationHints: [],
		preferredModelClass: "strong" as const,
	};

	it("rejects a physics skill when no justification is provided", async () => {
		const handler = new SkillHandler();
		handler.register("physics", vi.fn());
		await expect(
			handler.dispatch(physicsManifest, { request: "map entanglement" }),
		).rejects.toThrow(/justification/);
	});

	it("rejects a physics skill when justification is fewer than 20 characters", async () => {
		const handler = new SkillHandler();
		handler.register("physics", vi.fn());
		await expect(
			handler.dispatch(physicsManifest, {
				request: "map entanglement",
				options: { justification: "too short" },
			}),
		).rejects.toThrow(/justification/);
	});

	it("allows a physics skill when a valid justification is provided", async () => {
		const handler = new SkillHandler();
		handler.register(
			"physics",
			vi.fn().mockResolvedValue({
				skillId: "qm-entanglement-mapper",
				displayName: "Entanglement Mapper",
				summary: "done",
				detail: "",
				model: {
					id: "claude-sonnet-4-6",
					label: "Claude Sonnet 4.6",
					provider: "anthropic",
					costTier: "strong",
					contextWindow: 200000,
				},
				recommendations: [],
			}),
		);
		const result = await handler.dispatch(physicsManifest, {
			request: "map entanglement between modules",
			physicsAnalysisJustification:
				"Standard coupling metrics are insufficient; co-change entropy needed.",
		});
		expect(result.tier).toBe("physics");
		expect(result.skillId).toBe("qm-entanglement-mapper");
	});

	it("does not apply the justification gate to non-physics tiers", async () => {
		const handler = new SkillHandler();
		const coreManifest = {
			...physicsManifest,
			id: "core-quality-review",
			canonicalId: "core-quality-review",
			domain: "qual",
			displayName: "Quality Review",
			preferredModelClass: "free" as const,
		};
		handler.register(
			"core",
			vi.fn().mockResolvedValue({
				skillId: "core-quality-review",
				displayName: "Quality Review",
				summary: "ok",
				detail: "",
				model: {
					id: "gpt-4.1",
					label: "GPT-4.1",
					provider: "openai",
					costTier: "free",
					contextWindow: 128000,
				},
				recommendations: [],
			}),
		);
		// No justification — should succeed for core tier
		const result = await handler.dispatch(coreManifest, {
			request: "review code",
		});
		expect(result.tier).toBe("core");
	});
});
