import { describe, expect, it } from "vitest";
import type { ExecutionProgressRecord } from "../../contracts/runtime.js";
import { MemorySessionStore } from "../../runtime/memory-session-store.js";

function record(step: string): ExecutionProgressRecord {
	return { step } as unknown as ExecutionProgressRecord;
}

describe("MemorySessionStore", () => {
	it("round-trips appended history without touching disk", async () => {
		const store = new MemorySessionStore();
		await store.appendSessionHistory("session-x", record("a"));
		await store.appendSessionHistory("session-x", record("b"));
		const history = await store.readSessionHistory("session-x");
		expect(history).toHaveLength(2);
	});

	it("returns an empty array for an unknown session", async () => {
		const store = new MemorySessionStore();
		expect(await store.readSessionHistory("session-none")).toEqual([]);
	});

	it("writeSessionHistory replaces prior history", async () => {
		const store = new MemorySessionStore();
		await store.appendSessionHistory("session-y", record("old"));
		await store.writeSessionHistory("session-y", [record("new")]);
		const history = await store.readSessionHistory("session-y");
		expect(history).toHaveLength(1);
	});

	it("returns a copy so external mutation does not corrupt the store", async () => {
		const store = new MemorySessionStore();
		await store.appendSessionHistory("session-z", record("a"));
		const first = await store.readSessionHistory("session-z");
		first.push(record("mutation"));
		expect(await store.readSessionHistory("session-z")).toHaveLength(1);
	});
});
