import type { StructuredResource } from "./structured.js";
import {
	renderStructuredToMarkdown,
	structuredResources,
} from "./structured.js";

const resources = [
	{
		uri: "guidelines://core-development-principles",
		name: "Core Development Principles (Extended)",
		description:
			"Authoritative links for prompts, sprints, hygiene, Mermaid, memory caching, and model comparisons",
		mimeType: "text/markdown",
	},
	{
		uri: "guidelines://core-principles",
		name: "Core AI Agent Development Principles",
		description:
			"Fundamental principles for AI agent development including structured guidelines, timeframes, and best practices",
		mimeType: "text/markdown",
	},
	{
		uri: "guidelines://prompt-templates",
		name: "Hierarchical Prompt Templates",
		description:
			"Reusable prompt patterns and templates for various AI agent tasks",
		mimeType: "text/markdown",
	},
	{
		uri: "guidelines://development-checklists",
		name: "Development Checklists",
		description: "Comprehensive checklists for AI agent development workflows",
		mimeType: "text/markdown",
	},
	{
		uri: "guidelines://model-selection",
		name: "AI Model Selection Guide",
		description:
			"Guidelines for selecting appropriate AI models based on task requirements",
		mimeType: "text/markdown",
	},
	{
		uri: "guidelines://architecture-patterns",
		name: "AI Agent Architecture Patterns",
		description:
			"Common architectural patterns and best practices for AI agent systems",
		mimeType: "text/markdown",
	},
	{
		uri: "guidelines://rapid-model-evolution",
		name: "Rapid Model Evolution (Qualitative)",
		description:
			"Guidance for handling fast-changing model landscapes with adapters, flags, and periodic evals",
		mimeType: "text/markdown",
	},
	{
		uri: "guidelines://external-references",
		name: "External References (2025)",
		description:
			"Selected URLs for grounding; fetch live details at runtime and verify specifics",
		mimeType: "text/markdown",
	},
	{
		uri: "guidelines://mcp-ts-insights",
		name: "MCP TypeScript SDK: Resource & Tool Patterns (Concise)",
		description:
			"Practical patterns for static/dynamic resources, resource_link usage, and client basics",
		mimeType: "text/markdown",
	},
	{
		uri: "guidelines://knowledge-base",
		name: "Internal Knowledge Base (Summarized)",
		description:
			"Offline summaries distilled from public sources for efficient prompting (no external URLs)",
		mimeType: "text/markdown",
	},
	{
		uri: "guidelines://mcp-advanced-functions",
		name: "MCP Advanced Functions: Resources, Completions, and Notifications",
		description:
			"Lifecycle management (enable/disable/remove), listChanged notifications, argument completions, and resource_link usage",
		mimeType: "text/markdown",
	},
];

export async function listResources() {
	return resources;
}

export async function getResource(uri: string) {
	const resource = resources.find((r) => r.uri === uri);
	if (!resource) throw new Error(`Resource not found: ${uri}`);

	// Map guidelines://<id> to structuredResources id
	const id = uri.replace("guidelines://", "");
	const sr: StructuredResource | undefined = structuredResources.find(
		(r) => r.id === id,
	);
	if (!sr) throw new Error(`Unknown resource: ${uri}`);

	const markdown = renderStructuredToMarkdown(sr);
	const json = JSON.stringify(sr, null, 2);

	return {
		contents: [
			{ uri, mimeType: resource.mimeType, text: markdown },
			{ uri: `${uri}#structured`, mimeType: "application/json", text: json },
		],
	};
}

// Long markdown bodies migrated to structured resources to reduce token load
