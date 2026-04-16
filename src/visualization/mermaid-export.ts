/**
 * mermaid-export.ts
 *
 * Pure string-based Mermaid diagram generation for visualization of skill graphs,
 * instruction chains, and routing maps. Zero external dependencies.
 *
 * Provides:
 * - SkillNode: Typed node for skill graph visualization
 * - InstructionNode: Typed node for instruction chains
 * - MermaidExporter: Generator for Mermaid diagram syntax
 * - mermaidExporter: Singleton instance
 */

import { workflowSpecToMermaid } from "../workflows/mermaid-bridge.js";
import { getWorkflowSpecById } from "../workflows/workflow-spec.js";

/**
 * Represents a skill node in the graph.
 * Skills are grouped by domain prefix for visual organization.
 */
export interface SkillNode {
	/** Skill identifier (e.g., "qm-entanglement-mapper") */
	id: string;
	/** Domain prefix for grouping (extracted from id) */
	domain: string;
}

/**
 * Represents an instruction node that uses one or more skills.
 * Instructions form the procedural backbone of agent workflows.
 */
export interface InstructionNode {
	/** Instruction name (e.g., "testing", "implement") */
	name: string;
	/** Array of skill IDs this instruction uses */
	skills: string[];
}

/**
 * Generator for Mermaid diagram syntax strings.
 * All outputs are pure strings with zero side effects.
 * No external dependencies — works in any JavaScript environment.
 */
export class MermaidExporter {
	/**
	 * Generate a skill graph showing skills grouped by domain and their
	 * consumption by instructions.
	 *
	 * @param skills - Array of skill nodes grouped by domain
	 * @param instructions - Array of instruction nodes that use skills
	 * @returns Mermaid graph syntax (string)
	 *
	 * @example
	 * ```
	 * graph TD
	 *   subgraph qm
	 *     qm_bloch["qm-bloch-interpolator"]
	 *   end
	 *   testing([testing])
	 *   testing --> qm_bloch
	 * ```
	 */
	generateSkillGraph(
		skills: SkillNode[],
		instructions: InstructionNode[],
	): string {
		const lines = ["graph TD"];

		// Group skills by domain prefix (e.g., "qm", "gov", "orch")
		const byDomain = new Map<string, string[]>();
		for (const s of skills) {
			const domain = s.id.split("-")[0] ?? "other";
			const domainSkills = byDomain.get(domain);
			if (domainSkills) {
				domainSkills.push(s.id);
				continue;
			}

			byDomain.set(domain, [s.id]);
		}

		// Add domain subgraphs with skill nodes
		for (const [domain, ids] of byDomain) {
			lines.push(`  subgraph ${domain}`);
			for (const id of ids) {
				lines.push(`    ${id.replace(/-/g, "_")}["${id}"]`);
			}
			lines.push("  end");
		}

		// Add instruction nodes and edges to skills
		for (const inst of instructions) {
			const instId = inst.name.replace(/-/g, "_");
			lines.push(`  ${instId}([${inst.name}])`);
			for (const skill of inst.skills) {
				lines.push(`  ${instId} --> ${skill.replace(/-/g, "_")}`);
			}
		}

		return lines.join("\n");
	}

	/**
	 * Generate a linear instruction chain showing the sequence of steps
	 * in an orchestration workflow.
	 *
	 * @param instructions - Array of instruction names in sequence order
	 * @returns Mermaid graph syntax (string)
	 *
	 * @example
	 * ```
	 * graph LR
	 *   plan["plan"] --> design["design"]
	 *   design["design"] --> implement["implement"]
	 *   implement["implement"] --> testing["testing"]
	 * ```
	 */
	generateInstructionChain(instructions: string[]): string {
		const lines = ["graph LR"];

		for (const [index, current] of instructions.slice(0, -1).entries()) {
			const next = instructions[index + 1];
			if (!next) {
				continue;
			}

			const a = current.replace(/-/g, "_");
			const b = next.replace(/-/g, "_");
			lines.push(`  ${a}["${current}"] --> ${b}["${next}"]`);
		}

		return lines.join("\n");
	}

	/**
	 * Generate a routing map showing how agents or instructions route
	 * work to downstream processors.
	 *
	 * @param routes - Map where key is source and value is array of targets
	 * @returns Mermaid graph syntax (string)
	 *
	 * @example
	 * ```
	 * graph TD
	 *   meta_routing["meta-routing"] --> implement["implement"]
	 *   meta_routing["meta-routing"] --> design["design"]
	 *   implement["implement"] --> testing["testing"]
	 * ```
	 */
	generateRoutingMap(routes: Map<string, string[]>): string {
		const lines = ["graph TD"];

		for (const [from, tos] of routes) {
			const fromId = from.replace(/-/g, "_");
			for (const to of tos) {
				lines.push(
					`  ${fromId}["${from}"] --> ${to.replace(/-/g, "_")}["${to}"]`,
				);
			}
		}

		return lines.join("\n");
	}
}

/**
 * Singleton instance of MermaidExporter for convenience.
 * Use this to avoid repeated instantiation.
 *
 * @example
 * ```
 * const graph = mermaidExporter.generateSkillGraph(skills, instructions);
 * ```
 */
export const mermaidExporter = new MermaidExporter();

export function exportWorkflowDiagram(workflowId: string): string {
	const workflowSpec = getWorkflowSpecById(workflowId);
	if (!workflowSpec) {
		throw new Error(`Unknown workflow diagram: ${workflowId}`);
	}

	return `%% MCP Orchestration Flow: ${workflowSpec.label}\n${workflowSpecToMermaid(workflowSpec)}`;
}

/**
 * Returns the canonical orchestration flow as a Mermaid stateDiagram-v2 string.
 */
export function exportOrchestrationFlow(): string {
	return exportWorkflowDiagram("meta-routing");
}
