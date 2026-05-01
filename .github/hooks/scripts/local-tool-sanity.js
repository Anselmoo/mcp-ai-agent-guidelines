#!/usr/bin/env node
/**
 * local-tool-sanity.js — SessionStart + PreToolUse hook for local workspace sanity
 *
 * SessionStart:
 *   - Warns when build artifacts are missing or stale compared to source files
 *   - Warns when the local MCP state directory `.mcp-ai-agent-guidelines` is absent
 *
 * PreToolUse:
 *   - Blocks the unstable `fetch_webpage` and direct memory-delete tool paths
 *   - Encourages using safer workspace edit / memory tooling instead
 */

import { accessSync, constants, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const PROJECT_ROOT = process.cwd();
const SOURCE_PATTERNS = ["src", "package.json", "tsconfig.json", "package-lock.json", "biome.json"];
const BUILD_ARTIFACT_PATH = join(PROJECT_ROOT, "dist", "index.js");
const MCP_STATE_DIR = join(PROJECT_ROOT, ".mcp-ai-agent-guidelines");
const BLOCKED_TOOL_KEYWORDS = [
  "fetch_webpage",
  "memory-delete",
  "agent-memory-delete",
  "mcp_ai_agent-guid_agent-memory-delete",
  "mcp_ai_agent-guid_agent_memory_delete",
];

function readHookInput() {
  try {
    const raw = readFileSync(0, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function extractToolName(input) {
  return String(
    input?.toolName ??
      input?.tool_name ??
      input?.toolInput?.toolName ??
      process.env.TOOL_NAME ??
      ""
  ).toLowerCase();
}

function isBlockedTool(toolName) {
  return BLOCKED_TOOL_KEYWORDS.some((keyword) => toolName.includes(keyword));
}

function getDirectoryFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.map((entry) => ({ entry, path: join(directory, entry.name) }));
}

function isWorkspaceWritable() {
  try {
    accessSync(PROJECT_ROOT, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function isBuildStale() {
  if (!existsSync(BUILD_ARTIFACT_PATH)) {
    return true;
  }

  const buildTime = statSync(BUILD_ARTIFACT_PATH).mtimeMs;

  for (const pattern of SOURCE_PATTERNS) {
    const path = join(PROJECT_ROOT, pattern);
    if (!existsSync(path)) {
      continue;
    }

    const stat = statSync(path);
    if (stat.isDirectory()) {
      const stack = [path];
      while (stack.length > 0) {
        const current = stack.pop();
        for (const { entry, path: childPath } of getDirectoryFiles(current)) {
          if (entry.isDirectory()) {
            stack.push(childPath);
            continue;
          }

          if ([".ts", ".js", ".json", ".toml"].includes(extname(entry.name))) {
            if (statSync(childPath).mtimeMs > buildTime) {
              return true;
            }
          }
        }
      }
    } else if (stat.mtimeMs > buildTime) {
      return true;
    }
  }

  return false;
}

function printSessionStartWarnings() {
  const warnings = [];

  if (!existsSync(BUILD_ARTIFACT_PATH)) {
    warnings.push(
      "Missing build artifact: run `npm run build` before starting the session so the local server matches the workspace source."
    );
  } else if (isBuildStale()) {
    warnings.push(
      "Build may be stale: run `npm run build` to refresh dist/ before continuing."
    );
  }

  if (!existsSync(MCP_STATE_DIR)) {
    warnings.push(
      "Local MCP state directory `.mcp-ai-agent-guidelines/` is not present yet. Write paths can create it on demand, but reads and prior-artifact lookups will not have existing local state until the workspace is initialized."
    );
  }

  if (!isWorkspaceWritable()) {
    warnings.push(
      "Workspace directory is not writable. The published product may fail to create local files or directories in the current working directory."
    );
  }

  if (warnings.length > 0) {
    const lines = [
      "[_tool-sanity] Workspace sanity check:",
      ...warnings.map((warning) => `- ${warning}`),
      "If the workspace is up to date, restart the MCP server and rerun `npm run build` so the latest local version is active.",
    ];
    process.stderr.write(`${lines.join("\n")}\n`);
  }
}

function outputHookResult(result) {
  process.stdout.write(JSON.stringify(result));
}

const eventName = String(process.argv[2] ?? "SessionStart");
if (eventName === "SessionStart") {
  printSessionStartWarnings();
  outputHookResult({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      permissionDecision: "allow",
    },
  });
  process.exit(0);
}

if (eventName === "PreToolUse") {
  const input = readHookInput();
  const toolName = extractToolName(input);

  if (isBlockedTool(toolName)) {
    const message = [
      "The requested tool appears to be unstable in this workspace:",
      `- ${toolName}`,
      "",
      "Avoid `fetch_webpage` and direct memory-delete tool commands here because local file creation and state deletion are currently unreliable.",
      "Use safer alternatives such as workspace edit tools or explicit memory fetch/read/write operations instead.",
      "If you are debugging local tool failures, restart the MCP server, run `npm run build`, and confirm `.mcp-ai-agent-guidelines/` exists.",
    ].join("\n");

    outputHookResult({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: message,
      },
    });
    process.exit(0);
  }

  process.exit(0);
}

process.exit(0);
