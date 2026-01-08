/**
 * Test fixtures for domain results
 *
 * Factory functions to create test instances of domain result types
 * for use in integration tests and strategy testing.
 *
 * @module tests/fixtures/domain-results
 */

import type { ScoringResult } from "../../src/domain/analysis/types.js";
import type { SessionState } from "../../src/domain/design/types.js";
import type { PromptResult } from "../../src/domain/prompting/types.js";

/**
 * Create a test PromptResult with sensible defaults.
 *
 * @returns A PromptResult suitable for testing
 */
export function createTestPromptResult(): PromptResult {
	return {
		sections: [
			{
				title: "Context",
				body: "Test context for integration testing",
				level: 1,
			},
			{
				title: "Goal",
				body: "Test goal for strategy validation",
				level: 1,
			},
			{
				title: "Requirements",
				body: "1. Requirement one\n2. Requirement two\n3. Requirement three",
				level: 2,
			},
		],
		metadata: {
			complexity: 50,
			tokenEstimate: 200,
			sections: 3,
			techniques: ["zero-shot", "chain-of-thought"],
			requirementsCount: 3,
			issuesCount: 0,
		},
	};
}

/**
 * Create a test ScoringResult with sensible defaults.
 *
 * @returns A ScoringResult suitable for testing
 */
export function createTestScoringResult(): ScoringResult {
	return {
		overallScore: 85,
		breakdown: {
			hygiene: {
				score: 25,
				issues: [],
			},
			coverage: {
				score: 22,
				issues: ["Branch coverage below 90%"],
			},
			documentation: {
				score: 13,
				issues: [],
			},
			security: {
				score: 10,
				issues: [],
			},
		},
		recommendations: [
			"Improve test coverage for edge cases",
			"Add JSDoc comments to public APIs",
			"Consider using more descriptive variable names",
		],
	};
}

/**
 * Create a test SessionState with sensible defaults.
 *
 * @returns A SessionState suitable for testing
 */
export function createTestSessionState(): SessionState {
	return {
		id: "test-session-001",
		phase: "discovery",
		currentPhase: "discovery",
		context: {
			goal: "Test session for strategy validation",
			project: "Integration Test Suite",
		},
		config: {
			sessionId: "test-session-001",
			context: {
				goal: "Test session for strategy validation",
				project: "Integration Test Suite",
			},
			goal: "Test session for strategy validation",
			requirements: ["Req 1", "Req 2"],
			constraints: ["Constraint 1"],
			metadata: {
				createdAt: "2026-01-08T00:00:00Z",
			},
		},
		phases: {
			discovery: {
				status: "active",
				notes: "Initial discovery phase",
			},
			requirements: {
				status: "pending",
			},
			planning: {
				status: "pending",
			},
			specification: {
				status: "pending",
			},
			architecture: {
				status: "pending",
			},
			implementation: {
				status: "pending",
			},
		},
		coverage: {
			overall: 0.75,
			byPhase: {
				discovery: 1.0,
				requirements: 0.5,
			},
		},
		artifacts: {
			"discovery-notes": "Initial notes",
		},
		status: "active",
		history: [
			{
				from: "discovery",
				to: "discovery",
				timestamp: "2026-01-08T00:00:00Z",
				type: "initialization",
				phase: "discovery",
				description: "Session started",
			},
		],
	};
}
