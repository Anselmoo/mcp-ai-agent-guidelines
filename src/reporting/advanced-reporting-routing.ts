import type { GraphAnalysis } from "../contracts/graph-types.js";

export interface RoutingDecisionRecord {
	model: string;
	reason: string;
	timestamp: Date;
}

export interface ModelRoutingData {
	availableModels: string[];
	routingDecisions: RoutingDecisionRecord[];
	failoverEvents: Array<{
		from: string;
		to: string;
		timestamp: Date;
		reason: string;
	}>;
}

export interface DashboardRecommendationInput {
	overview: {
		successRate: number;
	};
	graphAnalytics: {
		bottlenecks: GraphAnalysis["bottlenecks"];
	};
	anomalies: unknown[];
}

export function calculateModelUtilization(
	routingDecisions: RoutingDecisionRecord[],
): Record<string, number> {
	const utilization: Record<string, number> = {};

	for (const decision of routingDecisions) {
		utilization[decision.model] = (utilization[decision.model] || 0) + 1;
	}

	const total = routingDecisions.length;
	if (total === 0) {
		return utilization;
	}

	for (const model of Object.keys(utilization)) {
		utilization[model] = (utilization[model] / total) * 100;
	}

	return utilization;
}

export function calculateAvailabilityScore(
	routingData: ModelRoutingData,
): number {
	const totalRequests = routingData.routingDecisions.length;
	const failedRequests = routingData.failoverEvents.length;

	return totalRequests > 0
		? (totalRequests - failedRequests) / totalRequests
		: 1.0;
}

export function generateRoutingRecommendations(
	routingData: ModelRoutingData,
): string[] {
	const recommendations: string[] = [];

	const failoverRate =
		routingData.routingDecisions.length > 0
			? routingData.failoverEvents.length / routingData.routingDecisions.length
			: 0;
	if (failoverRate > 0.1) {
		recommendations.push(
			"High failover rate detected - consider reviewing model health checks",
		);
	}

	const utilization = calculateModelUtilization(routingData.routingDecisions);
	const underutilizedModels = Object.entries(utilization).filter(
		([_, usage]) => usage < 10,
	);

	if (underutilizedModels.length > 0) {
		recommendations.push(
			`Underutilized models: ${underutilizedModels.map(([model]) => model).join(", ")}`,
		);
	}

	return recommendations;
}

export function generateDashboardRecommendations(
	dashboardData: DashboardRecommendationInput,
): string[] {
	const recommendations: string[] = [];

	if (dashboardData.overview.successRate < 0.95) {
		recommendations.push("Success rate below 95% - investigate error patterns");
	}

	if (dashboardData.graphAnalytics.bottlenecks.length > 0) {
		recommendations.push(
			`${dashboardData.graphAnalytics.bottlenecks.length} bottlenecks detected - consider load balancing`,
		);
	}

	if (dashboardData.anomalies.length > 5) {
		recommendations.push(
			"Multiple anomalies detected - schedule system health review",
		);
	}

	return recommendations;
}
