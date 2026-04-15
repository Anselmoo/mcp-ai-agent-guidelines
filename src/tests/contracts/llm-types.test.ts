/**
 * llm-types.test.ts  — W2 #73
 *
 * Structural contract tests for src/contracts/llm-types.ts.
 * No live network calls; all values are constructed inline.
 */

import { describe, expect, it } from "vitest";
import type {
	LlmFailurePayload,
	LlmResponsePayload,
} from "../../contracts/llm-types.js";
import {
	isLlmFailure,
	isLlmStub,
	isLlmSuccess,
} from "../../contracts/llm-types.js";

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makePayload(
	overrides: Partial<LlmResponsePayload> = {},
): LlmResponsePayload {
	return {
		kind: "success",
		text: "Hello from the model",
		tier: "free",
		modelId: "gpt-5.1-mini",
		provider: "openai",
		durationMs: 120,
		usage: {
			inputTokens: 12,
			outputTokens: 5,
			totalTokens: 17,
		},
		...overrides,
	};
}

// ─── Shape tests ──────────────────────────────────────────────────────────────

describe("LlmResponsePayload — contract shape", () => {
	it("success payload has all required fields", () => {
		const payload: LlmResponsePayload = makePayload();
		expect(payload.kind).toBe("success");
		expect(typeof payload.text).toBe("string");
		expect(typeof payload.tier).toBe("string");
		expect(typeof payload.modelId).toBe("string");
		expect(payload.provider).toBe("openai");
		expect(typeof payload.durationMs).toBe("number");
		expect(payload.usage).toMatchObject({
			inputTokens: 12,
			outputTokens: 5,
			totalTokens: 17,
		});
	});

	it("stub payload omits durationMs", () => {
		const payload: LlmResponsePayload = makePayload({
			kind: "stub",
			text: "[LLM response stub — API key not configured]",
			durationMs: undefined,
			usage: undefined,
		});
		expect(payload.kind).toBe("stub");
		expect(payload.durationMs).toBeUndefined();
		expect(payload.usage).toBeUndefined();
	});

	it("rate-limited payload includes durationMs", () => {
		const payload: LlmResponsePayload = makePayload({
			kind: "rate-limited",
			text: "[LLM response stub — rate limit or quota exceeded]",
			durationMs: 350,
			usage: undefined,
		});
		expect(payload.kind).toBe("rate-limited");
		expect(payload.durationMs).toBeGreaterThan(0);
		expect(payload.usage).toBeUndefined();
	});

	it("api-error payload includes durationMs", () => {
		const payload: LlmResponsePayload = makePayload({
			kind: "api-error",
			text: "[LLM response stub — API call failed: 500]",
			durationMs: 1200,
			usage: undefined,
		});
		expect(payload.kind).toBe("api-error");
		expect(typeof payload.durationMs).toBe("number");
		expect(payload.usage).toBeUndefined();
	});
});

// ─── Type guard tests ─────────────────────────────────────────────────────────

describe("isLlmSuccess", () => {
	it("returns true for success kind", () => {
		expect(
			isLlmSuccess(makePayload({ kind: "success", durationMs: 100 })),
		).toBe(true);
	});

	it("returns false for stub kind", () => {
		expect(
			isLlmSuccess(makePayload({ kind: "stub", durationMs: undefined })),
		).toBe(false);
	});

	it("returns false for rate-limited kind", () => {
		expect(
			isLlmSuccess(makePayload({ kind: "rate-limited", durationMs: 500 })),
		).toBe(false);
	});

	it("returns false for api-error kind", () => {
		expect(
			isLlmSuccess(makePayload({ kind: "api-error", durationMs: 200 })),
		).toBe(false);
	});
});

describe("isLlmStub", () => {
	it("returns true only for stub kind", () => {
		expect(
			isLlmStub(makePayload({ kind: "stub", durationMs: undefined })),
		).toBe(true);
		expect(isLlmStub(makePayload({ kind: "success" }))).toBe(false);
		expect(isLlmStub(makePayload({ kind: "rate-limited" }))).toBe(false);
	});
});

describe("isLlmFailure", () => {
	it("returns true for every non-success kind", () => {
		expect(
			isLlmFailure(makePayload({ kind: "stub", durationMs: undefined })),
		).toBe(true);
		expect(
			isLlmFailure(makePayload({ kind: "rate-limited", durationMs: 400 })),
		).toBe(true);
		expect(
			isLlmFailure(makePayload({ kind: "api-error", durationMs: 200 })),
		).toBe(true);
	});

	it("returns false for success", () => {
		expect(isLlmFailure(makePayload({ kind: "success" }))).toBe(false);
	});
});

// ─── LlmFailurePayload narrowing ─────────────────────────────────────────────

describe("LlmFailurePayload — structural narrowing", () => {
	it("union excludes success kind", () => {
		const failure: LlmFailurePayload = makePayload({
			kind: "stub",
			durationMs: undefined,
		}) as LlmFailurePayload;
		expect(["stub", "rate-limited", "api-error"]).toContain(failure.kind);
	});
});

// ─── Four-tier tier coverage ──────────────────────────────────────────────────

describe("LlmResponsePayload tier field", () => {
	it("covers all four model tiers", () => {
		const tiers: LlmResponsePayload["tier"][] = [
			"free",
			"cheap",
			"strong",
			"reviewer",
		];
		for (const tier of tiers) {
			const payload = makePayload({ tier });
			expect(payload.tier).toBe(tier);
		}
	});
});
