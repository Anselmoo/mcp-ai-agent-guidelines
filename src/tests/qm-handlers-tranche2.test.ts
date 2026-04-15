import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as qmBlochInterpolatorModule } from "../skills/qm/qm-bloch-interpolator.js";
import { skillModule as qmDiracNotationMapperModule } from "../skills/qm/qm-dirac-notation-mapper.js";
import { skillModule as qmDoubleSlitInterferenceModule } from "../skills/qm/qm-double-slit-interference.js";
import { skillModule as qmEntanglementMapperModule } from "../skills/qm/qm-entanglement-mapper.js";
import { skillModule as qmHamiltonianDescentModule } from "../skills/qm/qm-hamiltonian-descent.js";
import { skillModule as qmHeisenbergPictureModule } from "../skills/qm/qm-heisenberg-picture.js";
import { skillModule as qmPathIntegralHistorianModule } from "../skills/qm/qm-path-integral-historian.js";
import { skillModule as qmPhaseKickbackReviewerModule } from "../skills/qm/qm-phase-kickback-reviewer.js";
import { skillModule as qmSchrodingerPictureModule } from "../skills/qm/qm-schrodinger-picture.js";
import { skillModule as qmWavefunctionCoverageModule } from "../skills/qm/qm-wavefunction-coverage.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

function createRuntime() {
	return {
		sessionId: "test-qm-handlers-tranche2",
		executionState: {
			instructionStack: [],
			progressRecords: [],
		},
		sessionStore: {
			async readSessionHistory() {
				return [];
			},
			async writeSessionHistory() {
				return;
			},
			async appendSessionHistory() {
				return;
			},
		},
		instructionRegistry: new InstructionRegistry(),
		skillRegistry: new SkillRegistry({ workspace: null }),
		modelRouter: new ModelRouter(),
		workflowEngine: new WorkflowEngine(),
	};
}

describe("qm-bloch-interpolator handler", () => {
	it("returns capability output with Bloch-specific advisory guidance", async () => {
		const result = await qmBlochInterpolatorModule.run(
			{
				request:
					"Show the intermediate states between OOP and functional style",
				options: {
					styleAName: "OOP",
					styleBName: "Functional",
					stateA: [0, 0, 1],
					stateB: [0, 0, -1],
				},
			},
			createRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("qm-bloch-interpolator");
		const details = result.recommendations.map((item) => item.detail).join(" ");
		expect(details).toMatch(/Bloch|mixed|purity|supplementary lens/i);
	});

	it("guards when no style-transition signal is provided", async () => {
		const result = await qmBlochInterpolatorModule.run(
			{ request: "help me" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]?.detail ?? "").toMatch(
			/specific|context|styles/i,
		);
	});
});

describe("qm-dirac-notation-mapper handler", () => {
	it("returns overlap and centrality guidance in capability mode", async () => {
		const result = await qmDiracNotationMapperModule.run(
			{
				request:
					"Which files are most central in this package based on overlap?",
				options: { pairOverlap: 0.87, projectionWeight: 2.4, fileCount: 8 },
			},
			createRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("qm-dirac-notation-mapper");
		const details = result.recommendations.map((item) => item.detail).join(" ");
		expect(details).toMatch(/central|overlap|projection|supplementary lens/i);
	});

	it("guards when no overlap or file-centrality signal exists", async () => {
		const result = await qmDiracNotationMapperModule.run(
			{ request: "What should I review next?" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/requires|needs|signal/i);
	});
});

describe("qm-double-slit-interference handler", () => {
	it("classifies two-approach compatibility with advisory framing", async () => {
		const result = await qmDoubleSlitInterferenceModule.run(
			{
				request:
					"Do these two implementations complement each other or conflict?",
				options: {
					cosineSimilarity: 0.9,
					intensityA: 0.8,
					intensityB: 0.7,
				},
			},
			createRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((item) => item.detail).join(" ");
		expect(details).toMatch(/constructive|interference|supplementary lens/i);
	});

	it("guards when the request lacks a two-approach comparison signal", async () => {
		const result = await qmDoubleSlitInterferenceModule.run(
			{ request: "Please improve this architecture" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/requires|needs/i);
	});
});

describe("qm-entanglement-mapper handler", () => {
	it("surfaces hidden co-change coupling with entropy framing", async () => {
		const result = await qmEntanglementMapperModule.run(
			{
				request: "Which files always change together in commit history?",
				options: {
					fileAProbability: 0.5,
					fileBProbability: 0.45,
					coChangeProbability: 0.4,
				},
			},
			createRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((item) => item.detail).join(" ");
		expect(details).toMatch(/entang|co-change|supplementary lens/i);
	});

	it("rejects inconsistent co-change probabilities gracefully", async () => {
		const result = await qmEntanglementMapperModule.run(
			{
				request: "Find entangled file pairs",
				options: {
					fileAProbability: 0.2,
					fileBProbability: 0.3,
					coChangeProbability: 0.4,
				},
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/inconsistent/i);
	});
});

describe("qm-hamiltonian-descent handler", () => {
	it("ranks modules using quality-energy framing", async () => {
		const result = await qmHamiltonianDescentModule.run(
			{
				request: "What should I fix first across these modules?",
				options: {
					modules: [
						{
							name: "auth",
							complexity: 0.9,
							coupling: 0.8,
							coverage: 0.2,
							churn: 0.7,
						},
						{
							name: "profile",
							complexity: 0.3,
							coupling: 0.2,
							coverage: 0.8,
							churn: 0.2,
						},
					],
				},
			},
			createRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((item) => item.detail).join(" ");
		expect(details).toMatch(/ground state|energy|supplementary lens/i);
	});

	it("guards when no module-priority signal exists", async () => {
		const result = await qmHamiltonianDescentModule.run(
			{ request: "Tell me about architecture" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/requires|needs/i);
	});
});

describe("qm-heisenberg-picture handler", () => {
	it("reports metric drift and conflicting pairs", async () => {
		const result = await qmHeisenbergPictureModule.run(
			{
				request:
					"How are our metrics changing over time and which ones conflict?",
				options: {
					snapshots: [
						{ complexity: 0.3, coverage: 0.8, coupling: 0.2 },
						{ complexity: 0.5, coverage: 0.7, coupling: 0.4 },
						{ complexity: 0.7, coverage: 0.6, coupling: 0.6 },
					],
				},
			},
			createRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((item) => item.detail).join(" ");
		expect(details).toMatch(/drift|conflicting|supplementary lens/i);
	});

	it("guards when no time-series metric signal exists", async () => {
		const result = await qmHeisenbergPictureModule.run(
			{ request: "make our metrics better" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/requires|needs/i);
	});
});

describe("qm-path-integral-historian handler", () => {
	it("identifies commit-trajectory inflection guidance", async () => {
		const result = await qmPathIntegralHistorianModule.run(
			{
				request: "Find the inflection commit in this history",
				options: { actions: [0.1, 0.12, 0.8, 0.14], temperature: 0.4 },
			},
			createRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((item) => item.detail).join(" ");
		expect(details).toMatch(/inflection|commit|supplementary lens/i);
	});

	it("guards when no history signal exists", async () => {
		const result = await qmPathIntegralHistorianModule.run(
			{ request: "what changed?" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/requires|needs/i);
	});
});

describe("qm-phase-kickback-reviewer handler", () => {
	it("ranks dominant architectural carriers with advisory framing", async () => {
		const result = await qmPhaseKickbackReviewerModule.run(
			{
				request: "Which file has the strongest architectural signal?",
				options: {
					files: [
						{ name: "router.ts", tokenCount: 40, phase: 0.42 },
						{ name: "utils.ts", tokenCount: 30, phase: 0.08 },
					],
				},
			},
			createRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((item) => item.detail).join(" ");
		expect(details).toMatch(/dominant|probe|supplementary lens/i);
	});

	it("guards when no architecture-phase signal exists", async () => {
		const result = await qmPhaseKickbackReviewerModule.run(
			{ request: "review these utilities" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/requires|needs/i);
	});
});

describe("qm-schrodinger-picture handler", () => {
	it("forecasts future drift from historical snapshots", async () => {
		const result = await qmSchrodingerPictureModule.run(
			{
				request: "Predict the future code state from recent snapshots",
				options: {
					snapshots: [
						{ label: "v1", state: [0.2, 0.1, 0.3] },
						{ label: "v2", state: [0.3, 0.2, 0.4] },
						{ label: "v3", state: [0.5, 0.3, 0.6] },
					],
					steps: 2,
				},
			},
			createRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((item) => item.detail).join(" ");
		expect(details).toMatch(/forecast|drift|supplementary lens/i);
	});

	it("rejects incompatible snapshot dimensions gracefully", async () => {
		const result = await qmSchrodingerPictureModule.run(
			{
				request: "Forecast architectural drift",
				options: {
					snapshots: [
						{ label: "v1", state: [0.2, 0.1] },
						{ label: "v2", state: [0.3, 0.2, 0.4] },
					],
				},
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/incompatible snapshot dimensions/i);
	});
});

describe("qm-wavefunction-coverage handler", () => {
	it("prioritises uncovered high-risk bug patterns", async () => {
		const result = await qmWavefunctionCoverageModule.run(
			{
				request: "Which bugs are least covered by our tests?",
				options: {
					tests: [
						{ name: "null test", vector: [1, 0, 0] },
						{ name: "retry test", vector: [0, 1, 0] },
					],
					bugs: [
						{ name: "null-deref", risk: 0.9, vector: [0.9, 0.1, 0] },
						{ name: "timeout", risk: 0.4, vector: [0, 0.2, 0.8] },
					],
				},
			},
			createRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((item) => item.detail).join(" ");
		expect(details).toMatch(/coverage|weighted risk|supplementary lens/i);
	});

	it("rejects incompatible coverage vectors gracefully", async () => {
		const result = await qmWavefunctionCoverageModule.run(
			{
				request: "Check bug coverage",
				options: {
					tests: [{ name: "a", vector: [1, 0] }],
					bugs: [{ name: "b", risk: 0.5, vector: [1, 0, 0] }],
				},
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/incompatible vector dimensions/i);
	});
});
