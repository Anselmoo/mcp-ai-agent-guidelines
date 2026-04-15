/**
 * runtime.test.ts
 *
 * contracts/runtime.ts is a pure-type module.
 * Tests verify structural invariants of the key runtime interfaces —
 * required vs optional fields, discriminant values, and cross-field
 * consistency.  Any breaking shape change causes a compile error.
 */
import { describe, expect, it } from "vitest";
import type {
	ExecutionProgressRecord,
	InstructionInput,
	ModelProfile,
	RecommendationItem,
	SkillExecutionResult,
	WorkflowExecutionResult,
	WorkspaceEntry,
} from "../../contracts/runtime.js";

describe("runtime — contract shapes", () => {
	it("InstructionInput requires only 'request'; all other fields are optional", () => {
		const minimal: InstructionInput = { request: "do something" };
		expect(minimal.request).toBe("do something");
		expect(minimal.context).toBeUndefined();
		expect(minimal.constraints).toBeUndefined();
	});

	it("InstructionInput index signature allows arbitrary extra fields", () => {
		const extended: InstructionInput = {
			request: "implement feature",
			customField: "value",
		};
		expect(extended["customField"]).toBe("value");
	});

	it("InstructionInput can carry a typed options envelope when a skill narrows it", () => {
		const typed: InstructionInput<{
			approved: boolean;
			mode?: "fast" | "safe";
		}> = {
			request: "ship it",
			options: {
				approved: true,
				mode: "safe",
			},
		};

		expect(typed.options?.approved).toBe(true);
		expect(typed.options?.mode).toBe("safe");
	});

	it("ModelProfile uses 'strengths' array and 'maxContextWindow' union — no 'provider'/'contextWindow'", () => {
		const profile: ModelProfile = {
			id: "gpt-4o-mini",
			label: "GPT-4o Mini",
			modelClass: "cheap",
			strengths: ["speed", "cost"],
			maxContextWindow: "medium",
			costTier: "cheap",
		};
		expect(["small", "medium", "large"]).toContain(profile.maxContextWindow);
		expect(Array.isArray(profile.strengths)).toBe(true);
	});

	it("RecommendationItem carries title, detail, model class, and optional grounding metadata", () => {
		const rec: RecommendationItem = {
			title: "Use dependency injection",
			detail: "Improves testability",
			modelClass: "cheap",
			groundingScope: "workspace",
			evidenceAnchors: ["src/runtime.ts"],
			sourceRefs: ["src/runtime.ts", "docs/architecture/02-orchestration.md"],
			problem: "Tightly coupled construction makes isolated testing harder.",
			suggestedAction: "Inject runtime collaborators at module boundaries.",
		};
		expect(rec.title).toBeTruthy();
		expect(rec.modelClass).toBe("cheap");
		expect(rec.groundingScope).toBe("workspace");
		expect(rec.evidenceAnchors).toContain("src/runtime.ts");
	});

	it("SkillExecutionResult includes relatedSkills as a string array — no 'detail' field", () => {
		const model: ModelProfile = {
			id: "gpt-4o-mini",
			label: "Mini",
			modelClass: "cheap",
			strengths: [],
			maxContextWindow: "medium",
			costTier: "cheap",
		};
		const result: SkillExecutionResult = {
			skillId: "req-elicitation",
			displayName: "Requirements Elicitation",
			model,
			summary: "Analysis complete",
			recommendations: [
				{
					title: "Pin dependency",
					detail: "Lock version.",
					modelClass: "cheap",
					groundingScope: "request",
				},
			],
			relatedSkills: ["arch-design"],
			groundingSummary: "Grounding sources: request-grounded",
		};
		expect(result.relatedSkills).toContain("arch-design");
		expect(result.recommendations[0]?.modelClass).toBe("cheap");
		expect(result.groundingSummary).toContain("request-grounded");
	});

	it("WorkflowExecutionResult has steps and recommendations but no 'input' field", () => {
		const model: ModelProfile = {
			id: "gpt-4o",
			label: "GPT-4o",
			modelClass: "strong",
			strengths: ["reasoning"],
			maxContextWindow: "large",
			costTier: "strong",
		};
		const workflow: WorkflowExecutionResult = {
			instructionId: "review",
			displayName: "Review",
			model,
			steps: [
				{ label: "VALIDATE", kind: "completed", summary: "Input validated" },
				{ label: "EXECUTE", kind: "in_progress", summary: "Running" },
			],
			recommendations: [],
		};
		expect(workflow.steps).toHaveLength(2);
		expect(workflow.steps[0]?.label).toBe("VALIDATE");
	});

	it("ExecutionProgressRecord captures stepLabel, kind, and summary", () => {
		const record: ExecutionProgressRecord = {
			stepLabel: "Validate input",
			kind: "serial",
			summary: "Input validated successfully",
		};
		expect(record.stepLabel).toBeTruthy();
		expect(record.kind).toBeTruthy();
	});

	it("WorkspaceEntry type discriminates 'file' from 'directory'", () => {
		const file: WorkspaceEntry = { name: "README.md", type: "file" };
		const dir: WorkspaceEntry = { name: "src", type: "directory" };
		expect(file.type).toBe("file");
		expect(dir.type).toBe("directory");
	});
});
