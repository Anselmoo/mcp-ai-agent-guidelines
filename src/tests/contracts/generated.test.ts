/**
 * generated.test.ts
 *
 * contracts/generated.ts is a pure-type module (interfaces + type aliases only).
 * Tests here create conforming objects and assert structural invariants.
 * Any breaking interface change causes a compile error — cheap regression net.
 */
import { describe, expect, it } from "vitest";
import type {
	AliasEntry,
	InstructionManifestEntry,
	ModelClass,
	SchemaFieldConfig,
	SkillManifestEntry,
	ToolInputSchema,
	WorkflowDefinition,
	WorkflowGateStep,
	WorkflowStep,
} from "../../contracts/generated.js";

describe("generated — contract shapes", () => {
	it("ModelClass covers exactly four tiers", () => {
		const tiers: ModelClass[] = ["free", "cheap", "strong", "reviewer"];
		expect(tiers).toHaveLength(4);
		expect(new Set(tiers).size).toBe(4);
	});

	it("SchemaFieldConfig required flag is optional (absent means not required)", () => {
		const field: SchemaFieldConfig = {
			name: "request",
			type: "string",
			description: "The primary request",
		};
		expect(field.required).toBeUndefined();
	});

	it("ToolInputSchema discriminant is always 'object'", () => {
		const schema: ToolInputSchema = {
			type: "object",
			properties: { foo: { type: "string" } },
		};
		expect(schema.type).toBe("object");
	});

	it("WorkflowParallelStep uses 'steps' (not 'branches') to hold sub-steps", () => {
		const step: WorkflowStep = {
			kind: "parallel",
			label: "FAN_OUT",
			steps: [
				{ kind: "note", label: "A", note: "first branch" },
				{ kind: "note", label: "B", note: "second branch" },
			],
		};
		expect(step.kind).toBe("parallel");
		if (step.kind === "parallel") {
			expect(step.steps).toHaveLength(2);
		}
	});

	it("WorkflowNoteStep uses 'note' (not 'text') for content", () => {
		const step: WorkflowStep = {
			kind: "note",
			label: "Context",
			note: "important detail",
		};
		expect(step.kind).toBe("note");
		if (step.kind === "note") {
			expect(step.note).toBe("important detail");
		}
	});

	it("WorkflowGateStep condition covers all five variants", () => {
		const conditions: WorkflowGateStep["condition"][] = [
			"always",
			"hasContext",
			"hasConstraints",
			"hasDeliverable",
			"hasPhysicsJustification",
		];
		expect(conditions).toHaveLength(5);
	});

	it("WorkflowDefinition links instructionId to steps array", () => {
		const def: WorkflowDefinition = {
			instructionId: "bootstrap",
			steps: [{ kind: "finalize", label: "DONE" }],
		};
		expect(def.instructionId).toBe("bootstrap");
		expect(def.steps[0]).toMatchObject({ kind: "finalize" });
	});

	it("InstructionManifestEntry carries all required fields with correct types", () => {
		const entry: InstructionManifestEntry = {
			id: "bootstrap",
			toolName: "bootstrap_tool",
			aliases: ["bootstrap"],
			displayName: "Bootstrap Session",
			description: "Kick off a session",
			sourcePath: "src/instructions/bootstrap.ts",
			mission: "Get sessions started",
			inputSchema: { type: "object", properties: {} },
			workflow: { instructionId: "bootstrap", steps: [] },
			chainTo: ["review"],
			preferredModelClass: "cheap",
			autoChainOnCompletion: true,
			requiredPreconditions: ["agent-memory-fetch"],
			reactivationPolicy: "periodic",
		};
		expect(entry.id).toBe("bootstrap");
		expect(entry.preferredModelClass).toBe("cheap");
		expect(entry.chainTo).toContain("review");
		expect(entry.aliases).toContain("bootstrap");
		expect(entry.requiredPreconditions).toContain("agent-memory-fetch");
	});

	it("SkillManifestEntry domain is a prefix string without trailing hyphen", () => {
		const entry: SkillManifestEntry = {
			id: "req-elicitation",
			canonicalId: "req-elicitation",
			domain: "req",
			displayName: "Requirements Elicitation",
			description: "Elicits requirements",
			sourcePath: "src/skills/req-elicitation.ts",
			purpose: "Discover requirements",
			triggerPhrases: ["requirements"],
			antiTriggerPhrases: [],
			usageSteps: ["step 1"],
			intakeQuestions: [],
			relatedSkills: [],
			outputContract: [],
			recommendationHints: [],
			preferredModelClass: "strong",
		};
		expect(entry.domain).toBe("req");
		expect(entry.domain).not.toContain("-");
	});

	it("AliasEntry maps legacyId to a different canonicalId", () => {
		const alias: AliasEntry = {
			legacyId: "requirements",
			canonicalId: "req-elicitation",
		};
		expect(alias.legacyId).not.toBe(alias.canonicalId);
	});
});
