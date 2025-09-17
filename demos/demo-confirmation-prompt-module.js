#!/usr/bin/env node

// Demo script for the new Deterministic Confirmation Prompt Module
import {
	confirmationModule,
	confirmationPromptBuilder,
} from "../dist/tools/design/index.js";

async function runDemo() {
	console.log("🎯 Deterministic Confirmation Prompt Module Demo\n");

	// Initialize modules
	await confirmationModule.initialize();
	await confirmationPromptBuilder.initialize();

	// Create a sample design session state
	const sessionState = {
		config: {
			sessionId: "demo-session-2024",
			context: "Building a task management system for teams",
			goal: "Create a scalable, user-friendly task management platform",
			requirements: [
				"User authentication and authorization",
				"Task creation and assignment",
				"Real-time collaboration features",
				"Mobile and web interfaces",
			],
			constraints: [
				{
					id: "performance-constraint",
					name: "Performance Requirements",
					type: "non-functional",
					category: "performance",
					description: "System must respond within 2 seconds",
					validation: { minCoverage: 90, keywords: ["performance", "latency"] },
					weight: 0.9,
					mandatory: true,
					source: "Performance Standards",
				},
				{
					id: "security-constraint",
					name: "Security Requirements",
					type: "non-functional",
					category: "security",
					description: "Data must be encrypted at rest and in transit",
					validation: { minCoverage: 95, keywords: ["encryption", "security"] },
					weight: 1.0,
					mandatory: true,
					source: "Security Guidelines",
				},
			],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["task-management-template"],
			outputFormats: ["markdown"],
			metadata: { demo: true },
		},
		currentPhase: "implementation",
		phases: {
			requirements: {
				id: "requirements",
				name: "Requirements Analysis",
				description: "Requirements gathering and analysis phase",
				status: "completed",
				inputs: ["stakeholder-input"],
				outputs: ["functional-requirements", "non-functional-requirements"],
				criteria: ["requirements-complete", "stakeholder-approval"],
				coverage: 88,
				artifacts: [
					{
						id: "req-doc",
						name: "Requirements Document",
						type: "requirements",
						content:
							"Comprehensive requirements with performance and security considerations",
						format: "markdown",
						timestamp: "2024-01-15T10:00:00Z",
						metadata: { phase: "requirements" },
					},
				],
				dependencies: [],
			},
			implementation: {
				id: "implementation",
				name: "Implementation",
				description: "System implementation phase",
				status: "in-progress",
				inputs: ["requirements-document"],
				outputs: ["working-software", "test-results"],
				criteria: ["code-complete", "tests-passing", "performance-validated"],
				coverage: 75,
				artifacts: [],
				dependencies: ["requirements"],
			},
		},
		coverage: {
			overall: 82,
			phases: { requirements: 88, implementation: 75 },
			constraints: { "performance-constraint": 85, "security-constraint": 92 },
			assumptions: { "user-adoption": 80 },
			documentation: { "api-docs": 70 },
			testCoverage: 78,
		},
		artifacts: [],
		history: [
			{
				timestamp: "2024-01-15T10:00:00Z",
				type: "phase-start",
				phase: "implementation",
				description: "Started implementation phase",
			},
		],
		status: "active",
	};

	console.log("📊 Session Overview:");
	console.log(`  • Session ID: ${sessionState.config.sessionId}`);
	console.log(`  • Current Phase: ${sessionState.currentPhase}`);
	console.log(`  • Overall Coverage: ${sessionState.coverage.overall}%`);
	console.log(`  • Constraints: ${sessionState.config.constraints.length}`);
	console.log("");

	// Demo 1: Generate a deterministic confirmation prompt
	console.log("🔍 Demo 1: Generating Context-Aware Confirmation Prompt");
	console.log("─".repeat(60));

	const prompt = await confirmationPromptBuilder.generateConfirmationPrompt({
		sessionState,
		phaseId: "implementation",
		contextualContent:
			"Implementation progress includes API development with Express.js, database setup with PostgreSQL, and initial UI components with React. We decided to use TypeScript for better type safety. Performance testing shows response times under 1.5 seconds. Security audit identified potential risk with authentication tokens.",
		includeRationale: true,
	});

	console.log(`📝 Generated Prompt Title: "${prompt.title}"`);
	console.log(`📋 Sections: ${prompt.sections.map((s) => s.title).join(", ")}`);
	console.log(
		`✅ Validation Checkpoints: ${prompt.validationChecklist.length}`,
	);
	console.log(`🤔 Rationale Questions: ${prompt.rationaleQuestions.length}`);
	console.log(
		`📈 Coverage Gaps Identified: ${prompt.metadata.coverageGaps.length}`,
	);
	console.log(`⚠️  Critical Issues: ${prompt.metadata.criticalIssues.length}`);
	console.log("");

	// Demo 2: Enhanced confirmation with rationale tracking
	console.log("🧠 Demo 2: Enhanced Confirmation with Rationale Tracking");
	console.log("─".repeat(60));

	const confirmationContent = `
	Implementation Phase Progress Report:

	Technical Decisions Made:
	- Decided to use Node.js with Express.js for the backend API
	- Selected PostgreSQL as the primary database for data persistence
	- Chose React with TypeScript for the frontend application
	- Opted for JWT tokens for authentication mechanism

	Key Assumptions:
	- We assume the user base will not exceed 10,000 concurrent users initially
	- We expect that our chosen technology stack can handle the projected load
	- The team assumes familiarity with the selected technologies

	Alternative Approaches Considered:
	- Alternative to PostgreSQL could be MongoDB for document-based storage
	- Could use GraphQL instead of REST API for more flexible data fetching
	- Vue.js was considered as an alternative to React

	Risk Assessment:
	- Risk of performance bottlenecks with complex queries
	- Potential security concerns with JWT token management
	- Concern about scalability with current architecture design
	`;

	const enhancedResult =
		await confirmationModule.confirmPhaseCompletionWithPrompt({
			sessionState,
			phaseId: "implementation",
			content: confirmationContent,
			captureRationale: true,
			generatePrompt: false,
			strictMode: true,
		});

	console.log(
		`🎯 Confirmation Result: ${enhancedResult.passed ? "PASSED" : "FAILED"}`,
	);
	console.log(`📊 Coverage: ${enhancedResult.coverage.toFixed(1)}%`);
	console.log(`⚠️  Issues Found: ${enhancedResult.issues.length}`);
	console.log(`💡 Recommendations: ${enhancedResult.recommendations.length}`);

	if (enhancedResult.rationale) {
		console.log(`\n🧠 Rationale Captured:`);
		console.log(`  • Decisions: ${enhancedResult.rationale.decisions.length}`);
		console.log(
			`  • Assumptions: ${enhancedResult.rationale.assumptions.length}`,
		);
		console.log(
			`  • Alternatives: ${enhancedResult.rationale.alternatives.length}`,
		);
		console.log(`  • Risks: ${enhancedResult.rationale.risks.length}`);
	}
	console.log("");

	// Demo 3: Generate and export rationale documentation
	console.log("📄 Demo 3: Rationale Documentation Export");
	console.log("─".repeat(60));

	const markdownDoc = await confirmationModule.exportRationaleDocumentation(
		sessionState.config.sessionId,
		"markdown",
	);

	console.log("📝 Generated Markdown Documentation:");
	console.log("─".repeat(40));
	console.log(markdownDoc.substring(0, 500) + "...\n");

	// Demo 4: Coverage validation prompt
	console.log("📈 Demo 4: Coverage Validation Prompt");
	console.log("─".repeat(60));

	const coveragePrompt =
		await confirmationPromptBuilder.generateCoverageValidationPrompt(
			sessionState,
			85,
		);

	console.log("📊 Coverage Validation Prompt Generated:");
	console.log("─".repeat(40));
	console.log(coveragePrompt.substring(0, 400) + "...\n");

	// Demo 5: Show full markdown prompt
	console.log("📋 Demo 5: Complete Confirmation Prompt");
	console.log("─".repeat(60));

	const fullPrompt =
		await confirmationPromptBuilder.generatePhaseCompletionPrompt(
			sessionState,
			"implementation",
		);

	console.log("📝 Full Implementation Phase Confirmation Prompt:");
	console.log("─".repeat(40));
	console.log(fullPrompt.substring(0, 600) + "...\n");

	console.log("🎉 Demo Complete!");
	console.log("\n✨ Key Features Demonstrated:");
	console.log("  ✅ Context-aware prompt generation");
	console.log("  ✅ Enhanced rationale tracking");
	console.log("  ✅ Intelligent validation checkpoints");
	console.log("  ✅ Decision documentation and export");
	console.log("  ✅ Coverage gap identification");
	console.log("  ✅ Multiple output formats");
	console.log("  ✅ Backward compatibility");
}

// Run the demo
runDemo().catch(console.error);
