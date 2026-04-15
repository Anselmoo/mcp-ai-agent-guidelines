/**
 * llm-lane-executor.test.ts
 *
 * Unit tests for LlmLaneExecutor.
 * No real network calls are made — execute() returns a stub when API keys
 * are absent, which is always the case in CI.
 */

import { describe, expect, it, vi } from "vitest";
import * as orchestrationConfig from "../../config/orchestration-config.js";
import { createDefaultOrchestrationConfig } from "../../config/orchestration-config.js";
import {
	estimateChatTokens,
	estimateTokens,
	execute,
	executeTyped,
	isWithinBudget,
	LlmLaneExecutor,
	resolveModelId,
} from "../../runtime/llm-lane-executor.js";

describe("estimateTokens", () => {
	it("returns a positive number for non-empty text", () => {
		const count = estimateTokens("Hello, world!");
		expect(count).toBeGreaterThan(0);
	});

	it("returns 0 for empty string", () => {
		expect(estimateTokens("")).toBe(0);
	});

	it("returns more tokens for longer text", () => {
		const short = estimateTokens("hi");
		const long = estimateTokens(
			"This is a much longer sentence with many words.",
		);
		expect(long).toBeGreaterThan(short);
	});

	it("derives plain-text token accounting from the resolved provider", () => {
		const config = createDefaultOrchestrationConfig();
		config.models.free_primary = {
			id: "gpt-5.1-mini",
			provider: "anthropic",
			available: true,
			context_window: 128_000,
		};
		const configSpy = vi
			.spyOn(orchestrationConfig, "loadOrchestrationConfig")
			.mockReturnValue(config);
		const text = "x".repeat(90);

		try {
			expect(estimateTokens(text, "free")).toBe(
				estimateTokens(text, "anthropic"),
			);
			expect(estimateTokens(text, "free")).not.toBe(
				estimateTokens(text, "openai"),
			);
		} finally {
			configSpy.mockRestore();
		}
	});
});

describe("isWithinBudget", () => {
	it("returns true for short text with a high limit", () => {
		expect(isWithinBudget("hello", 100)).toBe(true);
	});

	it("returns false when token count exceeds limit", () => {
		const longText = "word ".repeat(200);
		expect(isWithinBudget(longText, 10)).toBe(false);
	});
});

describe("resolveModelId", () => {
	it("returns gpt-4.1 for free tier", () => {
		expect(resolveModelId("free")).toBe("gpt-4.1");
	});

	it("returns claude-haiku-4-5 for cheap tier from orchestration defaults", () => {
		expect(resolveModelId("cheap")).toBe("claude-haiku-4-5");
	});

	it("returns gpt-5-4 for strong tier", () => {
		expect(resolveModelId("strong")).toBe("gpt-5-4");
	});

	it("returns claude-sonnet-4-6 for reviewer tier via synthesis fallback", () => {
		expect(resolveModelId("reviewer")).toBe("claude-sonnet-4-6");
	});
});

describe("estimateChatTokens", () => {
	it("returns a positive number for a chat message array", () => {
		const messages = [
			{ role: "user", content: "Hello, how are you?" },
			{ role: "assistant", content: "I am doing well, thank you!" },
		];
		expect(estimateChatTokens(messages)).toBeGreaterThan(0);
	});

	it("derives chat token accounting from the resolved provider", () => {
		const config = createDefaultOrchestrationConfig();
		config.models.free_primary = {
			id: "gpt-5.1-mini",
			provider: "anthropic",
			available: true,
			context_window: 128_000,
		};
		const configSpy = vi
			.spyOn(orchestrationConfig, "loadOrchestrationConfig")
			.mockReturnValue(config);
		const messages = [
			{ role: "user", content: "Summarise the deployment plan." },
			{ role: "assistant", content: "I can do that." },
		];

		try {
			expect(estimateChatTokens(messages, "free")).toBe(
				estimateChatTokens(messages, "anthropic"),
			);
			expect(estimateChatTokens(messages, "free")).not.toBe(
				estimateChatTokens(messages, "openai"),
			);
		} finally {
			configSpy.mockRestore();
		}
	});
});

describe("execute", () => {
	it("returns a string (stub when no API key)", async () => {
		const result = await execute("Say hello", "free");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("returns stub string when OPENAI_API_KEY is absent", async () => {
		const saved = process.env.OPENAI_API_KEY;
		delete process.env.OPENAI_API_KEY;
		const result = await execute("Test prompt", "strong");
		expect(result).toBe("[LLM response stub — API key not configured]");
		if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
	});

	it("returns stub string when ANTHROPIC_API_KEY is absent", async () => {
		const saved = process.env.ANTHROPIC_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;
		const result = await execute("Test prompt", "cheap");
		expect(result).toBe("[LLM response stub — API key not configured]");
		if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
	});
});

describe("LlmLaneExecutor class", () => {
	const executor = new LlmLaneExecutor();

	it("estimateTokens returns positive number", () => {
		expect(executor.estimateTokens("test input")).toBeGreaterThan(0);
	});

	it("isWithinBudget returns true for short text", () => {
		expect(executor.isWithinBudget("short", 50)).toBe(true);
	});

	it("estimateChatTokens accepts an explicit provider target", () => {
		expect(
			executor.estimateChatTokens(
				[{ role: "user", content: "Count these tokens." }],
				"anthropic",
			),
		).toBeGreaterThan(0);
	});

	it("resolveModelId matches free tier", () => {
		expect(executor.resolveModelId("free")).toBe("gpt-4.1");
	});

	it("execute returns a string", async () => {
		const result = await executor.execute("ping", "free");
		expect(typeof result).toBe("string");
	});

	it("executeTyped returns an LlmResponsePayload with a kind field", async () => {
		const payload = await executor.executeTyped("ping", "free");
		expect(["success", "stub", "rate-limited", "api-error"]).toContain(
			payload.kind,
		);
		expect(typeof payload.text).toBe("string");
		expect(typeof payload.modelId).toBe("string");
		expect(["openai", "anthropic"]).toContain(payload.provider);
	});
});

// ─── W2 #73 – executeTyped ───────────────────────────────────────────────────

describe("executeTyped", () => {
	it("returns kind='stub' and no durationMs when no OPENAI_API_KEY for free tier", async () => {
		const saved = process.env.OPENAI_API_KEY;
		delete process.env.OPENAI_API_KEY;

		const payload = await executeTyped("Test prompt", "free");

		expect(payload.kind).toBe("stub");
		expect(payload.tier).toBe("free");
		expect(payload.durationMs).toBeUndefined();
		expect(payload.text).toContain("API key not configured");

		if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
	});

	it("returns kind='stub' and no durationMs when no ANTHROPIC_API_KEY for cheap tier", async () => {
		const saved = process.env.ANTHROPIC_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;

		const payload = await executeTyped("Test prompt", "cheap");

		expect(payload.kind).toBe("stub");
		expect(payload.tier).toBe("cheap");
		expect(payload.durationMs).toBeUndefined();

		if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
	});

	it("resolves the correct modelId for the given tier", async () => {
		const saved = process.env.OPENAI_API_KEY;
		delete process.env.OPENAI_API_KEY;

		const payload = await executeTyped("ping", "free");
		expect(payload.modelId).toBe(resolveModelId("free"));

		if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
	});

	it("payload always has text, tier, and modelId fields", async () => {
		const saved = process.env.OPENAI_API_KEY;
		delete process.env.OPENAI_API_KEY;

		const payload = await executeTyped("Test", "strong");
		expect(typeof payload.text).toBe("string");
		expect(payload.text.length).toBeGreaterThan(0);
		expect(payload.tier).toBe("strong");
		expect(typeof payload.modelId).toBe("string");

		if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
	});

	it("uses the resolved provider instead of tier heuristics for execute", async () => {
		const config = createDefaultOrchestrationConfig();
		config.models.cheap_primary = {
			id: "haiku",
			provider: "openai",
			available: true,
			context_window: 200_000,
		};
		config.capabilities.fast = ["cheap_primary"];
		const configSpy = vi
			.spyOn(orchestrationConfig, "loadOrchestrationConfig")
			.mockReturnValue(config);
		const savedOpenAiKey = process.env.OPENAI_API_KEY;
		const savedAnthropicKey = process.env.ANTHROPIC_API_KEY;
		delete process.env.OPENAI_API_KEY;
		process.env.ANTHROPIC_API_KEY = "anthropic-key";

		try {
			await expect(execute("Test prompt", "cheap")).resolves.toBe(
				"[LLM response stub — API key not configured]",
			);
		} finally {
			configSpy.mockRestore();
			if (savedOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedOpenAiKey;
			if (savedAnthropicKey === undefined) delete process.env.ANTHROPIC_API_KEY;
			else process.env.ANTHROPIC_API_KEY = savedAnthropicKey;
		}
	});

	it("uses the resolved provider instead of tier heuristics for executeTyped", async () => {
		const config = createDefaultOrchestrationConfig();
		config.models.free_primary = {
			id: "gpt-5.1-mini",
			provider: "anthropic",
			available: true,
			context_window: 128_000,
		};
		config.capabilities.cost_sensitive = ["free_primary"];
		const configSpy = vi
			.spyOn(orchestrationConfig, "loadOrchestrationConfig")
			.mockReturnValue(config);
		const savedOpenAiKey = process.env.OPENAI_API_KEY;
		const savedAnthropicKey = process.env.ANTHROPIC_API_KEY;
		process.env.OPENAI_API_KEY = "openai-key";
		delete process.env.ANTHROPIC_API_KEY;

		try {
			const payload = await executeTyped("Test prompt", "free");
			expect(payload.kind).toBe("stub");
			expect(payload.text).toContain("API key not configured");
			expect(payload.modelId).toBe("gpt-5.1-mini");
		} finally {
			configSpy.mockRestore();
			if (savedOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedOpenAiKey;
			if (savedAnthropicKey === undefined) delete process.env.ANTHROPIC_API_KEY;
			else process.env.ANTHROPIC_API_KEY = savedAnthropicKey;
		}
	});

	it("returns provider and token accounting metadata for successful calls", async () => {
		const savedOpenAiKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "openai-key";
		vi.resetModules();
		vi.doMock("ai", () => ({
			generateText: vi.fn(async () => ({
				text: "Provider response",
				usage: {
					inputTokens: 21,
					outputTokens: 8,
					totalTokens: 29,
				},
			})),
			streamText: vi.fn(),
		}));

		try {
			const { executeTyped: executeTypedWithAccounting } = await import(
				"../../runtime/llm-lane-executor.js"
			);
			const payload = await executeTypedWithAccounting(
				"Count these tokens.",
				"free",
			);

			expect(payload).toMatchObject({
				kind: "success",
				modelId: resolveModelId("free"),
				provider: "openai",
				usage: {
					inputTokens: 21,
					outputTokens: 8,
					totalTokens: 29,
				},
			});
		} finally {
			vi.doUnmock("ai");
			vi.resetModules();
			if (savedOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedOpenAiKey;
		}
	});
});
