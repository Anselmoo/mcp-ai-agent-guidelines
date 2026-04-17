import {
	existsSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UnifiedOrchestrator } from "../../infrastructure/unified-orchestration.js";
import { modelAvailabilityService } from "../../models/model-availability.js";
import { ReportingCliCommands } from "../../presentation/cli-extensions.js";

describe("presentation/cli-extensions", () => {
	const tempDirs: string[] = [];

	afterEach(() => {
		vi.restoreAllMocks();
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	function makeTempDir(prefix: string): string {
		const dir = mkdtempSync(join(tmpdir(), prefix));
		tempDirs.push(dir);
		return dir;
	}

	function createProgram(outputDirectory?: string): Command {
		const program = new Command();
		new ReportingCliCommands({ outputDirectory }).registerCommands(program);
		return program;
	}

	it("registers the expected top-level reporting command groups", () => {
		const program = createProgram();

		expect(program.commands.map((command) => command.name())).toEqual(
			expect.arrayContaining(["report", "export", "analytics", "docs"]),
		);
		const report = program.commands.find(
			(command) => command.name() === "report",
		);
		expect(report?.commands.map((command) => command.name())).toEqual(
			expect.arrayContaining([
				"performance",
				"skills",
				"orchestration",
				"models",
				"dashboard",
				"all",
			]),
		);
	});

	it("runs the documentation workflow without placeholder output", async () => {
		const outputDirectory = makeTempDir("cli-docs-");
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const program = createProgram(outputDirectory);

		await program.parseAsync(["node", "test", "docs", "architecture"]);

		expect(errorSpy).not.toHaveBeenCalled();
		expect(existsSync(join(outputDirectory, "ARCHITECTURE.md"))).toBe(true);
		expect(
			existsSync(join(outputDirectory, "visuals", "agent-topology.svg")),
		).toBe(true);

		const architectureDoc = readFileSync(
			join(outputDirectory, "ARCHITECTURE.md"),
			"utf8",
		);
		const topologySvg = readFileSync(
			join(outputDirectory, "visuals", "agent-topology.svg"),
			"utf8",
		);

		expect(architectureDoc).toContain(
			"# MCP AI Agent Guidelines v2 Architecture",
		);
		expect(architectureDoc).not.toContain("Wave");
		expect(architectureDoc).not.toContain("visualization deferred");
		expect(topologySvg).toContain("<svg");
		expect(topologySvg).not.toContain("visualization deferred");
		expect(logSpy).toHaveBeenCalled();
	});

	it("runs report and export workflows with real generated artifacts", async () => {
		const outputDirectory = makeTempDir("cli-report-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const reportProgram = createProgram(outputDirectory);
		await reportProgram.parseAsync([
			"node",
			"test",
			"report",
			"--output",
			outputDirectory,
			"all",
		]);

		const exportProgram = createProgram(outputDirectory);
		await exportProgram.parseAsync([
			"node",
			"test",
			"export",
			"topology",
			"--format",
			"json",
		]);

		const metricsProgram = createProgram(outputDirectory);
		await metricsProgram.parseAsync([
			"node",
			"test",
			"export",
			"metrics",
			"--format",
			"csv",
		]);

		expect(errorSpy).not.toHaveBeenCalled();

		const generatedFiles = readdirSync(outputDirectory);
		expect(
			generatedFiles.some((filename) =>
				filename.startsWith("performance-report-"),
			),
		).toBe(true);
		expect(
			generatedFiles.some((filename) =>
				filename.startsWith("skill-analytics-"),
			),
		).toBe(true);
		expect(
			generatedFiles.some((filename) =>
				filename.startsWith("orchestration-report-"),
			),
		).toBe(true);
		expect(generatedFiles).toContain("topology.json");
		expect(generatedFiles).toContain("metrics.csv");

		const topologyExport = readFileSync(
			join(outputDirectory, "topology.json"),
			"utf8",
		);
		const metricsExport = readFileSync(
			join(outputDirectory, "metrics.csv"),
			"utf8",
		);

		expect(topologyExport).toContain('"agents"');
		expect(topologyExport).not.toContain("visualization deferred");
		expect(metricsExport).toContain(
			"entityId,metricName,value,timestamp,unit,metadata",
		);
		expect(metricsExport).not.toContain("placeholder");
	});

	it("runs individual report subcommands", async () => {
		const outputDirectory = makeTempDir("cli-subreport-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		for (const sub of [
			"performance",
			"skills",
			"orchestration",
			"models",
			"dashboard",
		]) {
			const program = createProgram(outputDirectory);
			await program.parseAsync([
				"node",
				"test",
				"report",
				"--output",
				outputDirectory,
				sub,
			]);
		}

		expect(errorSpy).not.toHaveBeenCalled();
	});

	it("runs export dependencies and topology as svg", async () => {
		const outputDirectory = makeTempDir("cli-export-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const depProgram = createProgram(outputDirectory);
		await depProgram.parseAsync([
			"node",
			"test",
			"export",
			"dependencies",
			"--format",
			"svg",
		]);

		const topoProgram = createProgram(outputDirectory);
		await topoProgram.parseAsync([
			"node",
			"test",
			"export",
			"topology",
			"--format",
			"svg",
		]);
	});

	it("runs analytics subcommands", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		for (const sub of ["trends", "anomalies"]) {
			const program = createProgram();
			await program.parseAsync(["node", "test", "analytics", sub]);
		}

		const recsProgram = createProgram();
		await recsProgram.parseAsync([
			"node",
			"test",
			"analytics",
			"recommendations",
			"--focus",
			"reliability",
		]);
	});

	it("runs docs api command", async () => {
		const outputDirectory = makeTempDir("cli-docs-api-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync(["node", "test", "docs", "api"]);
	});

	it("runs export metrics as json", async () => {
		const outputDirectory = makeTempDir("cli-metrics-json-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"export",
			"metrics",
			"--format",
			"json",
		]);
		expect(existsSync(join(outputDirectory, "metrics.json"))).toBe(true);
	});

	it("runs report performance with time-window option", async () => {
		const outputDirectory = makeTempDir("cli-perf-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"report",
			"--output",
			outputDirectory,
			"performance",
			"--time-window",
			"1h",
		]);
	});

	it("runs export dependencies as json", async () => {
		const outputDirectory = makeTempDir("cli-dep-json-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"export",
			"dependencies",
			"--format",
			"json",
		]);
	});

	it("runs report performance with 1w and 1m time windows", async () => {
		const outputDirectory = makeTempDir("cli-perf-tw-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		for (const window of ["1w", "1m"]) {
			const program = createProgram(outputDirectory);
			await program.parseAsync([
				"node",
				"test",
				"report",
				"--output",
				outputDirectory,
				"performance",
				"--time-window",
				window,
			]);
		}
	});

	it("runs report all with dark theme and json format", async () => {
		const outputDirectory = makeTempDir("cli-all-dark-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"report",
			"--output",
			outputDirectory,
			"--theme",
			"dark",
			"--format",
			"json",
			"all",
		]);
	});

	it("runs report all with markdown and pdf formats", async () => {
		const outputDirectory = makeTempDir("cli-all-fmt-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		for (const fmt of ["markdown", "pdf"]) {
			const program = createProgram(outputDirectory);
			await program.parseAsync([
				"node",
				"test",
				"report",
				"--output",
				outputDirectory,
				"--format",
				fmt,
				"all",
			]);
		}
	});

	it("runs report orchestration with include-bottlenecks", async () => {
		const outputDirectory = makeTempDir("cli-orch-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"report",
			"--output",
			outputDirectory,
			"orchestration",
			"--include-bottlenecks",
		]);
	});

	it("runs report models with include-failovers", async () => {
		const outputDirectory = makeTempDir("cli-models-fo-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"report",
			"--output",
			outputDirectory,
			"models",
			"--include-failovers",
		]);
	});

	it("runs report skills with custom top and threshold", async () => {
		const outputDirectory = makeTempDir("cli-skills-opts-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"report",
			"--output",
			outputDirectory,
			"skills",
			"--top",
			"5",
			"--threshold",
			"3",
		]);
	});

	it("runs report all with no-visualizations flag", async () => {
		const outputDirectory = makeTempDir("cli-novis-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"report",
			"--output",
			outputDirectory,
			"--no-visualizations",
			"all",
		]);
	});

	it("private parsePositiveInteger falls back on invalid input", () => {
		const cli = new ReportingCliCommands() as any;

		expect(cli.parsePositiveInteger("abc", 10)).toBe(10);
		expect(cli.parsePositiveInteger("-5", 7)).toBe(7);
		expect(cli.parsePositiveInteger(undefined, 3)).toBe(3);
		expect(cli.parsePositiveInteger("5", 10)).toBe(5);
	});

	it("private parseTheme returns dark for dark input", () => {
		const cli = new ReportingCliCommands() as any;

		expect(cli.parseTheme("dark")).toBe("dark");
		expect(cli.parseTheme("light")).toBe("light");
		expect(cli.parseTheme(undefined)).toBe("light");
	});

	it("private escapeCsvCell escapes cells with quotes and commas", () => {
		const cli = new ReportingCliCommands() as any;

		expect(cli.escapeCsvCell("hello")).toBe("hello");
		expect(cli.escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
		expect(cli.escapeCsvCell("a,b")).toBe('"a,b"');
	});

	it("private escapeXml escapes special characters", () => {
		const cli = new ReportingCliCommands() as any;

		const result = cli.escapeXml('<script>&"test"</script>');
		expect(result).toContain("&lt;");
		expect(result).toContain("&gt;");
		expect(result).toContain("&amp;");
		expect(result).toContain("&quot;");
	});

	it("private parseReportingFormat returns html for unknown format", () => {
		const cli = new ReportingCliCommands() as any;

		expect(cli.parseReportingFormat("json")).toBe("json");
		expect(cli.parseReportingFormat("markdown")).toBe("markdown");
		expect(cli.parseReportingFormat("pdf")).toBe("pdf");
		expect(cli.parseReportingFormat("html")).toBe("html");
		expect(cli.parseReportingFormat("unknown")).toBe("html");
		expect(cli.parseReportingFormat(undefined)).toBe("html");
	});

	it("private parseExportFormat throws on unsupported format", () => {
		const cli = new ReportingCliCommands() as any;

		expect(cli.parseExportFormat("svg")).toBe("svg");
		expect(cli.parseExportFormat("json")).toBe("json");
		expect(() => cli.parseExportFormat("csv")).toThrow(
			"Unsupported export format",
		);
		expect(() => cli.parseExportFormat(undefined)).toThrow(
			"Unsupported export format",
		);
	});

	it("private parseMetricsExportFormat throws on unsupported format", () => {
		const cli = new ReportingCliCommands() as any;

		expect(cli.parseMetricsExportFormat("json")).toBe("json");
		expect(cli.parseMetricsExportFormat("csv")).toBe("csv");
		expect(() => cli.parseMetricsExportFormat("svg")).toThrow(
			"Unsupported metrics export format",
		);
		expect(() => cli.parseMetricsExportFormat(undefined)).toThrow(
			"Unsupported metrics export format",
		);
	});

	it("private toAgentModelTier maps reviewer to strong", () => {
		const cli = new ReportingCliCommands() as any;

		expect(cli.toAgentModelTier("free")).toBe("free");
		expect(cli.toAgentModelTier("cheap")).toBe("cheap");
		expect(cli.toAgentModelTier("strong")).toBe("strong");
		expect(cli.toAgentModelTier("reviewer")).toBe("strong");
	});

	it("runs docs api with include-examples flag", async () => {
		const outputDirectory = makeTempDir("cli-api-ex-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"docs",
			"api",
			"--include-examples",
		]);

		const apiRef = readFileSync(
			join(outputDirectory, "api-reference.md"),
			"utf8",
		);
		expect(apiRef).toContain("## Example commands");
	});

	it("runs analytics recommendations with focus cost", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram();
		await program.parseAsync([
			"node",
			"test",
			"analytics",
			"recommendations",
			"--focus",
			"cost",
		]);
	});

	it("runs report docs architecture with include-code-examples", async () => {
		const outputDirectory = makeTempDir("cli-arch-code-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"docs",
			"architecture",
			"--include-code-examples",
		]);
	});

	it("failCommand logs error and exits process", () => {
		const exitSpy = vi.spyOn(process, "exit").mockImplementation((_code) => {
			throw new Error("process.exit");
		});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const cli = new ReportingCliCommands() as any;
		expect(() => cli.failCommand("test action", new Error("boom"))).toThrow(
			"process.exit",
		);
		expect(exitSpy).toHaveBeenCalledWith(1);
	});

	it("private getSeverityWeight returns 0 for unknown severity", () => {
		const cli = new ReportingCliCommands() as any;

		expect(cli.getSeverityWeight("low")).toBe(1);
		expect(cli.getSeverityWeight("medium")).toBe(2);
		expect(cli.getSeverityWeight("high")).toBe(3);
		expect(cli.getSeverityWeight("critical")).toBe(0);
		expect(cli.getSeverityWeight("unknown")).toBe(0);
	});

	it("private buildSkillDocumentation covers skill-specific metrics branches", () => {
		const cli = new ReportingCliCommands() as any;
		const now = Date.now();
		const baseSnapshot = {
			overview: {
				totalWorkflows: 0,
				activeWorkflows: 0,
				averageExecutionTime: 0,
				successRate: 0.9,
			},
			performanceMetrics: {},
			graphAnalytics: {
				bottlenecks: [],
				routingEfficiency: 0.9,
				topologyRecommendations: [],
			},
			anomalies: [],
		};

		// With latency metrics (covers skillMetrics > 0 true, latencyMetrics > 0 true)
		const metricsWithLatency = [
			{
				entityId: "adapt-aco-router",
				metricName: "skill_latency",
				name: "skill_latency",
				value: 250,
				unit: "ms",
				timestamp: now,
				metadata: {},
			},
			{
				entityId: "adapt-aco-router",
				metricName: "skill_error_count",
				name: "skill_error_count",
				value: 1,
				unit: "count",
				timestamp: now,
				metadata: {},
			},
		];
		const resultWithLatency = cli.buildSkillDocumentation(
			metricsWithLatency,
			baseSnapshot,
		);
		const acoWithLatency = resultWithLatency.find(
			(d: { skillId: string }) => d.skillId === "adapt-aco-router",
		);
		expect(acoWithLatency?.performanceProfile?.averageLatency).toBe(250);

		// Without latency metrics, only non-latency metrics (covers latencyMetrics > 0 false branch)
		const metricsWithoutLatency = [
			{
				entityId: "adapt-aco-router",
				metricName: "skill_calls",
				name: "skill_calls",
				value: 5,
				unit: "count",
				timestamp: now,
				metadata: {},
			},
		];
		const resultWithoutLatency = cli.buildSkillDocumentation(
			metricsWithoutLatency,
			baseSnapshot,
		);
		const acoWithoutLatency = resultWithoutLatency.find(
			(d: { skillId: string }) => d.skillId === "adapt-aco-router",
		);
		expect(
			acoWithoutLatency?.performanceProfile?.averageLatency,
		).toBeGreaterThan(0);
	});

	it("report models with mocked availability covers failover branches", async () => {
		const outputDirectory = makeTempDir("cli-models-failover-");
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		vi.spyOn(modelAvailabilityService, "getAllDeclarations").mockReturnValue({
			"mock-model-unavailable": {
				available: false as const,
				reason: "Not configured",
				modelClass: "strong" as const,
				provider: "anthropic" as const,
			},
			"mock-no-fallback": {
				available: false as const,
				modelClass: "free" as const,
				provider: "openai" as const,
			},
			"mock-model-available": {
				available: true as const,
				modelClass: "free" as const,
				provider: "openai" as const,
			},
		} as ReturnType<typeof modelAvailabilityService.getAllDeclarations>);

		vi.spyOn(modelAvailabilityService, "checkAvailability").mockImplementation(
			(modelId: string) => ({
				available: modelId === "mock-model-available",
				fallbackModel:
					modelId === "mock-model-unavailable"
						? "mock-model-available"
						: undefined,
			}),
		);

		vi.spyOn(
			modelAvailabilityService,
			"getAvailableModelsForClass",
		).mockReturnValue(["mock-model-available"]);

		const program = createProgram(outputDirectory);
		await program.parseAsync([
			"node",
			"test",
			"report",
			"--output",
			outputDirectory,
			"models",
		]);

		// Also run docs api to cover the availableModels.length > 0 branch
		const program2 = createProgram(outputDirectory);
		await program2.parseAsync(["node", "test", "docs", "api"]);
	});

	it("private escapeCsvCell escapes cells with newlines", () => {
		const cli = new ReportingCliCommands() as any;

		expect(cli.escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
	});

	it("analytics trends shows entries when performanceMetrics is non-empty", async () => {
		const snapshot = {
			overview: {
				totalWorkflows: 0,
				activeWorkflows: 0,
				averageExecutionTime: 0,
				successRate: 0,
			},
			performanceMetrics: {
				"test-metric": { trend: 0.5, mean: 100, stddev: 10 },
			},
			graphAnalytics: {
				bottlenecks: [],
				routingEfficiency: 0.9,
				topologyRecommendations: [],
			},
			anomalies: [],
		};
		const mockOrchestrator = {
			getAnalyticsDashboard: () => snapshot,
		} as unknown as UnifiedOrchestrator;

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = new Command();
		new ReportingCliCommands({
			unifiedOrchestrator: mockOrchestrator,
		}).registerCommands(program);
		await program.parseAsync(["node", "test", "analytics", "trends"]);
	});

	it("analytics anomalies and recommendations show entries when snapshot has anomalies", async () => {
		const snapshot = {
			overview: {
				totalWorkflows: 0,
				activeWorkflows: 0,
				averageExecutionTime: 0,
				successRate: 0,
			},
			performanceMetrics: {},
			graphAnalytics: {
				bottlenecks: [],
				routingEfficiency: 0.9,
				topologyRecommendations: [],
			},
			anomalies: [
				{
					timestamp: new Date(),
					type: "high-latency",
					severity: "high" as const,
					description: "Latency spike detected",
				},
			],
		};
		const mockOrchestrator = {
			getAnalyticsDashboard: () => snapshot,
		} as unknown as UnifiedOrchestrator;

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program1 = new Command();
		new ReportingCliCommands({
			unifiedOrchestrator: mockOrchestrator,
		}).registerCommands(program1);
		await program1.parseAsync(["node", "test", "analytics", "anomalies"]);

		const program2 = new Command();
		new ReportingCliCommands({
			unifiedOrchestrator: mockOrchestrator,
		}).registerCommands(program2);
		await program2.parseAsync(["node", "test", "analytics", "recommendations"]);
	});

	it("report performance catch block: failCommand on orchestrator error", async () => {
		const mockOrchestrator = {
			getAnalyticsDashboard: () => {
				throw new Error("orchestrator failure");
			},
		} as unknown as UnifiedOrchestrator;

		const exitSpy = vi.spyOn(process, "exit").mockImplementation((_code) => {
			throw new Error("process.exit called");
		});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const program = new Command();
		new ReportingCliCommands({
			unifiedOrchestrator: mockOrchestrator,
		}).registerCommands(program);

		await expect(
			program.parseAsync(["node", "test", "report", "performance"]),
		).rejects.toThrow();
		expect(exitSpy).toHaveBeenCalledWith(1);
	});
});
