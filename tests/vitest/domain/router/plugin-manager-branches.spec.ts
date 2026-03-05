/**
 * Branch coverage tests for plugin-manager.ts
 * Targets uncovered branches:
 * - capability not registered (null plugin)
 * - plugin returning error (pluginResult.error)
 * - Promise.allSettled rejected path
 * - mergeArtifacts for scripts, configs, workflows, issues, diagrams
 * - success without artifacts
 * - has() returning false
 */
import { describe, expect, it, vi } from "vitest";
import { PluginManager } from "../../../../src/domain/router/plugin-manager.js";
import type {
	ConfigArtifact,
	CrossCuttingCapability,
	DiagramArtifact,
	ScriptArtifact,
	WorkflowArtifact,
} from "../../../../src/domain/router/types.js";

const ctx = { approach: "chat", requestId: "req-1", metadata: {} };

// ─── Unregistered capability ──────────────────────────────────────────────────

describe("execute() – unregistered capability (null plugin branch)", () => {
	it("should return no artifacts when capability has no registered plugin", async () => {
		const pm = new PluginManager();
		const result = await pm.execute(
			["diagram" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.executed).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
		expect(result.artifacts).toEqual({});
	});

	it("should skip unregistered capabilities alongside registered ones", async () => {
		const pm = new PluginManager();
		pm.register({
			name: "diagram" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: { diagrams: [{ name: "d", type: "mermaid", content: "" }] },
			}),
		});
		const result = await pm.execute(
			["diagram", "workflow"] as CrossCuttingCapability[],
			{},
			ctx,
		);
		expect(result.executed).toContain("diagram");
		expect(result.executed).not.toContain("workflow");
	});
});

// ─── Plugin returns error ─────────────────────────────────────────────────────

describe("execute() – plugin returns error (pluginResult.error branch)", () => {
	it("should collect errors when plugin returns { success: false, error }", async () => {
		const pm = new PluginManager();
		const err = new Error("plugin exploded");
		pm.register({
			name: "config" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({ success: false, error: err }),
		});
		const result = await pm.execute(
			["config" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].error).toBe(err);
		expect(result.executed).toHaveLength(0);
	});

	it("should collect errors without adding to executed list", async () => {
		const pm = new PluginManager();
		pm.register({
			name: "issues" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: false,
				error: new Error("fail"),
			}),
		});
		const { executed, errors } = await pm.execute(
			["issues" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(executed).toHaveLength(0);
		expect(errors).toHaveLength(1);
		expect(errors[0].plugin).toBe("issues");
	});
});

// ─── Promise.allSettled rejected path ────────────────────────────────────────

describe("execute() – Promise.allSettled rejected (unknown plugin error)", () => {
	it("should handle plugin that throws exception", async () => {
		const pm = new PluginManager();
		pm.register({
			name: "shell-script" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockRejectedValue(new Error("async throw")),
		});
		const result = await pm.execute(
			["shell-script" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].plugin).toBe("unknown");
		expect(result.executed).toHaveLength(0);
	});

	it("should continue after one plugin throws, processing others", async () => {
		const pm = new PluginManager();
		pm.register({
			name: "shell-script" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockRejectedValue(new Error("crash")),
		});
		pm.register({
			name: "diagram" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: { diagrams: [{ name: "d", type: "mermaid", content: "x" }] },
			}),
		});
		const result = await pm.execute(
			["shell-script", "diagram"] as CrossCuttingCapability[],
			{},
			ctx,
		);
		expect(result.executed).toContain("diagram");
		expect(result.errors).toHaveLength(1);
	});
});

// ─── mergeArtifacts – scripts branch ─────────────────────────────────────────

describe("mergeArtifacts – scripts branch", () => {
	it("should merge scripts artifacts from plugin", async () => {
		const pm = new PluginManager();
		const script: ScriptArtifact = {
			name: "deploy.sh",
			platform: "bash",
			content: "#!/bin/bash\necho deploy",
		};
		pm.register({
			name: "shell-script" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: { scripts: [script] },
			}),
		});
		const result = await pm.execute(
			["shell-script" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.artifacts.scripts).toHaveLength(1);
		expect(result.artifacts.scripts?.[0].name).toBe("deploy.sh");
	});

	it("should accumulate scripts from multiple plugin calls", async () => {
		const pm = new PluginManager();
		pm.register({
			name: "shell-script" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: {
					scripts: [
						{ name: "a.sh", platform: "bash", content: "" },
						{ name: "b.sh", platform: "powershell", content: "" },
					],
				},
			}),
		});
		const result = await pm.execute(
			["shell-script" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.artifacts.scripts).toHaveLength(2);
	});
});

// ─── mergeArtifacts – configs branch ─────────────────────────────────────────

describe("mergeArtifacts – configs branch", () => {
	it("should merge config artifacts", async () => {
		const pm = new PluginManager();
		const config: ConfigArtifact = {
			name: ".eslintrc.json",
			format: "json",
			content: "{}",
		};
		pm.register({
			name: "config" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: { configs: [config] },
			}),
		});
		const result = await pm.execute(
			["config" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.artifacts.configs).toHaveLength(1);
		expect(result.artifacts.configs?.[0].name).toBe(".eslintrc.json");
	});
});

// ─── mergeArtifacts – workflows branch ───────────────────────────────────────

describe("mergeArtifacts – workflows branch", () => {
	it("should merge workflow artifacts", async () => {
		const pm = new PluginManager();
		const workflow: WorkflowArtifact = {
			name: "ci.yml",
			platform: "github",
			content: "name: CI",
		};
		pm.register({
			name: "workflow" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: { workflows: [workflow] },
			}),
		});
		const result = await pm.execute(
			["workflow" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.artifacts.workflows).toHaveLength(1);
		expect(result.artifacts.workflows?.[0].platform).toBe("github");
	});

	it("should merge workflows from multiple plugins", async () => {
		const pm = new PluginManager();
		pm.register({
			name: "workflow" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: {
					workflows: [
						{ name: "ci.yml", platform: "github", content: "" },
						{ name: "cd.yml", platform: "gitlab", content: "" },
					],
				},
			}),
		});
		const result = await pm.execute(
			["workflow" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.artifacts.workflows).toHaveLength(2);
	});
});

// ─── mergeArtifacts – issues branch ──────────────────────────────────────────

describe("mergeArtifacts – issues branch", () => {
	it("should merge issue artifacts", async () => {
		const pm = new PluginManager();
		pm.register({
			name: "issues" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: {
					issues: [{ name: "bug.md", content: "Bug template" }],
				},
			}),
		});
		const result = await pm.execute(
			["issues" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.artifacts.issues).toHaveLength(1);
		expect(result.artifacts.issues?.[0].name).toBe("bug.md");
	});
});

// ─── mergeArtifacts – diagrams branch ────────────────────────────────────────

describe("mergeArtifacts – diagrams branch", () => {
	it("should merge diagram artifacts", async () => {
		const pm = new PluginManager();
		const diagram: DiagramArtifact = {
			name: "arch.mmd",
			type: "mermaid",
			content: "graph TD\n  A-->B",
		};
		pm.register({
			name: "diagram" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: { diagrams: [diagram] },
			}),
		});
		const result = await pm.execute(
			["diagram" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.artifacts.diagrams).toHaveLength(1);
	});

	it("should accumulate diagrams from multiple calls", async () => {
		const pm = new PluginManager();
		pm.register({
			name: "diagram" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: {
					diagrams: [
						{ name: "a.mmd", type: "mermaid", content: "" },
						{ name: "b.mmd", type: "plantuml", content: "" },
					],
				},
			}),
		});
		const result = await pm.execute(
			["diagram" as CrossCuttingCapability],
			{},
			ctx,
		);
		expect(result.artifacts.diagrams).toHaveLength(2);
	});
});

// ─── Success without artifacts ────────────────────────────────────────────────

describe("execute() – success without artifacts", () => {
	it("should not add to executed when success=true but no artifacts property", async () => {
		const pm = new PluginManager();
		pm.register({
			name: "pr-template" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({ success: true }), // no artifacts key
		});
		const result = await pm.execute(
			["pr-template" as CrossCuttingCapability],
			{},
			ctx,
		);
		// success=true but artifacts undefined => condition `pluginResult?.success && pluginResult.artifacts`
		// is falsy since artifacts is undefined — also NOT an error path
		expect(result.executed).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
	});

	it("should handle null result from unregistered capability gracefully", async () => {
		const pm = new PluginManager();
		// Calling execute with no plugins registered
		const result = await pm.execute(
			["workflow", "config", "issues"] as CrossCuttingCapability[],
			{},
			ctx,
		);
		expect(result.executed).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
		expect(result.artifacts).toEqual({});
	});
});

// ─── has() returning false ────────────────────────────────────────────────────

describe("has() method", () => {
	it("should return false for unregistered capability", () => {
		const pm = new PluginManager();
		expect(pm.has("diagram" as CrossCuttingCapability)).toBe(false);
	});

	it("should return true after registration", () => {
		const pm = new PluginManager();
		pm.register({
			name: "diagram" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn(),
		});
		expect(pm.has("diagram" as CrossCuttingCapability)).toBe(true);
	});
});

// ─── Mixed artifact types in one execution ────────────────────────────────────

describe("execute() – mixed artifact types in parallel", () => {
	it("should merge all artifact types from multiple plugins", async () => {
		const pm = new PluginManager();
		pm.register({
			name: "diagram" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: { diagrams: [{ name: "d", type: "mermaid", content: "" }] },
			}),
		});
		pm.register({
			name: "workflow" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: {
					workflows: [{ name: "w.yml", platform: "github", content: "" }],
				},
			}),
		});
		pm.register({
			name: "config" as CrossCuttingCapability,
			version: "1.0",
			execute: vi.fn().mockResolvedValue({
				success: true,
				artifacts: {
					configs: [{ name: "c.json", format: "json", content: "" }],
				},
			}),
		});
		const result = await pm.execute(
			["diagram", "workflow", "config"] as CrossCuttingCapability[],
			{ data: "test" },
			ctx,
		);
		expect(result.executed).toContain("diagram");
		expect(result.executed).toContain("workflow");
		expect(result.executed).toContain("config");
		expect(result.artifacts.diagrams).toHaveLength(1);
		expect(result.artifacts.workflows).toHaveLength(1);
		expect(result.artifacts.configs).toHaveLength(1);
		expect(result.errors).toHaveLength(0);
	});
});
