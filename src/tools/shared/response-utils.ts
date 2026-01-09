/**
 * Response utilities for MCP tool responses
 */

import type { McpResponse } from "./error-handler.js";

/**
 * Options for creating an MCP response
 */
export interface McpResponseOptions {
	/** The text content to return */
	content: string;
	/** Whether this is an error response (default: false) */
	isError?: boolean;
}

/**
 * Create a standardized MCP response
 *
 * @param options - Response options
 * @returns MCP-formatted response object
 *
 * @example
 * ```typescript
 * return createMcpResponse({
 *   content: '# Success\n\nOperation completed.',
 * });
 * ```
 *
 * @example
 * ```typescript
 * return createMcpResponse({
 *   content: 'Error: Invalid input',
 *   isError: true,
 * });
 * ```
 */
export function createMcpResponse(options: McpResponseOptions): McpResponse {
	const { content, isError = false } = options;

	const response: McpResponse = {
		content: [
			{
				type: "text" as const,
				text: content,
			},
		],
	};

	// Only include isError if true
	if (isError) {
		response.isError = true;
	}

	return response;
}
