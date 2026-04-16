import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mermaid from "astro-mermaid";
import remarkMath from "remark-math";
import rehypeMathJax from "rehype-mathjax";
import caligoTheme from "./src/caligo-deep-sable-shiki.json" with {
	type: "json",
};

export default defineConfig({
	site: "https://anselmoo.github.io",
	base: "/mcp-ai-agent-guidelines",
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeMathJax],
	},
	integrations: [
		mermaid({
			theme: "dark",
		}),
		starlight({
			expressiveCode: {
				themes: ["github-light", caligoTheme],
				useStarlightDarkModeSwitch: true,
				styleOverrides: { borderRadius: "0.5rem" },
			},
			title: "MCP AI Agent Guidelines",
			favicon: "/favicon.svg",
			head: [
				// Safari ICO fallback (browsers without SVG favicon support)
				{
					tag: "link",
					attrs: {
						rel: "icon",
						href: "/favicon.svg",
						type: "image/svg+xml",
					},
				},
				// Open Graph / social card
				{
					tag: "meta",
					attrs: {
						property: "og:image",
						content:
							"https://anselmoo.github.io/mcp-ai-agent-guidelines/og-image.svg",
					},
				},
				{
					tag: "meta",
					attrs: { property: "og:image:width", content: "1200" },
				},
				{
					tag: "meta",
					attrs: { property: "og:image:height", content: "630" },
				},
				// Twitter card
				{
					tag: "meta",
					attrs: { name: "twitter:card", content: "summary_large_image" },
				},
				{
					tag: "meta",
					attrs: {
						name: "twitter:image",
						content:
							"https://anselmoo.github.io/mcp-ai-agent-guidelines/og-image.svg",
					},
				},
			],
			description:
				"A TypeScript MCP server exposing 20 instruction tools backed by 102 skills across 18 domains — instruction-first architecture with physics-inspired analysis, bio-inspired routing, and governance-first AI workflows.",
			logo: {
				light: "./src/assets/logo-light.svg",
				dark: "./src/assets/logo-dark.svg",
				replacesTitle: false,
			},
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/Anselmoo/mcp-ai-agent-guidelines",
				},
				{
					icon: "npm",
					label: "npm",
					href: "https://www.npmjs.com/package/mcp-ai-agent-guidelines",
				},
			],
			editLink: {
				baseUrl:
					"https://github.com/Anselmoo/mcp-ai-agent-guidelines/edit/main/docs/",
			},
			lastUpdated: true,
			pagination: true,
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			customCss: ["./src/styles/custom.css"],
			sidebar: [
				{
					label: "Getting Started",
					items: [
						{ slug: "getting-started/installation" },
						{ slug: "getting-started/quickstart" },
						{ slug: "getting-started/mcp-config" },
					],
				},
				{
					label: "Concepts",
					items: [
						{ slug: "concepts/skill-system" },
						{ slug: "concepts/philosophy" },
						{ slug: "concepts/orchestration" },
						{ slug: "concepts/model-routing" },
					],
				},
				{
					label: "Skills",
					items: [
						{ slug: "skills" },
						{
							label: "Skill Reference",
							collapsed: true,
							autogenerate: { directory: "skills/reference" },
						},
						{
							label: "Domain Reference",
							items: [
								{ slug: "skills/requirements" },
								{ slug: "skills/architecture" },
								{ slug: "skills/quality" },
								{ slug: "skills/debugging" },
								{ slug: "skills/documentation" },
								{ slug: "skills/evaluation" },
								{ slug: "skills/benchmarking" },
								{ slug: "skills/workflows" },
								{ slug: "skills/governance" },
								{ slug: "skills/orchestration" },
								{ slug: "skills/prompting" },
								{ slug: "skills/research" },
								{ slug: "skills/strategy" },
								{ slug: "skills/resilience" },
								{ slug: "skills/adaptive" },
								{ slug: "skills/leadership" },
								{ slug: "skills/physics-qm" },
								{ slug: "skills/physics-gr" },
							],
						},
					],
				},
				{
					label: "Tools",
					items: [
						{ slug: "tools" },
						{
							label: "Workflow Tools",
							items: [
								{ slug: "tools/system-design" },
								{ slug: "tools/feature-implement" },
								{ slug: "tools/evidence-research" },
								{ slug: "tools/code-review" },
								{ slug: "tools/strategy-plan" },
								{ slug: "tools/issue-debug" },
								{ slug: "tools/code-refactor" },
								{ slug: "tools/test-verify" },
								{ slug: "tools/docs-generate" },
								{ slug: "tools/quality-evaluate" },
								{ slug: "tools/prompt-engineering" },
								{ slug: "tools/agent-orchestrate" },
								{ slug: "tools/enterprise-strategy" },
								{ slug: "tools/policy-govern" },
								{ slug: "tools/fault-resilience" },
								{ slug: "tools/routing-adapt" },
								{ slug: "tools/physics-analysis" },
							],
						},
						{
							label: "Discovery Tools",
							items: [
								{ slug: "tools/task-bootstrap" },
								{ slug: "tools/meta-routing" },
								{ slug: "tools/project-onboard" },
							],
						},
						{
							label: "Workspace Tools",
							items: [
								{ slug: "tools/agent-memory" },
								{ slug: "tools/graph-visualize" },
							],
						},
					],
				},
				{
					label: "Workflows",
					items: [
						{ slug: "workflows" },
						{
							label: "Workflow Reference",
							autogenerate: { directory: "workflows/reference" },
						},
					],
				},
				{
					label: "Reference",
					items: [
						{ slug: "reference/changelog" },
						{ slug: "reference/env-variables" },
						{ slug: "reference/cli" },
						{ slug: "reference/mcp-debugging" },
						{ slug: "reference/contributing" },
					],
				},
			],
		}),
	],
});
