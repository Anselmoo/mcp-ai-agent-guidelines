/**
 * Integration tests for Phases 3–5 of v0.14.x consolidation.
 * Verifies framework facades, PAL, enforcement tools, and CI artifacts work together.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(new URL(".", import.meta.url).pathname, "../../../");

// ============================================================================
// Phase 3: Framework Consolidation
// ============================================================================

describe("Phase 3 – Framework Consolidation", () => {
	it("should import all 11 framework facades without error", async () => {
		const { frameworkRouter } = await import(
			"../../../src/frameworks/index.js"
		);
		expect(frameworkRouter).toBeDefined();
	});

	it("should list all 11 registered framework names", async () => {
		const { frameworkRouter } = await import(
			"../../../src/frameworks/index.js"
		);
		const names = frameworkRouter.list();
		expect(names).toHaveLength(11);
		expect(names).toContain("prompt-engineering");
		expect(names).toContain("code-quality");
		expect(names).toContain("design-architecture");
		expect(names).toContain("security");
		expect(names).toContain("testing");
		expect(names).toContain("documentation");
		expect(names).toContain("strategic-planning");
		expect(names).toContain("agent-orchestration");
		expect(names).toContain("prompt-optimization");
		expect(names).toContain("visualization");
		expect(names).toContain("project-management");
	});

	it("should execute a framework facade and return a result", async () => {
		const { frameworkRouter } = await import(
			"../../../src/frameworks/index.js"
		);
		const framework = frameworkRouter.get("code-quality");
		expect(framework).toBeDefined();
		if (framework) {
			const result = await framework.execute({ action: "score" });
			expect(result).toBeDefined();
		}
	});

	it("should export DeprecationRegistry from deprecation-helpers", async () => {
		const { DeprecationRegistry, warnDeprecated } = await import(
			"../../../src/tools/shared/deprecation-helpers.js"
		);
		expect(DeprecationRegistry).toBeDefined();
		expect(warnDeprecated).toBeDefined();
	});

	it("should export validateProgress from enforcement tools", async () => {
		const { validateProgress } = await import(
			"../../../src/tools/enforcement/validate-progress.js"
		);
		expect(typeof validateProgress).toBe("function");
	});

	it("should run validateProgress on a nonexistent path without throwing", async () => {
		const { validateProgress } = await import(
			"../../../src/tools/enforcement/validate-progress.js"
		);
		const result = await validateProgress({
			projectPath: "/tmp/does-not-exist-phase3-test",
		});
		expect(result).toBeDefined();
		// Should either produce a result or handle gracefully (no uncaught throw)
	});
});

// ============================================================================
// Phase 4: Platform Abstraction Layer
// ============================================================================

describe("Phase 4 – Platform Abstraction Layer", () => {
	it("should import MockPAL and perform in-memory operations", async () => {
		const { MockPAL } = await import("../../../src/platform/mock-pal.js");
		const pal = new MockPAL();
		await pal.writeFile("/test/hello.txt", "hello");
		const content = await pal.readFile("/test/hello.txt");
		expect(content).toBe("hello");
	});

	it("should support joinPath on MockPAL", async () => {
		const { MockPAL } = await import("../../../src/platform/mock-pal.js");
		const pal = new MockPAL();
		const result = pal.joinPath("a", "b", "c");
		expect(result).toBe("a/b/c");
	});

	it("should support PAL singleton getPal/setPal", async () => {
		const { getPal, setPal } = await import("../../../src/platform/index.js");
		const { MockPAL } = await import("../../../src/platform/mock-pal.js");
		const mock = new MockPAL();
		setPal(mock);
		expect(getPal()).toBe(mock);
	});
});

// ============================================================================
// Phase 5: CI/CD & Documentation Artifacts
// ============================================================================

describe("Phase 5 – CI/CD and Documentation", () => {
	it("should have validate-progress.yml workflow", () => {
		expect(
			existsSync(join(ROOT, ".github/workflows/validate-progress.yml")),
		).toBe(true);
	});

	it("should have validate-annotations.yml workflow", () => {
		expect(
			existsSync(join(ROOT, ".github/workflows/validate-annotations.yml")),
		).toBe(true);
	});

	it("should have validate-schema-examples.yml workflow", () => {
		expect(
			existsSync(join(ROOT, ".github/workflows/validate-schema-examples.yml")),
		).toBe(true);
	});

	it("should have docs/api/README.md", () => {
		expect(existsSync(join(ROOT, "docs/api/README.md"))).toBe(true);
	});

	it("should have docs/guides/migration-v0.14.x.md", () => {
		expect(existsSync(join(ROOT, "docs/guides/migration-v0.14.x.md"))).toBe(
			true,
		);
	});

	it("should have artifacts/tool-descriptions.csv", () => {
		expect(existsSync(join(ROOT, "artifacts/tool-descriptions.csv"))).toBe(
			true,
		);
	});

	it("should have export:descriptions npm script", async () => {
		const pkg = (
			await import(join(ROOT, "package.json"), { with: { type: "json" } })
		).default as Record<string, unknown>;
		const scripts = pkg.scripts as Record<string, string>;
		expect(scripts["export:descriptions"]).toBeDefined();
	});
});
