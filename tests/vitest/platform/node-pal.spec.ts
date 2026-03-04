import { randomBytes } from "node:crypto";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NodePAL } from "../../../src/platform/node-pal.js";

describe("NodePAL", () => {
	it("joinPath() delegates to node:path", () => {
		const pal = new NodePAL();
		expect(pal.joinPath("/a", "b", "c")).toBe(join("/a", "b", "c"));
	});

	it("writes and reads a file", async () => {
		const pal = new NodePAL();
		const file = join(
			tmpdir(),
			`pal-test-${randomBytes(4).toString("hex")}.txt`,
		);
		await pal.writeFile(file, "hello pal");
		const content = await pal.readFile(file);
		expect(content).toBe("hello pal");
		await pal.deleteFile(file, { force: true });
	});

	it("exists() returns false for nonexistent path", async () => {
		const pal = new NodePAL();
		expect(await pal.exists("/no/such/path/pal-test")).toBe(false);
	});
});
