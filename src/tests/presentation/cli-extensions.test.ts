import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportingCliCommands } from "../../presentation/cli-extensions.js";

describe("presentation/cli-extensions", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

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
		const outputDirectory = mkdtempSync(join(tmpdir(), "cli-docs-"));
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
		const outputDirectory = mkdtempSync(join(tmpdir(), "cli-report-"));
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
});
