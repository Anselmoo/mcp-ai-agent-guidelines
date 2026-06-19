import { describe, expect, it, vi } from "vitest";
import { makeSampler } from "../../../tools/shared/sampler.js";

describe("makeSampler", () => {
	it("maps the request onto createMessage and returns the text content", async () => {
		const createMessage = vi.fn().mockResolvedValue({
			content: { type: "text", text: "real finding" },
			model: "claude",
			role: "assistant",
		});
		const sampler = makeSampler({ createMessage });

		const result = await sampler({
			system: "you are an evaluator",
			prompt: "evaluate X",
			maxTokens: 512,
			modelClass: "strong",
		});

		expect(result.text).toBe("real finding");
		const params = createMessage.mock.calls[0][0];
		expect(params.maxTokens).toBe(512);
		expect(params.systemPrompt).toBe("you are an evaluator");
		expect(params.messages[0].content.text).toBe("evaluate X");
		expect(params.messages[0].role).toBe("user");
	});

	it("returns empty text when the model yields a non-text block", async () => {
		const createMessage = vi.fn().mockResolvedValue({
			content: { type: "image", data: "...", mimeType: "image/png" },
			model: "claude",
			role: "assistant",
		});
		const sampler = makeSampler({ createMessage });

		const result = await sampler({
			system: "s",
			prompt: "p",
			maxTokens: 10,
			modelClass: "cheap",
		});

		expect(result.text).toBe("");
	});
});
