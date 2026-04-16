import { mkdtempSync } from "node:fs";
import { access, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
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

afterEach(() => {
	restoreEnvVar(SESSION_MAC_KEY_ENV_VAR, ORIGINAL_MAC_KEY);
	restoreEnvVar(
		SESSION_CONTEXT_ENCRYPTION_KEY_ENV_VAR,
		ORIGINAL_ENCRYPTION_KEY,
	);
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
});
