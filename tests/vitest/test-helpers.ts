/**
 * Shared test utilities for Vitest tests
 */

import { expect } from "vitest";

/**
 * Parse an MCP error response from the design assistant
 * @param response - The response object from processRequest
 * @returns Parsed error payload with code, message, and context
 */
export const parseMcpError = (response: unknown) => {
	const errorResponse = response as {
		isError?: boolean;
		content?: Array<{ text: string }>;
	};

	expect(errorResponse?.isError).toBe(true);
	const payload = JSON.parse(errorResponse?.content?.[0]?.text ?? "{}");
	return payload as {
		code: number;
		message: string;
		context?: Record<string, unknown>;
	};
};
