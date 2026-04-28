import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	expectToolSucceeded,
	extractText,
	FORBIDDEN_PLACEHOLDER_SNIPPETS,
	parseJsonText,
	type SDKToolCallResult,
	SdkMcpTestClient,
} from "../mcp/sdk-test-client.js";

const FIXED_TIMESTAMP = "2024-01-03T00:00:00.000Z";

type SimulationScenario = {
	name: string;
	run: (context: SimulationContext) => Promise<void>;
};

type WorkspaceFetchPayload = {
	sessionId: string;
	sourceFile: { path: string; content: string } | null;
	artifacts: {
		sessionContext: unknown;
		workspaceMap: unknown;
		scanResults: unknown;
		fingerprintSnapshot: unknown;
	};
};

function canonicalToolName(name: string) {
	switch (name) {
		case "workspace":
			return "agent-workspace";
		case "session":
			return "agent-session-fetch";
		case "snapshot":
			return "agent-snapshot-fetch";
		default:
			return name;
	}
}

function normalizeToolCall(name: string, args: Record<string, unknown>) {
	if (name === "snapshot") {
		const command = args.command;
		if (command === "refresh") {
			return { name: "agent-snapshot-write", args: {} };
		}
		if (command === "compare") {
			return {
				name: "agent-snapshot-compare",
				args: { selector: args.selector },
			};
		}
		if (command === "read") {
			return { name: "agent-snapshot-read", args: { selector: args.selector } };
		}
		if (command === "history") {
			return { name: "agent-snapshot-fetch", args: { mode: "history" } };
		}
	}

	if (name === "session") {
		const command = args.command;
		if (command === "read") {
			return {
				name: "agent-session-read",
				args: { sessionId: args.sessionId, artifact: args.artifact },
			};
		}
		if (command === "write") {
			return {
				name: "agent-session-write",
				args: {
					sessionId: args.sessionId,
					target: args.target,
					data: args.data,
				},
			};
		}
		if (command === "delete") {
			return {
				name: "agent-session-delete",
				args: { sessionId: args.sessionId },
			};
		}
	}

	return { name: canonicalToolName(name), args };
}

class SimulationContext {
	private readonly values = new Map<string, unknown>();

	constructor(
		readonly client: SdkMcpTestClient,
		readonly sessionId: string,
	) {}

	async callTool(name: string, args: Record<string, unknown>) {
		const normalized = normalizeToolCall(name, args);
		const shouldAttachSessionId =
			normalized.name === "agent-workspace" ||
			normalized.name.startsWith("agent-session-");
		const result = await this.client.callTool(normalized.name, {
			...normalized.args,
			...(shouldAttachSessionId && !normalized.args.sessionId
				? { sessionId: this.sessionId }
				: {}),
		});
		expectToolSucceeded(result, this.client.stderrOutput);
		return result;
	}

	async callToolExpectError(name: string, args: Record<string, unknown>) {
		const normalized = normalizeToolCall(name, args);
		const shouldAttachSessionId =
			normalized.name === "agent-workspace" ||
			normalized.name.startsWith("agent-session-");
		const result = await this.client.callTool(normalized.name, {
			...normalized.args,
			...(shouldAttachSessionId && !normalized.args.sessionId
				? { sessionId: this.sessionId }
				: {}),
		});
		expect(("isError" in result ? result.isError : false) ?? false).toBe(true);
		return result;
	}

	getJson(result: SDKToolCallResult) {
		return parseJsonText(result);
	}

	getText(result: SDKToolCallResult) {
		return extractText(result);
	}

	put(key: string, value: unknown) {
		this.values.set(key, value);
	}

	get<T>(key: string): T {
		const value = this.values.get(key);
		if (value === undefined) {
			throw new Error(`Missing simulation context value: ${key}`);
		}
		return value as T;
	}
}

function compactText(text: string) {
	return text.replace(/\s+/g, " ").trim();
}

function summarize(text: string, maxLength = 96) {
	return compactText(text).slice(0, maxLength);
}

function lineCount(text: string) {
	return text.split("\n").filter((line) => line.trim().length > 0).length;
}

function safeKey(label: string) {
	return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function firstWord(text: string) {
	return (
		compactText(text)
			.toLowerCase()
			.split(/[^a-z0-9]+/)
			.filter(Boolean)[0] ?? "context"
	);
}

function unique(values: string[]) {
	return Array.from(new Set(values));
}

function asWorkspaceFetchPayload(value: Record<string, unknown>) {
	return value as unknown as WorkspaceFetchPayload;
}

function assertNoPlaceholderText(text: string) {
	const normalized = text.toLowerCase();
	for (const snippet of FORBIDDEN_PLACEHOLDER_SNIPPETS) {
		expect(normalized).not.toContain(snippet);
	}
	expect(text.length).toBeGreaterThan(0);
}

function buildSessionContext(label: string, text: string, next: string) {
	return {
		context: {
			requestScope: `${label}:${summarize(text, 48)}`,
			constraints: [`chars:${text.length}`, `lines:${lineCount(text)}`],
			phase: `${safeKey(label)}-captured`,
		},
		progress: {
			completed: [`captured ${label}`],
			next: [next],
		},
		memory: {
			keyInsights: [summarize(text)],
			decisions: {
				charCount: text.length,
				lineCount: lineCount(text),
				primaryToken: firstWord(text),
			},
		},
	};
}

function buildWorkspaceMap(label: string, text: string, files: string[]) {
	return {
		generated: FIXED_TIMESTAMP,
		modules: {
			[safeKey(label)]: {
				path: files.some((file) => file.endsWith(".md")) ? "docs" : "src",
				files,
				dependencies: unique([firstWord(text), "src"]),
			},
		},
	};
}

function buildScanResults(
	label: string,
	text: string,
	extra: Record<string, unknown> = {},
) {
	return {
		generatedBy: `simulation:${safeKey(label)}`,
		status: "ok",
		summary: summarize(text),
		metrics: {
			charCount: text.length,
			lineCount: lineCount(text),
		},
		...extra,
	};
}

function scenarioSessionId(index: number) {
	return `session-550e8400-e29b-41d4-a716-44665544${String(index + 1).padStart(4, "0")}`;
}

const SIMULATION_SCENARIOS: readonly SimulationScenario[] = [
	{
		name: "document -> session-context -> fetch",
		run: async (context) => {
			const documentResult = await context.callTool("document", {
				request:
					"Document a short MCP flow where a worker stores context and fetches workspace state.",
			});
			const documentText = context.getText(documentResult);
			assertNoPlaceholderText(documentText);
			const sessionContext = buildSessionContext(
				"document",
				documentText,
				"fetch README with derived context",
			);

			await context.callTool("workspace", {
				command: "persist",
				target: "session-context",
				data: sessionContext,
			});
			const fetchResult = await context.callTool("workspace", {
				command: "fetch",
				path: "README.md",
			});
			const payload = asWorkspaceFetchPayload(context.getJson(fetchResult));

			expect(payload.sessionId).toBe(context.sessionId);
			expect(payload.sourceFile).toMatchObject({ path: "README.md" });
			expect(payload.artifacts).toMatchObject({
				sessionContext,
			});
		},
	},
	{
		name: "plan -> workspace-map -> fetch",
		run: async (context) => {
			const planResult = await context.callTool("plan", {
				request: "Plan a small MCP rollout for workspace-aware tool usage.",
			});
			const planText = context.getText(planResult);
			assertNoPlaceholderText(planText);
			const workspaceMap = buildWorkspaceMap("plan", planText, ["README.md"]);

			await context.callTool("workspace", {
				command: "persist",
				target: "workspace-map",
				data: workspaceMap,
			});
			const fetchResult = await context.callTool("workspace", {
				command: "fetch",
				path: "package.json",
			});
			const payload = asWorkspaceFetchPayload(context.getJson(fetchResult));

			expect(payload.artifacts).toMatchObject({
				workspaceMap,
			});
			expect(payload.sourceFile).toMatchObject({ path: "package.json" });
		},
	},
	{
		name: "review -> scan-results -> artifact read",
		run: async (context) => {
			const reviewResult = await context.callTool("review", {
				request: "Review the runtime MCP routing and workspace helper surface.",
				artifact: "src/tools/workspace-tools.ts",
			});
			const reviewText = context.getText(reviewResult);
			assertNoPlaceholderText(reviewText);
			const scanResults = buildScanResults("review", reviewText, {
				findings: [
					{
						severity: "info",
						file: "src/tools/workspace-tools.ts",
						note: summarize(reviewText, 40),
					},
				],
			});

			await context.callTool("workspace", {
				command: "persist",
				target: "scan-results",
				data: scanResults,
			});
			const readResult = await context.callTool("workspace", {
				command: "read",
				scope: "artifact",
				artifact: "scan-results",
			});

			expect(context.getText(readResult)).toContain(
				'"generatedBy": "simulation:review"',
			);
			expect(context.getText(readResult)).toContain(
				'"file": "src/tools/workspace-tools.ts"',
			);
		},
	},
	{
		name: "bootstrap -> empty artifacts -> populated artifacts",
		run: async (context) => {
			const initialList = await context.callTool("workspace", {
				command: "list",
				scope: "artifact",
			});
			const initialFetch = await context.callTool("workspace", {
				command: "fetch",
				path: "package.json",
			});
			const bootstrapResult = await context.callTool("bootstrap", {
				request:
					"Bootstrap an MCP workspace triage session for docs and tests.",
			});
			const bootstrapText = context.getText(bootstrapResult);
			assertNoPlaceholderText(bootstrapText);

			await context.callTool("workspace", {
				command: "persist",
				target: "session-context",
				data: buildSessionContext(
					"bootstrap",
					bootstrapText,
					"review populated artifact state",
				),
			});
			await context.callTool("workspace", {
				command: "persist",
				target: "scan-results",
				data: buildScanResults("bootstrap", bootstrapText),
			});

			const populatedList = await context.callTool("workspace", {
				command: "list",
				scope: "artifact",
			});
			const populatedFetch = await context.callTool("workspace", {
				command: "fetch",
				path: "package.json",
			});
			const initialListPayload = context.getJson(initialList);
			const initialFetchPayload = asWorkspaceFetchPayload(
				context.getJson(initialFetch),
			);
			const populatedListPayload = context.getJson(populatedList);
			const populatedFetchPayload = asWorkspaceFetchPayload(
				context.getJson(populatedFetch),
			);

			expect(initialListPayload.entries).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ kind: "session-context", present: false }),
					expect.objectContaining({ kind: "scan-results", present: false }),
				]),
			);
			expect(initialFetchPayload.artifacts.sessionContext).toBeNull();
			expect(populatedListPayload.entries).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ kind: "session-context", present: true }),
					expect.objectContaining({ kind: "scan-results", present: true }),
				]),
			);
			expect(populatedFetchPayload.artifacts.sessionContext).not.toBeNull();
			expect(populatedFetchPayload.artifacts.scanResults).toMatchObject({
				generatedBy: "simulation:bootstrap",
			});
		},
	},
	{
		name: "invalid compare -> recovery artifact -> continued fetch",
		run: async (context) => {
			const invalidCompare = await context.callToolExpectError("workspace", {
				command: "compare",
				refreshBaseline: "yes",
			});
			const errorText = context.getText(invalidCompare);
			expect(errorText).toContain("Invalid input for `agent-workspace`");

			await context.callTool("workspace", {
				command: "persist",
				target: "session-context",
				data: {
					...buildSessionContext(
						"compare-recovery",
						errorText,
						"continue after explicit validation failure",
					),
					memory: {
						keyInsights: [summarize(errorText)],
						warnings: ["compare validation failed"],
					},
				},
			});
			const validCompare = await context.callTool("workspace", {
				command: "compare",
			});
			const fetchResult = await context.callTool("workspace", {
				command: "fetch",
				path: "package.json",
			});

			expect(context.getText(validCompare)).toContain('"drift"');
			expect(
				asWorkspaceFetchPayload(context.getJson(fetchResult)).artifacts
					.sessionContext,
			).toMatchObject({
				memory: {
					warnings: ["compare validation failed"],
				},
			});
		},
	},
	{
		name: "document -> snapshot-refresh -> snapshot-compare -> scan-results",
		run: async (context) => {
			const documentResult = await context.callTool("document", {
				request: "Document how TOON memory snapshots help MCP debugging.",
			});
			const documentText = context.getText(documentResult);
			assertNoPlaceholderText(documentText);

			const refreshResult = await context.callTool("snapshot", {
				command: "refresh",
			});
			const refreshText = context.getText(refreshResult);
			const refreshPayload = JSON.parse(refreshText) as Record<string, unknown>;
			expect(typeof refreshPayload.snapshotId).toBe("string");
			expect(typeof refreshPayload.skillCount).toBe("number");

			const compareResult = await context.callTool("snapshot", {
				command: "compare",
			});
			const compareText = context.getText(compareResult);
			expect(
				compareText.includes("No drift detected.") ||
					compareText.includes("drift entries detected."),
			).toBe(true);

			await context.callTool("workspace", {
				command: "persist",
				target: "scan-results",
				data: buildScanResults("memory-tools", documentText, {
					refreshObserved: refreshPayload.snapshotId !== undefined,
					compareSummary: summarize(compareText, 64),
				}),
			});
			const fetchResult = await context.callTool("workspace", {
				command: "fetch",
				path: "README.md",
			});

			expect(
				asWorkspaceFetchPayload(context.getJson(fetchResult)).artifacts
					.scanResults,
			).toMatchObject({
				generatedBy: "simulation:memory-tools",
				refreshObserved: true,
			});
		},
	},
	{
		name: "workspace-list -> derived map -> compare",
		run: async (context) => {
			const listResult = await context.callTool("workspace", {
				command: "list",
				scope: "source",
				path: "docs",
			});
			const listPayload = context.getJson(listResult);
			const entries = ((listPayload.entries ?? []) as Array<{ name: string }>)
				.map((entry) => entry.name)
				.sort();
			expect(entries.length).toBeGreaterThan(0);

			const workspaceMap = {
				generated: FIXED_TIMESTAMP,
				modules: {
					docs: {
						path: "docs",
						files: entries.slice(0, 3),
						dependencies: ["src"],
					},
				},
			};
			await context.callTool("workspace", {
				command: "persist",
				target: "workspace-map",
				data: workspaceMap,
			});
			const compareResult = await context.callTool("workspace", {
				command: "compare",
			});
			expect(context.getText(compareResult)).toContain('"drift"');
		},
	},
	{
		name: "research -> scan-results -> fetch",
		run: async (context) => {
			const researchResult = await context.callTool("research", {
				request: "Research how MCP clients typically reuse tool context.",
			});
			const researchText = context.getText(researchResult);
			assertNoPlaceholderText(researchText);

			await context.callTool("workspace", {
				command: "persist",
				target: "scan-results",
				data: buildScanResults("research", researchText, {
					files: ["README.md"],
					topic: "context reuse",
				}),
			});
			const fetchResult = await context.callTool("workspace", {
				command: "fetch",
				path: "README.md",
			});
			expect(
				asWorkspaceFetchPayload(context.getJson(fetchResult)).artifacts
					.scanResults,
			).toMatchObject({
				topic: "context reuse",
			});
		},
	},
	{
		name: "orchestration read -> invalid write capture -> fetch",
		run: async (context) => {
			const readResult = await context.callTool("orchestration-config", {
				command: "read",
			});
			const readPayload = context.getJson(readResult);
			expect(readPayload).toHaveProperty("config");
			expect(readPayload).toHaveProperty("summary");

			const invalidWriteResult = await context.callToolExpectError(
				"orchestration-config",
				{
					command: "write",
					patch: {
						modelAvailability: {
							defaultModel: "bad",
						},
					},
				},
			);
			const errorText = context.getText(invalidWriteResult);
			expect(errorText).toContain("unsupported top-level keys");

			await context.callTool("workspace", {
				command: "persist",
				target: "scan-results",
				data: {
					...buildScanResults("orchestration", errorText),
					configKeys: Object.keys(
						(readPayload.config as Record<string, unknown>) ?? {},
					).sort(),
				},
			});
			const fetchResult = await context.callTool("workspace", {
				command: "fetch",
				path: "package.json",
			});
			expect(
				asWorkspaceFetchPayload(context.getJson(fetchResult)).artifacts
					.scanResults,
			).toMatchObject({
				generatedBy: "simulation:orchestration",
			});
		},
	},
	{
		name: "fetched context drives a second document call",
		run: async (context) => {
			await context.callTool("workspace", {
				command: "persist",
				target: "session-context",
				data: buildSessionContext(
					"seed-document",
					"seed context for second document request",
					"fetch current workspace bundle",
				),
			});
			await context.callTool("workspace", {
				command: "persist",
				target: "workspace-map",
				data: buildWorkspaceMap("seed-document", "README workspace docs", [
					"README.md",
				]),
			});
			await context.callTool("workspace", {
				command: "persist",
				target: "scan-results",
				data: buildScanResults(
					"seed-document",
					"workspace fetch should drive the next request",
				),
			});
			const fetchResult = await context.callTool("workspace", {
				command: "fetch",
				path: "README.md",
			});
			const fetchPayload = asWorkspaceFetchPayload(
				context.getJson(fetchResult),
			);
			const request = [
				"Document the current MCP state in short markdown.",
				`Session: ${String(fetchPayload.sessionId)}`,
				`Source: ${String((fetchPayload.sourceFile as Record<string, unknown>).path)}`,
				`Artifacts: ${Object.keys((fetchPayload.artifacts as Record<string, unknown>) ?? {}).join(", ")}`,
			].join(" ");

			const documentResult = await context.callTool("document", { request });
			const documentText = context.getText(documentResult);
			assertNoPlaceholderText(documentText);
			expect(documentText.toLowerCase()).toContain("mcp");
		},
	},
	{
		name: "bootstrap -> source list -> persisted session context -> fetch",
		run: async (context) => {
			const bootstrapResult = await context.callTool("bootstrap", {
				request: "Bootstrap a reviewer-oriented MCP session.",
			});
			const bootstrapText = context.getText(bootstrapResult);
			assertNoPlaceholderText(bootstrapText);
			const listResult = await context.callTool("workspace", {
				command: "list",
				scope: "source",
				path: "src/tests",
			});
			const entries = (
				(context.getJson(listResult).entries as Array<{ name: string }>) ?? []
			)
				.map((entry) => entry.name)
				.sort();

			await context.callTool("workspace", {
				command: "persist",
				target: "session-context",
				data: {
					...buildSessionContext(
						"bootstrap-tests",
						bootstrapText,
						"fetch package with selected test entries",
					),
					memory: {
						keyInsights: [summarize(bootstrapText)],
						decisions: {
							selectedEntries: entries.slice(0, 5).join(","),
						},
						patterns: [],
						warnings: [],
					},
				},
			});
			const fetchResult = await context.callTool("workspace", {
				command: "fetch",
				path: "package.json",
			});
			expect(
				asWorkspaceFetchPayload(context.getJson(fetchResult)).artifacts
					.sessionContext,
			).toMatchObject({
				memory: {
					decisions: {
						selectedEntries: entries.slice(0, 5).join(","),
					},
				},
			});
		},
	},
	{
		name: "plan -> all three artifacts -> fetch",
		run: async (context) => {
			const planResult = await context.callTool("plan", {
				request: "Plan a deterministic MCP regression-validation session.",
			});
			const planText = context.getText(planResult);
			assertNoPlaceholderText(planText);
			const sessionContext = buildSessionContext(
				"plan-all-artifacts",
				planText,
				"fetch complete artifact bundle",
			);
			const workspaceMap = buildWorkspaceMap("plan-all-artifacts", planText, [
				"package.json",
			]);
			const scanResults = buildScanResults("plan-all-artifacts", planText);

			await context.callTool("workspace", {
				command: "persist",
				target: "session-context",
				data: sessionContext,
			});
			await context.callTool("workspace", {
				command: "persist",
				target: "workspace-map",
				data: workspaceMap,
			});
			await context.callTool("workspace", {
				command: "persist",
				target: "scan-results",
				data: scanResults,
			});

			const fetchResult = await context.callTool("workspace", {
				command: "fetch",
				path: "package.json",
			});
			expect(
				asWorkspaceFetchPayload(context.getJson(fetchResult)).artifacts,
			).toMatchObject({
				sessionContext,
				workspaceMap,
				scanResults,
			});
		},
	},
	{
		name: "dual session isolation",
		run: async (context) => {
			const alternateSessionId = "session-550e8400-e29b-41d4-a716-446655449999";
			const primaryContext = buildSessionContext(
				"primary-session",
				"primary deterministic context",
				"stay isolated",
			);
			const alternateContext = buildSessionContext(
				"alternate-session",
				"alternate deterministic context",
				"stay isolated",
			);

			await context.callTool("workspace", {
				command: "persist",
				target: "session-context",
				data: primaryContext,
			});
			await context.callTool("workspace", {
				command: "persist",
				target: "session-context",
				sessionId: alternateSessionId,
				data: alternateContext,
			});
			await context.callTool("workspace", {
				command: "persist",
				target: "scan-results",
				data: buildScanResults("primary-session", "primary only"),
			});

			const primaryFetch = await context.callTool("workspace", {
				command: "fetch",
				path: "package.json",
			});
			const alternateFetch = await context.callTool("workspace", {
				command: "fetch",
				path: "package.json",
				sessionId: alternateSessionId,
			});
			const primaryPayload = asWorkspaceFetchPayload(
				context.getJson(primaryFetch),
			);
			const alternatePayload = asWorkspaceFetchPayload(
				context.getJson(alternateFetch),
			);

			expect(primaryPayload.artifacts.sessionContext).toMatchObject(
				primaryContext,
			);
			expect(primaryPayload.artifacts.scanResults).toMatchObject({
				generatedBy: "simulation:primary-session",
			});
			expect(alternatePayload.artifacts.sessionContext).toMatchObject(
				alternateContext,
			);
			expect(alternatePayload.artifacts.scanResults).toBeNull();
		},
	},
];

describe("simulations/session-1", () => {
	let sdkClient: SdkMcpTestClient;

	beforeEach(async () => {
		sdkClient = new SdkMcpTestClient("mcp-sdk-simulation-suite");
		await sdkClient.connect();
	});

	afterEach(async () => {
		await sdkClient.close();
	});

	it.each(
		SIMULATION_SCENARIOS.map(
			(scenario, index) => [scenario.name, scenario, index] as const,
		),
	)("runs simulation: %s", async (_scenarioName, scenario, index) => {
		const context = new SimulationContext(sdkClient, scenarioSessionId(index));
		await scenario.run(context);
	});
});
