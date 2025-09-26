#!/usr/bin/env node

// Demo script for Space 7-Driven Methodology Selector
// Tests complete end-to-end methodology selection workflow

import { designAssistant } from "../dist/tools/design/design-assistant.js";

async function demoMethodologySelector() {
	console.log("🚀 Space 7-Driven Methodology Selector Demo\n");

	try {
		// Demo 1: Analytics overhaul scenario from issue example
		console.log("📊 Demo 1: Analytics Overhaul Project");
		console.log(
			"Scenario: Spectrafit analytics overhaul with uncertain modeling path\n",
		);

		const analyticsConfig = {
			sessionId: "demo-analytics-001",
			context:
				"Spectrafit analytics platform requires major overhaul to support new ML models",
			goal: "Redesign analytics architecture for performance and scalability",
			requirements: [
				"Support multiple ML model types",
				"Improve query performance by 3x",
				"Add real-time analytics capabilities",
				"Maintain backward compatibility",
			],
			constraints: [],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["Space 7 General Instructions"],
			outputFormats: ["markdown", "mermaid"],
			metadata: {},
			// Methodology selection signals
			methodologySignals: {
				projectType: "analytics-overhaul",
				problemFraming: "uncertain-modeling",
				riskLevel: "high",
				timelinePressure: "normal",
				stakeholderMode: "technical",
				domainContext:
					"Performance benchmarking and iterative model validation required",
			},
		};

		const analyticsResult = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "demo-analytics-001",
			config: analyticsConfig,
		});

		console.log(`✅ Success: ${analyticsResult.success}`);
		console.log(`📋 Message: ${analyticsResult.message}`);
		console.log(`🎯 Status: ${analyticsResult.status}`);
		console.log(`📈 Coverage: ${analyticsResult.coverage}%`);
		if (analyticsResult.recommendations) {
			console.log("💡 Recommendations:");
			for (const rec of analyticsResult.recommendations) {
				console.log(`   • ${rec}`);
			}
		}
		if (analyticsResult.artifacts && analyticsResult.artifacts.length > 0) {
			console.log(
				`📄 Generated ${analyticsResult.artifacts.length} artifact(s)`,
			);
			analyticsResult.artifacts.forEach((artifact) => {
				console.log(`   • ${artifact.name} (${artifact.type})`);
			});
		}
		console.log("");

		// Demo 2: Safety protocol scenario from issue example
		console.log("🔒 Demo 2: Safety Protocol Development");
		console.log(
			"Scenario: New safety protocol for AI agent guidelines with regulatory compliance\n",
		);

		const safetyConfig = {
			sessionId: "demo-safety-001",
			context:
				"Development of comprehensive AI safety protocols for external audits",
			goal: "Create enforceable safety guidelines with compliance framework",
			requirements: [
				"Meet regulatory compliance standards",
				"Define clear safety boundaries",
				"Establish audit procedures",
				"Create enforcement mechanisms",
			],
			constraints: [],
			coverageThreshold: 90,
			enablePivots: true,
			templateRefs: [
				"Space 7 General Instructions",
				"DESIGN_PROCESS_TEMPLATE.md",
			],
			outputFormats: ["markdown", "yaml"],
			metadata: {},
			methodologySignals: {
				projectType: "safety-protocol",
				problemFraming: "policy-first",
				riskLevel: "critical",
				timelinePressure: "normal",
				stakeholderMode: "regulatory",
				domainContext:
					"Compliance with AI safety regulations and external audit requirements",
			},
		};

		const safetyResult = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "demo-safety-001",
			config: safetyConfig,
		});

		console.log(`✅ Success: ${safetyResult.success}`);
		console.log(`📋 Message: ${safetyResult.message}`);
		console.log(`🎯 Status: ${safetyResult.status}`);
		console.log(`📈 Coverage: ${safetyResult.coverage}%`);
		if (safetyResult.recommendations) {
			console.log("💡 Recommendations:");
			safetyResult.recommendations.forEach((rec) => {
				console.log(`   • ${rec}`);
			});
		}
		if (safetyResult.artifacts && safetyResult.artifacts.length > 0) {
			console.log(`📄 Generated ${safetyResult.artifacts.length} artifact(s)`);
			safetyResult.artifacts.forEach((artifact) => {
				console.log(`   • ${artifact.name} (${artifact.type})`);
			});
		}
		console.log("");

		// Demo 3: Interactive feature scenario
		console.log("🎨 Demo 3: Interactive Feature Development");
		console.log(
			"Scenario: Virtual clubhouse interactive event features with user empathy focus\n",
		);

		const interactiveConfig = {
			sessionId: "demo-interactive-001",
			context:
				"Development of new interactive features for virtual clubhouse events",
			goal: "Create engaging user experiences for virtual event participation",
			requirements: [
				"Real-time user interaction",
				"Intuitive user interface",
				"Cross-platform compatibility",
				"Accessibility support",
			],
			constraints: [],
			coverageThreshold: 85,
			enablePivots: true,
			templateRefs: ["Space 7 General Instructions"],
			outputFormats: ["markdown", "mermaid"],
			metadata: {},
			methodologySignals: {
				projectType: "interactive-feature",
				problemFraming: "empathy-focused",
				riskLevel: "medium",
				timelinePressure: "normal",
				stakeholderMode: "business",
				domainContext:
					"User experience optimization for virtual event engagement",
			},
		};

		const interactiveResult = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "demo-interactive-001",
			config: interactiveConfig,
		});

		console.log(`✅ Success: ${interactiveResult.success}`);
		console.log(`📋 Message: ${interactiveResult.message}`);
		console.log(`🎯 Status: ${interactiveResult.status}`);
		console.log(`📈 Coverage: ${interactiveResult.coverage}%`);
		if (interactiveResult.recommendations) {
			console.log("💡 Recommendations:");
			for (const rec of interactiveResult.recommendations) {
				console.log(`   • ${rec}`);
			}
		}
		if (interactiveResult.artifacts && interactiveResult.artifacts.length > 0) {
			console.log(
				`📄 Generated ${interactiveResult.artifacts.length} artifact(s)`,
			);
			interactiveResult.artifacts.forEach((artifact) => {
				console.log(`   • ${artifact.name} (${artifact.type})`);
			});
		}
		console.log("");

		// Demo 4: Standalone methodology selection
		console.log("⚙️ Demo 4: Standalone Methodology Selection");
		console.log(
			"Scenario: Large refactor project requiring architecture-focused approach\n",
		);

		const methodologyResult = await designAssistant.processRequest({
			action: "select-methodology",
			sessionId: "demo-methodology-001",
			methodologySignals: {
				projectType: "large-refactor",
				problemFraming: "performance-first",
				riskLevel: "high",
				timelinePressure: "normal",
				stakeholderMode: "technical",
				domainContext:
					"MCP architecton large-scale refactoring for performance optimization",
			},
		});

		console.log(`✅ Success: ${methodologyResult.success}`);
		console.log(`📋 Message: ${methodologyResult.message}`);
		console.log(`🎯 Status: ${methodologyResult.status}`);
		if (methodologyResult.recommendations) {
			console.log("💡 Recommendations:");
			for (const rec of methodologyResult.recommendations) {
				console.log(`   • ${rec}`);
			}
		}
		if (methodologyResult.data) {
			const { methodologySelection, alternatives } = methodologyResult.data;
			if (methodologySelection) {
				console.log(
					`🎯 Selected Methodology: ${methodologySelection.selected.name}`,
				);
				console.log(
					`📊 Confidence Score: ${methodologySelection.selected.confidenceScore}%`,
				);
				console.log(
					`🔗 Phase Sequence: ${methodologySelection.selected.phases.join(
						" → ",
					)}`,
				);
				console.log(
					`💪 Key Strengths: ${methodologySelection.selected.strengths.join(
						", ",
					)}`,
				);
			}
			if (alternatives && alternatives.length > 0) {
				console.log("🔄 Alternative Methodologies:");
				alternatives.slice(0, 2).forEach((alt) => {
					console.log(`   • ${alt.name} (${alt.confidenceScore}% confidence)`);
				});
			}
		}
		if (methodologyResult.artifacts && methodologyResult.artifacts.length > 0) {
			console.log(
				`📄 Generated ${methodologyResult.artifacts.length} ADR for methodology decision`,
			);
		}
		console.log("");

		// Summary
		console.log("🎉 Space 7-Driven Methodology Selector Demo Complete!");
		console.log("\n📋 Summary of Implemented Features:");
		console.log(
			"   ✅ Automatic methodology selection based on project signals",
		);
		console.log("   ✅ Context-aware confidence scoring with rationale");
		console.log("   ✅ Dynamic phase sequence generation per methodology");
		console.log("   ✅ ADR generation for methodology decisions");
		console.log("   ✅ Integration with existing Design Assistant framework");
		console.log("   ✅ Support for all issue example scenarios:");
		console.log(
			"       • Analytics overhaul → Dual Track Discovery + Agile Execution",
		);
		console.log(
			"       • Safety protocol → Policy-First + Risk-Based Evaluation",
		);
		console.log(
			"       • Interactive feature → Design Thinking (Empathy-Focused)",
		);
		console.log(
			"       • Large refactor → Architecture Decision Mapping + Lightweight Iterative Loop",
		);

		return true;
	} catch (error) {
		console.error("❌ Demo failed:", error);
		return false;
	}
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	demoMethodologySelector()
		.then((success) => process.exit(success ? 0 : 1))
		.catch((error) => {
			console.error("Demo execution failed:", error);
			process.exit(1);
		});
}

export { demoMethodologySelector };
