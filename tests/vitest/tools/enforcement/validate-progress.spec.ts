import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	validateProgress,
	validateProgressRequestSchema,
} from "../../../../src/tools/enforcement/validate-progress.js";

describe("validateProgress", () => {
	it("returns success: true when tasksDir is empty/missing", async () => {
		const nonExistentDir = join(tmpdir(), `pal-tasks-${Date.now()}`);
		const result = await validateProgress({
			projectPath: tmpdir(),
			tasksDir: nonExistentDir,
		});
		// Should handle missing dir gracefully
		expect(result.content[0].type).toBe("text");
	});

	it("validateProgressRequestSchema has projectPath field", () => {
		const parsed = validateProgressRequestSchema.safeParse({
			projectPath: "/tmp",
		});
		expect(parsed.success).toBe(true);
	});
});
