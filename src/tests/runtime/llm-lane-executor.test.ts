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
	executeModelId,
	executeTyped,
	isWithinBudget,
	LlmLaneExecutor,
	resolveModel,
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

	it("returns a model id for reviewer tier via synthesis fallback", () => {
		// reviewer falls back to synthesis/strong tier — just assert it resolves to a non-empty string
		const id = resolveModelId("reviewer");
		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThan(0);
	});
});

describe("resolveModel", () => {
	it("resolves an anthropic-backed model for the cheap tier", () => {
		expect(resolveModel("cheap")).toBeDefined();
	});

	it.each([
		"google",
		"xai",
		"mistral",
		"other",
	] as const)('throws for unsupported provider "%s"', (provider) => {
		const config = createDefaultOrchestrationConfig();
		config.models.free_primary = {
			id: `${provider}-model`,
			provider,
			available: true,
			context_window: 128_000,
		};
		config.capabilities.cost_sensitive = ["free_primary"];
		const configSpy = vi
			.spyOn(orchestrationConfig, "loadOrchestrationConfig")
			.mockReturnValue(config);

		try {
			expect(() => resolveModel("free")).toThrow(
				`Provider "${provider}" is not yet supported`,
			);
		} finally {
			configSpy.mockRestore();
		}
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

// ─── executeModelId ──────────────────────────────────────────────────────────

describe("executeModelId", () => {
	it("returns stub when API key is not configured for the model", async () => {
		const saved = process.env.OPENAI_API_KEY;
		delete process.env.OPENAI_API_KEY;

		const result = await executeModelId("Some prompt", "gpt-4.1");

		expect(result).toContain("[LLM response stub");
		expect(result).toContain("API key not configured");

		if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
	});

	it("throws when model ID is not in config", async () => {
		await expect(
			executeModelId("prompt", "nonexistent-model-xyz"),
		).rejects.toThrow("nonexistent-model-xyz");
	});

	it("returns stub string type", async () => {
		const saved = process.env.OPENAI_API_KEY;
		delete process.env.OPENAI_API_KEY;

		const result = await executeModelId("ping", "gpt-4.1");
		expect(typeof result).toBe("string");

		if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
	});
});

// ─── estimateTokens with provider targets ────────────────────────────────────

describe("estimateTokens with provider targets", () => {
	it("returns positive tokens for 'openai' provider target", () => {
		expect(estimateTokens("test sentence", "openai")).toBeGreaterThan(0);
	});

	it("returns positive tokens for 'anthropic' provider target", () => {
		expect(estimateTokens("test sentence", "anthropic")).toBeGreaterThan(0);
	});

	it("returns 0 for empty string with openai target", () => {
		expect(estimateTokens("", "openai")).toBe(0);
	});

	it("returns 0 for empty string with anthropic target", () => {
		expect(estimateTokens("", "anthropic")).toBe(0);
	});
});

// ─── error handling branches in execute/executeTyped ─────────────────────────

describe("execute and executeTyped error handling", () => {
	it("execute returns rate-limit stub on rate error", async () => {
		const savedKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "test-key";
		vi.resetModules();
		vi.doMock("ai", () => ({
			generateText: vi.fn(async () => {
				throw new Error("rate limit exceeded 429");
			}),
			streamText: vi.fn(),
		}));
		try {
			const { execute: exec } = await import(
				"../../runtime/llm-lane-executor.js"
			);
			const result = await exec("prompt", "free");
			expect(result).toContain("rate limit or quota exceeded");
		} finally {
			vi.doUnmock("ai");
			vi.resetModules();
			if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedKey;
		}
	});

	it("execute returns api-error stub on generic error", async () => {
		const savedKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "test-key";
		vi.resetModules();
		vi.doMock("ai", () => ({
			generateText: vi.fn(async () => {
				throw new Error("network timeout");
			}),
			streamText: vi.fn(),
		}));
		try {
			const { execute: exec } = await import(
				"../../runtime/llm-lane-executor.js"
			);
			const result = await exec("prompt", "free");
			expect(result).toContain("API call failed");
		} finally {
			vi.doUnmock("ai");
			vi.resetModules();
			if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedKey;
		}
	});

	it("executeTyped returns kind=rate-limited on rate error", async () => {
		const savedKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "test-key";
		vi.resetModules();
		vi.doMock("ai", () => ({
			generateText: vi.fn(async () => {
				throw new Error("quota exceeded");
			}),
			streamText: vi.fn(),
		}));
		try {
			const { executeTyped: execTyped } = await import(
				"../../runtime/llm-lane-executor.js"
			);
			const payload = await execTyped("prompt", "free");
			expect(payload.kind).toBe("rate-limited");
			expect(typeof payload.durationMs).toBe("number");
		} finally {
			vi.doUnmock("ai");
			vi.resetModules();
			if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedKey;
		}
	});

	it("executeTyped returns kind=api-error on generic error", async () => {
		const savedKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "test-key";
		vi.resetModules();
		vi.doMock("ai", () => ({
			generateText: vi.fn(async () => {
				throw new Error("connection refused");
			}),
			streamText: vi.fn(),
		}));
		try {
			const { executeTyped: execTyped } = await import(
				"../../runtime/llm-lane-executor.js"
			);
			const payload = await execTyped("prompt", "free");
			expect(payload.kind).toBe("api-error");
			expect(typeof payload.durationMs).toBe("number");
		} finally {
			vi.doUnmock("ai");
			vi.resetModules();
			if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedKey;
		}
	});

	it("executeModelId returns rate-limit stub on rate error", async () => {
		const savedKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "test-key";
		vi.resetModules();
		vi.doMock("ai", () => ({
			generateText: vi.fn(async () => {
				throw new Error("429 rate limit");
			}),
			streamText: vi.fn(),
		}));
		try {
			const { executeModelId: execById } = await import(
				"../../runtime/llm-lane-executor.js"
			);
			const result = await execById("prompt", "gpt-4.1");
			expect(result).toContain("rate limit or quota exceeded");
		} finally {
			vi.doUnmock("ai");
			vi.resetModules();
			if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedKey;
		}
	});

	it("executeModelId returns api-error stub on generic error", async () => {
		const savedKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "test-key";
		vi.resetModules();
		vi.doMock("ai", () => ({
			generateText: vi.fn(async () => {
				throw new Error("timeout");
			}),
			streamText: vi.fn(),
		}));
		try {
			const { executeModelId: execById } = await import(
				"../../runtime/llm-lane-executor.js"
			);
			const result = await execById("prompt", "gpt-4.1");
			expect(result).toContain("API call failed");
		} finally {
			vi.doUnmock("ai");
			vi.resetModules();
			if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedKey;
		}
	});

	it("execute on success with no usage field still returns text", async () => {
		const savedKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "test-key";
		vi.resetModules();
		vi.doMock("ai", () => ({
			generateText: vi.fn(async () => ({ text: "response text" })),
			streamText: vi.fn(),
		}));
		try {
			const { execute: exec } = await import(
				"../../runtime/llm-lane-executor.js"
			);
			const result = await exec("prompt", "free");
			expect(result).toBe("response text");
		} finally {
			vi.doUnmock("ai");
			vi.resetModules();
			if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedKey;
		}
	});

	it("treats whitespace-only provider API keys as missing", async () => {
		const savedKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "   ";

		try {
			await expect(execute("prompt", "free")).resolves.toContain(
				"API key not configured",
			);
		} finally {
			if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedKey;
		}
	});

	it("executeTyped derives token usage when the provider result has a non-object usage field", async () => {
		const savedKey = process.env.OPENAI_API_KEY;
		process.env.OPENAI_API_KEY = "test-key";
		vi.resetModules();
		vi.doMock("ai", () => ({
			generateText: vi.fn(async () => ({
				text: "derived usage response",
				usage: "unexpected",
			})),
			streamText: vi.fn(),
		}));

		try {
			const { executeTyped: execTyped } = await import(
				"../../runtime/llm-lane-executor.js"
			);
			const payload = await execTyped("derive usage", "free");

			expect(payload.kind).toBe("success");
			expect(payload.usage).toBeDefined();
			expect(payload.usage?.inputTokens).toBeGreaterThan(0);
			expect(payload.usage?.outputTokens).toBeGreaterThan(0);
			expect(payload.usage?.totalTokens).toBe(
				(payload.usage?.inputTokens ?? 0) + (payload.usage?.outputTokens ?? 0),
			);
		} finally {
			vi.doUnmock("ai");
			vi.resetModules();
			if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
			else process.env.OPENAI_API_KEY = savedKey;
		}
	});

	it.each([
		["google", "free"],
		["xai", "free"],
		["mistral", "free"],
		["other", "free"],
	] as const)("treats missing %s provider credentials as an unconfigured API key", async (provider, tier) => {
		const config = createDefaultOrchestrationConfig();
		config.models.free_primary = {
			id: `${provider}-model`,
			provider,
			available: true,
			context_window: 128_000,
		};
		config.capabilities.cost_sensitive = ["free_primary"];
		const configSpy = vi
			.spyOn(orchestrationConfig, "loadOrchestrationConfig")
			.mockReturnValue(config);

		try {
			const payload = await executeTyped("provider env", tier);
			expect(payload.kind).toBe("stub");
			expect(payload.text).toContain("API key not configured");
			expect(payload.provider).toBe(provider);
		} finally {
			configSpy.mockRestore();
		}
	});
});

// ─── estimateChatTokens with explicit provider targets ───────────────────────

describe("estimateChatTokens with explicit targets", () => {
	const messages = [{ role: "user", content: "hello world" }];

	it("uses OpenAI tokenizer for openai target", () => {
		const count = estimateChatTokens(messages, "openai");
		expect(count).toBeGreaterThan(0);
	});

	it("uses Anthropic estimator for anthropic target", () => {
		const count = estimateChatTokens(messages, "anthropic");
		expect(count).toBeGreaterThan(0);
	});

	it("falls back to Anthropic for 'strong' tier when mocked to anthropic provider", () => {
		const config = createDefaultOrchestrationConfig();
		config.models.strong_primary = {
			id: "claude-opus-4",
			provider: "anthropic",
			available: true,
			context_window: 200_000,
		};
		const configSpy = vi
			.spyOn(orchestrationConfig, "loadOrchestrationConfig")
			.mockReturnValue(config);
		try {
			expect(estimateChatTokens(messages, "strong")).toBeGreaterThan(0);
		} finally {
			configSpy.mockRestore();
		}
	});
});
