/**
 * Concrete LLM lane executor.
 *
 * Binds the Vercel AI SDK (generateText/streamText), Anthropic, OpenAI,
 * and gpt-tokenizer into a unified LaneExecutor that the orchestration
 * runtime can invoke without caring which provider is backing a tier.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateText, type LanguageModel, streamText } from "ai";
import { encode, encodeChat } from "gpt-tokenizer";
import {
	loadOrchestrationConfig,
	type PhysicalModel,
} from "../config/orchestration-config.js";
import type {
	LlmResponsePayload,
	LlmTokenUsage,
} from "../contracts/llm-types.js";

// Re-export so consumers of this module get the payload type without a second import
export type { LlmResponsePayload };

import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { orderedModelIdsForClass } from "../models/model-class-defaults.js";

export type ModelTier = "free" | "cheap" | "strong" | "reviewer";
export type TokenAccountingTarget = ModelTier | PhysicalModel["provider"];

// Re-export so consumers can reference the stream helper without importing ai directly
export { streamText };

const LLM_STUB_PREFIX = "[LLM response stub";
const UTF8_TEXT_ENCODER = new TextEncoder();
const ANTHROPIC_ESTIMATED_BYTES_PER_TOKEN = 3;
const OPENAI_CHAT_MESSAGE_OVERHEAD_TOKENS = 3;
const OPENAI_CHAT_REPLY_PRIMING_TOKENS = 3;
const ANTHROPIC_CHAT_MESSAGE_OVERHEAD_TOKENS = 4;
const ANTHROPIC_CHAT_REPLY_PRIMING_TOKENS = 3;
type ProviderEnvironmentVariable =
	| "OPENAI_API_KEY"
	| "ANTHROPIC_API_KEY"
	| "GOOGLE_GENERATIVE_AI_API_KEY"
	| "XAI_API_KEY"
	| "MISTRAL_API_KEY"
	| "";

/**
 * Formats the deterministic fallback text returned when the executor cannot
 * make a live provider call.
 */
function createStubResponse(detail: string): string {
	return `${LLM_STUB_PREFIX} — ${detail}]`;
}

function isProviderTarget(
	target: TokenAccountingTarget,
): target is PhysicalModel["provider"] {
	return target === "openai" || target === "anthropic";
}

function resolveTokenAccountingTarget(target: TokenAccountingTarget = "free"): {
	provider: PhysicalModel["provider"];
	modelId?: string;
} {
	if (isProviderTarget(target)) {
		return { provider: target };
	}

	const model = resolveTierPhysicalModel(target);
	return {
		provider: model.provider,
		modelId: model.id,
	};
}

/**
 * Returns the configured physical model for a given tier.
 *
 * Model IDs come from the current orchestration config and its derived
 * class/capability ordering rather than from hardcoded tier constants.
 */
function resolveTierPhysicalModel(tier: ModelTier): PhysicalModel {
	const config = loadOrchestrationConfig();
	const modelsById = new Map(
		Object.values(config.models).map((model) => [model.id, model]),
	);

	for (const modelId of orderedModelIdsForClass(tier, config)) {
		const model = modelsById.get(modelId);
		if (model) {
			return model;
		}
	}

	const fallbackModel = Object.values(config.models)[0];
	if (fallbackModel) {
		return fallbackModel;
	}

	throw new Error(`No configured physical model available for tier: ${tier}`);
}

function resolvePhysicalModelById(modelId: string): PhysicalModel {
	const config = loadOrchestrationConfig();
	const configuredModel =
		Object.values(config.models).find((model) => model.id === modelId) ??
		config.models[modelId];
	if (!configuredModel) {
		throw new Error(
			`No configured physical model available for id: ${modelId}`,
		);
	}
	return configuredModel;
}

function providerApiKeyEnvironmentVariable(
	provider: PhysicalModel["provider"],
): ProviderEnvironmentVariable {
	switch (provider) {
		case "openai":
			return "OPENAI_API_KEY";
		case "anthropic":
			return "ANTHROPIC_API_KEY";
		case "google":
			return "GOOGLE_GENERATIVE_AI_API_KEY";
		case "xai":
			return "XAI_API_KEY";
		case "mistral":
			return "MISTRAL_API_KEY";
		case "other":
			return "";
	}
}

function readProviderApiKey(
	provider: PhysicalModel["provider"],
): string | undefined {
	const key = process.env[providerApiKeyEnvironmentVariable(provider)];
	if (typeof key !== "string") {
		return undefined;
	}

	const trimmedKey = key.trim();
	return trimmedKey.length > 0 ? trimmedKey : undefined;
}

export function resolveModel(tier: ModelTier): LanguageModel {
	// @ai-sdk/anthropic and @ai-sdk/openai@1.x return LanguageModelV1 while
	// ai@6 expects LanguageModelV2/V3. The runtime shape is compatible; the
	// cast bridges the version gap until the provider packages ship V3 types.
	const model = resolveTierPhysicalModel(tier);

	return resolveLanguageModel(model);
}

function resolveLanguageModel(model: PhysicalModel): LanguageModel {
	switch (model.provider) {
		case "openai":
			return openai(model.id) as unknown as LanguageModel;
		case "anthropic":
			return anthropic(model.id) as unknown as LanguageModel;
		case "google":
		case "xai":
		case "mistral":
		case "other":
			throw new Error(
				`Provider "${model.provider}" is not yet supported by the built-in executor. ` +
					`Configure an openai- or anthropic-compatible endpoint instead.`,
			);
	}
}

/** Returns the model ID string for a given tier (useful for logging / tests). */
export function resolveModelId(tier: ModelTier): string {
	return resolveTierPhysicalModel(tier).id;
}

function resolveExecutionTarget(tier: ModelTier): {
	model: PhysicalModel;
	modelId: string;
	provider: PhysicalModel["provider"];
	hasApiKey: boolean;
} {
	const model = resolveTierPhysicalModel(tier);
	return {
		model,
		modelId: model.id,
		provider: model.provider,
		hasApiKey: readProviderApiKey(model.provider) !== undefined,
	};
}

function resolveExecutionTargetByModelId(modelId: string): {
	model: PhysicalModel;
	modelId: string;
	provider: PhysicalModel["provider"];
	hasApiKey: boolean;
} {
	const model = resolvePhysicalModelById(modelId);
	return {
		model,
		modelId: model.id,
		provider: model.provider,
		hasApiKey: readProviderApiKey(model.provider) !== undefined,
	};
}

function normalizeTokenUsage(
	prompt: string,
	responseText: string,
	target: TokenAccountingTarget,
	usage?: {
		inputTokens?: number | undefined;
		outputTokens?: number | undefined;
		totalTokens?: number | undefined;
	},
): LlmTokenUsage {
	const inputTokens = usage?.inputTokens ?? estimateTokens(prompt, target);
	const outputTokens =
		usage?.outputTokens ?? estimateTokens(responseText, target);
	return {
		inputTokens,
		outputTokens,
		totalTokens: usage?.totalTokens ?? inputTokens + outputTokens,
	};
}

function estimateOpenAiTextTokens(text: string): number {
	return encode(text).length;
}

function estimateAnthropicTextTokens(text: string): number {
	if (text.length === 0) {
		return 0;
	}

	return Math.ceil(
		UTF8_TEXT_ENCODER.encode(text).length / ANTHROPIC_ESTIMATED_BYTES_PER_TOKEN,
	);
}

function estimateOpenAiChatTokens(
	messages: Array<{ role: string; content: string }>,
	modelId?: string,
): number {
	const typed = messages as Parameters<typeof encodeChat>[0];
	if (modelId) {
		try {
			return encodeChat(typed, modelId as Parameters<typeof encodeChat>[1])
				.length;
		} catch {
			// Newer OpenAI IDs (for example GPT-5.x / GPT-4.1) are not recognised by
			// gpt-tokenizer's chat helper yet. Fall back to per-field tokenisation plus
			// chat framing overhead rather than forcing an unrelated GPT chat model.
		}
	}

	return messages.reduce(
		(total, message) =>
			total +
			OPENAI_CHAT_MESSAGE_OVERHEAD_TOKENS +
			estimateOpenAiTextTokens(message.role) +
			estimateOpenAiTextTokens(message.content),
		OPENAI_CHAT_REPLY_PRIMING_TOKENS,
	);
}

function estimateAnthropicChatTokens(
	messages: Array<{ role: string; content: string }>,
): number {
	return messages.reduce(
		(total, message) =>
			total +
			ANTHROPIC_CHAT_MESSAGE_OVERHEAD_TOKENS +
			estimateAnthropicTextTokens(message.role) +
			estimateAnthropicTextTokens(message.content),
		ANTHROPIC_CHAT_REPLY_PRIMING_TOKENS,
	);
}

/**
 * Counts tokens for a plain-text string using provider-aware accounting derived
 * from the resolved lane target instead of a hard-coded GPT tokenizer path.
 */
export function estimateTokens(
	text: string,
	target: TokenAccountingTarget = "free",
): number {
	const resolvedTarget = resolveTokenAccountingTarget(target);

	switch (resolvedTarget.provider) {
		case "openai":
		case "xai":
		case "mistral":
			return estimateOpenAiTextTokens(text);
		case "anthropic":
		case "google":
		case "other":
			return estimateAnthropicTextTokens(text);
	}
}

/**
 * Returns true when `text` fits within `limit` tokens for the resolved provider.
 */
export function isWithinBudget(
	text: string,
	limit: number,
	target: TokenAccountingTarget = "free",
): boolean {
	return estimateTokens(text, target) <= limit;
}

/**
 * Counts tokens for a chat message array (role + content pairs) using the
 * resolved provider/model when available.
 */
export function estimateChatTokens(
	messages: Array<{ role: string; content: string }>,
	target: TokenAccountingTarget = "free",
): number {
	const resolvedTarget = resolveTokenAccountingTarget(target);

	switch (resolvedTarget.provider) {
		case "openai":
		case "xai":
		case "mistral":
			return estimateOpenAiChatTokens(messages, resolvedTarget.modelId);
		case "anthropic":
		case "google":
		case "other":
			return estimateAnthropicChatTokens(messages);
	}
}

/**
 * Executes a single-turn text generation request against the resolved model.
 *
 * Missing provider keys and provider-call failures both return deterministic
 * stub text so the pipeline can continue without throwing. Real calls are only
 * attempted when the appropriate environment variable is present.
 */
export async function execute(
	prompt: string,
	tier: ModelTier,
): Promise<string> {
	const { hasApiKey } = resolveExecutionTarget(tier);

	if (!hasApiKey) {
		return createStubResponse("API key not configured");
	}

	try {
		const model = resolveModel(tier);
		const result = await generateText({ model, prompt });
		return result.text;
	} catch (err) {
		const message = toErrorMessage(err);
		// Surface rate-limit / quota errors distinctly for easier diagnosis
		if (
			message.includes("rate") ||
			message.includes("quota") ||
			message.includes("429")
		) {
			return createStubResponse(`rate limit or quota exceeded: ${message}`);
		}
		return createStubResponse(`API call failed: ${message}`);
	}
}

export async function executeModelId(
	prompt: string,
	modelId: string,
): Promise<string> {
	const { hasApiKey, model } = resolveExecutionTargetByModelId(modelId);

	if (!hasApiKey) {
		return createStubResponse("API key not configured");
	}

	try {
		const result = await generateText({
			model: resolveLanguageModel(model),
			prompt,
		});
		return result.text;
	} catch (err) {
		const message = toErrorMessage(err);
		if (
			message.includes("rate") ||
			message.includes("quota") ||
			message.includes("429")
		) {
			return createStubResponse(`rate limit or quota exceeded: ${message}`);
		}
		return createStubResponse(`API call failed: ${message}`);
	}
}

/**
 * Typed variant of `execute()` — returns a structured `LlmResponsePayload`
 * instead of a plain string.
 *
 * Callers can switch on `payload.kind` rather than parsing stub prefixes:
 *
 * ```ts
 * const payload = await executeTyped("Summarise X", "cheap");
 * if (isLlmSuccess(payload)) { use(payload.text); }
 * ```
 *
 * `execute()` is kept for backward compatibility; new call sites should
 * prefer this function.
 */
export async function executeTyped(
	prompt: string,
	tier: ModelTier,
): Promise<LlmResponsePayload> {
	const { modelId, provider, hasApiKey } = resolveExecutionTarget(tier);

	if (!hasApiKey) {
		return {
			kind: "stub",
			text: createStubResponse("API key not configured"),
			tier,
			modelId,
			provider,
		};
	}

	const start = Date.now();
	try {
		const model = resolveModel(tier);
		const result = await generateText({ model, prompt });
		const usage =
			"usage" in result && typeof result.usage === "object"
				? result.usage
				: undefined;
		return {
			kind: "success",
			text: result.text,
			tier,
			modelId,
			provider,
			durationMs: Date.now() - start,
			usage: normalizeTokenUsage(prompt, result.text, tier, usage),
		};
	} catch (err) {
		const message = toErrorMessage(err);
		const durationMs = Date.now() - start;
		if (
			message.includes("rate") ||
			message.includes("quota") ||
			message.includes("429")
		) {
			return {
				kind: "rate-limited",
				text: createStubResponse(`rate limit or quota exceeded: ${message}`),
				tier,
				modelId,
				provider,
				durationMs,
			};
		}
		return {
			kind: "api-error",
			text: createStubResponse(`API call failed: ${message}`),
			tier,
			modelId,
			provider,
			durationMs,
		};
	}
}

/** Convenience class that bundles all helpers behind a single instance. */
export class LlmLaneExecutor {
	resolveModel(tier: ModelTier) {
		return resolveModel(tier);
	}

	resolveModelId(tier: ModelTier): string {
		return resolveModelId(tier);
	}
	estimateTokens(text: string, target?: TokenAccountingTarget): number {
		return estimateTokens(text, target);
	}

	isWithinBudget(
		text: string,
		limit: number,
		target?: TokenAccountingTarget,
	): boolean {
		return isWithinBudget(text, limit, target);
	}

	estimateChatTokens(
		messages: Array<{ role: string; content: string }>,
		target?: TokenAccountingTarget,
	): number {
		return estimateChatTokens(messages, target);
	}

	execute(prompt: string, tier: ModelTier): Promise<string> {
		return execute(prompt, tier);
	}

	executeModelId(prompt: string, modelId: string): Promise<string> {
		return executeModelId(prompt, modelId);
	}

	executeTyped(prompt: string, tier: ModelTier): Promise<LlmResponsePayload> {
		return executeTyped(prompt, tier);
	}
}
