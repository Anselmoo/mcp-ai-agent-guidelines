import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../index.js";
import { MemorySessionStore } from "../../runtime/memory-session-store.js";
import { SecureFileSessionStore } from "../../runtime/secure-session-store.js";
import {
	EPHEMERAL_ENV_VAR,
	isEphemeralMode,
} from "../../runtime/session-store-utils.js";

afterEach(() => {
	delete process.env[EPHEMERAL_ENV_VAR];
});

describe("isEphemeralMode", () => {
	it("is false by default", () => {
		expect(isEphemeralMode()).toBe(false);
	});

	it("is true when the env flag is 'true' or '1'", () => {
		process.env[EPHEMERAL_ENV_VAR] = "true";
		expect(isEphemeralMode()).toBe(true);
		process.env[EPHEMERAL_ENV_VAR] = "1";
		expect(isEphemeralMode()).toBe(true);
	});

	it("is false for other values", () => {
		process.env[EPHEMERAL_ENV_VAR] = "no";
		expect(isEphemeralMode()).toBe(false);
	});
});

describe("createRuntime store selection", () => {
	it("uses the in-memory store in ephemeral mode", () => {
		process.env[EPHEMERAL_ENV_VAR] = "true";
		expect(createRuntime().sessionStore).toBeInstanceOf(MemorySessionStore);
	});

	it("uses the file-backed store by default", () => {
		expect(createRuntime().sessionStore).toBeInstanceOf(SecureFileSessionStore);
	});
});
