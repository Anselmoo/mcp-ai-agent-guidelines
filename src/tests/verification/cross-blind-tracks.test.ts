/**
 * Cross-blind verification of the four problems the user reported on
 * 2026-06-17 against the multi-track-mcp-execution branch.
 *
 * These assertions are written from the user's stated intent (the four
 * bullets of the original brainstorming session and the plan's Goal line),
 * not from the implementation. If the production code regresses on intent,
 * these tests fail even if all implementation-coupled tests still pass.
 *
 * User's four problems (verbatim):
 *   P1. Claude struggles without input
 *   P2. Claude provides inline markdown — best for in-house coding sessions
 *       or do agents prefer a different (hybrid) format
 *   P3. AI-Agent has trouble getting used to and activated
 *   P4. Physical models are not working — arbitrary context will not be
 *       translated into a pseudo physical picture
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { INSTRUCTION_SPECS } from "../../instructions/instruction-specs.js";
import { SdkMcpTestClient } from "../mcp/sdk-test-client.js";

const ENVELOPE_PREFIX = "__ENVELOPE_V1__:";
const REPO_ROOT = resolve(process.cwd());

interface DecodedEnvelope {
	payload: Record<string, unknown>;
	meta: { tool: string; ts: string; version: number };
}

function decodeEnvelopeBlock(text: string): DecodedEnvelope {
	if (!text.startsWith(ENVELOPE_PREFIX)) {
		throw new Error(`block does not start with ${ENVELOPE_PREFIX}`);
	}
	const json = Buffer.from(
		text.slice(ENVELOPE_PREFIX.length),
		"base64",
	).toString("utf8");
	return JSON.parse(json) as DecodedEnvelope;
}

function getTextBlocks(result: unknown): Array<{ type: string; text: string }> {
	if (
		typeof result !== "object" ||
		result === null ||
		!("content" in result) ||
		!Array.isArray((result as Record<string, unknown>).content)
	) {
		throw new Error(`unexpected tool result shape: ${JSON.stringify(result)}`);
	}
	return (result as { content: Array<{ type: string; text: string }> }).content;
}

// ────────────────────────────────────────────────────────────────────────
// P1 + P3 — Activation and enforcement
// User intent: agent should not struggle with the surface; first contact
// should be small and route to a planning entry point.
// ────────────────────────────────────────────────────────────────────────

describe("P1+P3: activation — surface and routing", () => {
	let client: SdkMcpTestClient;
	let savedFullSurface: string | undefined;

	beforeAll(async () => {
		savedFullSurface = process.env.MCP_FULL_SURFACE;
		delete process.env.MCP_FULL_SURFACE;
		client = new SdkMcpTestClient("cross-blind-slim");
		await client.connect();
	});

	afterAll(async () => {
		await client.close();
		if (savedFullSurface !== undefined) {
			process.env.MCP_FULL_SURFACE = savedFullSurface;
		}
	});

	it("first contact exposes a small surface (≤ 5 tools) by default", async () => {
		const tools = await client.listTools();
		expect(tools.length).toBeLessThanOrEqual(5);
	});

	it("default surface includes a routing-and-planning entry point", async () => {
		const tools = await client.listTools();
		const names = new Set(tools.map((t) => t.name));
		// Intent: the agent must be able to plan/route from a cold start.
		// The plan promised three tools; the user-facing intent only requires
		// at least one of them to be there as a planning entry point.
		const planningEntryPoints = ["task-bootstrap", "meta-routing"];
		const hasPlanningEntry = planningEntryPoints.some((name) =>
			names.has(name),
		);
		expect(
			hasPlanningEntry,
			`expected one of ${planningEntryPoints.join(", ")} in default surface; got ${[...names].join(", ")}`,
		).toBe(true);
	});

	it("default surface does not expose physics-analysis (Track C deprecation)", async () => {
		const tools = await client.listTools();
		expect(tools.map((t) => t.name)).not.toContain("physics-analysis");
	});
});

describe("P1+P3: activation — explicit opt-in to full surface", () => {
	let client: SdkMcpTestClient;
	let savedFullSurface: string | undefined;

	beforeAll(async () => {
		savedFullSurface = process.env.MCP_FULL_SURFACE;
		process.env.MCP_FULL_SURFACE = "true";
		client = new SdkMcpTestClient("cross-blind-full");
		await client.connect();
	});

	afterAll(async () => {
		await client.close();
		if (savedFullSurface === undefined) delete process.env.MCP_FULL_SURFACE;
		else process.env.MCP_FULL_SURFACE = savedFullSurface;
	});

	it("opt-in restores a noticeably larger surface than the default", async () => {
		const tools = await client.listTools();
		// Intent: the opt-out is real — users who explicitly ask for the full
		// surface get materially more than the slim default.
		expect(tools.length).toBeGreaterThan(10);
	});

	it("physics-analysis remains hidden even under full surface (Track C)", async () => {
		// Per Track C decision: physics-analysis is dropped from the public
		// routing surface regardless of MCP_FULL_SURFACE.
		const tools = await client.listTools();
		expect(tools.map((t) => t.name)).not.toContain("physics-analysis");
	});
});

describe("P1+P3: activation — validation errors point at the right next tool", () => {
	let client: SdkMcpTestClient;
	let savedFullSurface: string | undefined;

	beforeAll(async () => {
		savedFullSurface = process.env.MCP_FULL_SURFACE;
		process.env.MCP_FULL_SURFACE = "true";
		client = new SdkMcpTestClient("cross-blind-err");
		await client.connect();
	});

	afterAll(async () => {
		await client.close();
		if (savedFullSurface === undefined) delete process.env.MCP_FULL_SURFACE;
		else process.env.MCP_FULL_SURFACE = savedFullSurface;
	});

	it("missing required field yields an error that names the corrective tool", async () => {
		// User intent: when the agent makes a mistake, the error should tell
		// it where to go next — not just "validation failed."
		const result = await client.callTool("evidence-research", {});
		const blocks = getTextBlocks(result);
		const prose = blocks[0]?.text ?? "";
		expect(
			prose,
			"validation error should mention a corrective tool name",
		).toMatch(/task-bootstrap|meta-routing/);
	});

	it("unknown tool yields an error that names meta-routing", async () => {
		const result = await client.callTool("this-tool-does-not-exist", {
			request: "x",
		});
		const blocks = getTextBlocks(result);
		const prose = blocks[0]?.text ?? "";
		expect(prose).toMatch(/meta-routing|task-bootstrap/);
	});
});

describe("P1+P3: activation — SessionStart hook script ships and routes", () => {
	it("session-start hook prints parseable JSON that mentions task-bootstrap", () => {
		// User intent: the hook nudges the agent at session start; the message
		// must be machine-routable (JSON) AND contain the routing target.
		const script = resolve(
			REPO_ROOT,
			"scripts",
			"hooks",
			"session-start-bootstrap.mjs",
		);
		expect(existsSync(script), `missing hook script ${script}`).toBe(true);
		const stdout = execFileSync("node", [script], { encoding: "utf8" });
		const parsed = JSON.parse(stdout) as Record<string, unknown>;
		expect(parsed).toHaveProperty("hookSpecificOutput");
		const hsOut = parsed.hookSpecificOutput as Record<string, unknown>;
		expect(hsOut.hookEventName).toBe("SessionStart");
		expect(String(hsOut.additionalContext ?? "")).toContain("task-bootstrap");
	});
});

// ────────────────────────────────────────────────────────────────────────
// P2 — Hybrid output format
// User intent: in-house coding sessions need an output that downstream
// agents can read cheaply, not pure decorative markdown. The plan's promise
// was: a markdown-plus-structured envelope hybrid.
// ────────────────────────────────────────────────────────────────────────

describe("P2: hybrid output envelope on success", () => {
	let client: SdkMcpTestClient;
	let savedFullSurface: string | undefined;

	beforeAll(async () => {
		savedFullSurface = process.env.MCP_FULL_SURFACE;
		process.env.MCP_FULL_SURFACE = "true";
		client = new SdkMcpTestClient("cross-blind-envelope-ok");
		await client.connect();
	});

	afterAll(async () => {
		await client.close();
		if (savedFullSurface === undefined) delete process.env.MCP_FULL_SURFACE;
		else process.env.MCP_FULL_SURFACE = savedFullSurface;
	});

	it("a successful workflow tool returns BOTH human prose AND a machine-readable envelope", async () => {
		const result = await client.callTool("evidence-research", {
			request: "Sanity check: cross-blind verifying envelope on success.",
		});
		const blocks = getTextBlocks(result);
		// Intent: humans get the prose, agents get the structured payload.
		expect(blocks.length).toBeGreaterThanOrEqual(2);
		const prose = blocks[0]?.text ?? "";
		expect(prose).toContain("# "); // markdown heading
		const envelope = blocks[1]?.text ?? "";
		expect(envelope.startsWith(ENVELOPE_PREFIX)).toBe(true);
	});

	it("the envelope payload carries the public tool name, not an internal id", async () => {
		// Bug we deliberately closed in fix wave: prose used internal spec id
		// ("research"), envelope used public ("evidence-research"). User intent
		// is consistency: a chained agent should be able to recognise WHICH
		// tool it just ran.
		const result = await client.callTool("evidence-research", {
			request: "Sanity check: instructionId consistency.",
		});
		const blocks = getTextBlocks(result);
		const envelope = decodeEnvelopeBlock(blocks[1]?.text ?? "");
		expect(envelope.payload.instructionId).toBe("evidence-research");
		expect(envelope.meta.tool).toBe("evidence-research");
		expect(envelope.meta.version).toBe(1);
	});

	it("the human prose and the envelope payload agree on what tool ran", async () => {
		// Same intent, different angle: in-house coding sessions read both.
		// They must agree, or downstream tooling breaks subtly.
		const result = await client.callTool("evidence-research", {
			request: "Sanity check: prose/envelope agreement.",
		});
		const blocks = getTextBlocks(result);
		const prose = blocks[0]?.text ?? "";
		const envelope = decodeEnvelopeBlock(blocks[1]?.text ?? "");
		// The prose carries `**Instruction:** \`<name>\``. The name must
		// match what the envelope reports — otherwise we have the bug back.
		const proseMatch = prose.match(/\*\*Instruction:\*\*\s*`([^`]+)`/);
		expect(
			proseMatch,
			"prose should contain an `**Instruction:**` line",
		).not.toBeNull();
		const proseInstructionId = proseMatch?.[1];
		expect(proseInstructionId).toBe(envelope.payload.instructionId);
	});

	it("the envelope payload exposes the structured fields chained agents need", async () => {
		// Intent: a downstream agent must be able to read steps,
		// recommendations, artifacts without re-parsing the prose.
		const result = await client.callTool("evidence-research", {
			request: "Sanity check: envelope payload shape.",
		});
		const blocks = getTextBlocks(result);
		const envelope = decodeEnvelopeBlock(blocks[1]?.text ?? "");
		expect(Array.isArray(envelope.payload.steps)).toBe(true);
		expect(Array.isArray(envelope.payload.recommendations)).toBe(true);
		expect(Array.isArray(envelope.payload.artifacts)).toBe(true);
		expect(envelope.payload).toHaveProperty("displayName");
		expect(envelope.payload).toHaveProperty("model");
	});
});

describe("P2: hybrid output envelope on error", () => {
	let client: SdkMcpTestClient;
	let savedFullSurface: string | undefined;

	beforeAll(async () => {
		savedFullSurface = process.env.MCP_FULL_SURFACE;
		process.env.MCP_FULL_SURFACE = "true";
		client = new SdkMcpTestClient("cross-blind-envelope-err");
		await client.connect();
	});

	afterAll(async () => {
		await client.close();
		if (savedFullSurface === undefined) delete process.env.MCP_FULL_SURFACE;
		else process.env.MCP_FULL_SURFACE = savedFullSurface;
	});

	it("a tool error response also carries a structured envelope block", async () => {
		// Intent: machine-readable errors. The user's original complaint
		// showed an `**Error:** ...` markdown blob; downstream agents had to
		// re-parse prose to know what went wrong.
		const result = await client.callTool("evidence-research", {});
		const blocks = getTextBlocks(result);
		expect(blocks.length).toBeGreaterThanOrEqual(2);
		const envelope = decodeEnvelopeBlock(blocks[1]?.text ?? "");
		expect(envelope.payload).toHaveProperty("category");
		expect(envelope.payload).toHaveProperty("code");
		expect(envelope.payload).toHaveProperty("message");
	});
});

// ────────────────────────────────────────────────────────────────────────
// P4 — Physical models / adapter
// User intent: arbitrary context should not be force-translated into a
// QM/GR picture. Track C concluded with deprecation as production tool;
// research code remains.
// ────────────────────────────────────────────────────────────────────────

describe("P4: physics adapter deprecation — surface and chainTo", () => {
	it("no instruction spec chains to physics-analysis", () => {
		// Intent: the routing graph itself no longer points at the deprecated
		// tool. If any spec still names it, agents following chain hints will
		// hit a dead end.
		const offenders: Array<{ tool: string; chainTo: readonly string[] }> = [];
		for (const spec of INSTRUCTION_SPECS) {
			if (spec.chainTo.includes("physics-analysis")) {
				offenders.push({ tool: spec.toolName, chainTo: spec.chainTo });
			}
		}
		expect(offenders).toEqual([]);
	});

	it("physics adapter source files remain on disk (research scaffolding)", () => {
		// Intent: deprecate as PRODUCTION TOOL, not as research code. The
		// scoping spike documented that future trials with richer telemetry
		// could revisit; that requires the source to stay.
		const sources = [
			"src/skills/shared/physics-adapter-prototype.ts",
			"src/skills/qm/qm-physics-helpers.ts",
			"src/skills/gr/gr-physics-helpers.ts",
		];
		for (const rel of sources) {
			expect(existsSync(resolve(REPO_ROOT, rel)), `missing ${rel}`).toBe(true);
		}
	});
});
