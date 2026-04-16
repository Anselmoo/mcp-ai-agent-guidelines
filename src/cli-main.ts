#!/usr/bin/env node

/**
 * CLI entry point for MCP AI Agent Guidelines v2
 * Provides command-line interface for onboarding, memory management, and configuration
 */

import McpAgentCli from "./cli.js";
import {
	getWorkflowErrorMessage,
	getWorkflowErrorType,
} from "./infrastructure/workflow-error-utilities.js";

const cli = new McpAgentCli();
cli.run().catch((error) => {
	console.error(
		`Fatal CLI error [errorType=${getWorkflowErrorType(error)}, error=${getWorkflowErrorMessage(error)}]`,
	);
	process.exit(1);
});
