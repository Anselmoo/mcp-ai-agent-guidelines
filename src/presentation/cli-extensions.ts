import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import type { Command } from "commander";
import type { ModelClass, SkillManifestEntry } from "../contracts/generated.js";
import type {
	AgentNode,
	GraphAnalysis,
	PerformanceMetric,
	SkillNode,
} from "../contracts/graph-types.js";
import { SKILL_MANIFESTS } from "../generated/manifests/skill-manifests.js";
import { GraphOrchestrator } from "../infrastructure/graph-orchestration.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { UnifiedOrchestrator } from "../infrastructure/unified-orchestration.js";
import { modelAvailabilityService } from "../models/model-availability.js";
import { ModelRouter } from "../models/model-router.js";
import {
	AdvancedReportingEngine,
	type ReportConfig,
} from "../reporting/advanced-reporting.js";
import {
	DocumentationIntegrationEngine,
	type SkillDocumentation,
} from "./documentation-integration.js";

type ReportingTheme = ReportConfig["theme"];
type ReportingFormat = ReportConfig["format"];
type ExportFormat = "svg" | "json";
type MetricsExportFormat = "json" | "csv";

type DashboardSnapshot = ReturnType<
	UnifiedOrchestrator["getAnalyticsDashboard"]
>;

type RouteEdgeData = {
	weight: number;
	performance: {
		successRate: number;
		averageLatency: number;
	};
	lastUsed: Date;
};

type ReportingGraphData = {
	routes: Map<string, Map<string, RouteEdgeData>>;
	agents: AgentNode[];
	skills: SkillNode[];
	metrics: PerformanceMetric[];
};

type DocumentationGraphData = {
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
};

type ReportCommandOptions = {
	timeWindow?: string;
	includeBottlenecks?: boolean;
	includeFailovers?: boolean;
	top?: string;
	threshold?: string;
	format?: ExportFormat | MetricsExportFormat;
	includeExamples?: boolean;
	includeCodeExamples?: boolean;
	focus?: "performance" | "reliability" | "cost";
};

export interface ReportingCliOptions {
	outputDirectory?: string;
	unifiedOrchestrator?: UnifiedOrchestrator;
}

const DEFAULT_OUTPUT_DIRECTORY = "./reports";

const MODEL_CLASSES: ModelClass[] = ["free", "cheap", "strong", "reviewer"];

const LATENCY_BY_MODEL_CLASS: Record<ModelClass, number> = {
	free: 120,
	cheap: 220,
	strong: 480,
	reviewer: 420,
};

const SEVERITY_WEIGHT: Record<"low" | "medium" | "high", number> = {
	low: 1,
	medium: 2,
	high: 3,
};

export class ReportingCliCommands {
	private readonly unifiedOrchestrator: UnifiedOrchestrator;
	private readonly defaultOutputDirectory: string;

	constructor(options: ReportingCliOptions = {}) {
		this.unifiedOrchestrator =
			options.unifiedOrchestrator ?? new UnifiedOrchestrator();
		this.defaultOutputDirectory =
			options.outputDirectory ?? DEFAULT_OUTPUT_DIRECTORY;
	}

	registerCommands(program: Command): void {
		const reportCmd = program
			.command("report")
			.description("Generate analytics and reporting artifacts")
			.option(
				"-o, --output <directory>",
				"Output directory for generated artifacts",
				this.defaultOutputDirectory,
			)
			.option("-t, --theme <theme>", "Theme for reports (light|dark)", "light")
			.option(
				"-f, --format <format>",
				"Report format (html|json|markdown|pdf)",
				"html",
			)
			.option("--no-visualizations", "Disable visualization generation");

		reportCmd
			.command("performance")
			.description("Generate a performance analysis report")
			.option(
				"--time-window <window>",
				"Time window for metrics (1h|1d|1w|1m)",
				"1d",
			)
			.action(async (options, command) => {
				await this.generatePerformanceReport(options, command);
			});

		reportCmd
			.command("skills")
			.description("Generate skill analytics from the registered skill set")
			.option("--top <count>", "Show top N skills", "10")
			.option("--threshold <value>", "Underutilization threshold", "5")
			.action(async (options, command) => {
				await this.generateSkillAnalytics(options, command);
			});

		reportCmd
			.command("orchestration")
			.description("Generate a topology and orchestration analysis report")
			.option(
				"--include-bottlenecks",
				"Highlight bottlenecks in console output",
			)
			.action(async (options, command) => {
				await this.generateOrchestrationReport(options, command);
			});

		reportCmd
			.command("models")
			.description("Generate a model availability and routing report")
			.option("--include-failovers", "Show configured fallback mappings")
			.action(async (options, command) => {
				await this.generateModelReport(options, command);
			});

		reportCmd
			.command("dashboard")
			.description("Generate the analytics dashboard snapshot")
			.action(async (_options, command) => {
				await this.generateDashboard(command);
			});

		reportCmd
			.command("all")
			.description("Generate the full report bundle")
			.action(async (_options, command) => {
				await this.generateAllReports(command);
			});

		const exportCmd = program
			.command("export")
			.description("Export topology and metrics summaries");

		exportCmd
			.command("topology")
			.description("Export the current topology summary")
			.option("--format <format>", "Export format (svg|json)", "svg")
			.action(async (options, command) => {
				await this.exportTopology(options, command);
			});

		exportCmd
			.command("dependencies")
			.description("Export the current skill dependency summary")
			.option("--format <format>", "Export format (svg|json)", "svg")
			.action(async (options, command) => {
				await this.exportDependencies(options, command);
			});

		exportCmd
			.command("metrics")
			.description("Export the current metrics snapshot")
			.option("--format <format>", "Export format (json|csv)", "json")
			.action(async (options, command) => {
				await this.exportMetrics(options, command);
			});

		const analyticsCmd = program
			.command("analytics")
			.description("Inspect analytics and optimization signals");

		analyticsCmd
			.command("trends")
			.description("Print the currently available trend analysis")
			.action(async () => {
				await this.analyzeTrends();
			});

		analyticsCmd
			.command("anomalies")
			.description("Print the currently detected anomalies")
			.action(async () => {
				await this.detectAnomalies();
			});

		analyticsCmd
			.command("recommendations")
			.description("Print current optimization recommendations")
			.option(
				"--focus <area>",
				"Focus area (performance|reliability|cost)",
				"performance",
			)
			.action(async (options) => {
				await this.generateRecommendations(options);
			});

		const docsCmd = program
			.command("docs")
			.description("Generate repository documentation snapshots");

		docsCmd
			.command("architecture")
			.description("Generate architecture documentation and visual summaries")
			.option(
				"--include-code-examples",
				"Include usage examples in the generated documentation",
			)
			.action(async (options, command) => {
				await this.generateArchitectureDocs(options, command);
			});

		docsCmd
			.command("api")
			.description("Generate API and command reference documentation")
			.option("--include-examples", "Include example command invocations")
			.action(async (options, command) => {
				await this.generateApiDocs(options, command);
			});
	}

	private async generatePerformanceReport(
		options: ReportCommandOptions,
		command: Command,
	): Promise<void> {
		console.log(chalk.blue("📊 Generating performance analysis report..."));

		try {
			const snapshot = this.getDashboardSnapshot();
			const metrics = this.extractMetricsFromDashboard(snapshot);
			const filteredMetrics = this.applyTimeWindow(
				metrics,
				options.timeWindow ?? "1d",
			);
			const reportPath = await this.createReportingEngine(
				command,
			).generatePerformanceReport(
				filteredMetrics,
				this.parseTimeWindow(options.timeWindow ?? "1d"),
			);

			console.log(
				chalk.green(`✅ Performance report generated: ${reportPath}`),
			);
			console.log(
				chalk.blue(
					`📈 Included ${filteredMetrics.length} metrics in the report`,
				),
			);
		} catch (error) {
			this.failCommand("performance report", error);
		}
	}

	private async generateSkillAnalytics(
		options: ReportCommandOptions,
		command: Command,
	): Promise<void> {
		console.log(chalk.blue("🎯 Generating skill analytics report..."));

		try {
			const snapshot = this.getDashboardSnapshot();
			const metrics = this.extractMetricsFromDashboard(snapshot);
			const skillNodes = this.buildSkillNodes();
			const reportPath = await this.createReportingEngine(
				command,
			).generateSkillAnalyticsReport(metrics, skillNodes);
			const topCount = this.parsePositiveInteger(options.top, 10);

			console.log(
				chalk.green(`✅ Skill analytics report generated: ${reportPath}`),
			);
			console.log(
				chalk.blue(
					`📊 Analyzed ${skillNodes.length} registered skills; top ${Math.min(topCount, skillNodes.length)} entries highlighted`,
				),
			);
			console.log(
				chalk.blue(
					`📉 Underutilization threshold set to ${this.parsePositiveInteger(options.threshold, 5)} executions`,
				),
			);
		} catch (error) {
			this.failCommand("skill analytics", error);
		}
	}

	private async generateOrchestrationReport(
		options: ReportCommandOptions,
		command: Command,
	): Promise<void> {
		console.log(chalk.blue("🔀 Generating orchestration report..."));

		try {
			const graphData = this.buildReportingGraphData();
			const analysis = this.buildGraphAnalysis(graphData);
			const reportPath = await this.createReportingEngine(
				command,
			).generateOrchestrationReport(graphData, analysis);

			console.log(
				chalk.green(`✅ Orchestration report generated: ${reportPath}`),
			);
			if (options.includeBottlenecks) {
				console.log(
					chalk.yellow(
						`⚠️  Bottlenecks identified: ${analysis.bottlenecks.length}`,
					),
				);
			}
		} catch (error) {
			this.failCommand("orchestration report", error);
		}
	}

	private async generateModelReport(
		options: ReportCommandOptions,
		command: Command,
	): Promise<void> {
		console.log(chalk.blue("🤖 Generating model routing report..."));

		try {
			const routingData = this.buildModelRoutingSnapshot();
			const reportPath =
				await this.createReportingEngine(command).generateModelRoutingReport(
					routingData,
				);

			console.log(chalk.green(`✅ Model report generated: ${reportPath}`));
			console.log(
				chalk.blue(
					`🔄 Evaluated ${routingData.routingDecisions.length} skill-to-model routing decisions`,
				),
			);
			if (options.includeFailovers) {
				console.log(
					chalk.blue(
						`🛟 Recorded ${routingData.failoverEvents.length} configured fallback mappings`,
					),
				);
			}
		} catch (error) {
			this.failCommand("model report", error);
		}
	}

	private async generateDashboard(command: Command): Promise<void> {
		console.log(chalk.blue("📋 Generating analytics dashboard..."));

		try {
			const reportPath =
				await this.createReportingEngine(command).generateAnalyticsDashboard();
			console.log(
				chalk.green(`✅ Analytics dashboard generated: ${reportPath}`),
			);
		} catch (error) {
			this.failCommand("dashboard", error);
		}
	}

	private async generateAllReports(command: Command): Promise<void> {
		console.log(chalk.blue("📑 Generating report bundle..."));

		try {
			const graphData = this.buildReportingGraphData();
			const analysis = this.buildGraphAnalysis(graphData);
			const metrics = this.extractMetricsFromDashboard(
				this.getDashboardSnapshot(),
			);
			const reportPaths = await this.createReportingEngine(
				command,
			).generateAllReports(metrics, graphData, analysis);

			console.log(chalk.green(`✅ Generated ${reportPaths.length} reports:`));
			for (const reportPath of reportPaths) {
				console.log(chalk.green(`   📄 ${reportPath}`));
			}
		} catch (error) {
			this.failCommand("report bundle", error);
		}
	}

	private async exportTopology(
		options: ReportCommandOptions,
		command: Command,
	): Promise<void> {
		console.log(chalk.blue("🌐 Exporting topology summary..."));

		try {
			const format = this.parseExportFormat(options.format);
			const graphData = this.buildReportingGraphData();
			const analysis = this.buildGraphAnalysis(graphData);
			const outputDirectory = this.resolveOutputDirectory(command);
			await mkdir(outputDirectory, { recursive: true });

			const outputPath = join(outputDirectory, `topology.${format}`);
			const content =
				format === "json"
					? JSON.stringify(
							{
								agents: graphData.agents,
								skills: graphData.skills.length,
								routes: this.getRouteCount(graphData.routes),
								bottlenecks: analysis.bottlenecks,
								recommendations: analysis.recommendations,
							},
							null,
							2,
						)
					: this.renderTopologySvg(graphData, analysis);

			await writeFile(outputPath, content, "utf8");
			console.log(chalk.green(`✅ Topology export written: ${outputPath}`));
		} catch (error) {
			this.failCommand("topology export", error);
		}
	}

	private async exportDependencies(
		options: ReportCommandOptions,
		command: Command,
	): Promise<void> {
		console.log(chalk.blue("🔗 Exporting dependency summary..."));

		try {
			const format = this.parseExportFormat(options.format);
			const snapshot = this.getDashboardSnapshot();
			const skillDocumentation = this.buildSkillDocumentation(
				this.extractMetricsFromDashboard(snapshot),
				snapshot,
			);
			const outputDirectory = this.resolveOutputDirectory(command);
			await mkdir(outputDirectory, { recursive: true });

			const outputPath = join(outputDirectory, `dependencies.${format}`);
			const content =
				format === "json"
					? JSON.stringify(
							skillDocumentation.map((skill) => ({
								skillId: skill.skillId,
								dependencies: skill.dependencies,
								domain: skill.domain,
							})),
							null,
							2,
						)
					: this.renderDependencySvg(skillDocumentation);

			await writeFile(outputPath, content, "utf8");
			console.log(chalk.green(`✅ Dependency export written: ${outputPath}`));
		} catch (error) {
			this.failCommand("dependency export", error);
		}
	}

	private async exportMetrics(
		options: ReportCommandOptions,
		command: Command,
	): Promise<void> {
		console.log(chalk.blue("📊 Exporting metrics snapshot..."));

		try {
			const format = this.parseMetricsExportFormat(options.format);
			const metrics = this.extractMetricsFromDashboard(
				this.getDashboardSnapshot(),
			);
			const outputDirectory = this.resolveOutputDirectory(command);
			await mkdir(outputDirectory, { recursive: true });

			const outputPath = join(outputDirectory, `metrics.${format}`);
			const content =
				format === "csv"
					? this.convertMetricsToCsv(metrics)
					: JSON.stringify(metrics, null, 2);

			await writeFile(outputPath, content, "utf8");
			console.log(chalk.green(`✅ Metrics exported: ${outputPath}`));
			console.log(chalk.blue(`📈 ${metrics.length} metrics exported`));
		} catch (error) {
			this.failCommand("metrics export", error);
		}
	}

	private async analyzeTrends(): Promise<void> {
		console.log(chalk.blue("📈 Analyzing current trends..."));

		const snapshot = this.getDashboardSnapshot();
		const trendEntries = Object.entries(snapshot.performanceMetrics);
		if (trendEntries.length === 0) {
			console.log(
				chalk.yellow("No trend data is available yet. Run workflows first."),
			);
			return;
		}

		console.log(chalk.green("✅ Trend analysis completed:"));
		for (const [metricName, trend] of trendEntries) {
			console.log(chalk.blue(`  • ${metricName}: ${JSON.stringify(trend)}`));
		}
	}

	private async detectAnomalies(): Promise<void> {
		console.log(chalk.blue("🔍 Detecting anomalies..."));

		const snapshot = this.getDashboardSnapshot();
		if (snapshot.anomalies.length === 0) {
			console.log(
				chalk.green("✅ No anomalies detected in the current snapshot."),
			);
			return;
		}

		console.log(chalk.green("✅ Anomaly detection completed:"));
		for (const [index, anomaly] of snapshot.anomalies.entries()) {
			console.log(
				chalk.yellow(
					`  ${index + 1}. ${anomaly.type}: ${anomaly.description} (${anomaly.severity})`,
				),
			);
		}
	}

	private async generateRecommendations(
		options: ReportCommandOptions,
	): Promise<void> {
		console.log(chalk.blue("💡 Generating recommendations..."));

		const graphData = this.buildReportingGraphData();
		const analysis = this.buildGraphAnalysis(graphData);
		const snapshot = this.getDashboardSnapshot();
		const recommendations = new Set<string>(analysis.recommendations);

		if (snapshot.anomalies.length > 0) {
			recommendations.add(
				"Review the active anomaly list before changing routing or model policy.",
			);
		}
		if (options.focus === "cost") {
			recommendations.add(
				"Prefer free-tier skills first and audit strong-model usage by domain.",
			);
		}
		if (options.focus === "reliability") {
			recommendations.add(
				"Add regression coverage around the busiest dependency edges.",
			);
		}

		if (recommendations.size === 0) {
			console.log(
				chalk.green("✅ No recommendations for the current snapshot."),
			);
			return;
		}

		console.log(chalk.green("✅ Recommendations:"));
		for (const [index, recommendation] of [...recommendations].entries()) {
			console.log(chalk.blue(`  ${index + 1}. ${recommendation}`));
		}
	}

	private async generateArchitectureDocs(
		options: ReportCommandOptions,
		command: Command,
	): Promise<void> {
		console.log(chalk.blue("📖 Generating architecture documentation..."));

		try {
			const outputDirectory = this.resolveOutputDirectory(command);
			const snapshot = this.getDashboardSnapshot();
			const graphData = this.buildDocumentationGraphData();
			const metrics = this.extractMetricsFromDashboard(snapshot);
			const skillDocumentation = this.buildSkillDocumentation(
				metrics,
				snapshot,
			);
			const analysis = this.buildGraphAnalysis(this.buildReportingGraphData());
			const engine = new DocumentationIntegrationEngine({
				outputDirectory,
				includeVisualizations: true,
				includeCodeExamples: options.includeCodeExamples === true,
				includePerformanceData: true,
			});

			const reportPath = await engine.generateArchitectureDocumentation(
				graphData,
				analysis,
				skillDocumentation,
			);

			console.log(
				chalk.green(`✅ Architecture documentation generated: ${reportPath}`),
			);
		} catch (error) {
			this.failCommand("architecture documentation", error);
		}
	}

	private async generateApiDocs(
		options: ReportCommandOptions,
		command: Command,
	): Promise<void> {
		console.log(chalk.blue("📚 Generating API documentation..."));

		try {
			const outputDirectory = this.resolveOutputDirectory(command);
			const skillCount = SKILL_MANIFESTS.length;
			const availableModels = this.collectAvailableModels();
			const examples = options.includeExamples
				? [
						"`mcp-ai-agent-guidelines report skills --top 10`",
						"`mcp-ai-agent-guidelines export topology --format svg`",
						"`mcp-ai-agent-guidelines docs architecture`",
					]
				: [];
			const apiContent = [
				"# MCP AI Agent Guidelines CLI Reference",
				"",
				`Generated on ${new Date().toISOString()}.`,
				"",
				"## Reporting commands",
				"- `report performance` — summarize current metrics and performance signals",
				"- `report skills` — summarize the registered skills and their current execution data",
				"- `report orchestration` — analyze current topology and dependency bottlenecks",
				"- `report models` — summarize available models and configured routing choices",
				"- `report dashboard` — export the dashboard snapshot",
				"- `report all` — export the full report bundle",
				"",
				"## Export commands",
				"- `export topology --format svg|json`",
				"- `export dependencies --format svg|json`",
				"- `export metrics --format json|csv`",
				"",
				"## Current repository inventory",
				`- Registered skills: ${skillCount}`,
				`- Available models: ${
					availableModels.length > 0
						? availableModels.join(", ")
						: "No configured models reported"
				}`,
				"",
				"## Notes",
				"- Topology and dependency exports are generated from the current registered skill graph.",
				"- Report output format and theme follow the parent `report` command options.",
				"- Unsupported export formats are rejected instead of producing placeholder files.",
			];

			if (examples.length > 0) {
				apiContent.push("", "## Example commands", ...examples);
			}

			await mkdir(outputDirectory, { recursive: true });
			const outputPath = join(outputDirectory, "api-reference.md");
			await writeFile(outputPath, `${apiContent.join("\n")}\n`, "utf8");

			console.log(chalk.green(`✅ API documentation generated: ${outputPath}`));
		} catch (error) {
			this.failCommand("API documentation", error);
		}
	}

	private getDashboardSnapshot(): DashboardSnapshot {
		return this.unifiedOrchestrator.getAnalyticsDashboard();
	}

	private createReportingEngine(command: Command): AdvancedReportingEngine {
		return new AdvancedReportingEngine(this.resolveReportConfig(command));
	}

	private resolveReportConfig(command: Command): ReportConfig {
		const reportOptions = command.parent?.opts() as
			| {
					output?: string;
					theme?: string;
					format?: string;
					visualizations?: boolean;
			  }
			| undefined;

		return {
			outputDirectory:
				typeof reportOptions?.output === "string"
					? reportOptions.output
					: this.defaultOutputDirectory,
			includeProfiling: true,
			includeVisualization: reportOptions?.visualizations !== false,
			theme: this.parseTheme(reportOptions?.theme),
			format: this.parseReportingFormat(reportOptions?.format),
		};
	}

	private resolveOutputDirectory(command: Command): string {
		return this.resolveReportConfig(command).outputDirectory;
	}

	private extractMetricsFromDashboard(
		dashboardData: DashboardSnapshot,
	): PerformanceMetric[] {
		const timestamp = Date.now();
		const metrics: PerformanceMetric[] = [
			{
				entityId: "system",
				metricName: "workflow_average_execution_time",
				name: "workflow_average_execution_time",
				value: dashboardData.overview.averageExecutionTime,
				unit: "ms",
				timestamp,
				metadata: { source: "dashboard.overview" },
			},
			{
				entityId: "system",
				metricName: "workflow_success_rate",
				name: "workflow_success_rate",
				value: dashboardData.overview.successRate,
				unit: "ratio",
				timestamp,
				metadata: { source: "dashboard.overview" },
			},
			{
				entityId: "system",
				metricName: "workflow_total_count",
				name: "workflow_total_count",
				value: dashboardData.overview.totalWorkflows,
				unit: "count",
				timestamp,
				metadata: { source: "dashboard.overview" },
			},
			{
				entityId: "system",
				metricName: "workflow_active_count",
				name: "workflow_active_count",
				value: dashboardData.overview.activeWorkflows,
				unit: "count",
				timestamp,
				metadata: { source: "dashboard.overview" },
			},
			{
				entityId: "routing",
				metricName: "routing_efficiency",
				name: "routing_efficiency",
				value: dashboardData.graphAnalytics.routingEfficiency,
				unit: "ratio",
				timestamp,
				metadata: { source: "dashboard.graphAnalytics" },
			},
		];

		for (const anomaly of dashboardData.anomalies) {
			metrics.push({
				entityId: anomaly.type,
				metricName: `${anomaly.type}_severity`,
				name: `${anomaly.type}_severity`,
				value: this.getSeverityWeight(anomaly.severity),
				unit: "severity",
				timestamp: anomaly.timestamp.getTime(),
				metadata: {
					description: anomaly.description,
					severity: anomaly.severity,
				},
			});
		}

		return metrics;
	}

	private buildSkillNodes(): SkillNode[] {
		return SKILL_MANIFESTS.map((manifest) => ({
			id: manifest.id,
			name: manifest.displayName,
			domain: manifest.domain,
			dependencies: manifest.relatedSkills,
			complexity: Math.max(
				1,
				manifest.relatedSkills.length + manifest.usageSteps.length,
			),
			estimatedLatency: LATENCY_BY_MODEL_CLASS[manifest.preferredModelClass],
			type: "skill",
			prefix: this.getPrefix(manifest.id),
		}));
	}

	private buildSkillDocumentation(
		metrics: PerformanceMetric[],
		snapshot: DashboardSnapshot,
	): SkillDocumentation[] {
		const fallbackSuccessRate = Math.max(
			0,
			Math.min(1, snapshot.overview.successRate),
		);
		return SKILL_MANIFESTS.map((manifest) => {
			const skillMetrics = metrics.filter(
				(metric) => metric.entityId === manifest.id,
			);
			const latencyMetrics = skillMetrics.filter(
				(metric) => metric.unit === "ms" || metric.name.includes("latency"),
			);
			const errorMetrics = skillMetrics.filter((metric) =>
				metric.name.includes("error"),
			);

			return {
				skillId: manifest.id,
				description: manifest.description || manifest.purpose,
				domain: manifest.domain,
				dependencies: manifest.relatedSkills,
				usageExamples: manifest.usageSteps.slice(0, 3),
				performanceProfile:
					skillMetrics.length > 0
						? {
								averageLatency:
									latencyMetrics.length > 0
										? latencyMetrics.reduce(
												(sum, metric) => sum + metric.value,
												0,
											) / latencyMetrics.length
										: LATENCY_BY_MODEL_CLASS[manifest.preferredModelClass],
								successRate: Math.max(
									0,
									1 - errorMetrics.length / Math.max(skillMetrics.length, 1),
								),
								utilizationRate: skillMetrics.length,
							}
						: undefined,
				interactions: manifest.relatedSkills.map((relatedSkill) => ({
					withSkill: relatedSkill,
					frequency: this.countMutualRelationshipStrength(
						manifest,
						relatedSkill,
					),
					successRate: fallbackSuccessRate,
				})),
			};
		});
	}

	private buildReportingGraphData(): ReportingGraphData {
		const snapshot = this.getDashboardSnapshot();
		const skillNodes = this.buildSkillNodes();
		const agents = this.buildDomainAgents(SKILL_MANIFESTS, snapshot);
		const routes = this.buildRouteMap(SKILL_MANIFESTS, skillNodes, snapshot);
		const metrics = this.extractMetricsFromDashboard(snapshot);

		return {
			agents,
			skills: skillNodes,
			routes,
			metrics,
		};
	}

	private buildDocumentationGraphData(): DocumentationGraphData {
		const reportingGraph = this.buildReportingGraphData();
		const routes = [...reportingGraph.routes.entries()].flatMap(
			([source, targets]) =>
				[...targets.entries()].map(([target, edge]) => ({
					from: source,
					to: target,
					weight: edge.weight,
				})),
		);

		return {
			agents: reportingGraph.agents.map((agent) => ({
				id: agent.id,
				name: agent.name,
				capabilities: agent.capabilities,
			})),
			skills: reportingGraph.skills.map((skill) => ({
				id: skill.id,
				name: skill.name,
				domain: skill.domain,
				dependencies: skill.dependencies,
			})),
			routes,
			metrics: reportingGraph.metrics,
		};
	}

	private buildGraphAnalysis(graphData: ReportingGraphData): GraphAnalysis {
		const orchestrator = new GraphOrchestrator();
		orchestrator.buildAgentGraph(graphData.agents);
		orchestrator.buildSkillGraph(
			graphData.skills,
			graphData.skills.flatMap((skill) =>
				skill.dependencies.map((dependency) => ({
					from: skill.id,
					to: dependency,
				})),
			),
		);
		return orchestrator.analyzeGraph();
	}

	private buildDomainAgents(
		manifests: SkillManifestEntry[],
		snapshot: DashboardSnapshot,
	): AgentNode[] {
		const manifestsByDomain = new Map<string, SkillManifestEntry[]>();
		for (const manifest of manifests) {
			const domainManifests = manifestsByDomain.get(manifest.domain) ?? [];
			domainManifests.push(manifest);
			manifestsByDomain.set(manifest.domain, domainManifests);
		}

		return [...manifestsByDomain.entries()].map(([domain, domainManifests]) => {
			const dominantClass = this.selectDominantModelClass(domainManifests);
			return {
				id: `domain-${domain}`,
				name: `${domain.toUpperCase()} domain`,
				capabilities: domainManifests
					.slice(0, 5)
					.map((manifest) => manifest.id),
				modelTier: this.toAgentModelTier(dominantClass),
				status: snapshot.overview.activeWorkflows > 0 ? "busy" : "available",
				performance: {
					successRate: snapshot.overview.successRate,
					averageLatency: snapshot.overview.averageExecutionTime,
					throughput: domainManifests.length,
				},
			};
		});
	}

	private buildRouteMap(
		manifests: SkillManifestEntry[],
		skills: SkillNode[],
		snapshot: DashboardSnapshot,
	): Map<string, Map<string, RouteEdgeData>> {
		const skillById = new Map(
			skills.map((skill) => [skill.id, skill] as const),
		);
		const aggregates = new Map<
			string,
			Map<string, { count: number; totalLatency: number }>
		>();

		for (const manifest of manifests) {
			for (const relatedSkill of manifest.relatedSkills) {
				const sourceDomain = `domain-${manifest.domain}`;
				const target = skillById.get(relatedSkill);
				if (!target) {
					continue;
				}

				const targetDomain = `domain-${target.domain}`;
				if (sourceDomain === targetDomain) {
					continue;
				}

				const sourceRoutes = aggregates.get(sourceDomain) ?? new Map();
				const aggregate = sourceRoutes.get(targetDomain) ?? {
					count: 0,
					totalLatency: 0,
				};
				aggregate.count += 1;
				aggregate.totalLatency += target.estimatedLatency;
				sourceRoutes.set(targetDomain, aggregate);
				aggregates.set(sourceDomain, sourceRoutes);
			}
		}

		const maxWeight = Math.max(
			1,
			...[...aggregates.values()].flatMap((targets) =>
				[...targets.values()].map((aggregate) => aggregate.count),
			),
		);

		const routeMap = new Map<string, Map<string, RouteEdgeData>>();
		for (const [source, targets] of aggregates.entries()) {
			const targetMap = new Map<string, RouteEdgeData>();
			for (const [target, aggregate] of targets.entries()) {
				targetMap.set(target, {
					weight: aggregate.count / maxWeight,
					performance: {
						successRate: snapshot.overview.successRate,
						averageLatency: aggregate.totalLatency / aggregate.count,
					},
					lastUsed: new Date(),
				});
			}
			routeMap.set(source, targetMap);
		}

		return routeMap;
	}

	private buildModelRoutingSnapshot(): {
		availableModels: string[];
		routingDecisions: Array<{ model: string; reason: string; timestamp: Date }>;
		failoverEvents: Array<{
			from: string;
			to: string;
			timestamp: Date;
			reason: string;
		}>;
	} {
		const modelRouter = new ModelRouter();
		const routingDecisions = SKILL_MANIFESTS.map((manifest) => {
			const decision = modelRouter.routeSkillDecisionById(
				manifest.id,
				manifest.preferredModelClass,
			);
			return {
				model: decision.selectedModelId,
				reason: decision.rationale,
				timestamp: new Date(),
			};
		});
		const failoverEvents = Object.entries(
			modelAvailabilityService.getAllDeclarations(),
		).flatMap(([modelId, declaration]) => {
			if (declaration.available !== false) {
				return [];
			}
			const availability = modelAvailabilityService.checkAvailability(modelId);
			if (!availability.fallbackModel) {
				return [];
			}
			return [
				{
					from: modelId,
					to: availability.fallbackModel,
					timestamp: new Date(),
					reason: declaration.reason ?? "Unavailable in current configuration",
				},
			];
		});

		return {
			availableModels: this.collectAvailableModels(),
			routingDecisions,
			failoverEvents,
		};
	}

	private collectAvailableModels(): string[] {
		const available = new Set<string>();
		for (const modelClass of MODEL_CLASSES) {
			for (const modelId of modelAvailabilityService.getAvailableModelsForClass(
				modelClass,
			)) {
				available.add(modelId);
			}
		}
		return [...available];
	}

	private countMutualRelationshipStrength(
		manifest: SkillManifestEntry,
		relatedSkill: string,
	): number {
		const peer = SKILL_MANIFESTS.find(
			(candidate) => candidate.id === relatedSkill,
		);
		if (!peer) {
			return 1;
		}
		return peer.relatedSkills.includes(manifest.id) ? 2 : 1;
	}

	private selectDominantModelClass(
		manifests: SkillManifestEntry[],
	): ModelClass {
		const counts = new Map<ModelClass, number>();
		for (const manifest of manifests) {
			counts.set(
				manifest.preferredModelClass,
				(counts.get(manifest.preferredModelClass) ?? 0) + 1,
			);
		}

		return MODEL_CLASSES.reduce((selected, candidate) =>
			(counts.get(candidate) ?? 0) > (counts.get(selected) ?? 0)
				? candidate
				: selected,
		);
	}

	private toAgentModelTier(modelClass: ModelClass): AgentNode["modelTier"] {
		switch (modelClass) {
			case "free":
				return "free";
			case "cheap":
				return "cheap";
			case "strong":
			case "reviewer":
				return "strong";
		}
	}

	private getPrefix(skillId: string): string {
		const [prefix] = skillId.split("-", 1);
		return prefix ?? skillId;
	}

	private getRouteCount(routes: ReportingGraphData["routes"]): number {
		return [...routes.values()].reduce((sum, targets) => sum + targets.size, 0);
	}

	private applyTimeWindow(
		metrics: PerformanceMetric[],
		window: string,
	): PerformanceMetric[] {
		const now = Date.now();
		let cutoff = now;

		switch (window) {
			case "1h":
				cutoff = now - 60 * 60 * 1000;
				break;
			case "1d":
				cutoff = now - 24 * 60 * 60 * 1000;
				break;
			case "1w":
				cutoff = now - 7 * 24 * 60 * 60 * 1000;
				break;
			case "1m":
				cutoff = now - 30 * 24 * 60 * 60 * 1000;
				break;
		}

		return metrics.filter((metric) => metric.timestamp >= cutoff);
	}

	private parseTimeWindow(window: string): { start: Date; end: Date } {
		const end = new Date();
		const start = new Date(end);

		switch (window) {
			case "1h":
				start.setHours(start.getHours() - 1);
				break;
			case "1d":
				start.setDate(start.getDate() - 1);
				break;
			case "1w":
				start.setDate(start.getDate() - 7);
				break;
			case "1m":
				start.setMonth(start.getMonth() - 1);
				break;
		}

		return { start, end };
	}

	private parsePositiveInteger(
		value: string | undefined,
		fallback: number,
	): number {
		const parsed = Number.parseInt(value ?? "", 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
	}

	private parseTheme(theme: string | undefined): ReportingTheme {
		return theme === "dark" ? "dark" : "light";
	}

	private parseReportingFormat(format: string | undefined): ReportingFormat {
		switch (format) {
			case "json":
			case "markdown":
			case "pdf":
			case "html":
				return format;
			default:
				return "html";
		}
	}

	private parseExportFormat(format: string | undefined): ExportFormat {
		if (format === "json" || format === "svg") {
			return format;
		}
		throw new Error(`Unsupported export format: ${format ?? "unknown"}`);
	}

	private parseMetricsExportFormat(
		format: string | undefined,
	): MetricsExportFormat {
		if (format === "csv" || format === "json") {
			return format;
		}
		throw new Error(
			`Unsupported metrics export format: ${format ?? "unknown"}`,
		);
	}

	private renderTopologySvg(
		graphData: ReportingGraphData,
		analysis: GraphAnalysis,
	): string {
		const agentLabels = graphData.agents
			.slice(0, 8)
			.map(
				(agent, index) =>
					`<text x="40" y="${90 + index * 24}" font-size="14">${this.escapeXml(
						agent.name,
					)} (${agent.capabilities.length} skills)</text>`,
			)
			.join("");

		return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="420">
<rect width="100%" height="100%" fill="#ffffff" />
<text x="40" y="40" font-size="24" font-weight="bold">Workflow topology summary</text>
<text x="40" y="70" font-size="14">Domains: ${graphData.agents.length} · Skills: ${graphData.skills.length} · Routes: ${this.getRouteCount(graphData.routes)}</text>
<text x="40" y="310" font-size="14">Bottlenecks: ${analysis.bottlenecks.length}</text>
<text x="40" y="334" font-size="14">Recommendations: ${this.escapeXml(analysis.recommendations.join(" | ") || "None")}</text>
${agentLabels}
</svg>`;
	}

	private renderDependencySvg(
		skillDocumentation: SkillDocumentation[],
	): string {
		const rows = skillDocumentation
			.filter((skill) => skill.dependencies.length > 0)
			.slice(0, 10)
			.map(
				(skill, index) =>
					`<text x="40" y="${80 + index * 24}" font-size="14">${this.escapeXml(
						`${skill.skillId} -> ${skill.dependencies.join(", ")}`,
					)}</text>`,
			)
			.join("");

		return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="420">
<rect width="100%" height="100%" fill="#ffffff" />
<text x="40" y="40" font-size="24" font-weight="bold">Skill dependency summary</text>
<text x="40" y="65" font-size="14">Skills with dependencies: ${skillDocumentation.filter((skill) => skill.dependencies.length > 0).length}</text>
${rows || '<text x="40" y="100" font-size="14">No declared dependencies found.</text>'}
</svg>`;
	}

	private convertMetricsToCsv(metrics: PerformanceMetric[]): string {
		const headers = "entityId,metricName,value,timestamp,unit,metadata\n";
		const rows = metrics
			.map((metric) =>
				[
					metric.entityId,
					metric.metricName,
					String(metric.value),
					String(metric.timestamp),
					metric.unit,
					JSON.stringify(metric.metadata ?? {}),
				]
					.map((value) => this.escapeCsvCell(value))
					.join(","),
			)
			.join("\n");
		return headers + rows;
	}

	private getSeverityWeight(severity: string): number {
		return SEVERITY_WEIGHT[severity as keyof typeof SEVERITY_WEIGHT] ?? 0;
	}

	private escapeCsvCell(value: string): string {
		const escaped = value.replaceAll('"', '""');
		return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
	}

	private escapeXml(value: string): string {
		return value
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&apos;");
	}

	private failCommand(action: string, error: unknown): never {
		const message = toErrorMessage(error);
		console.error(chalk.red(`❌ Failed to generate ${action}: ${message}`));
		process.exit(1);
	}
}
