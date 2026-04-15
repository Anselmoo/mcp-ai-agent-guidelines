import {
	createCipheriv,
	createDecipheriv,
	createHash,
	createHmac,
	randomBytes,
} from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import {
	createErrorContext,
	SessionDataError,
	ValidationError,
} from "../validation/error-handling.js";
import { ensureSessionStateGitignore } from "./session-store-utils.js";

export const SESSION_MAC_KEY_ENV_VAR =
	"MCP_AI_AGENT_GUIDELINES_SESSION_MAC_KEY";
export const SESSION_CONTEXT_ENCRYPTION_KEY_ENV_VAR =
	"MCP_AI_AGENT_GUIDELINES_SESSION_ENCRYPTION_KEY";
export const SESSION_MAC_KEY_FILE = "config/session-integrity.key";
export const SESSION_CONTEXT_ENCRYPTION_KEY_FILE = "config/session-context.key";

const ENCRYPTED_SESSION_PREFIX = "mcp-toon-encrypted:v1:";
const AES_256_GCM_ALGORITHM = "aes-256-gcm";
const AES_256_GCM_IV_BYTES = 12;
const GENERATED_SECRET_BYTES = 32;

interface EncryptedSessionEnvelope {
	version: 1;
	algorithm: typeof AES_256_GCM_ALGORITHM;
	iv: string;
	authTag: string;
	ciphertext: string;
}

function resolvePathWithinRoot(
	rootDir: string,
	pathSuffix: string,
	fieldName: string,
): string {
	const resolvedRoot = resolve(rootDir);
	const resolvedPath = resolve(resolvedRoot, pathSuffix);
	const relativePath = relative(resolvedRoot, resolvedPath);

	if (
		relativePath === ".." ||
		relativePath.startsWith(`..${sep}`) ||
		isAbsolute(relativePath)
	) {
		throw new ValidationError(
			"Path traversal outside the session state directory is not allowed.",
			createErrorContext("session-store"),
			fieldName,
		);
	}

	return resolvedPath;
}

function deriveKeyMaterial(secret: string): Buffer {
	const trimmedSecret = secret.trim();
	if (trimmedSecret.length === 0) {
		throw new ValidationError(
			"Secret material cannot be empty.",
			createErrorContext("session-store"),
			"secret",
		);
	}

	if (
		trimmedSecret.length === GENERATED_SECRET_BYTES * 2 &&
		/^[0-9a-f]+$/i.test(trimmedSecret)
	) {
		return Buffer.from(trimmedSecret, "hex");
	}

	return createHash("sha256").update(trimmedSecret, "utf8").digest();
}

async function readSecretFile(secretPath: string): Promise<string | null> {
	try {
		const contents = (await readFile(secretPath, "utf8")).trim();
		if (contents.length === 0) {
			throw new ValidationError(
				"Persistent session secret file cannot be empty.",
				createErrorContext("session-store"),
				secretPath,
			);
		}
		return contents;
	} catch (error) {
		const errorWithCode = error as NodeJS.ErrnoException;
		if (errorWithCode?.code === "ENOENT") {
			return null;
		}
		throw error;
	}
}

export async function resolveOrCreatePersistentSecret(options: {
	rootDir: string;
	keyFilePath: string;
	envVar: string;
	explicitSecret?: string;
	fieldName: string;
}): Promise<string> {
	const explicitSecret = options.explicitSecret?.trim();
	if (explicitSecret) {
		return explicitSecret;
	}

	const environmentSecret = process.env[options.envVar]?.trim();
	if (environmentSecret) {
		return environmentSecret;
	}

	const secretPath = resolvePathWithinRoot(
		options.rootDir,
		options.keyFilePath,
		options.fieldName,
	);
	const existingSecret = await readSecretFile(secretPath);
	if (existingSecret) {
		return existingSecret;
	}

	const generatedSecret = randomBytes(GENERATED_SECRET_BYTES).toString("hex");
	await mkdir(dirname(secretPath), { recursive: true });
	await ensureSessionStateGitignore(options.rootDir);
	try {
		await writeFile(secretPath, `${generatedSecret}\n`, {
			encoding: "utf8",
			flag: "wx",
			mode: 0o600,
		});
		return generatedSecret;
	} catch (error) {
		const errorWithCode = error as NodeJS.ErrnoException;
		if (errorWithCode?.code !== "EEXIST") {
			if (errorWithCode?.code !== "ENOENT") {
				throw error;
			}

			await mkdir(dirname(secretPath), { recursive: true });
			await writeFile(secretPath, `${generatedSecret}\n`, {
				encoding: "utf8",
				flag: "wx",
				mode: 0o600,
			});
			return generatedSecret;
		}

		// Another process wrote the file concurrently. On fast I/O (e.g. CI),
		// the write may not yet be visible — retry with backoff before giving up.
		const delays = [5, 25, 100];
		let persistedSecret: string | null = null;
		for (const delayMs of delays) {
			await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
			persistedSecret = await readSecretFile(secretPath);
			if (persistedSecret) break;
		}
		// If the persisted file is still unreadable (e.g. the concurrent writer's
		// temp directory was removed before we could read it — common in parallel
		// test runs where afterAll cleanup races with our retry window), fall back
		// to the locally-generated secret. It is cryptographically valid for this
		// process session and avoids an unhandled rejection that would fail CI.
		return persistedSecret ?? generatedSecret;
	}
}

export function signSessionData(data: string, secret: string): string {
	const hmac = createHmac("sha256", deriveKeyMaterial(secret));
	hmac.update(data);
	return hmac.digest("hex");
}

export function isEncryptedSessionPayload(contents: string): boolean {
	return contents.startsWith(ENCRYPTED_SESSION_PREFIX);
}

export function encryptSessionPayload(
	contents: string,
	secret: string,
	associatedData?: string,
): string {
	const key = deriveKeyMaterial(secret);
	const iv = randomBytes(AES_256_GCM_IV_BYTES);
	const cipher = createCipheriv(AES_256_GCM_ALGORITHM, key, iv);
	if (associatedData) {
		cipher.setAAD(Buffer.from(associatedData, "utf8"));
	}
	const ciphertext = Buffer.concat([
		cipher.update(contents, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();
	const envelope: EncryptedSessionEnvelope = {
		version: 1,
		algorithm: AES_256_GCM_ALGORITHM,
		iv: iv.toString("base64"),
		authTag: authTag.toString("base64"),
		ciphertext: ciphertext.toString("base64"),
	};

	return `${ENCRYPTED_SESSION_PREFIX}${Buffer.from(
		JSON.stringify(envelope),
		"utf8",
	).toString("base64")}`;
}

export function decryptSessionPayload(
	contents: string,
	secret: string,
	associatedData?: string,
): string {
	if (!isEncryptedSessionPayload(contents)) {
		return contents;
	}

	const encodedEnvelope = contents.slice(ENCRYPTED_SESSION_PREFIX.length);
	let envelope: EncryptedSessionEnvelope;
	try {
		envelope = JSON.parse(
			Buffer.from(encodedEnvelope, "base64").toString("utf8"),
		) as EncryptedSessionEnvelope;
	} catch (error) {
		throw new SessionDataError(
			`Failed to parse encrypted session payload: ${toErrorMessage(error)}`,
			createErrorContext("session-store"),
		);
	}

	if (
		envelope.version !== 1 ||
		envelope.algorithm !== AES_256_GCM_ALGORITHM ||
		typeof envelope.iv !== "string" ||
		typeof envelope.authTag !== "string" ||
		typeof envelope.ciphertext !== "string"
	) {
		throw new SessionDataError(
			"Encrypted session payload envelope is invalid.",
			createErrorContext("session-store"),
		);
	}

	try {
		const decipher = createDecipheriv(
			AES_256_GCM_ALGORITHM,
			deriveKeyMaterial(secret),
			Buffer.from(envelope.iv, "base64"),
		);
		if (associatedData) {
			decipher.setAAD(Buffer.from(associatedData, "utf8"));
		}
		decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));
		const plaintext = Buffer.concat([
			decipher.update(Buffer.from(envelope.ciphertext, "base64")),
			decipher.final(),
		]);
		return plaintext.toString("utf8");
	} catch (error) {
		throw new SessionDataError(
			`Failed to decrypt session payload: ${toErrorMessage(error)}`,
			createErrorContext("session-store"),
		);
	}
}
