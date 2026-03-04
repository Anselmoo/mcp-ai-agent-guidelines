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
});
