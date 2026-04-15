import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { SessionStateStore } from "../../contracts/runtime.js";
import {
	buildPublicResources,
	clearSupportingAssetCache,
	type ReadPublicResourceOptions,
	readPublicResource,
} from "../../resources/resource-surface.js";

describe("resource-surface", () => {
	it("lists graph, session, and memory resources for the active session", () => {
		const resources = buildPublicResources("session-123");

		expect(
			resources.some(
				(resource) => resource.uri === "mcp-guidelines://graph/taxonomy",
			),
		).toBe(true);
		expect(
			resources.some(
				(resource) =>
					resource.uri === "mcp-guidelines://session/session-123/progress",
			),
		).toBe(true);
		expect(
			resources.some(
				(resource) =>
					resource.uri === "mcp-guidelines://session/session-123/context",
			),
		).toBe(true);
		expect(
			resources.some(
				(resource) => resource.uri === "mcp-guidelines://memory/artifacts",
			),
		).toBe(true);
	});

	it("reads session progress resources and rejects unknown URIs", async () => {
		const sessionStore = {
			async readSessionHistory() {
				return [{ stepLabel: "VALIDATE", kind: "completed", summary: "done" }];
			},
		} as unknown as SessionStateStore;

		const resource = await readPublicResource(
			"mcp-guidelines://session/session-123/progress",
			"session-123",
			sessionStore,
		);

		expect(resource.contents[0]?.text).toContain('"stepLabel": "VALIDATE"');
		await expect(
			readPublicResource(
				"mcp-guidelines://missing",
				"session-123",
				sessionStore,
			),
		).rejects.toThrow("Unknown resource");
	});

	it("derives a TOON session context when no persisted context exists", async () => {
		const sessionStore = {
			async readSessionHistory() {
				return [{ stepLabel: "VALIDATE", kind: "completed", summary: "done" }];
			},
		} as unknown as SessionStateStore;
		const memoryInterface = {
			async loadSessionContext() {
				return null;
			},
		} as unknown as ReadPublicResourceOptions["memoryInterface"];

		const resource = await readPublicResource(
			"mcp-guidelines://session/session-123/context",
			"session-123",
			sessionStore,
			{ memoryInterface },
		);

		expect(resource.contents[0]?.mimeType).toBe("application/toon");
		expect(resource.contents[0]?.text).toContain("sessionId: session-123");
		expect(resource.contents[0]?.text).toMatch(/completed\[1\s*\]/);
		expect(resource.contents[0]?.text).toContain("VALIDATE");
	});

	it("reads the memory artifact index and individual memory artifacts", async () => {
		const artifact = {
			meta: {
				id: "memory-1",
				created: "2026-01-01T00:00:00.000Z",
				updated: "2026-01-02T00:00:00.000Z",
				tags: ["onboarding"],
				relevance: 10,
			},
			content: {
				summary: "Saved onboarding context",
				details: "Detailed context",
				context: "setup",
				actionable: false,
			},
			links: {
				relatedSessions: ["session-123"],
				relatedMemories: [],
				sources: ["test"],
			},
		};
		const sessionStore = {
			async readSessionHistory() {
				return [];
			},
		} as unknown as SessionStateStore;
		const memoryInterface = {
			async findMemoryArtifacts() {
				return [artifact];
			},
			async loadMemoryArtifact(memoryId: string) {
				return memoryId === "memory-1" ? artifact : null;
			},
			async loadSessionContext() {
				return null;
			},
		} as unknown as ReadPublicResourceOptions["memoryInterface"];

		const index = await readPublicResource(
			"mcp-guidelines://memory/artifacts",
			"session-123",
			sessionStore,
			{ memoryInterface },
		);
		expect(index.contents[0]?.text).toContain('"id": "memory-1"');
		expect(index.contents[0]?.text).toContain(
			'"uri": "mcp-guidelines://memory/artifacts/memory-1"',
		);

		const detail = await readPublicResource(
			"mcp-guidelines://memory/artifacts/memory-1",
			"session-123",
			sessionStore,
			{ memoryInterface },
		);
		expect(detail.contents[0]?.mimeType).toBe("application/toon");
		expect(detail.contents[0]?.text).toContain(
			"summary: Saved onboarding context",
		);
	});

	it("discovers supporting assets from the explicit runtime workspace root", async () => {
		const workspaceRoot = mkdtempSync(join(tmpdir(), "resource-surface-root-"));
		const sessionStore = {
			async readSessionHistory() {
				return [];
			},
		} as unknown as SessionStateStore;

		try {
			const skillRoot = join(
				workspaceRoot,
				".github",
				"skills",
				"core-runtime-root-skill",
			);
			mkdirSync(join(skillRoot, "explanation"), { recursive: true });
			writeFileSync(
				join(skillRoot, "SKILL.md"),
				[
					"---",
					"name: runtime-root-skill",
					"description: runtime root resource coverage",
					"---",
					"# Runtime Root Skill",
					"",
				].join("\n"),
				"utf8",
			);
			writeFileSync(
				join(skillRoot, "explanation", "guide.md"),
				"# Runtime Root Guide\n",
				"utf8",
			);

			const resources = buildPublicResources("session-123", { workspaceRoot });
			expect(
				resources.some(
					(resource) =>
						resource.uri ===
						"mcp-guidelines://supporting-assets/skills/core-runtime-root-skill",
				),
			).toBe(true);

			const explanation = await readPublicResource(
				"mcp-guidelines://supporting-assets/skills/core-runtime-root-skill/explanations/guide.md",
				"session-123",
				sessionStore,
				{ workspaceRoot },
			);
			expect(explanation.contents[0]?.text).toContain("Runtime Root Guide");
		} finally {
			rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});

	it("keeps supporting asset caches isolated per explicit workspace root", async () => {
		const firstWorkspaceRoot = mkdtempSync(
			join(tmpdir(), "resource-surface-root-a-"),
		);
		const secondWorkspaceRoot = mkdtempSync(
			join(tmpdir(), "resource-surface-root-b-"),
		);

		try {
			for (const [workspaceRoot, skillId] of [
				[firstWorkspaceRoot, "core-first-root-skill"],
				[secondWorkspaceRoot, "core-second-root-skill"],
			] as const) {
				const skillRoot = join(workspaceRoot, ".github", "skills", skillId);
				mkdirSync(skillRoot, { recursive: true });
				writeFileSync(join(skillRoot, "SKILL.md"), `# ${skillId}\n`, "utf8");
			}

			const firstResources = buildPublicResources("session-123", {
				workspaceRoot: firstWorkspaceRoot,
			});
			const secondResources = buildPublicResources("session-123", {
				workspaceRoot: secondWorkspaceRoot,
			});

			expect(
				firstResources.some((resource) =>
					resource.uri.endsWith("/skills/core-first-root-skill"),
				),
			).toBe(true);
			expect(
				firstResources.some((resource) =>
					resource.uri.endsWith("/skills/core-second-root-skill"),
				),
			).toBe(false);
			expect(
				secondResources.some((resource) =>
					resource.uri.endsWith("/skills/core-second-root-skill"),
				),
			).toBe(true);
			expect(
				secondResources.some((resource) =>
					resource.uri.endsWith("/skills/core-first-root-skill"),
				),
			).toBe(false);
		} finally {
			rmSync(firstWorkspaceRoot, { recursive: true, force: true });
			rmSync(secondWorkspaceRoot, { recursive: true, force: true });
		}
	});

	it("clearSupportingAssetCache evicts a specific workspace root so fresh skills are discovered", () => {
		const workspaceRoot = mkdtempSync(
			join(tmpdir(), "resource-surface-clear-"),
		);
		try {
			// Create initial skill
			const firstSkillRoot = join(
				workspaceRoot,
				".github",
				"skills",
				"core-clear-cache-skill",
			);
			mkdirSync(firstSkillRoot, { recursive: true });
			writeFileSync(
				join(firstSkillRoot, "SKILL.md"),
				"# core-clear-cache-skill\n",
				"utf8",
			);

			const firstResources = buildPublicResources("session-123", {
				workspaceRoot,
			});
			expect(
				firstResources.some((r) =>
					r.uri.endsWith("/skills/core-clear-cache-skill"),
				),
			).toBe(true);
			// Second skill does NOT exist yet in the first snapshot
			expect(
				firstResources.some((r) =>
					r.uri.endsWith("/skills/core-clear-cache-skill-v2"),
				),
			).toBe(false);

			// Add a new skill on disk while the cache is warm
			const secondSkillRoot = join(
				workspaceRoot,
				".github",
				"skills",
				"core-clear-cache-skill-v2",
			);
			mkdirSync(secondSkillRoot, { recursive: true });
			writeFileSync(
				join(secondSkillRoot, "SKILL.md"),
				"# core-clear-cache-skill-v2\n",
				"utf8",
			);

			// Without a cache clear the second skill is still invisible
			const stillCachedResources = buildPublicResources("session-123", {
				workspaceRoot,
			});
			expect(
				stillCachedResources.some((r) =>
					r.uri.endsWith("/skills/core-clear-cache-skill-v2"),
				),
			).toBe(false);

			// Evict the cache for this workspace root
			clearSupportingAssetCache(workspaceRoot);

			// After eviction the second skill is discovered
			const freshResources = buildPublicResources("session-123", {
				workspaceRoot,
			});
			expect(
				freshResources.some((r) =>
					r.uri.endsWith("/skills/core-clear-cache-skill-v2"),
				),
			).toBe(true);
		} finally {
			clearSupportingAssetCache(workspaceRoot);
			rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});

	it("clearSupportingAssetCache with no argument evicts all cached workspace roots", () => {
		const workspaceRootA = mkdtempSync(
			join(tmpdir(), "resource-surface-clear-all-a-"),
		);
		const workspaceRootB = mkdtempSync(
			join(tmpdir(), "resource-surface-clear-all-b-"),
		);
		try {
			for (const [root, skillId] of [
				[workspaceRootA, "core-clear-all-skill-a"],
				[workspaceRootB, "core-clear-all-skill-b"],
			] as const) {
				const skillRoot = join(root, ".github", "skills", skillId);
				mkdirSync(skillRoot, { recursive: true });
				writeFileSync(join(skillRoot, "SKILL.md"), `# ${skillId}\n`, "utf8");
			}

			// Warm up caches for both roots
			buildPublicResources("session-123", { workspaceRoot: workspaceRootA });
			buildPublicResources("session-123", { workspaceRoot: workspaceRootB });

			// Add new skills to both roots while caches are warm
			for (const [root, newSkillId] of [
				[workspaceRootA, "core-clear-all-skill-a-new"],
				[workspaceRootB, "core-clear-all-skill-b-new"],
			] as const) {
				const skillRoot = join(root, ".github", "skills", newSkillId);
				mkdirSync(skillRoot, { recursive: true });
				writeFileSync(join(skillRoot, "SKILL.md"), `# ${newSkillId}\n`, "utf8");
			}

			// Evict all caches at once
			clearSupportingAssetCache();

			// Both roots now discover their new skills
			const freshA = buildPublicResources("session-123", {
				workspaceRoot: workspaceRootA,
			});
			const freshB = buildPublicResources("session-123", {
				workspaceRoot: workspaceRootB,
			});

			expect(
				freshA.some((r) =>
					r.uri.endsWith("/skills/core-clear-all-skill-a-new"),
				),
			).toBe(true);
			expect(
				freshB.some((r) =>
					r.uri.endsWith("/skills/core-clear-all-skill-b-new"),
				),
			).toBe(true);
		} finally {
			clearSupportingAssetCache();
			rmSync(workspaceRootA, { recursive: true, force: true });
			rmSync(workspaceRootB, { recursive: true, force: true });
		}
	});
});
