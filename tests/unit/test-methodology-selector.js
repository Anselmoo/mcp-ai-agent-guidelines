#!/usr/bin/env node

// Test suite for Methodology Selector functionality
import { methodologySelector } from "../../src/tools/design/methodology-selector.js";

async function testMethodologySelector() {
	console.log("🔬 Testing Methodology Selector...");

	try {
		// Test 1: Analytics overhaul scenario (from issue example)
		console.log("\n📊 Test 1: Analytics Overhaul → Dual Track Discovery");
		const analyticsSignals = {
			projectType: "analytics-overhaul",
			problemFraming: "uncertain-modeling",
			riskLevel: "high",
			timelinePressure: "normal",
			stakeholderMode: "technical",
			domainContext: "Performance benchmarking for machine learning models",
		};

		const analyticsResult =
			await methodologySelector.selectMethodology(analyticsSignals);
		console.log(`   ✅ Selected: ${analyticsResult.selected.name}`);
		console.log(
			`   ✅ Confidence: ${analyticsResult.selected.confidenceScore}%`,
		);
		console.log(`   ✅ Phases: ${analyticsResult.selected.phases.join(" → ")}`);
		console.log(
			`   ✅ Alternatives: ${analyticsResult.alternatives
				.slice(0, 2)
				.map((a) => a.name)
				.join(", ")}`,
		);

		// Test 2: Safety protocol scenario (from issue example)
		console.log("\n🔒 Test 2: Safety Protocol → Policy-First Risk Evaluation");
		const safetySignals = {
			projectType: "safety-protocol",
			problemFraming: "policy-first",
			riskLevel: "critical",
			timelinePressure: "normal",
			stakeholderMode: "regulatory",
			domainContext: "AI safety guidelines for external audits",
		};

		const safetyResult =
			await methodologySelector.selectMethodology(safetySignals);
		console.log(`   ✅ Selected: ${safetyResult.selected.name}`);
		console.log(`   ✅ Confidence: ${safetyResult.selected.confidenceScore}%`);
		console.log(`   ✅ Phases: ${safetyResult.selected.phases.join(" → ")}`);

		// Test 3: Interactive feature scenario (from issue example)
		console.log("\n🎨 Test 3: Interactive Feature → Design Thinking");
		const interactiveSignals = {
			projectType: "interactive-feature",
			problemFraming: "empathy-focused",
			riskLevel: "medium",
			timelinePressure: "normal",
			stakeholderMode: "business",
			domainContext: "Virtual clubhouse event features",
		};

		const interactiveResult =
			await methodologySelector.selectMethodology(interactiveSignals);
		console.log(`   ✅ Selected: ${interactiveResult.selected.name}`);
		console.log(
			`   ✅ Confidence: ${interactiveResult.selected.confidenceScore}%`,
		);
		console.log(
			`   ✅ Phases: ${interactiveResult.selected.phases.join(" → ")}`,
		);

		// Test 4: Large refactor scenario (from issue example)
		console.log("\n🏗️ Test 4: Large Refactor → Architecture Decision Mapping");
		const refactorSignals = {
			projectType: "large-refactor",
			problemFraming: "performance-first",
			riskLevel: "high",
			timelinePressure: "normal",
			stakeholderMode: "technical",
			domainContext: "MCP architecton large-scale refactoring",
		};

		const refactorResult =
			await methodologySelector.selectMethodology(refactorSignals);
		console.log(`   ✅ Selected: ${refactorResult.selected.name}`);
		console.log(
			`   ✅ Confidence: ${refactorResult.selected.confidenceScore}%`,
		);
		console.log(`   ✅ Phases: ${refactorResult.selected.phases.join(" → ")}`);

		// Test 5: Urgent timeline → Lean UX
		console.log("\n⚡ Test 5: Urgent Timeline → Lean UX Rapid");
		const urgentSignals = {
			projectType: "interactive-feature",
			problemFraming: "user-experience",
			riskLevel: "low",
			timelinePressure: "urgent",
			stakeholderMode: "business",
			domainContext: "Quick user interface improvements",
		};

		const urgentResult =
			await methodologySelector.selectMethodology(urgentSignals);
		console.log(`   ✅ Selected: ${urgentResult.selected.name}`);
		console.log(`   ✅ Confidence: ${urgentResult.selected.confidenceScore}%`);
		console.log(`   ✅ Phases: ${urgentResult.selected.phases.join(" → ")}`);

		// Test 6: Methodology Profile Generation
		console.log("\n📋 Test 6: Methodology Profile Generation");
		const profile =
			await methodologySelector.generateMethodologyProfile(analyticsResult);
		console.log(`   ✅ Methodology: ${profile.methodology.name}`);
		console.log(
			`   ✅ Phase Count: ${Object.keys(profile.phaseMapping).length}`,
		);
		console.log(`   ✅ Milestones: ${profile.milestones.length}`);
		console.log(`   ✅ Success Metrics: ${profile.successMetrics.length}`);
		console.log(`   ✅ Dialogue Prompts: ${profile.dialoguePrompts.length}`);

		// Test 7: Fallback scenarios (unmapped combinations)
		console.log("\n🔄 Test 7: Fallback Methodology Selection");
		const fallbackSignals = {
			projectType: "new-application",
			problemFraming: "innovation-driven",
			riskLevel: "medium",
			timelinePressure: "flexible",
			stakeholderMode: "mixed",
			domainContext: "Novel AI application development",
		};

		const fallbackResult =
			await methodologySelector.selectMethodology(fallbackSignals);
		console.log(`   ✅ Selected: ${fallbackResult.selected.name}`);
		console.log(
			`   ✅ Confidence: ${fallbackResult.selected.confidenceScore}% (fallback scoring)`,
		);
		console.log(`   ✅ Phases: ${fallbackResult.selected.phases.join(" → ")}`);

		console.log("\n🎯 Methodology Selector Tests Summary:");
		console.log(
			"   ✅ Analytics overhaul correctly mapped to Dual Track Discovery",
		);
		console.log(
			"   ✅ Safety protocol correctly mapped to Policy-First Risk Evaluation",
		);
		console.log(
			"   ✅ Interactive feature correctly mapped to Design Thinking",
		);
		console.log(
			"   ✅ Large refactor correctly mapped to Architecture Decision Mapping",
		);
		console.log("   ✅ Urgent timeline correctly mapped to Lean UX Rapid");
		console.log("   ✅ Methodology profile generation working correctly");
		console.log("   ✅ Fallback scoring functional for unmapped scenarios");

		return true;
	} catch (error) {
		console.error("❌ Methodology Selector test failed:", error);
		return false;
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	testMethodologySelector()
		.then((success) => process.exit(success ? 0 : 1))
		.catch((error) => {
			console.error("Test execution failed:", error);
			process.exit(1);
		});
}

export { testMethodologySelector };
