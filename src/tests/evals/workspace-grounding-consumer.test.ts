import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { skillModule } from "../../skills/qual/qual-code-analysis.js";
import { createWorkspaceSurface } from "../../skills/runtime/workspace-adapter.js";
import { createMockSkillRuntime } from "../skills/test-helpers.js";

/**
 * Issue #1602 — a REAL headless / non-LLM consumer of `groundingScope: "workspace"`.
 *
 * Unlike the per-skill grounding tests (which inject a mock `WorkspaceReader`
 * returning a canned string), this exercises the *real* filesystem surface
 * `createWorkspaceSurface()` against *real files on disk* — no mock reader, no
 * sampler, no model in the loop. It proves the ADR 0001 reframe is not
 * speculative: a purely headless caller gets problem-specific findings that cite
 * file paths which actually resolve on disk.
 */

const RELATIVE_FILE = "src/payments/charge.ts";
// Content carrying a real type-boundary signal `qual-code-analysis` probes for.
const FILE_CONTENT =
	"export function charge(amount: any): any {\n\treturn amount as unknown;\n}\n";

let workspaceRoot: string;

beforeAll(async () => {
	workspaceRoot = await mkdtemp(join(tmpdir(), "grounding-consumer-"));
	const absFile = join(workspaceRoot, RELATIVE_FILE);
	await mkdir(join(workspaceRoot, "src", "payments"), { recursive: true });
	await writeFile(absFile, FILE_CONTENT, "utf8");
});

afterAll(async () => {
	if (workspaceRoot) await rm(workspaceRoot, { recursive: true, force: true });
});

describe("headless workspace-grounding consumer (#1602)", () => {
	it("produces workspace-grounded findings that cite a real on-disk file", async () => {
		// The consumer: real filesystem reader rooted at the temp workspace.
		const reader = createWorkspaceSurface(workspaceRoot);
		const runtime = createMockSkillRuntime({ workspace: reader });

		const result = await skillModule.run(
			{ request: `review ${RELATIVE_FILE} for quality problems` },
			runtime,
		);

		const grounded = result.recommendations.filter(
			(r) => r.groundingScope === "workspace",
		);

		// 1. Grounding actually fired with no model involved.
		expect(grounded.length).toBeGreaterThan(0);

		// 2. Every grounded finding cites the referenced path — problem-specific,
		//    not generic template advice.
		for (const rec of grounded) {
			expect(rec.detail).toContain(RELATIVE_FILE);
			expect(rec.evidenceAnchors).toContain(RELATIVE_FILE);
		}

		// 3. The crucial non-speculative check: the cited path resolves on disk.
		const citedPaths = new Set(
			grounded.flatMap((r) => r.evidenceAnchors ?? []),
		);
		for (const cited of citedPaths) {
			const info = await stat(join(workspaceRoot, cited));
			expect(info.isFile()).toBe(true);
		}
	});

	it("degrades to non-grounded findings when the workspace is absent", async () => {
		// Same request, no workspace reader — a headless caller with nothing to read
		// still gets output, just without workspace-scoped citations.
		const result = await skillModule.run(
			{ request: `review ${RELATIVE_FILE} for quality problems` },
			createMockSkillRuntime({}),
		);
		expect(
			result.recommendations.every((r) => r.groundingScope !== "workspace"),
		).toBe(true);
		expect(result.recommendations.length).toBeGreaterThan(0);
	});
});
