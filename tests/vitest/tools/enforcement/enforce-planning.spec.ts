import { describe, expect, it } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";
import {
	enforceP,
	enforcePlanningRequestSchema,
} from "../../../../src/tools/enforcement/enforce-planning.js";

// Helper: create a temp dir with given files
function makeTempProject(
	files: Record<string, string>,
): { dir: string; cleanup: () => void } {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "enforce-planning-test-"));
	for (const [name, content] of Object.entries(files)) {
		fs.writeFileSync(path.join(dir, name), content, "utf-8");
	}
	return {
		dir,
		cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
	};
}

describe("enforce-planning", () => {
	describe("enforcePlanningRequestSchema", () => {
		it("validates a minimal request", () => {
			const result = enforcePlanningRequestSchema.safeParse({
				projectPath: "/some/path",
			});
			expect(result.success).toBe(true);
		});

		it("applies default requireApproval=true", () => {
			const result = enforcePlanningRequestSchema.safeParse({
				projectPath: "/some/path",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.requireApproval).toBe(true);
			}
		});

		it("rejects missing projectPath", () => {
			const result = enforcePlanningRequestSchema.safeParse({});
			expect(result.success).toBe(false);
		});
	});

	describe("enforceP", () => {
		it("allows when both spec.md and plan.md exist and are valid", () => {
			const { dir, cleanup } = makeTempProject({
				"spec.md": "# Spec\n\nStatus: Approved\n",
				"plan.md": "# Plan\n\n## Phase 1: Setup\n",
			});
			try {
				const result = enforceP({ projectPath: dir });
				expect(result.allowed).toBe(true);
				expect(result.specMd.exists).toBe(true);
				expect(result.planMd.exists).toBe(true);
				expect(result.blockedReason).toBeUndefined();
			} finally {
				cleanup();
			}
		});

		it("blocks when spec.md is missing", () => {
			const { dir, cleanup } = makeTempProject({
				"plan.md": "# Plan\n\n## Phase 1: Setup\n",
			});
			try {
				const result = enforceP({ projectPath: dir });
				expect(result.allowed).toBe(false);
				expect(result.specMd.exists).toBe(false);
				expect(result.blockedReason).toContain("Code generation blocked");
			} finally {
				cleanup();
			}
		});

		it("blocks when plan.md is missing", () => {
			const { dir, cleanup } = makeTempProject({
				"spec.md": "# Spec\n\nStatus: Approved\n",
			});
			try {
				const result = enforceP({ projectPath: dir });
				expect(result.allowed).toBe(false);
				expect(result.planMd.exists).toBe(false);
			} finally {
				cleanup();
			}
		});

		it("blocks when spec.md not approved", () => {
			const { dir, cleanup } = makeTempProject({
				"spec.md": "# Spec\n\nStatus: Draft\n",
				"plan.md": "# Plan\n\n## Phase 1: Setup\n",
			});
			try {
				const result = enforceP({ projectPath: dir });
				expect(result.allowed).toBe(false);
				expect(result.specMd.approved).toBe(false);
			} finally {
				cleanup();
			}
		});

		it("blocks when plan.md has no phases", () => {
			const { dir, cleanup } = makeTempProject({
				"spec.md": "# Spec\n\nStatus: Approved\n",
				"plan.md": "# Plan\n\nJust a description, no phases defined.\n",
			});
			try {
				const result = enforceP({ projectPath: dir });
				expect(result.allowed).toBe(false);
				expect(result.planMd.hasPhases).toBe(false);
			} finally {
				cleanup();
			}
		});

		it("allows with planningDir override", () => {
			const { dir, cleanup } = makeTempProject({});
			const sub = path.join(dir, "docs");
			fs.mkdirSync(sub, { recursive: true });
			fs.writeFileSync(path.join(sub, "spec.md"), "Status: Approved\n");
			fs.writeFileSync(path.join(sub, "plan.md"), "## Phase 1\n");
			try {
				const result = enforceP({ projectPath: dir, planningDir: "docs" });
				expect(result.allowed).toBe(true);
			} finally {
				cleanup();
			}
		});

		it("skips approval check when requireApproval=false", () => {
			const { dir, cleanup } = makeTempProject({
				"spec.md": "# Spec (Draft)\n",
				"plan.md": "# Plan\n\n## Phase 1\n",
			});
			try {
				const result = enforceP({
					projectPath: dir,
					requireApproval: false,
				});
				expect(result.allowed).toBe(true);
			} finally {
				cleanup();
			}
		});

		it("returns structured summary string", () => {
			const { dir, cleanup } = makeTempProject({
				"spec.md": "Status: Approved\n",
				"plan.md": "## Phase 1\n",
			});
			try {
				const result = enforceP({ projectPath: dir });
				expect(result.summary).toContain("Planning artifacts");
			} finally {
				cleanup();
			}
		});
	});
});
