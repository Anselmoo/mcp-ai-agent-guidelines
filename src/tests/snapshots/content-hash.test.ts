import { describe, expect, it } from "vitest";
import { computeContentHash } from "../../snapshots/content_hash.js";

describe("computeContentHash", () => {
	it("returns a 32-char hex MD5 string", () => {
		const hash = computeContentHash("hello");
		expect(hash).toMatch(/^[0-9a-f]{32}$/);
	});

	it("is deterministic for the same input", () => {
		const a = computeContentHash("same content");
		const b = computeContentHash("same content");
		expect(a).toBe(b);
	});

	it("differs for different inputs", () => {
		expect(computeContentHash("a")).not.toBe(computeContentHash("b"));
	});

	it("empty string produces a stable hash", () => {
		// MD5 of empty string is always d41d8cd98f00b204e9800998ecf8427e
		expect(computeContentHash("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
	});

	it("default encoding is utf8", () => {
		const withDefault = computeContentHash("hello");
		const withExplicit = computeContentHash("hello", "utf8");
		expect(withDefault).toBe(withExplicit);
	});

	it("supports latin1 encoding", () => {
		const hash = computeContentHash("hello", "latin1");
		expect(hash).toMatch(/^[0-9a-f]{32}$/);
	});
});
