import { randomUUID } from "node:crypto";
import type {
	ExecutionProgressRecord,
	SessionStateStore,
} from "../contracts/runtime.js";
import {
	defaultReadTextFile,
	ensureSessionStateGitignore,
	resolveSessionPathWithinStateDir,
	resolveSessionStateDir,
	runExclusiveSessionOperation,
	type SessionStoreSeams,
	writeTextFileAtomic,
} from "./session-store-utils.js";

export class FileSessionStore implements SessionStateStore {
	private readonly writeLocks = new Map<string, Promise<void>>();
	private readonly readTextFile: (path: string) => Promise<string>;

	constructor(seams: SessionStoreSeams = {}) {
		this.readTextFile = seams.readTextFile ?? defaultReadTextFile;
	}

	private sessionFilePath(sessionId: string): string {
		return resolveSessionPathWithinStateDir(`${sessionId}.json`);
	}

	async readSessionHistory(
		sessionId: string,
	): Promise<ExecutionProgressRecord[]> {
		resolveSessionStateDir();
		try {
			const contents = await this.readTextFile(this.sessionFilePath(sessionId));
			const parsed = JSON.parse(contents);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	async writeSessionHistory(
		sessionId: string,
		records: ExecutionProgressRecord[],
	): Promise<void> {
		await ensureSessionStateGitignore(resolveSessionStateDir());
		await writeTextFileAtomic(
			this.sessionFilePath(sessionId),
			`${JSON.stringify(records, null, "\t")}\n`,
		);
	}

	async appendSessionHistory(
		sessionId: string,
		record: ExecutionProgressRecord,
	): Promise<void> {
		await runExclusiveSessionOperation(this.writeLocks, sessionId, async () => {
			const existing = await this.readSessionHistory(sessionId);
			existing.push(record);
			await this.writeSessionHistory(sessionId, existing);
		});
	}
}

export function createSessionId() {
	return `session-${randomUUID()}`;
}
