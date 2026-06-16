/**
 * Isolated tests for the `main()` entry-point function in src/index.ts.
 *
 * MCP SDK transport and server classes are stubbed so that calling main()
 * does not attempt real stdio or IPC connections.  Module-level vi.mock()
 * declarations are hoisted by Vitest and take effect before any import.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModelRouter } from "../models/model-router.js";

// Stub StdioServerTransport to prevent binding to actual stdin/stdout.
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
	// biome-ignore lint/complexity/useArrowFunction: `new` requires a [[Construct]] slot
	StdioServerTransport: vi.fn().mockImplementation(function () {
		return {};
	}),
}));

// Stub the MCP Server so connect() is a no-op and capability queries
// return null (makes anchorStateToClientRoots bail out immediately).
vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
	const serverInstance = {
		setRequestHandler: vi.fn(),
		connect: vi.fn().mockResolvedValue(undefined),
		getClientCapabilities: vi.fn().mockReturnValue(null),
		listRoots: vi.fn().mockResolvedValue({ roots: [] }),
	};
	return {
		// biome-ignore lint/complexity/useArrowFunction: `new` requires a [[Construct]] slot
		Server: vi.fn().mockImplementation(function () {
			return serverInstance;
		}),
	};
});

describe("main()", () => {
	let stderrSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);
		// Prevent accumulation of real SIGTERM/SIGINT listeners across tests.
		vi.spyOn(process, "once").mockImplementation(() => process);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("writes a [warn] to stderr when modelRouter.initialize rejects with an Error", async () => {
		vi.spyOn(ModelRouter.prototype, "initialize").mockRejectedValueOnce(
			new Error("init failed"),
		);

		const { main } = await import("../index.js");
		await main();

		const output = stderrSpy.mock.calls
			.map((c: unknown[]) => String(c[0]))
			.join("");
		expect(output).toContain(
			"[warn] Model router initialization failed: init failed",
		);
	});

	it("writes a [warn] to stderr when modelRouter.initialize rejects with a non-Error value", async () => {
		vi.spyOn(ModelRouter.prototype, "initialize").mockRejectedValueOnce(
			"string-rejection",
		);

		const { main } = await import("../index.js");
		await main();

		const output = stderrSpy.mock.calls
			.map((c: unknown[]) => String(c[0]))
			.join("");
		expect(output).toContain(
			"[warn] Model router initialization failed: string-rejection",
		);
	});
});
