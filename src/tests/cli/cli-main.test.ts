import { afterEach, describe, expect, it, vi } from "vitest";

async function importCliMainWithMock(
	runImplementation: () => Promise<unknown>,
) {
	vi.resetModules();

	const run = vi.fn(runImplementation);
	const constructorSpy = vi.fn();

	class McpAgentCli {
		constructor() {
			constructorSpy();
		}

		run = run;
	}

	vi.doMock("../../cli.js", () => ({
		default: McpAgentCli,
	}));

	await import("../../cli-main.js");

	return { constructorSpy, run };
}

afterEach(() => {
	vi.doUnmock("../../cli.js");
	vi.resetModules();
	vi.restoreAllMocks();
});

describe("cli-main entrypoint", () => {
	it("constructs the CLI and runs it on import", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const exitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation((() => undefined) as never);

		const { constructorSpy, run } = await importCliMainWithMock(async () => {});

		expect(constructorSpy).toHaveBeenCalledOnce();
		expect(run).toHaveBeenCalledOnce();
		expect(errorSpy).not.toHaveBeenCalled();
		expect(exitSpy).not.toHaveBeenCalled();
	});

	it("logs fatal errors and exits with code 1 when the CLI run rejects", async () => {
		const error = new Error("boom");
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const exitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation((() => undefined) as never);

		const { run } = await importCliMainWithMock(async () => {
			throw error;
		});

		expect(run).toHaveBeenCalledOnce();
		await vi.waitFor(() => {
			expect(errorSpy).toHaveBeenCalledWith(
				"Fatal CLI error [errorType=Error, error=boom]",
			);
			expect(exitSpy).toHaveBeenCalledWith(1);
		});
	});
});
