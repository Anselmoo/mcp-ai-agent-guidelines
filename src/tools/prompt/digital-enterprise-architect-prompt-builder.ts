import { z } from "zod";
import { DEFAULT_MODEL } from "../config/model-config.js";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";

const EnterpriseArchitectPromptSchema = z.object({
	initiativeName: z
		.string()
		.describe("Name or focus of the architecture initiative"),
	problemStatement: z
		.string()
		.describe("Strategic problem or opportunity being addressed"),
	businessDrivers: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Key business objectives and desired outcomes"),
	currentLandscape: z
		.string()
		.optional()
		.describe("Summary of the current ecosystem, architecture, or processes"),
	targetUsers: z
		.string()
		.optional()
		.describe("Primary stakeholders or user segments"),
	differentiators: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Competitive advantages or innovation themes to emphasize"),
	constraints: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Notable constraints or guardrails the solution must respect"),
	complianceObligations: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Regulatory or policy considerations"),
	technologyGuardrails: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Existing platforms, standards, or preferred technologies"),
	innovationThemes: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Innovation vectors or experiments to pursue"),
	timeline: z
		.string()
		.optional()
		.describe("Expected timeline or horizon for the initiative"),
	researchFocus: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Topics that require real-time research and benchmarking"),
	decisionDrivers: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Decision drivers or evaluation criteria to emphasize"),
	knownRisks: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Known risks, assumptions, or watch items"),
	// Optional frontmatter controls
	mode: z.enum(["agent", "tool", "workflow"]).optional().default("agent"),
	model: z.string().optional().default(DEFAULT_MODEL),
	tools: z
		.array(z.string())
		.optional()
		.default(["vscode-websearch", "githubRepo", "mermaid"]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),
});

export type EnterpriseArchitectPromptInput = z.infer<
	typeof EnterpriseArchitectPromptSchema
>;

type Listish = string[] | undefined;

function sanitizeList(list: Listish): string[] {
	return (list ?? [])
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

function appendSection(
	lines: string[],
	title: string,
	bodyLines: string[],
): void {
	if (bodyLines.length === 0) {
		return;
	}
	lines.push(`## ${title}`);
	lines.push(...bodyLines);
	lines.push("");
}

function buildMentorPanelSection(): string[] {
	return [
		"### Design & Experience",
		"- **The Visionary Product-Mind** · Champions elegant end-to-end journeys that feel inevitable.",
		"- **The Human-Centered Designer** · Prioritizes inclusive interaction patterns and cognitive simplicity.",
		"",
		"### Software Architecture & Layout",
		"- **The Pragmatic Engineer** · Demands maintainable, well-factored components with sustainable velocity.",
		"- **The Domain-Driven Strategist** · Anchors the architecture in ubiquitous language and bounded contexts.",
		"- **The Microservices Guru** · Advocates for autonomous services, evolutionary scaling, and resilience.",
		"- **The Monolith Proponent** · Prefers cohesive deployments when coordination costs outweigh modularity gains.",
		"- **The API-First Architect** · Requires contract clarity, versioning discipline, and cross-channel composability.",
		"",
		"### Security",
		"- **The Zero-Trust Advocate** · Enforces identity-centric controls, least privilege, and explicit verification.",
		"- **The DevSecOps Champion** · Embeds security scanning, policy as code, and secure SDLC feedback loops.",
		"- **The Privacy Guardian** · Safeguards personal data, regulatory alignment, and ethical stewardship.",
		"",
		"### Operations & Reliability",
		"- **The Site Reliability Engineer (SRE)** · Optimizes for observability, toil reduction, and graceful degradation.",
		"- **The Cloud-Native Evangelist** · Promotes elastic, immutable infrastructure with platform automation.",
		"- **The FinOps Analyst** · Validates economic sustainability, usage optimization, and cost transparency.",
		"",
		"### Data & AI",
		"- **The Data-Driven Scientist** · Enables trustworthy data flows, analytics readiness, and ML observability.",
		"- **The AI Ethicist** · Surfaces fairness, bias, and responsible AI guardrails for intelligent features.",
		"- **The Distributed Systems Theorist** · Balances CAP trade-offs, state strategies, and performance envelopes.",
		"",
		"### Business & Strategy",
		"- **The Agile Methodologist** · Focuses on iterative delivery, feedback loops, and value stream alignment.",
		"- **The Open-Source Advocate** · Catalyzes community leverage, interoperability, and shared innovation.",
		"- **The Enterprise Futurist** · Projects 5–10 year implications, platform bets, and portfolio synergy.",
		"- **The Lean Startup Practitioner** · Pushes for MVP-first experiments and rapid market validation.",
	];
}

function formatBullets(label: string, values: string[]): string[] {
	if (values.length === 0) {
		return [];
	}
	const lines: string[] = [];
	lines.push(`- **${label}:**`);
	values.forEach((value) => {
		lines.push(`  - ${value}`);
	});
	return lines;
}

function buildEnterpriseArchitectPrompt(
	input: EnterpriseArchitectPromptInput,
): string {
	const lines: string[] = [];

	const businessDrivers = sanitizeList(input.businessDrivers);
	const differentiators = sanitizeList(input.differentiators);
	const constraints = sanitizeList(input.constraints);
	const compliance = sanitizeList(input.complianceObligations);
	const guardrails = sanitizeList(input.technologyGuardrails);
	const innovation = sanitizeList(input.innovationThemes);
	const research = sanitizeList(input.researchFocus);
	const decisionDrivers = sanitizeList(input.decisionDrivers);
	const risks = sanitizeList(input.knownRisks);

	lines.push(`# Enterprise Architect Mission`);
	lines.push("");
	lines.push(`## Initiative Overview`);
	lines.push(`- **Initiative:** ${input.initiativeName}`);
	lines.push(`- **Problem Focus:** ${input.problemStatement}`);
	if (input.currentLandscape) {
		lines.push(`- **Current Landscape:** ${input.currentLandscape}`);
	}
	if (input.targetUsers) {
		lines.push(`- **Primary Stakeholders:** ${input.targetUsers}`);
	}
	lines.push("");

	appendSection(lines, "Strategic Directives", [
		"1. Deliver a concise, executive-ready definition that links business outcomes to architectural intent.",
		"2. Incorporate state-of-the-art research by citing current benchmarks, reference architectures, and emerging tooling.",
		"3. Synthesize mentor perspectives into a single recommendation that transparently handles disagreement.",
		"4. Translate guidance into actionable, value-focused next steps for delivery teams.",
	]);

	const contextBullets = [
		...formatBullets("Business Drivers", businessDrivers),
		...formatBullets("Differentiators", differentiators),
	];
	if (input.timeline) {
		contextBullets.push(`- **Timeline Horizon:** ${input.timeline}`);
	}
	appendSection(lines, "Context Signals", contextBullets);

	const guardrailBullets = [
		...formatBullets("Constraints", constraints),
		...formatBullets("Compliance", compliance),
		...formatBullets("Technology Guardrails", guardrails),
		...formatBullets("Innovation Themes", innovation),
	];
	appendSection(lines, "Operating Guardrails", guardrailBullets);

	appendSection(lines, "Research and Evidence Requirements", [
		"- Validate recommendations with current industry sources (cloud provider roadmaps, CNCF landscape, analyst briefings).",
		"- Highlight peer architectures or open reference implementations when relevant.",
		"- Flag knowledge gaps that require additional discovery or expert interviews.",
		...(research.length
			? [
					"- Prioritize research emphasis on:",
					...research.map((topic) => `  - ${topic}`),
				]
			: []),
	]);

	appendSection(lines, "Decision Drivers", [
		...decisionDrivers.map((driver) => `- ${driver}`),
		...(decisionDrivers.length
			? [
					"- Explicitly weigh how each mentor viewpoint shifts the priority of these drivers.",
				]
			: [
					"- Explicitly weigh how each mentor viewpoint shifts the priority of cost, resiliency, time-to-market, and team flow.",
				]),
	]);

	appendSection(lines, "Virtual Mentor Panel", buildMentorPanelSection());

	appendSection(lines, "Trade-Off Playbook", [
		"- Document where mentor perspectives align and where they diverge; make tensions and mitigation strategies explicit.",
		"- When recommending a path, articulate why certain voices take precedence for this initiative.",
		"- Capture second-order effects (e.g., future operating costs vs. delivery speed) highlighted by the panel.",
	]);

	appendSection(lines, "Output Blueprint", [
		"1. **High-Level Summary** — Executive headline, core value proposition, business impact.",
		"2. **Architectural Recommendation** — Target architecture, patterns, platform choices, integration strategy.",
		"3. **Key Considerations & Trade-offs** — Mentor viewpoints, pros/cons, explicit tensions, rationale for decisions.",
		"4. **Security & Reliability Plan** — Zero-trust posture, DevSecOps pipeline, resiliency patterns, observability.",
		"5. **Next Steps** — Actionable plan with near-term experiments, decision gates, and success metrics.",
	]);

	appendSection(lines, "Risk and Watchlist", [
		...risks.map((risk) => `- ${risk}`),
		...(risks.length
			? ["- For each risk, map contingency owners and detection signals."]
			: ["- Track emerging risks surfaced during mentor synthesis."]),
	]);

	lines.push("## Delivery Notes");
	lines.push(
		"- Maintain a confident, advisory tone suitable for senior architecture councils.",
	);
	lines.push(
		"- Embed references or footnotes for external sources to support each strategic claim.",
	);
	lines.push(
		"- Provide optional callouts (🔍 Research Spotlight, ⚖️ Trade-off Ledger, 🛠️ Implementation Cue) when they reinforce clarity.",
	);
	lines.push("");

	return lines.join("\n");
}

function buildEnterpriseArchitectFrontmatter(
	input: EnterpriseArchitectPromptInput,
): string {
	const desc = `Enterprise Architect guidance for ${input.initiativeName}`;
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function enterpriseArchitectPromptBuilder(args: unknown) {
	const input = EnterpriseArchitectPromptSchema.parse(args);

	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const prompt = buildEnterpriseArchitectPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildEnterpriseArchitectFrontmatter(input)}\n`
		: "";
	const references = input.includeReferences
		? buildFurtherReadingSection([
				{
					title: "CNCF Cloud Native Landscape",
					url: "https://landscape.cncf.io/",
					description:
						"Interactive map of cloud-native open source projects and tools",
				},
				{
					title: "NIST Zero Trust Architecture",
					url: "https://csrc.nist.gov/publications/detail/sp/800-207/final",
					description:
						"Federal guidance on implementing zero-trust security frameworks (SP 800-207)",
				},
				{
					title: "Thoughtworks Technology Radar",
					url: "https://www.thoughtworks.com/radar",
					description: "Quarterly analysis of emerging technologies and trends",
				},
			])
		: "";
	const filenameHint = `${slugify(
		`${input.initiativeName}-enterprise-architect`,
	)}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_enterprise-architect-prompt-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🧠 Enterprise Architect Prompt\n\n${metadata}\n${prompt}\n\n${references ? `${references}\n` : ""}`,
			},
		],
	};
}
