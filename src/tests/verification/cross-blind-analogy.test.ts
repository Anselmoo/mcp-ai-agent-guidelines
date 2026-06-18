/**
 * Cross-blind verification of the analogy-think + methodology gate spec
 * (2026-06-17). Assertions written from the spec's stated intent, not from
 * the implementation-coupled unit tests. If production code regresses on
 * intent, these tests fail even when the unit suite stays green.
 *
 * Companion spec:
 *   .superpowers/specs/2026-06-17-analogy-think-and-methodology-gate-design.md
 *
 * The honest header `Metaphor, not theorem.` deliberately contains the word
 * "theorem" as a disclaimer. The rigor-laundering guard therefore scans
 * the decoded ENVELOPE PAYLOAD (what chained agents consume), not the prose.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { METAPHOR_CATALOG } from "../../skills/analogy/catalog.js";
import { SdkMcpTestClient } from "../mcp/sdk-test-client.js";

const ENVELOPE_PREFIX = "__ENVELOPE_V1__:";
const FORBIDDEN_PAYLOAD_STRINGS = ["theorem", "proven", "qed"];
const METHODOLOGY_HOST_TOOLS = [
	"issue-debug",
	"code-review",
	"system-design",
	"evidence-research",
] as const;
const METHODOLOGY_HEADER = "## Methodology checks (not proofs)";
const METHODOLOGY_CHECK_KEYS = [
	"dimensional",
	"conservation",
	"fermi",
	"scaling",
	"falsifiability",
];

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

/**
 * Walk every string value in a JSON tree and call `visit` with the value
 * and its dotted path. Used by the rigor-laundering guard so any future
 * payload field is automatically covered.
 */
function walkStrings(
	value: unknown,
	visit: (s: string, path: string) => void,
	path = "$",
): void {
	if (typeof value === "string") {
		visit(value, path);
	} else if (Array.isArray(value)) {
		value.forEach((item, i) => {
			walkStrings(item, visit, `${path}[${i}]`);
		});
	} else if (value !== null && typeof value === "object") {
		for (const [k, v] of Object.entries(value)) {
			walkStrings(v, visit, `${path}.${k}`);
		}
	}
}

// ────────────────────────────────────────────────────────────────────────
// Catalog-level intent — runs without the MCP server
// ────────────────────────────────────────────────────────────────────────

describe("seed metaphor catalog (intent guards)", () => {
	it("contains zero entries claiming a QM or GR domain", () => {
		const domains = METAPHOR_CATALOG.map((e) => e.domain);
		expect(domains).not.toContain("qm");
		expect(domains).not.toContain("gr");
	});

	it("every entry carries an anti-patterns list so the metaphor is bounded", () => {
		for (const e of METAPHOR_CATALOG) {
			expect(
				e.antiPatterns.length,
				`${e.id} has no anti-patterns`,
			).toBeGreaterThan(0);
		}
	});
});

// ────────────────────────────────────────────────────────────────────────
// Slim default: analogy-think MUST NOT be visible without opt-in
// ────────────────────────────────────────────────────────────────────────

describe("slim default surface excludes analogy-think", () => {
	let client: SdkMcpTestClient;
	let savedFullSurface: string | undefined;

	beforeAll(async () => {
		savedFullSurface = process.env.MCP_FULL_SURFACE;
		delete process.env.MCP_FULL_SURFACE;
		client = new SdkMcpTestClient("cross-blind-analogy-slim");
		await client.connect();
	});

	afterAll(async () => {
		await client.close();
		if (savedFullSurface !== undefined) {
			process.env.MCP_FULL_SURFACE = savedFullSurface;
		}
	});

	it("listTools does NOT include analogy-think in slim mode", async () => {
		const tools = await client.listTools();
		expect(tools.map((t) => t.name)).not.toContain("analogy-think");
	});
});

// ────────────────────────────────────────────────────────────────────────
// Full surface: analogy-think visible; success run honours honest header;
// envelope payload exposes structured candidates; rigor-laundering guard
// passes.
// ────────────────────────────────────────────────────────────────────────

describe("analogy-think under MCP_FULL_SURFACE=true", () => {
	let client: SdkMcpTestClient;
	let savedFullSurface: string | undefined;

	beforeAll(async () => {
		savedFullSurface = process.env.MCP_FULL_SURFACE;
		process.env.MCP_FULL_SURFACE = "true";
		client = new SdkMcpTestClient("cross-blind-analogy-full");
		await client.connect();
	});

	afterAll(async () => {
		await client.close();
		if (savedFullSurface === undefined) delete process.env.MCP_FULL_SURFACE;
		else process.env.MCP_FULL_SURFACE = savedFullSurface;
	});

	it("analogy-think IS in the full surface", async () => {
		const tools = await client.listTools();
		expect(tools.map((t) => t.name)).toContain("analogy-think");
	});

	it("a feedback-loop request returns at least one candidate, prose starts with honest header", async () => {
		const result = await client.callTool("analogy-think", {
			request:
				"our retry loop overshoots when the upstream slows; how do we tune it?",
		});
		const blocks = getTextBlocks(result);
		expect(blocks.length).toBeGreaterThanOrEqual(2);
		const prose = blocks[0]?.text ?? "";
		expect(prose.startsWith("Metaphor, not theorem.")).toBe(true);
		const envelope = decodeEnvelopeBlock(blocks[1]?.text ?? "");
		const candidates = envelope.payload.candidates;
		expect(Array.isArray(candidates)).toBe(true);
		expect((candidates as unknown[]).length).toBeGreaterThanOrEqual(1);
	});

	it("the analogy-think envelope payload contains no rigor-laundering strings", async () => {
		const result = await client.callTool("analogy-think", {
			request:
				"our retry loop overshoots when the upstream slows; how do we tune it?",
		});
		const blocks = getTextBlocks(result);
		const envelope = decodeEnvelopeBlock(blocks[1]?.text ?? "");
		const offenders: Array<{ path: string; value: string }> = [];
		walkStrings(envelope.payload, (s, path) => {
			const lower = s.toLowerCase();
			for (const forbidden of FORBIDDEN_PAYLOAD_STRINGS) {
				if (lower.includes(forbidden)) {
					offenders.push({ path, value: s });
				}
			}
		});
		expect(
			offenders,
			`analogy-think payload leaks rigor-laundering strings: ${JSON.stringify(offenders, null, 2)}`,
		).toEqual([]);
	});
});

// ────────────────────────────────────────────────────────────────────────
// Methodology gate: present on the four host tools, absent on others.
// Prose carries the honest section header; payload carries all five keys;
// rigor-laundering guard passes across the four host payloads.
// ────────────────────────────────────────────────────────────────────────

describe("methodology gate on the four engineering host tools", () => {
	let client: SdkMcpTestClient;
	let savedFullSurface: string | undefined;

	beforeAll(async () => {
		savedFullSurface = process.env.MCP_FULL_SURFACE;
		process.env.MCP_FULL_SURFACE = "true";
		client = new SdkMcpTestClient("cross-blind-methodology-hosts");
		await client.connect();
	});

	afterAll(async () => {
		await client.close();
		if (savedFullSurface === undefined) delete process.env.MCP_FULL_SURFACE;
		else process.env.MCP_FULL_SURFACE = savedFullSurface;
	});

	for (const toolName of METHODOLOGY_HOST_TOOLS) {
		it(`${toolName}: prose contains the honest header AND payload has all five check keys`, async () => {
			const result = await client.callTool(toolName, {
				request: "cross-blind verification of methodology gate presence",
			});
			const blocks = getTextBlocks(result);
			const prose = blocks[0]?.text ?? "";
			expect(prose).toContain(METHODOLOGY_HEADER);
			const envelope = decodeEnvelopeBlock(blocks[1]?.text ?? "");
			const methodology = envelope.payload.methodology as
				| Record<string, unknown>
				| undefined;
			expect(
				methodology,
				`${toolName} payload missing methodology field`,
			).toBeDefined();
			for (const key of METHODOLOGY_CHECK_KEYS) {
				expect(
					methodology,
					`${toolName} methodology missing check ${key}`,
				).toHaveProperty(key);
			}
		});

		it(`${toolName}: envelope payload contains no rigor-laundering strings`, async () => {
			const result = await client.callTool(toolName, {
				request: "cross-blind verification of rigor-laundering guard",
			});
			const blocks = getTextBlocks(result);
			const envelope = decodeEnvelopeBlock(blocks[1]?.text ?? "");
			const offenders: Array<{ path: string; value: string }> = [];
			walkStrings(envelope.payload, (s, path) => {
				const lower = s.toLowerCase();
				for (const forbidden of FORBIDDEN_PAYLOAD_STRINGS) {
					if (lower.includes(forbidden)) {
						offenders.push({ path, value: s });
					}
				}
			});
			expect(
				offenders,
				`${toolName} payload leaks rigor-laundering strings: ${JSON.stringify(offenders, null, 2)}`,
			).toEqual([]);
		});
	}
});
