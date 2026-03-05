import { describe, expect, it } from "vitest";
import { MockPAL } from "../../../src/platform/mock-pal.js";

describe("MockPAL", () => {
	it("reads a file that was previously written", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/tmp/test.txt", "hello");
		const content = await pal.readFile("/tmp/test.txt");
		expect(content).toBe("hello");
	});

	it("exists() returns false for missing files", async () => {
		const pal = new MockPAL();
		expect(await pal.exists("/nonexistent/file.txt")).toBe(false);
	});

	it("exists() returns true after writeFile", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/tmp/foo.txt", "data");
		expect(await pal.exists("/tmp/foo.txt")).toBe(true);
	});

	it("readFileSync works after writeFileSync", () => {
		const pal = new MockPAL();
		pal.writeFileSync("/tmp/sync.txt", "sync content");
		expect(pal.readFileSync("/tmp/sync.txt")).toBe("sync content");
	});

	it("joinPath() returns expected path", () => {
		const pal = new MockPAL();
		expect(pal.joinPath("/a", "b", "c")).toContain("a");
	});

	// -------------------------------------------------------------------------
	// readFile / readFileSync — error paths (lines 99, 106)
	// -------------------------------------------------------------------------

	it("readFile throws ENOENT for missing file", async () => {
		const pal = new MockPAL();
		await expect(pal.readFile("/missing.txt")).rejects.toThrow("ENOENT");
	});

	it("readFileSync throws ENOENT for missing file", () => {
		const pal = new MockPAL();
		expect(() => pal.readFileSync("/missing.txt")).toThrow("ENOENT");
	});

	it("readFile throws when error is set via setError", async () => {
		const pal = new MockPAL();
		pal.setErrorOnPath("/bad.txt", new Error("disk full"));
		await expect(pal.readFile("/bad.txt")).rejects.toThrow("disk full");
	});

	it("writeFile throws when error is set via setError", async () => {
		const pal = new MockPAL();
		pal.setErrorOnPath("/bad.txt", new Error("read-only"));
		await expect(pal.writeFile("/bad.txt", "x")).rejects.toThrow("read-only");
	});

	it("writeFileSync throws when error is set via setError", () => {
		const pal = new MockPAL();
		pal.setErrorOnPath("/bad.txt", new Error("read-only"));
		expect(() => pal.writeFileSync("/bad.txt", "x")).toThrow("read-only");
	});

	// -------------------------------------------------------------------------
	// existsSync (line 129)
	// -------------------------------------------------------------------------

	it("existsSync returns false for missing file", () => {
		const pal = new MockPAL();
		expect(pal.existsSync("/no-such-file.txt")).toBe(false);
	});

	it("existsSync returns true after writeFileSync", () => {
		const pal = new MockPAL();
		pal.writeFileSync("/check.txt", "data");
		expect(pal.existsSync("/check.txt")).toBe(true);
	});

	it("existsSync returns true for a created directory", async () => {
		const pal = new MockPAL();
		await pal.createDir("/mydir");
		expect(pal.existsSync("/mydir")).toBe(true);
	});

	// -------------------------------------------------------------------------
	// deleteFile (line 134) — with/without force
	// -------------------------------------------------------------------------

	it("deleteFile removes an existing file", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/del.txt", "bye");
		await pal.deleteFile("/del.txt");
		expect(await pal.exists("/del.txt")).toBe(false);
	});

	it("deleteFile throws ENOENT for missing file without force", async () => {
		const pal = new MockPAL();
		await expect(pal.deleteFile("/nope.txt")).rejects.toThrow("ENOENT");
	});

	it("deleteFile succeeds for missing file when force=true", async () => {
		const pal = new MockPAL();
		await expect(
			pal.deleteFile("/nope.txt", { force: true }),
		).resolves.toBeUndefined();
	});

	// -------------------------------------------------------------------------
	// copyFile (lines 140-150)
	// -------------------------------------------------------------------------

	it("copyFile copies content to destination", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/src.txt", "copy me");
		await pal.copyFile("/src.txt", "/dst.txt");
		expect(await pal.readFile("/dst.txt")).toBe("copy me");
	});

	it("copyFile throws ENOENT when source does not exist", async () => {
		const pal = new MockPAL();
		await expect(pal.copyFile("/ghost.txt", "/dst.txt")).rejects.toThrow(
			"ENOENT",
		);
	});

	it("copyFile throws EEXIST when dest exists and overwrite=false", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/src.txt", "data");
		await pal.writeFile("/dst.txt", "existing");
		await expect(
			pal.copyFile("/src.txt", "/dst.txt", { overwrite: false }),
		).rejects.toThrow("EEXIST");
	});

	it("copyFile overwrites destination by default", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/src.txt", "new");
		await pal.writeFile("/dst.txt", "old");
		await pal.copyFile("/src.txt", "/dst.txt");
		expect(await pal.readFile("/dst.txt")).toBe("new");
	});

	// -------------------------------------------------------------------------
	// stat (lines 159-183)
	// -------------------------------------------------------------------------

	it("stat returns isFile=true for a written file", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/a.txt", "hello");
		const s = await pal.stat("/a.txt");
		expect(s.isFile).toBe(true);
		expect(s.isDirectory).toBe(false);
	});

	it("stat returns isDirectory=true for a created dir", async () => {
		const pal = new MockPAL();
		await pal.createDir("/mydir2");
		const s = await pal.stat("/mydir2");
		expect(s.isDirectory).toBe(true);
		expect(s.isFile).toBe(false);
	});

	it("stat throws ENOENT for non-existent path", async () => {
		const pal = new MockPAL();
		await expect(pal.stat("/ghost")).rejects.toThrow("ENOENT");
	});

	it("stat throws when error is set", async () => {
		const pal = new MockPAL();
		pal.setErrorOnPath("/err.txt", new Error("stat error"));
		await expect(pal.stat("/err.txt")).rejects.toThrow("stat error");
	});

	// -------------------------------------------------------------------------
	// listFiles (lines 188-205) — recursive + pattern
	// -------------------------------------------------------------------------

	it("listFiles returns only direct children by default", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/dir/a.txt", "a");
		await pal.writeFile("/dir/sub/b.txt", "b");
		const files = await pal.listFiles("/dir");
		expect(files).toContain("/dir/a.txt");
		expect(files).not.toContain("/dir/sub/b.txt");
	});

	it("listFiles returns nested files when recursive=true", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/dir/a.txt", "a");
		await pal.writeFile("/dir/sub/b.txt", "b");
		const files = await pal.listFiles("/dir", { recursive: true });
		expect(files).toContain("/dir/sub/b.txt");
	});

	it("listFiles filters by pattern", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/dir/a.ts", "ts");
		await pal.writeFile("/dir/b.js", "js");
		const files = await pal.listFiles("/dir", { pattern: "*.ts" });
		expect(files.every((f) => f.endsWith(".ts"))).toBe(true);
		expect(files).not.toContain("/dir/b.js");
	});

	// -------------------------------------------------------------------------
	// removeDir (lines 219-231)
	// -------------------------------------------------------------------------

	it("removeDir throws ENOENT for missing dir without force", async () => {
		const pal = new MockPAL();
		await expect(pal.removeDir("/nope")).rejects.toThrow("ENOENT");
	});

	it("removeDir succeeds with force on missing dir", async () => {
		const pal = new MockPAL();
		await expect(
			pal.removeDir("/nope", { force: true }),
		).resolves.toBeUndefined();
	});

	it("removeDir removes directory", async () => {
		const pal = new MockPAL();
		await pal.createDir("/toremove");
		await pal.removeDir("/toremove");
		expect(await pal.exists("/toremove")).toBe(false);
	});

	it("removeDir with recursive=true removes nested files", async () => {
		const pal = new MockPAL();
		await pal.createDir("/rdir");
		await pal.writeFile("/rdir/file.txt", "data");
		await pal.createDir("/rdir/sub");
		await pal.removeDir("/rdir", { recursive: true });
		expect(await pal.exists("/rdir/file.txt")).toBe(false);
		expect(await pal.exists("/rdir/sub")).toBe(false);
	});

	// -------------------------------------------------------------------------
	// path helpers
	// -------------------------------------------------------------------------

	it("resolvePath() returns absolute path", () => {
		const pal = new MockPAL();
		expect(pal.resolvePath("/a", "b")).toContain("b");
	});

	it("dirname() returns parent directory", () => {
		const pal = new MockPAL();
		expect(pal.dirname("/a/b/c.txt")).toBe("/a/b");
	});

	it("basename() returns file name", () => {
		const pal = new MockPAL();
		expect(pal.basename("/a/b/c.txt")).toBe("c.txt");
		expect(pal.basename("/a/b/c.txt", ".txt")).toBe("c");
	});

	// -------------------------------------------------------------------------
	// getAllFiles helper
	// -------------------------------------------------------------------------

	it("getAllFiles returns all written files", async () => {
		const pal = new MockPAL();
		await pal.writeFile("/x.txt", "x");
		await pal.writeFile("/y.txt", "y");
		const all = pal.getAllFiles();
		expect(all.has("/x.txt")).toBe(true);
		expect(all.has("/y.txt")).toBe(true);
	});
});
