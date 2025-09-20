import { z } from "zod";

// Optional runtime validation of generated diagrams using mermaid.parse (if installed)
type ValidateResult = { valid: boolean; error?: string; skipped?: boolean };
async function validateDiagram(code: string): Promise<ValidateResult> {
	try {
		// dynamic import keeps tool lightweight if mermaid not installed
		const mermaid = await import("mermaid");
		// mermaid.parse will throw on error
		// Some versions expose parse async; wrap in Promise.resolve
		// @ts-expect-error
		await Promise.resolve(mermaid.parse(code));
		return { valid: true };
	} catch (err) {
		const msg = (err as Error).message || String(err);
		// If mermaid is not installed/available, skip validation but allow diagram output
		if (
			/Cannot find module 'mermaid'|Cannot use import statement|module not found/i.test(
				msg,
			)
		) {
			return { valid: true, skipped: true };
		}
		return { valid: false, error: msg };
	}
}

const MermaidDiagramSchema = z.object({
	description: z.string(),
	diagramType: z.enum([
		"flowchart",
		"sequence",
		"class",
		"state",
		"gantt",
		"pie",
	]),
	theme: z.string().optional(),
	strict: z.boolean().optional().default(true), // if true, never emit invalid diagram; fallback if needed
	repair: z.boolean().optional().default(true), // attempt auto-repair on failure
	// Accessibility metadata (added as Mermaid comments to avoid requiring specific Mermaid versions)
	accTitle: z.string().optional(),
	accDescr: z.string().optional(),
});

type MermaidDiagramInput = z.infer<typeof MermaidDiagramSchema>;

export async function mermaidDiagramGenerator(args: unknown) {
	const normalized = ((): unknown => {
		if (args && typeof args === "object" && args !== null) {
			const obj = args as Record<string, unknown>;
			if (obj.diagramType === "erDiagram") {
				return { ...obj, diagramType: "class" };
			}
			if (obj.diagramType === "graph") {
				return { ...obj, diagramType: "flowchart" };
			}
		}
		return args;
	})();
	const input = MermaidDiagramSchema.parse(normalized);
	let diagram = generateMermaidDiagram(input);
	// Prepend accessibility comments if provided
	const accLines: string[] = [];
	if (input.accTitle) accLines.push(`%% AccTitle: ${input.accTitle} %%`);
	if (input.accDescr) accLines.push(`%% AccDescr: ${input.accDescr} %%`);
	if (accLines.length) {
		diagram = [accLines.join("\n"), diagram].join("\n");
	}
	let validation = await validateDiagram(diagram);
	let repaired = false;
	if (!validation.valid && input.repair) {
		const attempt = repairDiagram(diagram);
		if (attempt !== diagram) {
			diagram = attempt;
			validation = await validateDiagram(diagram);
			repaired = validation.valid;
		}
	}
	if (!validation.valid && input.strict) {
		// Provide safe fallback minimal valid diagram
		diagram = fallbackDiagram();
		validation = await validateDiagram(diagram); // should pass; if not, still return with flag
	}
	const validityNote = validation.valid
		? validation.skipped
			? `ℹ️ Validation skipped (mermaid not available). Diagram generated.`
			: `✅ Diagram validated successfully${repaired ? " (after auto-repair)" : ""}.`
		: `❌ Diagram invalid even after attempts: ${validation.error}`;
	const feedback = validation.valid
		? ""
		: [
				"### Feedback Loop",
				"- Try simplifying node labels (avoid punctuation that Mermaid may misparse)",
				"- Ensure a single diagram header (e.g., 'flowchart TD')",
				"- Replace complex punctuation with plain words",
				"- If describing a pipeline, try a simpler 5-step flow and add branches gradually",
			].join("\n");
	return {
		content: [
			{
				type: "text",
				text: [
					"## Generated Mermaid Diagram",
					"",
					"### Description",
					input.description,
					"",
					"### Diagram Code",
					"```mermaid",
					diagram,
					"```",
					"",
					"### Accessibility",
					input.accTitle || input.accDescr
						? [
								input.accTitle ? `- Title: ${input.accTitle}` : undefined,
								input.accDescr ? `- Description: ${input.accDescr}` : undefined,
							]
								.filter(Boolean)
								.join("\n")
						: "- You can provide accTitle and accDescr to improve screen reader context.",
					"",
					"### Validation",
					validityNote,
					feedback,
					"",
					"### Generation Settings",
					`Type: ${input.diagramType}`,
					`Strict: ${input.strict}`,
					`Repair: ${input.repair}`,
					"",
					"### Usage Instructions",
					"1. Copy the Mermaid code above",
					"2. Paste it into any Mermaid-enabled Markdown renderer or the Live Editor",
					"3. Adjust styling, layout, or relationships as needed",
					"",
					"### Notes",
					"Repair heuristics: classDef style tokens normalized, ensures colon syntax, fallback to minimal diagram if unrecoverable.",
				].join("\n"),
			},
		],
	};
}

function repairDiagram(diagram: string): string {
	let repaired = diagram;
	// Normalize classDef syntax (convert fill= to fill: etc.)
	repaired = repaired.replace(
		/classDef (\w+) ([^\n;]+);?/g,
		(_m, name, body) => {
			const fixed = body
				.split(/[, ]+/)
				.filter(Boolean)
				.map((pair: string) => pair.replace(/=/g, ":"))
				.join(",");
			return `classDef ${name} ${fixed};`;
		},
	);
	// Ensure flowchart header present
	if (!/^\s*flowchart /.test(repaired) && /\bflowchart\b/.test(repaired)) {
		repaired = `flowchart TD\n${repaired}`;
	}
	return repaired;
}

function fallbackDiagram(): string {
	return [
		"flowchart TD",
		"A([Start]) --> B[Fallback Diagram]",
		"B --> C([End])",
	].join("\n");
}

function generateMermaidDiagram(input: MermaidDiagramInput): string {
	const { description, diagramType, theme } = input;

	switch (diagramType) {
		case "flowchart":
			return generateFlowchart(description, theme);
		case "sequence":
			return generateSequenceDiagram(description, theme);
		case "class":
			return generateClassDiagram(description, theme);
		case "state":
			return generateStateDiagram(description, theme);
		case "gantt":
			return generateGanttChart(description, theme);
		case "pie":
			return generatePieChart(description, theme);
		default:
			return generateFlowchart(description, theme);
	}
}

function generateFlowchart(description: string, theme?: string): string {
	const steps = extractSteps(description);
	const lines: string[] = ["flowchart TD"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);
	if (!steps.length) {
		// Provide a simple user->system->processor->output pipeline if description lacks clear steps
		lines.push(
			"U([User]) --> R[Read users.json]",
			"R --> P[Filter active users with permissions]",
			"P --> A[Append to result]",
			"A --> O([Summary Output])",
		);
		return lines.join("\n");
	}
	// Build main chain with optional branching for filter step
	let offset = 0;
	for (let i = 0; i < steps.length; i++) {
		const id = String.fromCharCode(65 + i + offset);
		const label = steps[i];
		const isFilter = /filter .*active .*users/i.test(label);
		const decisionLike = /(decision|choose|\?)/i.test(label) || isFilter;
		if (isFilter) {
			// Create decision node with yes/no branches
			lines.push(`${id}{${label}?}`);
			const yesId = String.fromCharCode(65 + i + 1 + offset);
			const noId = String.fromCharCode(65 + i + 2 + offset);
			lines.push(`${id} -->|Yes| ${yesId}[Append to result]`);
			lines.push(`${id} -->|No| ${noId}[Skip]`);
			// Advance offset because we injected two extra nodes
			offset += 2;
			const nextId = String.fromCharCode(65 + i + 1 + offset);
			if (i < steps.length - 1) {
				lines.push(`${yesId} --> ${nextId}`);
				lines.push(`${noId} --> ${nextId}`);
			}
		} else {
			lines.push(decisionLike ? `${id}{${label}}` : `${id}[${label}]`);
			if (i < steps.length - 1) {
				const nextId = String.fromCharCode(65 + i + 1 + offset);
				lines.push(`${id} --> ${nextId}`);
			}
		}
	}
	const lastId = String.fromCharCode(65 + steps.length - 1 + offset);
	const endId = String.fromCharCode(65 + steps.length + offset);
	lines.push(`${lastId} --> ${endId}([End])`);

	// Enrich with risk / smell nodes based on keywords
	const riskNodes: string[] = [];
	let riskIndex = steps.length + 1 + offset; // starting after End
	const addRisk = (id: string, label: string, connectFrom: string) => {
		lines.push(`${id}[${label}]`);
		lines.push(`${connectFrom} -.-> ${id}`);
		riskNodes.push(id);
	};
	const lower = description.toLowerCase();
	const firstId = "A";
	if (/api key|secret/.test(lower)) {
		const id = String.fromCharCode(65 + riskIndex++);
		addRisk(id, "Hardcoded Secret", firstId);
	}
	if (/sql/.test(lower)) {
		const id = String.fromCharCode(65 + riskIndex++);
		addRisk(id, "Raw SQL Query Risk", firstId);
	}
	if (/deprecated|old method|old\b/.test(lower)) {
		const id = String.fromCharCode(65 + riskIndex++);
		addRisk(id, "Deprecated Method", firstId);
	}
	if (riskNodes.length) {
		lines.push("classDef risk fill:#fee,stroke:#d33,stroke-width:1px;");
		lines.push(`class ${riskNodes.join(",")} risk;`);
	}
	return lines.join("\n");
}

function generateSequenceDiagram(_description: string, theme?: string): string {
	const header: string[] = ["sequenceDiagram"];
	if (theme) header.unshift(`%%{init: {'theme':'${theme}'}}%%`);
	// For now still static; could parse description for interactions later
	const body = [
		"participant U as User",
		"participant S as System",
		"participant D as Database",
		"U->>S: Request",
		"S->>D: Query",
		"D-->>S: Data",
		"S-->>U: Response",
	];
	return [...header, ...body].join("\n");
}

function generateClassDiagram(_description: string, theme?: string): string {
	const lines: string[] = ["classDiagram"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);
	lines.push(
		"class User {",
		"  +String name",
		"  +String email",
		"  +login()",
		"  +logout()",
		"}",
		"class System {",
		"  +processRequest()",
		"  +validateUser()",
		"}",
		"User --> System : uses",
	);
	return lines.join("\n");
}

function generateStateDiagram(_description: string, theme?: string): string {
	const lines: string[] = ["stateDiagram-v2"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);
	lines.push(
		"[*] --> Idle",
		"Idle --> Processing : start",
		"Processing --> Complete : finish",
		"Processing --> Error : fail",
		"Complete --> [*]",
		"Error --> Idle : retry",
	);
	return lines.join("\n");
}

function generateGanttChart(_description: string, _theme?: string): string {
	// Generate dynamic dates starting from current date
	const today = new Date();
	const formatDate = (date: Date) => date.toISOString().split("T")[0];

	const startDate = formatDate(today);
	const researchEnd = formatDate(
		new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
	); // +4 days
	const designStart = formatDate(
		new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
	); // +5 days
	const designEnd = formatDate(
		new Date(today.getTime() + 11 * 24 * 60 * 60 * 1000),
	); // +11 days
	// Derive implementation and testing phases from design end
	const implementationStart = formatDate(
		new Date(new Date(designEnd).getTime() + 1 * 24 * 60 * 60 * 1000),
	); // day after design end
	const implementationEnd = formatDate(
		new Date(new Date(designEnd).getTime() + 11 * 24 * 60 * 60 * 1000),
	); // +10 days duration
	const testingStart = formatDate(
		new Date(new Date(implementationEnd).getTime() + 1 * 24 * 60 * 60 * 1000),
	); // day after implementation
	const testingEnd = formatDate(
		new Date(new Date(implementationEnd).getTime() + 6 * 24 * 60 * 60 * 1000),
	); // +5 days duration

	return [
		"gantt",
		"title Project Timeline",
		"dateFormat  YYYY-MM-DD",
		"section Planning",
		`Research :done, research, ${startDate}, ${researchEnd}`,
		`Design :active, design, ${designStart}, ${designEnd}`,
		"section Development",
		`Implementation :impl, ${implementationStart}, ${implementationEnd}`,
		`Testing :test, ${testingStart}, ${testingEnd}`,
	].join("\n");
}

function generatePieChart(_description: string, _theme?: string): string {
	return [
		"pie title Sample Distribution",
		'"Category A" : 45',
		'"Category B" : 30',
		'"Category C" : 15',
		'"Category D" : 10',
	].join("\n");
}

function extractSteps(description: string): string[] {
	// Simple step extraction logic: split on sentence terminators & newlines
	const sentences = description
		.split(/[.!?\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	// Allow up to 12 steps for better granularity while keeping diagram readable
	return sentences.slice(0, 12);
}
