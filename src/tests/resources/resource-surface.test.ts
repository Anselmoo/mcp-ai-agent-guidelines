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

	it("reads alias, edge, and combined skill graph resources", async () => {
		const sessionStore = {
			async readSessionHistory() {
				return [];
			},
		} as unknown as SessionStateStore;

		const aliases = await readPublicResource(
			"mcp-guidelines://graph/aliases",
			"session-123",
			sessionStore,
		);
		const edges = await readPublicResource(
			"mcp-guidelines://graph/instruction-skill-edges",
			"session-123",
			sessionStore,
		);
		const skillGraph = await readPublicResource(
			"mcp-guidelines://graph/skill-graph",
			"session-123",
			sessionStore,
		);

		expect(aliases.contents[0]?.text).toContain("core-prompt-engineering");
		expect(edges.contents[0]?.text).toContain('"instructionId": "design"');
		expect(edges.contents[0]?.text).toContain('"skillId": "req-analysis"');
		expect(skillGraph.contents[0]?.text).toContain('"taxonomy"');
		expect(skillGraph.contents[0]?.text).toContain('"aliases"');
		expect(skillGraph.contents[0]?.text).toContain('"instructionSkillEdges"');
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

	it("rejects empty and missing memory artifact resource URIs", async () => {
		const sessionStore = {
			async readSessionHistory() {
				return [];
			},
		} as unknown as SessionStateStore;
		const memoryInterface = {
			async findMemoryArtifacts() {
				return [];
			},
			async loadMemoryArtifact() {
				return null;
			},
			async loadSessionContext() {
				return null;
			},
		} as unknown as ReadPublicResourceOptions["memoryInterface"];

		await expect(
			readPublicResource(
				"mcp-guidelines://memory/artifacts/",
				"session-123",
				sessionStore,
				{ memoryInterface },
			),
		).rejects.toThrow("Unknown resource");
		await expect(
			readPublicResource(
				"mcp-guidelines://memory/artifacts/missing-artifact",
				"session-123",
				sessionStore,
				{ memoryInterface },
			),
		).rejects.toThrow("Unknown resource");
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

	it("indexes supporting asset explanations and tools with sorted read-only resources", async () => {
		const workspaceRoot = mkdtempSync(
			join(tmpdir(), "resource-surface-assets-"),
		);
		const sessionStore = {
			async readSessionHistory() {
				return [];
			},
		} as unknown as SessionStateStore;

		try {
			const alphaSkillRoot = join(
				workspaceRoot,
				".github",
				"skills",
				"alpha-reference-skill",
			);
			const skippedSkillRoot = join(
				workspaceRoot,
				".github",
				"skills",
				"nohyphen",
			);
			const missingMarkdownRoot = join(
				workspaceRoot,
				".github",
				"skills",
				"beta-missing-markdown",
			);
			const zetaSkillRoot = join(
				workspaceRoot,
				".github",
				"skills",
				"zeta-asset-rich-skill",
			);
			mkdirSync(join(zetaSkillRoot, "explanation"), { recursive: true });
			mkdirSync(join(zetaSkillRoot, "tools", "nested"), { recursive: true });
			mkdirSync(alphaSkillRoot, { recursive: true });
			mkdirSync(skippedSkillRoot, { recursive: true });
			mkdirSync(missingMarkdownRoot, { recursive: true });

			writeFileSync(
				join(alphaSkillRoot, "SKILL.md"),
				["---", "name: alpha-reference-skill", "---", "# Alpha Reference"].join(
					"\n",
				),
				"utf8",
			);
			writeFileSync(
				join(zetaSkillRoot, "SKILL.md"),
				[
					"---",
					"name: zeta-asset-rich-skill",
					"description: >",
					"  rich supporting",
					"  asset coverage",
					"---",
					"# Zeta Asset Rich Skill",
				].join("\n"),
				"utf8",
			);
			writeFileSync(
				join(zetaSkillRoot, "explanation", "zebra.md"),
				"# Zebra\n",
				"utf8",
			);
			writeFileSync(
				join(zetaSkillRoot, "explanation", "alpha.md"),
				"# Alpha\n",
				"utf8",
			);
			writeFileSync(
				join(zetaSkillRoot, "explanation", "ignore.txt"),
				"ignored\n",
				"utf8",
			);
			writeFileSync(
				join(zetaSkillRoot, "tools", "z-tool.ts"),
				"export const zebra = true;\n",
				"utf8",
			);
			writeFileSync(
				join(zetaSkillRoot, "tools", "a-tool.ts"),
				"export const alpha = true;\n",
				"utf8",
			);
			writeFileSync(
				join(zetaSkillRoot, "tools", "package.json"),
				'{ "name": "zeta-tools" }\n',
				"utf8",
			);

			const resources = buildPublicResources("session-123", { workspaceRoot });
			expect(
				resources.some(
					(resource) =>
						resource.uri ===
						"mcp-guidelines://supporting-assets/skills/zeta-asset-rich-skill/tools/source/a-tool.ts",
				),
			).toBe(true);
			expect(
				resources.some(
					(resource) =>
						resource.uri ===
						"mcp-guidelines://supporting-assets/skills/zeta-asset-rich-skill/tools/package.json",
				),
			).toBe(true);

			const supportingAssetsIndex = await readPublicResource(
				"mcp-guidelines://supporting-assets",
				"session-123",
				sessionStore,
				{ workspaceRoot },
			);
			expect(supportingAssetsIndex.contents[0]?.text).toContain(
				'"family": "alpha"',
			);
			expect(supportingAssetsIndex.contents[0]?.text).toContain(
				'"family": "zeta"',
			);
			expect(
				supportingAssetsIndex.contents[0]?.text.indexOf('"family": "alpha"'),
			).toBeLessThan(
				supportingAssetsIndex.contents[0]?.text.indexOf('"family": "zeta"'),
			);

			const skillIndex = await readPublicResource(
				"mcp-guidelines://supporting-assets/skills/zeta-asset-rich-skill",
				"session-123",
				sessionStore,
				{ workspaceRoot },
			);
			expect(skillIndex.contents[0]?.text).toContain('"fileName": "alpha.md"');
			expect(skillIndex.contents[0]?.text).toContain('"fileName": "zebra.md"');
			expect(skillIndex.contents[0]?.text).toContain('"fileName": "a-tool.ts"');
			expect(skillIndex.contents[0]?.text).toContain('"fileName": "z-tool.ts"');
			expect(skillIndex.contents[0]?.text).toContain(
				'"description": "rich supporting asset coverage"',
			);
			expect(skillIndex.contents[0]?.text).not.toContain(
				'"fileName": "ignore.txt"',
			);
			expect(skillIndex.contents[0]?.text).not.toContain(
				'"fileName": "package.json"',
			);
			expect(skillIndex.contents[0]?.text).not.toContain("nohyphen");
			expect(skillIndex.contents[0]?.text).not.toContain(
				"beta-missing-markdown",
			);
			expect(skillIndex.contents[0]?.text).toContain(
				'"toolPackageUri": "mcp-guidelines://supporting-assets/skills/zeta-asset-rich-skill/tools/package.json"',
			);

			const toolsIndex = await readPublicResource(
				"mcp-guidelines://supporting-assets/skills/zeta-asset-rich-skill/tools",
				"session-123",
				sessionStore,
				{ workspaceRoot },
			);
			expect(toolsIndex.contents[0]?.text).toContain('"packageJsonUri":');
			expect(toolsIndex.contents[0]?.text).toContain('"fileName": "a-tool.ts"');
			expect(toolsIndex.contents[0]?.text).toContain('"fileName": "z-tool.ts"');
			expect(toolsIndex.contents[0]?.text).not.toContain(
				'"fileName": "package.json"',
			);

			const explanation = await readPublicResource(
				"mcp-guidelines://supporting-assets/skills/zeta-asset-rich-skill/explanations/alpha.md",
				"session-123",
				sessionStore,
				{ workspaceRoot },
			);
			expect(explanation.contents[0]?.text).toContain("# Alpha");

			const toolSource = await readPublicResource(
				"mcp-guidelines://supporting-assets/skills/zeta-asset-rich-skill/tools/source/a-tool.ts",
				"session-123",
				sessionStore,
				{ workspaceRoot },
			);
			expect(toolSource.contents[0]?.text).toContain(
				"export const alpha = true;",
			);

			const toolPackage = await readPublicResource(
				"mcp-guidelines://supporting-assets/skills/zeta-asset-rich-skill/tools/package.json",
				"session-123",
				sessionStore,
				{ workspaceRoot },
			);
			expect(toolPackage.contents[0]?.text).toContain('"name": "zeta-tools"');
		} finally {
			clearSupportingAssetCache(workspaceRoot);
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
