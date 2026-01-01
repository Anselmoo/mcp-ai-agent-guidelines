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

/**
 * Helper to set a custom Mermaid module provider for testing.
 * Uses the test-utils export which is designated for test-only usage.
 */
export async function withMermaidProvider(
	provider: (() => any) | null,
	fn: () => void | Promise<void>,
) {
	// Import from the designated test-utils location
	const { __setMermaidModuleProvider } = await import(
		"../../../src/tools/test-utils/mermaid.js"
	);
	__setMermaidModuleProvider(provider);
	try {
		return await fn();
	} finally {
		__setMermaidModuleProvider(null);
	}
}
