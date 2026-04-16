export interface JsonRpcRequest<TParams = Record<string, unknown>> {
	jsonrpc: "2.0";
	id: number | string;
	method: string;
	params?: TParams;
}

export interface JsonRpcNotification<TParams = Record<string, unknown>> {
	jsonrpc: "2.0";
	method: string;
	params?: TParams;
}

export function buildInitializeRequest(
	id: number | string = 1,
): JsonRpcRequest<{
	protocolVersion: string;
	capabilities: Record<string, unknown>;
	clientInfo: {
		name: string;
		version: string;
	};
}> {
	return {
		jsonrpc: "2.0",
		id,
		method: "initialize",
		params: {
			protocolVersion: "2024-11-05",
			capabilities: {},
			clientInfo: {
				name: "mock-mcp-client",
				version: "0.1.0",
			},
		},
	};
}

export function buildInitializedNotification(): JsonRpcNotification {
	return {
		jsonrpc: "2.0",
		method: "notifications/initialized",
		params: {},
	};
}

export function buildListToolsRequest(
	id: number | string = 2,
): JsonRpcRequest<Record<string, never>> {
	return {
		jsonrpc: "2.0",
		id,
		method: "tools/list",
		params: {},
	};
}

export function buildCallToolRequest(
	name: string,
	arguments_: Record<string, unknown> = {},
	id: number | string = 3,
): JsonRpcRequest<{
	name: string;
	arguments: Record<string, unknown>;
}> {
	return {
		jsonrpc: "2.0",
		id,
		method: "tools/call",
		params: {
			name,
			arguments: arguments_,
		},
	};
}

export function encodeStdioMessage(payload: unknown): string {
	const body = JSON.stringify(payload);
	return `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}\n`;
}

export function decodeStdioMessage(raw: string): {
	headers: Record<string, string>;
	payload: unknown;
} {
	const [headerBlock, body] = raw.split("\r\n\r\n", 2);
	if (!headerBlock || !body) {
		throw new Error("Invalid MCP stdio message: missing header or body.");
	}

	const headers = Object.fromEntries(
		headerBlock.split("\r\n").map((line) => {
			const [key, ...rest] = line.split(":");
			return [key.trim().toLowerCase(), rest.join(":").trim()];
		}),
	);

	return {
		headers,
		payload: JSON.parse(body),
	};
}
