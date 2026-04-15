import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	expectToolSucceeded,
	extractText,
	FORBIDDEN_PLACEHOLDER_SNIPPETS,
	parseJsonText,
	SdkMcpTestClient,
} from "./sdk-test-client.js";

describe("sdk compatibility lane", () => {
	let sdkClient: SdkMcpTestClient;
	const workspaceTool = "agent-workspace";

	beforeEach(async () => {
		sdkClient = new SdkMcpTestClient("mcp-sdk-compatibility-lane");
		await sdkClient.connect();
	});

	afterEach(async () => {
		await sdkClient.close();
	});

	it("discovers canonical workspace tools via the official TypeScript SDK", async () => {
		const tools = await sdkClient.listTools();
		const names = tools.map((tool) => tool.name);

		expect(names).toEqual(
			expect.arrayContaining([
				"docs-generate",
				workspaceTool,
				"agent-session",
				"agent-snapshot",
			]),
		);
		expect(names).not.toContain("workspace");
		expect(names).not.toContain("session");
		expect(names).not.toContain("snapshot");
		expect(names).not.toContain("workspace-list");
		expect(names).not.toContain("workspace-read");
		expect(names).not.toContain("workspace-artifact");
		expect(names).not.toContain("workspace-fetch");
		expect(names).not.toContain("workspace-compare");
	});

	it("calls an instruction tool through the official TypeScript SDK", async () => {
		const result = await sdkClient.callTool("document", {
			request:
				"Document this pseudocode in short markdown: if risk > 0.8 escalate to reviewer else execute worker.",
		});

		expectToolSucceeded(result, sdkClient.stderrOutput);
		const text = extractText(result).toLowerCase();
		expect(text.length).toBeGreaterThan(0);
		for (const snippet of FORBIDDEN_PLACEHOLDER_SNIPPETS) {
			expect(text).not.toContain(snippet);
		}
	});

	it("persists and reuses session artifacts across multiple workspace tools in one SDK client session", async () => {
		const sessionId = "session-550e8400-e29b-41d4-a716-446655440001";
		const workspaceMapResult = await sdkClient.callTool(workspaceTool, {
			command: "persist",
			target: "workspace-map",
			sessionId,
			data: {
				generated: "2024-01-03T00:00:00.000Z",
				modules: {
					docs: {
						path: "docs",
						files: ["README.md"],
						dependencies: ["src"],
					},
				},
			},
		});

		expectToolSucceeded(workspaceMapResult, sdkClient.stderrOutput);
		const persistPayload = JSON.parse(
			extractText(workspaceMapResult),
		) as Record<string, unknown>;
		expect(persistPayload.artifact).toBe("workspace-map");
		expect(persistPayload.sessionId).toBe(sessionId);

		const readWorkspaceMapResult = await sdkClient.callTool(workspaceTool, {
			command: "read",
			scope: "artifact",
			artifact: "workspace-map",
			sessionId,
		});

		expectToolSucceeded(readWorkspaceMapResult, sdkClient.stderrOutput);
		expect(extractText(readWorkspaceMapResult)).toContain('"README.md"');

		const scanResultsResult = await sdkClient.callTool(workspaceTool, {
			command: "persist",
			target: "scan-results",
			sessionId,
			data: {
				generatedBy: "src/tests/mcp/sdk-compatibility-lane.test.ts",
				status: "ok",
				files: ["README.md"],
			},
		});

		expectToolSucceeded(scanResultsResult, sdkClient.stderrOutput);
		const scanPersistPayload = JSON.parse(
			extractText(scanResultsResult),
		) as Record<string, unknown>;
		expect(scanPersistPayload.artifact).toBe("scan-results");

		const fetchResult = await sdkClient.callTool(workspaceTool, {
			command: "fetch",
			path: "package.json",
			sessionId,
		});

		expectToolSucceeded(fetchResult, sdkClient.stderrOutput);
		const payload = parseJsonText(fetchResult);
		expect(payload.sessionId).toBe(sessionId);
		expect(payload.sourceFile).toMatchObject({
			path: "package.json",
		});
		expect(payload.artifacts).toMatchObject({
			workspaceMap: {
				modules: {
					docs: {
						path: "docs",
						files: ["README.md"],
						dependencies: ["src"],
					},
				},
			},
			scanResults: {
				generatedBy: "src/tests/mcp/sdk-compatibility-lane.test.ts",
				status: "ok",
				files: ["README.md"],
			},
		});
	});
});
