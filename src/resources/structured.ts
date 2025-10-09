// Structured resources for MCP guidelines with dual output (Markdown + JSON)
// Best-practice: keep resources side-effect free, URL-backed references, and concise code examples.

export type Reference = {
	title: string;
	url?: string;
	source?: string;
	note?: string;
};

export type ResourceSegment =
	| { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
	| { type: "paragraph"; text: string }
	| { type: "list"; ordered?: boolean; items: string[] }
	| { type: "table"; headers: string[]; rows: string[][] }
	| { type: "code"; language: string; code: string; caption?: string }
	| { type: "note"; text: string }
	| { type: "callout"; text: string }
	| { type: "references"; items: Reference[] };

export interface StructuredResource {
	id: string;
	title: string;
	version: string;
	lastUpdated: string; // ISO date
	tags?: string[];
	segments: ResourceSegment[];
}

export function renderStructuredToMarkdown(res: StructuredResource): string {
	const lines: string[] = [];
	lines.push(`# ${res.title}`);
	lines.push("");
	for (const seg of res.segments) {
		switch (seg.type) {
			case "heading": {
				lines.push(`${"#".repeat(seg.level)} ${seg.text}`);
				lines.push("");
				break;
			}
			case "paragraph": {
				lines.push(seg.text);
				lines.push("");
				break;
			}
			case "list": {
				for (let i = 0; i < seg.items.length; i++) {
					const item = seg.items[i];
					if (seg.ordered) lines.push(`${i + 1}. ${item}`);
					else lines.push(`- ${item}`);
				}
				lines.push("");
				break;
			}
			case "table": {
				lines.push(`| ${seg.headers.join(" | ")} |`);
				lines.push(`| ${seg.headers.map(() => "---").join(" | ")} |`);
				for (const row of seg.rows) {
					lines.push(`| ${row.join(" | ")} |`);
				}
				lines.push("");
				break;
			}
			case "code": {
				if (seg.caption) lines.push(`_${seg.caption}_`);
				lines.push(`\`\`\`${seg.language}`);
				lines.push(seg.code);
				lines.push("```");
				lines.push("");
				break;
			}
			case "note": {
				lines.push(`> Note: ${seg.text}`);
				lines.push("");
				break;
			}
			case "callout": {
				lines.push(`> ${seg.text}`);
				lines.push("");
				break;
			}
			case "references": {
				lines.push("## References");
				lines.push("");
				for (const r of seg.items) {
					const title = r.url ? `[${r.title}](${r.url})` : r.title;
					const src = r.source ? ` – ${r.source}` : "";
					const note = r.note ? ` — ${r.note}` : "";
					lines.push(`- ${title}${src}${note}`);
				}
				lines.push("");
				break;
			}
		}
	}
	lines.push("---");
	lines.push(`Version: ${res.version} · Updated: ${res.lastUpdated}`);
	return lines.join("\n");
}

const updated = new Date().toISOString().slice(0, 10);

export const structuredResources: StructuredResource[] = [
	// Core development principles (extended, link-focused)
	{
		id: "core-development-principles",
		title: "Core Development Principles (Extended)",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["principles", "links", "prompting", "sprint", "mermaid", "memory"],
		segments: [
			{ type: "heading", level: 2, text: "Overview" },
			{
				type: "paragraph",
				text: "Authoritative references for hierarchical prompting, sprint planning, model selection context, visualization with Mermaid, and memory/prompt caching.",
			},
			{ type: "heading", level: 2, text: "Hierarchical Prompt Structure" },
			{
				type: "paragraph",
				text: "Use layered prompts (Context → Goal → Requirements → Output Format → Audience → Instructions). Validate choices with official docs; iterate with tests.",
			},
			{
				type: "references",
				items: [
					{
						title: "Hierarchical Prompting for Better AI Interactions",
						url: "https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions",
						source: "RelevanceAI",
					},
					{
						title: "AI Prompt Engineering Best Practices",
						url: "https://kanerika.com/blogs/ai-prompt-engineering-best-practices/",
						source: "Kanerika",
					},
					{
						title:
							"Complete Prompt Engineering Guide: 15 Essential Techniques for 2025",
						url: "https://www.dataunboxed.io/blog/the-complete-guide-to-prompt-engineering-15-essential-techniques-for-2025",
						source: "DataUnboxed",
					},
					{
						title:
							"Hierarchical Prompt Learning for Multi-Task Learning (CVPR 2023)",
						url: "https://openaccess.thecvf.com/content/CVPR2023/papers/Liu_Hierarchical_Prompt_Learning_for_Multi-Task_Learning_CVPR_2023_paper.pdf",
						source: "CVPR 2023",
					},
				],
			},
			{ type: "heading", level: 2, text: "Timeframes & Sprint Planning" },
			{
				type: "references",
				items: [
					{
						title:
							"The 7 Best AI-Assisted Sprint Planning Tools for Agile Teams in 2025",
						url: "https://www.zenhub.com/blog-posts/the-7-best-ai-assisted-sprint-planning-tools-for-agile-teams-in-2025",
						source: "ZenHub",
					},
					{
						title:
							"AI in Software Project Delivery: Smarter Planning and Execution",
						url: "https://www.nitorinfotech.com/blog/ai-in-software-project-delivery-smarter-planning-and-execution/",
						source: "Nitor",
					},
				],
			},
			{ type: "heading", level: 2, text: "Checklists & Code Hygiene" },
			{
				type: "references",
				items: [
					{
						title: "Legacy Code Refactoring: Transform Your Codebase Safely",
						url: "https://www.docuwriter.ai/posts/legacy-code-refactoring",
						source: "DocuWriter",
					},
					{
						title:
							"Strategies for Refactoring Legacy Code and Updating Outdated Software",
						url: "https://refraction.dev/blog/refactoring-legacy-code-outdated-software",
						source: "Refraction",
					},
					{
						title: "Refactoring Best Practices",
						url: "https://graphite.dev/guides/refactoring-legacy-code-best-practices-techniques",
						source: "Graphite",
					},
				],
			},
			{ type: "heading", level: 2, text: "Visualization & Documentation" },
			{
				type: "references",
				items: [
					{
						title: "Mermaid.js: Transforming Documentation and Diagrams",
						url: "https://dev.to/dminatto/mermaidjs-transforming-documentation-and-diagrams-with-markdown-like-syntax-1aeb",
						source: "DEV",
					},
					{
						title: "Kubernetes Diagram Guide",
						url: "https://kubernetes.io/docs/contribute/style/diagram-guide/",
						source: "Kubernetes",
					},
					{
						title: "Mermaid.js: A Complete Guide",
						url: "https://swimm.io/learn/mermaid-js/mermaid-js-a-complete-guide",
						source: "Swimm",
					},
					{
						title: "Mermaid GitHub Repository",
						url: "https://github.com/mermaid-js/mermaid",
						source: "GitHub",
					},
				],
			},
			{ type: "heading", level: 2, text: "Memory & Prompt Caching" },
			{
				type: "references",
				items: [
					{
						title: "Prompt Caching with Claude (Announcement)",
						url: "https://www.anthropic.com/news/prompt-caching",
						source: "Anthropic",
					},
					{
						title: "Prompt Caching - Anthropic Docs",
						url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
						source: "Anthropic",
					},
					{
						title: "Prompt Caching: Saving Time and Money in LLM Applications",
						url: "https://caylent.com/blog/prompt-caching-saving-time-and-money-in-llm-applications",
						source: "Caylent",
					},
				],
			},
			{ type: "heading", level: 2, text: "Model Landscape & Comparisons" },
			{
				type: "references",
				items: [
					{
						title: "GPT-4 Turbo vs Claude 2.1",
						url: "https://www.akkio.com/post/gpt-4-turbo-vs-claude-2-1",
						source: "Akkio",
					},
					{
						title: "AI Showdown: GPT vs Claude vs Gemini (2025)",
						url: "https://www.linkedin.com/pulse/ai-showdown-openais-gpt-family-vs-anthropics-claude-gemini-pallister-ilb5c",
						source: "LinkedIn",
					},
					{
						title: "Claude vs ChatGPT",
						url: "https://datasciencedojo.com/blog/claude-vs-chatgpt/",
						source: "Data Science Dojo",
					},
				],
			},
			{
				type: "heading",
				level: 2,
				text: "Sequential Thinking & Agent Workflow",
			},
			{
				type: "references",
				items: [
					{
						title: "Sequential Thinking Claude Code MCP Server",
						url: "https://mcp.so/server/sequential-thinking---claude-code/MattMagg",
						source: "MCP.so",
					},
					{
						title: "Prompt Engineering Guide for AI Agents (2025)",
						url: "https://www.youtube.com/watch?v=DP_yKoHeWI8",
						source: "YouTube",
					},
					{
						title: "Prompt Engineering for AI Agents",
						url: "https://www.prompthub.us/blog/prompt-engineering-for-ai-agents",
						source: "PromptHub",
					},
					{
						title: "Prompt Engineering in 2025: The Latest Best Practices",
						url: "https://www.news.aakashg.com/p/prompt-engineering",
						source: "News.AakashG",
					},
				],
			},
			{ type: "heading", level: 2, text: "2025 Prompting Techniques (Mapped)" },
			{
				type: "list",
				ordered: false,
				items: [
					"Zero-shot · Baseline tasks; keep instructions crisp",
					"Few-shot · 2–5 diverse examples; match output exactly",
					"Chain-of-Thought · Step-by-step for complex reasoning",
					"Self-Consistency · Multiple approaches, choose consensus",
					"In-Context Learning · Provide patterns in prompt",
					"Generate Knowledge · List facts first, then answer",
					"Prompt Chaining · Analyze → Hypothesize → Recommend → Plan",
					"Tree of Thoughts · Explore branches, pros/cons, select best",
					"Meta Prompting · Ask model to refine the prompt",
					"RAG · Separate instructions vs documents, cite sources",
					"ReAct · Thought/Action/Observation with tools",
					"ART · Auto-select tools; curb overuse with guardrails",
				],
			},
			{ type: "heading", level: 2, text: "Common Pitfalls" },
			{
				type: "list",
				items: [
					"Vague instructions → use precise positive directives",
					"Forced behaviors (always use a tool) → 'Use tools when needed'",
					"Context mixing → separate Instructions and Data",
					"Limited examples → vary examples to avoid overfitting",
					"Repetitive phrases → request natural variation",
					"Negative-only guidance → state desired behavior",
				],
			},
			{ type: "heading", level: 2, text: "Context7 Prompt File Style" },
			{
				type: "paragraph",
				text: "Prefer *.prompt.md with YAML frontmatter + Markdown sections (Context, Goal, Requirements, Output, Audience, Instructions). Use XML style when optimizing for Claude.",
			},
		],
	},
	// Core principles
	{
		id: "core-principles",
		title: "Core AI Agent Development Principles",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["principles", "guidelines", "hierarchy", "memory", "mermaid"],
		segments: [
			{ type: "heading", level: 2, text: "Structured Development Framework" },
			{
				type: "list",
				items: [
					"Use hierarchical prompting with clear priorities and constraints",
					"Codify checklists into prompts to enforce consistency",
					"Timebox delivery and model-eval cycles; anticipate 2–3 month model updates",
					"Maintain code hygiene and holistic awareness before edits",
					"Prefer text-first docs with Mermaid; prefer SVG over raster",
					"Apply prompt caching for static prefixes; summarize long sessions",
					"Two-mode workflow: Plan (analyze) then Action (execute) with safety checks",
					"Iterate with tests, consistent naming, and robust error handling",
				],
			},
			{
				type: "references",
				items: [
					{
						title: "Hierarchical Prompting for Better AI Interactions",
						url: "https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions",
						source: "RelevanceAI",
					},
					{
						title: "AI Prompt Engineering Best Practices",
						url: "https://kanerika.com/blogs/ai-prompt-engineering-best-practices/",
						source: "Kanerika",
					},
					{
						title:
							"Complete Prompt Engineering Guide: 15 AI Techniques for 2025",
						url: "https://www.dataunboxed.io/blog/the-complete-guide-to-prompt-engineering-15-essential-techniques-for-2025",
						source: "DataUnboxed",
					},
					{
						title: "Prompt Caching – Anthropic docs",
						url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
						source: "Anthropic",
					},
					{
						title: "Mermaid GitHub Repository",
						url: "https://github.com/mermaid-js/mermaid",
						source: "GitHub",
					},
				],
			},
		],
	},

	// Prompt templates
	{
		id: "prompt-templates",
		title: "Hierarchical Prompt Templates",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["templates", "prompting", "hierarchy"],
		segments: [
			{ type: "heading", level: 2, text: "Basic Hierarchical Structure" },
			{
				type: "code",
				language: "text",
				caption: "Template: General Task",
				code: [
					"# Context\n[Domain/background]",
					"\n# Goal\n[Specific objectives]",
					"\n# Requirements\n1. [Constraint 1]\n2. [Constraint 2]\n3. [Constraint 3]",
					"\n# Output Format\n[Structure]",
					"\n# Target Audience\n[Expertise level]",
					"\n# Instructions\n[Execution steps]",
				].join("\n"),
			},
			{
				type: "code",
				language: "text",
				caption: "Template: Code Analysis",
				code: [
					"# Context\nAnalyzing code for [purpose]",
					"\n# Goal\n[Analysis objective]",
					"\n# Code Requirements\n- Language: [X]\n- Framework: [Y]\n- Focus: [performance|security|maintainability]",
					"\n# Analysis Format\n- Issues (severity)\n- Recommendations (priority)\n- Examples",
					"\n# Deliverable\nActionable next steps",
				].join("\n"),
			},
			{
				type: "code",
				language: "text",
				caption: "Template: Architecture Design",
				code: [
					"# Context\nDesigning [system] for [use case]",
					"\n# Requirements\n## Functional\n1. ...\n## Non-Functional\n1. Performance\n2. Scalability\n3. Security",
					"\n# Constraints\n- Tech stack\n- Budget\n- Timeline",
					"\n# Output\n- Mermaid diagram\n- Components\n- Data flow\n- Recommendations",
				].join("\n"),
			},
		],
	},

	// Development checklists
	{
		id: "development-checklists",
		title: "Development Checklists",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["checklists", "process", "qa"],
		segments: [
			{ type: "heading", level: 2, text: "Pre-Development" },
			{
				type: "list",
				items: [
					"Requirements documented; architecture reviewed",
					"Env configured; repo initialized; CI planned",
					"Roles assigned; communication channels set; Definition of Done",
				],
			},
			{ type: "heading", level: 2, text: "Development" },
			{
				type: "list",
				items: [
					"Style guidelines; unit/integration tests; coverage targets",
					"Security & performance checks; up-to-date docs",
					"Prompt templates applied; context management; fallback paths",
				],
			},
			{ type: "heading", level: 2, text: "Pre-Deployment" },
			{
				type: "list",
				items: [
					"Automated + manual + UAT passing",
					"Perf & security testing; accessibility",
					"Docs, deployment & troubleshooting guides current",
				],
			},
			{ type: "heading", level: 2, text: "Post-Deployment" },
			{
				type: "list",
				items: [
					"Monitor metrics, errors, token use, model performance",
					"Update deps & patches; pay down technical debt",
				],
			},
			{ type: "heading", level: 2, text: "Sprint Retrospective" },
			{
				type: "list",
				items: [
					"Evaluate goals & velocity; identify blockers",
					"Review code quality, architecture, security posture",
				],
			},
			{
				type: "references",
				items: [
					{
						title:
							"Prompt Engineering Mastery: Advanced AI Techniques for 2025",
						url: "https://www.clickforest.com/en/blog/prompt-engineering-chatgpt-advanced",
						source: "ClickForest",
					},
					{
						title: "How to Hire Prompt Engineers [Checklist + Rates 2025]",
						url: "https://dextralabs.com/blog/hire-prompt-engineer-for-your-business/",
						source: "Dextra Labs",
					},
				],
			},
		],
	},

	// Model selection
	{
		id: "model-selection",
		title: "AI Model Selection Guide",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["models", "selection", "evaluation"],
		segments: [
			{ type: "heading", level: 2, text: "Selection Matrix" },
			{
				type: "paragraph",
				text: "Match models to tasks, budget, context size, speed, and safety. Prototype, benchmark, and verify pricing/caps with providers before production.",
			},
			{
				type: "table",
				headers: ["Model", "Provider", "Context", "Speed", "Best For"],
				rows: [
					[
						"Claude 4 Sonnet",
						"Anthropic",
						"~200K",
						"Fast",
						"Balanced code/tasks",
					],
					["Claude 4 Opus", "Anthropic", "~200K", "Med", "Complex reasoning"],
					["GPT-4o", "OpenAI", "~128K", "Fast", "Multimodal"],
					["Gemini 2.5 Pro", "Google", "Up to 2M", "Med", "Large contexts"],
				],
			},
			{
				type: "references",
				items: [
					{
						title: "OpenAI models",
						url: "https://platform.openai.com/docs/models",
						source: "OpenAI",
					},
					{
						title: "Anthropic Claude models",
						url: "https://docs.anthropic.com/en/docs/about-claude/models",
						source: "Anthropic",
					},
					{
						title: "Google Gemini models",
						url: "https://ai.google.dev/gemini-api/docs/models",
						source: "Google",
					},
					{
						title: "GitHub Copilot model comparison",
						url: "https://docs.github.com/en/copilot/reference/ai-models/model-comparison#recommended-models-by-task",
						source: "GitHub",
					},
				],
			},
		],
	},

	// Architecture patterns
	{
		id: "architecture-patterns",
		title: "AI Agent Architecture Patterns",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["architecture", "patterns", "mermaid"],
		segments: [
			{ type: "heading", level: 2, text: "Layered Architecture" },
			{
				type: "code",
				language: "mermaid",
				caption: "Layered structure",
				code: [
					"flowchart TB",
					"UI[Presentation] --> APP[Application] --> AI[AI Integration] --> DATA[Data Access]",
				].join("\n"),
			},
			{ type: "heading", level: 2, text: "Microservices" },
			{
				type: "code",
				language: "mermaid",
				caption: "Service decomposition",
				code: [
					"flowchart LR",
					"CHAT[Chat] --- GW[API Gateway] --- ANALYSIS[Analysis]",
					"GW --- GEN[Generator]",
				].join("\n"),
			},
			{ type: "heading", level: 2, text: "Event-Driven" },
			{
				type: "code",
				language: "mermaid",
				caption: "Producers/Consumers",
				code: [
					"flowchart LR",
					"P[Producer] --> BUS[Event Bus] --> C[Consumer]",
				].join("\n"),
			},
		],
	},

	// Rapid model evolution
	{
		id: "rapid-model-evolution",
		title: "Rapid Model Evolution (Qualitative)",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["models", "evolution", "cadence"],
		segments: [
			{ type: "heading", level: 2, text: "2–3 Month Release Cadence" },
			{
				type: "list",
				items: [
					"Abstract model behind flags; implement fallbacks",
					"Run periodic evals on representative tasks",
					"Track latency, accuracy, safety, and cost KPIs",
				],
			},
			{
				type: "references",
				items: [
					{
						title: "GPT-4 Turbo vs Claude 2.1",
						url: "https://www.akkio.com/post/gpt-4-turbo-vs-claude-2-1",
						source: "Akkio",
					},
					{
						title: "OpenAI GPT vs Claude vs Gemini",
						url: "https://www.linkedin.com/pulse/ai-showdown-openais-gpt-family-vs-anthropics-claude-gemini-pallister-ilb5c",
						source: "LinkedIn",
					},
					{
						title: "Claude vs ChatGPT",
						url: "https://datasciencedojo.com/blog/claude-vs-chatgpt/",
						source: "Data Science Dojo",
					},
				],
			},
		],
	},

	// External references (curated)
	{
		id: "external-references",
		title: "External References (2025)",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["references", "urls", "grounding"],
		segments: [
			{ type: "heading", level: 2, text: "Core Development Principles" },
			{
				type: "references",
				items: [
					{
						title: "Hierarchical Prompting for Better AI Interactions",
						url: "https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions",
						source: "RelevanceAI",
					},
					{
						title: "AI Prompt Engineering Best Practices",
						url: "https://kanerika.com/blogs/ai-prompt-engineering-best-practices/",
						source: "Kanerika",
					},
					{
						title:
							"Complete Prompt Engineering Guide: 15 AI Techniques for 2025",
						url: "https://www.dataunboxed.io/blog/the-complete-guide-to-prompt-engineering-15-essential-techniques-for-2025",
						source: "DataUnboxed",
					},
				],
			},
			{ type: "heading", level: 2, text: "Timeframes & Sprint Planning" },
			{
				type: "references",
				items: [
					{
						title:
							"The 7 Best AI-Assisted Sprint Planning Tools for Agile Teams in 2025",
						url: "https://www.zenhub.com/blog-posts/the-7-best-ai-assisted-sprint-planning-tools-for-agile-teams-in-2025",
						source: "ZenHub",
					},
					{
						title:
							"AI in Software Project Delivery: Smarter Planning and Execution",
						url: "https://www.nitorinfotech.com/blog/ai-in-software-project-delivery-smarter-planning-and-execution/",
						source: "Nitor",
					},
				],
			},
			{ type: "heading", level: 2, text: "Comprehensive Checklists" },
			{
				type: "references",
				items: [
					{
						title:
							"Prompt Engineering Mastery: Advanced AI Techniques for 2025",
						url: "https://www.clickforest.com/en/blog/prompt-engineering-chatgpt-advanced",
						source: "ClickForest",
					},
					{
						title: "How to Hire Prompt Engineers [Checklist + Rates 2025]",
						url: "https://dextralabs.com/blog/hire-prompt-engineer-for-your-business/",
						source: "Dextra Labs",
					},
				],
			},
			{ type: "heading", level: 2, text: "Codebase Management" },
			{
				type: "references",
				items: [
					{
						title: "Legacy Code Refactoring: Transform Your Codebase Safely",
						url: "https://www.docuwriter.ai/posts/legacy-code-refactoring",
						source: "DocuWriter",
					},
					{
						title:
							"Strategies for Refactoring Legacy Code and Updating Outdated Software",
						url: "https://refraction.dev/blog/refactoring-legacy-code-outdated-software",
						source: "Refraction",
					},
					{
						title: "Fundamentals and Practical Implications of Agentic AI",
						url: "https://arxiv.org/html/2505.19443v1",
						source: "arXiv",
					},
					{
						title: "Refactoring Best Practices",
						url: "https://graphite.dev/guides/refactoring-legacy-code-best-practices-techniques",
						source: "Graphite",
					},
				],
			},
			{ type: "heading", level: 2, text: "Visualization & Documentation" },
			{
				type: "references",
				items: [
					{
						title: "Mermaid.js: Transforming Documentation and Diagrams",
						url: "https://dev.to/dminatto/mermaidjs-transforming-documentation-and-diagrams-with-markdown-like-syntax-1aeb",
						source: "DEV",
					},
					{
						title: "Kubernetes Diagram Guide",
						url: "https://kubernetes.io/docs/contribute/style/diagram-guide/",
						source: "Kubernetes",
					},
					{
						title: "Mermaid.js: A Complete Guide",
						url: "https://swimm.io/learn/mermaid-js/mermaid-js-a-complete-guide",
						source: "Swimm",
					},
					{
						title: "Mermaid GitHub Repository",
						url: "https://github.com/mermaid-js/mermaid",
						source: "GitHub",
					},
				],
			},
			{ type: "heading", level: 2, text: "Memory & Performance" },
			{
				type: "references",
				items: [
					{
						title: "Prompt Caching with Claude",
						url: "https://www.anthropic.com/news/prompt-caching",
						source: "Anthropic News",
					},
					{
						title: "Prompt Caching - Anthropic API Documentation",
						url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
						source: "Anthropic Docs",
					},
					{
						title: "Prompt Caching: Saving Time and Money in LLM Applications",
						url: "https://caylent.com/blog/prompt-caching-saving-time-and-money-in-llm-applications",
						source: "Caylent",
					},
				],
			},
			{ type: "heading", level: 2, text: "Sequential Thinking" },
			{
				type: "references",
				items: [
					{
						title: "Sequential Thinking Claude Code MCP Server",
						url: "https://mcp.so/server/sequential-thinking---claude-code/MattMagg",
						source: "MCP.so",
					},
					{
						title: "Prompt Engineering Guide for AI Agents (2025)",
						url: "https://www.youtube.com/watch?v=DP_yKoHeWI8",
						source: "YouTube",
					},
				],
			},
			{ type: "heading", level: 2, text: "Two-Mode Development & Safety" },
			{
				type: "references",
				items: [
					{
						title: "Prompt Engineering for AI Agents",
						url: "https://www.prompthub.us/blog/prompt-engineering-for-ai-agents",
						source: "PromptHub",
					},
					{
						title: "Prompt Engineering in 2025: The Latest Best Practices",
						url: "https://www.news.aakashg.com/p/prompt-engineering",
						source: "News.AakashG",
					},
				],
			},
			{
				type: "note",
				text: "External links change quickly; verify details with official docs at runtime.",
			},
		],
	},

	// Knowledge base (offline summaries only)
	{
		id: "knowledge-base",
		title: "Internal Knowledge Base (Summarized)",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["knowledge", "offline", "summaries"],
		segments: [
			{
				type: "paragraph",
				text: "Concise, offline summaries distilled from public sources to seed prompts. Use external references for live details and verify specifics at execution time.",
			},
		],
	},

	// MCP TypeScript SDK insights
	{
		id: "mcp-ts-insights",
		title: "MCP TypeScript SDK: Resource & Tool Patterns (Concise)",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["mcp", "sdk", "resources", "tools", "resource_link"],
		segments: [
			{ type: "heading", level: 2, text: "Responsibilities" },
			{
				type: "list",
				items: [
					"Resources: expose data (no significant computation/side effects)",
					"Tools: perform computation and may have side effects",
					"Prompts: reusable templates (optionally with arg completion)",
				],
			},
			{ type: "heading", level: 2, text: "Dynamic ResourceTemplate" },
			{
				type: "code",
				language: "typescript",
				caption: "Dynamic resource with completion (simplified)",
				code: [
					"import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';",
					"const server = new McpServer({ name: 'guide', version: '0.1.0' });",
					"server.registerResource(",
					"  'repo',",
					"  new ResourceTemplate('github://repos/{owner}/{repo}', {",
					"    list: undefined,",
					"    complete: {",
					"      repo: (value, ctx) => (ctx?.arguments?.owner === 'org1'",
					"        ? ['project1','project2'] : ['default-repo']).filter(r => r.startsWith(value))",
					"    }",
					"  }),",
					"  { title: 'GitHub Repository', description: 'Repository info' },",
					"  async (uri, { owner, repo }) => ({ contents: [{ uri: uri.href, text: owner + '/' + repo }] })",
					");",
				].join("\n"),
			},
			{ type: "heading", level: 2, text: "Tools returning ResourceLinks" },
			{
				type: "code",
				language: "typescript",
				caption: "Reference large files without embedding content",
				code: [
					"server.registerTool('list-files',",
					"  { title: 'List Files', inputSchema: { pattern: z.string() } },",
					"  async ({ pattern }) => ({",
					"    content: [",
					"      { type: 'text', text: 'Found: ' + pattern },",
					"      { type: 'resource_link', uri: 'file:///project/README.md', name: 'README.md', mimeType: 'text/markdown' }",
					"    ]",
					"  })",
					");",
				].join("\n"),
			},
			{
				type: "references",
				items: [
					{
						title: "MCP TypeScript SDK (README)",
						url: "https://github.com/modelcontextprotocol/typescript-sdk",
						source: "GitHub",
					},
				],
			},
		],
	},

	// MCP advanced functions
	{
		id: "mcp-advanced-functions",
		title: "MCP Advanced Functions: Resources, Completions, and Notifications",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["mcp", "advanced", "list_changed", "completions"],
		segments: [
			{ type: "heading", level: 2, text: "Lifecycle & Notifications" },
			{
				type: "paragraph",
				text: "Servers emit resources.list_changed when resources/templates are added, updated, enabled/disabled, or removed. Debouncing can coalesce rapid changes.",
			},
			{ type: "heading", level: 2, text: "Argument Completions" },
			{
				type: "paragraph",
				text: "Use ResourceTemplate.complete for context-aware suggestions of template variables to improve UX and discoverability.",
			},
			{ type: "heading", level: 2, text: "Best Practices" },
			{
				type: "list",
				items: [
					"Keep resources idempotent and fast; offload heavy compute to tools",
					"Prefer resource_link from tools for large artifacts",
					"Provide display names/metadata for better client UX",
				],
			},
			{
				type: "references",
				items: [
					{
						title: "MCP TypeScript SDK (README)",
						url: "https://github.com/modelcontextprotocol/typescript-sdk",
						source: "GitHub",
					},
				],
			},
		],
	},

	// Prompting Hierarchy and Numeric Evaluation
	{
		id: "prompting-hierarchy-evaluation",
		title: "Prompting Hierarchy and Numeric Evaluation Framework",
		version: "0.1.0",
		lastUpdated: updated,
		tags: [
			"prompting",
			"hierarchy",
			"evaluation",
			"reinforcement-learning",
			"metrics",
		],
		segments: [
			{ type: "heading", level: 2, text: "Overview" },
			{
				type: "paragraph",
				text: "A structured framework for selecting appropriate prompt support levels and evaluating prompt effectiveness using reinforcement learning-inspired numeric metrics. Based on educational prompting hierarchies and Hierarchical Prompting Taxonomy (HPT) research.",
			},
			{ type: "heading", level: 2, text: "Hierarchy Levels" },
			{
				type: "table",
				headers: ["Level", "Description", "Cognitive Load", "Use Case"],
				rows: [
					[
						"Independent",
						"Minimal guidance; high autonomy",
						"High",
						"Expert agents, exploratory tasks",
					],
					[
						"Indirect",
						"Subtle hints and cues",
						"Medium",
						"Learning scenarios, skill development",
					],
					[
						"Direct",
						"Clear instructions without steps",
						"Medium",
						"Standard tasks, experienced agents",
					],
					[
						"Modeling",
						"Examples and demonstrations",
						"Low",
						"New patterns, consistency",
					],
					[
						"Scaffolding",
						"Step-by-step structured guidance",
						"Low",
						"Complex tasks, less experienced agents",
					],
					[
						"Full Physical",
						"Complete detailed specification",
						"Low",
						"High-risk operations, exact replication",
					],
				],
			},
			{ type: "heading", level: 2, text: "Numeric Evaluation Metrics" },
			{
				type: "list",
				items: [
					"**Overall Score (0-100)**: Composite quality metric",
					"**Clarity Score**: Sentence structure and language clarity",
					"**Specificity Score**: Concrete action verbs and detailed requirements",
					"**Completeness Score**: Context, goals, and constraints coverage",
					"**Structure Score**: Organization with headings, bullets, numbering",
					"**Hierarchy Score**: Match between prompt and intended support level",
					"**Cognitive Complexity**: Task difficulty and technical depth",
					"**Predicted Effectiveness**: RL-style reward signal for success probability",
				],
			},
			{ type: "heading", level: 2, text: "Selection Guidelines" },
			{
				type: "paragraph",
				text: "Choose hierarchy level based on three factors:",
			},
			{
				type: "list",
				ordered: true,
				items: [
					"**Agent Capability**: Novice → Full Physical/Scaffolding; Expert → Independent/Indirect",
					"**Task Complexity**: Simple → Independent/Direct; Very Complex → Scaffolding/Full Physical",
					"**Risk Level**: High-risk tasks (production, security, payments) → Higher support levels",
				],
			},
			{ type: "heading", level: 2, text: "Evaluation Process" },
			{
				type: "list",
				ordered: true,
				items: [
					"Analyze prompt characteristics (steps, examples, hints, specificity)",
					"Detect hierarchy level based on patterns",
					"Calculate component scores (clarity, specificity, completeness, structure)",
					"Compute cognitive complexity and predicted effectiveness",
					"Generate recommendations for improvement",
					"Compare against target level if specified",
				],
			},
			{ type: "heading", level: 2, text: "Tools Available" },
			{
				type: "list",
				items: [
					"**prompting-hierarchy-evaluator**: Evaluate prompt quality with numeric scores",
					"**hierarchy-level-selector**: Select appropriate support level for task",
					"**hierarchical-prompt-builder**: Build structured prompts with layers",
				],
			},
			{
				type: "references",
				items: [
					{
						title:
							"Hierarchical Prompting Taxonomy: A Universal Evaluation Framework",
						url: "https://arxiv.org/abs/2406.12644",
						source: "arXiv",
					},
					{
						title: "HPT: Hierarchical Prompting Taxonomy Implementation",
						url: "https://github.com/devichand579/HPT",
						source: "GitHub",
						note: "Reference implementation and research code for HPT framework",
					},
					{
						title: "ACL Anthology: Computational Linguistics Research",
						url: "https://github.com/acl-org/acl-anthology",
						source: "GitHub",
						note: "ACL papers and resources on prompt engineering and evaluation",
					},
					{
						title: "Master Hierarchical Prompting for Better AI Interactions",
						url: "https://relevanceai.com/prompt-engineering/master-hierarchical-prompting-for-better-ai-interactions",
						source: "RelevanceAI",
					},
					{
						title: "Prompting Techniques for Specialized LLMs",
						url: "https://www.aiforeducation.io/ai-resources/prompting-techniques-for-specialized-llms",
						source: "AI for Education",
					},
					{
						title: "The Best 3 Prompting Hierarchy Tiers for AI Interactions",
						url: "https://www.promptopti.com/best-3-prompting-hierarchy-tiers-for-ai-interaction/",
						source: "PromptOpti",
					},
				],
			},
			{ type: "heading", level: 2, text: "Example Workflow" },
			{
				type: "code",
				language: "typescript",
				code: `// 1. Select appropriate hierarchy level
const levelResult = await hierarchyLevelSelector({
  taskDescription: "Implement JWT authentication",
  agentCapability: "intermediate",
  taskComplexity: "moderate"
});

// 2. Build prompt at that level
const prompt = buildPromptAtLevel(levelResult.level);

// 3. Evaluate the prompt
const evaluation = await promptingHierarchyEvaluator({
  promptText: prompt,
  targetLevel: levelResult.level,
  includeRecommendations: true
});

// 4. Iterate based on scores and recommendations
if (evaluation.overallScore < 70) {
  // Apply recommendations and re-evaluate
}`,
				caption: "Using hierarchy tools for optimal prompt design",
			},
		],
	},

	// Flow-based prompting and chaining patterns
	{
		id: "flow-based-prompting",
		title: "Flow-Based Prompting & Chaining Strategies",
		version: "0.1.0",
		lastUpdated: updated,
		tags: ["prompting", "flow", "chaining", "orchestration", "claude-flow"],
		segments: [
			{ type: "heading", level: 2, text: "Overview" },
			{
				type: "paragraph",
				text: "Flow-based prompting enables sophisticated multi-step AI workflows through chaining, branching, and orchestration. Inspired by claude-flow, these patterns allow dynamic, context-aware prompting strategies.",
			},
			{ type: "heading", level: 2, text: "Prompt Chaining" },
			{
				type: "paragraph",
				text: "Chain prompts sequentially, passing outputs from one step as inputs to the next. Ideal for complex tasks requiring progressive refinement.",
			},
			{
				type: "list",
				items: [
					"Define clear output keys for each step",
					"Specify dependencies between steps",
					"Handle errors with skip/retry/abort strategies",
					"Support parallel execution where dependencies allow",
				],
			},
			{
				type: "code",
				language: "typescript",
				caption: "Example: Analysis Chain",
				code: `// Multi-step analysis with output passing
await promptChainingBuilder({
  chainName: "Code Security Analysis",
  steps: [
    {
      name: "Initial Scan",
      prompt: "Scan the codebase for security issues",
      outputKey: "vulnerabilities"
    },
    {
      name: "Risk Assessment",
      prompt: "Assess risk level of {{vulnerabilities}}",
      dependencies: ["vulnerabilities"],
      outputKey: "risks"
    },
    {
      name: "Remediation Plan",
      prompt: "Create remediation plan for {{risks}}",
      dependencies: ["risks"],
      errorHandling: "retry"
    }
  ]
});`,
			},
			{ type: "heading", level: 2, text: "Flow-Based Orchestration" },
			{
				type: "paragraph",
				text: "Define complex flows with conditional branching, loops, parallel execution, and merge points. Enables adaptive prompting based on intermediate results.",
			},
			{
				type: "list",
				items: [
					"Node types: prompt, condition, loop, parallel, merge, transform",
					"Edge conditions for dynamic routing",
					"Visual flow diagrams with Mermaid",
					"Error handling and fallback paths",
				],
			},
			{
				type: "code",
				language: "typescript",
				caption: "Example: Conditional Flow",
				code: `// Adaptive flow with branching
await promptFlowBuilder({
  flowName: "Adaptive Code Review",
  nodes: [
    {
      id: "analyze",
      type: "prompt",
      name: "Analyze Code",
      config: { prompt: "Review code quality" }
    },
    {
      id: "check_complexity",
      type: "condition",
      name: "Check Complexity",
      config: { expression: "complexity > 10" }
    },
    {
      id: "deep_review",
      type: "prompt",
      name: "Deep Review",
      config: { prompt: "Perform detailed analysis" }
    },
    {
      id: "quick_review",
      type: "prompt",
      name: "Quick Review",
      config: { prompt: "Perform basic checks" }
    }
  ],
  edges: [
    { from: "analyze", to: "check_complexity" },
    { from: "check_complexity", to: "deep_review", condition: "true" },
    { from: "check_complexity", to: "quick_review", condition: "false" }
  ]
});`,
			},
			{ type: "heading", level: 2, text: "Dynamic Template Selection" },
			{
				type: "paragraph",
				text: "Automatically select the most appropriate prompting strategy based on task characteristics. Combine with existing tools like hierarchy-level-selector for context-aware prompting.",
			},
			{
				type: "list",
				items: [
					"Analyze task complexity, domain, and requirements",
					"Select from: hierarchical, security, spark, domain-neutral, flow-based",
					"Configure templates with task-specific parameters",
					"Chain multiple templates for complex workflows",
				],
			},
			{ type: "heading", level: 2, text: "Best Practices" },
			{
				type: "list",
				items: [
					"Keep individual prompts focused and modular",
					"Use explicit output keys for inter-step communication",
					"Define clear error handling strategies per step",
					"Visualize flows with diagrams for team collaboration",
					"Test flows with edge cases and error scenarios",
					"Monitor execution paths for optimization",
					"Document complex conditions and transformations",
				],
			},
			{ type: "heading", level: 2, text: "Integration Patterns" },
			{
				type: "paragraph",
				text: "Combine flow-based prompting with existing MCP tools for powerful workflows:",
			},
			{
				type: "code",
				language: "typescript",
				caption: "Integrated Workflow Example",
				code: `// 1. Select appropriate hierarchy level
const level = await hierarchyLevelSelector({
  taskDescription: "Implement authentication",
  agentCapability: "intermediate"
});

// 2. Build hierarchical prompt
const prompt = await hierarchicalPromptBuilder({
  context: level.context,
  goal: level.goal,
  requirements: level.requirements
});

// 3. Create security-focused chain
const chain = await promptChainingBuilder({
  chainName: "Secure Implementation",
  steps: [
    {
      name: "Design",
      prompt: prompt.content[0].text
    },
    {
      name: "Security Review",
      prompt: "Review design for security issues",
      dependencies: ["Design"]
    },
    {
      name: "Implementation",
      prompt: "Implement with security controls",
      dependencies: ["Security Review"]
    }
  ]
});`,
			},
			{
				type: "references",
				items: [
					{
						title: "Claude Flow - AI Orchestration Platform",
						url: "https://github.com/ruvnet/claude-flow",
						source: "GitHub",
					},
					{
						title: "Prompt Chaining Techniques",
						url: "https://www.promptingguide.ai/techniques/prompt_chaining",
						source: "Prompting Guide",
					},
					{
						title: "Flow-Based Programming",
						url: "https://en.wikipedia.org/wiki/Flow-based_programming",
						source: "Wikipedia",
					},
					{
						title: "Multi-Agent AI Systems",
						url: "https://arxiv.org/abs/2203.11171",
						source: "arXiv",
					},
				],
			},
		],
	},
];
