import { expect } from "vitest";
import type { SkillManifestEntry } from "../../contracts/generated.js";
import type {
	InstructionInput,
	ModelProfile,
	SkillExecutionResult,
	SkillExecutionRuntime,
	SkillModule,
	SkillWorkspaceSurface,
	WorkflowExecutionRuntime,
	WorkspaceReader,
} from "../../contracts/runtime.js";
import type { SkillExecutionContext } from "../../skills/runtime/contracts.js";

export const mockModelProfile: ModelProfile = {
	id: "mock-model",
	label: "Mock Model",
	modelClass: "cheap",
	strengths: ["unit tests"],
	maxContextWindow: "medium",
	costTier: "cheap",
};

function buildModelProfile(manifest: SkillManifestEntry): ModelProfile {
	return {
		...mockModelProfile,
		modelClass: manifest.preferredModelClass,
		costTier: manifest.preferredModelClass,
	};
}

export function createMockManifest(
	overrides: Partial<SkillManifestEntry> = {},
): SkillManifestEntry {
	return {
		id: overrides.id ?? "test-skill",
		canonicalId: overrides.canonicalId ?? overrides.id ?? "test-skill",
		domain: overrides.domain ?? "test",
		displayName: overrides.displayName ?? "Test Skill",
		description: overrides.description ?? "Synthetic skill manifest for tests.",
		sourcePath: overrides.sourcePath ?? "src/skills/test-skill.ts",
		purpose: overrides.purpose ?? "Help with a scoped engineering task.",
		triggerPhrases: overrides.triggerPhrases ?? [
			"engineering review",
			"targeted guidance",
		],
		antiTriggerPhrases: overrides.antiTriggerPhrases ?? ["unrelated request"],
		usageSteps: overrides.usageSteps ?? [
			"Inspect the request.",
			"Produce targeted guidance.",
		],
		intakeQuestions: overrides.intakeQuestions ?? ["What is the main concern?"],
		relatedSkills: overrides.relatedSkills ?? ["peer-skill"],
		outputContract: overrides.outputContract ?? [
			"Return actionable recommendations.",
		],
		recommendationHints: overrides.recommendationHints ?? [
			"Keep recommendations deterministic.",
		],
		preferredModelClass: overrides.preferredModelClass ?? "cheap",
	};
}

export function createMockSkillRuntime(
	overrides: Partial<SkillExecutionRuntime> = {},
): SkillExecutionRuntime {
	return {
		modelRouter: {
			chooseSkillModel: (manifest) => buildModelProfile(manifest),
			...(overrides.modelRouter ?? {}),
		},
		...(overrides.workspace === undefined
			? {}
			: { workspace: overrides.workspace }),
		...(overrides.workspaceSurface === undefined
			? {}
			: { workspaceSurface: overrides.workspaceSurface }),
	};
}

export function createMockSkillExecutionContext(
	overrides: Partial<SkillExecutionContext> = {},
): SkillExecutionContext {
	const manifest = overrides.manifest ?? createMockManifest();
	const input = overrides.input ?? { request: "review the architecture plan" };
	const runtime = overrides.runtime ?? createMockSkillRuntime();
	return {
		skillId: overrides.skillId ?? manifest.id,
		manifest,
		input,
		model:
			overrides.model ?? runtime.modelRouter.chooseSkillModel(manifest, input),
		runtime,
	};
}

export function createMockSkillResult(
	context: SkillExecutionContext,
	overrides: Partial<SkillExecutionResult> = {},
): SkillExecutionResult {
	return {
		skillId: overrides.skillId ?? context.skillId,
		displayName: overrides.displayName ?? context.manifest.displayName,
		model: overrides.model ?? context.model,
		summary: overrides.summary ?? "Handled by test skill.",
		recommendations: overrides.recommendations ?? [
			{
				title: "Recommendation 1",
				detail: "Use deterministic test data.",
				modelClass: context.model.modelClass,
			},
		],
		relatedSkills: overrides.relatedSkills ?? context.manifest.relatedSkills,
		executionMode: overrides.executionMode ?? "capability",
	};
}

export function createTargetedSkillInput(
	manifest: SkillManifestEntry,
): InstructionInput {
	return {
		request: [
			manifest.displayName,
			...manifest.triggerPhrases.slice(0, 2),
		].join(" "),
		context: [
			manifest.purpose,
			...manifest.usageSteps.slice(0, 2),
			...manifest.recommendationHints.slice(0, 2),
		].join(" "),
		constraints: ["Keep output deterministic", "Stay within documented scope"],
		deliverable: "Actionable guidance",
		successCriteria: "Produce specific recommendations",
	};
}

export function createMockWorkflowRuntime(
	overrides: Partial<WorkflowExecutionRuntime> = {},
): WorkflowExecutionRuntime {
	return {
		sessionId: overrides.sessionId ?? "test-session",
		executionState: overrides.executionState ?? {
			instructionStack: [],
			progressRecords: [],
		},
		sessionStore: overrides.sessionStore ?? {
			readSessionHistory: async () => [],
			writeSessionHistory: async () => undefined,
			appendSessionHistory: async () => undefined,
		},
		instructionRegistry: overrides.instructionRegistry ?? {
			getById: () => undefined,
			getByToolName: () => undefined,
			execute: async () => {
				throw new Error("Instruction execution not stubbed for this test.");
			},
		},
		skillRegistry: overrides.skillRegistry ?? {
			getById: () => undefined,
			execute: async () => {
				throw new Error("Skill execution not stubbed for this test.");
			},
		},
		modelRouter: {
			chooseInstructionModel: () => mockModelProfile,
			chooseSkillModel: (manifest) => buildModelProfile(manifest),
			chooseReviewerModel: () => ({
				...mockModelProfile,
				id: "mock-reviewer",
				label: "Mock Reviewer",
				modelClass: "reviewer",
				costTier: "reviewer",
			}),
			...(overrides.modelRouter ?? {}),
		},
		workflowEngine: overrides.workflowEngine ?? {
			executeInstruction: async () => {
				throw new Error("Workflow execution not stubbed for this test.");
			},
		},
	};
}

function expectRecommendationShape(
	recommendations: SkillExecutionResult["recommendations"],
) {
	expect(recommendations.length).toBeGreaterThan(0);
	for (const recommendation of recommendations) {
		expect(recommendation.title.length).toBeGreaterThan(0);
		expect(recommendation.detail.length).toBeGreaterThan(0);
		expect(["free", "cheap", "strong", "reviewer"]).toContain(
			recommendation.modelClass,
		);
	}
}

export async function expectSkillModuleContract(skillModule: SkillModule) {
	expect(skillModule.manifest).toMatchObject({
		id: expect.any(String),
		displayName: expect.any(String),
		sourcePath: expect.stringContaining("skills/"),
	});

	const runtime = createMockSkillRuntime();
	const result = await skillModule.run(
		createTargetedSkillInput(skillModule.manifest),
		runtime,
	);

	expect(result.skillId).toBe(skillModule.manifest.id);
	expect(result.displayName).toBe(skillModule.manifest.displayName);
	expect(result.model.modelClass).toBe(
		skillModule.manifest.preferredModelClass,
	);
	expect(result.executionMode).toBe("capability");
	expect(result.summary.length).toBeGreaterThan(0);
	expect(result.relatedSkills).toEqual(skillModule.manifest.relatedSkills);
	expectRecommendationShape(result.recommendations);
}

export async function expectEmptyRequestHandling(skillModule: SkillModule) {
	return expectInsufficientSignalHandling(skillModule);
}

interface SkillGuidanceExpectation {
	summaryIncludes?: readonly string[];
	detailIncludes?: readonly string[];
	recommendationCountAtLeast?: number;
}

export async function expectSkillGuidance(
	skillModule: SkillModule,
	input: InstructionInput,
	expectation: SkillGuidanceExpectation,
) {
	const result = await skillModule.run(input, createMockSkillRuntime());
	expect(result.executionMode).toBe("capability");
	expect(result.skillId).toBe(skillModule.manifest.id);
	expect(result.displayName).toBe(skillModule.manifest.displayName);
	expect(result.model.modelClass).toBe(
		skillModule.manifest.preferredModelClass,
	);
	expectRecommendationShape(result.recommendations);

	if (expectation.recommendationCountAtLeast !== undefined) {
		expect(result.recommendations.length).toBeGreaterThanOrEqual(
			expectation.recommendationCountAtLeast,
		);
	}

	for (const fragment of expectation.summaryIncludes ?? []) {
		expect(result.summary).toContain(fragment);
	}

	const detailText = result.recommendations
		.map((recommendation) => recommendation.detail)
		.join("\n");
	for (const fragment of expectation.detailIncludes ?? []) {
		expect(detailText).toContain(fragment);
	}

	return result;
}

export async function expectInsufficientSignalHandling(
	skillModule: SkillModule,
) {
	const result = await skillModule.run(
		{ request: "" },
		createMockSkillRuntime(),
	);
	expect(result.executionMode).toBe("capability");
	expect(result.skillId).toBe(skillModule.manifest.id);
	expect(result.displayName).toBe(skillModule.manifest.displayName);
	expect(result.summary.length).toBeGreaterThan(0);
	expect(result.recommendations[0]).toMatchObject({
		title: "Provide more detail",
		modelClass: skillModule.manifest.preferredModelClass,
	});
	expectRecommendationShape(result.recommendations);
	return result;
}

export function createWorkspaceReaderStub(): WorkspaceReader {
	return {
		listFiles: async () => [{ name: "README.md", type: "file" }],
		readFile: async () => "stub content",
	};
}

/**
 * Creates a minimal stub that satisfies the full SkillWorkspaceSurface
 * contract.  Safe to use in unit tests — all methods are no-ops or return
 * empty/null values.
 */
export function createWorkspaceSurfaceStub(): SkillWorkspaceSurface {
	return {
		listFiles: async () => [{ name: "README.md", type: "file" }],
		readFile: async (_path: string) => "stub content",
		listArtifacts: async (_sessionId: string) => [],
		readArtifact: async (_input: { artifact: string; sessionId: string }) =>
			"{}",
		writeArtifact: async (_input: {
			artifact: string;
			sessionId: string;
			value: unknown;
		}) => undefined,
		fetchContext: async (sessionId: string) => ({
			sessionId,
			sourceFile: null,
			artifacts: {
				sessionContext: null,
				workspaceMap: null,
				scanResults: null,
				fingerprintSnapshot: null,
			},
		}),
		compare: async (_selector?: string) => ({
			selector: _selector ?? "latest",
			baselineMeta: null,
			drift: null,
			toon: "",
		}),
		refresh: async () => ({ hash: "stub-hash" }),
	};
}
