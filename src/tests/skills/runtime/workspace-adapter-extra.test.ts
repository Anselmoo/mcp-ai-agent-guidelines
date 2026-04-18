import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
	createWorkspaceReader,
	createWorkspaceSurface,
} from "../../../skills/runtime/workspace-adapter.js";

const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

// Helper to build a mock memory interface where all loaders return null
function makeNullMemoryInterface() {
	return {
		loadSessionContext: vi.fn(async () => null),
		loadWorkspaceMap: vi.fn(async () => null),
		loadScanResults: vi.fn(async () => null),
		loadFingerprintSnapshot: vi.fn(async () => null),
		saveSessionContext: vi.fn(async () => undefined),
		saveWorkspaceMap: vi.fn(async () => undefined),
		saveScanResults: vi.fn(async () => undefined),
		compare: vi.fn(async () => ({
			drift: { changed: [], added: [], removed: [] },
			toon: "toon-content",
		})),
		refresh: vi.fn(async () => ({ hash: "fresh" })),
	};
}

describe("workspace-adapter-extra", () => {
	it("creates a reader via createWorkspaceReader (default ToonMemoryInterface)", async () => {
		const reader = createWorkspaceReader(REPO_ROOT);
		// Basic sanity: readFile works via the reader facade
		const content = await reader.readFile("package.json");
		expect(content).toContain("mcp-ai-agent-guidelines");
	});

	it("lists files for a path without trailing separator (line 124 normal path)", async () => {
		const surface = createWorkspaceSurface(REPO_ROOT);
		const entries = await surface.listFiles("src");
		expect(entries.length).toBeGreaterThan(0);
		expect(entries.every((e) => !e.name.startsWith("."))).toBe(true);
	});

	it("returns empty array when the target directory does not exist (line 149 catch)", async () => {
		const surface = createWorkspaceSurface(REPO_ROOT);
		// Non-existent directory — listFiles should degrade gracefully
		const entries = await surface.listFiles("src/does-not-exist-xyz");
		expect(entries).toEqual([]);
	});

	it("throws for a non-existent file in readFile (line 158 error path)", async () => {
		const surface = createWorkspaceSurface(REPO_ROOT);
		await expect(
			surface.readFile("src/does-not-exist-xyz.ts"),
		).rejects.toThrow();
	});

	it("all artifacts show present:false when loaders return null (lines 169 null branches)", async () => {
		const memoryInterface = makeNullMemoryInterface();
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		const artifacts = await surface.listArtifacts("session-null");
		expect(artifacts).toEqual([
			{ kind: "session-context", encoding: "toon", present: false },
			{ kind: "workspace-map", encoding: "json", present: false },
			{ kind: "scan-results", encoding: "json", present: false },
			{ kind: "fingerprint-snapshot", encoding: "json", present: false },
		]);
	});

	it("readArtifact throws when session context is not found (line 254 null branch)", async () => {
		const memoryInterface = makeNullMemoryInterface();
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		await expect(
			surface.readArtifact({ artifact: "session-context", sessionId: "s1" }),
		).rejects.toThrow("Session context not found for s1");
	});

	it("readArtifact throws when workspace map is not found (line 258 null branch)", async () => {
		const memoryInterface = makeNullMemoryInterface();
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		await expect(
			surface.readArtifact({ artifact: "workspace-map", sessionId: "s1" }),
		).rejects.toThrow("Workspace map not found for s1");
	});

	it("readArtifact throws when scan results are not found (line 266 null branch)", async () => {
		const memoryInterface = makeNullMemoryInterface();
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		await expect(
			surface.readArtifact({ artifact: "scan-results", sessionId: "s1" }),
		).rejects.toThrow("Scan results not found for s1");
	});

	it("readArtifact throws when fingerprint snapshot is not found (line 273 null branch)", async () => {
		const memoryInterface = makeNullMemoryInterface();
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		await expect(
			surface.readArtifact({
				artifact: "fingerprint-snapshot",
				sessionId: "s1",
			}),
		).rejects.toThrow("Fingerprint snapshot not found");
	});

	it("fetchContext returns null sourceFile when no sourcePath is given (line 280 null branch)", async () => {
		const memoryInterface = makeNullMemoryInterface();
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		const ctx = await surface.fetchContext("session-no-path");
		expect(ctx.sourceFile).toBeNull();
		expect(ctx.sessionId).toBe("session-no-path");
		expect(ctx.artifacts.sessionContext).toBeNull();
		expect(ctx.artifacts.workspaceMap).toBeNull();
		expect(ctx.artifacts.scanResults).toBeNull();
		expect(ctx.artifacts.fingerprintSnapshot).toBeNull();
	});

	it("fetchContext reads source file when sourcePath is provided", async () => {
		const memoryInterface = makeNullMemoryInterface();
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		const ctx = await surface.fetchContext("session-with-path", "package.json");
		expect(ctx.sourceFile).not.toBeNull();
		expect(ctx.sourceFile?.path).toBe("package.json");
		expect(ctx.sourceFile?.content).toContain("mcp-ai-agent-guidelines");
	});

	it("compare returns null baselineMeta when no snapshot exists for selector (line 338 null branch)", async () => {
		const memoryInterface = makeNullMemoryInterface();
		// loadFingerprintSnapshot returns null for the selector
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		const result = await surface.compare("latest");
		expect(result.baselineMeta).toBeNull();
		expect(result.selector).toBe("latest");
		expect(result.drift).toBeDefined();
		expect(result.toon).toBe("toon-content");
	});

	it("compare includes baselineMeta when snapshot is found (line 359-361 truthy branch)", async () => {
		const memoryInterface = {
			...makeNullMemoryInterface(),
			loadFingerprintSnapshot: vi.fn(async () => ({
				meta: {
					version: "2",
					snapshotId: "20260411000000-deadbeef",
					capturedAt: "2026-04-11T00:00:00.000Z",
					previousSnapshotId: null,
				},
				fingerprint: { hash: "abc" },
			})),
		};
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		const result = await surface.compare("latest");
		expect(result.baselineMeta).not.toBeNull();
		expect(result.baselineMeta?.snapshotId).toBe("20260411000000-deadbeef");
		expect(result.baselineMeta?.capturedAt).toBe("2026-04-11T00:00:00.000Z");
	});

	it("refresh delegates to memoryInterface.refresh (line 361 area)", async () => {
		const memoryInterface = makeNullMemoryInterface();
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		const fp = await surface.refresh();
		expect(fp).toEqual({ hash: "fresh" });
		expect(memoryInterface.refresh).toHaveBeenCalledOnce();
	});

	it("createWorkspaceSurface with no memoryInterface uses default ToonMemoryInterface", async () => {
		// No memoryInterface option — should not throw, uses default
		const surface = createWorkspaceSurface(REPO_ROOT);
		const entries = await surface.listFiles(".");
		expect(entries.length).toBeGreaterThan(0);
	});

	it("writeArtifact for scan-results persists value via memoryInterface", async () => {
		const memoryInterface = makeNullMemoryInterface();
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		await surface.writeArtifact({
			artifact: "scan-results",
			sessionId: "s1",
			value: { findings: 3 },
		});
		expect(memoryInterface.saveScanResults).toHaveBeenCalledWith("s1", {
			findings: 3,
		});
	});

	it("writeArtifact for workspace-map normalises and persists value", async () => {
		const memoryInterface = makeNullMemoryInterface();
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		const mapValue = {
			generated: "2024-01-01T00:00:00.000Z",
			modules: {
				core: { path: "src", files: ["a.ts"], dependencies: [] },
			},
		};
		await surface.writeArtifact({
			artifact: "workspace-map",
			sessionId: "s2",
			value: mapValue,
		});
		expect(memoryInterface.saveWorkspaceMap).toHaveBeenCalledWith(
			"s2",
			expect.objectContaining({ modules: expect.any(Object) }),
		);
	});

	it("fetchContext with non-record scanResults normalises to null (line 280 isRecord check)", async () => {
		const memoryInterface = {
			...makeNullMemoryInterface(),
			loadScanResults: vi.fn(async () => "not-an-object" as unknown),
		};
		const surface = createWorkspaceSurface(REPO_ROOT, {
			memoryInterface: memoryInterface as never,
		});
		const ctx = await surface.fetchContext("session-bad-scan");
		expect(ctx.artifacts.scanResults).toBeNull();
	});
});
