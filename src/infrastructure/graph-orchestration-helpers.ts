import type {
	AgentTopologyAnalysis,
	GraphAnalysis,
	GraphBottleneck,
	RouteEdge,
	SkillDependencyAnalysis,
} from "../contracts/graph-types.js";

export function analyzeGraphState(
	agents: Map<string, unknown>,
	skills: Map<string, unknown>,
	routes: Map<string, Map<string, RouteEdge>>,
	dependencies: Map<string, string[]>,
): GraphAnalysis {
	const agentTopology: AgentTopologyAnalysis = {
		componentCount: 1,
		centralityScores: {},
		nodeCount: agents.size,
		edgeCount: Array.from(routes.values()).reduce(
			(sum, targetRoutes) => sum + targetRoutes.size,
			0,
		),
	};

	const skillDependencies: SkillDependencyAnalysis = {
		componentCount: 1,
		hasCycles: detectCyclesInDependencies(dependencies, skills.keys()),
		cycles: [],
		nodeCount: skills.size,
		edgeCount: Array.from(dependencies.values()).reduce(
			(sum, dependencyList) => sum + dependencyList.length,
			0,
		),
	};

	const bottlenecks = identifyBottlenecks(routes, agents.size);

	return {
		agentTopology,
		skillDependencies,
		bottlenecks,
		recommendations: generateOptimizationRecommendations(
			agentTopology,
			skillDependencies,
			bottlenecks,
		),
	};
}

export function updatePheromoneTrails(
	routes: Map<string, Map<string, RouteEdge>>,
	successfulPaths: Array<{ path: string[]; performance: number }>,
): void {
	for (const { path, performance } of successfulPaths) {
		for (let index = 0; index < path.length - 1; index++) {
			const source = path[index];
			const target = path[index + 1];
			const sourceRoutes = routes.get(source);
			if (sourceRoutes?.has(target)) {
				const edge = sourceRoutes.get(target)!;
				edge.weight = Math.min(edge.weight + performance * 0.1, 2.0);
			}
		}
	}

	for (const targetRoutes of routes.values()) {
		for (const edge of targetRoutes.values()) {
			edge.weight = Math.max(edge.weight * 0.95, 0.1);
		}
	}
}

export function pruneUnderutilizedPaths(
	routes: Map<string, Map<string, RouteEdge>>,
	usageThreshold: number = 0.1,
): void {
	for (const targetRoutes of routes.values()) {
		const routesToRemove: string[] = [];

		for (const [targetId, edge] of targetRoutes) {
			if ((edge.performance.successRate || 0) < usageThreshold) {
				routesToRemove.push(targetId);
			}
		}

		for (const targetId of routesToRemove) {
			targetRoutes.delete(targetId);
		}
	}
}

export function reinforceCoactivatedPairs(
	routes: Map<string, Map<string, RouteEdge>>,
	activationHistory: Array<{ agents: string[]; success: boolean }>,
): void {
	for (const { agents, success } of activationHistory) {
		if (!success || agents.length < 2) {
			continue;
		}

		for (let leftIndex = 0; leftIndex < agents.length; leftIndex++) {
			for (
				let rightIndex = leftIndex + 1;
				rightIndex < agents.length;
				rightIndex++
			) {
				const leftAgent = agents[leftIndex];
				const rightAgent = agents[rightIndex];
				const leftRoutes = routes.get(leftAgent);
				const rightRoutes = routes.get(rightAgent);

				if (leftRoutes?.has(rightAgent)) {
					const edge = leftRoutes.get(rightAgent)!;
					edge.weight = Math.min(edge.weight + 0.05, 2.0);
				}

				if (rightRoutes?.has(leftAgent)) {
					const edge = rightRoutes.get(leftAgent)!;
					edge.weight = Math.min(edge.weight + 0.05, 2.0);
				}
			}
		}
	}
}

export function detectCyclesInDependencies(
	dependencies: Map<string, string[]>,
	skillIds: Iterable<string>,
): boolean {
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	const dfs = (node: string): boolean => {
		visited.add(node);
		recursionStack.add(node);

		for (const neighbor of dependencies.get(node) || []) {
			if (!visited.has(neighbor)) {
				if (dfs(neighbor)) {
					return true;
				}
			} else if (recursionStack.has(neighbor)) {
				return true;
			}
		}

		recursionStack.delete(node);
		return false;
	};

	for (const node of skillIds) {
		if (!visited.has(node) && dfs(node)) {
			return true;
		}
	}

	return false;
}

export function identifyBottlenecks(
	routes: Map<string, Map<string, RouteEdge>>,
	agentCount: number,
): GraphBottleneck[] {
	const bottlenecks: GraphBottleneck[] = [];

	for (const [agentId, targetRoutes] of routes) {
		const routeCount = targetRoutes.size;
		if (routeCount > agentCount * 0.8) {
			bottlenecks.push({ node: agentId, score: 0.8, type: "agent" });
		}
	}

	return bottlenecks;
}

export function generateOptimizationRecommendations(
	agentAnalysis: AgentTopologyAnalysis,
	skillAnalysis: SkillDependencyAnalysis,
	bottlenecks: GraphBottleneck[],
): string[] {
	const recommendations: string[] = [];

	if (bottlenecks.length > 0) {
		recommendations.push(
			`Found ${bottlenecks.length} potential bottlenecks - consider load balancing or agent replication`,
		);
	}

	if (skillAnalysis.hasCycles) {
		recommendations.push(
			"Detected dependency cycles - refactor to break circular dependencies",
		);
	}

	if (agentAnalysis.nodeCount < 2) {
		recommendations.push(
			`Only ${agentAnalysis.nodeCount} agent(s) - consider adding more agents for better distribution`,
		);
	}

	return recommendations;
}
