/**
 * Runtime/Skill bridge tests (runtime-skill-bridge-v1)
 *
 * These tests prove that the richer WorkspaceSurface (session context,
 * snapshot compare, artifact I/O) flows through every execution path:
 *   1. SkillRegistry.execute()           — the canonical path
 *   2. SkillRegistry.buildSkillRuntime() — used by direct and orchestrated paths
 *   3. IntegratedSkillRuntime direct     — executeSkill with orchestration off
 *   4. Backward compat: skills that only need WorkspaceReader still work
 *   5. Explicit null workspace disables both workspace and workspaceSurface
 */

import { describe, expect, it, vi } from "vitest";
import type {
	SkillExecutionResult,
	SkillExecutionRuntime,
	SkillWorkspaceSurface,
} from "../../contracts/runtime.js";
import { createIntegratedRuntime } from "../../runtime/integration.js";
import { createSkillModule } from "../../skills/create-skill-module.js";
import { SkillRegistry } from "../../skills/skill-registry.js";
import {
	createMockManifest,
	createMockSkillResult,
	createMockWorkflowRuntime,
	createWorkspaceSurfaceStub,
} from "../skills/test-helpers.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCapture() {
	let captured: SkillExecutionRuntime | undefined;
	return {
		captured: () => captured,
		handler: {
			execute: vi.fn(
				async (
					_input: unknown,
					context: { runtime: SkillExecutionRuntime },
				) => {
					captured = context.runtime;
					return createMockSkillResult({
						skillId: "bridge-skill",
						manifest: createMockManifest({ id: "bridge-skill" }),
						input: { request: "bridge test" },
						model: {
							id: "mock-model",
							label: "Mock",
							modelClass: "cheap",
							strengths: [],
							maxContextWindow: "medium",
							costTier: "cheap",
						},
						runtime: context.runtime,
					});
				},
			),
		},
	};
}

function makeResult(summary = "bridge ok"): SkillExecutionResult {
	return {
		skillId: "bridge-skill",
		displayName: "Bridge Skill",
		summary,
		model: {
			id: "mock-model",
			label: "Mock",
			costTier: "cheap",
			modelClass: "cheap",
			strengths: [],
			maxContextWindow: "medium",
		},
		recommendations: [],
		relatedSkills: [],
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("runtime/skill-bridge — SkillRegistry contract", () => {
	it("exposes workspaceSurface on the skill runtime when a WorkspaceSurface is supplied", async () => {
		const surface = createWorkspaceSurfaceStub();
		const capture = makeCapture();
		const manifest = createMockManifest({ id: "bridge-skill" });
		const registry = new SkillRegistry({
			modules: [createSkillModule(manifest)],
			resolver: { resolve: () => capture.handler },
			workspace: surface,
		});

		await registry.execute(
			"bridge-skill",
			{ request: "test" },
			createMockWorkflowRuntime(),
		);

		expect(capture.captured()?.workspaceSurface).toBe(surface);
		expect(capture.captured()?.workspace).toBe(surface);
	});

	it("workspaceSurface is undefined when only a plain WorkspaceReader is supplied", async () => {
		const plainReader = {
			listFiles: async () => [],
			readFile: async () => "",
		};
		const capture = makeCapture();
		const manifest = createMockManifest({ id: "bridge-skill" });
		const registry = new SkillRegistry({
			modules: [createSkillModule(manifest)],
			resolver: { resolve: () => capture.handler },
			workspace: plainReader,
		});

		await registry.execute(
			"bridge-skill",
			{ request: "test" },
			createMockWorkflowRuntime(),
		);

		expect(capture.captured()?.workspace).toBe(plainReader);
		expect(capture.captured()?.workspaceSurface).toBeUndefined();
	});

	it("disables both workspace and workspaceSurface when null is passed", async () => {
		const capture = makeCapture();
		const manifest = createMockManifest({ id: "bridge-skill" });
		const registry = new SkillRegistry({
			modules: [createSkillModule(manifest)],
			resolver: { resolve: () => capture.handler },
			workspace: null,
		});

		await registry.execute(
			"bridge-skill",
			{ request: "test" },
			createMockWorkflowRuntime(),
		);

		expect(capture.captured()?.workspace).toBeUndefined();
		expect(capture.captured()?.workspaceSurface).toBeUndefined();
	});
});

describe("runtime/skill-bridge — buildSkillRuntime()", () => {
	it("overlays registry workspace onto a base runtime that has no workspace", () => {
		const surface = createWorkspaceSurfaceStub();
		const registry = new SkillRegistry({
			modules: [],
			workspace: surface,
		});

		const base: SkillExecutionRuntime = {
			modelRouter: {
				chooseSkillModel: () => ({
					id: "m",
					label: "M",
					modelClass: "cheap",
					strengths: [],
					maxContextWindow: "small",
					costTier: "cheap",
				}),
			},
		};

		const enriched = registry.buildSkillRuntime(base);

		expect(enriched.workspace).toBe(surface);
		expect(enriched.workspaceSurface).toBe(surface);
		// Existing model router is preserved
		expect(enriched.modelRouter).toBe(base.modelRouter);
	});

	it("returns the base runtime unchanged when registry has no workspace configured", () => {
		const registry = new SkillRegistry({ modules: [], workspace: null });
		const base: SkillExecutionRuntime = {
			modelRouter: {
				chooseSkillModel: () => ({
					id: "m",
					label: "M",
					modelClass: "cheap",
					strengths: [],
					maxContextWindow: "small",
					costTier: "cheap",
				}),
			},
		};

		const enriched = registry.buildSkillRuntime(base);

		expect(enriched).toBe(base);
	});

	it("registry workspace takes precedence over the base runtime's workspace", () => {
		const registrySurface = createWorkspaceSurfaceStub();
		const baseSurface = createWorkspaceSurfaceStub();
		const registry = new SkillRegistry({
			modules: [],
			workspace: registrySurface,
		});

		const base: SkillExecutionRuntime = {
			modelRouter: {
				chooseSkillModel: () => ({
					id: "m",
					label: "M",
					modelClass: "cheap",
					strengths: [],
					maxContextWindow: "small",
					costTier: "cheap",
				}),
			},
			workspace: baseSurface,
			workspaceSurface: baseSurface,
		};

		const enriched = registry.buildSkillRuntime(base);

		expect(enriched.workspace).toBe(registrySurface);
		expect(enriched.workspaceSurface).toBe(registrySurface);
	});
});

describe("runtime/skill-bridge — IntegratedSkillRuntime direct path", () => {
	it("surfaces workspaceSurface through the direct execution path", async () => {
		const surface = createWorkspaceSurfaceStub();
		let capturedSurface: SkillWorkspaceSurface | undefined;

		const skillRun = vi.fn(
			async (
				_input: unknown,
				runtime: SkillExecutionRuntime,
			): Promise<SkillExecutionResult> => {
				capturedSurface = runtime.workspaceSurface;
				return makeResult();
			},
		);

		const manifest = createMockManifest({ id: "bridge-skill" });
		const registry = new SkillRegistry({
			modules: [
				{
					manifest,
					run: skillRun,
				},
			],
			workspace: surface,
		});

		const integrated = createIntegratedRuntime(
			registry,
			{
				modelRouter: {
					chooseSkillModel: () => ({
						id: "m",
						label: "M",
						modelClass: "cheap",
						strengths: [],
						maxContextWindow: "small",
						costTier: "cheap",
					}),
				},
			},
			{ enableOrchestration: false },
		);

		await integrated.executeSkill("bridge-skill", {
			request: "bridge integration test",
		});

		expect(capturedSurface).toBe(surface);
	});
});

describe("runtime/skill-bridge — WorkspaceSurface API surface", () => {
	it("fetchContext returns a SkillWorkspaceContextBundle shaped object", async () => {
		const surface = createWorkspaceSurfaceStub();
		const result = await surface.fetchContext("session-xyz");

		expect(result.sessionId).toBe("session-xyz");
		expect(result.sourceFile).toBeNull();
		expect(result.artifacts).toHaveProperty("sessionContext");
		expect(result.artifacts).toHaveProperty("workspaceMap");
		expect(result.artifacts).toHaveProperty("scanResults");
		expect(result.artifacts).toHaveProperty("fingerprintSnapshot");
	});

	it("compare returns a SkillWorkspaceCompareResult shaped object", async () => {
		const surface = createWorkspaceSurfaceStub();
		const result = await surface.compare("latest");

		expect(result.selector).toBe("latest");
		expect(result).toHaveProperty("baselineMeta");
		expect(result).toHaveProperty("drift");
		expect(result).toHaveProperty("toon");
	});

	it("listArtifacts and readArtifact/writeArtifact are callable", async () => {
		const surface = createWorkspaceSurfaceStub();

		const artifacts = await surface.listArtifacts("session-abc");
		expect(Array.isArray(artifacts)).toBe(true);

		const raw = await surface.readArtifact({
			artifact: "workspace-map",
			sessionId: "session-abc",
		});
		expect(typeof raw).toBe("string");

		await expect(
			surface.writeArtifact({
				artifact: "workspace-map",
				sessionId: "session-abc",
				value: {},
			}),
		).resolves.toBeUndefined();
	});
});
