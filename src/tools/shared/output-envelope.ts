import type { TextToolResult } from "../tool-call-handler.js";

export interface ToolEnvelope<T = unknown> {
	summaryMarkdown: string;
	payload: T;
	meta: { tool: string; ts: string; version: 1 };
}

const PREFIX = "__ENVELOPE_V1__:";

export function toToolResult<T>(env: ToolEnvelope<T>): TextToolResult {
	const encoded = Buffer.from(
		JSON.stringify({ payload: env.payload, meta: env.meta }),
		"utf8",
	).toString("base64");
	return {
		content: [
			{ type: "text", text: env.summaryMarkdown },
			{ type: "text", text: `${PREFIX}${encoded}` },
		],
	};
}

export function parseEnvelopeBlock<T = unknown>(text: string): ToolEnvelope<T> {
	if (!text.startsWith(PREFIX)) throw new Error("not an envelope block");
	const json = Buffer.from(text.slice(PREFIX.length), "base64").toString(
		"utf8",
	);
	const parsed = JSON.parse(json) as { payload: T; meta: ToolEnvelope["meta"] };
	return { summaryMarkdown: "", payload: parsed.payload, meta: parsed.meta };
}
