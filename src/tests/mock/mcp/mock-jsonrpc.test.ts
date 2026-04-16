import { describe, expect, it } from "vitest";
import {
	buildCallToolRequest,
	buildInitializedNotification,
	buildInitializeRequest,
	buildListToolsRequest,
	decodeStdioMessage,
	encodeStdioMessage,
} from "./mock-jsonrpc.js";

describe("tests/mock/mcp/mock-jsonrpc", () => {
	it("builds initialize and tool requests with the expected MCP methods", () => {
		const initialize = buildInitializeRequest();
		const initialized = buildInitializedNotification();
		const listTools = buildListToolsRequest();
		const callTool = buildCallToolRequest("workspace-read", {
			path: "README.md",
		});

		expect(initialize.method).toBe("initialize");
		expect(initialized.method).toBe("notifications/initialized");
		expect(listTools.method).toBe("tools/list");
		expect(callTool.method).toBe("tools/call");
		expect(callTool.params).toEqual({
			name: "workspace-read",
			arguments: { path: "README.md" },
		});
	});

	it("encodes and decodes MCP stdio frames round-trip", () => {
		const request = buildCallToolRequest("adapt", {
			request: "Smoke test adaptive routing.",
		});
		const encoded = encodeStdioMessage(request);
		const decoded = decodeStdioMessage(encoded);

		expect(decoded.headers["content-length"]).toBeDefined();
		expect(decoded.payload).toEqual(request);
	});
});
