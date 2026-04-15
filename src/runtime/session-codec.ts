import { blake3 } from "@noble/hashes/blake3.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import { bytesToHex, concatBytes, hexToBytes } from "@noble/hashes/utils.js";
import {
	parse as devalueParse,
	stringify as devalueStringify,
	uneval,
} from "devalue";
import { gunzip, gunzipSync, gzip, gzipSync, strFromU8, strToU8 } from "fflate";
import {
	compareUint8Arrays,
	includes as includesUint8Array,
} from "uint8array-extras";
import {
	createErrorContext,
	SessionDataError,
} from "../validation/error-handling.js";

export { uneval };

type HashAlgorithm = "sha256" | "sha512" | "blake3";

function assertNever(value: never): never {
	throw new Error(`Unhandled hash algorithm: ${String(value)}`);
}

function getHashFn(algorithm: HashAlgorithm): (data: Uint8Array) => Uint8Array {
	switch (algorithm) {
		case "sha256":
			return sha256;
		case "sha512":
			return sha512;
		case "blake3":
			return blake3;
	}

	return assertNever(algorithm);
}

export function hashBytes(
	data: Uint8Array,
	algorithm: HashAlgorithm = "sha256",
): Uint8Array {
	return getHashFn(algorithm)(data);
}

export function hashContent(
	data: string,
	algorithm: HashAlgorithm = "sha256",
): string {
	const bytes = new TextEncoder().encode(data);
	return bytesToHex(getHashFn(algorithm)(bytes));
}

export function verifyIntegrity(
	data: string,
	expectedHash: string,
	algorithm: HashAlgorithm = "sha256",
): boolean {
	const actual = hashContent(data, algorithm);
	return actual === expectedHash;
}

export function encodeSession<T>(value: T): string {
	return devalueStringify(value);
}

export function decodeSession<T>(encoded: string): T {
	try {
		return devalueParse(encoded) as T;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new SessionDataError(
			`Failed to decode session payload: ${message}`,
			createErrorContext("session-codec"),
		);
	}
}

export function compressText(text: string): Uint8Array {
	return gzipSync(strToU8(text));
}

export function decompressText(data: Uint8Array): string {
	try {
		return strFromU8(gunzipSync(data));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new SessionDataError(
			`Failed to decompress session payload: ${message}`,
			createErrorContext("session-codec"),
		);
	}
}

export function compressTextAsync(text: string): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		gzip(strToU8(text), (err, result) => {
			if (err) reject(err);
			else resolve(result);
		});
	});
}

export function decompressTextAsync(data: Uint8Array): Promise<string> {
	return new Promise((resolve, reject) => {
		gunzip(data, (err, result) => {
			if (err) {
				reject(
					new SessionDataError(
						`Failed to decompress session payload: ${err.message}`,
						createErrorContext("session-codec"),
					),
				);
			} else resolve(strFromU8(result));
		});
	});
}

export function compareBytes(a: Uint8Array, b: Uint8Array): boolean {
	return compareUint8Arrays(a, b) === 0;
}

export function containsBytes(
	haystack: Uint8Array,
	needle: Uint8Array,
): boolean {
	return includesUint8Array(haystack, needle);
}

export function buildMac(parts: Uint8Array[]): Uint8Array {
	return sha256(concatBytes(...parts));
}

export function hexDecode(hex: string): Uint8Array {
	return hexToBytes(hex);
}

// biome-ignore lint/complexity/noStaticOnlyClass: in development
export class SessionCodec {
	static hashContent = hashContent;
	static hashBytes = hashBytes;
	static verifyIntegrity = verifyIntegrity;
	static encodeSession = encodeSession;
	static decodeSession = decodeSession;
	static uneval = uneval;
	static compressText = compressText;
	static decompressText = decompressText;
	static compressTextAsync = compressTextAsync;
	static decompressTextAsync = decompressTextAsync;
	static compareBytes = compareBytes;
	static containsBytes = containsBytes;
	static buildMac = buildMac;
	static hexDecode = hexDecode;
}
