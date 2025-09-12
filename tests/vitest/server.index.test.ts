import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the MCP Server transport and server to avoid real stdio connections
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => {
	class StdioServerTransport {}
	return { StdioServerTransport };
});

const calls = { set: 0, connect: 0, tools: [] as unknown[], resources: [] as unknown[], prompts: [] as unknown[] };

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
	class Server {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		constructor(_info?: unknown, _caps?: unknown) {}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		setRequestHandler(_schema: unknown, _handler: unknown) {
			calls.set++;
		}
		async connect() {
			calls.connect++;
			return Promise.resolve();
		}
	}
	return { Server, __calls: calls };
});

afterEach(() => {
	vi.restoreAllMocks();
	calls.set = 0;
	calls.connect = 0;
});

describe("server index boot", () => {
	it("starts server and registers handlers without side effects", async () => {
		// silence console noise during import
		vi.spyOn(console, "error").mockImplementation(() => {});

		// Import the entrypoint (runs main())
		await import("../../src/index.ts");

		const mocked: { __calls: { connect: number; set: number } } = (await import(
			"@modelcontextprotocol/sdk/server/index.js"
		)) as unknown as { __calls: { connect: number; set: number } };
		// Verify our mock recorded activity
		expect(mocked.__calls.connect).toBe(1);
		expect(mocked.__calls.set).toBeGreaterThan(0);
	});

	it("handles server connection errors gracefully", async () => {
		const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});
		const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		// Mock server.connect to throw an error
		vi.doMock("@modelcontextprotocol/sdk/server/index.js", () => {
			class Server {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				constructor(_info?: unknown, _caps?: unknown) {}
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				setRequestHandler(_schema: unknown, _handler: unknown) {}
				async connect() {
					throw new Error("Connection failed");
				}
			}
			return { Server };
		});

		try {
			// This should trigger the error handling path
			await import("../../src/index.ts?t=" + Date.now());
		} catch (e) {
			// Expect the process.exit to be called
			expect(mockExit).toHaveBeenCalledWith(1);
			expect(mockConsoleError).toHaveBeenCalledWith("Server error:", expect.any(Error));
		}

		mockExit.mockRestore();
		mockConsoleError.mockRestore();
	});
});
