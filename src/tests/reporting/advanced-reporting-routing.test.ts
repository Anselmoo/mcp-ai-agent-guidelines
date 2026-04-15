import { describe, expect, it } from "vitest";
import {
	calculateAvailabilityScore,
	calculateModelUtilization,
	generateDashboardRecommendations,
	generateRoutingRecommendations,
	type ModelRoutingData,
} from "../../reporting/advanced-reporting-routing.js";

function createRoutingData(
	overrides: Partial<ModelRoutingData> = {},
): ModelRoutingData {
	return {
		availableModels: ["model-a", "model-b", "model-c"],
		routingDecisions: [
			{ model: "model-a", reason: "fast", timestamp: new Date() },
			{ model: "model-a", reason: "fast", timestamp: new Date() },
			{ model: "model-b", reason: "fallback", timestamp: new Date() },
		],
		failoverEvents: [],
		...overrides,
	};
}

describe("reporting/advanced-reporting-routing", () => {
	it("calculates model utilization percentages", () => {
		const utilization = calculateModelUtilization(
			createRoutingData().routingDecisions,
		);

		expect(utilization["model-a"]).toBeCloseTo(66.67, 1);
		expect(utilization["model-b"]).toBeCloseTo(33.33, 1);
	});

	it("generates routing recommendations for failovers and underutilization", () => {
		const recommendations = generateRoutingRecommendations(
			createRoutingData({
				failoverEvents: [
					{
						from: "model-a",
						to: "model-b",
						reason: "error",
						timestamp: new Date(),
					},
				],
			}),
		);

		expect(recommendations).toEqual(
			expect.arrayContaining([expect.stringContaining("High failover rate")]),
		);
	});

	it("calculates availability and dashboard recommendations", () => {
		expect(
			calculateAvailabilityScore(
				createRoutingData({
					failoverEvents: [
						{
							from: "model-a",
							to: "model-b",
							reason: "error",
							timestamp: new Date(),
						},
					],
				}),
			),
		).toBeCloseTo(2 / 3);

		const dashboardRecommendations = generateDashboardRecommendations({
			overview: { successRate: 0.9 },
			graphAnalytics: {
				bottlenecks: [{ node: "planner", score: 0.8, type: "agent" }],
			},
			anomalies: new Array(6).fill({}),
		});

		expect(dashboardRecommendations).toEqual(
			expect.arrayContaining([
				expect.stringContaining("Success rate below 95%"),
				expect.stringContaining("1 bottlenecks"),
				expect.stringContaining("Multiple anomalies"),
			]),
		);
	});

	it("handles empty routing inputs and healthy dashboards without recommendations", () => {
		expect(calculateModelUtilization([])).toEqual({});
		expect(
			calculateAvailabilityScore(
				createRoutingData({
					routingDecisions: [],
					failoverEvents: [],
				}),
			),
		).toBe(1);
		expect(
			generateRoutingRecommendations(
				createRoutingData({
					routingDecisions: [],
					failoverEvents: [],
				}),
			),
		).toEqual([]);
		expect(
			generateDashboardRecommendations({
				overview: { successRate: 0.98 },
				graphAnalytics: { bottlenecks: [] },
				anomalies: [],
			}),
		).toEqual([]);
	});

	it("flags underutilized models when one lane receives less than ten percent of traffic", () => {
		const recommendations = generateRoutingRecommendations(
			createRoutingData({
				routingDecisions: [
					...new Array(10).fill(null).map(() => ({
						model: "model-a",
						reason: "primary",
						timestamp: new Date(),
					})),
					{ model: "model-b", reason: "backup", timestamp: new Date() },
				],
				failoverEvents: [],
			}),
		);

		expect(recommendations).toEqual(
			expect.arrayContaining([
				expect.stringContaining("Underutilized models: model-b"),
			]),
		);
	});
});
