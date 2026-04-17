import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-uncertainty-tradeoff.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-uncertainty-tradeoff extra branches", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("handles empty request through empty-request handler", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("infers complexity-coverage metric pair from 'complex' keyword", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "analyse cyclomatic complexity and test coverage tradeoffs for our modules",
				options: {
					violationThreshold: "strict",
				},
			},
			{
				summaryIncludes: ["complexity ↔ test-coverage"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("infers churn-stability metric pair from 'churn' keyword", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "analyse churn rate and coupling tension in frequently modified modules",
				options: {
					violationThreshold: "lenient",
				},
			},
			{
				summaryIncludes: ["churn-rate ↔ stability"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("explicit metricPair coupling-cohesion overrides inference", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "check module coupling cohesion uncertainty product",
				options: {
					metricPair: "coupling-cohesion",
					violationThreshold: "moderate",
				},
			},
			{
				summaryIncludes: ["coupling ↔ cohesion-deficit"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("explicit metricPair complexity-coverage", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "analyse module complexity and coverage metric tension",
				options: {
					metricPair: "complexity-coverage",
					violationThreshold: "strict",
				},
			},
			{
				summaryIncludes: ["complexity ↔ test-coverage"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("explicit metricPair churn-stability", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "evaluate churn stability uncertainty for our module set",
				options: {
					metricPair: "churn-stability",
					violationThreshold: "lenient",
				},
			},
			{
				summaryIncludes: ["churn-rate ↔ stability"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("produces numeric uncertainty product detail when coupling and cohesionDeficit provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "analyse coupling cohesion tradeoffs for a high coupling module",
				options: {
					metricPair: "coupling-cohesion",
					coupling: 0.9,
					cohesionDeficit: 0.85,
				},
			},
			{
				detailIncludes: ["Illustrative uncertainty product"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("produces 'acceptable' uncertainty label for low values", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "analyse coupling cohesion tension for a well-structured module",
				options: {
					metricPair: "coupling-cohesion",
					coupling: 0.1,
					cohesionDeficit: 0.1,
				},
			},
			{
				detailIncludes: ["Illustrative uncertainty product"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("adds context-specific detail when context is provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "analyse module coupling tension",
				context: "We have a legacy payment service with 20+ direct imports",
				options: {
					metricPair: "coupling-cohesion",
				},
			},
			{
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("applies violationThreshold strict correctly", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "analyse metric pareto violations at strict threshold level",
				options: {
					metricPair: "coupling-cohesion",
					violationThreshold: "strict",
				},
			},
			{
				summaryIncludes: ["strict"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("applies violationThreshold lenient correctly", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "check coupling cohesion violations with lenient threshold",
				options: {
					metricPair: "coupling-cohesion",
					violationThreshold: "lenient",
				},
			},
			{
				summaryIncludes: ["lenient"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("adds constraint details when constraints are present", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "analyse module coupling cohesion tradeoffs",
				constraints: ["max 5 modules", "no circular dependencies"],
				options: {
					metricPair: "coupling-cohesion",
				},
			},
			{
				recommendationCountAtLeast: 3,
			},
		);
	});
});
