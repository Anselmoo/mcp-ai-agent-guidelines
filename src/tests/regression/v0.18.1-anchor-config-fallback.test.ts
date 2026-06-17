import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the orchestration-config module so we can force loadOrchestrationConfig
// to throw on the first (workspace-root) call and succeed on the no-arg fallback.
// This covers the nested try/catch inside anchorStateToClientRoots at
// src/index.ts:304-310 — the path that runs when the explicit reload fails and
// the fallback `loadOrchestrationConfig()` ensures `_config` is not left null.
const mocks = vi.hoisted(() => ({
	loadOrchestrationConfig: vi.fn(),
	resetConfigCache: vi.fn(),
	resolveOrchestrationConfigPath: vi.fn(
		(workspaceRoot?: string) => `${workspaceRoot ?? "."}/orchestration.toml`,
	),
}));

vi.mock("../../config/orchestration-config.js", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("../../config/orchestration-config.js")
		>();
	return {
		...actual,
		loadOrchestrationConfig: mocks.loadOrchestrationConfig,
		resetConfigCache: mocks.resetConfigCache,
		resolveOrchestrationConfigPath: mocks.resolveOrchestrationConfigPath,
	};
});

// Re-import after mocks are in place so anchorStateToClientRoots binds to them.
import { anchorStateToClientRoots } from "../../index.js";

describe("anchorStateToClientRoots — config-reload fallback (v0.18.1)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function makeServer(rootUri: string) {
		return {
			getClientCapabilities: vi.fn().mockReturnValue({ roots: {} }),
			listRoots: vi.fn().mockResolvedValue({ roots: [{ uri: rootUri }] }),
		};
	}

	function makeRuntime(opts: { reinitialize?: () => Promise<void> } = {}) {
		return {
			workspaceRoot: "/old/root",
			modelRouter: opts.reinitialize
				? { reinitialize: vi.fn(opts.reinitialize) }
				: undefined,
		};
	}

	function makeMemory() {
		return { setBaseDir: vi.fn() };
	}

	it("calls the no-arg fallback when the explicit reload throws", async () => {
		// First call (with explicit path) throws — second call (no args) succeeds.
		mocks.loadOrchestrationConfig
			.mockImplementationOnce(() => {
				throw new Error("simulated strict-mode TOML parse failure");
			})
			.mockImplementationOnce(() => undefined);

		const server = makeServer("file:///tmp/some-project");
		const runtime = makeRuntime();
		const memory = makeMemory();
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation(() => true);

		const result = await anchorStateToClientRoots(
			server as never,
			runtime as never,
			memory,
		);

		// Anchor still completes successfully despite the inner throw.
		expect(result).toBe("/tmp/some-project");
		expect(runtime.workspaceRoot).toBe("/tmp/some-project");

		// Both the explicit and the fallback loader were invoked.
		expect(mocks.resetConfigCache).toHaveBeenCalledTimes(1);
		expect(mocks.loadOrchestrationConfig).toHaveBeenCalledTimes(2);
		expect(mocks.loadOrchestrationConfig).toHaveBeenNthCalledWith(
			1,
			"/tmp/some-project/orchestration.toml",
		);
		expect(mocks.loadOrchestrationConfig).toHaveBeenNthCalledWith(2);

		// The configErr warn line was written (covers index.ts:305).
		const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join("");
		expect(stderrText).toContain(
			"[warn] Failed to reload orchestration config from /tmp/some-project",
		);
		expect(stderrText).toContain("simulated strict-mode TOML parse failure");
	});

	it("invokes runtime.modelRouter.reinitialize with the resolved root when present", async () => {
		const reinitialize = vi.fn().mockResolvedValue(undefined);
		mocks.loadOrchestrationConfig.mockImplementation(() => undefined);

		const server = makeServer("file:///tmp/another-project");
		const runtime = makeRuntime({ reinitialize });
		const memory = makeMemory();
		vi.spyOn(process.stderr, "write").mockImplementation(() => true);

		const result = await anchorStateToClientRoots(
			server as never,
			runtime as never,
			memory,
		);

		expect(result).toBe("/tmp/another-project");
		expect(reinitialize).toHaveBeenCalledTimes(1);
		expect(reinitialize).toHaveBeenCalledWith("/tmp/another-project");
	});
});
