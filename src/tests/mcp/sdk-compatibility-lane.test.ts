import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	expectToolSucceeded,
	extractText,
	FORBIDDEN_PLACEHOLDER_SNIPPETS,
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
				"model-discover",
				"graph-visualize",
			]),
		);
		expect(names).not.toContain("workspace");
		expect(names).not.toContain("agent-memory-write");
		expect(names).not.toContain("agent-memory-fetch");
		expect(names).not.toContain("agent-session-fetch");
		expect(names).not.toContain("agent-session-write");
		expect(names).not.toContain("agent-snapshot-fetch");
		expect(names).not.toContain("agent-snapshot-write");
		expect(names).not.toContain("orchestration-config");
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

	it("lists and reads source files via workspace tool through the SDK", async () => {
		const listResult = await sdkClient.callTool(workspaceTool, {
			command: "list",
			path: "src",
		});
		expectToolSucceeded(listResult, sdkClient.stderrOutput);
		expect(extractText(listResult)).toContain('"entries"');

		const readResult = await sdkClient.callTool(workspaceTool, {
			command: "read",
			path: "package.json",
		});
		expectToolSucceeded(readResult, sdkClient.stderrOutput);
		expect(extractText(readResult)).toContain(
			'"name": "mcp-ai-agent-guidelines"',
		);
	});
});
