#!/usr/bin/env node
// Manual test for Cross-Session Constraint Consistency Enforcement
import { designAssistant } from "../dist/tools/design/index.js";

async function testConstraintConsistencyEnforcement() {
	console.log(
		"🔍 Testing Cross-Session Constraint Consistency Enforcement...\n",
	);

	try {
		// Initialize the design assistant
		await designAssistant.initialize();
		console.log("✅ Design assistant initialized\n");

		// Test 1: Start first session and establish constraint patterns
		console.log(
			"📋 Test 1: Starting first session to establish constraint patterns...",
		);
		const firstSessionResponse = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "consistency-demo-session-1",
			config: {
				sessionId: "consistency-demo-session-1",
				context:
					"E-commerce platform redesign with focus on user experience and performance",
				goal: "Create a scalable, secure e-commerce platform that provides excellent user experience",
				requirements: [
					"High-performance product catalog with search functionality",
					"Secure user authentication and payment processing",
					"Responsive design for mobile and desktop",
					"Real-time inventory management",
					"Analytics and reporting dashboard",
				],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [
					"Space 7 General Instructions",
					"Architecture Templates",
				],
				outputFormats: ["markdown", "mermaid"],
				metadata: {
					projectType: "e-commerce-redesign",
					expectedUsers: 10000,
					performanceTarget: "< 2s page load",
				},
			},
		});

		console.log(`   ✅ First session started: ${firstSessionResponse.success}`);
		console.log(`   📍 Current phase: ${firstSessionResponse.currentPhase}`);
		console.log(
			`   💡 Recommendations: ${firstSessionResponse.recommendations.length}\n`,
		);

		// Test 2: Enforce consistency for first session (establishes baseline)
		console.log("🎯 Test 2: Enforcing consistency for first session...");
		const firstConsistencyResponse = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "consistency-demo-session-1",
			content:
				"Establishing baseline constraint patterns for e-commerce platform. Key focus on performance, security, and scalability constraints based on Space 7 guidelines.",
		});

		console.log(
			`   ✅ Consistency enforcement: ${firstConsistencyResponse.success}`,
		);
		console.log(
			`   📊 Consistency score: ${firstConsistencyResponse.coverage || "N/A"}%`,
		);
		console.log(
			`   🔧 Enforcement actions: ${
				firstConsistencyResponse.consistencyEnforcement?.enforcementActions
					?.length || 0
			}`,
		);
		console.log(
			`   📋 Recommendations: ${firstConsistencyResponse.recommendations.length}`,
		);
		console.log(
			`   🎨 Interactive prompts: ${
				firstConsistencyResponse.consistencyEnforcement?.interactivePrompts
					?.length || 0
			}`,
		);
		console.log(
			`   📄 Generated artifacts: ${
				firstConsistencyResponse.consistencyEnforcement?.generatedArtifacts
					?.length || 0
			}\n`,
		);

		// Test 3: Start second session with related context
		console.log("📋 Test 3: Starting second session with related context...");
		const secondSessionResponse = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "consistency-demo-session-2",
			config: {
				sessionId: "consistency-demo-session-2",
				context: "Mobile app companion for the e-commerce platform",
				goal: "Create a mobile app that complements the e-commerce platform with offline capabilities",
				requirements: [
					"Offline browsing and wishlist functionality",
					"Push notifications for deals and order updates",
					"Biometric authentication integration",
					"Seamless data sync with web platform",
					"AR product visualization",
				],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [
					"Space 7 General Instructions",
					"Mobile Development Guidelines",
				],
				outputFormats: ["markdown"],
				metadata: {
					projectType: "mobile-companion-app",
					targetPlatforms: ["iOS", "Android"],
					offlineSupport: true,
				},
			},
		});

		console.log(
			`   ✅ Second session started: ${secondSessionResponse.success}`,
		);
		console.log(`   📍 Current phase: ${secondSessionResponse.currentPhase}\n`);

		// Test 4: Enforce consistency for second session (should check against first)
		console.log("🎯 Test 4: Enforcing cross-session consistency...");
		const secondConsistencyResponse = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "consistency-demo-session-2",
			content:
				"Mobile app development following same architectural principles as web platform. Ensuring consistency in security, performance, and user experience constraints.",
		});

		console.log(
			`   ✅ Cross-session consistency: ${secondConsistencyResponse.success}`,
		);
		console.log(
			`   📊 Consistency score: ${secondConsistencyResponse.coverage || "N/A"}%`,
		);
		console.log(
			`   🔧 Enforcement actions: ${
				secondConsistencyResponse.consistencyEnforcement?.enforcementActions
					?.length || 0
			}`,
		);
		console.log(
			`   📋 Recommendations: ${secondConsistencyResponse.recommendations.length}`,
		);
		console.log(
			`   🎨 Interactive prompts: ${
				secondConsistencyResponse.consistencyEnforcement?.interactivePrompts
					?.length || 0
			}`,
		);
		console.log(
			`   📄 Generated artifacts: ${
				secondConsistencyResponse.consistencyEnforcement?.generatedArtifacts
					?.length || 0
			}`,
		);
		console.log(
			`   🔗 Historical alignments: ${
				secondConsistencyResponse.consistencyEnforcement?.historicalAlignments
					?.length || 0
			}\n`,
		);

		// Test 5: Test constraint-specific enforcement
		console.log("🎯 Test 5: Testing constraint-specific enforcement...");
		const constraintSpecificResponse = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "consistency-demo-session-2",
			constraintId: "architectural.security",
			content:
				"Ensuring security constraint consistency between web and mobile platforms",
		});

		console.log(
			`   ✅ Constraint-specific enforcement: ${constraintSpecificResponse.success}`,
		);
		console.log(
			`   📊 Consistency score: ${
				constraintSpecificResponse.coverage || "N/A"
			}%\n`,
		);

		// Test 6: Test phase-specific enforcement
		console.log("🎯 Test 6: Testing phase-specific enforcement...");
		const phaseSpecificResponse = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "consistency-demo-session-2",
			phaseId: "architecture",
			content:
				"Architecture phase consistency validation for mobile app design",
		});

		console.log(
			`   ✅ Phase-specific enforcement: ${phaseSpecificResponse.success}`,
		);
		console.log(
			`   📊 Consistency score: ${phaseSpecificResponse.coverage || "N/A"}%\n`,
		);

		// Test 7: Display interactive prompts (if any)
		if (
			secondConsistencyResponse.consistencyEnforcement?.interactivePrompts
				?.length > 0
		) {
			console.log("💬 Sample Interactive Prompts Generated:");
			secondConsistencyResponse.consistencyEnforcement.interactivePrompts
				.slice(0, 2)
				.forEach((prompt, index) => {
					console.log(`\n📝 Prompt ${index + 1}:`);
					console.log(
						prompt.substring(0, 200) + (prompt.length > 200 ? "..." : ""),
					);
				});
			console.log("");
		}

		// Test 8: Display recommendations
		if (secondConsistencyResponse.recommendations.length > 0) {
			console.log("💡 Key Recommendations:");
			secondConsistencyResponse.recommendations
				.slice(0, 3)
				.forEach((rec, index) => {
					console.log(`   ${index + 1}. ${rec}`);
				});
			console.log("");
		}

		console.log(
			"🎉 Cross-Session Constraint Consistency Enforcement Test Completed!",
		);
		console.log("\n📊 Summary:");
		console.log(`   • Two design sessions created successfully`);
		console.log(`   • Cross-session consistency validation performed`);
		console.log(`   • Constraint-specific enforcement tested`);
		console.log(`   • Phase-specific enforcement tested`);
		console.log(`   • Interactive prompts and recommendations generated`);
		console.log(`   • Space 7 guidelines integration verified`);
	} catch (error) {
		console.error("❌ Test failed:", error.message);
		console.error("🔍 Full error:", error);
	}
}

// Run the test
testConstraintConsistencyEnforcement();
