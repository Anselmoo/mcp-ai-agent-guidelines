import { z } from "zod";
import { buildReferencesSection } from "./shared/prompt-utils.js";

const MemoryOptimizationSchema = z.object({
	contextContent: z.string(),
	maxTokens: z.number().optional(),
	cacheStrategy: z.enum(["aggressive", "conservative", "balanced"]).optional(),
	includeReferences: z.boolean().optional().default(true),
	language: z.string().optional(),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
});

type MemoryOptimizationInput = z.infer<typeof MemoryOptimizationSchema>;

type CacheSegment = {
	type: string;
	tokens: number;
	description: string;
};

export async function memoryContextOptimizer(args: unknown) {
	const input = MemoryOptimizationSchema.parse(args);
	const optimization = optimizeMemoryContext(input);

	const references = input.includeReferences
		? buildReferencesSection([
				"Prompt Caching overview (Anthropic): https://www.anthropic.com/news/prompt-caching",
				"Anthropic docs on caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
				"Token usage optimization tips: https://caylent.com/blog/prompt-caching-saving-time-and-money-in-llm-applications",
			])
		: undefined;

	const fence = input.language ? input.language.toLowerCase() : "";

	const segmentsList = (optimization.cacheSegments || []).length
		? (optimization.cacheSegments || [])
				.map(
					(s, i) =>
						`${i + 1}. **${s.type}** (${s.tokens} tokens): ${s.description}`,
				)
				.join("\n")
		: "";

	const segmentsTable = (optimization.cacheSegments || []).length
		? `\n#### Cache Segment Table\n| # | Type | Tokens | Purpose |\n|---:|---|---:|---|\n${(
				optimization.cacheSegments || []
			)
				.map(
					(s, i) => `| ${i + 1} | ${s.type} | ${s.tokens} | ${s.description} |`,
				)
				.join("\\n")}`
		: "";

	const pie = (() => {
		const total = (optimization.cacheSegments || []).reduce(
			(acc, s) => acc + (s.tokens || 0),
			0,
		);
		if (!total) return "";
		const lines = (optimization.cacheSegments || [])
			.map((s) => `  "${s.type}" : ${Math.max(0, s.tokens || 0)}`)
			.join("\n");
		return `\n#### Mermaid: Cache Tokens by Segment\n\n\`\`\`mermaid\npie showData\n  title Cache Tokens by Segment\n${lines}\n\`\`\``;
	})();

	const usage =
		fence === "python"
			? `\`\`\`python\n# Example: prepare concise context and request optimization\ncontext = "Python repo. Fix security issues; add validation and logging. Key: UserManager, calculate_discount, process_user_data."\n# In an MCP call, pass as { contextContent: context, cacheStrategy: 'balanced', language: 'python' }\n# This tool returns a Markdown report with an optimized context block.\n\`\`\``
			: `\`\`\`ts\n// Example: prepare concise context and request optimization\nconst context = "Python repo. Fix security issues; add validation and logging. Key: UserManager, calculate_discount, process_user_data.";\n// In an MCP call, pass as { contextContent: context, cacheStrategy: 'balanced', language: 'typescript' }\n// This tool returns a Markdown report with an optimized context block.\n\`\`\``;

	const metadata = input.includeMetadata
		? [
				"### Metadata",
				`- Updated: ${new Date().toISOString().slice(0, 10)}`,
				"- Source tool: mcp_ai-agent-guid_memory-context-optimizer",
				input.inputFile ? `- Input file: ${input.inputFile}` : undefined,
				"",
			]
				.filter(Boolean)
				.join("\n")
		: "";

	const text = `## 🧠 Memory Context Optimization Report

${metadata}

### 🔎 Input Analysis
- **Original Length**: ${input.contextContent.length} characters
- **Estimated Tokens**: ~${Math.ceil(input.contextContent.length / 4)}
- **Max Tokens Limit**: ${input.maxTokens || "Not specified"}
- **Cache Strategy**: ${input.cacheStrategy || "balanced"}

### ✅ Optimization Results
- **Optimized Length**: ${optimization.optimizedContent.length} characters
- **Estimated Tokens**: ~${Math.ceil(optimization.optimizedContent.length / 4)}
- **Reduction**: ${optimization.reductionPercentage}%
- **Cache Segments**: ${optimization.cacheSegments.length}

### 📊 Summary
| Metric | Value |
|---|---|
| Original Length | ${input.contextContent.length} chars |
| Original Tokens (est.) | ~${Math.ceil(input.contextContent.length / 4)} |
| Optimized Length | ${optimization.optimizedContent.length} chars |
| Optimized Tokens (est.) | ~${Math.ceil(optimization.optimizedContent.length / 4)} |
| Reduction | ${optimization.reductionPercentage}% |
| Cache Strategy | ${optimization.cacheStrategy} |
| Max Tokens | ${input.maxTokens || "Not specified"} |
| Cache Segments | ${optimization.cacheSegments.length} |

### ✂️ Optimized Content
\`\`\`${fence}
${optimization.optimizedContent}
\`\`\`

### 🧩 Caching Strategy
${
	(input.cacheStrategy || "balanced") === "aggressive"
		? "**Aggressive Caching**: Maximizes cache usage, suitable for repetitive contexts"
		: (input.cacheStrategy || "balanced") === "conservative"
			? "**Conservative Caching**: Minimal caching, preserves most context freshness"
			: "**Balanced Caching**: Optimizes between cache efficiency and context freshness"
}

${optimization.cacheSegments.length ? `### 🧱 Cache Segments\n${segmentsList}\n${segmentsTable}\n${pie}\n` : ""}

### 🔧 Implementation Tips
1. **Use prompt caching** for repeated system messages and tool definitions
2. **Implement conversation summarization** for long sessions
3. **Clear unnecessary context** periodically to reduce token usage
4. **Prioritize recent context** over older conversation history
5. **Cache static resources** like guidelines and templates

### 🧭 Memory Management Best Practices
- Monitor token usage in real-time
- Implement automatic context compression when approaching limits
- Use structured data formats to reduce token overhead
- Leverage semantic similarity to identify redundant information
- Implement rolling window approach for conversation history
${references ? `\n${references}\n` : ""}

### 📁 Files
- Source tool: src/tools/memory-context-optimizer.ts
- Demo output: demos/demo-code-analysis.memory-optimizer.md

### 🚀 Quick Usage Example
${usage}

### ⚠️ Disclaimer
- Caching effectiveness and token estimates vary by provider and model. Validate in your environment.
`;

	return { content: [{ type: "text", text }] };
}

function optimizeMemoryContext(input: MemoryOptimizationInput) {
	const { contextContent, maxTokens, cacheStrategy = "balanced" } = input;

	let optimizedContent = contextContent;
	const cacheSegments: CacheSegment[] = [];

	// Preserve code formatting for likely code blocks
	const looksLikeCode =
		/\b(class |def |function |import |const |let |{ |}\s*$)/m.test(
			contextContent,
		);
	if (!looksLikeCode) {
		optimizedContent = optimizedContent.replace(/\s+/g, " ").trim();
	}

	const systemPrompts = extractSystemPrompts(optimizedContent);
	const toolDefinitions = extractToolDefinitions(optimizedContent);
	const staticResources = extractStaticResources(optimizedContent);

	switch (cacheStrategy) {
		case "aggressive": {
			if (systemPrompts.length > 0) {
				cacheSegments.push({
					type: "System Prompts",
					tokens: Math.ceil(systemPrompts.join(" ").length / 4),
					description: "Cached system-level instructions and guidelines",
				});
			}
			if (toolDefinitions.length > 0) {
				cacheSegments.push({
					type: "Tool Definitions",
					tokens: Math.ceil(toolDefinitions.join(" ").length / 4),
					description: "Cached tool schemas and descriptions",
				});
			}
			if (staticResources.length > 0) {
				cacheSegments.push({
					type: "Static Resources",
					tokens: Math.ceil(staticResources.join(" ").length / 4),
					description: "Cached documentation and reference materials",
				});
			}
			break;
		}
		case "conservative": {
			if (systemPrompts.length > 0) {
				cacheSegments.push({
					type: "Core System Prompt",
					tokens: Math.ceil((systemPrompts[0] || "").length / 4),
					description: "Primary system instructions only",
				});
			}
			break;
		}
		default: {
			if (systemPrompts.length > 0) {
				cacheSegments.push({
					type: "System Prompts",
					tokens: Math.ceil(systemPrompts.join(" ").length / 4),
					description: "System-level instructions and core guidelines",
				});
			}
			if (toolDefinitions.length > 0) {
				cacheSegments.push({
					type: "Tool Definitions",
					tokens: Math.ceil(toolDefinitions.join(" ").length / 4),
					description: "Tool schemas and function descriptions",
				});
			}
			break;
		}
	}

	if (maxTokens) {
		const currentTokens = Math.ceil(optimizedContent.length / 4);
		if (currentTokens > maxTokens) {
			const targetLength = maxTokens * 4;
			optimizedContent = intelligentTruncate(optimizedContent, targetLength);
		}
	}

	const originalLength = contextContent.length;
	const optimizedLength = optimizedContent.length;
	const reductionPercentage = Math.round(
		(1 - optimizedLength / originalLength) * 100,
	);

	return {
		optimizedContent,
		reductionPercentage,
		cacheSegments,
		cacheStrategy,
	};
}

function extractSystemPrompts(content: string): string[] {
	const patterns = [
		/You are a[^.]+\./gi,
		/System:[^\n]+/gi,
		/Instructions:[^\n]+/gi,
	];
	const results: string[] = [];
	patterns.forEach((p) => {
		const m = content.match(p);
		if (m) results.push(...m);
	});
	return results;
}

function extractToolDefinitions(content: string): string[] {
	const patterns = [
		/function\s+\w+[^}]+}/gi,
		/tool\s*:\s*[^\n]+/gi,
		/"name"\s*:\s*"[^"]+"/gi,
	];
	const results: string[] = [];
	patterns.forEach((p) => {
		const m = content.match(p);
		if (m) results.push(...m);
	});
	return results;
}

function extractStaticResources(content: string): string[] {
	const patterns = [/# [A-Z][^\n]+/g, /## [A-Z][^\n]+/g, /- [A-Z][^\n]+/g];
	const results: string[] = [];
	patterns.forEach((p) => {
		const m = content.match(p);
		if (m) results.push(...m);
	});
	return results;
}

function intelligentTruncate(content: string, targetLength: number): string {
	if (content.length <= targetLength) return content;
	const sentences = content.split(/[.!?]+/);
	let truncated = "";
	for (const sentence of sentences) {
		if ((truncated + sentence).length > targetLength) break;
		truncated += `${sentence}. `;
	}
	return truncated.trim() || content.substring(0, targetLength);
}
