import { describe, expect, it } from "vitest";
import {
	buildMac,
	compareBytes,
	compressText,
	compressTextAsync,
	containsBytes,
	decodeSession,
	decompressText,
	decompressTextAsync,
	encodeSession,
	hashBytes,
	hashContent,
	hexDecode,
	SessionCodec,
	uneval,
	verifyIntegrity,
} from "../../runtime/session-codec.js";
import { SessionDataError } from "../../validation/error-handling.js";

describe("hashContent", () => {
	it("returns 64-char hex for sha256", () => {
		const h = hashContent("hello");
		expect(h).toHaveLength(64);
		expect(h).toMatch(/^[0-9a-f]+$/);
	});

	it("returns 128-char hex for sha512", () => {
		const h = hashContent("hello", "sha512");
		expect(h).toHaveLength(128);
		expect(h).toMatch(/^[0-9a-f]+$/);
	});

	it("returns 64-char hex for blake3", () => {
		const h = hashContent("hello", "blake3");
		expect(h).toHaveLength(64);
		expect(h).toMatch(/^[0-9a-f]+$/);
	});

	it("is deterministic", () => {
		expect(hashContent("hello")).toBe(hashContent("hello"));
	});
});

describe("hashBytes", () => {
	it("returns Uint8Array of 32 bytes for sha256", () => {
		const result = hashBytes(new TextEncoder().encode("hello"));
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});
});

describe("verifyIntegrity", () => {
	it("returns true for matching hash", () => {
		expect(verifyIntegrity("hello", hashContent("hello"))).toBe(true);
	});

	it("returns false for bad hash", () => {
		expect(verifyIntegrity("hello", "badhash")).toBe(false);
	});

	it("works with sha512 algorithm", () => {
		const h = hashContent("world", "sha512");
		expect(verifyIntegrity("world", h, "sha512")).toBe(true);
	});
});

describe("encodeSession / decodeSession", () => {
	it("round-trips a plain object", () => {
		const obj = { a: 1, b: "two" };
		const encoded = encodeSession(obj);
		expect(typeof encoded).toBe("string");
		expect(decodeSession(encoded)).toEqual(obj);
	});

	it("round-trips an object with a Date", () => {
		const d = new Date("2024-01-01T00:00:00Z");
		const obj = { a: 1, b: d };
		const rt = decodeSession<typeof obj>(encodeSession(obj));
		expect(rt.a).toBe(1);
		expect(rt.b instanceof Date).toBe(true);
		expect(rt.b.toISOString()).toBe(d.toISOString());
	});

	it("round-trips a Map", () => {
		const m = new Map([["x", 42]]);
		const rt = decodeSession<Map<string, number>>(encodeSession(m));
		expect(rt instanceof Map).toBe(true);
		expect(rt.get("x")).toBe(42);
	});
});

describe("compressText / decompressText", () => {
	it("round-trips a string", () => {
		const text = "Hello, World! ".repeat(100);
		const compressed = compressText(text);
		expect(compressed).toBeInstanceOf(Uint8Array);
		expect(compressed.length).toBeGreaterThan(0);
		expect(decompressText(compressed)).toBe(text);
	});

	it("compresses long text smaller than original", () => {
		const text = "aaaa".repeat(1000);
		const compressed = compressText(text);
		expect(compressed.length).toBeLessThan(text.length);
	});

	it("wraps corrupt compressed payloads in SessionDataError", () => {
		expect(() => decompressText(new Uint8Array([1, 2, 3, 4]))).toThrow(
			SessionDataError,
		);
		expect(() => decompressText(new Uint8Array([1, 2, 3, 4]))).toThrow(
			/Failed to decompress session payload/,
		);
	});
});

describe("compressTextAsync", () => {
	it("async round-trips a string", async () => {
		const text = "Async compression test string";
		const compressed = await compressTextAsync(text);
		expect(compressed).toBeInstanceOf(Uint8Array);
		expect(decompressText(compressed)).toBe(text);
	});

	it("wraps corrupt async compressed payloads in SessionDataError", async () => {
		await expect(
			decompressTextAsync(new Uint8Array([1, 2, 3, 4])),
		).rejects.toThrow(SessionDataError);
		await expect(
			decompressTextAsync(new Uint8Array([1, 2, 3, 4])),
		).rejects.toThrow(/Failed to decompress session payload/);
	});
});

describe("compareBytes", () => {
	it("returns true for identical arrays", () => {
		const a = new Uint8Array([1, 2, 3]);
		const b = new Uint8Array([1, 2, 3]);
		expect(compareBytes(a, b)).toBe(true);
	});

	it("returns false for different arrays", () => {
		const a = new Uint8Array([1, 2, 3]);
		const b = new Uint8Array([1, 2, 4]);
		expect(compareBytes(a, b)).toBe(false);
	});

	it("returns false for different lengths", () => {
		const a = new Uint8Array([1, 2]);
		const b = new Uint8Array([1, 2, 3]);
		expect(compareBytes(a, b)).toBe(false);
	});

	it("detects nested byte sequences", () => {
		expect(
			containsBytes(new Uint8Array([1, 2, 3, 4]), new Uint8Array([2, 3])),
		).toBe(true);
		expect(
			containsBytes(new Uint8Array([1, 2, 3, 4]), new Uint8Array([5])),
		).toBe(false);
	});
});

describe("binary helpers", () => {
	it("builds deterministic MAC bytes from ordered parts", () => {
		const first = buildMac([
			new TextEncoder().encode("alpha"),
			new TextEncoder().encode("beta"),
		]);
		const second = buildMac([
			new TextEncoder().encode("alpha"),
			new TextEncoder().encode("beta"),
		]);

		expect(first).toBeInstanceOf(Uint8Array);
		expect(first).toEqual(second);
		expect(first).toHaveLength(32);
	});

	it("decodes hex strings back to bytes", () => {
		expect(Array.from(hexDecode("0a0bff"))).toEqual([10, 11, 255]);
	});

	it("throws for unexpected hash algorithms at runtime", () => {
		expect(() =>
			hashContent("hello", "md5" as never),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: Unhandled hash algorithm: md5]`,
		);
	});
});

describe("SessionCodec class", () => {
	it("exposes static hashContent", () => {
		expect(SessionCodec.hashContent("hello")).toHaveLength(64);
	});

	it("exposes static verifyIntegrity", () => {
		const h = SessionCodec.hashContent("test");
		expect(SessionCodec.verifyIntegrity("test", h)).toBe(true);
	});

	it("exposes static encodeSession + decodeSession", () => {
		const val = { x: new Set([1, 2, 3]) };
		const rt = SessionCodec.decodeSession<typeof val>(
			SessionCodec.encodeSession(val),
		);
		expect(rt.x instanceof Set).toBe(true);
		expect([...rt.x]).toEqual([1, 2, 3]);
	});

	it("re-exports uneval consistently for debugging helpers", () => {
		const value = { answer: 42, nested: ["a", "b"] };
		expect(SessionCodec.uneval(value)).toBe(uneval(value));
	});

	it("wraps corrupt encoded payloads in SessionDataError", () => {
		expect(() => decodeSession("{not valid")).toThrow(SessionDataError);
		expect(() => decodeSession("{not valid")).toThrow(
			/Failed to decode session payload/,
		);
	});
});
