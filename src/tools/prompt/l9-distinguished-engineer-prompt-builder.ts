import { z } from "zod";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";

const L9DistinguishedEngineerPromptSchema = z.object({
	projectName: z
		.string()
		.describe("Name of the software project or system initiative"),
	technicalChallenge: z
		.string()
		.describe(
			"Core technical problem, architectural complexity, or scale challenge being addressed",
		),
	technicalDrivers: z
		.array(z.string())
		.optional()
		.default([])
		.describe(
			"Key technical objectives: performance targets, scalability goals, reliability requirements",
		),
	currentArchitecture: z
		.string()
		.optional()
		.describe(
			"Existing system architecture, tech stack, and known pain points",
		),
	userScale: z
		.string()
		.optional()
		.describe(
			"Scale context: users, requests/sec, data volume, geographical distribution",
		),
	technicalDifferentiators: z
		.array(z.string())
		.optional()
		.default([])
		.describe(
			"Technical innovations, performance advantages, or unique capabilities to preserve/create",
		),
	engineeringConstraints: z
		.array(z.string())
		.optional()
		.default([])
		.describe(
			"Technical constraints: latency budgets, backward compatibility, migration windows",
		),
	securityRequirements: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Security, privacy, and compliance requirements"),
	techStack: z
		.array(z.string())
		.optional()
		.default([])
		.describe(
			"Current/preferred technologies, languages, frameworks, and platforms",
		),
	experimentationAreas: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Emerging technologies or patterns worth prototyping"),
	deliveryTimeline: z
		.string()
		.optional()
		.describe("Engineering timeline: sprints, milestones, or release windows"),
	benchmarkingFocus: z
		.array(z.string())
		.optional()
		.default([])
		.describe(
			"Systems/companies to benchmark against or research areas requiring investigation",
		),
	tradeoffPriorities: z
		.array(z.string())
		.optional()
		.default([])
		.describe(
			"Engineering trade-off priorities: latency vs throughput, consistency vs availability, etc.",
		),
	technicalRisks: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Known technical risks, debt, or areas of uncertainty"),
	teamContext: z
		.string()
		.optional()
		.describe("Team size, skill distribution, and organizational dependencies"),
	observabilityRequirements: z
		.array(z.string())
		.optional()
		.default([])
		.describe("Monitoring, logging, tracing, and debugging requirements"),
	performanceTargets: z
		.array(z.string())
		.optional()
		.default([])
		.describe(
			"Specific performance SLOs/SLAs: p99 latency, throughput, availability",
		),
	migrationStrategy: z
		.string()
		.optional()
		.describe(
			"Migration or rollout strategy if re-architecting existing system",
		),
	codeQualityStandards: z
		.array(z.string())
		.optional()
		.default([])
		.describe(
			"Code quality expectations: test coverage, documentation, design patterns",
		),
	// Optional frontmatter controls
	mode: z.enum(["agent", "tool", "workflow"]).optional().default("agent"),
	model: z.string().optional().default("GPT-5"),
	tools: z
		.array(z.string())
		.optional()
		.default([
			"vscode-websearch",
			"githubRepo",
			"mermaid",
			"semanticCodeAnalyzer",
		]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),
});

export type L9DistinguishedEngineerPromptInput = z.infer<
	typeof L9DistinguishedEngineerPromptSchema
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

function buildTechnicalMentorPanel(): string[] {
	return [
		"### System Design & Architecture",
		"- **The Distributed Systems Theorist** · Obsesses over CAP trade-offs, consensus protocols, and failure modes. Questions every cross-service dependency.",
		"- **The Domain-Driven Design Practitioner** · Insists on bounded contexts, ubiquitous language, and domain model purity. Fights accidental complexity.",
		"- **The Microservices Architect** · Advocates for service autonomy, evolutionary architecture, and resilience patterns. Warns about distributed monoliths.",
		"- **The Monolith Defender** · Champions cohesive deployments, simple operations, and team velocity. Skeptical of premature decomposition.",
		"",
		"### Performance & Scale",
		"- **The Performance Engineer** · Lives in profilers and flame graphs. Demands benchmarks before optimization. Knows where every nanosecond goes.",
		"- **The Scalability Specialist** · Thinks in orders of magnitude. Designs for 10x, plans for 100x. Eliminates O(n²) algorithms on sight.",
		"- **The Database Guru** · Optimizes query plans, index strategies, and sharding schemes. Balances normalization with denormalization pragmatically.",
		"- **The Caching Strategist** · Understands cache invalidation is one of two hard problems. Designs multi-tier caching with clear TTL policies.",
		"",
		"### Code Quality & Maintainability",
		"- **The Clean Code Advocate** · Enforces SOLID principles, readable tests, and self-documenting code. Refactors fearlessly with test coverage.",
		"- **The Technical Debt Realist** · Tracks debt deliberately, schedules paydown, and distinguishes strategic debt from accidental complexity.",
		"- **The API Design Expert** · Crafts intuitive interfaces, backward compatibility, and versioning strategies. Makes easy things easy, hard things possible.",
		"- **The Type Safety Enthusiast** · Leverages type systems to eliminate entire bug classes. Makes illegal states unrepresentable.",
		"",
		"### Reliability & Operations",
		"- **The Site Reliability Engineer** · Builds for failure, automates toil, and maintains error budgets. Champions observability over debugging.",
		"- **The Chaos Engineer** · Injects controlled failures to validate resilience. Builds antifragile systems that improve under stress.",
		"- **The Observability Expert** · Instruments for unknown unknowns. Builds dashboards that answer questions not yet asked.",
		"- **The Incident Commander** · Designs for graceful degradation, clear runbooks, and blameless postmortems.",
		"",
		"### Security & Privacy",
		"- **The Security Hardener** · Applies defense in depth, least privilege, and zero-trust principles. Threat models every new feature.",
		"- **The Cryptography Specialist** · Chooses algorithms wisely, manages key rotation, and never rolls custom crypto.",
		"- **The Privacy Guardian** · Implements data minimization, consent management, and regulatory compliance (GDPR, CCPA, etc.).",
		"",
		"### Developer Experience",
		"- **The Developer Productivity Engineer** · Optimizes build times, test feedback loops, and local development experience.",
		"- **The Platform Builder** · Creates self-service capabilities, golden paths, and reduces cognitive load for product teams.",
		"- **The Documentation Champion** · Writes architecture decision records, API docs, and runbooks that future engineers will thank you for.",
		"",
		"### Innovation & Research",
		"- **The Pragmatic Innovator** · Experiments with emerging tech through small bets and prototypes. Knows when to adopt vs wait.",
		"- **The Open Source Contributor** · Leverages community solutions, contributes back, and builds on proven foundations.",
		"- **The Academic Bridge** · Translates research papers into production systems. Applies theoretical CS to practical problems.",
	];
}

function buildL9DistinguishedEngineerPrompt(
	input: L9DistinguishedEngineerPromptInput,
): string {
	const lines: string[] = [];

	const technicalDrivers = sanitizeList(input.technicalDrivers);
	const differentiators = sanitizeList(input.technicalDifferentiators);
	const constraints = sanitizeList(input.engineeringConstraints);
	const securityReqs = sanitizeList(input.securityRequirements);
	const techStack = sanitizeList(input.techStack);
	const experimentation = sanitizeList(input.experimentationAreas);
	const benchmarking = sanitizeList(input.benchmarkingFocus);
	const tradeoffs = sanitizeList(input.tradeoffPriorities);
	const risks = sanitizeList(input.technicalRisks);
	const observability = sanitizeList(input.observabilityRequirements);
	const performanceTargets = sanitizeList(input.performanceTargets);
	const codeQuality = sanitizeList(input.codeQualityStandards);

	const driversLabel = technicalDrivers.length
		? technicalDrivers.join("; ")
		: "stated technical objectives";
	const constraintsLabel = constraints.length
		? constraints.join("; ")
		: "confirmed engineering constraints";
	const techStackLabel = techStack.length
		? techStack.join(", ")
		: "current technology choices";
	const tradeoffsLabel = tradeoffs.length
		? tradeoffs.join("; ")
		: "latency, throughput, consistency, and team velocity";

	lines.push(`# Distinguished Engineer (L9) Mission`);
	lines.push("");
	lines.push(
		`> 🥚 **Easter Egg**: L9 is Google's designation for Distinguished Engineer — the highest individual contributor level. This prompt embodies that rare blend of deep technical expertise, architectural vision, and pragmatic engineering leadership that defines the role across the industry.`,
	);
	lines.push("");

	lines.push(`## Project Context`);
	lines.push(`- **Project:** ${input.projectName}`);
	lines.push(`- **Technical Challenge:** ${input.technicalChallenge}`);
	if (input.currentArchitecture) {
		lines.push(`- **Current Architecture:** ${input.currentArchitecture}`);
	}
	if (input.userScale) {
		lines.push(`- **Scale Context:** ${input.userScale}`);
	}
	if (input.teamContext) {
		lines.push(`- **Team Context:** ${input.teamContext}`);
	}
	lines.push("");

	const missionCharter = [
		"- **Persona:** Act as a Distinguished Engineer (L9 equivalent) — the technical conscience and architectural authority for this system.",
		`- **Technical Excellence:** Design solutions that excel at ${driversLabel}.`,
		`- **Engineering Discipline:** Honor ${constraintsLabel} while pushing technical boundaries.`,
		`- **Stack Fluency:** Work within the context of ${techStackLabel}, but recommend changes when justified.`,
		`- **Trade-off Mastery:** Make deliberate choices balancing ${tradeoffsLabel}.`,
		`- **Team Multiplier:** Elevate team capabilities through design clarity, documentation, and knowledge sharing.`,
	];
	appendSection(lines, "Mission Charter", missionCharter);

	const engineeringPrinciples = [
		"1. **Measure Before Optimizing** — Back every performance claim with profiling data, benchmarks, or load tests. No premature optimization.",
		"2. **Design for Failure** — Assume every dependency will fail. Plan graceful degradation, circuit breakers, and retry strategies.",
		"3. **Simplicity as a Feature** — Choose boring technology when it solves the problem. Innovation should be deliberate, not accidental.",
		"4. **Testability is Design** — If it's hard to test, the design is wrong. Build systems that are easy to validate and debug.",
		"5. **Obsess Over Developer Experience** — Code is read 10x more than written. Optimize for the next engineer (often your future self).",
		"6. **Ship to Learn** — Perfect designs emerge from production feedback, not conference rooms. Build, measure, iterate.",
	];
	appendSection(lines, "Engineering Principles", engineeringPrinciples);

	const designWorkflow = [
		"1. **Problem Crystallization** — Articulate the core technical problem crisply. Distinguish symptoms from root causes.",
		"2. **Constraint Mapping** — Document all constraints explicitly: performance budgets, compatibility requirements, operational limits.",
		"3. **Solution Space Exploration** — Generate at least 2-3 viable approaches. Consider both evolutionary (incremental) and revolutionary (re-architect) paths.",
		"4. **Trade-off Analysis** — Build a decision matrix comparing options across latency, throughput, complexity, operational burden, and migration risk.",
		"5. **Prototype & Validate** — For novel approaches, build a spike to validate core assumptions. Measure, don't guess.",
		"6. **RFC & Consensus Building** — Write architecture proposals that explain the 'why' as much as the 'what'. Seek dissent early.",
		"7. **Implementation Phasing** — Break large changes into independently deployable increments. Design for rollback at every step.",
	];
	appendSection(lines, "Design Workflow", designWorkflow);

	const contextBullets = [
		...formatBullets("Technical Drivers", technicalDrivers),
		...formatBullets("Technical Differentiators", differentiators),
		...formatBullets("Performance Targets", performanceTargets),
	];
	if (input.deliveryTimeline) {
		contextBullets.push(`- **Timeline:** ${input.deliveryTimeline}`);
	}
	if (input.migrationStrategy) {
		contextBullets.push(`- **Migration Strategy:** ${input.migrationStrategy}`);
	}
	if (!contextBullets.length) {
		contextBullets.push(
			"- Clarify technical objectives, performance targets, and timeline before designing solutions.",
		);
	}
	appendSection(lines, "Technical Context", contextBullets);

	const engineeringGuardrails = [
		...formatBullets("Engineering Constraints", constraints),
		...formatBullets("Security Requirements", securityReqs),
		...formatBullets("Tech Stack", techStack),
		...formatBullets("Observability Requirements", observability),
		...formatBullets("Code Quality Standards", codeQuality),
	];
	if (!engineeringGuardrails.length) {
		engineeringGuardrails.push(
			"- Document all technical constraints, security requirements, and quality standards before implementation.",
		);
	}
	appendSection(lines, "Engineering Guardrails", engineeringGuardrails);

	const researchSection = [
		"- Validate design choices against current best practices: academic papers, production case studies, and benchmark results.",
		"- Study how similar problems are solved at scale: distributed databases, CDN architectures, ML serving platforms.",
		"- Investigate emerging patterns worth adopting: new consensus algorithms, observability approaches, or performance techniques.",
		...(benchmarking.length
			? [
					"- Priority benchmarking areas:",
					...benchmarking.map((topic) => `  - ${topic}`),
				]
			: [
					"- Identify which systems or companies to benchmark against for this problem domain.",
				]),
		...(experimentation.length
			? [
					"- Experimentation opportunities:",
					...experimentation.map((area) => `  - ${area}`),
				]
			: []),
	];
	appendSection(lines, "Research & Benchmarking", researchSection);

	const tradeoffGuidance = [
		...tradeoffs.map((priority) => `- ${priority}`),
		`- Evaluate all options against ${tradeoffsLabel}.`,
		"- Make trade-offs explicit in architecture documents. Document what you're optimizing for and what you're sacrificing.",
		"- Quantify trade-offs with numbers when possible: latency percentiles, throughput QPS, cost per transaction.",
	];
	if (!tradeoffs.length) {
		tradeoffGuidance.unshift(
			"- Identify the primary trade-off dimensions for this system (e.g., strong consistency vs availability, development speed vs runtime performance).",
		);
	}
	appendSection(lines, "Trade-off Analysis", tradeoffGuidance);

	const mentorSection = [
		"- Simulate a design review with the following expert personas. Surface technical disagreements and resolve through evidence.",
		"",
		...buildTechnicalMentorPanel(),
		"",
		"- Summarize the debate in a table: Persona | Recommendation | Key Concerns | Mitigation Strategy",
	];
	appendSection(lines, "Technical Mentor Panel", mentorSection);

	const riskSection = [
		...risks.map((risk) => `- ${risk}`),
		`- Evaluate risks introduced by ${constraintsLabel} and new technology choices.`,
		"- For each risk, define: likelihood, blast radius, detection mechanism, and mitigation plan.",
		"- Design experiments or prototypes to retire the highest-uncertainty risks early.",
	];
	if (!risks.length) {
		riskSection.unshift(
			"- Identify technical risks: scalability bottlenecks, single points of failure, data loss scenarios, security vulnerabilities.",
		);
	}
	appendSection(lines, "Risk Register", riskSection);

	appendSection(lines, "Output Blueprint", [
		"1. **Technical Summary** — Problem statement, success criteria, and key metrics (latency, throughput, availability) in engineering terms.",
		"2. **Architecture Proposal** — System diagrams (C4, sequence diagrams, data flow), component responsibilities, API contracts.",
		"3. **Technology Choices** — Justified selections for languages, frameworks, databases, infrastructure. Explain why, not just what.",
		"4. **Trade-off Matrix** — Compare 2-3 approaches across dimensions like performance, complexity, cost, risk, migration effort.",
		"5. **Performance Analysis** — Estimated throughput, latency profiles (p50/p95/p99), capacity planning, scaling strategy.",
		"6. **Security & Reliability** — Threat model, failure modes, circuit breakers, rate limiting, monitoring strategy.",
		"7. **Migration Plan** — Phased rollout, feature flags, rollback procedures, validation checkpoints, success metrics.",
		"8. **Implementation Guide** — Component breakdown, API specifications, data models, test strategies, and team ownership.",
		"9. **Technical Debt Log** — Shortcuts taken, follow-up work needed, and when/how to address deferred improvements.",
	]);

	appendSection(lines, "Validation Checklist", [
		`- ✅ Design achieves ${driversLabel}.`,
		`- ✅ All constraints honored: ${constraintsLabel}.`,
		`- ✅ Security requirements satisfied: ${securityReqs.length ? securityReqs.join(", ") : "documented security requirements"}.`,
		`- ✅ Performance targets met: ${performanceTargets.length ? performanceTargets.join(", ") : "stated SLOs/SLAs"}.`,
		"- ✅ Failure modes analyzed; graceful degradation designed.",
		"- ✅ Observability plan includes metrics, logs, traces, and alerting.",
		"- ✅ Migration/rollout plan is incremental and reversible.",
		"- ✅ Technical debt explicitly documented with remediation timeline.",
		"- ✅ Design validated through prototype, benchmark, or production experiment.",
		...(codeQuality.length
			? [`- ✅ Code quality standards defined: ${codeQuality.join(", ")}.`]
			: []),
		...(observability.length
			? [`- ✅ Observability requirements met: ${observability.join(", ")}.`]
			: []),
	]);

	lines.push("## Engineering Culture");
	lines.push(
		"- Write for the engineer who will maintain this system at 3 AM. Clarity over cleverness.",
	);
	lines.push(
		"- Be opinionated but humble. Strong recommendations backed by evidence, open to better ideas.",
	);
	lines.push(
		"- Quantify claims with data. Prefer 'p99 latency < 50ms' over 'very fast'.",
	);
	lines.push(
		"- Document decisions in ADRs (Architecture Decision Records). Explain context, options considered, and rationale.",
	);
	lines.push(
		"- End with clear next steps: prototypes to build, benchmarks to run, questions to answer, approvals needed.",
	);
	lines.push("");

	return lines.join("\n");
}

function buildL9DistinguishedEngineerFrontmatter(
	input: L9DistinguishedEngineerPromptInput,
): string {
	const desc = `Distinguished Engineer (L9) guidance for ${input.projectName}`;
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function l9DistinguishedEngineerPromptBuilder(args: unknown) {
	const input = L9DistinguishedEngineerPromptSchema.parse(args);

	const enforce = input.forcePromptMdStyle ?? true;
	// Explicit false for includeFrontmatter overrides forcePromptMdStyle
	const effectiveIncludeFrontmatter =
		input.includeFrontmatter === false
			? false
			: enforce
				? true
				: input.includeFrontmatter;
	const effectiveIncludeMetadata =
		input.includeMetadata === false
			? false
			: enforce
				? true
				: input.includeMetadata;

	const prompt = buildL9DistinguishedEngineerPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildL9DistinguishedEngineerFrontmatter(input)}\n`
		: "";
	const references = input.includeReferences
		? buildFurtherReadingSection([
				{
					title: "Software Engineering at Google",
					url: "https://abseil.io/resources/swe-book",
					description:
						"Comprehensive guide to Google's engineering practices for building sustainable codebases",
				},
				{
					title: "Google SRE Book",
					url: "https://sre.google/sre-book/table-of-contents/",
					description:
						"Official Site Reliability Engineering handbook covering production system operations",
				},
				{
					title: "Designing Data-Intensive Applications",
					url: "https://dataintensive.net/",
					description:
						"Martin Kleppmann's guide to building scalable, reliable data systems",
				},
				{
					title: "System Design Primer",
					url: "https://github.com/donnemartin/system-design-primer",
					description:
						"Comprehensive resource for learning large-scale system design",
				},
				{
					title: "The Twelve-Factor App",
					url: "https://12factor.net/",
					description:
						"Methodology for building modern SaaS applications with best practices",
				},
				{
					title: "C4 Model for Software Architecture",
					url: "https://c4model.com/",
					description:
						"Approach for visualizing software architecture at different abstraction levels",
				},
				{
					title: "Architecture Decision Records",
					url: "https://adr.github.io/",
					description:
						"Framework for documenting important architectural decisions",
				},
				{
					title: "Database Internals",
					url: "https://www.databass.dev/",
					description:
						"Alex Petrov's deep dive into database storage engines and distributed systems",
				},
				{
					title: "Patterns of Distributed Systems",
					url: "https://martinfowler.com/articles/patterns-of-distributed-systems/",
					description:
						"Martin Fowler's catalog of distributed system design patterns",
				},
				{
					title: "High Scalability Blog",
					url: "http://highscalability.com/",
					description:
						"Real-world architectures and scaling strategies from major tech companies",
				},
				{
					title: "Papers We Love",
					url: "https://paperswelove.org/",
					description:
						"Community repository of classic and influential computer science papers",
				},
				{
					title: "The Morning Paper",
					url: "https://blog.acolyer.org/",
					description:
						"Daily summaries and analysis of important computer science research papers",
				},
				{
					title: "CAP Theorem",
					url: "https://en.wikipedia.org/wiki/CAP_theorem",
					description:
						"Fundamental theorem about consistency, availability, and partition tolerance in distributed systems",
				},
				{
					title: "DORA Metrics",
					url: "https://www.devops-research.com/research.html",
					description:
						"DevOps Research and Assessment metrics for measuring software delivery performance",
				},
				{
					title: "OpenTelemetry",
					url: "https://opentelemetry.io/",
					description:
						"Vendor-neutral observability framework for traces, metrics, and logs",
				},
				{
					title: "OWASP Top 10",
					url: "https://owasp.org/www-project-top-ten/",
					description:
						"Standard awareness document for web application security risks",
				},
			])
		: "";
	const filenameHint = `${slugify(`${input.projectName}-l9-distinguished-engineer`)}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool:
					"mcp_ai-agent-guid_l9-distinguished-engineer-prompt-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🎯 Distinguished Engineer (L9) Prompt\n\n${metadata}\n${prompt}\n\n${references ? `${references}\n` : ""}`,
			},
		],
	};
}
