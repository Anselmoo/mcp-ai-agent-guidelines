import { confirm, input, select } from "@inquirer/prompts";
import { execa, execaCommand } from "execa";
import ora from "ora";
import { $ } from "zx";

export async function runCommand(
	cmd: string,
	args?: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	try {
		const result = await execa(cmd, args ?? []);
		return {
			stdout: result.stdout,
			stderr: result.stderr,
			exitCode: typeof result.exitCode === "number" ? result.exitCode : 0,
		};
	} catch (err: unknown) {
		const e = err as { stdout?: string; stderr?: string; exitCode?: number };
		return {
			stdout: e.stdout ?? "",
			stderr: e.stderr ?? "",
			exitCode: typeof e.exitCode === "number" ? e.exitCode : 1,
		};
	}
}

export async function runShellScript(script: string): Promise<string> {
	const result = await execaCommand(script);
	return result.stdout;
}

export async function withSpinner<T>(
	message: string,
	task: () => Promise<T>,
): Promise<T> {
	let spinner: ReturnType<typeof ora> | null = null;
	try {
		spinner = ora(message).start();
	} catch {
		// non-TTY environment — continue without spinner
	}
	try {
		const result = await task();
		spinner?.succeed();
		return result;
	} catch (err) {
		spinner?.fail();
		throw err;
	}
}

/**
 * Like `withSpinner`, but exposes an `update(text)` callback to the task so it
 * can report incremental progress (e.g. per-file during a snapshot scan).
 *
 * On a real TTY the spinner label is updated on each call.
 * In CI / non-TTY environments (where `ora` can't spin) each `update()` call
 * writes a plain log line to stdout instead — safe for piped output.
 */
export async function withProgressSpinner<T>(
	message: string,
	task: (update: (text: string) => void) => Promise<T>,
): Promise<T> {
	const isInteractive = process.stdout.isTTY === true;
	const spinner = isInteractive ? ora(message).start() : null;

	const update = spinner
		? (text: string) => {
				spinner.text = text;
			}
		: (text: string) => {
				process.stdout.write(`${text}\n`);
			};

	try {
		const result = await task(update);
		spinner?.succeed(message);
		return result;
	} catch (err) {
		spinner?.fail(message);
		throw err;
	}
}

export async function promptForInput(
	message: string,
	defaultValue?: string,
): Promise<string> {
	try {
		return await input({ message, default: defaultValue });
	} catch {
		return defaultValue ?? "";
	}
}

export async function promptForSelection<T extends string>(
	message: string,
	choices: T[],
): Promise<T> {
	try {
		return await select<T>({
			message,
			choices: choices.map((c) => ({ value: c })),
		});
	} catch {
		return choices[0];
	}
}

export async function promptForConfirmation(message: string): Promise<boolean> {
	try {
		return await confirm({ message });
	} catch {
		return false;
	}
}

export class ScriptRunner {
	readonly zxShell = $;

	async runCommand(
		cmd: string,
		args?: string[],
	): Promise<{ stdout: string; stderr: string; exitCode: number }> {
		return runCommand(cmd, args);
	}

	async runShellScript(script: string): Promise<string> {
		return runShellScript(script);
	}

	async withSpinner<T>(message: string, task: () => Promise<T>): Promise<T> {
		return withSpinner(message, task);
	}

	async withProgressSpinner<T>(
		message: string,
		task: (update: (text: string) => void) => Promise<T>,
	): Promise<T> {
		return withProgressSpinner(message, task);
	}

	async promptForInput(
		message: string,
		defaultValue?: string,
	): Promise<string> {
		return promptForInput(message, defaultValue);
	}

	async promptForSelection<T extends string>(
		message: string,
		choices: T[],
	): Promise<T> {
		return promptForSelection(message, choices);
	}

	async promptForConfirmation(message: string): Promise<boolean> {
		return promptForConfirmation(message);
	}
}
