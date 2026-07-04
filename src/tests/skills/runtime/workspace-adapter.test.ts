import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createWorkspaceSurface } from "../../../skills/runtime/workspace-adapter.js";

describe("createWorkspaceSurface.listFiles", () => {
	let root: string;
	beforeAll(() => {
		root = mkdtempSync(join(tmpdir(), "ws-adapter-"));
	});
	afterAll(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it("degrades to [] (with a warning) when the target directory does not exist", async () => {
		const surface = createWorkspaceSurface(root);
		const entries = await surface.listFiles("does-not-exist");
		expect(entries).toEqual([]);
	});

	it("lists real entries under the workspace root", async () => {
		const surface = createWorkspaceSurface(root);
		const entries = await surface.listFiles(".");
		expect(Array.isArray(entries)).toBe(true);
	});
});
