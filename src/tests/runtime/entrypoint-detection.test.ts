import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { isDirectExecutionEntry } from "../../index.js";

describe("entrypoint detection", () => {
	it("treats a symlinked bin path as direct execution", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "entrypoint-detection-"));

		try {
			const realEntry = join(tempDir, "index.js");
			const symlinkEntry = join(tempDir, "mcp-ai-agent-guidelines");
			writeFileSync(realEntry, "#!/usr/bin/env node\n");
			symlinkSync(realEntry, symlinkEntry);

			expect(
				isDirectExecutionEntry(symlinkEntry, pathToFileURL(realEntry).href),
			).toBe(true);
			expect(
				isDirectExecutionEntry(realEntry, pathToFileURL(realEntry).href),
			).toBe(true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("does not auto-execute when invoked through another entrypoint", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "entrypoint-detection-"));

		try {
			const entry = join(tempDir, "index.js");
			const otherEntry = join(tempDir, "other.js");
			writeFileSync(entry, "#!/usr/bin/env node\n");
			writeFileSync(otherEntry, "#!/usr/bin/env node\n");

			expect(
				isDirectExecutionEntry(otherEntry, pathToFileURL(entry).href),
			).toBe(false);
			expect(isDirectExecutionEntry(undefined, pathToFileURL(entry).href)).toBe(
				false,
			);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
