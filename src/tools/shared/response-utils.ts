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
	/** Optional metadata to include in the response */
	metadata?: Record<string, unknown>;
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
 *
 * @example
 * ```typescript
 * return createMcpResponse({
 *   content: '# Result',
 *   metadata: { count: 42, status: 'success' },
 * });
 * ```
 */
export function createMcpResponse(options: McpResponseOptions): McpResponse {
	const { content, isError = false, metadata } = options;

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

	// Include metadata if provided
	if (metadata) {
		response.metadata = metadata;
	}
	if (isError) {
		response.isError = true;
	}

	return response;
}
