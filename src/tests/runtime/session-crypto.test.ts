import { mkdtempSync } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	decryptSessionPayload,
	encryptSessionPayload,
	resolveOrCreatePersistentSecret,
	SESSION_CONTEXT_ENCRYPTION_KEY_ENV_VAR,
	SESSION_CONTEXT_ENCRYPTION_KEY_FILE,
	SESSION_MAC_KEY_ENV_VAR,
	SESSION_MAC_KEY_FILE,
	signSessionData,
} from "../../runtime/session-crypto.js";
import {
	SessionDataError,
	ValidationError,
} from "../../validation/error-handling.js";

const ORIGINAL_MAC_KEY = process.env[SESSION_MAC_KEY_ENV_VAR];
const ORIGINAL_ENCRYPTION_KEY =
	process.env[SESSION_CONTEXT_ENCRYPTION_KEY_ENV_VAR];

function restoreEnvVar(name: string, value: string | undefined): void {
	if (value === undefined) {
		delete process.env[name];
		return;
	}

	process.env[name] = value;
}

function createEncryptedEnvelope(envelope: unknown): string {
	return `mcp-toon-encrypted:v1:${Buffer.from(
		JSON.stringify(envelope),
		"utf8",
	).toString("base64")}`;
}

async function importSessionCryptoWithFsMocks(options?: {
	readFileImpl?: (...args: unknown[]) => unknown;
	writeFileImpl?: (...args: unknown[]) => unknown;
	mkdirImpl?: (...args: unknown[]) => unknown;
	ensureSessionStateGitignoreImpl?: (rootDir: string) => Promise<void>;
}) {
	vi.resetModules();
	vi.doMock("node:fs/promises", async () => {
		const actual =
			await vi.importActual<typeof import("node:fs/promises")>(
				"node:fs/promises",
			);
		return {
			...actual,
			readFile: options?.readFileImpl ?? actual.readFile,
			writeFile: options?.writeFileImpl ?? actual.writeFile,
			mkdir: options?.mkdirImpl ?? actual.mkdir,
		};
	});
	vi.doMock("../../runtime/session-store-utils.js", () => ({
		ensureSessionStateGitignore:
			options?.ensureSessionStateGitignoreImpl ??
			vi.fn().mockResolvedValue(undefined),
	}));
	return await import("../../runtime/session-crypto.js");
}

afterEach(() => {
	restoreEnvVar(SESSION_MAC_KEY_ENV_VAR, ORIGINAL_MAC_KEY);
	restoreEnvVar(
		SESSION_CONTEXT_ENCRYPTION_KEY_ENV_VAR,
		ORIGINAL_ENCRYPTION_KEY,
	);
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.resetModules();
	vi.doUnmock("node:fs/promises");
	vi.doUnmock("../../runtime/session-store-utils.js");
});

describe("runtime/session-crypto", () => {
	it("persists generated secrets across repeated resolutions", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-crypto-"));
		delete process.env[SESSION_MAC_KEY_ENV_VAR];

		try {
			const first = await resolveOrCreatePersistentSecret({
				rootDir,
				keyFilePath: SESSION_MAC_KEY_FILE,
				envVar: SESSION_MAC_KEY_ENV_VAR,
				fieldName: "sessionIntegrityKey",
			});
			const second = await resolveOrCreatePersistentSecret({
				rootDir,
				keyFilePath: SESSION_MAC_KEY_FILE,
				envVar: SESSION_MAC_KEY_ENV_VAR,
				fieldName: "sessionIntegrityKey",
			});

			expect(second).toBe(first);
			await expect(
				readFile(join(rootDir, SESSION_MAC_KEY_FILE), "utf8"),
			).resolves.toContain(first);
			await expect(
				readFile(join(rootDir, ".gitignore"), "utf8"),
			).resolves.toContain("config/*.key");
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("prefers explicit secrets over environment variables and keyfiles", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-crypto-"));
		delete process.env[SESSION_CONTEXT_ENCRYPTION_KEY_ENV_VAR];
		process.env[SESSION_MAC_KEY_ENV_VAR] = "env-secret";

		try {
			const resolved = await resolveOrCreatePersistentSecret({
				rootDir,
				keyFilePath: SESSION_MAC_KEY_FILE,
				envVar: SESSION_MAC_KEY_ENV_VAR,
				explicitSecret: "explicit-secret",
				fieldName: "sessionIntegrityKey",
			});

			expect(resolved).toBe("explicit-secret");
			await expect(
				access(join(rootDir, SESSION_MAC_KEY_FILE)),
			).rejects.toMatchObject({ code: "ENOENT" });
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("prefers environment secrets over generated keyfiles", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-crypto-"));
		delete process.env[SESSION_MAC_KEY_ENV_VAR];
		process.env[SESSION_CONTEXT_ENCRYPTION_KEY_ENV_VAR] = "env-encryption-key";

		try {
			const resolved = await resolveOrCreatePersistentSecret({
				rootDir,
				keyFilePath: SESSION_CONTEXT_ENCRYPTION_KEY_FILE,
				envVar: SESSION_CONTEXT_ENCRYPTION_KEY_ENV_VAR,
				fieldName: "sessionContextEncryptionKey",
			});

			expect(resolved).toBe("env-encryption-key");
			await expect(
				access(join(rootDir, SESSION_CONTEXT_ENCRYPTION_KEY_FILE)),
			).rejects.toMatchObject({ code: "ENOENT" });
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("binds encrypted payloads to associated data", () => {
		const encrypted = encryptSessionPayload(
			"secret session payload",
			"cipher-secret",
			"session-1",
		);

		expect(decryptSessionPayload(encrypted, "cipher-secret", "session-1")).toBe(
			"secret session payload",
		);
		expect(() =>
			decryptSessionPayload(encrypted, "cipher-secret", "session-2"),
		).toThrow(/Failed to decrypt session payload/);
	});

	it("produces deterministic signatures for the same input and different signatures when input changes", () => {
		const first = signSessionData("payload", "mac-secret");
		const second = signSessionData("payload", "mac-secret");
		const differentPayload = signSessionData("payload-2", "mac-secret");
		const differentSecret = signSessionData("payload", "other-secret");

		expect(second).toBe(first);
		expect(differentPayload).not.toBe(first);
		expect(differentSecret).not.toBe(first);
	});

	it("rejects key file paths that traverse outside the root directory", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-crypto-"));

		try {
			await expect(
				resolveOrCreatePersistentSecret({
					rootDir,
					keyFilePath: "../escape.key",
					envVar: SESSION_MAC_KEY_ENV_VAR,
					fieldName: "sessionIntegrityKey",
				}),
			).rejects.toThrow(ValidationError);
			await expect(
				resolveOrCreatePersistentSecret({
					rootDir,
					keyFilePath: "../escape.key",
					envVar: SESSION_MAC_KEY_ENV_VAR,
					fieldName: "sessionIntegrityKey",
				}),
			).rejects.toThrow(
				/path traversal outside the session state directory is not allowed/i,
			);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("rejects empty explicit secrets", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-crypto-"));

		try {
			await expect(
				resolveOrCreatePersistentSecret({
					rootDir,
					keyFilePath: SESSION_MAC_KEY_FILE,
					envVar: SESSION_MAC_KEY_ENV_VAR,
					explicitSecret: "   ",
					fieldName: "sessionIntegrityKey",
				}),
			).rejects.toThrow(ValidationError);
			await expect(
				resolveOrCreatePersistentSecret({
					rootDir,
					keyFilePath: SESSION_MAC_KEY_FILE,
					envVar: SESSION_MAC_KEY_ENV_VAR,
					explicitSecret: "   ",
					fieldName: "sessionIntegrityKey",
				}),
			).rejects.toThrow(/Secret material cannot be empty/);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("rejects empty environment secrets", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-crypto-"));
		process.env[SESSION_MAC_KEY_ENV_VAR] = "   ";

		try {
			await expect(
				resolveOrCreatePersistentSecret({
					rootDir,
					keyFilePath: SESSION_MAC_KEY_FILE,
					envVar: SESSION_MAC_KEY_ENV_VAR,
					fieldName: "sessionIntegrityKey",
				}),
			).rejects.toThrow(ValidationError);
			await expect(
				resolveOrCreatePersistentSecret({
					rootDir,
					keyFilePath: SESSION_MAC_KEY_FILE,
					envVar: SESSION_MAC_KEY_ENV_VAR,
					fieldName: "sessionIntegrityKey",
				}),
			).rejects.toThrow(/Secret material cannot be empty/);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("rejects empty secret files", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-crypto-"));

		try {
			await mkdir(join(rootDir, "config"), { recursive: true });
			await writeFile(join(rootDir, SESSION_MAC_KEY_FILE), "  \n", "utf8");

			await expect(
				resolveOrCreatePersistentSecret({
					rootDir,
					keyFilePath: SESSION_MAC_KEY_FILE,
					envVar: SESSION_MAC_KEY_ENV_VAR,
					fieldName: "sessionIntegrityKey",
				}),
			).rejects.toThrow(ValidationError);
			await expect(
				resolveOrCreatePersistentSecret({
					rootDir,
					keyFilePath: SESSION_MAC_KEY_FILE,
					envVar: SESSION_MAC_KEY_ENV_VAR,
					fieldName: "sessionIntegrityKey",
				}),
			).rejects.toThrow(/Persistent session secret file cannot be empty/);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("returns plaintext payloads unchanged when they are not encrypted", () => {
		expect(
			decryptSessionPayload("plain session payload", "unused-secret"),
		).toBe("plain session payload");
	});

	it("decrypts encrypted payloads without associated data", () => {
		const hexSecret = "ab".repeat(32);
		const encrypted = encryptSessionPayload(
			"secret session payload",
			hexSecret,
		);

		expect(decryptSessionPayload(encrypted, hexSecret)).toBe(
			"secret session payload",
		);
	});

	it("wraps malformed encrypted payload envelopes in SessionDataError", () => {
		const malformedPayload = `mcp-toon-encrypted:v1:${Buffer.from(
			"{",
			"utf8",
		).toString("base64")}`;

		expect(() =>
			decryptSessionPayload(malformedPayload, "cipher-secret"),
		).toThrow(SessionDataError);
		expect(() =>
			decryptSessionPayload(malformedPayload, "cipher-secret"),
		).toThrow(/Failed to parse encrypted session payload/);
	});

	it.each([
		{
			name: "unexpected version",
			envelope: {
				version: 2,
				algorithm: "aes-256-gcm",
				iv: "aXY=",
				authTag: "dGFn",
				ciphertext: "Y2lwaGVydGV4dA==",
			},
		},
		{
			name: "unexpected algorithm",
			envelope: {
				version: 1,
				algorithm: "aes-128-gcm",
				iv: "aXY=",
				authTag: "dGFn",
				ciphertext: "Y2lwaGVydGV4dA==",
			},
		},
		{
			name: "unexpected property types",
			envelope: {
				version: 1,
				algorithm: "aes-256-gcm",
				iv: 123,
				authTag: "dGFn",
				ciphertext: "Y2lwaGVydGV4dA==",
			},
		},
	])("rejects invalid encrypted payload envelopes: $name", ({ envelope }) => {
		expect(() =>
			decryptSessionPayload(createEncryptedEnvelope(envelope), "cipher-secret"),
		).toThrow(SessionDataError);
		expect(() =>
			decryptSessionPayload(createEncryptedEnvelope(envelope), "cipher-secret"),
		).toThrow(/Encrypted session payload envelope is invalid/);
	});
});

describe("runtime/session-crypto with mocked fs branches", () => {
	it("rethrows non-ENOENT read failures while resolving persistent secrets", async () => {
		const readFailure = Object.assign(new Error("permission denied"), {
			code: "EACCES",
		});
		const readFileMock = vi.fn().mockRejectedValue(readFailure);
		const sessionCrypto = await importSessionCryptoWithFsMocks({
			readFileImpl: readFileMock,
		});

		await expect(
			sessionCrypto.resolveOrCreatePersistentSecret({
				rootDir: "/workspace",
				keyFilePath: sessionCrypto.SESSION_MAC_KEY_FILE,
				envVar: sessionCrypto.SESSION_MAC_KEY_ENV_VAR,
				fieldName: "sessionIntegrityKey",
			}),
		).rejects.toBe(readFailure);
		expect(readFileMock).toHaveBeenCalledOnce();
	});

	it("retries writes after an ENOENT failure by recreating the directory", async () => {
		const readFileMock = vi
			.fn()
			.mockRejectedValue(
				Object.assign(new Error("missing"), { code: "ENOENT" }),
			);
		const mkdirMock = vi.fn().mockResolvedValue(undefined);
		const writeFileMock = vi
			.fn()
			.mockRejectedValueOnce(
				Object.assign(new Error("missing parent"), { code: "ENOENT" }),
			)
			.mockResolvedValueOnce(undefined);
		const sessionCrypto = await importSessionCryptoWithFsMocks({
			readFileImpl: readFileMock,
			mkdirImpl: mkdirMock,
			writeFileImpl: writeFileMock,
		});

		const secret = await sessionCrypto.resolveOrCreatePersistentSecret({
			rootDir: "/workspace",
			keyFilePath: sessionCrypto.SESSION_MAC_KEY_FILE,
			envVar: sessionCrypto.SESSION_MAC_KEY_ENV_VAR,
			fieldName: "sessionIntegrityKey",
		});

		expect(secret).toMatch(/^[0-9a-f]{64}$/);
		expect(mkdirMock).toHaveBeenCalledTimes(2);
		expect(writeFileMock).toHaveBeenCalledTimes(2);
	});

	it("returns the concurrently persisted secret after an EEXIST write race", async () => {
		vi.useFakeTimers();
		const mkdirMock = vi.fn().mockResolvedValue(undefined);
		const readFileMock = vi
			.fn()
			.mockRejectedValueOnce(
				Object.assign(new Error("missing"), { code: "ENOENT" }),
			)
			.mockRejectedValueOnce(
				Object.assign(new Error("still missing"), { code: "ENOENT" }),
			)
			.mockResolvedValueOnce("persisted-secret\n");
		const writeFileMock = vi
			.fn()
			.mockRejectedValueOnce(
				Object.assign(new Error("already exists"), { code: "EEXIST" }),
			);
		const sessionCrypto = await importSessionCryptoWithFsMocks({
			mkdirImpl: mkdirMock,
			readFileImpl: readFileMock,
			writeFileImpl: writeFileMock,
		});

		const secretPromise = sessionCrypto.resolveOrCreatePersistentSecret({
			rootDir: "/workspace",
			keyFilePath: sessionCrypto.SESSION_MAC_KEY_FILE,
			envVar: sessionCrypto.SESSION_MAC_KEY_ENV_VAR,
			fieldName: "sessionIntegrityKey",
		});
		await vi.runAllTimersAsync();

		await expect(secretPromise).resolves.toBe("persisted-secret");
		expect(writeFileMock).toHaveBeenCalledOnce();
		expect(readFileMock).toHaveBeenCalledTimes(3);
	});

	it("falls back to the generated secret when an EEXIST race never becomes readable", async () => {
		vi.useFakeTimers();
		const mkdirMock = vi.fn().mockResolvedValue(undefined);
		const readFileMock = vi
			.fn()
			.mockRejectedValue(
				Object.assign(new Error("still missing"), { code: "ENOENT" }),
			);
		const writeFileMock = vi
			.fn()
			.mockRejectedValueOnce(
				Object.assign(new Error("already exists"), { code: "EEXIST" }),
			);
		const sessionCrypto = await importSessionCryptoWithFsMocks({
			mkdirImpl: mkdirMock,
			readFileImpl: readFileMock,
			writeFileImpl: writeFileMock,
		});

		const secretPromise = sessionCrypto.resolveOrCreatePersistentSecret({
			rootDir: "/workspace",
			keyFilePath: sessionCrypto.SESSION_MAC_KEY_FILE,
			envVar: sessionCrypto.SESSION_MAC_KEY_ENV_VAR,
			fieldName: "sessionIntegrityKey",
		});
		await vi.runAllTimersAsync();

		await expect(secretPromise).resolves.toMatch(/^[0-9a-f]{64}$/);
		expect(writeFileMock).toHaveBeenCalledOnce();
		expect(readFileMock).toHaveBeenCalledTimes(4);
	});
});
