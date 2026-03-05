import { randomBytes } from "node:crypto";
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

	it("exists() returns true for existing path", async () => {
		const pal = new NodePAL();
		expect(await pal.exists(tmpdir())).toBe(true);
	});

	it("existsSync() returns true/false", () => {
		const pal = new NodePAL();
		expect(pal.existsSync(tmpdir())).toBe(true);
		expect(pal.existsSync("/no/such/pal-path")).toBe(false);
	});

	it("readFileSync() reads a file synchronously", () => {
		const pal = new NodePAL();
		const file = join(
			tmpdir(),
			`pal-sync-${randomBytes(4).toString("hex")}.txt`,
		);
		pal.writeFileSync(file, "sync content");
		expect(pal.readFileSync(file)).toBe("sync content");
	});

	it("deleteFile() with force:false throws on missing file", async () => {
		const pal = new NodePAL();
		await expect(
			pal.deleteFile("/no/such/pal-file.txt", { force: false }),
		).rejects.toThrow();
	});

	it("deleteFile() with force:true swallows error on missing file", async () => {
		const pal = new NodePAL();
		await expect(
			pal.deleteFile("/no/such/pal-file.txt", { force: true }),
		).resolves.toBeUndefined();
	});

	it("deleteFile() with no options throws on missing file", async () => {
		const pal = new NodePAL();
		await expect(pal.deleteFile("/no/such/pal-file.txt")).rejects.toThrow();
	});

	it("copyFile() copies a file", async () => {
		const pal = new NodePAL();
		const id = randomBytes(4).toString("hex");
		const src = join(tmpdir(), `pal-src-${id}.txt`);
		const dest = join(tmpdir(), `pal-dest-${id}.txt`);
		await pal.writeFile(src, "copy me");
		await pal.copyFile(src, dest);
		expect(pal.readFileSync(dest)).toBe("copy me");
		await pal.deleteFile(src, { force: true });
		await pal.deleteFile(dest, { force: true });
	});

	it("copyFile() with overwrite:false throws if dest exists", async () => {
		const pal = new NodePAL();
		const id = randomBytes(4).toString("hex");
		const src = join(tmpdir(), `pal-src2-${id}.txt`);
		const dest = join(tmpdir(), `pal-dest2-${id}.txt`);
		await pal.writeFile(src, "original");
		await pal.writeFile(dest, "existing");
		await expect(
			pal.copyFile(src, dest, { overwrite: false }),
		).rejects.toThrow();
		await pal.deleteFile(src, { force: true });
		await pal.deleteFile(dest, { force: true });
	});

	it("stat() returns file stats", async () => {
		const pal = new NodePAL();
		const file = join(
			tmpdir(),
			`pal-stat-${randomBytes(4).toString("hex")}.txt`,
		);
		await pal.writeFile(file, "stat me");
		const stats = await pal.stat(file);
		expect(stats.isFile).toBe(true);
		expect(stats.isDirectory).toBe(false);
		expect(stats.size).toBeGreaterThan(0);
		await pal.deleteFile(file, { force: true });
	});

	it("listFiles() returns files in a directory", async () => {
		const pal = new NodePAL();
		const dir = join(tmpdir(), `pal-dir-${randomBytes(4).toString("hex")}`);
		await pal.createDir(dir);
		await pal.writeFile(join(dir, "a.txt"), "a");
		await pal.writeFile(join(dir, "b.md"), "b");
		const files = await pal.listFiles(dir);
		expect(files.length).toBe(2);
		await pal.removeDir(dir, { recursive: true, force: true });
	});

	it("listFiles() with pattern filter", async () => {
		const pal = new NodePAL();
		const dir = join(tmpdir(), `pal-dir2-${randomBytes(4).toString("hex")}`);
		await pal.createDir(dir);
		await pal.writeFile(join(dir, "a.txt"), "a");
		await pal.writeFile(join(dir, "b.md"), "b");
		const files = await pal.listFiles(dir, { pattern: "*.txt" });
		expect(files.every((f) => f.endsWith(".txt"))).toBe(true);
		await pal.removeDir(dir, { recursive: true, force: true });
	});

	it("listFiles() with exclude filter", async () => {
		const pal = new NodePAL();
		const dir = join(tmpdir(), `pal-dir3-${randomBytes(4).toString("hex")}`);
		await pal.createDir(dir);
		await pal.writeFile(join(dir, "a.txt"), "a");
		await pal.writeFile(join(dir, "b.md"), "b");
		const files = await pal.listFiles(dir, { exclude: "*.md" });
		expect(files.every((f) => !f.endsWith(".md"))).toBe(true);
		await pal.removeDir(dir, { recursive: true, force: true });
	});

	it("listFiles() recursive", async () => {
		const pal = new NodePAL();
		const dir = join(tmpdir(), `pal-dir4-${randomBytes(4).toString("hex")}`);
		await pal.createDir(join(dir, "sub"));
		await pal.writeFile(join(dir, "a.txt"), "a");
		await pal.writeFile(join(dir, "sub", "b.txt"), "b");
		const files = await pal.listFiles(dir, { recursive: true });
		expect(files.length).toBe(2);
		await pal.removeDir(dir, { recursive: true, force: true });
	});

	it("path utilities work correctly", () => {
		const pal = new NodePAL();
		expect(pal.dirname("/a/b/c.txt")).toBe("/a/b");
		expect(pal.basename("/a/b/c.txt")).toBe("c.txt");
		expect(pal.basename("/a/b/c.txt", ".txt")).toBe("c");
		expect(pal.extname("/a/b/c.txt")).toBe(".txt");
		expect(pal.isAbsolute("/abs/path")).toBe(true);
		expect(pal.isAbsolute("relative")).toBe(false);
		expect(pal.relativePath("/a/b", "/a/b/c")).toBe("c");
		expect(pal.resolvePath("/a", "b")).toBe("/a/b");
	});

	it("environment methods work", () => {
		const pal = new NodePAL();
		expect(typeof pal.getCwd()).toBe("string");
		expect(typeof pal.getHomeDir()).toBe("string");
		expect(pal.getEnv("HOME")).toBeDefined();
		expect(pal.getEnv("__NO_SUCH_VAR__")).toBeUndefined();
	});

	it("getPlatform() returns a known platform", () => {
		const pal = new NodePAL();
		const platform = pal.getPlatform();
		expect(["linux", "darwin", "win32"]).toContain(platform);
	});
});
