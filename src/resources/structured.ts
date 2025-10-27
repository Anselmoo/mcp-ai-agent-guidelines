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
			{ type: "heading", level: 2, text: "Serena Integration" },
			{
				type: "paragraph",
				text: "Combine flow-based prompting with Serena memory patterns for context-aware, persistent workflows. Use project memories, mode switching, and semantic analysis within flows.",
			},
			{
				type: "list",
				items: [
					"Memory-aware chaining: Use project-onboarding memories in chains",
					"Mode-appropriate flows: Switch modes (planning/editing/analysis) during execution",
					"Semantic-aware flows: Integrate semantic-code-analyzer for symbol-based operations",
					"Context optimization: Use memory-context-optimizer between steps for long flows",
					"Multi-mode orchestration: Design flows that adapt mode based on current phase",
				],
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
						title: "Serena - Coding Agent Toolkit",
						url: "https://github.com/oraios/serena",
						source: "GitHub",
					},
					{
						title: "Flow & Serena Integration Guide",
						url: "https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/main/docs/FLOW_SERENA_INTEGRATION.md",
						source: "MCP AI Agent Guidelines",
						note: "Comprehensive integration patterns and examples",
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
	// Agent-relative call patterns and examples
	{
		id: "agent-relative-calls",
		title: "Agent-Relative Call Patterns for MCP Tools",
		version: "1.0.0",
		lastUpdated: updated,
		tags: ["mcp", "agent", "patterns", "prompting", "workflows"],
		segments: [
			{ type: "heading", level: 2, text: "Overview" },
			{
				type: "paragraph",
				text: "Agent-relative calls enable AI agents to discover, invoke, and chain MCP tools contextually through natural language prompts. This guide demonstrates patterns for using the AI Agent Guidelines MCP server's tools in agent-driven workflows.",
			},
			{
				type: "callout",
				text: "Following the Model Context Protocol standard, this server provides 22+ tools, prompts, and resources that agents can invoke using clear, descriptive patterns like 'Use the [Tool] MCP to...'",
			},
			{ type: "heading", level: 2, text: "What Are Agent-Relative Calls?" },
			{
				type: "paragraph",
				text: "Agent-relative calls are natural language patterns that enable agents to:",
			},
			{
				type: "list",
				items: [
					"Discover available tools through descriptive names and purposes",
					"Understand when and how to invoke specific tools contextually",
					"Chain multiple tool calls to accomplish complex workflows",
					"Adapt their approach based on tool outputs and feedback",
				],
			},
			{ type: "heading", level: 2, text: "Core Prompt Patterns" },
			{
				type: "paragraph",
				text: "Use these patterns to guide agents in invoking tools from this MCP server:",
			},
			{
				type: "table",
				headers: ["Pattern", "Example", "Tool Category"],
				rows: [
					[
						"Use the [Tool] MCP to...",
						"Use the hierarchical-prompt-builder MCP to create a structured prompt for code refactoring",
						"Prompt Builders",
					],
					[
						"Analyze using [Tool]...",
						"Analyze using the code-hygiene-analyzer to identify technical debt",
						"Code Analysis",
					],
					[
						"Generate with [Tool]...",
						"Generate with the mermaid-diagram-generator a system architecture diagram",
						"Visualization",
					],
					[
						"Validate using [Tool]...",
						"Validate using the guidelines-validator that the implementation follows best practices",
						"Validation",
					],
					[
						"Check with [Tool]...",
						"Check with the model-compatibility-checker which AI model best fits this task",
						"Planning",
					],
				],
			},
			{ type: "heading", level: 2, text: "Tool Categories & Usage" },
			{ type: "heading", level: 3, text: "1. Prompt Building Tools" },
			{
				type: "paragraph",
				text: "Create structured, high-quality prompts for AI agents with various levels of specificity and focus areas.",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Example: Multi-step prompt building workflow",
				code: `# Agent Prompt:
Use the hierarchical-prompt-builder MCP to create a comprehensive code review prompt with:
- Context: Legacy codebase modernization
- Goal: Identify security vulnerabilities and performance issues
- Requirements: Focus on authentication, data handling, and API endpoints
- Include technique hints for chain-of-thought analysis

Then use the security-hardening-prompt-builder MCP to create a focused security analysis prompt targeting:
- OWASP Top 10 compliance
- Input validation patterns
- Authentication mechanisms`,
			},
			{
				type: "list",
				items: [
					"**hierarchical-prompt-builder**: Structured prompts with clear context → goal → requirements hierarchy",
					"**code-analysis-prompt-builder**: Code analysis prompts (security, performance, maintainability)",
					"**architecture-design-prompt-builder**: System architecture and design planning prompts",
					"**debugging-assistant-prompt-builder**: Systematic debugging and troubleshooting prompts",
					"**documentation-generator-prompt-builder**: Technical documentation generation prompts",
					"**security-hardening-prompt-builder**: Security-focused analysis with OWASP/compliance checks",
					"**spark-prompt-builder**: UI/UX design prompts with color, typography, and animation specs",
					"**domain-neutral-prompt-builder**: Generic workflow prompts with objectives and milestones",
				],
			},
			{ type: "heading", level: 3, text: "2. Code Analysis & Quality Tools" },
			{
				type: "paragraph",
				text: "Analyze code quality, identify technical debt, and improve test coverage.",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Example: Comprehensive code quality analysis",
				code: `# Agent Prompt:
I need to assess the quality of our authentication module. Please:

1. Use the clean-code-scorer MCP to evaluate the codebase and provide a 0-100 quality score
2. Use the code-hygiene-analyzer MCP to identify outdated patterns, unused dependencies, and code smells
3. Use the iterative-coverage-enhancer MCP to analyze test coverage gaps and suggest test improvements
4. Use the dependency-auditor MCP to check for security vulnerabilities in dependencies

Provide a summary report with prioritized recommendations.`,
			},
			{
				type: "list",
				items: [
					"**clean-code-scorer**: Comprehensive code quality scoring (0-100) with detailed metrics",
					"**code-hygiene-analyzer**: Detect outdated patterns, unused dependencies, code smells",
					"**iterative-coverage-enhancer**: Test coverage analysis with adaptive threshold recommendations",
					"**dependency-auditor**: Security vulnerability scanning for project dependencies",
					"**semantic-code-analyzer**: Semantic code analysis with symbol inspection and reference finding",
				],
			},
			{ type: "heading", level: 3, text: "3. Strategy & Planning Tools" },
			{
				type: "paragraph",
				text: "Strategic analysis frameworks and project planning utilities for agile development.",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Example: Strategic planning workflow",
				code: `# Agent Prompt:
We're planning a microservices migration. Help me create a strategic plan:

1. Use the strategy-frameworks-builder MCP to generate:
   - SWOT analysis for the migration
   - Balanced Scorecard with objectives and KPIs
   - Porter's Five Forces for competitive analysis

2. Use the gap-frameworks-analyzers MCP to analyze:
   - Current state: Monolithic architecture
   - Desired state: Cloud-native microservices
   - Frameworks: capability, technology, and strategic gaps

3. Use the sprint-timeline-calculator MCP to estimate implementation timeline with team velocity considerations`,
			},
			{
				type: "list",
				items: [
					"**strategy-frameworks-builder**: SWOT, Balanced Scorecard, VRIO, Porter's Five Forces, BCG Matrix, etc.",
					"**gap-frameworks-analyzers**: Capability, performance, maturity, skills, technology, and process gap analysis",
					"**sprint-timeline-calculator**: Agile sprint planning with velocity and complexity estimates",
				],
			},
			{
				type: "heading",
				level: 3,
				text: "4. Visualization & Documentation Tools",
			},
			{
				type: "paragraph",
				text: "Generate diagrams, visualizations, and documentation artifacts.",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Example: Architecture visualization",
				code: `# Agent Prompt:
Document our system architecture:

Use the mermaid-diagram-generator MCP to create:
1. A flowchart showing the user authentication flow
2. A sequence diagram for the payment processing workflow
3. An ER diagram of our database schema
4. A class diagram showing the core domain models

Generate these in Mermaid format suitable for markdown documentation.`,
			},
			{
				type: "list",
				items: [
					"**mermaid-diagram-generator**: Generate flowcharts, sequence diagrams, ER diagrams, class diagrams, state machines, etc.",
					"**memory-context-optimizer**: Optimize prompts for context window efficiency",
					"**project-onboarding**: Scan and analyze project structure for developer onboarding",
				],
			},
			{ type: "heading", level: 3, text: "5. Development Workflow Tools" },
			{
				type: "paragraph",
				text: "Tools for validation, model selection, and workflow optimization.",
			},
			{
				type: "list",
				items: [
					"**guidelines-validator**: Validate development practices against AI agent best practices",
					"**model-compatibility-checker**: Recommend best AI models for specific tasks and requirements",
					"**hierarchy-level-selector**: Select appropriate prompting hierarchy level (independent, direct, scaffolding)",
					"**prompting-hierarchy-evaluator**: Evaluate and improve prompt effectiveness",
					"**mode-switcher**: Switch between planning, editing, and analysis modes",
					"**prompt-chaining-builder**: Create sequential prompt chains for complex workflows",
					"**prompt-flow-builder**: Design parallel/conditional prompt flows with visual diagrams",
				],
			},
			{ type: "heading", level: 3, text: "6. Design & Architecture Tools" },
			{
				type: "paragraph",
				text: "Comprehensive design workflow tools for managing multi-phase design processes.",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Example: Complete design workflow",
				code: `# Agent Prompt:
I need to design a new feature for our application. Use the design-assistant MCP to:

1. Start a design session for "Real-time collaboration feature"
2. Advance through phases: discovery → requirements → architecture → implementation
3. Generate artifacts including ADRs, specifications, and roadmap
4. Validate consistency across all phases
5. Enforce coverage requirements before advancing`,
			},
			{
				type: "list",
				items: [
					"**design-assistant**: Multi-phase design workflow orchestration with constraint validation",
				],
			},
			{ type: "heading", level: 2, text: "Multi-Tool Workflow Examples" },
			{
				type: "heading",
				level: 3,
				text: "Example 1: Complete Code Review & Improvement",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Agent prompt for comprehensive code review",
				code: `# Complete Code Review Workflow

I need a comprehensive code review and improvement plan for our authentication module.

## Step 1: Initial Analysis
Use the clean-code-scorer MCP to evaluate the authentication module code and provide a baseline quality score.

## Step 2: Detailed Assessment
Use the code-hygiene-analyzer MCP to identify:
- Outdated authentication patterns
- Unused dependencies
- Security anti-patterns
- Code smells in error handling

## Step 3: Security Deep Dive
Use the security-hardening-prompt-builder MCP to create a security analysis prompt focusing on:
- OWASP Top 10 vulnerabilities
- Authentication best practices
- Session management security
- Input validation patterns

## Step 4: Test Coverage
Use the iterative-coverage-enhancer MCP to:
- Analyze current test coverage for auth module
- Identify untested critical paths
- Generate test suggestions for edge cases
- Recommend coverage thresholds

## Step 5: Dependencies
Use the dependency-auditor MCP to check all authentication-related dependencies for known vulnerabilities.

## Step 6: Documentation
Use the mermaid-diagram-generator MCP to create:
- Authentication flow sequence diagram
- State machine for session lifecycle
- Architecture diagram showing auth components

## Step 7: Action Plan
Use the sprint-timeline-calculator MCP to estimate the effort for implementing all recommended improvements.

Compile all findings into a prioritized action plan with timelines.`,
			},
			{ type: "heading", level: 3, text: "Example 2: New Feature Development" },
			{
				type: "code",
				language: "markdown",
				caption: "Agent prompt for feature development workflow",
				code: `# New Feature: Real-time Notifications

We need to add real-time notifications to our application.

## Phase 1: Planning & Design
1. Use the design-assistant MCP to start a design session for "Real-time Notifications Feature"
2. Use the strategy-frameworks-builder MCP to create a SWOT analysis for different implementation approaches (WebSockets vs Server-Sent Events vs Polling)
3. Use the gap-frameworks-analyzers MCP to analyze capability gaps between current state and desired state

## Phase 2: Architecture
1. Use the architecture-design-prompt-builder MCP to create an architecture planning prompt
2. Use the mermaid-diagram-generator MCP to create:
   - System architecture diagram
   - Sequence diagram for notification flow
   - State machine for connection management

## Phase 3: Implementation Planning
1. Use the hierarchical-prompt-builder MCP to create structured implementation prompts for:
   - Backend notification service
   - WebSocket server setup
   - Frontend notification UI
2. Use the model-compatibility-checker MCP to select the best AI model for code generation
3. Use the sprint-timeline-calculator MCP to estimate development timeline

## Phase 4: Quality Assurance
1. Use the guidelines-validator MCP to ensure the design follows best practices
2. Use the iterative-coverage-enhancer MCP to plan test coverage strategy
3. Use the security-hardening-prompt-builder MCP to create security review checklist

## Phase 5: Documentation
Use the documentation-generator-prompt-builder MCP to create:
- API documentation
- User guide for notification preferences
- Developer guide for extending notification types`,
			},
			{
				type: "heading",
				level: 3,
				text: "Example 3: Legacy System Modernization",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Agent prompt for legacy modernization",
				code: `# Legacy CRM System Modernization

Modernize our legacy PHP CRM system to a modern microservices architecture.

## Assessment Phase
1. Use the code-hygiene-analyzer MCP to scan the legacy codebase for:
   - Outdated patterns and frameworks
   - Security vulnerabilities
   - Performance bottlenecks
   - Technical debt hotspots

2. Use the semantic-code-analyzer MCP to:
   - Map dependencies between modules
   - Identify highly coupled components
   - Find dead code for removal

3. Use the clean-code-scorer MCP to establish baseline quality metrics

## Strategy Phase
1. Use the strategy-frameworks-builder MCP to generate:
   - SWOT analysis for modernization
   - Porter's Five Forces for vendor/technology selection
   - BCG Matrix for feature prioritization

2. Use the gap-frameworks-analyzers MCP for:
   - Technology gap analysis (PHP monolith → Node.js microservices)
   - Skills gap analysis (team capabilities)
   - Process gap analysis (waterfall → agile)

## Design Phase
1. Use the design-assistant MCP to manage the multi-phase design process
2. Use the mermaid-diagram-generator MCP to visualize:
   - Current architecture (as-is)
   - Target architecture (to-be)
   - Migration phases and dependencies

3. Use the architecture-design-prompt-builder MCP to create detailed architecture planning prompts

## Implementation Planning
1. Use the sprint-timeline-calculator MCP to estimate migration timeline
2. Use the prompt-chaining-builder MCP to create sequential migration steps
3. Use the hierarchical-prompt-builder MCP for detailed implementation guidance

## Validation
1. Use the guidelines-validator MCP to ensure adherence to best practices
2. Use the model-compatibility-checker MCP to select appropriate AI assistants for different phases
3. Use the dependency-auditor MCP to validate all new dependencies`,
			},
			{
				type: "heading",
				level: 2,
				text: "Best Practices for Agent-Relative Calls",
			},
			{ type: "heading", level: 3, text: "1. Be Specific About Goals" },
			{
				type: "paragraph",
				text: "Clearly define what you want to accomplish and what output format you expect. Agents work best with explicit instructions.",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Good example",
				code: `Use the hierarchical-prompt-builder MCP to create a code review prompt with:
- Context: React application with TypeScript
- Goal: Identify accessibility issues in UI components
- Requirements: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
- Output: Structured markdown report with severity levels`,
			},
			{ type: "heading", level: 3, text: "2. Provide Context" },
			{
				type: "paragraph",
				text: "Include relevant background information about your project, technology stack, and any constraints.",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Context example",
				code: `Our e-commerce platform uses:
- Node.js backend with Express
- React frontend with Next.js
- PostgreSQL database
- Deployed on AWS with Docker

Use the architecture-design-prompt-builder MCP to plan a migration to serverless architecture.`,
			},
			{ type: "heading", level: 3, text: "3. Chain Tools Logically" },
			{
				type: "paragraph",
				text: "Order tool calls from analysis → planning → implementation → validation for best results.",
			},
			{
				type: "list",
				items: [
					"**Analysis first**: Use code-hygiene-analyzer, clean-code-scorer before making changes",
					"**Strategic planning**: Use strategy-frameworks-builder, gap-frameworks-analyzers for major decisions",
					"**Design before implementation**: Use design-assistant, architecture-design-prompt-builder",
					"**Validate continuously**: Use guidelines-validator, dependency-auditor throughout",
					"**Document outcomes**: Use mermaid-diagram-generator, documentation-generator-prompt-builder",
				],
			},
			{ type: "heading", level: 3, text: "4. Set Boundaries" },
			{
				type: "paragraph",
				text: "Specify constraints, limitations, and what the agent should NOT do.",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Boundary setting example",
				code: `Use the design-assistant MCP to plan the new feature, but:
- DO NOT make any code changes yet
- Focus only on the discovery and requirements phases
- Skip implementation details until approved
- Limit scope to the user authentication flow only`,
			},
			{ type: "heading", level: 3, text: "5. Request Confirmations" },
			{
				type: "paragraph",
				text: "Ask agents to confirm understanding before proceeding with significant changes or decisions.",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Confirmation request example",
				code: `Before using the sprint-timeline-calculator MCP to estimate the timeline, please:
1. Summarize your understanding of the requirements
2. List any assumptions you're making
3. Identify any missing information needed
4. Wait for my confirmation before proceeding`,
			},
			{ type: "heading", level: 2, text: "Tool Discovery & Selection" },
			{
				type: "paragraph",
				text: "Agents can discover available tools through the MCP protocol's ListTools request. Each tool includes:",
			},
			{
				type: "list",
				items: [
					"**name**: Descriptive identifier (e.g., 'hierarchical-prompt-builder')",
					"**description**: Clear explanation of what the tool does",
					"**inputSchema**: Detailed parameter descriptions and constraints",
				],
			},
			{
				type: "paragraph",
				text: "When multiple tools could accomplish a task, agents should select based on:",
			},
			{
				type: "table",
				headers: ["Criterion", "Consideration", "Example"],
				rows: [
					[
						"Specificity",
						"More specialized tools for focused tasks",
						"Use security-hardening-prompt-builder for security instead of generic code-analysis-prompt-builder",
					],
					[
						"Scope",
						"Match tool capabilities to task scope",
						"Use design-assistant for multi-phase workflows, not single-purpose tools",
					],
					[
						"Output Format",
						"Choose tools that produce needed format",
						"Use mermaid-diagram-generator for visual diagrams, not text descriptions",
					],
					[
						"Integration",
						"Consider which tools work well together",
						"Use prompt-flow-builder for complex workflows instead of manual chaining",
					],
				],
			},
			{ type: "heading", level: 2, text: "Prompts & Resources" },
			{
				type: "paragraph",
				text: "In addition to tools, this MCP server provides prompts and resources that agents can use:",
			},
			{ type: "heading", level: 3, text: "Available Prompts" },
			{
				type: "list",
				items: [
					"**code-analysis-prompt**: Comprehensive code analysis and review template",
					"**spark-ui-prompt**: Spark UI design template for developer experiences",
					"**hierarchical-task-prompt**: Structured task breakdown template",
					"**architecture-design-prompt**: System architecture design and planning",
					"**debugging-assistant-prompt**: Systematic debugging and troubleshooting",
					"**documentation-generator-prompt**: Technical documentation generation",
					"**security-analysis-prompt**: Security-focused code analysis with vulnerability assessment",
				],
			},
			{ type: "heading", level: 3, text: "Available Resources" },
			{
				type: "list",
				items: [
					"**guidelines://core-development-principles**: Authoritative references for prompts, sprints, hygiene, Mermaid, memory",
					"**guidelines://core-principles**: Fundamental AI agent development principles",
					"**guidelines://prompt-templates**: Reusable prompt patterns and templates",
					"**guidelines://development-checklists**: Comprehensive development workflow checklists",
					"**guidelines://model-selection**: AI model selection guide based on task requirements",
					"**guidelines://architecture-patterns**: Common architectural patterns and best practices",
					"**guidelines://rapid-model-evolution**: Guidance for handling fast-changing model landscapes",
					"**guidelines://external-references**: Selected URLs for grounding with live details",
					"**guidelines://mcp-ts-insights**: MCP TypeScript SDK patterns for resources and tools",
					"**guidelines://knowledge-base**: Offline summaries from public sources",
					"**guidelines://mcp-advanced-functions**: MCP lifecycle management, notifications, completions",
				],
			},
			{ type: "heading", level: 2, text: "Integration with Other MCP Servers" },
			{
				type: "paragraph",
				text: "The AI Agent Guidelines MCP server is designed to work alongside other MCP servers in multi-tool agent workflows:",
			},
			{
				type: "code",
				language: "markdown",
				caption: "Example: Combining multiple MCP servers",
				code: `# Multi-MCP Workflow: Accessibility Compliance Review

I need to ensure our web app meets WCAG 2.1 AA compliance standards.

## Step 1: Design Analysis (Figma MCP)
Use the Figma MCP to analyze our design file at [URL] for:
- Color contrast ratios
- Typography accessibility
- Focus state indicators
- Touch target sizes

## Step 2: Issue Identification (GitHub MCP)
Use the GitHub MCP to find open issues in our repository with labels:
- accessibility
- a11y
- WCAG
And categorize them by severity and component.

## Step 3: Code Analysis (AI Agent Guidelines MCP)
Use the security-hardening-prompt-builder MCP from AI Agent Guidelines to create a comprehensive accessibility audit prompt focusing on:
- Semantic HTML structure
- ARIA attributes usage
- Keyboard navigation
- Screen reader compatibility

## Step 4: Test Planning (AI Agent Guidelines MCP)
Use the iterative-coverage-enhancer MCP to analyze our accessibility test coverage and suggest:
- Missing test scenarios
- Edge cases for assistive technologies
- Automated accessibility testing integration

## Step 5: Implementation Plan (AI Agent Guidelines MCP)
Use the sprint-timeline-calculator MCP to estimate effort for:
- Fixing critical accessibility issues
- Implementing automated testing
- Documentation updates

## Step 6: Testing (Playwright MCP)
Use the Playwright MCP to create and run automated accessibility tests for:
- Color contrast validation
- Keyboard navigation flows
- Screen reader announcements
- Focus management

## Step 7: Documentation (AI Agent Guidelines MCP)
Use the mermaid-diagram-generator MCP to create:
- Accessibility testing workflow diagram
- Component accessibility decision tree
Use the documentation-generator-prompt-builder MCP to create accessibility guidelines for the team.

## Step 8: Issue Updates (GitHub MCP)
Use the GitHub MCP to:
- Update resolved accessibility issues with test results
- Create new issues for remaining work
- Link commits to accessibility improvements`,
			},
			{
				type: "paragraph",
				text: "This demonstrates how the AI Agent Guidelines MCP server complements other MCP servers (GitHub, Figma, Playwright) in complex, multi-step workflows.",
			},
			{ type: "heading", level: 2, text: "Security Considerations" },
			{
				type: "list",
				items: [
					"**Input validation**: All tools validate inputs using Zod schemas before processing",
					"**No external calls**: Tools perform local analysis without making external API calls",
					"**No secrets**: Tools don't require or store API keys, tokens, or sensitive credentials",
					"**Read-only operations**: Analysis tools only read code/data, they don't modify files",
					"**Dependency auditing**: Use dependency-auditor to check for known vulnerabilities",
					"**Security-focused tools**: Use security-hardening-prompt-builder for security-specific analysis",
				],
			},
			{ type: "heading", level: 2, text: "Performance Tips" },
			{
				type: "list",
				items: [
					"**Context optimization**: Use memory-context-optimizer for large prompts to reduce token usage",
					"**Batch operations**: Chain related tools in one prompt instead of multiple separate calls",
					"**Progressive analysis**: Start with high-level tools (clean-code-scorer) before deep dives",
					"**Caching**: Reuse tool outputs when appropriate instead of re-running analysis",
					"**Scope limiting**: Provide specific file paths or modules instead of analyzing entire codebases",
				],
			},
			{
				type: "references",
				items: [
					{
						title: "Enhance Agent Mode with MCP - GitHub Documentation",
						url: "https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp",
						source: "GitHub",
						note: "Official guide on using MCP with GitHub Copilot agent mode",
					},
					{
						title: "Model Context Protocol - Anthropic",
						url: "https://www.anthropic.com/news/model-context-protocol",
						source: "Anthropic",
						note: "MCP announcement and overview",
					},
					{
						title: "Model Context Protocol - Official Documentation",
						url: "https://modelcontextprotocol.io/introduction",
						source: "MCP",
						note: "Complete MCP specification and guides",
					},
					{
						title: "MCP Architecture - Cloudflare",
						url: "https://developers.cloudflare.com/agents/model-context-protocol/",
						source: "Cloudflare",
						note: "MCP architecture guide with tool design principles",
					},
					{
						title: "MCP with LangChain",
						url: "https://docs.langchain.com/oss/python/langchain/mcp",
						source: "LangChain",
						note: "Implementing MCP servers with Python",
					},
					{
						title: "Building Agents with MCP on Azure",
						url: "https://learn.microsoft.com/en-us/azure/developer/ai/intro-agents-mcp",
						source: "Microsoft",
						note: "MCP integration patterns on Azure",
					},
					{
						title: "MCP AI Agent Guidelines - GitHub Repository",
						url: "https://github.com/Anselmoo/mcp-ai-agent-guidelines",
						source: "GitHub",
						note: "This MCP server's source code and documentation",
					},
				],
			},
		],
	},
];
