/**
 * substrate-handlers.test.ts
 *
 * Proves that the Phase 2 "substrate-backed" handlers (qual-review, arch-system,
 * doc-generator) satisfy four contracts:
 *
 *   1.  They return executionMode === "capability" (not the metadata fallback).
 *   2.  They produce input-signal-driven recommendations (not manifest echo).
 *   3.  arch-system and doc-generator consume context.runtime.workspace when
 *       available and incorporate the data into their output.
 *   4.  All three degrade gracefully when workspace is absent or the call throws.
 *   5.  Unregistered skills still fall through to the metadata fallback alongside
 *       these handlers (coexistence).
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { WorkspaceEntry, WorkspaceReader } from "../contracts/runtime.js";
import { CAPABILITY_HANDLER_SLOTS } from "../generated/graph/capability-handler-slots.js";
import { bench_analyzer_manifest as benchAnalyzerManifest } from "../generated/manifests/skill-manifests.js";
import { SKILLS_BY_DOMAIN } from "../generated/registry/skills-by-domain.js";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as archSystemModule } from "../skills/arch/arch-system.js";
import { createSkillModule } from "../skills/create-skill-module.js";
import { skillModule as docGeneratorModule } from "../skills/doc/doc-generator.js";
import { skillModule as qualReviewModule } from "../skills/qual/qual-review.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

const archSystemManifest = archSystemModule.manifest;
const docGeneratorManifest = docGeneratorModule.manifest;
const qualReviewManifest = qualReviewModule.manifest;
const hiddenSkillsRegistrySource = readFileSync(
	new URL("../generated/registry/hidden-skills.ts", import.meta.url),
	"utf8",
);
const defaultSkillResolverSource = readFileSync(
	new URL("../skills/runtime/default-skill-resolver.ts", import.meta.url),
	"utf8",
);

interface MigrationClaims {
	completeDomains: string[];
	completePhases: number[];
}

function parseListClaim(rawValue: string): string[] {
	const value = rawValue.trim();
	if (value === "" || value.toLowerCase() === "none") {
		return [];
	}

	return value
		.split(",")
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0)
		.sort();
}

function parseMigrationClaims(): MigrationClaims {
	const completeDomainsMatch = defaultSkillResolverSource.match(
		/Complete domains:\s*([^\n\r]+)/,
	);
	const completePhasesMatch = defaultSkillResolverSource.match(
		/Complete phases:\s*([^\n\r]+)/,
	);

	if (!completeDomainsMatch || !completePhasesMatch) {
		throw new Error(
			"default-skill-resolver.ts must declare 'Complete domains' and 'Complete phases' in its migration status comment.",
		);
	}

	return {
		completeDomains: parseListClaim(completeDomainsMatch[1] ?? ""),
		completePhases: parseListClaim(completePhasesMatch[1] ?? "").map(
			(phase) => {
				const parsed = Number.parseInt(phase, 10);
				if (Number.isNaN(parsed)) {
					throw new Error(`Invalid complete phase claim: ${phase}`);
				}
				return parsed;
			},
		),
	};
}

function isSkillPromotedInHiddenRegistry(
	skillId: string,
	domain: string,
): boolean {
	const promotedImportPath = `../../skills/${domain}/${skillId}.js`;
	const fallbackImportPath = `../skills/${skillId}.js`;

	const usesPromotedImport =
		hiddenSkillsRegistrySource.includes(promotedImportPath);
	const usesFallbackImport =
		hiddenSkillsRegistrySource.includes(fallbackImportPath);

	if (!usesPromotedImport && !usesFallbackImport) {
		throw new Error(
			`Could not determine registry import path for ${skillId} in hidden-skills.ts`,
		);
	}

	return usesPromotedImport;
}

function collectClaimedCompleteSkills(): {
	domains: string[];
	skillIds: string[];
} {
	const claims = parseMigrationClaims();
	const claimedDomains = new Set<string>();
	const claimedSkillIds = new Set<string>();

	for (const domain of claims.completeDomains) {
		const domainSkills = SKILLS_BY_DOMAIN[domain];
		if (!domainSkills) {
			throw new Error(`Unknown complete domain claim: ${domain}`);
		}

		const slot = CAPABILITY_HANDLER_SLOTS.find(
			(entry) => entry.domain === domain,
		);
		if (!slot) {
			throw new Error(`Missing capability handler slot for domain: ${domain}`);
		}

		expect([...slot.skillIds]).toEqual([...domainSkills]);

		claimedDomains.add(domain);
		for (const skillId of domainSkills) {
			claimedSkillIds.add(skillId);
		}
	}

	for (const phase of claims.completePhases) {
		const phaseSlots = CAPABILITY_HANDLER_SLOTS.filter(
			(slot) => slot.phase === phase,
		);
		if (phaseSlots.length === 0) {
			throw new Error(`Unknown complete phase claim: ${phase}`);
		}

		for (const slot of phaseSlots) {
			expect([...slot.skillIds]).toEqual([
				...(SKILLS_BY_DOMAIN[slot.domain] ?? []),
			]);

			claimedDomains.add(slot.domain);
			for (const skillId of slot.skillIds) {
				claimedSkillIds.add(skillId);
			}
		}
	}

	return {
		domains: [...claimedDomains].sort(),
		skillIds: [...claimedSkillIds].sort(),
	};
}

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

/** Minimal WorkflowExecutionRuntime stub for skill execution tests. */
function createWorkflowRuntime() {
	const instructionRegistry = new InstructionRegistry();
	const skillRegistry = new SkillRegistry({ workspace: null });
	const modelRouter = new ModelRouter();

	return {
		sessionId: "test-session",
		executionState: { instructionStack: [], progressRecords: [] },
		sessionStore: {
			async readSessionHistory() {
				return [];
			},
			async writeSessionHistory() {
				return;
			},
			async appendSessionHistory() {
				return;
			},
		},
		instructionRegistry,
		skillRegistry,
		modelRouter,
		workflowEngine: new WorkflowEngine(),
	};
}

/**
 * Create a controlled mock WorkspaceReader whose entries are fixed at
 * construction time.  Calls to `readFile` return a placeholder string.
 */
function createMockWorkspaceReader(entries: WorkspaceEntry[]): WorkspaceReader {
	return {
		async listFiles() {
			return entries;
		},
		async readFile(_path: string) {
			return "// mock file content";
		},
	};
}

/** A WorkspaceReader that always throws — used for graceful-degradation tests. */
const alwaysThrowingWorkspace: WorkspaceReader = {
	async listFiles() {
		throw new Error("Workspace unavailable");
	},
	async readFile() {
		throw new Error("Workspace unavailable");
	},
};

// ---------------------------------------------------------------------------
// qual-review handler
// ---------------------------------------------------------------------------

describe("qual-review handler", () => {
	it("returns capability mode for a rich quality review request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [qualReviewModule],
			workspace: null,
		});

		const result = await registry.execute(
			qualReviewManifest.id,
			{
				request:
					"Review this module for naming conventions, test coverage, and error handling",
				context:
					"The function uses single-letter variables and has no unit tests.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(qualReviewManifest.id);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toMatch(/^Quality dimension/);
	});

	it("surfaces naming, test, and error-handling dimensions from signal-matched request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [qualReviewModule],
			workspace: null,
		});

		const result = await registry.execute(
			qualReviewManifest.id,
			{
				request:
					"Check that the code has proper naming, test coverage, and no swallowed exceptions",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// Should detect naming, test, and error-handling dimensions
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/naming|identifier/i);
		expect(allDetail).toMatch(/test|coverage/i);
		expect(allDetail).toMatch(/error|exception/i);
	});

	it("includes stated constraints in recommendations", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [qualReviewModule],
			workspace: null,
		});

		const result = await registry.execute(
			qualReviewManifest.id,
			{
				request: "Review the codebase for code quality",
				constraints: ["PEP 8 compliance", "100% public-API docstrings"],
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toContain("PEP 8 compliance");
	});

	it("returns insufficient-signal result when request and context are empty", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [qualReviewModule],
			workspace: null,
		});

		const result = await registry.execute(
			qualReviewManifest.id,
			{ request: "a" }, // single non-keyword char → no keywords extracted
			runtime,
		);

		// "a" has zero keywords and no context — should trigger insufficient-signal path
		expect(result.executionMode).toBe("capability"); // still uses the handler
		expect(result.recommendations.length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// arch-system handler (with workspace substrate)
// ---------------------------------------------------------------------------

describe("arch-system handler", () => {
	it("returns capability mode for an AI system design request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [archSystemModule],
			workspace: null,
		});

		const result = await registry.execute(
			archSystemManifest.id,
			{
				request:
					"Design an AI-native system with agent workflows, RAG retrieval, and safety guardrails",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(archSystemManifest.id);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toMatch(/^Architecture concern/);
	});

	it("detects agent, memory, and safety concerns from request signals", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [archSystemModule],
			workspace: null,
		});

		const result = await registry.execute(
			archSystemManifest.id,
			{
				request:
					"Architect an agent orchestration layer with vector memory, prompt injection safety, and observability",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/agent|tool|orchestrat/i);
		expect(allDetail).toMatch(/memory|retrieval/i);
		expect(allDetail).toMatch(/safety|guardrail|injection/i);
	});

	it("incorporates workspace topology when a WorkspaceReader is injected", async () => {
		const runtime = createWorkflowRuntime();
		const mockEntries: WorkspaceEntry[] = [
			{ name: "src", type: "directory" },
			{ name: "scripts", type: "directory" },
			{ name: "package.json", type: "file" },
			{ name: "README.md", type: "file" },
			{ name: "tsconfig.json", type: "file" },
		];
		const registry = new SkillRegistry({
			modules: [archSystemModule],
			workspace: createMockWorkspaceReader(mockEntries),
		});

		const result = await registry.execute(
			archSystemManifest.id,
			{
				request:
					"Design an agent platform with memory and observability for this project",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		// The workspace topology note should appear in recommendations
		expect(allDetail).toMatch(
			/workspace topology|director|existing structure/i,
		);
		// And it should mention concrete counts from the mock
		expect(allDetail).toMatch(/\b2\b.*director|\bdirector.*\b2\b/i);
	});

	it("degrades gracefully when workspace reader throws", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [archSystemModule],
			workspace: alwaysThrowingWorkspace,
		});

		const result = await registry.execute(
			archSystemManifest.id,
			{
				request:
					"Design a scalable AI system with agent tools and data storage",
			},
			runtime,
		);

		// Handler should still succeed — workspace failure is caught internally
		expect(result.executionMode).toBe("capability");
		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	it("uses config-driven model selection for arch-system", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [archSystemModule],
			workspace: null,
		});

		const result = await registry.execute(
			archSystemManifest.id,
			{ request: "Design an AI agent system" },
			runtime,
		);

		expect(typeof result.model.id).toBe("string");
		expect((result.model.id as string).length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// doc-generator handler (workspace substrate is primary)
// ---------------------------------------------------------------------------

describe("doc-generator handler", () => {
	it("returns capability mode for a documentation generation request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [docGeneratorModule],
			workspace: null,
		});

		const result = await registry.execute(
			docGeneratorManifest.id,
			{ request: "Generate API documentation and a README for this codebase" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(docGeneratorManifest.id);
		expect(result.recommendations[0]?.title).toMatch(/^Documentation target/);
	});

	it("detects API and README documentation types from request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [docGeneratorModule],
			workspace: null,
		});

		const result = await registry.execute(
			docGeneratorManifest.id,
			{
				request:
					"Auto-generate API reference docs and a getting-started README for the project",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/api|interface|endpoint/i);
		expect(allDetail).toMatch(/readme|audience|quickstart/i);
	});

	it("enumerates workspace source dirs and existing docs when workspace reader is injected", async () => {
		const runtime = createWorkflowRuntime();
		const mockEntries: WorkspaceEntry[] = [
			{ name: "src", type: "directory" },
			{ name: "lib", type: "directory" },
			{ name: "README.md", type: "file" },
			{ name: "CHANGELOG.md", type: "file" },
			{ name: "package.json", type: "file" },
		];
		const registry = new SkillRegistry({
			modules: [docGeneratorModule],
			workspace: createMockWorkspaceReader(mockEntries),
		});

		const result = await registry.execute(
			docGeneratorManifest.id,
			{ request: "Generate technical documentation for this project" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");

		// Source directory finding
		expect(allDetail).toMatch(/source director/i);
		expect(allDetail).toMatch(/src.*lib|lib.*src/i);

		// Existing docs finding
		expect(allDetail).toMatch(/existing document/i);
		expect(allDetail).toMatch(/README\.md/);
	});

	it("degrades gracefully when workspace reader throws", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [docGeneratorModule],
			workspace: alwaysThrowingWorkspace,
		});

		const result = await registry.execute(
			docGeneratorManifest.id,
			{ request: "Create technical docs for the API and architecture" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	it("incorporates deliverable into summary when specified", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [docGeneratorModule],
			workspace: null,
		});

		const result = await registry.execute(
			docGeneratorManifest.id,
			{
				request: "Document the project",
				deliverable: "developer-facing API reference",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toContain("developer-facing API reference");
	});
});

// ---------------------------------------------------------------------------
// Coexistence: Phase 2 handlers alongside metadata fallback
// ---------------------------------------------------------------------------

describe("Phase 2 handler coexistence with metadata fallback", () => {
	it("capability handlers run alongside an unregistered (fallback) skill in the same registry", async () => {
		const runtime = createWorkflowRuntime();
		// Use defaultSkillResolver (which has all three Phase 2 handlers registered)
		// paired with bench-analyzer which remains unregistered → fallback.
		const registry = new SkillRegistry({
			modules: [
				qualReviewModule,
				archSystemModule,
				docGeneratorModule,
				createSkillModule(benchAnalyzerManifest), // unregistered — stays fallback
			],
			workspace: null,
		});

		const [qualResult, archResult, docResult, fallbackResult] =
			await Promise.all([
				registry.execute(
					qualReviewManifest.id,
					{ request: "Review naming and test coverage" },
					runtime,
				),
				registry.execute(
					archSystemManifest.id,
					{ request: "Design an agent system with observability" },
					runtime,
				),
				registry.execute(
					docGeneratorManifest.id,
					{ request: "Generate API and runbook documentation" },
					runtime,
				),
				registry.execute(
					benchAnalyzerManifest.id,
					{ request: "Analyze benchmark variance" },
					runtime,
				),
			]);

		expect(qualResult.executionMode).toBe("capability");
		expect(archResult.executionMode).toBe("capability");
		expect(docResult.executionMode).toBe("capability");
		expect(fallbackResult.executionMode).toBe("fallback");
		expect(fallbackResult.recommendations[0]?.title).toBeTruthy();
	});

	it("all three Phase 2 handlers are registered in the defaultSkillResolver", async () => {
		// Use the default registry (includes defaultSkillResolver) and verify
		// all three new handlers are active with real-world-style requests.
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({ workspace: null });

		const [qualResult, archResult, docResult] = await Promise.all([
			registry.execute(
				qualReviewManifest.id,
				{
					request:
						"Review this service for error handling, coupling, and test coverage",
				},
				runtime,
			),
			registry.execute(
				archSystemManifest.id,
				{
					request:
						"Architect an AI platform with agent orchestration and safety guardrails",
					constraints: ["cloud-native", "multi-tenant"],
				},
				runtime,
			),
			registry.execute(
				docGeneratorManifest.id,
				{
					request:
						"Generate a complete documentation set: API reference, README, and runbook",
					deliverable: "documentation suite",
				},
				runtime,
			),
		]);

		expect(qualResult.executionMode).toBe("capability");
		expect(archResult.executionMode).toBe("capability");
		expect(docResult.executionMode).toBe("capability");

		// arch-system: constraints should appear
		const archDetail = archResult.recommendations
			.map((r) => r.detail)
			.join(" ");
		expect(archDetail).toMatch(/cloud-native|multi-tenant/);

		// doc-generator: deliverable should appear
		const docDetail = docResult.recommendations.map((r) => r.detail).join(" ");
		expect(docDetail).toContain("documentation suite");
	});
});

describe("domain completeness gate", () => {
	it("keeps resolver completion claims aligned with generated migration manifests", () => {
		const claims = parseMigrationClaims();
		const slotDomains = new Set(
			CAPABILITY_HANDLER_SLOTS.map((slot) => slot.domain),
		);
		const slotPhases = new Set(
			CAPABILITY_HANDLER_SLOTS.map((slot) => slot.phase),
		);

		for (const domain of claims.completeDomains) {
			expect(slotDomains.has(domain)).toBe(true);
			expect(SKILLS_BY_DOMAIN[domain]).toBeDefined();
		}

		for (const phase of claims.completePhases) {
			expect(slotPhases.has(phase)).toBe(true);
		}
	});

	it("fails if a claimed-complete domain or phase still resolves to generated fallback wrappers", async () => {
		const runtime = createWorkflowRuntime();
		const { domains, skillIds } = collectClaimedCompleteSkills();

		expect(domains.length).toBeGreaterThan(0);
		expect(skillIds.length).toBeGreaterThan(0);

		for (const skillId of skillIds) {
			const [domain] = skillId.split("-", 1);
			expect(isSkillPromotedInHiddenRegistry(skillId, domain ?? "")).toBe(true);
		}

		const results = await Promise.all(
			skillIds.map(async (skillId) => ({
				skillId,
				result: await runtime.skillRegistry.execute(
					skillId,
					{
						request: `Validate coupling analysis for ${skillId}: confirm the promoted capability handler executes correctly, not the metadata fallback.`,
						context:
							"This should execute through a real capability handler, not the metadata fallback.",
						physicsAnalysisJustification:
							"Completeness gate validation: conventional analysis alone is insufficient to represent the topology of this physics-domain skill; the physics metaphor captures structural depth that standard analysis cannot.",
					},
					runtime,
				),
			})),
		);

		const fallbackSkills = results
			.filter(({ result }) => result.executionMode !== "capability")
			.map(({ skillId, result }) => ({
				skillId,
				executionMode: result.executionMode,
			}));

		expect(fallbackSkills).toEqual([]);
	});
});
