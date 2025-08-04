// Generate demo reports into demos/*.md using built tools
// Requires: npm run build

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codeHygieneAnalyzer } from "../dist/tools/code-hygiene-analyzer.js";
import { guidelinesValidator } from "../dist/tools/guidelines-validator.js";
import { hierarchicalPromptBuilder } from "../dist/tools/hierarchical-prompt-builder.js";
import { memoryContextOptimizer } from "../dist/tools/memory-context-optimizer.js";
import { mermaidDiagramGenerator } from "../dist/tools/mermaid-diagram-generator.js";
import { modelCompatibilityChecker } from "../dist/tools/model-compatibility-checker.js";
import { sprintTimelineCalculator } from "../dist/tools/sprint-timeline-calculator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getText(output) {
	const item = output?.content?.[0];
	return typeof item?.text === "string" ? item.text : String(item || "");
}

async function writeReport(filename, text) {
	const outPath = path.resolve(__dirname, filename);
	await fs.writeFile(outPath, text, "utf8");
	console.log("Wrote", path.relative(process.cwd(), outPath));
}

async function main() {
	const demoPyPath = path.resolve(__dirname, "./demo-code-analysis.py");
	const demoPy = await fs.readFile(demoPyPath, "utf8");

	const hierarchical = await hierarchicalPromptBuilder({
		context: "Refactor a small Python script for clarity and safety",
		goal: "Produce a step-by-step refactor plan and a checklist",
		requirements: [
			"Keep behavior the same",
			"Reduce complexity",
			"Add docstrings and type hints",
		],
		outputFormat: "1. Summary\n2. Steps\n3. Checklist",
		audience: "Senior engineer",
		inputFile: demoPyPath,
	});
	await writeReport(
		"demo-code-analysis.hierarchical.prompt.md",
		getText(hierarchical),
	);

	const hygiene = await codeHygieneAnalyzer({
		codeContent: demoPy,
		language: "python",
		framework: "none",
		inputFile: demoPyPath,
	});
	await writeReport("demo-code-analysis.hygiene.md", getText(hygiene));

	const diagram = await mermaidDiagramGenerator({
		description:
			"User submits data -> Validate -> Process -> Save -> Return summary",
		diagramType: "flowchart",
	});
	await writeReport("demo-code-analysis.diagram.md", getText(diagram));

	const memory = await memoryContextOptimizer({
		contextContent:
			"Python repo. Fix security issues; add validation and logging. Key: calculate_discount, process_user_data.",
		cacheStrategy: "balanced",
		language: "markdown",
	});
	await writeReport("demo-code-analysis.memory.md", getText(memory));

	const modelCompat = await modelCompatibilityChecker({
		taskDescription: "Code refactoring and analysis with long files",
		requirements: ["large context", "analysis", "structured output"],
		budget: "medium",
		language: "typescript",
	});
	await writeReport("demo-code-analysis.model-compat.md", getText(modelCompat));

	const guidelines = await guidelinesValidator({
		practiceDescription:
			"We use hierarchical prompts, prompt caching, and diagramming",
		category: "workflow",
		inputFile: demoPyPath,
	});
	await writeReport("demo-code-analysis.guidelines.md", getText(guidelines));

	const sprint = await sprintTimelineCalculator({
		tasks: [
			{ name: "Refactor functions", estimate: 5, priority: "high" },
			{ name: "Add tests", estimate: 8, priority: "high" },
			{ name: "Improve logging", estimate: 3, priority: "medium" },
			{ name: "Docs", estimate: 2, priority: "low" },
		],
		teamSize: 3,
		sprintLength: 14,
	});
	await writeReport("demo-code-analysis.sprint.md", getText(sprint));
}

main().catch((err) => {
	console.error("Generation failed:", err);
	process.exitCode = 1;
});
