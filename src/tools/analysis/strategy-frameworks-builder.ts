import { z } from "zod";
import {
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";

// Aliases for compliance (avoid using trademarks explicitly in variable/API names)
const ALIASES = {
	gartnerQuadrant: "analyst-mq", // Gartner Magic Quadrant
	mckinsey7S: "consulting-7s", // McKinsey 7S
	bcgMatrix: "portfolio-gsm", // BCG Growth-Share Matrix
} as const;

const SUPPORTED = [
	"asIsToBe",
	"whereToPlayHowToWin",
	"balancedScorecard",
	"swot",
	"objectives",
	"portersFiveForces",
	"mckinsey7S",
	"marketAnalysis",
	"strategyMap",
	"visionToMission",
	"stakeholderTheory",
	"values",
	"gapAnalysis",
	"ansoffMatrix",
	"pest",
	"bcgMatrix",
	"blueOcean",
	"scenarioPlanning",
	"vrio",
	"goalBasedPlanning",
	"gartnerQuadrant",
] as const;

type FrameworkId = (typeof SUPPORTED)[number];

const PointSchema = z.object({
	label: z.string(),
	x: z.number().min(0).max(1),
	y: z.number().min(0).max(1),
	radius: z.number().optional(),
	color: z.string().optional(),
});

type Point = z.infer<typeof PointSchema>;

const StrategyFrameworkSchema = z.object({
	// One or more frameworks to include in the analysis builder
	frameworks: z.array(
		z.enum(SUPPORTED as unknown as [FrameworkId, ...FrameworkId[]]),
	),
	// Domain inputs
	context: z.string(),
	objectives: z.array(z.string()).optional(),
	market: z.string().optional(),
	stakeholders: z.array(z.string()).optional(),
	constraints: z.array(z.string()).optional(),
	// Output controls
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	includeDiagrams: z.boolean().optional().default(false),
	inputFile: z.string().optional(),
	// Optional structured points keyed by framework id. Each entry is an array of points
	// with x/y values in the 0..1 range (Mermaid quadrantChart requirement).
	points: z.record(z.array(PointSchema)).optional(),
});

export async function strategyFrameworksBuilder(args: unknown) {
	const input = StrategyFrameworkSchema.parse(args);

	const sections: string[] = [];

	// Overview
	sections.push(`# Strategy Toolkit Overview`);
	sections.push(`Context: ${input.context}`);
	if (input.objectives?.length)
		sections.push(`Objectives:\n- ${input.objectives.join("\n- ")}`);
	if (input.stakeholders?.length)
		sections.push(`Stakeholders:\n- ${input.stakeholders.join("\n- ")}`);
	if (input.constraints?.length)
		sections.push(`Constraints:\n- ${input.constraints.join("\n- ")}`);
	if (input.market) sections.push(`Market scope: ${input.market}`);
	sections.push("");

	// Add each requested framework section
	for (const fw of input.frameworks) {
		const txt = renderFramework(fw);
		sections.push(txt);
		if (input.includeDiagrams) {
			const diag = renderDiagram(fw, input.points);
			if (diag) sections.push(diag);
		}
	}

	// Metadata and references
	const filenameHint = `${slugify(
		`strategy-${input.frameworks.join("-")}`,
	)}.md`;
	const metadata = input.includeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_strategy-frameworks-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	const refs = input.includeReferences
		? buildFurtherReadingSection(REFERENCE_LINKS)
		: "";

	const body = [metadata, sections.join("\n\n"), refs]
		.filter(Boolean)
		.join("\n\n");

	return {
		content: [
			{
				type: "text",
				text: body,
			},
		],
	};
}

function renderFramework(fw: FrameworkId): string {
	switch (fw) {
		case "asIsToBe":
			return section("As-Is vs. To-Be", [
				"Describe current state (processes, org, tech, KPIs)",
				"Define target state with measurable outcomes",
				"Identify capability gaps and enablers",
				"Outline transition roadmap with milestones",
			]);
		case "whereToPlayHowToWin":
			return section("Where to Play / How to Win", [
				"Define arenas (segments, geos, channels)",
				"Define unique value proposition and differentiators",
				"Specify capabilities and systems required",
				"List management systems/metrics to sustain advantage",
			]);
		case "balancedScorecard":
			return section(
				"Balanced Scorecard",
				withArtifacts(
					[
						"Objectives across Financial, Customer, Internal, Learning & Growth",
						"Measures/KPIs for each objective",
						"Initiatives mapped to objectives",
						"RAG status and owners",
					],
					{
						deliverable:
							"Deliverable: Balanced Scorecard matrix with metrics & owners",
						owner: "Owner: Strategy/Finance lead",
						kpis: "Financial: revenue growth %, Customer: NPS, Internal: cycle time",
					},
				),
			);
		case "swot":
			return section("SWOT Analysis", [
				"Strengths (internal)",
				"Weaknesses (internal)",
				"Opportunities (external)",
				"Threats (external)",
			]);
		case "objectives":
			return section(
				"Objectives & Key Results (OKR-compatible)",
				withArtifacts(
					[
						"Define 3-5 Objectives (qualitative)",
						"Attach 2-4 Key Results per Objective (quantitative)",
						"Define initiatives and owners",
						"Set review cadence",
					],
					{
						deliverable:
							"Deliverable: OKR tracker (sheet/board) and quarterly review notes",
						owner: "Owner: Product/Strategy lead",
						kpis: "KR examples: +20% ARR, reduce churn to 5%",
					},
				),
			);
		case "portersFiveForces":
			return section("Industry Forces (Five Forces)", [
				"Competitive Rivalry",
				"Threat of New Entrants",
				"Threat of Substitutes",
				"Bargaining Power of Suppliers",
				"Bargaining Power of Buyers",
			]);
		case "mckinsey7S":
			return aliasSection("7S Organizational Alignment", ALIASES.mckinsey7S, [
				"Strategy, Structure, Systems",
				"Shared Values, Skills, Style, Staff",
				"Identify misalignments and actions",
			]);
		case "marketAnalysis":
			return section(
				"Market Analysis",
				withArtifacts(
					[
						"Market size, growth, segmentation",
						"Customer needs and jobs-to-be-done",
						"Competitor landscape and positioning",
						"Regulatory/tech trends",
					],
					{
						deliverable: "Deliverable: TAM/SAM/TOM estimates + competitor map",
						owner: "Owner: Market/Strategy analyst",
						kpis: "Market: CAGR, Share %, conversion rates",
					},
				),
			);
		case "strategyMap":
			return section("Strategy Map", [
				"Link objectives cause→effect (Learning→Internal→Customer→Financial)",
				"Show dependencies and leading/lagging indicators",
			]);
		case "visionToMission":
			return section("From Vision to Mission", [
				"Vision: future state and aspiration",
				"Mission: purpose and scope",
				"Values: behaviors and decision principles",
			]);
		case "stakeholderTheory":
			return section(
				"Stakeholder Mapping",
				withArtifacts(
					[
						"Identify stakeholders by influence/interest",
						"Map expectations, value exchanges, risks",
						"Engagement plan and communications",
					],
					{
						deliverable:
							"Deliverable: Stakeholder map (matrix) and engagement plan",
						owner: "Owner: Program/PM lead",
						kpis: "Engagement: response rate, satisfaction score",
					},
				),
			);
		case "values":
			return section(
				"Values & Principles",
				withArtifacts(
					[
						"Define core values",
						"Decision guardrails and trade-off rules",
						"Principles for product, go-to-market, and operations",
					],
					{
						deliverable: "Deliverable: Values doc with behavioral examples",
						owner: "Owner: People/HR or Exec sponsor",
						kpis: "Culture: eNPS, value adoption indicators",
					},
				),
			);
		case "gapAnalysis":
			return section("Gap Analysis", [
				"Baseline vs target for key capabilities",
				"People/process/tech gaps",
				"Remediation initiatives and sequencing",
			]);
		case "ansoffMatrix":
			return section(
				"Growth Options (Ansoff)",
				withArtifacts(
					[
						"Market Penetration, Market Development",
						"Product Development, Diversification",
						"Risk/return summary per option",
					],
					{
						deliverable: "Deliverable: Ansoff map with candidate initiatives",
						owner: "Owner: Growth/Product lead",
						kpis: "Candidate metrics: revenue impact, time to market",
					},
				),
			);
		case "pest":
			return section(
				"PEST Analysis",
				withArtifacts(["Political", "Economic", "Social", "Technological"], {
					deliverable: "Deliverable: PEST register with time horizons",
					owner: "Owner: Strategy/Policy analyst",
					kpis: "Indicators: regulatory changes count, macro economic signals",
				}),
			);
		case "bcgMatrix":
			return aliasSection("Portfolio Prioritization", ALIASES.bcgMatrix, [
				"Classify units: Stars, Cash Cows, Question Marks, Dogs",
				"Investment/divestment policy",
			]);
		case "blueOcean":
			return section("Blue Ocean Moves", [
				"Eliminate-Reduce-Raise-Create grid",
				"Non-customer segments and new value curves",
			]);
		case "scenarioPlanning":
			return section("Scenario Planning", [
				"Key uncertainties and drivers",
				"2x2 or cone of plausibility scenarios",
				"Leading indicators and trigger points",
			]);
		case "vrio":
			return section("VRIO Assessment", [
				"List resources/capabilities",
				"Evaluate: Valuable, Rare, Inimitable, Organized",
				"Implication: Competitive disadvantage→Parity→Advantage→Sustained",
			]);
		case "goalBasedPlanning":
			return section("Goal-based Strategy", [
				"North-star goal and horizon",
				"Annual/quarterly goals",
				"Metrics and checkpoints",
			]);
		case "gartnerQuadrant":
			return aliasSection("Market Position Snapshot", ALIASES.gartnerQuadrant, [
				"Axes: Completeness of Vision vs Ability to Execute",
				"Position current and target state",
				"Implications for buyers and roadmap",
			]);
		default:
			return section("Framework", ["Not implemented"]);
	}
}

function section(title: string, bullets: string[]): string {
	return [`## ${title}`, ...bullets.map((b) => `- ${b}`)].join("\n");
}

function aliasSection(title: string, alias: string, bullets: string[]): string {
	return [`## ${title} (${alias})`, ...bullets.map((b) => `- ${b}`)].join("\n");
}

// Small enrichment helper: append common artifacts to make sections actionable.
function withArtifacts(
	bullets: string[],
	opts?: { deliverable?: string; owner?: string; kpis?: string },
): string[] {
	const out = [...bullets];
	out.push(
		opts?.deliverable ??
			"Suggested deliverable: Strategy artifact (doc/board) with owners & timeline",
	);
	out.push(
		opts?.owner ??
			"Suggested owner(s): Product/Strategy lead (assign an owner)",
	);
	out.push(
		opts?.kpis ??
			"Suggested KPIs: define 2-3 measurable indicators (examples below)",
	);
	return out;
}

const REFERENCE_LINKS = [
	{
		title: "Atlassian Strategy Frameworks",
		url: "https://www.atlassian.com/work-management/strategic-planning/framework",
		description: "Comprehensive guide to strategic planning frameworks",
	},
	{
		title: "20 Strategic Planning Models",
		url: "https://www.clearpointstrategy.com/blog/strategic-planning-models",
		description: "ClearPoint's overview of popular strategy frameworks",
	},
	{
		title: "Strategic Frameworks Comparison",
		url: "https://bscdesigner.com/strategic-frameworks-comparison.htm",
		description:
			"Comprehensive guide to SWOT, VRIO, BSC, and other strategic frameworks",
	},
	{
		title: "HBS Strategy Frameworks and Tools",
		url: "https://online.hbs.edu/blog/post/strategy-frameworks-and-tools",
		description: "Harvard Business School overview of strategy tools",
	},
];

// Mermaid helpers (keep neutral, no trademarks spelled out in titles)
function formatPointLine(p: Point): string {
	// Mermaid quadrantChart accepts lines like: Label: [x, y]
	return `${p.label}: [${p.x}, ${p.y}]`;
}

function renderDiagram(
	fw: FrameworkId,
	pointsRecord?: Record<string, Point[]>,
): string | undefined {
	const provided = pointsRecord?.[fw];
	switch (fw) {
		case "swot":
			return [
				"```mermaid",
				"flowchart TB",
				"  subgraph Internal",
				"    S[Strengths]:::good",
				"    W[Weaknesses]:::risk",
				"  end",
				"  subgraph External",
				"    O[Opportunities]:::good",
				"    T[Threats]:::risk",
				"  end",
				"  classDef good fill:#c6f6d5,stroke:#22543d;",
				"  classDef risk fill:#fed7d7,stroke:#742a2a;",
				"```",
			].join("\n");
		case "ansoffMatrix":
			return [
				"```mermaid",
				"quadrantChart",
				"  title Growth Options",
				"  x-axis Existing Markets --> New Markets",
				"  y-axis Existing Products --> New Products",
				"  quadrant-1 Diversification",
				"  quadrant-2 Product Development",
				"  quadrant-3 Market Development",
				"  quadrant-4 Market Penetration",
				// sample placeholder points (id: [x, y]) - values 0..1 range
				// use provided structured points if present, otherwise fall back to placeholders
				...(provided?.length
					? provided.map((p) => formatPointLine(p))
					: [
							"Example A: [0.25, 0.75]",
							"Example B: [0.6, 0.35]",
							"Example C: [0.85, 0.15]",
						]),
				"```",
			].join("\n");
		case "bcgMatrix":
			return [
				"```mermaid",
				"quadrantChart",
				"  title Portfolio View",
				"  x-axis Low Share --> High Share",
				"  y-axis Low Growth --> High Growth",
				"  quadrant-1 Stars",
				"  quadrant-2 Question Marks",
				"  quadrant-3 Dogs",
				"  quadrant-4 Cash Cows",
				// example product positions (id: [share, growth])
				...(provided?.length
					? provided.map((p) => formatPointLine(p))
					: [
							"Example A: [0.78, 0.9]",
							"Example B: [0.45, 0.3]",
							"Example C: [0.15, 0.2]",
						]),
				"```",
			].join("\n");
		case "pest":
			return [
				"```mermaid",
				"mindmap",
				"  root((PEST))",
				"    Political",
				"    Economic",
				"    Social",
				"    Technological",
				"```",
			].join("\n");
		case "strategyMap":
			return [
				"```mermaid",
				"flowchart TB",
				"  L[Learning & Growth] --> I[Internal Processes] --> C[Customer] --> F[Financial]",
				"```",
			].join("\n");
		case "gartnerQuadrant":
			return [
				"```mermaid",
				"quadrantChart",
				"  title Market Position Snapshot",
				"  x-axis Low Execute --> High Execute",
				"  y-axis Low Vision --> High Vision",
				"  quadrant-1 Leaders",
				"  quadrant-2 Visionaries",
				"  quadrant-3 Niche Players",
				"  quadrant-4 Challengers",
				// sample vendor positions (id: [execute, vision])
				...(provided?.length
					? provided.map((p) => `  ${formatPointLine(p)}`)
					: [
							"  Example A: [0.3, 0.6]",
							"  Example B: [0.45, 0.23]",
							"  Example C: [0.57, 0.69]",
						]),
				"```",
			].join("\n");
		case "balancedScorecard":
			return [
				"```mermaid",
				"flowchart TB",
				"  Financial[Financial]\n  Customer[Customer]\n  Internal[Internal Processes]\n  Learning[Learning & Growth]",
				"  Learning --> Internal",
				"  Internal --> Customer",
				"  Customer --> Financial",
				"  classDef perf fill:#e6fffa,stroke:#0f766e;",
				"  classDef goal fill:#fff7ed,stroke:#92400e;",
				"```",
			].join("\n");
		case "visionToMission":
			return [
				"```mermaid",
				"flowchart LR",
				"  V[Vision]\n  M[Mission]\n  P[Principles/Values]\n  O[Objectives]",
				"  V --> M",
				"  M --> P",
				"  P --> O",
				"  style V fill:#c7d2fe,stroke:#4338ca;",
				"  style M fill:#bfdbfe,stroke:#1e40af;",
				"```",
			].join("\n");
		default:
			return undefined;
	}
}
