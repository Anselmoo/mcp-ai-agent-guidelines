import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Sampler } from "../../contracts/runtime.js";

const MODEL_HINTS: Record<string, string> = {
	free: "claude-haiku",
	cheap: "claude-haiku",
	strong: "claude-sonnet",
	reviewer: "claude-opus",
};

/**
 * Wrap an MCP server's `createMessage` into a `Sampler`. The server may only
 * call this when the client advertises the `sampling` capability; callers gate
 * on `clientSupportsSampling` before invoking. Maps the skill's model class onto
 * MCP `modelPreferences` hints so the existing routing intent is honored by the
 * client rather than discarded.
 */
export function makeSampler(server: Pick<Server, "createMessage">): Sampler {
	return async (req) => {
		const response = await server.createMessage({
			systemPrompt: req.system,
			maxTokens: req.maxTokens,
			messages: [{ role: "user", content: { type: "text", text: req.prompt } }],
			modelPreferences: {
				hints: [{ name: MODEL_HINTS[req.modelClass] ?? "claude" }],
			},
		});
		const block = response.content;
		const text =
			block && block.type === "text" && typeof block.text === "string"
				? block.text
				: "";
		return { text };
	};
}
