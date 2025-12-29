import { vi } from "vitest";

export function withFixedDate(dateStr: string, fn: () => void | Promise<void>) {
	vi.useFakeTimers();
	vi.setSystemTime(new Date(dateStr));
	try {
		return fn();
	} finally {
		vi.useRealTimers();
		vi.restoreAllMocks();
	}
}

export function stubMathRandom(val: number) {
	const spy = vi.spyOn(Math, "random").mockReturnValue(val);
	return () => spy.mockRestore();
}

export async function withMermaidProvider(
	provider: (() => any) | null,
	fn: () => void | Promise<void>,
) {
	const mod = await import("../../../src/tools/mermaid/validator.js");
	const set = (mod as any).__setMermaidModuleProvider;
	set(provider);
	try {
		return await fn();
	} finally {
		set(null);
	}
}
