#!/usr/bin/env node
/**
 * no-legacy-tool-surface hook (PreToolUse)
 *
 * Blocks direct use of retired command-multiplexed auxiliary tools:
 * - agent-memory
 * - agent-session
 * - agent-snapshot
 *
 * The hook returns `ask` with an explicit migration hint so callers switch to
 * the granular no-legacy surface.
 */

import { readFileSync } from "node:fs";

const LEGACY_TOOL_NAMES = new Set([
	"agent-memory",
	"agent-session",
	"agent-snapshot",
]);

function readHookInput() {
	try {
		const raw = readFileSync(0, "utf8");
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function extractToolName(input) {
	const value =
		input?.toolName ??
		input?.tool_name ??
		input?.toolInput?.toolName ??
		process.env.TOOL_NAME ??
		"";
	return String(value).toLowerCase();
}

const input = readHookInput();
const toolName = extractToolName(input);

if (!LEGACY_TOOL_NAMES.has(toolName)) {
	process.exit(0);
}

const migrationHint = [
	"Retired tool surface detected:",
	`- ${toolName}`,
	"",
	"Use granular no-legacy tools instead:",
	"- memory: agent-memory-read|write|fetch|delete",
	"- session: agent-session-read|write|fetch|delete",
	"- snapshot: agent-snapshot-read|write|fetch|compare|delete",
].join("\n");

process.stdout.write(
	JSON.stringify({
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "ask",
			permissionDecisionReason: migrationHint,
		},
	}),
);
process.exit(0);
