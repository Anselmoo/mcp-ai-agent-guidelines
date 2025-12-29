import { describe, expect, it } from "vitest";
import { roadmapGenerator } from "../../../src/tools/design/roadmap-generator.ts";
import type { DesignSessionState } from "../../../src/tools/design/types.ts";

const baseSession = (): any => ({
	config: {
		sessionId: "branch-test-session",
		context: "Branch coverage test",
		goal: "Validate roadmap branches",
		requirements: [],
		constraints: [],
		coverageThreshold: 80,
		enablePivots: false,
		templateRefs: [],
		outputFormats: ["markdown"],
		metadata: {},
		methodologySignals: {
			projectType: "interactive-feature",
			problemFraming: "user-research",
			riskLevel: "medium",
			timelinePressure: "normal",
			stakeholderMode: "business",
		},
	},
	currentPhase: "planning",
	phases: {
		planning: {
			id: "planning",
			name: "Planning",
			description: "Planning",
			status: "completed",
			inputs: [],
			outputs: ["spec"],
			criteria: ["approved"],
			coverage: 90,
			artifacts: [],
			dependencies: [],
		},
		development: {
			id: "development",
			name: "Development",
			description: "Development",
			status: "active",
			inputs: [],
			outputs: ["code", "tests", "api"],
			criteria: ["feature-complete"],
			coverage: 75,
			artifacts: [],
			dependencies: ["planning"],
		},
	},
	coverage: {
		overall: 78,
		phases: { planning: 90, development: 75 },
		constraints: {},
		assumptions: {},
		documentation: {},
		testCoverage: 78,
	},
	history: [],
	artifacts: [],
	status: "active",
	methodologySelection: undefined,
	methodologyProfile: undefined,
});

describe("roadmap-generator - focused branch tests", () => {
	it("mermaid output marks high-risk milestones with 'crit,'", async () => {
		const s = baseSession();
		// Make development phase risky (low coverage + constraint mandatory)
		s.phases.development.coverage = 40;
		s.config.constraints.push({
			id: "tech-1",
			name: "Tech",
			type: "technical",
			category: "tech",
			description: "must do",
			validation: {},
			weight: 1,
			mandatory: true,
			source: "spec",
		});

		const result = await roadmapGenerator.generateRoadmap({
			sessionState: s,
			timeframe: "6 months",
			format: "mermaid",
			granularity: "medium",
		});

		expect(result.content).toContain("gantt");
		// at least one milestone should have crit, for high risk
		expect(result.content).toMatch(/crit,\s*milestone-\d+/);
	});

	it("includes external dependency when requirements mention third-party or external", async () => {
		const s = baseSession();
		s.config.requirements.push("Integrate with third-party payment provider");

		const result = await roadmapGenerator.generateRoadmap({
			sessionState: s,
			format: "json",
			includeDependencies: true,
		});

		const parsed = JSON.parse(result.content) as {
			dependencies: Array<{ id: string }>;
			roadmap?: unknown;
		};
		expect(parsed.roadmap).toBeDefined();
		expect(parsed.dependencies.some((d) => d.id === "external-services")).toBe(
			true,
		);
	});

	it("recommends resolving critical dependencies when database requirement present", async () => {
		const s = baseSession();
		s.config.requirements.push("Requires database setup for data storage");

		const result = await roadmapGenerator.generateRoadmap({
			sessionState: s,
			format: "markdown",
			includeDependencies: true,
		});

		expect(
			(result.recommendations as string[]).some((r: string) =>
				r.includes("Resolve critical dependencies"),
			),
		).toBe(true);
	});

	it("handles '8 weeks' timeframe without errors and returns milestones", async () => {
		const s = baseSession();

		const result = await roadmapGenerator.generateRoadmap({
			sessionState: s,
			timeframe: "8 weeks",
			format: "markdown",
		});

		expect(result.milestones.length).toBeGreaterThan(0);
	});

	it("toggles resources section based on includeResources flag", async () => {
		const s = baseSession();

		const withResources = await roadmapGenerator.generateRoadmap({
			sessionState: s,
			format: "markdown",
			includeResources: true,
		});

		expect(withResources.content).toContain("## Resource Requirements");

		const withoutResources = await roadmapGenerator.generateRoadmap({
			sessionState: s,
			format: "markdown",
			includeResources: false,
		});

		expect(withoutResources.content).not.toContain("## Resource Requirements");
	});
});
