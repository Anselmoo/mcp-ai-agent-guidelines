import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
	GraphAnalysis,
	PerformanceMetric,
} from "../contracts/graph-types.js";

/**
 * Controls how documentation artifacts are generated and rendered.
 */
export interface DocumentationConfig {
	/** Directory where generated documentation files are written. */
	outputDirectory: string;
	/** Include rendered architecture and interaction visuals when supported. */
	includeVisualizations: boolean;
	/** Include example snippets that illustrate how skills are used. */
	includeCodeExamples: boolean;
	/** Include performance summaries derived from graph metrics. */
	includePerformanceData: boolean;
	/** Color theme to apply to generated visual output. */
	theme: "light" | "dark";
	/** Output format for generated documentation assets. */
	format: "markdown" | "html" | "pdf";
}

/**
 * Describes the public-facing reference content for a single skill.
 */
export interface SkillDocumentation {
	/** Stable identifier used to reference the skill across docs. */
	skillId: string;
	/** Short summary of the skill's purpose and behavior. */
	description: string;
	/** High-level domain or category the skill belongs to. */
	domain: string;
	/** Other skills that must be available before this one can run. */
	dependencies: string[];
	/** Example prompts or usage patterns to show in the docs. */
	usageExamples: string[];
	/** Optional aggregate runtime metrics for the skill. */
	performanceProfile?: {
		/** Typical response latency in milliseconds. */
		averageLatency: number;
		/** Fraction of successful executions, expressed from 0 to 1. */
		successRate: number;
		/** Fraction of available capacity used, expressed from 0 to 1. */
		utilizationRate: number;
	};
	/** Observed interaction patterns between this skill and related skills. */
	interactions: Array<{
		/** Identifier of the related skill. */
		withSkill: string;
		/** Relative interaction frequency captured in the analysis data. */
		frequency: number;
		/** Success rate for requests involving the related skill. */
		successRate: number;
	}>;
}

export interface GraphVisualizationData {
	agents: Array<{
		id?: string;
		name?: string;
		capabilities?: string[];
	}>;
	skills: Array<{
		id?: string;
		name?: string;
		domain?: string;
		dependencies?: string[];
	}>;
	routes: Array<{
		from?: string;
		to?: string;
		weight?: number;
	}>;
	metrics: PerformanceMetric[];
}

type InteractionPair = {
	skill1: string;
	skill2: string;
	totalFrequency: number;
	averageSuccessRate: number;
};

/**
 * Generates architecture and API reference documents from graph analysis data.
 */
export class DocumentationIntegrationEngine {
	private config: DocumentationConfig;

	constructor(config: Partial<DocumentationConfig> = {}) {
		this.config = {
			outputDirectory: "./docs",
			includeVisualizations: false,
			includeCodeExamples: true,
			includePerformanceData: false,
			theme: "light",
			format: "markdown",
			...config,
		};
	}

	async generateArchitectureDocumentation(
		graphData: GraphVisualizationData,
		analysis: GraphAnalysis,
		skillDocumentation: SkillDocumentation[],
	): Promise<string> {
		console.log("📖 Generating architecture documentation...");

		await mkdir(this.config.outputDirectory, { recursive: true });

		const architectureDoc = await this.createArchitectureDocument(
			graphData,
			analysis,
		);
		await writeFile(
			join(this.config.outputDirectory, "ARCHITECTURE.md"),
			architectureDoc,
			"utf8",
		);

		const skillsDoc =
			await this.createSkillReferenceDocument(skillDocumentation);
		await writeFile(
			join(this.config.outputDirectory, "SKILLS_REFERENCE.md"),
			skillsDoc,
			"utf8",
		);

		const interactionDoc = await this.createSkillInteractionMap(
			skillDocumentation,
			graphData,
		);
		await writeFile(
			join(this.config.outputDirectory, "SKILL_INTERACTIONS.md"),
			interactionDoc,
			"utf8",
		);

		const apiDoc = await this.createApiReferenceDocument();
		await writeFile(
			join(this.config.outputDirectory, "API_REFERENCE.md"),
			apiDoc,
			"utf8",
		);

		if (this.config.includeVisualizations) {
			await this.generateVisualizationExports(graphData, analysis);
		}

		const indexDoc = await this.createIndexDocument();
		await writeFile(
			join(this.config.outputDirectory, "README.md"),
			indexDoc,
			"utf8",
		);

		console.log(
			`✅ Architecture documentation generated in: ${this.config.outputDirectory}`,
		);
		return this.config.outputDirectory;
	}

	async generateSkillInteractionMaps(
		skillDocumentation: SkillDocumentation[],
		metrics?: PerformanceMetric[],
	): Promise<string> {
		console.log("🗺️ Generating skill interaction maps...");

		const visualsDir = join(this.config.outputDirectory, "visuals");
		await mkdir(visualsDir, { recursive: true });

		const interactionNetworkSvg =
			await this.createSkillInteractionNetwork(skillDocumentation);
		await writeFile(
			join(visualsDir, "skill-interaction-network.svg"),
			interactionNetworkSvg,
			"utf8",
		);

		const dependencyHierarchySvg =
			await this.createDependencyHierarchy(skillDocumentation);
		await writeFile(
			join(visualsDir, "skill-dependency-hierarchy.svg"),
			dependencyHierarchySvg,
			"utf8",
		);

		const domainMapSvg =
			await this.createDomainInteractionMap(skillDocumentation);
		await writeFile(
			join(visualsDir, "domain-interaction-map.svg"),
			domainMapSvg,
			"utf8",
		);

		if (metrics && this.config.includePerformanceData) {
			const performanceMapSvg = await this.createPerformanceOverlayMap(
				skillDocumentation,
				metrics,
			);
			await writeFile(
				join(visualsDir, "skill-performance-map.svg"),
				performanceMapSvg,
				"utf8",
			);
		}

		console.log(`✅ Skill interaction maps generated in: ${visualsDir}`);
		return visualsDir;
	}

	async generateApiDocumentation(
		skillDocumentation: SkillDocumentation[],
	): Promise<string> {
		console.log("📚 Generating API documentation...");

		const apiDir = join(this.config.outputDirectory, "api");
		await mkdir(apiDir, { recursive: true });

		for (const skill of skillDocumentation) {
			const skillApiDoc = await this.createSkillApiDocument(skill);
			await writeFile(join(apiDir, `${skill.skillId}.md`), skillApiDoc, "utf8");
		}

		const overviewDoc =
			await this.createApiOverviewDocument(skillDocumentation);
		await writeFile(join(apiDir, "README.md"), overviewDoc, "utf8");

		console.log(`✅ API documentation generated in: ${apiDir}`);
		return apiDir;
	}

	async updateDocumentationFromSkillChanges(
		changedSkills: string[],
		skillDocumentation: SkillDocumentation[],
	): Promise<void> {
		console.log(
			`🔄 Updating documentation for ${changedSkills.length} changed skills...`,
		);

		const apiDir = join(this.config.outputDirectory, "api");

		for (const skillId of changedSkills) {
			const skillDoc = skillDocumentation.find((s) => s.skillId === skillId);
			if (!skillDoc) {
				continue;
			}

			const updatedApiDoc = await this.createSkillApiDocument(skillDoc);
			await writeFile(join(apiDir, `${skillId}.md`), updatedApiDoc, "utf8");
			console.log(`✅ Updated documentation for ${skillId}`);
		}

		const overviewDoc =
			await this.createApiOverviewDocument(skillDocumentation);
		await writeFile(join(apiDir, "README.md"), overviewDoc, "utf8");

		console.log("✅ Documentation update completed");
	}

	private async createArchitectureDocument(
		graphData: GraphVisualizationData,
		analysis: GraphAnalysis,
	): Promise<string> {
		const agentCount = this.countAgents(graphData);
		const skillCount = this.countSkills(graphData);
		const routeCount = this.getRouteCount(graphData, analysis);
		const bottlenecks = this.getBottlenecks(analysis);
		const recommendations = this.getRecommendations(analysis);
		const domainCounts = this.getDomainCounts(
			graphData.skills.map((skill) => ({
				skillId: skill.id ?? skill.name ?? "unknown-skill",
				description: "",
				domain: skill.domain ?? "unknown",
				dependencies: skill.dependencies ?? [],
				usageExamples: [],
				interactions: [],
			})),
		);

		return `# MCP AI Agent Guidelines v2 Architecture

## Overview

This snapshot summarizes ${agentCount} agents, ${skillCount} skills, and ${routeCount} routing connections captured from the current runtime model.

## Runtime Snapshot

- **Agents**: ${agentCount}
- **Skills**: ${skillCount}
- **Routing connections**: ${routeCount}
- **Bottlenecks identified**: ${bottlenecks.length}
- **Domains represented**: ${Object.keys(domainCounts).length}

## Agent Inventory

${this.renderMarkdownList(this.describeAgents(graphData))}

## Skill Coverage

${this.renderMarkdownList(
	Object.entries(domainCounts)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([domain, count]) => `${domain}: ${count} skills`),
)}

## Routing and Constraints

${bottlenecks.length > 0 ? this.renderMarkdownList(bottlenecks.map((bottleneck) => `${bottleneck.node} (${bottleneck.type}) score ${bottleneck.score.toFixed(2)}`)) : "- No bottlenecks were supplied in the current analysis snapshot."}

## Recommendations

${recommendations.length > 0 ? this.renderMarkdownList(recommendations) : "- No runtime recommendations were supplied."}

${
	this.config.includeVisualizations
		? `## Generated Visualizations

- [Agent topology](./visuals/agent-topology.svg)
- [Skill dependencies](./visuals/skill-dependencies.svg)
- [Execution flow](./visuals/orchestration-flow.svg)
`
		: ""
}
---

*Generated from the current runtime snapshot.*
`;
	}

	private async createSkillReferenceDocument(
		skillDocumentation: SkillDocumentation[],
	): Promise<string> {
		const domainGroups: Record<string, SkillDocumentation[]> = {};

		for (const skill of skillDocumentation) {
			if (!domainGroups[skill.domain]) {
				domainGroups[skill.domain] = [];
			}
			domainGroups[skill.domain].push(skill);
		}

		let content = `# Skill Reference Guide

## Overview

This reference covers ${skillDocumentation.length} skills across ${Object.keys(domainGroups).length} domains.

## Skills by Domain

`;

		for (const [domain, skills] of Object.entries(domainGroups)) {
			content += `### ${domain.toUpperCase()} Domain (${skills.length} skills)\n\n`;

			for (const skill of skills) {
				content += `#### ${skill.skillId}\n\n`;
				content += `${skill.description}\n\n`;

				if (skill.dependencies.length > 0) {
					content += `**Dependencies**: ${skill.dependencies.join(", ")}\n\n`;
				}

				if (this.config.includePerformanceData && skill.performanceProfile) {
					content += `**Performance**:\n`;
					content += `- Average Latency: ${skill.performanceProfile.averageLatency}ms\n`;
					content += `- Success Rate: ${(skill.performanceProfile.successRate * 100).toFixed(1)}%\n`;
					content += `- Utilization: ${(skill.performanceProfile.utilizationRate * 100).toFixed(1)}%\n\n`;
				}

				if (this.config.includeCodeExamples && skill.usageExamples.length > 0) {
					content += `**Usage Examples**:\n\n`;
					for (const example of skill.usageExamples) {
						content += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
					}
				}

				content += `---\n\n`;
			}
		}

		return content;
	}

	private async createSkillInteractionMap(
		skillDocumentation: SkillDocumentation[],
		graphData: GraphVisualizationData,
	): Promise<string> {
		const interactionMatrix = this.buildInteractionMatrix(skillDocumentation);
		const topPairs = this.getTopInteractionPairs(skillDocumentation);
		const recommendations =
			this.generateInteractionRecommendations(skillDocumentation);
		const routeCount = this.countRoutes(graphData.routes);

		return `# Skill Interaction Analysis

## Overview

This report analyzes ${skillDocumentation.length} skills, ${interactionMatrix.length} recorded interaction edges, and ${routeCount} workflow routes from the current snapshot.

## Interaction Matrix

| From Skill | To Skill | Frequency | Success Rate |
|------------|----------|-----------|--------------|
${
	interactionMatrix.length > 0
		? interactionMatrix
				.slice(0, 20)
				.map(
					(interaction) =>
						`| ${interaction.from} | ${interaction.to} | ${interaction.frequency} | ${(interaction.successRate * 100).toFixed(1)}% |`,
				)
				.join("\n")
		: "| _No interaction data_ | - | - | - |"
}

${interactionMatrix.length > 20 ? `\n*Showing the 20 busiest interaction edges from the current dataset.*\n` : ""}

## Top Interaction Pairs

${
	topPairs.length > 0
		? topPairs
				.map(
					(pair, index) =>
						`${index + 1}. **${pair.skill1}** ↔ **${pair.skill2}** (${pair.totalFrequency} interactions, ${(pair.averageSuccessRate * 100).toFixed(1)}% success rate)`,
				)
				.join("\n")
		: "No recurring interaction pairs were found in the supplied data."
}

## Recommendations

${recommendations.length > 0 ? this.renderMarkdownList(recommendations) : "- Collect additional interaction data before generating recommendations."}

${
	this.config.includeVisualizations
		? `## Generated Visualizations

- [Interaction network](./visuals/skill-interaction-network.svg)
- [Dependency hierarchy](./visuals/skill-dependency-hierarchy.svg)
- [Domain interaction map](./visuals/domain-interaction-map.svg)
`
		: ""
}
---

*Generated from the current skill interaction data.*
`;
	}

	private async createApiReferenceDocument(): Promise<string> {
		return `# API Reference

## Documentation Integration Engine

\`\`\`typescript
class DocumentationIntegrationEngine {
  generateArchitectureDocumentation(graphData, analysis, skillDocumentation): Promise<string>
  generateSkillInteractionMaps(skillDocumentation, metrics?): Promise<string>
  generateApiDocumentation(skillDocumentation): Promise<string>
  updateDocumentationFromSkillChanges(changedSkills, skillDocumentation): Promise<void>
}
\`\`\`

## Generated Artifacts

- \`ARCHITECTURE.md\` — runtime architecture summary
- \`SKILLS_REFERENCE.md\` — skill catalog grouped by domain
- \`SKILL_INTERACTIONS.md\` — interaction matrix and recommendations
- \`API_REFERENCE.md\` — reporting/documentation surface reference
- \`api/*.md\` — per-skill API documents

## Reporting and Documentation CLI Commands

\`\`\`bash
# Reports
mcp-cli report performance --time-window 1d --include-profiling
mcp-cli report skills --top 10 --threshold 5
mcp-cli report orchestration --include-bottlenecks
mcp-cli report models --include-failovers
mcp-cli report dashboard --realtime
mcp-cli report all

# Exports
mcp-cli export topology --format svg --layout force
mcp-cli export dependencies --format svg --group-by prefix
mcp-cli export metrics --format json --aggregate hourly

# Documentation
mcp-cli docs architecture --include-code-examples
mcp-cli docs api --include-examples
\`\`\`

## Notes

- Reports and visual artifacts are generated from current runtime data, not canned demo output.
- Visualization files are only written when \`includeVisualizations\` is enabled.

---

*Generated from the current documentation and reporting surface.*
`;
	}

	private async createIndexDocument(): Promise<string> {
		return `# MCP AI Agent Guidelines v2 Documentation

## Overview

This directory contains generated architecture, reporting, and skill reference material for the current project snapshot.

## Documentation Structure

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) — system architecture summary
- [**SKILLS_REFERENCE.md**](./SKILLS_REFERENCE.md) — skill catalog grouped by domain
- [**SKILL_INTERACTIONS.md**](./SKILL_INTERACTIONS.md) — interaction analysis and recommendations
- [**API_REFERENCE.md**](./API_REFERENCE.md) — documentation/reporting surface reference
- [**api/**](./api/) — per-skill API details

## Common Tasks

1. Run \`mcp-cli docs architecture\` to refresh architecture documentation.
2. Run \`mcp-cli docs api\` to regenerate per-skill reference pages.
3. Run \`mcp-cli report all\` to refresh supporting analytics and reports.

## Support

- Use \`mcp-cli --help\` for CLI usage.
- Use \`mcp-cli status\` to inspect configuration state.
- Review generated artifacts before publishing them externally.

---

*Generated on ${new Date().toISOString()}*
`;
	}

	private async generateVisualizationExports(
		graphData: GraphVisualizationData,
		analysis: GraphAnalysis,
	): Promise<void> {
		const visualsDir = join(this.config.outputDirectory, "visuals");
		await mkdir(visualsDir, { recursive: true });

		const topologySvg = this.createSummarySvg(
			"Agent topology",
			`Agents: ${this.countAgents(graphData)} • Routes: ${this.getRouteCount(graphData, analysis)}`,
			this.describeAgents(graphData),
		);
		const dependencySvg = this.createSummarySvg(
			"Skill dependency summary",
			`${this.countSkills(graphData)} skills in the current snapshot`,
			this.describeSkillDependencies(graphData),
		);
		const flowSvg = this.createSummarySvg(
			"Execution flow summary",
			`${this.getBottlenecks(analysis).length} bottlenecks • ${this.getRecommendations(analysis).length} recommendations`,
			this.describeExecutionFlow(analysis),
		);

		await writeFile(
			join(visualsDir, "agent-topology.svg"),
			topologySvg,
			"utf8",
		);
		await writeFile(
			join(visualsDir, "skill-dependencies.svg"),
			dependencySvg,
			"utf8",
		);
		await writeFile(
			join(visualsDir, "orchestration-flow.svg"),
			flowSvg,
			"utf8",
		);

		console.log("📊 Generated visualization exports");
	}

	private async createSkillApiDocument(
		skill: SkillDocumentation,
	): Promise<string> {
		return `# ${skill.skillId} API Reference

## Overview

${skill.description}

**Domain**: ${skill.domain}

${skill.dependencies.length > 0 ? `**Dependencies**: ${skill.dependencies.join(", ")}` : ""}

${
	this.config.includePerformanceData && skill.performanceProfile
		? `## Performance Profile

- **Average Latency**: ${skill.performanceProfile.averageLatency}ms
- **Success Rate**: ${(skill.performanceProfile.successRate * 100).toFixed(1)}%
- **Utilization Rate**: ${(skill.performanceProfile.utilizationRate * 100).toFixed(1)}%
`
		: ""
}

${
	this.config.includeCodeExamples && skill.usageExamples.length > 0
		? `## Usage Examples

${skill.usageExamples
	.map(
		(example, index) => `### Example ${index + 1}

\`\`\`typescript
${example}
\`\`\``,
	)
	.join("\n\n")}
`
		: ""
}

${
	skill.interactions.length > 0
		? `## Skill Interactions

| Skill | Frequency | Success Rate |
|-------|-----------|--------------|
${skill.interactions
	.slice(0, 10)
	.map(
		(interaction) =>
			`| ${interaction.withSkill} | ${interaction.frequency} | ${(interaction.successRate * 100).toFixed(1)}% |`,
	)
	.join("\n")}
`
		: ""
}

---

*Generated from the current skill catalog.*
`;
	}

	private async createApiOverviewDocument(
		skillDocumentation: SkillDocumentation[],
	): Promise<string> {
		const domainStats = this.calculateDomainStatistics(skillDocumentation);

		return `# API Overview

## Skills Summary

Total skills: ${skillDocumentation.length} across ${domainStats.length} domains

## Domain Breakdown

${domainStats
	.map(
		(stat) =>
			`- **${stat.domain}**: ${stat.count} skills (avg latency: ${stat.avgLatency.toFixed(1)}ms, success rate: ${(stat.avgSuccessRate * 100).toFixed(1)}%)`,
	)
	.join("\n")}

## Available Skills

${skillDocumentation
	.map(
		(skill) =>
			`- [${skill.skillId}](./${skill.skillId}.md) - ${skill.description.slice(0, 80)}${skill.description.length > 80 ? "..." : ""}`,
	)
	.join("\n")}

---

*Generated from the current skill catalog.*
`;
	}

	private buildInteractionMatrix(skills: SkillDocumentation[]): Array<{
		from: string;
		to: string;
		frequency: number;
		successRate: number;
	}> {
		const interactions: Array<{
			from: string;
			to: string;
			frequency: number;
			successRate: number;
		}> = [];

		for (const skill of skills) {
			for (const interaction of skill.interactions) {
				interactions.push({
					from: skill.skillId,
					to: interaction.withSkill,
					frequency: interaction.frequency,
					successRate: interaction.successRate,
				});
			}
		}

		return interactions.sort((left, right) => right.frequency - left.frequency);
	}

	private getTopInteractionPairs(
		skills: SkillDocumentation[],
	): InteractionPair[] {
		const pairMap = new Map<
			string,
			{
				skill1: string;
				skill2: string;
				totalFrequency: number;
				weightedSuccessRate: number;
			}
		>();

		for (const skill of skills) {
			for (const interaction of skill.interactions) {
				const [skill1, skill2] = [skill.skillId, interaction.withSkill].sort();
				const key = `${skill1}::${skill2}`;
				const current = pairMap.get(key) ?? {
					skill1,
					skill2,
					totalFrequency: 0,
					weightedSuccessRate: 0,
				};
				current.totalFrequency += interaction.frequency;
				current.weightedSuccessRate +=
					interaction.successRate * interaction.frequency;
				pairMap.set(key, current);
			}
		}

		return Array.from(pairMap.values())
			.map((pair) => ({
				skill1: pair.skill1,
				skill2: pair.skill2,
				totalFrequency: pair.totalFrequency,
				averageSuccessRate:
					pair.totalFrequency > 0
						? pair.weightedSuccessRate / pair.totalFrequency
						: 0,
			}))
			.sort((left, right) => right.totalFrequency - left.totalFrequency)
			.slice(0, 5);
	}

	private generateInteractionRecommendations(
		skills: SkillDocumentation[],
	): string[] {
		const recommendations: string[] = [];
		const topPairs = this.getTopInteractionPairs(skills);
		const isolatedSkills = skills.filter(
			(skill) =>
				skill.dependencies.length === 0 && skill.interactions.length === 0,
		);
		const lowSuccessPair = topPairs.find(
			(pair) => pair.averageSuccessRate < 0.8,
		);
		const highTrafficPair = topPairs[0];

		if (highTrafficPair) {
			recommendations.push(
				`Monitor the handoff between ${highTrafficPair.skill1} and ${highTrafficPair.skill2}; it is currently the busiest interaction path.`,
			);
		}

		if (lowSuccessPair) {
			recommendations.push(
				`Review ${lowSuccessPair.skill1} ↔ ${lowSuccessPair.skill2}; its success rate is below 80% despite repeated use.`,
			);
		}

		if (isolatedSkills.length > 0) {
			recommendations.push(
				`Review isolated skills for removal or promotion: ${isolatedSkills
					.slice(0, 5)
					.map((skill) => skill.skillId)
					.join(", ")}.`,
			);
		}

		if (skills.some((skill) => skill.interactions.length >= 5)) {
			recommendations.push(
				"Add caching or batching around highly connected skills to reduce repeated handoff overhead.",
			);
		}

		return recommendations;
	}

	private calculateDomainStatistics(skills: SkillDocumentation[]): Array<{
		domain: string;
		count: number;
		avgLatency: number;
		avgSuccessRate: number;
	}> {
		const domains: Record<
			string,
			{ count: number; totalLatency: number; totalSuccessRate: number }
		> = {};

		for (const skill of skills) {
			if (!domains[skill.domain]) {
				domains[skill.domain] = {
					count: 0,
					totalLatency: 0,
					totalSuccessRate: 0,
				};
			}

			domains[skill.domain].count++;

			if (skill.performanceProfile) {
				domains[skill.domain].totalLatency +=
					skill.performanceProfile.averageLatency;
				domains[skill.domain].totalSuccessRate +=
					skill.performanceProfile.successRate;
			}
		}

		return Object.entries(domains).map(([domain, stats]) => ({
			domain,
			count: stats.count,
			avgLatency: stats.count > 0 ? stats.totalLatency / stats.count : 0,
			avgSuccessRate:
				stats.count > 0 ? stats.totalSuccessRate / stats.count : 0,
		}));
	}

	private async createSkillInteractionNetwork(
		skills: SkillDocumentation[],
	): Promise<string> {
		const busiestSkills = skills
			.map((skill) => ({
				skillId: skill.skillId,
				interactionCount: skill.interactions.reduce(
					(sum, interaction) => sum + interaction.frequency,
					0,
				),
			}))
			.sort((left, right) => right.interactionCount - left.interactionCount)
			.slice(0, 8)
			.map(
				(skill) =>
					`${skill.skillId}: ${skill.interactionCount} recorded interactions`,
			);

		return this.createSummarySvg(
			"Skill interaction network",
			`${skills.length} skills in the current dataset`,
			busiestSkills,
		);
	}

	private async createDependencyHierarchy(
		skills: SkillDocumentation[],
	): Promise<string> {
		const dependencySummary = skills
			.map((skill) => ({
				skillId: skill.skillId,
				dependencyCount: skill.dependencies.length,
				dependencies: skill.dependencies.slice(0, 3).join(", "),
			}))
			.sort((left, right) => right.dependencyCount - left.dependencyCount)
			.slice(0, 8)
			.map((skill) =>
				skill.dependencyCount > 0
					? `${skill.skillId}: ${skill.dependencyCount} dependencies (${skill.dependencies})`
					: `${skill.skillId}: no declared dependencies`,
			);

		return this.createSummarySvg(
			"Skill dependency hierarchy",
			`${skills.length} skills with declared dependency data`,
			dependencySummary,
		);
	}

	private async createDomainInteractionMap(
		skills: SkillDocumentation[],
	): Promise<string> {
		const domainCounts = this.getDomainCounts(skills);
		const rows = Object.entries(domainCounts)
			.sort(([, left], [, right]) => right - left)
			.slice(0, 8)
			.map(([domain, count]) => `${domain}: ${count} skills`);

		return this.createSummarySvg(
			"Domain interaction map",
			`${Object.keys(domainCounts).length} domains represented`,
			rows,
		);
	}

	private async createPerformanceOverlayMap(
		skills: SkillDocumentation[],
		metrics: PerformanceMetric[],
	): Promise<string> {
		const metricsBySkill = new Map<
			string,
			{ count: number; totalValue: number; lastUnit: string }
		>();

		for (const metric of metrics) {
			const current = metricsBySkill.get(metric.entityId) ?? {
				count: 0,
				totalValue: 0,
				lastUnit: metric.unit,
			};
			current.count++;
			current.totalValue += metric.value;
			current.lastUnit = metric.unit;
			metricsBySkill.set(metric.entityId, current);
		}

		const rows = skills
			.map((skill) => {
				const stats = metricsBySkill.get(skill.skillId);
				if (!stats) {
					return `${skill.skillId}: no performance metrics available`;
				}
				return `${skill.skillId}: avg ${(stats.totalValue / stats.count).toFixed(1)} ${stats.lastUnit} across ${stats.count} metrics`;
			})
			.slice(0, 8);

		return this.createSummarySvg(
			"Skill performance map",
			`${metrics.length} metrics processed`,
			rows,
		);
	}

	private createSummarySvg(
		title: string,
		subtitle: string,
		rows: string[],
	): string {
		const visibleRows = rows.length > 0 ? rows : ["No data available."];
		const height = 140 + visibleRows.length * 28;
		const body = visibleRows
			.map(
				(row, index) =>
					`<text x="40" y="${110 + index * 28}" font-size="16" fill="#1f2937">${this.escapeXml(row)}</text>`,
			)
			.join("");

		return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}">
  <rect width="900" height="${height}" fill="#f8fafc" rx="16"/>
  <text x="40" y="48" font-size="28" font-weight="bold" fill="#0f172a">${this.escapeXml(title)}</text>
  <text x="40" y="78" font-size="16" fill="#475569">${this.escapeXml(subtitle)}</text>
  ${body}
</svg>`;
	}

	private countAgents(graphData: GraphVisualizationData): number {
		return Array.isArray(graphData.agents) ? graphData.agents.length : 0;
	}

	private countSkills(graphData: GraphVisualizationData): number {
		return Array.isArray(graphData.skills) ? graphData.skills.length : 0;
	}

	private countRoutes(
		routes: GraphVisualizationData["routes"] | undefined,
	): number {
		return Array.isArray(routes) ? routes.length : 0;
	}

	private getRouteCount(
		graphData: GraphVisualizationData,
		analysis: GraphAnalysis,
	): number {
		return (
			analysis.agentTopology?.edgeCount ?? this.countRoutes(graphData.routes)
		);
	}

	private getBottlenecks(
		analysis: GraphAnalysis,
	): GraphAnalysis["bottlenecks"] {
		return Array.isArray(analysis.bottlenecks) ? analysis.bottlenecks : [];
	}

	private getRecommendations(analysis: GraphAnalysis): string[] {
		return Array.isArray(analysis.recommendations)
			? analysis.recommendations
			: [];
	}

	private describeAgents(graphData: GraphVisualizationData): string[] {
		const agents = Array.isArray(graphData.agents) ? graphData.agents : [];
		return agents.slice(0, 8).map((agent) => {
			const agentId = agent.name ?? agent.id ?? "unnamed-agent";
			const capabilityCount = agent.capabilities?.length ?? 0;
			return `${agentId} (${capabilityCount} capabilities)`;
		});
	}

	private describeSkillDependencies(
		graphData: GraphVisualizationData,
	): string[] {
		const skills = Array.isArray(graphData.skills) ? graphData.skills : [];
		return skills.slice(0, 8).map((skill) => {
			const skillId = skill.name ?? skill.id ?? "unnamed-skill";
			const dependencyCount = skill.dependencies?.length ?? 0;
			return dependencyCount > 0
				? `${skillId}: ${dependencyCount} dependencies`
				: `${skillId}: no declared dependencies`;
		});
	}

	private describeExecutionFlow(analysis: GraphAnalysis): string[] {
		const flowSummary = [
			`${this.getBottlenecks(analysis).length} bottlenecks identified`,
			`${this.getRecommendations(analysis).length} optimization recommendations`,
		];

		for (const bottleneck of this.getBottlenecks(analysis).slice(0, 4)) {
			flowSummary.push(
				`${bottleneck.node}: ${bottleneck.type} bottleneck score ${bottleneck.score.toFixed(2)}`,
			);
		}

		return flowSummary;
	}

	private getDomainCounts(
		skills: Array<Pick<SkillDocumentation, "domain">>,
	): Record<string, number> {
		const domainCounts: Record<string, number> = {};
		for (const skill of skills) {
			domainCounts[skill.domain] = (domainCounts[skill.domain] ?? 0) + 1;
		}
		return domainCounts;
	}

	private renderMarkdownList(items: string[]): string {
		if (items.length === 0) {
			return "- None";
		}
		return items.map((item) => `- ${item}`).join("\n");
	}

	private escapeXml(value: string): string {
		return value
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&apos;");
	}
}

/**
 * Convenience factory for creating documentation integration engines with defaults.
 */
export class DocumentationIntegrationFactory {
	/**
	 * Create a documentation integration engine with optional config overrides.
	 */
	static create(
		config?: Partial<DocumentationConfig>,
	): DocumentationIntegrationEngine {
		return new DocumentationIntegrationEngine(config);
	}
}
