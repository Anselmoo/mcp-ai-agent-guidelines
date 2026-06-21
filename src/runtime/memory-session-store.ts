import type {
	ExecutionProgressRecord,
	SessionStateStore,
} from "../contracts/runtime.js";

/**
 * In-memory `SessionStateStore` for ephemeral mode. Keeps per-session history in
 * a Map and writes nothing to disk, so the server leaves no `.mcp-ai-agent-guidelines/`
 * footprint in the user's project. State lives only for the process lifetime.
 */
export class MemorySessionStore implements SessionStateStore {
	private readonly histories = new Map<string, ExecutionProgressRecord[]>();

	async readSessionHistory(
		sessionId: string,
	): Promise<ExecutionProgressRecord[]> {
		return [...(this.histories.get(sessionId) ?? [])];
	}

	async writeSessionHistory(
		sessionId: string,
		records: ExecutionProgressRecord[],
	): Promise<void> {
		this.histories.set(sessionId, [...records]);
	}

	async appendSessionHistory(
		sessionId: string,
		record: ExecutionProgressRecord,
	): Promise<void> {
		const current = this.histories.get(sessionId) ?? [];
		current.push(record);
		this.histories.set(sessionId, current);
	}
}
