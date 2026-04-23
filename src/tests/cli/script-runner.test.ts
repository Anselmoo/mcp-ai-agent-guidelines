import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@inquirer/prompts", () => ({
	input: vi.fn(),
	select: vi.fn(),
	confirm: vi.fn(),
}));

import { confirm, input, select } from "@inquirer/prompts";
import {
	promptForConfirmation,
	promptForInput,
	promptForSelection,
	withProgressSpinner,
	withSpinner,
} from "../../cli/script-runner.js";

afterEach(() => {
	vi.clearAllMocks();
});

describe("script-runner prompts", () => {
	it("returns interactive prompt values when the prompt succeeds", async () => {
		vi.mocked(input).mockResolvedValue("typed");
		vi.mocked(select).mockResolvedValue("review");
		vi.mocked(confirm).mockResolvedValue(true);

		await expect(promptForInput("Project name", "fallback")).resolves.toBe(
			"typed",
		);
		await expect(
			promptForSelection("Choose instruction", ["review", "implement"]),
		).resolves.toBe("review");
		await expect(promptForConfirmation("Continue?")).resolves.toBe(true);
	});

	it("falls back to default values when prompts reject", async () => {
		vi.mocked(input).mockRejectedValue(new Error("non-tty"));
		vi.mocked(select).mockRejectedValue(new Error("non-tty"));
		vi.mocked(confirm).mockRejectedValue(new Error("non-tty"));

		await expect(promptForInput("Project name", "fallback")).resolves.toBe(
			"fallback",
		);
		await expect(
			promptForSelection("Choose instruction", ["review", "implement"]),
		).resolves.toBe("review");
		await expect(promptForConfirmation("Continue?")).resolves.toBe(false);
	});
});

describe("withSpinner", () => {
	it("runs the task and returns the result", async () => {
		await expect(withSpinner("msg", () => Promise.resolve(42))).resolves.toBe(
			42,
		);
	});

	it("re-throws task errors", async () => {
		await expect(
			withSpinner("msg", () => Promise.reject(new Error("boom"))),
		).rejects.toThrow("boom");
	});
});

describe("withProgressSpinner", () => {
	it("passes an update callback and returns the result (non-TTY path)", async () => {
		const result = await withProgressSpinner("msg", async (update) => {
			update("step 1");
			update("step 2");
			return "done";
		});
		expect(result).toBe("done");
	});

	it("re-throws task errors", async () => {
		await expect(
			withProgressSpinner("msg", () => Promise.reject(new Error("fail"))),
		).rejects.toThrow("fail");
	});
});
