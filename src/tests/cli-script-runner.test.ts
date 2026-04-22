import { describe, expect, it } from "vitest";
import {
	runCommand,
	runShellScript,
	ScriptRunner,
	withProgressSpinner,
	withSpinner,
} from "../cli/script-runner.js";

describe("runCommand", () => {
	it("returns stdout and exitCode 0 for echo", async () => {
		const result = await runCommand("echo", ["hello"]);
		expect(result.stdout).toContain("hello");
		expect(result.exitCode).toBe(0);
	});

	it("returns non-zero exitCode for a failing command", async () => {
		const result = await runCommand("false");
		expect(result.exitCode).not.toBe(0);
	});
});

describe("runShellScript", () => {
	it("runs a shell script and returns stdout", async () => {
		const out = await runShellScript("echo shell-ok");
		expect(out).toContain("shell-ok");
	});
});

describe("withSpinner", () => {
	it("returns the task result", async () => {
		const result = await withSpinner("working", async () => 42);
		expect(result).toBe(42);
	});

	it("propagates task errors", async () => {
		await expect(
			withSpinner("failing", async () => {
				throw new Error("task-error");
			}),
		).rejects.toThrow("task-error");
	});
});

describe("ScriptRunner class", () => {
	it("instantiates successfully", () => {
		const runner = new ScriptRunner();
		expect(runner).toBeDefined();
		expect(typeof runner.zxShell).toBe("function");
	});

	it("runCommand via class returns exitCode 0", async () => {
		const runner = new ScriptRunner();
		const result = await runner.runCommand("echo", ["class-test"]);
		expect(result.stdout).toContain("class-test");
		expect(result.exitCode).toBe(0);
	});

	it("withSpinner via class returns result", async () => {
		const runner = new ScriptRunner();
		const result = await runner.withSpinner("test", async () => "done");
		expect(result).toBe("done");
	});

	it("withProgressSpinner via class returns result and passes update callback", async () => {
		const runner = new ScriptRunner();
		const updates: string[] = [];
		const result = await runner.withProgressSpinner("task", async (update) => {
			update("progress-1");
			updates.push("recorded");
			return "class-done";
		});
		expect(result).toBe("class-done");
		expect(updates).toEqual(["recorded"]);
	});
});

describe("withProgressSpinner", () => {
	it("returns task result", async () => {
		const result = await withProgressSpinner("working", async (_update) => 42);
		expect(result).toBe(42);
	});

	it("passes an update callback to the task", async () => {
		const callCount = { n: 0 };
		const result = await withProgressSpinner("working", async (update) => {
			update("step 1");
			callCount.n++;
			update("step 2");
			callCount.n++;
			return "ok";
		});
		expect(result).toBe("ok");
		expect(callCount.n).toBe(2);
	});

	it("propagates task errors", async () => {
		await expect(
			withProgressSpinner("failing", async () => {
				throw new Error("progress-error");
			}),
		).rejects.toThrow("progress-error");
	});
});
