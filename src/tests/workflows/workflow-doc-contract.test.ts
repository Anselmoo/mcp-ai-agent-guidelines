import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_INSTRUCTION_MODULES } from "../../generated/registry/public-tools.js";
import { workflowSpecToMermaid } from "../../workflows/mermaid-bridge.js";
import {
	getWorkflowSpecById,
	WORKFLOW_SPECS,
} from "../../workflows/workflow-spec.js";

const WORKFLOW_DOCS_DIR = resolve(process.cwd(), "docs", "workflows");

function normalizeWorkflowId(docId: string) {
	return docId.replace(/^\d+-/, "");
}

function extractStateDiagram(markdown: string) {
	const match = markdown.match(/```mermaid\s*(stateDiagram-v2[\s\S]*?)```/u);
	return match?.[1]?.trim() ?? null;
}

function extractSequenceDiagram(markdown: string) {
	const match = markdown.match(/```mermaid\s*(sequenceDiagram[\s\S]*?)```/u);
	return match?.[1]?.trim() ?? null;
}

function countTransitions(diagram: string) {
	return diagram
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.includes("-->")).length;
}

function markdownFileForSpecKey(specKey: string) {
	return (
		readdirSync(WORKFLOW_DOCS_DIR).find((file) =>
			file.endsWith(`-${specKey}.md`),
		) ?? `${specKey}.md`
	);
}

describe("workflow docs contract", () => {
	it("provides a JSON and Markdown overview for every implemented workflow", () => {
		const files = readdirSync(WORKFLOW_DOCS_DIR);
		const jsonFiles = files.filter((file) => file.endsWith(".json")).sort();
		const markdownFiles = new Set(files.filter((file) => file.endsWith(".md")));
		const implementedWorkflowIds = new Set(
			WORKFLOW_SPECS.map((spec) => spec.key),
		);
		const implementedInstructionIds = new Set(
			PUBLIC_INSTRUCTION_MODULES.map((module) => module.manifest.id),
		);

		expect(jsonFiles).toHaveLength(WORKFLOW_SPECS.length);
		for (const jsonFile of jsonFiles) {
			const markdownFile = jsonFile.replace(/\.json$/u, ".md");
			expect(markdownFiles.has(markdownFile)).toBe(true);

			const document = JSON.parse(
				readFileSync(resolve(WORKFLOW_DOCS_DIR, jsonFile), "utf8"),
			) as {
				id: string;
				title: string;
				inputSchema?: Record<string, string>;
				throwbacks?: string[];
				routes?: string[];
				skillTree?: {
					root: string;
					nodes: unknown[];
				};
			};
			const workflowId = normalizeWorkflowId(document.id);
			const spec = getWorkflowSpecById(workflowId);

			expect(implementedWorkflowIds.has(workflowId)).toBe(true);
			expect(implementedInstructionIds.has(workflowId)).toBe(true);
			expect(spec).toBeDefined();
			expect(document.title.endsWith(" Workflow")).toBe(true);
			expect(document.title.toLowerCase()).toContain(
				(spec?.label ?? workflowId).toLowerCase(),
			);
			expect(document.inputSchema).toBeDefined();
			expect(Object.keys(document.inputSchema ?? {}).length).toBeGreaterThan(0);
			for (const type of Object.values(document.inputSchema ?? {})) {
				expect(type).toBeTypeOf("string");
			}
			if (document.throwbacks) {
				expect(document.throwbacks.every((throwback) => !!throwback)).toBe(
					true,
				);
			}
			if (document.routes) {
				expect(document.routes.every((route) => !!route)).toBe(true);
			}
			expect(document.skillTree?.root).toBeTypeOf("string");
			expect(document.skillTree?.nodes.length ?? 0).toBeGreaterThan(0);
		}
	});

	it("keeps Markdown workflow docs structurally complete", () => {
		for (const spec of WORKFLOW_SPECS) {
			const markdownFile = markdownFileForSpecKey(spec.key);
			const markdown = readFileSync(
				resolve(WORKFLOW_DOCS_DIR, markdownFile),
				"utf8",
			);
			const diagram = extractStateDiagram(markdown);
			const sequenceDiagram = extractSequenceDiagram(markdown);
			const renderedDiagram = workflowSpecToMermaid(spec);

			expect(
				diagram,
				`${spec.key} must include a state diagram`,
			).not.toBeNull();
			expect(markdown).toMatch(/^# .+ Workflow/mu);
			expect(diagram).toContain("stateDiagram-v2");
			expect(countTransitions(diagram ?? "")).toBeGreaterThan(0);
			expect(
				sequenceDiagram,
				`${spec.key} must include an execution sequence diagram`,
			).not.toBeNull();
			expect(sequenceDiagram).toContain("sequenceDiagram");
			expect(sequenceDiagram).toContain("participant");
			expect(renderedDiagram).toContain("stateDiagram-v2");
			expect(countTransitions(renderedDiagram)).toBe(spec.transitions.length);
		}
	});
});
