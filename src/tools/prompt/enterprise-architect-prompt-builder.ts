import { z } from "zod";
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
	platformEngineeringRequirements: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Platform engineering and IDP capabilities needed"),
	aiGovernanceRequirements: z
		.array(z.string())
		.optional()
		.default([])
		.describe("AI governance, model registry, and responsible AI requirements"),
	sustainabilityTargets: z
		.array(z.string())
		.optional()
		.default([])
		.describe("ESG goals, carbon targets, or green IT objectives"),
	developerExperienceGoals: z
		.array(z.string())
		.optional()
		.default([])
		.describe(
			"Developer productivity, cognitive load, and DX improvement targets",
		),
	continuousArchitecturePractices: z
		.boolean()
		.optional()
		.default(false)
		.describe("Whether to emphasize continuous EA over static planning cycles"),
	// Optional frontmatter controls
	mode: z.enum(["agent", "tool", "workflow"]).optional().default("agent"),
	model: z.string().optional().default("GPT-4o"),
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
		"### Platform Engineering & Developer Experience",
		"- **The Platform Engineering Architect** · Champions Internal Developer Platforms (IDPs), golden paths, and developer self-service at scale.",
		"- **The Developer Experience (DX) Advocate** · Optimizes inner-loop velocity, cognitive load reduction, and frictionless workflows.",
		"- **The Continuous Architecture Practitioner** · Replaces static EA cycles with dynamic, iterative architecture evolution aligned to delivery cadence.",
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
		"- **The AI Governance Specialist** · Enforces model registries, EU AI Act compliance, responsible AI patterns, and algorithmic transparency.",
		"- **The Data Lineage Guardian** · Ensures traceability, auditable data flows, and governance across all analytical workloads.",
		"- **The Distributed Systems Theorist** · Balances CAP trade-offs, state strategies, and performance envelopes.",
		"- **The Digital Twin Strategist** · Leverages simulation, predictive modeling, and virtual replicas to test changes before production impact.",
		"",
		"### Sustainability & ESG",
		"- **The Sustainability Architect** · Embeds ESG metrics, carbon-aware computing, and green IT principles into every architectural decision.",
		"",
		"### Business & Strategy",
		"- **The Agile Methodologist** · Focuses on iterative delivery, feedback loops, and value stream alignment.",
		"- **The Value Stream Manager** · Shifts from project to product thinking, optimizing flow metrics and continuous value delivery.",
		"- **The Product-Centric Architect** · Designs around product teams, autonomy, and business outcomes rather than technical silos.",
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
	const platformRequirements = sanitizeList(
		input.platformEngineeringRequirements,
	);
	const aiGovRequirements = sanitizeList(input.aiGovernanceRequirements);
	const sustainabilityTargets = sanitizeList(input.sustainabilityTargets);
	const dxGoals = sanitizeList(input.developerExperienceGoals);

	const driverLabel = businessDrivers.length
		? businessDrivers.join("; ")
		: "the declared business outcomes";
	const constraintLabel = constraints.length
		? constraints.join("; ")
		: "explicitly confirmed architectural guardrails";
	const guardrailLabel = guardrails.length
		? guardrails.join("; ")
		: "platform and technology guardrails";
	const complianceLabel = compliance.length
		? compliance.join("; ")
		: "relevant compliance obligations";
	const decisionDriverLabel = decisionDrivers.length
		? decisionDrivers.join("; ")
		: "cost, resiliency, time-to-market, and team flow";
	const differentiatorLabel = differentiators.length
		? differentiators.join("; ")
		: "documented differentiators";
	const researchLabel = research.length
		? research.join("; ")
		: "open research questions that must be resolved";
	const riskLabel = risks.length
		? risks.join("; ")
		: "risks surfaced during analysis";
	const timelineInstruction = input.timeline
		? `Decisions must support the ${input.timeline} horizon.`
		: "State the assumed delivery cadence and review gates if not provided.";
	const landscapeInstruction = input.currentLandscape
		? `Contrast recommendations with the documented current landscape ("${input.currentLandscape}").`
		: "Document the current-state architecture or identify discovery gaps.";
	const stakeholderInstruction = input.targetUsers
		? `Ensure stakeholder alignment for ${input.targetUsers}.`
		: "Identify primary stakeholders and decision forums.";
	const differentiatorInstruction = differentiators.length
		? `Protect or amplify differentiators such as ${differentiatorLabel}.`
		: "Document which differentiators will be reinforced or created.";

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

	const missionCharter = [
		"- **Persona:** Operate as the lead enterprise architect accountable for aligning strategy, delivery, and operability.",
		`- **North Star Metrics:** Deliver outcomes tied to ${driverLabel}.`,
		`- **Guardrails:** Respect ${constraintLabel} and ${guardrailLabel}.`,
		`- **Stakeholder Alignment:** ${stakeholderInstruction}`,
		`- **Time Horizon:** ${timelineInstruction}`,
		`- **Differentiation Focus:** ${differentiatorInstruction}`,
	];
	appendSection(lines, "Mission Charter", missionCharter);

	const strategicDirectives = [
		`1. **Frame the mission context** — Connect recommendations to ${driverLabel} and articulate architectural intent in business language.`,
		`2. **Interrogate the current state** — ${landscapeInstruction}`,
		`3. **Evidence every recommendation** — Cite internal telemetry or external research; priorities topics such as ${researchLabel}.`,
		"4. **Translate to execution** — Provide sequenced next steps, accountable owners, and measurable success criteria that teams can adopt immediately.",
	];
	appendSection(lines, "Strategic Directives", strategicDirectives);

	const analysisWorkflow = [
		"1. **Baseline Assessment** — Map existing capabilities, integration points, and pain signals. Highlight architecture hotspots that block strategy.",
		`2. **Options Shaping** — Generate at least two architectural patterns and score each against ${decisionDriverLabel}.`,
		`3. **Impact Simulation** — Evaluate how proposals influence ${differentiatorLabel}. Quantify cost, risk, and delivery velocity implications.`,
		`4. **Implementation Traceability** — Outline dependencies, required enablers, change management steps, and platform guardrails (${guardrailLabel}).`,
		"5. **Feedback Loop Design** — Define metrics and review cadences to confirm the architecture delivers expected value once deployed.",
	];
	appendSection(lines, "Analysis Workflow", analysisWorkflow);

	const contextBullets = [
		...formatBullets("Business Drivers", businessDrivers),
		...formatBullets("Differentiators", differentiators),
	];
	if (input.timeline) {
		contextBullets.push(`- **Timeline Horizon:** ${input.timeline}`);
	}
	if (!contextBullets.length) {
		contextBullets.push(
			"- Document assumptions for business drivers, differentiators, stakeholders, and timeline before proceeding.",
		);
	}
	appendSection(lines, "Context Signals", contextBullets);

	const guardrailBullets = [
		...formatBullets("Constraints", constraints),
		...formatBullets("Compliance", compliance),
		...formatBullets("Technology Guardrails", guardrails),
		...formatBullets("Innovation Themes", innovation),
	];
	if (!guardrailBullets.length) {
		guardrailBullets.push(
			"- Confirm architectural constraints, compliance obligations, and technology standards with accountable stakeholders before recommending changes.",
		);
	}
	appendSection(lines, "Operating Guardrails", guardrailBullets);

	appendSection(lines, "Research and Evidence Requirements", [
		"- Validate recommendations with current industry sources (cloud provider roadmaps, CNCF landscape, analyst briefings, peer case studies).",
		"- Highlight comparable enterprise architectures or open reference implementations when relevant.",
		"- Flag knowledge gaps requiring discovery sprints or expert interviews, and assign owners and due dates.",
		...(research.length
			? [
					"- Priorities evidence gathering for:",
					...research.map((topic) => `  - ${topic}`),
				]
			: [
					"- Capture the open research questions that must be resolved before final approval.",
				]),
	]);

	appendSection(lines, "Decision Drivers", [
		...decisionDrivers.map((driver) => `- ${driver}`),
		`- Assess all solution options against ${decisionDriverLabel} using explicit scoring or weighting.`,
		"- Document the rationale for driver prioritization, including trade-offs introduced or deferred.",
	]);

	// New 2025 EA sections
	const platformSectionBullets = [
		`- **Golden Path Design** — Define self-service capabilities, templates, and guardrails that enable ${input.targetUsers ?? "development teams"} to ship without friction.`,
		"- **Cognitive Load Assessment** — Measure and minimize complexity exposed to developers; abstract infrastructure while preserving necessary context.",
		"- **Internal Developer Platform (IDP) Strategy** — If applicable, outline IDP components, adoption approach, and integration with existing toolchains.",
		...formatBullets("Platform Requirements", platformRequirements),
		...formatBullets("DX Goals", dxGoals),
	];
	if (
		platformSectionBullets.length > 3 ||
		platformRequirements.length ||
		dxGoals.length
	) {
		appendSection(
			lines,
			"Platform Engineering & Developer Experience",
			platformSectionBullets,
		);
	}

	const aiGovSectionBullets = [
		"- **Model Registry & Lineage** — Establish traceable catalogs of AI models, training data provenance, and deployment history.",
		"- **EU AI Act Compliance** — Classify AI systems by risk tier; implement documentation, testing, and governance controls mandated by regulation.",
		"- **Algorithmic Transparency** — Ensure explainability, bias detection, and human oversight mechanisms for automated decisions.",
		...formatBullets("AI Governance Requirements", aiGovRequirements),
	];
	if (aiGovSectionBullets.length > 3 || aiGovRequirements.length) {
		appendSection(lines, "AI Governance & Responsible AI", aiGovSectionBullets);
	}

	const sustainabilitySectionBullets = [
		"- **Carbon-Aware Architecture** — Select regions, scale policies, and workload patterns that minimize environmental impact.",
		"- **ESG Metrics Embedding** — Instrument architecture decisions with sustainability KPIs; report carbon footprint alongside cost and performance.",
		"- **Green IT Principles** — Optimize resource utilization, reduce waste, and align with corporate sustainability commitments.",
		...formatBullets("Sustainability Targets", sustainabilityTargets),
	];
	if (sustainabilitySectionBullets.length > 3 || sustainabilityTargets.length) {
		appendSection(
			lines,
			"Sustainability & ESG Integration",
			sustainabilitySectionBullets,
		);
	}

	const continuousArchSectionBullets = [
		input.continuousArchitecturePractices
			? "- **Dynamic EA Over Static Planning** — Architecture evolves iteratively with delivery cycles; decisions are reversible and evidence-based."
			: "- **Architecture Cadence** — Define review gates, decision points, and feedback loops aligned to delivery rhythm.",
		"- **Real-Time Insights** — Integrate architecture tooling with live telemetry, cost dashboards, and compliance monitors.",
		"- **Digital Twin Simulation** — Where applicable, model and test architectural changes in virtual environments before production rollout.",
	];
	if (
		input.continuousArchitecturePractices ||
		continuousArchSectionBullets.length
	) {
		appendSection(
			lines,
			"Continuous Architecture Practices",
			continuousArchSectionBullets,
		);
	}

	const mentorSection = [
		"- Facilitate a structured debate between the following virtual mentors. Capture alignment, dissent, and mitigation tactics.",
		"",
		...buildMentorPanelSection(),
		"",
		"- Summarize mentor positions in a comparison table covering value impact, risk exposure, delivery complexity, and confidence level.",
	];
	appendSection(lines, "Virtual Mentor Panel", mentorSection);

	appendSection(lines, "Trade-Off Playbook", [
		`- **Construct a trade-off matrix** comparing shortlisted options across ${decisionDriverLabel}.`,
		`- **Expose tensions and mitigations** — map how mentor perspectives and ${constraintLabel} influence the recommended choice.`,
		`- **Scenario test** solutions against ${riskLabel} and compliance obligations (${complianceLabel}); note residual risks and escalation paths.`,
	]);

	appendSection(lines, "Output Blueprint", [
		"1. **Executive Synopsis** — Headline the business value, architectural intent, and expected metrics in board-ready language.",
		"2. **Target State Architecture** — Provide narrative plus diagram callouts (C4 Level 1–2, integration maps, sequence diagrams) tied to decision drivers.",
		"3. **Trade-Off Ledger** — Table summarizing options, mentor positions, winning rationale, and mitigations for deferred choices.",
		`4. **Security, Compliance & Reliability** — Map controls to ${complianceLabel}, zero-trust posture, resilience patterns, and observability strategy.`,
		"5. **Execution Roadmap** — Phased backlog with milestones, dependencies, owner roles, KPIs, and review cadences.",
		"6. **Decision Log & Open Questions** — Capture decisions made, assumptions, follow-up research tasks, and approval checkpoints.",
	]);

	const riskSection = [
		...risks.map((risk) => `- ${risk}`),
		`- Evaluate systemic risks stemming from ${constraintLabel} and ${guardrailLabel}.`,
		"- Provide leading indicators, contingency owners, and escalation triggers for each risk.",
		`- Confirm residual risk acceptance with accountable stakeholders (${input.targetUsers ?? "documented owners"}).`,
	];
	if (!risks.length) {
		riskSection.unshift(
			"- Track emerging risks surfaced during mentor synthesis and analysis.",
		);
	}
	appendSection(lines, "Risk and Watchlist", riskSection);

	appendSection(lines, "Verification Checklist", [
		`- ✅ Each recommendation explicitly maps to ${driverLabel}.`,
		`- ✅ Compliance coverage addresses ${complianceLabel}.`,
		`- ✅ Technology choices respect ${guardrailLabel}.`,
		`- ✅ Trade-off matrix reflects mentor dissent and ${decisionDriverLabel}.`,
		"- ✅ Roadmap includes measurable KPIs, owners, and review cadences.",
		`- ✅ Research citations are provided for ${researchLabel}.`,
		"- ✅ Risks include mitigation owners, detection signals, and decision records.",
		...(platformRequirements.length || dxGoals.length
			? [
					"- ✅ Platform engineering and developer self-service strategy is documented.",
				]
			: []),
		...(aiGovRequirements.length
			? [
					"- ✅ AI governance controls meet specified regulatory requirements (e.g., EU AI Act).",
				]
			: []),
		...(sustainabilityTargets.length
			? [
					"- ✅ Sustainability impact is measured and aligned with ESG commitments.",
				]
			: []),
		...(dxGoals.length
			? [
					"- ✅ Developer experience improvements are quantified with before/after metrics.",
				]
			: []),
		...(input.continuousArchitecturePractices
			? [
					"- ✅ Architecture practices support continuous delivery and rapid iteration.",
				]
			: []),
		...(aiGovRequirements.length
			? [
					"- ✅ Data lineage and traceability are established for analytical workloads.",
				]
			: []),
	]);

	lines.push("## Delivery Notes");
	lines.push(
		"- Maintain a confident, advisory tone suitable for senior architecture councils while remaining transparent about uncertainties.",
	);
	lines.push(
		"- Use structured tables, numbered steps, and diagrams so reasoning and traceability are auditable.",
	);
	lines.push(
		"- Embed references or footnotes for external sources (match the References section IDs) to support strategic claims.",
	);
	lines.push(
		"- Close with explicit decision requests, required approvals, and next review checkpoints.",
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
					title: "Software Engineering at Google",
					url: "https://abseil.io/resources/swe-book",
					description:
						"Comprehensive guide to Google's engineering practices for sustainable codebases",
				},
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
					title: "TOGAF 10 Standard",
					url: "https://www.opengroup.org/togaf",
					description:
						"Enterprise architecture framework for business and IT alignment",
				},
				{
					title: "Open Agile Architecture",
					url: "https://pubs.opengroup.org/architecture/o-aa-standard/",
					description: "Standard for agile enterprise architecture practices",
				},
				{
					title: "EU AI Act Compliance Framework",
					url: "https://artificialintelligenceact.eu/",
					description: "Guidelines for complying with European AI regulations",
				},
				{
					title: "Platform Engineering Maturity Model",
					url: "https://platformengineering.org/",
					description:
						"Framework for assessing and improving platform engineering capabilities",
				},
				{
					title: "Internal Developer Platform Guides",
					url: "https://internaldeveloperplatform.org/",
					description: "Best practices for building developer platforms",
				},
				{
					title: "Thoughtworks Technology Radar",
					url: "https://www.thoughtworks.com/radar",
					description: "Quarterly analysis of emerging technologies and trends",
				},
				{
					title: "Microsoft Cloud Adoption Framework",
					url: "https://learn.microsoft.com/azure/cloud-adoption-framework/",
					description: "Guidance for cloud migration and modernization",
				},
				{
					title: "Google Cloud Architecture Framework",
					url: "https://cloud.google.com/architecture/framework",
					description:
						"Best practices for designing cloud applications on Google Cloud",
				},
				{
					title: "Principles of Green Software Engineering",
					url: "https://principles.green/",
					description:
						"Guidelines for building sustainable, energy-efficient software",
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
