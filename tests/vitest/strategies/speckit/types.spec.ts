/**
 * Tests for Spec-Kit Types
 *
 * Validates type definitions and ensures type safety.
 *
 * @module tests/strategies/speckit/types
 */

import { describe, expect, it } from "vitest";
import type {
	AcceptanceCriterion,
	ArchitectureRule,
	Blocker,
	Constitution,
	ConstitutionMetadata,
	Constraint,
	ConstraintReference,
	Dependency,
	DerivedTask,
	DesignPrinciple,
	Objective,
	ParsedSpec,
	Phase,
	Plan,
	Principle,
	Progress,
	ProgressUpdate,
	Requirement,
	Risk,
	SpecKitArtifacts,
	TimelineEntry,
} from "../../../src/strategies/speckit/types.js";

describe("Spec-Kit Types", () => {
	describe("Constitution Types", () => {
		it("should create valid Principle", () => {
			const principle: Principle = {
				id: "PRIN-001",
				title: "Security First",
				description: "Security takes precedence",
				type: "principle",
			};

			expect(principle.id).toBe("PRIN-001");
			expect(principle.type).toBe("principle");
		});

		it("should create valid Constraint with severity levels", () => {
			const mustConstraint: Constraint = {
				id: "CONS-001",
				title: "Node.js 22+",
				description: "Must use Node.js 22 or higher",
				severity: "must",
				type: "constraint",
			};

			const shouldConstraint: Constraint = {
				id: "CONS-002",
				title: "TypeScript Strict",
				description: "Should use TypeScript strict mode",
				severity: "should",
				type: "constraint",
			};

			const mayConstraint: Constraint = {
				id: "CONS-003",
				title: "ESLint",
				description: "May use ESLint for linting",
				severity: "may",
				type: "constraint",
			};

			expect(mustConstraint.severity).toBe("must");
			expect(shouldConstraint.severity).toBe("should");
			expect(mayConstraint.severity).toBe("may");
		});

		it("should create valid ArchitectureRule", () => {
			const rule: ArchitectureRule = {
				id: "ARCH-001",
				title: "Domain-Driven Design",
				description: "Use DDD patterns",
				type: "architecture-rule",
			};

			expect(rule.type).toBe("architecture-rule");
		});

		it("should create valid DesignPrinciple", () => {
			const principle: DesignPrinciple = {
				id: "DESIGN-001",
				title: "SOLID Principles",
				description: "Follow SOLID principles",
				type: "design-principle",
			};

			expect(principle.type).toBe("design-principle");
		});

		it("should create valid Constitution with metadata", () => {
			const metadata: ConstitutionMetadata = {
				title: "Project Constitution",
				version: "1.0.0",
				lastUpdated: "2024-01-15T10:00:00Z",
			};

			const constitution: Constitution = {
				principles: [
					{
						id: "PRIN-001",
						title: "Security First",
						description: "Security takes precedence",
						type: "principle",
					},
				],
				constraints: [
					{
						id: "CONS-001",
						title: "Node.js 22+",
						description: "Must use Node.js 22+",
						severity: "must",
						type: "constraint",
					},
				],
				architectureRules: [],
				designPrinciples: [],
				metadata,
			};

			expect(constitution.metadata?.version).toBe("1.0.0");
			expect(constitution.principles).toHaveLength(1);
		});
	});

	describe("Spec Types", () => {
		it("should create valid Objective with priority", () => {
			const highPriority: Objective = {
				id: "OBJ-001",
				description: "Reduce page load time",
				priority: "high",
			};

			const mediumPriority: Objective = {
				id: "OBJ-002",
				description: "Improve accessibility",
				priority: "medium",
			};

			const lowPriority: Objective = {
				id: "OBJ-003",
				description: "Add dark mode",
				priority: "low",
			};

			expect(highPriority.priority).toBe("high");
			expect(mediumPriority.priority).toBe("medium");
			expect(lowPriority.priority).toBe("low");
		});

		it("should create valid Requirement with derived tasks", () => {
			const task: DerivedTask = {
				id: "TASK-001",
				title: "Implement OAuth",
				description: "Add OAuth 2.0 support",
				priority: "high",
				estimate: "3 days",
				acceptanceCriteria: ["User can log in"],
			};

			const requirement: Requirement = {
				id: "REQ-001",
				description: "Support OAuth authentication",
				priority: "high",
				derivedTasks: [task],
			};

			expect(requirement.derivedTasks).toHaveLength(1);
			expect(requirement.derivedTasks?.[0].id).toBe("TASK-001");
		});

		it("should create valid ConstraintReference", () => {
			const ref: ConstraintReference = {
				constitutionId: "CONS-001",
				type: "constraint",
				notes: "Impacts Node.js version",
			};

			expect(ref.type).toBe("constraint");
			expect(ref.notes).toBe("Impacts Node.js version");
		});

		it("should create valid AcceptanceCriterion with verification methods", () => {
			const automated: AcceptanceCriterion = {
				id: "AC-001",
				description: "User can authenticate",
				verificationMethod: "automated",
			};

			const manual: AcceptanceCriterion = {
				id: "AC-002",
				description: "UI is accessible",
				verificationMethod: "manual",
			};

			const review: AcceptanceCriterion = {
				id: "AC-003",
				description: "Code follows standards",
				verificationMethod: "review",
			};

			expect(automated.verificationMethod).toBe("automated");
			expect(manual.verificationMethod).toBe("manual");
			expect(review.verificationMethod).toBe("review");
		});

		it("should create valid ParsedSpec", () => {
			const spec: ParsedSpec = {
				title: "OAuth Integration",
				overview: "Add OAuth 2.0 authentication",
				objectives: [
					{
						id: "OBJ-001",
						description: "Secure authentication",
						priority: "high",
					},
				],
				functionalRequirements: [
					{
						id: "REQ-001",
						description: "Support OAuth",
						priority: "high",
					},
				],
				nonFunctionalRequirements: [
					{
						id: "REQ-002",
						description: "Response time < 200ms",
						priority: "medium",
					},
				],
				constraints: [
					{
						constitutionId: "CONS-001",
						type: "constraint",
					},
				],
				acceptanceCriteria: [
					{
						id: "AC-001",
						description: "User can log in",
						verificationMethod: "automated",
					},
				],
				outOfScope: ["Social media integration"],
			};

			expect(spec.title).toBe("OAuth Integration");
			expect(spec.outOfScope).toHaveLength(1);
		});
	});

	describe("Plan Types", () => {
		it("should create valid Phase", () => {
			const phase: Phase = {
				id: "PHASE-001",
				name: "Foundation",
				description: "Establish core architecture",
				deliverables: ["Architecture diagram", "Core interfaces"],
				duration: "2 weeks",
			};

			expect(phase.deliverables).toHaveLength(2);
		});

		it("should create valid Dependency", () => {
			const dependency: Dependency = {
				id: "DEP-001",
				description: "OAuth provider API access",
				owner: "security-team",
			};

			expect(dependency.owner).toBe("security-team");
		});

		it("should create valid Risk with severity", () => {
			const highRisk: Risk = {
				id: "RISK-001",
				description: "Third-party API failure",
				severity: "high",
				mitigation: "Implement fallback",
			};

			const mediumRisk: Risk = {
				id: "RISK-002",
				description: "Rate limits",
				severity: "medium",
				mitigation: "Add caching",
			};

			const lowRisk: Risk = {
				id: "RISK-003",
				description: "Minor UI inconsistency",
				severity: "low",
				mitigation: "Style guide review",
			};

			expect(highRisk.severity).toBe("high");
			expect(mediumRisk.severity).toBe("medium");
			expect(lowRisk.severity).toBe("low");
		});

		it("should create valid TimelineEntry", () => {
			const timeline: TimelineEntry = {
				phase: "PHASE-001",
				startWeek: 1,
				endWeek: 2,
			};

			expect(timeline.startWeek).toBe(1);
			expect(timeline.endWeek).toBe(2);
		});

		it("should create valid Plan", () => {
			const plan: Plan = {
				approach: "Incremental implementation with phased rollout",
				phases: [
					{
						id: "PHASE-001",
						name: "Foundation",
						description: "Core setup",
						deliverables: ["Architecture"],
						duration: "2 weeks",
					},
				],
				dependencies: [
					{
						id: "DEP-001",
						description: "API access",
					},
				],
				risks: [
					{
						id: "RISK-001",
						description: "API failure",
						severity: "high",
						mitigation: "Fallback",
					},
				],
				timeline: [
					{
						phase: "PHASE-001",
						startWeek: 1,
						endWeek: 2,
					},
				],
			};

			expect(plan.phases).toHaveLength(1);
			expect(plan.timeline).toHaveLength(1);
		});
	});

	describe("Task Types", () => {
		it("should create valid DerivedTask with all fields", () => {
			const task: DerivedTask = {
				id: "TASK-001",
				title: "Implement OAuth login",
				description: "Create OAuth 2.0 authentication flow",
				priority: "high",
				estimate: "3 days",
				phase: "PHASE-001",
				acceptanceCriteria: ["User can log in", "Token stored securely"],
				dependencies: ["TASK-002"],
			};

			expect(task.acceptanceCriteria).toHaveLength(2);
			expect(task.dependencies).toHaveLength(1);
		});

		it("should create valid DerivedTask without optional fields", () => {
			const task: DerivedTask = {
				id: "TASK-002",
				title: "Setup database",
				description: "Initialize database schema",
				priority: "medium",
				estimate: "1 day",
				acceptanceCriteria: ["Schema created"],
			};

			expect(task.phase).toBeUndefined();
			expect(task.dependencies).toBeUndefined();
		});
	});

	describe("Progress Types", () => {
		it("should create valid ProgressUpdate", () => {
			const update: ProgressUpdate = {
				date: new Date("2024-01-15"),
				description: "Completed OAuth integration",
				tasksCompleted: ["TASK-001", "TASK-002"],
			};

			expect(update.tasksCompleted).toHaveLength(2);
		});

		it("should create valid Blocker with severity", () => {
			const critical: Blocker = {
				id: "BLOCK-001",
				description: "Production deployment blocked",
				severity: "critical",
				owner: "devops-team",
			};

			const major: Blocker = {
				id: "BLOCK-002",
				description: "API credentials pending",
				severity: "major",
			};

			const minor: Blocker = {
				id: "BLOCK-003",
				description: "Documentation review needed",
				severity: "minor",
			};

			expect(critical.severity).toBe("critical");
			expect(major.severity).toBe("major");
			expect(minor.severity).toBe("minor");
		});

		it("should create valid Progress with all statuses", () => {
			const onTrack: Progress = {
				status: "on-track",
				completionPercentage: 75,
				tasksCompleted: 15,
				totalTasks: 20,
				recentUpdates: [],
				blockers: [],
				nextSteps: ["Complete remaining tasks"],
				lastUpdated: new Date(),
			};

			const atRisk: Progress = {
				status: "at-risk",
				completionPercentage: 50,
				tasksCompleted: 10,
				totalTasks: 20,
				recentUpdates: [],
				blockers: [
					{
						id: "BLOCK-001",
						description: "Blocker",
						severity: "major",
					},
				],
				nextSteps: ["Resolve blocker"],
				lastUpdated: new Date(),
			};

			const blocked: Progress = {
				status: "blocked",
				completionPercentage: 30,
				tasksCompleted: 6,
				totalTasks: 20,
				recentUpdates: [],
				blockers: [
					{
						id: "BLOCK-001",
						description: "Critical blocker",
						severity: "critical",
					},
				],
				nextSteps: ["Escalate blocker"],
				lastUpdated: new Date(),
			};

			const completed: Progress = {
				status: "completed",
				completionPercentage: 100,
				tasksCompleted: 20,
				totalTasks: 20,
				recentUpdates: [],
				blockers: [],
				nextSteps: [],
				lastUpdated: new Date(),
			};

			expect(onTrack.status).toBe("on-track");
			expect(atRisk.status).toBe("at-risk");
			expect(blocked.status).toBe("blocked");
			expect(completed.status).toBe("completed");
		});
	});

	describe("SpecKitArtifacts Aggregate", () => {
		it("should create valid SpecKitArtifacts with all required fields", () => {
			const artifacts: SpecKitArtifacts = {
				spec: {
					title: "Test Spec",
					overview: "Test overview",
					objectives: [],
					functionalRequirements: [],
					nonFunctionalRequirements: [],
					constraints: [],
					acceptanceCriteria: [],
					outOfScope: [],
				},
				plan: {
					approach: "Incremental",
					phases: [],
					dependencies: [],
					risks: [],
					timeline: [],
				},
				tasks: [],
				progress: {
					status: "on-track",
					completionPercentage: 0,
					tasksCompleted: 0,
					totalTasks: 10,
					recentUpdates: [],
					blockers: [],
					nextSteps: [],
					lastUpdated: new Date(),
				},
			};

			expect(artifacts.spec.title).toBe("Test Spec");
			expect(artifacts.plan.approach).toBe("Incremental");
			expect(artifacts.constitution).toBeUndefined();
		});

		it("should create valid SpecKitArtifacts with optional constitution", () => {
			const artifacts: SpecKitArtifacts = {
				spec: {
					title: "Test Spec",
					overview: "Test overview",
					objectives: [],
					functionalRequirements: [],
					nonFunctionalRequirements: [],
					constraints: [],
					acceptanceCriteria: [],
					outOfScope: [],
				},
				plan: {
					approach: "Incremental",
					phases: [],
					dependencies: [],
					risks: [],
					timeline: [],
				},
				tasks: [],
				progress: {
					status: "on-track",
					completionPercentage: 0,
					tasksCompleted: 0,
					totalTasks: 10,
					recentUpdates: [],
					blockers: [],
					nextSteps: [],
					lastUpdated: new Date(),
				},
				constitution: {
					principles: [],
					constraints: [],
					architectureRules: [],
					designPrinciples: [],
				},
			};

			expect(artifacts.constitution).toBeDefined();
			expect(artifacts.constitution?.principles).toHaveLength(0);
		});

		it("should create complete SpecKitArtifacts with all data", () => {
			const artifacts: SpecKitArtifacts = {
				spec: {
					title: "OAuth Integration",
					overview: "Add OAuth 2.0 authentication",
					objectives: [
						{
							id: "OBJ-001",
							description: "Secure authentication",
							priority: "high",
						},
					],
					functionalRequirements: [
						{
							id: "REQ-001",
							description: "OAuth support",
							priority: "high",
						},
					],
					nonFunctionalRequirements: [
						{
							id: "REQ-002",
							description: "Fast response",
							priority: "medium",
						},
					],
					constraints: [
						{
							constitutionId: "CONS-001",
							type: "constraint",
						},
					],
					acceptanceCriteria: [
						{
							id: "AC-001",
							description: "User can authenticate",
							verificationMethod: "automated",
						},
					],
					outOfScope: ["Social login"],
				},
				plan: {
					approach: "Incremental rollout",
					phases: [
						{
							id: "PHASE-001",
							name: "Foundation",
							description: "Core setup",
							deliverables: ["Architecture"],
							duration: "2 weeks",
						},
					],
					dependencies: [
						{
							id: "DEP-001",
							description: "API access",
						},
					],
					risks: [
						{
							id: "RISK-001",
							description: "API failure",
							severity: "high",
							mitigation: "Implement fallback",
						},
					],
					timeline: [
						{
							phase: "PHASE-001",
							startWeek: 1,
							endWeek: 2,
						},
					],
				},
				tasks: [
					{
						id: "TASK-001",
						title: "Implement OAuth",
						description: "Create OAuth flow",
						priority: "high",
						estimate: "3 days",
						acceptanceCriteria: ["User can log in"],
					},
				],
				progress: {
					status: "on-track",
					completionPercentage: 50,
					tasksCompleted: 5,
					totalTasks: 10,
					recentUpdates: [
						{
							date: new Date("2024-01-15"),
							description: "Completed OAuth",
							tasksCompleted: ["TASK-001"],
						},
					],
					blockers: [],
					nextSteps: ["Continue implementation"],
					lastUpdated: new Date(),
				},
				constitution: {
					principles: [
						{
							id: "PRIN-001",
							title: "Security First",
							description: "Security takes precedence",
							type: "principle",
						},
					],
					constraints: [
						{
							id: "CONS-001",
							title: "Node.js 22+",
							description: "Must use Node.js 22+",
							severity: "must",
							type: "constraint",
						},
					],
					architectureRules: [],
					designPrinciples: [],
					metadata: {
						title: "Project Constitution",
						version: "1.0.0",
						lastUpdated: "2024-01-15T10:00:00Z",
					},
				},
			};

			expect(artifacts.spec.objectives).toHaveLength(1);
			expect(artifacts.plan.phases).toHaveLength(1);
			expect(artifacts.tasks).toHaveLength(1);
			expect(artifacts.progress.tasksCompleted).toBe(5);
			expect(artifacts.constitution?.principles).toHaveLength(1);
		});
	});

	describe("Type Discriminators", () => {
		it("should have correct type discriminators for constitution items", () => {
			const principle: Principle = {
				id: "PRIN-001",
				title: "Test",
				description: "Test",
				type: "principle",
			};

			const constraint: Constraint = {
				id: "CONS-001",
				title: "Test",
				description: "Test",
				severity: "must",
				type: "constraint",
			};

			const archRule: ArchitectureRule = {
				id: "ARCH-001",
				title: "Test",
				description: "Test",
				type: "architecture-rule",
			};

			const designPrinciple: DesignPrinciple = {
				id: "DESIGN-001",
				title: "Test",
				description: "Test",
				type: "design-principle",
			};

			expect(principle.type).toBe("principle");
			expect(constraint.type).toBe("constraint");
			expect(archRule.type).toBe("architecture-rule");
			expect(designPrinciple.type).toBe("design-principle");
		});

		it("should reference correct constitution types", () => {
			const principleRef: ConstraintReference = {
				constitutionId: "PRIN-001",
				type: "principle",
			};

			const constraintRef: ConstraintReference = {
				constitutionId: "CONS-001",
				type: "constraint",
			};

			const archRuleRef: ConstraintReference = {
				constitutionId: "ARCH-001",
				type: "architecture-rule",
			};

			const designPrincipleRef: ConstraintReference = {
				constitutionId: "DESIGN-001",
				type: "design-principle",
			};

			expect(principleRef.type).toBe("principle");
			expect(constraintRef.type).toBe("constraint");
			expect(archRuleRef.type).toBe("architecture-rule");
			expect(designPrincipleRef.type).toBe("design-principle");
		});
	});
});
