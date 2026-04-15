/**
 * Graph analysis utilities built on `graphology-traversal` and `graphology-dag`.
 *
 * Provides topological ordering, BFS/DFS traversal, cycle detection, and
 * topological generation grouping for skill dependency graphs.
 */

import { DirectedGraph } from "graphology";
import {
	hasCycle,
	topologicalGenerations,
	topologicalSort,
	willCreateCycle,
} from "graphology-dag";
import { bfsFromNode, dfsFromNode } from "graphology-traversal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single node in a traversal path */
export interface TraversalNode {
	id: string;
	depth: number;
}

/** Result of a full graph analysis */
export interface GraphAnalysisResult {
	/** True when the graph contains at least one directed cycle */
	hasCycles: boolean;
	/** Topologically sorted node IDs (empty if the graph has cycles) */
	topologicalOrder: string[];
	/** Groups of nodes at the same topological depth (empty if cyclic) */
	generations: string[][];
	/** Nodes with no incoming edges */
	sources: string[];
	/** Nodes with no outgoing edges */
	sinks: string[];
}

// ---------------------------------------------------------------------------
// Traversal helpers
// ---------------------------------------------------------------------------

/**
 * Collect all nodes reachable from `startNode` using BFS.
 *
 * Returns an array of `{ id, depth }` objects in visit order.
 */
export function bfsTraversal(
	graph: DirectedGraph,
	startNode: string,
): TraversalNode[] {
	const visited: TraversalNode[] = [];
	bfsFromNode(graph, startNode, (node, _attr, depth) => {
		visited.push({ id: node, depth });
	});
	return visited;
}

/**
 * Collect all nodes reachable from `startNode` using DFS.
 *
 * Returns an array of `{ id, depth }` objects in visit order.
 */
export function dfsTraversal(
	graph: DirectedGraph,
	startNode: string,
): TraversalNode[] {
	const visited: TraversalNode[] = [];
	dfsFromNode(graph, startNode, (node, _attr, depth) => {
		visited.push({ id: node, depth });
	});
	return visited;
}

// ---------------------------------------------------------------------------
// DAG analysis
// ---------------------------------------------------------------------------

/**
 * Check whether adding an edge from `source` to `target` would create a cycle.
 */
export function wouldCreateCycle(
	graph: DirectedGraph,
	source: string,
	target: string,
): boolean {
	return willCreateCycle(graph, source, target);
}

/**
 * Perform a comprehensive analysis of a directed graph using `graphology-dag`.
 *
 * Note: `topologicalSort` and `topologicalGenerations` require an acyclic graph.
 * When `hasCycle(graph)` is true, those fields are returned as empty arrays.
 */
export function analyzeGraph(graph: DirectedGraph): GraphAnalysisResult {
	const cyclic = hasCycle(graph);

	let topologicalOrder: string[] = [];
	let generations: string[][] = [];

	if (!cyclic) {
		topologicalOrder = topologicalSort(graph);
		generations = topologicalGenerations(graph);
	}

	const sources = graph.filterNodes(
		(node: string) => graph.inDegree(node) === 0,
	);
	const sinks = graph.filterNodes(
		(node: string) => graph.outDegree(node) === 0,
	);

	return {
		hasCycles: cyclic,
		topologicalOrder,
		generations,
		sources,
		sinks,
	};
}

// ---------------------------------------------------------------------------
// Builder helpers
// ---------------------------------------------------------------------------

/**
 * Build a `DirectedGraph` from a list of node IDs and directed edges.
 *
 * Adding a duplicate edge is silently skipped to avoid graphology errors.
 */
export function buildDirectedGraph(
	nodes: string[],
	edges: Array<{ from: string; to: string }>,
): DirectedGraph {
	const g = new DirectedGraph();
	for (const node of nodes) {
		if (!g.hasNode(node)) g.addNode(node);
	}
	for (const { from, to } of edges) {
		if (g.hasNode(from) && g.hasNode(to) && !g.hasDirectedEdge(from, to)) {
			g.addDirectedEdge(from, to);
		}
	}
	return g;
}
