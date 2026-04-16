import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import {
	INSTRUCTION_SPECS,
	type InstructionSpecDefinition,
	WORKFLOW_PUBLIC_INSTRUCTION_SPECS,
} from "../instructions/instruction-specs.js";
import { SKILL_SPECS } from "../skills/skill-specs.js";
import { glyphRegistry } from "../visualization/glyph-registry.js";
import type {
	InstructionNode,
	SkillNode,
} from "../visualization/mermaid-export.js";
import { mermaidExporter } from "../visualization/mermaid-export.js";
import { SvgExportEngine } from "../visualization/svg-export.js";
import {
	buildToolValidators,
	type ToolDefinitionWithInputSchema,
	validateToolArguments,
} from "./shared/tool-validators.js";

type VisualizationView =
	| "chain-graph"
	| "skill-graph"
	| "instruction-chain"
	| "domain-focus";
type VisualizationFormat = "mermaid" | "svg";

const VALID_VIEWS: readonly VisualizationView[] = [
	"chain-graph",
	"skill-graph",
	"instruction-chain",
	"domain-focus",
];
const VALID_FORMATS: readonly VisualizationFormat[] = ["mermaid", "svg"];
const svgExporter = new SvgExportEngine();

// ---------------------------------------------------------------------------
// Classification helpers for color-coded chain graph
// ---------------------------------------------------------------------------

const WORKFLOW_IDS = new Set([
	"design",
	"implement",
	"research",
	"review",
	"plan",
	"debug",
	"refactor",
	"testing",
	"document",
	"evaluate",
	"prompt-engineering",
]);

const SPECIALIST_IDS = new Set(["orchestrate", "enterprise", "govern"]);

const GATED_IDS = new Set(["resilience", "adapt", "physics-analysis"]);

function classifyInstruction(
	id: string,
): "workflow" | "specialist" | "gated" | "discovery" {
	if (WORKFLOW_IDS.has(id)) return "workflow";
	if (SPECIALIST_IDS.has(id)) return "specialist";
	if (GATED_IDS.has(id)) return "gated";
	return "discovery";
}

// ---------------------------------------------------------------------------
// Chain graph generation with color-coded edges
// ---------------------------------------------------------------------------

function generateColoredChainGraph(specs: InstructionSpecDefinition[]): string {
	const lines = ["graph TD"];

	// classDef for node categories
	lines.push("  classDef workflow fill:#4a90d9,stroke:#2c5f8a,color:#fff");
	lines.push("  classDef specialist fill:#e8943a,stroke:#b06d1f,color:#fff");
	lines.push("  classDef gated fill:#d94a4a,stroke:#8a2c2c,color:#fff");
	lines.push(
		"  classDef terminal fill:#999,stroke:#666,color:#fff,stroke-dasharray: 5 5",
	);

	// Collect edges and track terminal nodes
	const edgeIndices: { from: string; to: string; kind: string }[] = [];
	const hasOutgoing = new Set<string>();

	for (const spec of specs) {
		if (!spec.public) continue;
		for (const target of spec.chainTo) {
			edgeIndices.push({
				from: spec.id,
				to: target,
				kind: classifyInstruction(spec.id),
			});
			hasOutgoing.add(spec.id);
		}
	}

	// Emit node declarations
	const publicSpecs = specs.filter((s) => s.public);
	for (const spec of publicSpecs) {
		const nodeId = spec.id.replace(/-/g, "_");
		lines.push(`  ${nodeId}["${spec.id}"]`);
	}

	// Emit edges
	for (const edge of edgeIndices) {
		const fromId = edge.from.replace(/-/g, "_");
		const toId = edge.to.replace(/-/g, "_");
		lines.push(`  ${fromId} --> ${toId}`);
	}

	// Apply classDef to nodes
	const byClass = new Map<string, string[]>();
	for (const spec of publicSpecs) {
		const nodeId = spec.id.replace(/-/g, "_");
		const isTerminal =
			spec.chainTo.length === 0 && spec.surface !== "discovery";
		const cls = isTerminal ? "terminal" : classifyInstruction(spec.id);
		const existing = byClass.get(cls) ?? [];
		existing.push(nodeId);
		byClass.set(cls, existing);
	}

	for (const [cls, nodes] of byClass) {
		lines.push(`  class ${nodes.join(",")} ${cls}`);
	}

	// linkStyle for edge colors
	let edgeIndex = 0;
	const workflowEdges: number[] = [];
	const specialistEdges: number[] = [];
	const gatedEdges: number[] = [];

	for (const edge of edgeIndices) {
		switch (edge.kind) {
			case "workflow":
				workflowEdges.push(edgeIndex);
				break;
			case "specialist":
				specialistEdges.push(edgeIndex);
				break;
			case "gated":
				gatedEdges.push(edgeIndex);
				break;
		}
		edgeIndex++;
	}

	if (workflowEdges.length > 0) {
		lines.push(`  linkStyle ${workflowEdges.join(",")} stroke:#4a90d9`);
	}
	if (specialistEdges.length > 0) {
		lines.push(`  linkStyle ${specialistEdges.join(",")} stroke:#e8943a`);
	}
	if (gatedEdges.length > 0) {
		lines.push(`  linkStyle ${gatedEdges.join(",")} stroke:#d94a4a`);
	}

	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// View dispatchers
// ---------------------------------------------------------------------------

function viewChainGraph(): string {
	return generateColoredChainGraph(INSTRUCTION_SPECS);
}

function formatInstructionGlyphLabel(id: string): string {
	const entry = glyphRegistry.forInstruction(id);
	return entry.glyph === "•" ? id : `${entry.glyph} ${id}`;
}

function formatSkillGlyphLabel(skillId: string): string {
	return glyphRegistry.format(skillId);
}

function getDomainSkills(domain: string) {
	const domainSkills = SKILL_SPECS.filter((s) => s.domain === domain);
	if (domainSkills.length === 0) {
		const available = [...new Set(SKILL_SPECS.map((s) => s.domain))].sort();
		throw new Error(
			`No skills found for domain "${domain}". Available domains: ${available.join(", ")}`,
		);
	}
	return domainSkills;
}

function summarizeSkillsByDomain(): string[] {
	const domainCounts = new Map<string, number>();
	for (const skill of SKILL_SPECS) {
		domainCounts.set(skill.domain, (domainCounts.get(skill.domain) ?? 0) + 1);
	}

	return [...domainCounts.entries()]
		.sort(
			(left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
		)
		.map(([domain, count]) => {
			const sampleSkill = SKILL_SPECS.find((skill) => skill.domain === domain);
			const glyph = sampleSkill
				? glyphRegistry.forSkill(sampleSkill.id).glyph
				: "•";
			return `${glyph} ${domain}: ${count} skills`;
		});
}

function viewSkillGraph(): string {
	const skills: SkillNode[] = SKILL_SPECS.map((s) => ({
		id: s.id,
		domain: s.domain,
	}));
	const instructions: InstructionNode[] = [];
	return mermaidExporter.generateSkillGraph(skills, instructions);
}

function viewInstructionChain(): string {
	const ids = WORKFLOW_PUBLIC_INSTRUCTION_SPECS.map((s) => s.id);
	return mermaidExporter.generateInstructionChain(ids);
}

function viewDomainFocus(domain: string): string {
	const domainSkills = getDomainSkills(domain);
	const skills: SkillNode[] = domainSkills.map((s) => ({
		id: s.id,
		domain: s.domain,
	}));
	return mermaidExporter.generateSkillGraph(skills, []);
}

async function viewChainGraphSvg(): Promise<string> {
	return svgExporter.generateAgentTopologyDiagram(
		INSTRUCTION_SPECS.filter((spec) => spec.public).map((spec) =>
			formatInstructionGlyphLabel(spec.id),
		),
	);
}

async function viewSkillGraphSvg(): Promise<string> {
	return svgExporter.generateSkillCoverageDiagram(summarizeSkillsByDomain());
}

async function viewInstructionChainSvg(): Promise<string> {
	return svgExporter.generateOrchestrationFlowDiagram(
		WORKFLOW_PUBLIC_INSTRUCTION_SPECS.map((spec) =>
			formatInstructionGlyphLabel(spec.id),
		),
	);
}

async function viewDomainFocusSvg(domain: string): Promise<string> {
	return svgExporter.generateAgentTopologyDiagram(
		getDomainSkills(domain).map((skill) => formatSkillGlyphLabel(skill.id)),
	);
}

// ---------------------------------------------------------------------------
// Tool definition + dispatch
// ---------------------------------------------------------------------------

export const VISUALIZATION_TOOL_DEFINITIONS: readonly ToolDefinitionWithInputSchema[] =
	[
		{
			name: "graph-visualize",
			description:
				"Generate Mermaid or SVG diagrams for instruction chain graphs, skill graphs, or domain-focused views.",
			inputSchema: {
				type: "object" as const,
				properties: {
					view: {
						type: "string",
						enum: [...VALID_VIEWS],
						description:
							"chain-graph: color-coded instruction chainTo routing graph. skill-graph: skills grouped by domain. instruction-chain: linear workflow instruction sequence. domain-focus: skills filtered to a single domain.",
					},
					format: {
						type: "string",
						enum: [...VALID_FORMATS],
						description:
							"Render format. mermaid returns Mermaid syntax; svg returns a rendered SVG summary for the selected view.",
					},
					domain: {
						type: "string",
						description:
							'Domain prefix to focus on (e.g. "qm", "gov", "adapt"). Required for domain-focus view.',
					},
				},
				required: ["view"],
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
	];

export const VISUALIZATION_TOOL_VALIDATORS = buildToolValidators(
	VISUALIZATION_TOOL_DEFINITIONS,
);

export function buildVisualizationToolSurface() {
	return VISUALIZATION_TOOL_DEFINITIONS;
}

export async function dispatchVisualizationToolCall(
	name: string,
	args: Record<string, unknown>,
): Promise<CallToolResult> {
	if (name !== "graph-visualize") {
		return {
			content: [{ type: "text", text: `Unknown visualization tool: ${name}` }],
			isError: true,
		};
	}

	let record: Record<string, unknown>;
	try {
		record = validateToolArguments(name, args, VISUALIZATION_TOOL_VALIDATORS);
	} catch (error) {
		return {
			content: [{ type: "text", text: toErrorMessage(error) }],
			isError: true,
		};
	}

	const view = record.view as string;
	const format =
		typeof record.format === "string"
			? (record.format as VisualizationFormat)
			: "mermaid";

	try {
		const domain =
			typeof record.domain === "string" && record.domain.trim().length > 0
				? record.domain.trim()
				: undefined;
		if (view === "domain-focus" && !domain) {
			return {
				content: [
					{
						type: "text",
						text: 'The "domain" parameter is required for domain-focus view.',
					},
				],
				isError: true,
			};
		}

		let output: string;
		if (format === "svg") {
			switch (view) {
				case "chain-graph":
					output = await viewChainGraphSvg();
					break;
				case "skill-graph":
					output = await viewSkillGraphSvg();
					break;
				case "instruction-chain":
					output = await viewInstructionChainSvg();
					break;
				case "domain-focus":
					output = await viewDomainFocusSvg(domain!);
					break;
				default:
					return {
						content: [
							{
								type: "text",
								text: `Unknown view: "${view}". Valid views: ${VALID_VIEWS.join(", ")}`,
							},
						],
						isError: true,
					};
			}
		} else {
			switch (view) {
				case "chain-graph":
					output = viewChainGraph();
					break;
				case "skill-graph":
					output = viewSkillGraph();
					break;
				case "instruction-chain":
					output = viewInstructionChain();
					break;
				case "domain-focus":
					output = viewDomainFocus(domain!);
					break;
				default:
					return {
						content: [
							{
								type: "text",
								text: `Unknown view: "${view}". Valid views: ${VALID_VIEWS.join(", ")}`,
							},
						],
						isError: true,
					};
			}
		}

		return {
			content: [{ type: "text", text: output }],
			isError: false,
		};
	} catch (error) {
		return {
			content: [{ type: "text", text: toErrorMessage(error) }],
			isError: true,
		};
	}
}
