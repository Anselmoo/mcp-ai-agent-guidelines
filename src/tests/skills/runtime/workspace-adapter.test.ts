import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
	createWorkspaceReader,
	createWorkspaceSurface,
} from "../../../skills/runtime/workspace-adapter.js";

const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

describe("workspace-adapter", () => {
	it("guards against path traversal and hides dotfiles from listings", async () => {
		const surface = createWorkspaceSurface(REPO_ROOT);

		await expect(surface.listFiles("../")).rejects.toThrow(
			"Workspace path traversal is not allowed",
		);
		await expect(surface.readFile("../package.json")).rejects.toThrow(
			"Workspace path traversal is not allowed",
		);

		const entries = await surface.listFiles(".");
		expect(entries.length).toBeGreaterThan(0);
		expect(entries.every((entry) => !entry.name.startsWith("."))).toBe(true);
	});

	it("reads workspace files through the reader facade", async () => {
		const reader = createWorkspaceReader(REPO_ROOT);
		const content = await reader.readFile("README.md");

		expect(content).toContain("mcp-ai-agent-guidelines");
	});

	it("serializes and validates workspace artifacts through the memory interface", async () => {
		const memoryInterface = {
			loadSessionContext: vi.fn(async () => null),
			loadWorkspaceMap: vi.fn(async () => ({
				generated: "2024-01-01T00:00:00.000Z",
				modules: {
					core: { path: "src", files: ["a.ts"], dependencies: [] },
				},
			})),
			loadScanResults: vi.fn(async () => ({ findings: 2 })),
			loadFingerprintSnapshot: vi.fn(async () => ({
				meta: {
					version: "2",
					snapshotId: "20260411000000-deadbeef",
					capturedAt: "2026-04-11T00:00:00.000Z",
					previousSnapshotId: null,
				},
				fingerprint: { hash: "abc" },
			})),
			saveSessionContext: vi.fn(async () => undefined),
			saveWorkspaceMap: vi.fn(async () => undefined),
			saveScanResults: vi.fn(async () => undefined),
			compare: vi.fn(async () => ({
				drift: { changed: [], added: [], removed: [] },
				toon: "toon",
			})),
			refresh: vi.fn(async () => ({ hash: "fresh" })),
		};
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});

		expect(await surface.listArtifacts("session-1")).toEqual([
			{ kind: "session-context", encoding: "toon", present: false },
			{ kind: "workspace-map", encoding: "json", present: true },
			{ kind: "scan-results", encoding: "json", present: true },
			{ kind: "fingerprint-snapshot", encoding: "json", present: true },
		]);

		expect(
			await surface.readArtifact({
				artifact: "workspace-map",
				sessionId: "session-1",
			}),
		).toContain('"core"');
		await expect(
			surface.writeArtifact({
				artifact: "workspace-map",
				sessionId: "session-1",
				value: [],
			}),
		).rejects.toThrow("Workspace maps must be an object keyed by module name.");

		await surface.writeArtifact({
			artifact: "workspace-map",
			sessionId: "session-1",
			value: {
				generated: "2024-01-02T00:00:00.000Z",
				modules: {
					core: { path: "src", files: ["b.ts"], dependencies: ["shared"] },
				},
			},
		});
		expect(memoryInterface.saveWorkspaceMap).toHaveBeenCalledWith("session-1", {
			generated: "2024-01-02T00:00:00.000Z",
			modules: {
				core: { path: "src", files: ["b.ts"], dependencies: ["shared"] },
			},
		});

		await surface.writeArtifact({
			artifact: "scan-results",
			sessionId: "session-1",
			value: { findings: 3 },
		});
		expect(memoryInterface.saveScanResults).toHaveBeenCalledWith("session-1", {
			findings: 3,
		});

		const bundle = await surface.fetchContext("session-1", "README.md");
		expect(bundle.sourceFile?.content).toContain("mcp-ai-agent-guidelines");
		expect(bundle.artifacts.workspaceMap).toEqual({
			generated: "2024-01-01T00:00:00.000Z",
			modules: {
				core: { path: "src", files: ["a.ts"], dependencies: [] },
			},
		});
		const compareResult = await surface.compare();
		expect(compareResult.drift).toEqual({
			changed: [],
			added: [],
			removed: [],
		});
		expect(compareResult.toon).toBe("toon");
		expect(compareResult.selector).toBe("latest");
		expect(compareResult.baselineMeta?.snapshotId).toBe(
			"20260411000000-deadbeef",
		);
		expect(await surface.refresh()).toEqual({ hash: "fresh" });
	});
});
