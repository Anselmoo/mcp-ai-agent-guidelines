/**
 * Advanced reporting and analytics for the current orchestration snapshot.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
	AgentNode,
	GraphAnalysis,
	PerformanceMetric,
	SkillNode,
} from "../contracts/graph-types.js";
import type { UnifiedOrchestratorDashboard } from "../infrastructure/unified-orchestration.js";
import { UnifiedOrchestrator } from "../infrastructure/unified-orchestration.js";
import {
	analyzePerformanceMetrics,
	analyzeSkillPerformance,
	calculateAverageWorkflowDuration,
	calculateErrorRate,
	calculateOverviewMetrics,
	calculateThroughput,
	detectPerformanceAnomalies,
	type PerformanceOverviewMetrics,
} from "./advanced-reporting-analytics.js";
import {
	calculateAvailabilityScore,
	calculateModelUtilization,
	generateDashboardRecommendations,
	generateRoutingRecommendations,
} from "./advanced-reporting-routing.js";

export interface ReportConfig {
	outputDirectory: string;
	includeProfiling: boolean;
	includeVisualization: boolean;
	theme: "light" | "dark";
	format: "html" | "pdf" | "json" | "markdown";
	timeWindow?: {
		start: Date;
		end: Date;
	};
}

export interface SkillPerformanceAnalytics {
	skillId: string;
	executionCount: number;
	averageLatency: number;
	successRate: number;
	errorTypes: Record<string, number>;
	utilizationTrend: Array<{ timestamp: Date; value: number }>;
	dependencies: string[];
	recommendations: string[];
}

export interface OrchestrationInsights {
	topology: {
		agentCount: number;
		skillCount: number;
		routeCount: number;
		bottleneckCount: number;
	};
	performance: {
		averageWorkflowDuration: number;
		throughput: number;
		errorRate: number;
		routingEfficiency: number;
	};
	optimization: {
		recommendations: string[];
		predictedImprovements: Record<string, number>;
		adaptiveRoutingMetrics?: {
			acoConvergenceRate: number;
			hebbianStrengths: Record<string, number>;
			physarumPruningEvents: number;
		};
	};
	anomalies: Array<{
		timestamp: Date;
		type: string;
		severity: "low" | "medium" | "high";
		description: string;
		impact: string;
	}>;
}

interface GraphVisualizationData {
	routes: Map<string, Map<string, unknown>>;
	agents: AgentNode[];
	skills: SkillNode[];
	metrics: PerformanceMetric[];
}

/** Shape of the data object passed to `generateHtmlReport`. */
interface ReportData {
	generatedAt: Date;
	overview?: Record<string, unknown> | PerformanceOverviewMetrics;
	[key: string]: unknown;
}

/** Routing data accepted by model-routing report helpers. */
interface ModelRoutingData {
	availableModels: string[];
	routingDecisions: Array<{ model: string; reason: string; timestamp: Date }>;
	failoverEvents: Array<{
		from: string;
		to: string;
		timestamp: Date;
		reason: string;
	}>;
}

/**
 * Advanced reporting engine for analytics and exportable summaries.
 */
export class AdvancedReportingEngine {
	private config: ReportConfig;
	private unifiedOrchestrator: UnifiedOrchestrator;

	constructor(config: Partial<ReportConfig> = {}) {
		this.config = {
			outputDirectory: "./reports",
			includeProfiling: true,
			includeVisualization: false,
			theme: "light",
			format: "html",
			...config,
		};

		this.unifiedOrchestrator = new UnifiedOrchestrator();
	}

	/**
	 * Generate comprehensive performance report with visualizations
	 */
	async generatePerformanceReport(
		metrics: PerformanceMetric[],
		timeWindow?: { start: Date; end: Date },
	): Promise<string> {
		const filteredMetrics = timeWindow
			? metrics.filter((m) => {
					const metricTime = new Date(m.timestamp);
					return metricTime >= timeWindow.start && metricTime <= timeWindow.end;
				})
			: metrics;

		const analytics = analyzePerformanceMetrics(filteredMetrics);
		const reportData = {
			generatedAt: new Date(),
			timeWindow,
			overview: analytics.overview,
			skillAnalytics: analytics.skillAnalytics,
			trends: analytics.trends,
			anomalies: analytics.anomalies,
		};

		let visualizations = "";
		if (this.config.includeVisualization) {
			visualizations =
				await this.generatePerformanceVisualizations(filteredMetrics);
		}

		const htmlReport = this.generateHtmlReport(
			"Performance Analysis Report",
			reportData,
			visualizations,
		);

		const outputPath = await this.saveReport("performance-report", htmlReport);
		return outputPath;
	}

	/**
	 * Generate skill execution analytics with utilization insights
	 */
	async generateSkillAnalyticsReport(
		metrics: PerformanceMetric[],
		skillNodes: SkillNode[],
	): Promise<string> {
		const skillAnalytics: SkillPerformanceAnalytics[] = [];

		for (const skill of skillNodes) {
			const skillMetrics = metrics.filter((m) => m.entityId === skill.id);
			const analytics = analyzeSkillPerformance(skill, skillMetrics);
			skillAnalytics.push(analytics);
		}

		skillAnalytics.sort((a, b) => b.executionCount - a.executionCount);

		const reportData = {
			generatedAt: new Date(),
			totalSkills: skillNodes.length,
			totalExecutions: skillAnalytics.reduce(
				(sum, s) => sum + s.executionCount,
				0,
			),
			averageSuccessRate:
				skillAnalytics.reduce((sum, s) => sum + s.successRate, 0) /
				skillAnalytics.length,
			skillDetails: skillAnalytics,
			topPerformers: skillAnalytics.slice(0, 10),
			underutilized: skillAnalytics.filter((s) => s.executionCount < 5),
		};

		const htmlReport = this.generateHtmlReport(
			"Skill Analytics Report",
			reportData,
		);

		const outputPath = await this.saveReport("skill-analytics", htmlReport);
		return outputPath;
	}

	/**
	 * Generate orchestration flow insights with topology analysis
	 */
	async generateOrchestrationReport(
		graphData: GraphVisualizationData,
		analysis: GraphAnalysis,
	): Promise<string> {
		const insights = this.generateOrchestrationInsights(graphData, analysis);

		let flowDiagram = "";
		if (this.config.includeVisualization) {
			flowDiagram = this.generateOrchestrationVisualization(insights);
		}

		const reportData = {
			generatedAt: new Date(),
			insights,
			topology: insights.topology,
			performance: insights.performance,
			optimization: insights.optimization,
			anomalies: insights.anomalies,
		};

		const htmlReport = this.generateHtmlReport(
			"Orchestration Flow Report",
			reportData,
			flowDiagram,
		);

		const outputPath = await this.saveReport(
			"orchestration-report",
			htmlReport,
		);
		return outputPath;
	}

	/**
	 * Generate comprehensive analytics dashboard with all metrics
	 */
	async generateAnalyticsDashboard(): Promise<string> {
		const dashboardData = this.unifiedOrchestrator.getAnalyticsDashboard();

		let visualizations = "";
		if (this.config.includeVisualization) {
			visualizations =
				await this.generateDashboardVisualizations(dashboardData);
		}

		const reportData = {
			generatedAt: new Date(),
			overview: dashboardData.overview,
			graphAnalytics: dashboardData.graphAnalytics,
			anomalies: dashboardData.anomalies,
			recommendations: generateDashboardRecommendations(dashboardData),
		};

		const htmlReport = this.generateHtmlReport(
			"Analytics Dashboard",
			reportData,
			visualizations,
		);

		const outputPath = await this.saveReport("analytics-dashboard", htmlReport);
		return outputPath;
	}

	/**
	 * Generate model routing and availability report
	 */
	async generateModelRoutingReport(
		routingData: ModelRoutingData,
	): Promise<string> {
		const routingAnalytics = {
			modelUtilization: calculateModelUtilization(routingData.routingDecisions),
			failoverRate:
				routingData.routingDecisions.length > 0
					? routingData.failoverEvents.length /
						routingData.routingDecisions.length
					: 0,
			availabilityScore: calculateAvailabilityScore(routingData),
			recommendations: generateRoutingRecommendations(routingData),
		};

		const reportData = {
			generatedAt: new Date(),
			availableModels: routingData.availableModels,
			analytics: routingAnalytics,
			recentFailovers: routingData.failoverEvents.slice(-10),
			utilizationTrends: routingAnalytics.modelUtilization,
		};

		const htmlReport = this.generateHtmlReport(
			"Model Routing Report",
			reportData,
		);

		const outputPath = await this.saveReport("model-routing", htmlReport);
		return outputPath;
	}

	/**
	 * Export all reports in batch
	 */
	async generateAllReports(
		metrics: PerformanceMetric[],
		graphData: GraphVisualizationData,
		analysis: GraphAnalysis,
	): Promise<string[]> {
		const reports: string[] = [];

		try {
			// Ensure output directory exists
			await mkdir(this.config.outputDirectory, { recursive: true });

			// Generate all report types
			const performanceReport = await this.generatePerformanceReport(metrics);
			reports.push(performanceReport);

			const skillReport = await this.generateSkillAnalyticsReport(
				metrics,
				graphData.skills,
			);
			reports.push(skillReport);

			const orchestrationReport = await this.generateOrchestrationReport(
				graphData,
				analysis,
			);
			reports.push(orchestrationReport);

			const dashboardReport = await this.generateAnalyticsDashboard();
			reports.push(dashboardReport);

			// Generate index report that links to all others
			const indexReport = await this.generateIndexReport(reports);
			reports.push(indexReport);

			return reports;
		} catch (error) {
			throw new Error(
				`Failed to generate reports: ${(error as Error).message}`,
			);
		}
	}

	private generateOrchestrationInsights(
		graphData: GraphVisualizationData,
		analysis: GraphAnalysis,
	): OrchestrationInsights {
		const topology = {
			agentCount: graphData.agents.length,
			skillCount: graphData.skills.length,
			routeCount: this.countRoutes(graphData.routes),
			bottleneckCount: analysis.bottlenecks.length,
		};

		const avgDuration = calculateAverageWorkflowDuration(graphData.metrics);
		const throughput = calculateThroughput(graphData.metrics);
		const errorRate = calculateErrorRate(graphData.metrics);

		const performance = {
			averageWorkflowDuration: avgDuration,
			throughput,
			errorRate,
			routingEfficiency: this.calculateRoutingEfficiency(graphData, analysis),
		};

		const optimization = {
			recommendations: analysis.recommendations,
			predictedImprovements: this.calculatePredictedImprovements(analysis),
		};

		const anomalies = this.detectSystemAnomalies(graphData.metrics);

		return {
			topology,
			performance,
			optimization,
			anomalies,
		};
	}

	private async generatePerformanceVisualizations(
		metrics: PerformanceMetric[],
	): Promise<string> {
		const overview = calculateOverviewMetrics(metrics);
		const busiestMetrics = [...metrics]
			.sort((left, right) => right.value - left.value)
			.slice(0, 5)
			.map(
				(metric) =>
					`<li><strong>${metric.entityId}</strong> — ${metric.name}: ${this.formatValue(metric.value)} ${metric.unit}</li>`,
			)
			.join("");
		const anomalies = detectPerformanceAnomalies(metrics)
			.map((anomaly) => `<li>${anomaly.description} (${anomaly.severity})</li>`)
			.join("");

		return `
      <div class="visualization-grid">
        <div class="chart-container">
          <h3>Metric snapshot</h3>
          <div class="metric-cards">
            <div class="metric-card">
              <h4>Total metrics</h4>
              <span class="metric-value">${overview.totalMetrics}</span>
            </div>
            <div class="metric-card">
              <h4>Average latency</h4>
              <span class="metric-value">${this.formatValue(overview.avgLatency)} ms</span>
            </div>
            <div class="metric-card">
              <h4>Error rate</h4>
              <span class="metric-value">${(overview.errorRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <h3>Largest metric values</h3>
          <ul>${busiestMetrics || "<li>No metrics available.</li>"}</ul>
        </div>
        <div class="chart-container">
          <h3>Anomalies</h3>
          <ul>${anomalies || "<li>No anomalies detected.</li>"}</ul>
        </div>
      </div>
    `;
	}

	private async generateDashboardVisualizations(
		dashboardData: UnifiedOrchestratorDashboard,
	): Promise<string> {
		// Create a comprehensive dashboard combining multiple visualizations
		return `
      <div class="visualization-grid">
        <div class="chart-container">
          <h3>System Overview</h3>
          <div class="metric-cards">
            <div class="metric-card">
              <h4>Total Workflows</h4>
              <span class="metric-value">${dashboardData.overview.totalWorkflows}</span>
            </div>
            <div class="metric-card">
              <h4>Success Rate</h4>
              <span class="metric-value">${(dashboardData.overview.successRate * 100).toFixed(1)}%</span>
            </div>
            <div class="metric-card">
              <h4>Avg Execution Time</h4>
              <span class="metric-value">${dashboardData.overview.averageExecutionTime.toFixed(0)}ms</span>
            </div>
          </div>
        </div>
      </div>
    `;
	}

	private generateHtmlReport(
		title: string,
		data: ReportData,
		visualizations?: string,
	): string {
		const themeStyles = this.getThemeStyles();

		return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${themeStyles}
        .report-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .report-header { border-bottom: 2px solid var(--border-color); padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .metric-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { padding: 15px; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: var(--accent-color); }
        .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .data-table th, .data-table td { padding: 10px; text-align: left; border-bottom: 1px solid var(--border-color); }
        .visualization { margin: 30px 0; text-align: center; }
        .anomaly { padding: 10px; margin: 10px 0; border-left: 4px solid var(--warning-color); background: var(--warning-bg); }
        .recommendation { padding: 10px; margin: 10px 0; border-left: 4px solid var(--success-color); background: var(--success-bg); }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1>${title}</h1>
            <p>Generated: ${data.generatedAt}</p>
        </div>

        <div class="section">
            <h2>Overview</h2>
            ${this.renderDataSection(data)}
        </div>

        ${
					visualizations
						? `
        <div class="section">
            <h2>Visualizations</h2>
            <div class="visualization">
                ${visualizations}
            </div>
        </div>
        `
						: ""
				}

        <div class="section">
            <h2>Detailed Data</h2>
            <pre style="background: var(--code-bg); padding: 20px; border-radius: 8px; overflow-x: auto;">
${JSON.stringify(data, null, 2)}
            </pre>
        </div>
    </div>
</body>
</html>
    `;
	}

	private getThemeStyles(): string {
		if (this.config.theme === "dark") {
			return `
        :root {
          --bg-color: #1a1a1a;
          --text-color: #ffffff;
          --border-color: #333333;
          --accent-color: #4a9eff;
          --warning-color: #ff6b4a;
          --warning-bg: #2a1a1a;
          --success-color: #4caf50;
          --success-bg: #1a2a1a;
          --code-bg: #2a2a2a;
        }
        body { background: var(--bg-color); color: var(--text-color); font-family: 'Segoe UI', sans-serif; }
      `;
		} else {
			return `
        :root {
          --bg-color: #ffffff;
          --text-color: #333333;
          --border-color: #dddddd;
          --accent-color: #2196f3;
          --warning-color: #f44336;
          --warning-bg: #ffebee;
          --success-color: #4caf50;
          --success-bg: #e8f5e8;
          --code-bg: #f5f5f5;
        }
        body { background: var(--bg-color); color: var(--text-color); font-family: 'Segoe UI', sans-serif; }
      `;
		}
	}

	private renderDataSection(data: ReportData): string {
		if (data.overview) {
			return `
        <div class="metric-cards">
          ${Object.entries(data.overview)
						.map(
							([key, value]) => `
            <div class="metric-card">
              <h4>${this.formatLabel(key)}</h4>
              <span class="metric-value">${this.formatValue(value)}</span>
            </div>
          `,
						)
						.join("")}
        </div>
      `;
		}
		return "";
	}

	private formatLabel(key: string): string {
		return key
			.replace(/([A-Z])/g, " $1")
			.replace(/^./, (str) => str.toUpperCase());
	}

	private formatValue(value: unknown): string {
		if (typeof value === "number") {
			return value % 1 === 0 ? value.toString() : value.toFixed(2);
		}
		return value?.toString() || "";
	}

	private async saveReport(name: string, content: string): Promise<string> {
		await mkdir(this.config.outputDirectory, { recursive: true });

		const timestamp = new Date()
			.toISOString()
			.slice(0, 19)
			.replace(/[:-]/g, "");
		const extension = this.config.format === "html" ? "html" : "txt";
		const filename = `${name}-${timestamp}.${extension}`;
		const filepath = join(this.config.outputDirectory, filename);

		await writeFile(filepath, content, "utf8");
		return filepath;
	}

	private async generateIndexReport(reportPaths: string[]): Promise<string> {
		const indexContent = `
<!DOCTYPE html>
<html>
<head>
    <title>MCP Agent Guidelines v2 - Reports Index</title>
    <style>${this.getThemeStyles()}</style>
</head>
<body>
    <div class="report-container">
        <h1>MCP Agent Guidelines v2 - Analysis Reports</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        
        <h2>Available Reports</h2>
        <ul>
          ${reportPaths.map((path) => `<li><a href="${path}">${path}</a></li>`).join("")}
        </ul>
    </div>
</body>
</html>
    `;

		return await this.saveReport("index", indexContent);
	}

	private calculatePredictedImprovements(
		analysis: GraphAnalysis,
	): Record<string, number> {
		const bottleneckCount = analysis.bottlenecks.length;
		const recommendationCount = analysis.recommendations.length;
		const routeCount = analysis.agentTopology.edgeCount || 1;

		return {
			routingEfficiency: Number(
				Math.min(0.35, recommendationCount / routeCount).toFixed(2),
			),
			averageLatency: Number(
				Math.min(
					0.4,
					(bottleneckCount + recommendationCount) / (routeCount * 2),
				).toFixed(2),
			),
			errorRate: Number(Math.min(0.3, bottleneckCount / routeCount).toFixed(2)),
		};
	}

	private generateOrchestrationVisualization(
		insights: OrchestrationInsights,
	): string {
		return `
      <div class="visualization-grid">
        <div class="chart-container">
          <h3>Topology</h3>
          <ul>
            <li>Agents: ${insights.topology.agentCount}</li>
            <li>Skills: ${insights.topology.skillCount}</li>
            <li>Routes: ${insights.topology.routeCount}</li>
            <li>Bottlenecks: ${insights.topology.bottleneckCount}</li>
          </ul>
        </div>
        <div class="chart-container">
          <h3>Performance</h3>
          <ul>
            <li>Average workflow duration: ${this.formatValue(insights.performance.averageWorkflowDuration)} ms</li>
            <li>Throughput: ${this.formatValue(insights.performance.throughput)} ops/s</li>
            <li>Error rate: ${(insights.performance.errorRate * 100).toFixed(1)}%</li>
            <li>Routing efficiency: ${(insights.performance.routingEfficiency * 100).toFixed(1)}%</li>
          </ul>
        </div>
      </div>
    `;
	}

	private calculateRoutingEfficiency(
		graphData: GraphVisualizationData,
		analysis: GraphAnalysis,
	): number {
		const routeCount = this.countRoutes(graphData.routes);
		const bottleneckPenalty =
			analysis.bottlenecks.length / Math.max(routeCount, 1);
		const recommendationPenalty =
			analysis.recommendations.length /
			Math.max(
				analysis.skillDependencies.edgeCount ||
					analysis.agentTopology.edgeCount ||
					1,
				1,
			);

		return Math.max(
			0,
			Number(
				(1 - bottleneckPenalty * 0.5 - recommendationPenalty * 0.25).toFixed(2),
			),
		);
	}

	private countRoutes(routes: Map<string, Map<string, unknown>>): number {
		let count = 0;
		for (const targetMap of routes.values()) {
			count += targetMap.size;
		}
		return count;
	}

	private detectSystemAnomalies(metrics: PerformanceMetric[]): Array<{
		timestamp: Date;
		type: string;
		severity: "low" | "medium" | "high";
		description: string;
		impact: string;
	}> {
		// Simplified system anomaly detection
		return detectPerformanceAnomalies(metrics).map((anomaly) => ({
			timestamp: new Date(),
			type: anomaly.type,
			severity: anomaly.severity,
			description: anomaly.description,
			impact: "Potential performance degradation",
		}));
	}
}

/**
 * Factory for creating advanced reporting engines
 */
export class AdvancedReportingFactory {
	static create(config?: Partial<ReportConfig>): AdvancedReportingEngine {
		return new AdvancedReportingEngine(config);
	}
}
