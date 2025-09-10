import { z } from "zod";
import {
	buildMetadataSection,
	buildReferencesSection,
	slugify,
} from "../shared/prompt-utils.js";

// Supported gap analysis framework types
const SUPPORTED_GAP_FRAMEWORKS = [
	"capability",
	"performance",
	"maturity",
	"skills",
	"technology",
	"process",
	"market",
	"strategic",
	"operational",
	"cultural",
	"security",
	"compliance",
] as const;

type GapFrameworkId = (typeof SUPPORTED_GAP_FRAMEWORKS)[number];

const GapFrameworkSchema = z.object({
	// Analysis configuration
	frameworks: z.array(
		z.enum(
			SUPPORTED_GAP_FRAMEWORKS as unknown as [
				GapFrameworkId,
				...GapFrameworkId[],
			],
		),
	).min(1, "At least one framework must be specified"),
	// Current and desired states
	currentState: z.string(),
	desiredState: z.string(),
	// Context inputs
	context: z.string(),
	objectives: z.array(z.string()).optional(),
	timeframe: z.string().optional(),
	stakeholders: z.array(z.string()).optional(),
	constraints: z.array(z.string()).optional(),
	// Output controls
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	includeActionPlan: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
});

export async function gapFrameworksAnalyzers(args: unknown) {
	const input = GapFrameworkSchema.parse(args);

	const sections: string[] = [];

	// Overview
	sections.push(`# Gap Analysis Framework`);
	sections.push(`Context: ${input.context}`);
	sections.push(`Current State: ${input.currentState}`);
	sections.push(`Desired State: ${input.desiredState}`);

	if (input.objectives?.length)
		sections.push(`Objectives:\n- ${input.objectives.join("\n- ")}`);
	if (input.timeframe) sections.push(`Timeframe: ${input.timeframe}`);
	if (input.stakeholders?.length)
		sections.push(`Stakeholders:\n- ${input.stakeholders.join("\n- ")}`);
	if (input.constraints?.length)
		sections.push(`Constraints:\n- ${input.constraints.join("\n- ")}`);
	sections.push("");

	// Add each requested gap analysis framework
	for (const framework of input.frameworks) {
		const analysisSection = renderGapFramework(framework);
		sections.push(analysisSection);
	}

	// Action plan summary
	if (input.includeActionPlan) {
		sections.push(renderActionPlan());
	}

	// Metadata and references
	const filenameHint = `${slugify(`gap-analysis-${input.frameworks.join("-")}`)}.md`;
	const metadata = input.includeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_gap-frameworks-analyzers",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	const refs = input.includeReferences
		? buildReferencesSection(REFERENCE_LINKS)
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

function renderGapFramework(framework: GapFrameworkId): string {
	switch (framework) {
		case "capability":
			return section("Capability Gap Analysis", [
				"Map current capabilities vs required capabilities",
				"Identify capability maturity levels (basic, proficient, advanced, expert)",
				"Assess criticality and impact of each gap",
				"Estimate effort and resources required to close gaps",
				"Prioritize capabilities by business value and feasibility",
			]);
		case "performance":
			return section("Performance Gap Analysis", [
				"Define current performance metrics and benchmarks",
				"Establish target performance indicators",
				"Identify root causes of performance gaps",
				"Assess impact on business objectives",
				"Define improvement initiatives and expected outcomes",
			]);
		case "maturity":
			return section("Maturity Gap Analysis", [
				"Assess current maturity level (initial, managed, defined, quantitatively managed, optimizing)",
				"Define target maturity state",
				"Identify process, people, and technology gaps",
				"Map maturity improvement roadmap",
				"Define success criteria and measurement approach",
			]);
		case "skills":
			return section("Skills Gap Analysis", [
				"Inventory current team skills and competencies",
				"Define required skills for future state",
				"Identify skill gaps by role and function",
				"Assess training vs hiring needs",
				"Create skill development and acquisition plan",
			]);
		case "technology":
			return section("Technology Gap Analysis", [
				"Assess current technology stack and capabilities",
				"Define target technology architecture",
				"Identify technology gaps and legacy constraints",
				"Evaluate build vs buy vs partner options",
				"Create technology modernization roadmap",
			]);
		case "process":
			return section("Process Gap Analysis", [
				"Map current process flows and efficiency metrics",
				"Define optimized process design",
				"Identify process bottlenecks and improvement opportunities",
				"Assess automation and digitization potential",
				"Plan process transformation initiatives",
			]);
		case "market":
			return section("Market Gap Analysis", [
				"Analyze current market position and share",
				"Define target market opportunity",
				"Identify competitive positioning gaps",
				"Assess go-to-market capability gaps",
				"Develop market expansion strategy",
			]);
		case "strategic":
			return section("Strategic Gap Analysis", [
				"Compare current strategy vs desired strategic position",
				"Identify strategic initiative gaps",
				"Assess resource allocation and priorities",
				"Evaluate strategic capability requirements",
				"Define strategic transformation roadmap",
			]);
		case "operational":
			return section("Operational Gap Analysis", [
				"Assess current operational efficiency and effectiveness",
				"Define operational excellence targets",
				"Identify operational process and system gaps",
				"Evaluate cost structure and optimization opportunities",
				"Plan operational improvement initiatives",
			]);
		case "cultural":
			return section("Cultural Gap Analysis", [
				"Assess current organizational culture and values",
				"Define desired cultural attributes",
				"Identify cultural transformation requirements",
				"Evaluate change readiness and resistance factors",
				"Develop cultural change management plan",
			]);
		case "security":
			return section("Security Gap Analysis", [
				"Assess current security posture and controls",
				"Define security requirements and standards",
				"Identify vulnerability and compliance gaps",
				"Evaluate threat landscape and risk exposure",
				"Create security improvement roadmap",
			]);
		case "compliance":
			return section("Compliance Gap Analysis", [
				"Review current compliance status against regulations",
				"Identify regulatory and policy requirements",
				"Assess compliance framework gaps",
				"Evaluate risk and audit findings",
				"Develop compliance remediation plan",
			]);
		default:
			return section(`${framework} Gap Analysis`, [
				"Define current state assessment criteria",
				"Establish future state requirements",
				"Identify and prioritize gaps",
				"Develop improvement recommendations",
			]);
	}
}

function renderActionPlan(): string {
	return section("Gap Closure Action Plan", [
		"**Priority 1 (Critical)**: List immediate actions required",
		"**Priority 2 (Important)**: List medium-term initiatives",
		"**Priority 3 (Beneficial)**: List long-term improvements",
		"**Resource Requirements**: People, budget, technology, time",
		"**Success Metrics**: KPIs to measure gap closure progress",
		"**Risk Mitigation**: Identify and address implementation risks",
		"**Review Schedule**: Regular assessment and adjustment plan",
	]);
}

function section(title: string, bullets: string[]): string {
	return `## ${title}\n\n${bullets.map((b) => `- ${b}`).join("\n")}`;
}

const REFERENCE_LINKS = [
	"[Gap Analysis Best Practices](https://www.mindtools.com/pages/article/gap-analysis.htm)",
	"[McKinsey Capability Building](https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/building-capabilities-for-performance)",
	"[CMMI Maturity Models](https://cmmiinstitute.com/cmmi)",
	"[Strategic Gap Analysis Framework](https://www.strategyand.pwc.com/gx/en/insights/gap-analysis.html)",
	"[Performance Management Guide](https://www.shrm.org/resourcesandtools/tools-and-samples/toolkits/pages/performancemanagement.aspx)",
];
