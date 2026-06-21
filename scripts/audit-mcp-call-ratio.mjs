import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const sessionsDir = ".mcp-ai-agent-guidelines";
const files = readdirSync(sessionsDir).filter(
  (f) => f.startsWith("session-") && f.endsWith(".json") && !f.includes(".tmp"),
);

let totalCalls = 0;
let mcpCalls = 0;
let bootstrapFirst = 0;

for (const f of files) {
  const path = join(sessionsDir, f);
  let session;
  try {
    session = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    continue;
  }
  const calls = extractToolCalls(session);
  totalCalls += calls.length;
  mcpCalls += calls.filter((c) => isMcpTool(c.name)).length;
  if (calls[0] && isMcpTool(calls[0].name) && calls[0].name.toLowerCase().includes("bootstrap")) {
    bootstrapFirst++;
  }
}

function extractToolCalls(session) {
  // Real schema has records array with kind field.
  // Maps records to tool call objects.
  // Record kinds: "parallel", "invokeSkill", "gate", "finalize"
  // Only invokeSkill represents a tool call; parallel/gate are containers.
  if (!Array.isArray(session.records)) {
    return [];
  }
  return session.records.map((r) => ({
    name: stepLabelToToolName(r.stepLabel),
    kind: r.kind,
  }));
}

function stepLabelToToolName(label) {
  // Convert workflow step label to a tool name representation.
  // Labels like "PRIORITY", "DESIGN", "ACCEPT" → kebab-case tool names.
  if (!label) return "";
  return label.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "");
}

function isMcpTool(name) {
  // MCP tool invocations come from records with kind="invokeSkill".
  // But we also filter the step labels for routing-like names.
  // We count "invokeSkill" records that have routing-style names.
  if (!name || typeof name !== "string") return false;
  // Routing tools include: priority, design, quality, security, acceptance,
  // api-surface, recommend, physics-audit, etc. — all uppercase workflow labels.
  // Non-MCP items include utilities like "finalize", "parallel", "gate".
  const non_mcp = ["finalize", "parallel", "gate", "serial"];
  return !non_mcp.includes(name);
}

console.log(JSON.stringify({
  sessions: files.length,
  totalCalls,
  mcpCalls,
  mcpRatio: totalCalls ? +(mcpCalls/totalCalls*100).toFixed(2) : 0,
  bootstrapFirstRatio: files.length ? +(bootstrapFirst/files.length*100).toFixed(2) : 0,
}, null, 2));
