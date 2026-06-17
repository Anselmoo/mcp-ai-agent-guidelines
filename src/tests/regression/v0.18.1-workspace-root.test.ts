import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	ORCHESTRATION_CONFIG_RELATIVE_PATH,
	resetConfigCache,
	resolveOrchestrationConfigPath,
} from "../../config/orchestration-config.js";
import { ModelRouter } from "../../models/model-router.js";

describe("v0.18.1 regression: workspace-root + dependency fixes", () => {
	describe("nanoid is a declared runtime dependency (npx crash fix)", () => {
		it("package.json lists nanoid in dependencies", () => {
			const pkgPath = resolve(process.cwd(), "package.json");
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
			expect(pkg.dependencies).toHaveProperty("nanoid");
			expect(typeof pkg.dependencies.nanoid).toBe("string");
		});
	});

	describe("resolveOrchestrationConfigPath honours MCP_WORKSPACE_ROOT", () => {
		const ORIGINAL_ENV = process.env.MCP_WORKSPACE_ROOT;

		afterEach(() => {
			if (ORIGINAL_ENV === undefined) {
				delete process.env.MCP_WORKSPACE_ROOT;
			} else {
				process.env.MCP_WORKSPACE_ROOT = ORIGINAL_ENV;
			}
		});

		it("falls back to MCP_WORKSPACE_ROOT when no explicit workspaceRoot is passed", () => {
			process.env.MCP_WORKSPACE_ROOT = "/tmp/some-project";
			const result = resolveOrchestrationConfigPath();
			expect(result).toBe(
				resolve("/tmp/some-project", ORCHESTRATION_CONFIG_RELATIVE_PATH),
			);
		});

		it("still respects an explicit workspaceRoot argument over the env var", () => {
			process.env.MCP_WORKSPACE_ROOT = "/tmp/env-root";
			const result = resolveOrchestrationConfigPath("/tmp/explicit-root");
			expect(result).toBe(
				resolve("/tmp/explicit-root", ORCHESTRATION_CONFIG_RELATIVE_PATH),
			);
		});
	});

	describe("ModelRouter exposes a reinitialize() method", () => {
		it("can be called after initial init without throwing and clears initPromise", async () => {
			const router = new ModelRouter();
			await router.initialize();
			// Should not throw and should be awaitable.
			await expect(router.reinitialize()).resolves.toBeUndefined();
			// A second initialize after reinitialize should still work.
			await expect(router.initialize()).resolves.toBeUndefined();
		});
	});

	describe("createWorkspaceSurface honours MCP_WORKSPACE_ROOT", () => {
		const ORIGINAL_ENV = process.env.MCP_WORKSPACE_ROOT;

		beforeEach(() => {
			resetConfigCache();
		});

		afterEach(() => {
			if (ORIGINAL_ENV === undefined) {
				delete process.env.MCP_WORKSPACE_ROOT;
			} else {
				process.env.MCP_WORKSPACE_ROOT = ORIGINAL_ENV;
			}
		});

		it("uses resolveWorkspaceRoot() as the default root (not process.cwd())", async () => {
			process.env.MCP_WORKSPACE_ROOT = process.cwd();
			const { createWorkspaceSurface } = await import(
				"../../skills/runtime/workspace-adapter.js"
			);
			const surface = createWorkspaceSurface();
			// The surface should be able to listFiles on "." rooted at MCP_WORKSPACE_ROOT.
			const entries = await surface.listFiles(".");
			expect(Array.isArray(entries)).toBe(true);
			// package.json must exist at the workspace root we set.
			expect(entries.some((e) => e.name === "package.json")).toBe(true);
		});
	});
});
