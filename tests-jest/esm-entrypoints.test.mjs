import { describe, expect, it } from "@jest/globals";
import { fileURLToPath } from "node:url";

describe("compiled ESM entrypoints", () => {
	it("imports dist/index.js and exercises direct-execution guards", async () => {
		const moduleUrl = new URL("../dist/index.js", import.meta.url);
		const mod = await import(moduleUrl.href);

		expect(typeof mod.createRuntime).toBe("function");
		expect(
			mod.isDirectExecutionEntry(fileURLToPath(moduleUrl), moduleUrl.href),
		).toBe(true);
		expect(
			mod.isDirectExecutionEntry(
				"/definitely/not-a-real-entry.js",
				moduleUrl.href,
			),
		).toBe(false);
	});

	it("imports dist/cli.js without executing the CLI entrypoint", async () => {
		const mod = await import(new URL("../dist/cli.js", import.meta.url).href);

		expect(typeof mod.McpAgentCli).toBe("function");
		expect(typeof mod.default).toBe("function");
	});
});
