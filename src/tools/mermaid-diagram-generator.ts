/**
 * @deprecated This file has been refactored into a modular structure.
 * Use `import { mermaidDiagramGenerator } from "./mermaid/index.js"` instead.
 * This file is kept temporarily for backwards compatibility but will be removed in a future version.
 * See ADR-0002 for the refactoring rationale.
 */

import { z } from "zod";

// Optional runtime validation of generated diagrams using mermaid.parse (if installed)
type ValidateResult = { valid: boolean; error?: string; skipped?: boolean };

type MermaidParseLike = (code: string) => unknown | Promise<unknown>;

let cachedMermaidParse: MermaidParseLike | null = null;
let mermaidLoadPromise: Promise<MermaidParseLike> | null = null;
let mermaidLoadError: Error | null = null;
type MermaidModuleProvider = () => unknown | Promise<unknown>;
let customMermaidModuleProvider: MermaidModuleProvider | null = null;

function resetMermaidLoaderState(): void {
	cachedMermaidParse = null;
	mermaidLoadPromise = null;
	mermaidLoadError = null;
}

export function __setMermaidModuleProvider(
	provider: MermaidModuleProvider | null,
): void {
	customMermaidModuleProvider = provider;
	resetMermaidLoaderState();
}

function importMermaidModule(): Promise<unknown> {
	if (customMermaidModuleProvider) {
		return Promise.resolve(customMermaidModuleProvider());
	}
	return import("mermaid");
}

function extractMermaidParse(mod: unknown): MermaidParseLike | null {
	if (!mod) return null;
	if (typeof mod === "function") {
		return mod as MermaidParseLike;
	}
	if (typeof (mod as { parse?: unknown }).parse === "function") {
		const parse = (mod as { parse: MermaidParseLike }).parse;
		return parse.bind(mod);
	}
	const defaultExport = (mod as { default?: unknown }).default;
	if (typeof defaultExport === "function") {
		return defaultExport as MermaidParseLike;
	}
	if (
		defaultExport &&
		typeof (defaultExport as { parse?: unknown }).parse === "function"
	) {
		const parse = (defaultExport as { parse: MermaidParseLike }).parse;
		return parse.bind(defaultExport);
	}
	return null;
}

async function loadMermaidParse(): Promise<MermaidParseLike> {
	if (cachedMermaidParse) return cachedMermaidParse;
	if (mermaidLoadError) throw mermaidLoadError;
	if (!mermaidLoadPromise) {
		mermaidLoadPromise = importMermaidModule()
			.then((mod) => {
				const parse = extractMermaidParse(mod);
				if (!parse) {
					throw new Error("Mermaid parse function unavailable");
				}
				cachedMermaidParse = parse;
				return parse;
			})
			.catch((error) => {
				const err = error instanceof Error ? error : new Error(String(error));
				mermaidLoadError = err;
				mermaidLoadPromise = null;
				throw err;
			});
	}
	return mermaidLoadPromise;
}

async function validateDiagram(code: string): Promise<ValidateResult> {
	try {
		const parse = await loadMermaidParse();
		// Some versions expose parse async; wrap in Promise.resolve
		await Promise.resolve(parse(code));
		return { valid: true };
	} catch (err) {
		const msg = (err as Error).message || String(err);
		// If mermaid is not installed/available, or requires DOM environment, skip validation but allow diagram output
		if (
			/Cannot find module 'mermaid'|Cannot use import statement|module not found|DOMPurify|document is not defined|window is not defined|Mermaid parse function unavailable/i.test(
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
		"er",
		"journey",
		"quadrant",
		"git-graph",
		"mindmap",
		"timeline",
	]),
	theme: z.string().optional(),
	strict: z.boolean().optional().default(true), // if true, never emit invalid diagram; fallback if needed
	repair: z.boolean().optional().default(true), // attempt auto-repair on failure
	// Accessibility metadata (added as Mermaid comments to avoid requiring specific Mermaid versions)
	accTitle: z.string().optional(),
	accDescr: z.string().optional(),
	// Advanced customization options
	direction: z.enum(["TD", "TB", "BT", "LR", "RL"]).optional(), // flowchart direction
	customStyles: z.string().optional(), // custom CSS/styling directives
	advancedFeatures: z.record(z.unknown()).optional(), // type-specific advanced features
});

type MermaidDiagramInput = z.infer<typeof MermaidDiagramSchema>;

export async function mermaidDiagramGenerator(args: unknown) {
	const normalized = ((): unknown => {
		if (args && typeof args === "object" && args !== null) {
			const obj = args as Record<string, unknown>;
			// Handle legacy diagram type names
			if (obj.diagramType === "erDiagram") {
				return { ...obj, diagramType: "er" };
			}
			if (obj.diagramType === "graph") {
				return { ...obj, diagramType: "flowchart" };
			}
			if (obj.diagramType === "userJourney") {
				return { ...obj, diagramType: "journey" };
			}
			if (obj.diagramType === "gitgraph" || obj.diagramType === "gitGraph") {
				return { ...obj, diagramType: "git-graph" };
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
	const {
		description,
		diagramType,
		theme,
		direction,
		customStyles: _customStyles, // Reserved for future use
		advancedFeatures,
	} = input;

	switch (diagramType) {
		case "flowchart":
			return generateFlowchart(description, theme, direction);
		case "sequence":
			return generateSequenceDiagram(description, theme, advancedFeatures);
		case "class":
			return generateClassDiagram(description, theme, advancedFeatures);
		case "state":
			return generateStateDiagram(description, theme, advancedFeatures);
		case "gantt":
			return generateGanttChart(description, theme, advancedFeatures);
		case "pie":
			return generatePieChart(description, theme);
		case "er":
			return generateERDiagram(description, theme);
		case "journey":
			return generateUserJourney(description, theme);
		case "quadrant":
			return generateQuadrantChart(description, theme);
		case "git-graph":
			return generateGitGraph(description, theme);
		case "mindmap":
			return generateMindmap(description, theme);
		case "timeline":
			return generateTimeline(description, theme);
		default:
			return generateFlowchart(description, theme, direction);
	}
}

function generateFlowchart(
	description: string,
	theme?: string,
	direction?: string,
): string {
	const steps = extractSteps(description);
	const flowDirection = direction || "TD";
	const lines: string[] = [`flowchart ${flowDirection}`];
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

function generateSequenceDiagram(
	description: string,
	theme?: string,
	advancedFeatures?: Record<string, unknown>,
): string {
	const header: string[] = ["sequenceDiagram"];
	if (theme) header.unshift(`%%{init: {'theme':'${theme}'}}%%`);

	// Parse description to extract participants and interactions
	const { participants, interactions } = parseSequenceDescription(description);

	// Add participants
	if (participants.length > 0) {
		for (const p of participants) {
			header.push(`participant ${p.id} as ${p.name}`);
		}
	}

	// Add interactions
	if (interactions.length > 0) {
		for (const interaction of interactions) {
			header.push(interaction);
		}
	} else {
		// Fallback to default template if parsing fails
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

	// Add advanced features like loops, alt blocks, etc.
	if (advancedFeatures?.autonumber === true) {
		header.splice(1, 0, "autonumber");
	}

	return header.join("\n");
}

function generateClassDiagram(
	description: string,
	theme?: string,
	_advancedFeatures?: Record<string, unknown>,
): string {
	const lines: string[] = ["classDiagram"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

	// Parse description to extract classes and relationships
	const { classes, relationships } = parseClassDescription(description);

	if (classes.length > 0) {
		// Add parsed classes
		for (const cls of classes) {
			if (cls.properties.length > 0 || cls.methods.length > 0) {
				lines.push(`class ${cls.name} {`);
				for (const prop of cls.properties) {
					lines.push(`  ${prop}`);
				}
				for (const method of cls.methods) {
					lines.push(`  ${method}`);
				}
				lines.push("}");
			} else {
				lines.push(`class ${cls.name}`);
			}
		}

		// Add relationships
		for (const rel of relationships) {
			lines.push(rel);
		}
	} else {
		// Fallback to default template
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
	}

	return lines.join("\n");
}

function generateStateDiagram(
	description: string,
	theme?: string,
	_advancedFeatures?: Record<string, unknown>,
): string {
	const lines: string[] = ["stateDiagram-v2"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

	// Parse description to extract states and transitions
	const { states, transitions } = parseStateDescription(description);

	if (states.length > 0 && transitions.length > 0) {
		for (const transition of transitions) {
			lines.push(transition);
		}
	} else {
		// Fallback to default template
		lines.push(
			"[*] --> Idle",
			"Idle --> Processing : start",
			"Processing --> Complete : finish",
			"Processing --> Error : fail",
			"Complete --> [*]",
			"Error --> Idle : retry",
		);
	}

	return lines.join("\n");
}

function generateGanttChart(
	description: string,
	theme?: string,
	_advancedFeatures?: Record<string, unknown>,
): string {
	const lines: string[] = ["gantt"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

	// Parse description to extract tasks and timeline
	const { title, tasks } = parseGanttDescription(description);

	lines.push(`title ${title || "Project Timeline"}`);
	lines.push("dateFormat  YYYY-MM-DD");

	if (tasks.length > 0) {
		// Use parsed tasks
		const sections = new Map<string, string[]>();

		for (const task of tasks) {
			if (!sections.has(task.section)) {
				sections.set(task.section, []);
			}
			sections.get(task.section)?.push(task.line);
		}

		for (const [section, taskLines] of sections) {
			lines.push(`section ${section}`);
			for (const taskLine of taskLines) {
				lines.push(taskLine);
			}
		}
	} else {
		// Fallback to default template with dynamic dates
		const today = new Date();
		const formatDate = (date: Date) => date.toISOString().split("T")[0];

		const startDate = formatDate(today);
		const researchEnd = formatDate(
			new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
		);
		const designStart = formatDate(
			new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
		);
		const designEnd = formatDate(
			new Date(today.getTime() + 11 * 24 * 60 * 60 * 1000),
		);
		const implementationStart = formatDate(
			new Date(new Date(designEnd).getTime() + 1 * 24 * 60 * 60 * 1000),
		);
		const implementationEnd = formatDate(
			new Date(new Date(designEnd).getTime() + 11 * 24 * 60 * 60 * 1000),
		);
		const testingStart = formatDate(
			new Date(new Date(implementationEnd).getTime() + 1 * 24 * 60 * 60 * 1000),
		);
		const testingEnd = formatDate(
			new Date(new Date(implementationEnd).getTime() + 6 * 24 * 60 * 60 * 1000),
		);

		lines.push(
			"section Planning",
			`Research :done, research, ${startDate}, ${researchEnd}`,
			`Design :active, design, ${designStart}, ${designEnd}`,
			"section Development",
			`Implementation :impl, ${implementationStart}, ${implementationEnd}`,
			`Testing :test, ${testingStart}, ${testingEnd}`,
		);
	}

	return lines.join("\n");
}

function generatePieChart(description: string, theme?: string): string {
	const lines: string[] = [];
	if (theme) lines.push(`%%{init: {'theme':'${theme}'}}%%`);

	// Parse description to extract categories and values
	const { title, data } = parsePieDescription(description);

	lines.push(`pie title ${title || "Sample Distribution"}`);

	if (data.length > 0) {
		for (const item of data) {
			lines.push(`"${item.label}" : ${item.value}`);
		}
	} else {
		// Fallback to default template
		lines.push(
			'"Category A" : 45',
			'"Category B" : 30',
			'"Category C" : 15',
			'"Category D" : 10',
		);
	}

	return lines.join("\n");
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

// Parsing functions for different diagram types
function parseSequenceDescription(description: string): {
	participants: Array<{ id: string; name: string }>;
	interactions: string[];
} {
	const participants: Array<{ id: string; name: string }> = [];
	const interactions: string[] = [];
	const participantMap = new Map<string, string>();

	// Extract participant names (nouns that appear frequently or are explicitly mentioned)
	const words = description.toLowerCase().split(/\s+/);
	const commonParticipants = [
		"user",
		"system",
		"server",
		"client",
		"database",
		"api",
		"service",
		"admin",
		"customer",
	];

	let participantId = 65; // ASCII 'A'
	for (const word of words) {
		const clean = word.replace(/[^a-z]/g, "");
		if (commonParticipants.includes(clean) && !participantMap.has(clean)) {
			const id = String.fromCharCode(participantId++);
			const name = clean.charAt(0).toUpperCase() + clean.slice(1);
			participantMap.set(clean, id);
			participants.push({ id, name });
		}
	}

	// Extract interactions from sentences
	const sentences = description
		.split(/[.!?\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	for (const sentence of sentences) {
		const lower = sentence.toLowerCase();

		// Look for interaction patterns
		for (const [name1, id1] of participantMap) {
			for (const [name2, id2] of participantMap) {
				if (name1 !== name2) {
					// Check for various interaction patterns
					if (
						lower.includes(`${name1} sends`) ||
						lower.includes(`${name1} to ${name2}`)
					) {
						const action = extractAction(sentence);
						interactions.push(`${id1}->>${id2}: ${action}`);
					} else if (
						lower.includes(`${name2} responds`) ||
						lower.includes(`${name2} returns`)
					) {
						const action = extractAction(sentence);
						interactions.push(`${id2}-->>${id1}: ${action}`);
					}
				}
			}
		}
	}

	return { participants, interactions };
}

function parseClassDescription(description: string): {
	classes: Array<{ name: string; properties: string[]; methods: string[] }>;
	relationships: string[];
} {
	const classes: Array<{
		name: string;
		properties: string[];
		methods: string[];
	}> = [];
	const relationships: string[] = [];
	const classNames = new Set<string>();

	// Extract class names (capitalized words or explicit mentions)
	const words = description.split(/\s+/);
	for (const word of words) {
		const clean = word.replace(/[^a-zA-Z]/g, "");
		if (clean.length > 2 && clean[0] === clean[0].toUpperCase()) {
			classNames.add(clean);
		}
	}

	// Look for common class-related keywords
	const commonClasses = [
		"User",
		"Product",
		"Order",
		"Customer",
		"Account",
		"Item",
		"Service",
		"Manager",
	];
	for (const cls of commonClasses) {
		if (description.toLowerCase().includes(cls.toLowerCase())) {
			classNames.add(cls);
		}
	}

	// Create class definitions
	for (const name of classNames) {
		const properties: string[] = [];
		const methods: string[] = [];

		// Extract properties (look for "has", "contains", "with" patterns)
		const lower = description.toLowerCase();
		if (
			lower.includes(`${name.toLowerCase()} has`) ||
			lower.includes(`${name.toLowerCase()} contains`)
		) {
			properties.push("+String id");
			properties.push("+String name");
		}

		// Extract methods (look for action verbs)
		if (
			lower.includes(`${name.toLowerCase()} can`) ||
			lower.includes(`${name.toLowerCase()} does`)
		) {
			methods.push("+process()");
		}

		classes.push({ name, properties, methods });
	}

	// Extract relationships
	const classArray = Array.from(classNames);
	for (let i = 0; i < classArray.length - 1; i++) {
		const lower = description.toLowerCase();
		const cls1 = classArray[i].toLowerCase();
		const cls2 = classArray[i + 1].toLowerCase();

		if (
			lower.includes(`${cls1} has ${cls2}`) ||
			lower.includes(`${cls1} contains ${cls2}`)
		) {
			relationships.push(`${classArray[i]} --> ${classArray[i + 1]} : has`);
		} else if (
			lower.includes(`${cls1} uses ${cls2}`) ||
			lower.includes(`${cls1} depends on ${cls2}`)
		) {
			relationships.push(`${classArray[i]} --> ${classArray[i + 1]} : uses`);
		}
	}

	return { classes, relationships };
}

function parseStateDescription(description: string): {
	states: string[];
	transitions: string[];
} {
	const states: string[] = [];
	const transitions: string[] = [];
	const stateMap = new Map<string, string>();

	// Extract state names (look for status/state keywords)
	const commonStates = [
		"idle",
		"active",
		"processing",
		"complete",
		"error",
		"pending",
		"ready",
		"waiting",
		"done",
		"failed",
	];
	const words = description.toLowerCase().split(/\s+/);

	for (const word of words) {
		const clean = word.replace(/[^a-z]/g, "");
		if (commonStates.includes(clean) && !stateMap.has(clean)) {
			const stateName = clean.charAt(0).toUpperCase() + clean.slice(1);
			stateMap.set(clean, stateName);
			states.push(stateName);
		}
	}

	// Extract transitions from sentences
	const sentences = description
		.split(/[.!?\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	const stateArray = Array.from(stateMap.entries());

	if (stateArray.length > 0) {
		// Add initial state
		transitions.push(`[*] --> ${stateArray[0][1]}`);

		// Extract transitions between states
		for (const sentence of sentences) {
			const lower = sentence.toLowerCase();
			for (let i = 0; i < stateArray.length; i++) {
				for (let j = 0; j < stateArray.length; j++) {
					if (i !== j) {
						const [state1Key, state1Name] = stateArray[i];
						const [state2Key, state2Name] = stateArray[j];

						if (
							lower.includes(`${state1Key} to ${state2Key}`) ||
							lower.includes(`from ${state1Key} to ${state2Key}`)
						) {
							const trigger = extractTrigger(sentence);
							transitions.push(`${state1Name} --> ${state2Name} : ${trigger}`);
						}
					}
				}
			}
		}

		// Add final state if we have a complete or done state
		const finalStates = ["Complete", "Done", "Finished"];
		for (const state of states) {
			if (finalStates.includes(state)) {
				transitions.push(`${state} --> [*]`);
				break;
			}
		}
	}

	return { states, transitions };
}

function parseGanttDescription(description: string): {
	title: string;
	tasks: Array<{ section: string; line: string }>;
} {
	let title = "Project Timeline";
	const tasks: Array<{ section: string; line: string }> = [];

	// Extract title if mentioned
	if (description.toLowerCase().includes("project:")) {
		const match = description.match(/project:\s*([^.\n]+)/i);
		if (match) title = match[1].trim();
	}

	// Extract tasks (look for action verbs and time references)
	const sentences = description
		.split(/[.!?\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	const today = new Date();
	const formatDate = (date: Date) => date.toISOString().split("T")[0];

	let currentDate = today;
	let section = "Tasks";

	for (let i = 0; i < sentences.length; i++) {
		const sentence = sentences[i];
		const lower = sentence.toLowerCase();

		// Check for section keywords
		if (lower.includes("phase") || lower.includes("stage")) {
			section = sentence.split(/[:]/)[0].trim();
			continue;
		}

		// Extract task
		const taskName =
			sentence.length > 50 ? `${sentence.substring(0, 47)}...` : sentence;
		const startDate = formatDate(currentDate);
		const duration = 3 + Math.floor(Math.random() * 5); // 3-7 days
		const endDate = formatDate(
			new Date(currentDate.getTime() + duration * 24 * 60 * 60 * 1000),
		);

		const status = i === 0 ? "done" : i === 1 ? "active" : "";
		const statusPart = status ? `${status}, ` : "";

		tasks.push({
			section,
			line: `${taskName} :${statusPart}task${i}, ${startDate}, ${endDate}`,
		});

		// Move current date forward
		currentDate = new Date(
			currentDate.getTime() + (duration + 1) * 24 * 60 * 60 * 1000,
		);
	}

	return { title, tasks };
}

function parsePieDescription(description: string): {
	title: string;
	data: Array<{ label: string; value: number }>;
} {
	let title = "Distribution";
	const data: Array<{ label: string; value: number }> = [];

	// Extract title if mentioned
	const titleMatch = description.match(
		/(?:chart|distribution|breakdown)(?:\s+of|\s+for)?\s*:\s*([^.\n]+)/i,
	);
	if (titleMatch) title = titleMatch[1].trim();

	// Extract percentages or numbers
	const percentMatches = description.matchAll(/(\w+[\w\s]*?)[\s:]+(\d+)%/gi);
	for (const match of percentMatches) {
		data.push({ label: match[1].trim(), value: parseInt(match[2], 10) });
	}

	// Extract explicit counts
	if (data.length === 0) {
		const countMatches = description.matchAll(/(\d+)\s+(\w+[\w\s]*)/gi);
		const items: Array<{ label: string; value: number }> = [];
		for (const match of countMatches) {
			items.push({ label: match[2].trim(), value: parseInt(match[1], 10) });
		}

		// Convert to percentages
		if (items.length > 0) {
			const total = items.reduce((sum, item) => sum + item.value, 0);
			for (const item of items) {
				data.push({
					label: item.label,
					value: Math.round((item.value / total) * 100),
				});
			}
		}
	}

	return { title, data };
}

// New diagram type generators
function generateERDiagram(description: string, theme?: string): string {
	const lines: string[] = ["erDiagram"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

	// Extract entities and relationships
	const { entities: _entities, relationships } =
		parseERDescription(description);

	if (relationships.length > 0) {
		for (const rel of relationships) {
			lines.push(rel);
		}
	} else {
		// Fallback template
		lines.push(
			"CUSTOMER ||--o{ ORDER : places",
			"ORDER ||--|{ LINE-ITEM : contains",
			'PRODUCT ||--o{ LINE-ITEM : "ordered in"',
		);
	}

	return lines.join("\n");
}

function generateUserJourney(description: string, theme?: string): string {
	const lines: string[] = ["journey"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

	const { title, steps } = parseJourneyDescription(description);
	lines.push(`title ${title}`);

	if (steps.length > 0) {
		for (const step of steps) {
			lines.push(step);
		}
	} else {
		// Fallback template
		lines.push(
			"section Discover",
			"Find product: 5: User",
			"Read reviews: 3: User",
			"section Purchase",
			"Add to cart: 4: User",
			"Checkout: 2: User, System",
		);
	}

	return lines.join("\n");
}

function generateQuadrantChart(description: string, theme?: string): string {
	const lines: string[] = ["quadrantChart"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

	const { title, xAxis, yAxis, quadrants, points } =
		parseQuadrantDescription(description);

	lines.push(`title ${title}`);
	lines.push(`x-axis ${xAxis[0]} --> ${xAxis[1]}`);
	lines.push(`y-axis ${yAxis[0]} --> ${yAxis[1]}`);

	if (quadrants.length === 4) {
		lines.push(`quadrant-1 ${quadrants[0]}`);
		lines.push(`quadrant-2 ${quadrants[1]}`);
		lines.push(`quadrant-3 ${quadrants[2]}`);
		lines.push(`quadrant-4 ${quadrants[3]}`);
	}

	if (points.length > 0) {
		for (const point of points) {
			lines.push(point);
		}
	} else {
		// Fallback template
		lines.push("Item A: [0.3, 0.6]");
		lines.push("Item B: [0.7, 0.8]");
		lines.push("Item C: [0.2, 0.3]");
	}

	return lines.join("\n");
}

function generateGitGraph(description: string, theme?: string): string {
	const lines: string[] = ["gitGraph"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

	// Extract branch and commit info from description
	const { commits, branches: _branches } = parseGitDescription(description);

	if (commits.length > 0) {
		for (const commit of commits) {
			lines.push(commit);
		}
	} else {
		// Fallback template
		lines.push(
			'commit id: "Initial"',
			"branch develop",
			"checkout develop",
			'commit id: "Feature"',
			"checkout main",
			"merge develop",
			'commit id: "Release"',
		);
	}

	return lines.join("\n");
}

function generateMindmap(description: string, theme?: string): string {
	const lines: string[] = ["mindmap"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

	const { root, children } = parseMindmapDescription(description);

	lines.push(`  root((${root}))`);

	if (children.length > 0) {
		for (const child of children) {
			lines.push(child);
		}
	} else {
		// Fallback template
		lines.push(
			"    Topic 1",
			"      Subtopic 1.1",
			"      Subtopic 1.2",
			"    Topic 2",
			"      Subtopic 2.1",
		);
	}

	return lines.join("\n");
}

function generateTimeline(description: string, theme?: string): string {
	const lines: string[] = ["timeline"];
	if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

	const { title, events } = parseTimelineDescription(description);
	lines.push(`title ${title}`);

	if (events.length > 0) {
		for (const event of events) {
			lines.push(event);
		}
	} else {
		// Fallback template
		lines.push(
			"section 2024",
			"Q1 : Planning : Research",
			"Q2 : Development : Testing",
			"section 2025",
			"Q1 : Launch : Marketing",
		);
	}

	return lines.join("\n");
}

// Helper parsing functions for new diagram types
function parseERDescription(description: string): {
	entities: string[];
	relationships: string[];
} {
	const entities: string[] = [];
	const relationships: string[] = [];
	const lower = description.toLowerCase();

	// Extract entity names (capitalized words or explicit mentions)
	const words = description.split(/\s+/);
	const entitySet = new Set<string>();
	for (const word of words) {
		const clean = word.replace(/[^a-zA-Z]/g, "");
		if (clean.length > 2 && clean[0] === clean[0].toUpperCase()) {
			entitySet.add(clean.toUpperCase());
		}
	}

	entities.push(...entitySet);

	// Extract relationships
	const entArray = Array.from(entitySet);
	for (let i = 0; i < entArray.length - 1; i++) {
		const e1 = entArray[i].toLowerCase();
		const e2 = entArray[i + 1].toLowerCase();

		if (
			lower.includes(`${e1} has ${e2}`) ||
			lower.includes(`${e1} contains ${e2}`)
		) {
			relationships.push(`${entArray[i]} ||--o{ ${entArray[i + 1]} : has`);
		} else if (lower.includes(`${e1} belongs to ${e2}`)) {
			relationships.push(
				`${entArray[i]} }o--|| ${entArray[i + 1]} : "belongs to"`,
			);
		} else {
			relationships.push(`${entArray[i]} ||--o{ ${entArray[i + 1]} : relates`);
		}
	}

	return { entities, relationships };
}

function parseJourneyDescription(description: string): {
	title: string;
	steps: string[];
} {
	const title = description.split(/[.!?\n]/)[0] || "User Journey";
	const steps: string[] = [];

	const sentences = description
		.split(/[.!?\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0)
		.slice(1);
	let section = "Journey";

	for (const sentence of sentences) {
		if (
			sentence.toLowerCase().includes("section") ||
			sentence.toLowerCase().includes("phase")
		) {
			section = sentence.replace(/section|phase/gi, "").trim();
			steps.push(`section ${section}`);
		} else {
			const score = 3 + Math.floor(Math.random() * 3); // Random score 3-5
			const step =
				sentence.length > 30 ? `${sentence.substring(0, 27)}...` : sentence;
			steps.push(`${step}: ${score}: User`);
		}
	}

	return { title, steps };
}

function parseQuadrantDescription(description: string): {
	title: string;
	xAxis: [string, string];
	yAxis: [string, string];
	quadrants: string[];
	points: string[];
} {
	const title = "Priority Matrix";
	const xAxis: [string, string] = ["Low", "High"];
	const yAxis: [string, string] = ["Low", "High"];
	const quadrants: string[] = ["Plan", "Do", "Delegate", "Delete"];
	const points: string[] = [];

	// Extract items to plot
	const sentences = description
		.split(/[.!?\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	for (let i = 0; i < Math.min(sentences.length, 8); i++) {
		const item =
			sentences[i].length > 20
				? `${sentences[i].substring(0, 17)}...`
				: sentences[i];
		const x = (0.2 + Math.random() * 0.6).toFixed(1);
		const y = (0.2 + Math.random() * 0.6).toFixed(1);
		points.push(`${item}: [${x}, ${y}]`);
	}

	return { title, xAxis, yAxis, quadrants, points };
}

function parseGitDescription(description: string): {
	commits: string[];
	branches: string[];
} {
	const commits: string[] = [];
	const branches: string[] = [];

	const sentences = description
		.split(/[.!?\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	commits.push('commit id: "Initial"');

	for (let i = 0; i < Math.min(sentences.length, 5); i++) {
		const msg =
			sentences[i].length > 30
				? `${sentences[i].substring(0, 27)}...`
				: sentences[i];
		commits.push(`commit id: "${msg}"`);
	}

	return { commits, branches };
}

function parseMindmapDescription(description: string): {
	root: string;
	children: string[];
} {
	const sentences = description
		.split(/[.!?\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	const root = sentences[0] || "Main Topic";
	const children: string[] = [];

	for (let i = 1; i < Math.min(sentences.length, 6); i++) {
		const topic =
			sentences[i].length > 30
				? `${sentences[i].substring(0, 27)}...`
				: sentences[i];
		children.push(`    ${topic}`);
	}

	return { root, children };
}

function parseTimelineDescription(description: string): {
	title: string;
	events: string[];
} {
	const title = description.split(/[.!?\n]/)[0] || "Timeline";
	const events: string[] = [];

	const sentences = description
		.split(/[.!?\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0)
		.slice(1);

	let currentYear = new Date().getFullYear();
	let section = `section ${currentYear}`;
	events.push(section);

	for (let i = 0; i < sentences.length; i++) {
		if (i % 3 === 0 && i > 0) {
			currentYear++;
			section = `section ${currentYear}`;
			events.push(section);
		}
		const event =
			sentences[i].length > 40
				? `${sentences[i].substring(0, 37)}...`
				: sentences[i];
		events.push(event);
	}

	return { title, events };
}

// Helper functions for text extraction
function extractAction(sentence: string): string {
	const words = sentence.split(/\s+/);
	// Find verb and object
	const verbs = [
		"sends",
		"requests",
		"queries",
		"returns",
		"responds",
		"provides",
		"fetches",
	];
	for (const word of words) {
		if (verbs.includes(word.toLowerCase())) {
			const idx = words.indexOf(word);
			return words.slice(idx, idx + 3).join(" ");
		}
	}
	return "Request";
}

function extractTrigger(sentence: string): string {
	const triggers = [
		"start",
		"finish",
		"complete",
		"fail",
		"error",
		"success",
		"retry",
		"cancel",
	];
	const words = sentence.toLowerCase().split(/\s+/);
	for (const word of words) {
		if (triggers.includes(word)) {
			return word;
		}
	}
	return "event";
}
