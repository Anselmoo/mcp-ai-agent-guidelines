#!/usr/bin/env node

/**
 * Demo: Context-Aware Design Guidance
 *
 * This demo showcases the design-assistant's ability to generate
 * context-aware design recommendations based on language, framework,
 * and code patterns. The feature includes:
 *
 * - Language detection (TypeScript, JavaScript, Python, Java, C#, Go, Rust)
 * - Framework detection (React, Angular, Vue, Express, Django, Spring Boot, etc.)
 * - SOLID principles tailored to each language
 * - Framework-specific architectural patterns
 * - Best practices and anti-patterns
 */

import { designAssistant } from "../dist/tools/design/design-assistant.js";

async function demoContextAwareGuidance() {
	console.log("\n=== Context-Aware Design Guidance Demo ===\n");

	// Demo 1: TypeScript Backend
	console.log("📝 Demo 1: TypeScript Node.js Backend with Express\n");
	const result1 = await designAssistant.processRequest({
		action: "generate-context-aware-guidance",
		sessionId: "demo-typescript-backend",
		content: `
This is a TypeScript Node.js backend service implementing a REST API with Express framework.
The application uses middleware for request validation, dependency injection for services,
and follows a layered architecture pattern (Controller → Service → Repository).
We're working on modularization and implementing proper error handling.
		`,
	});

	console.log("✅ Success:", result1.success);
	console.log("📊 Detected Language:", result1.data?.detectedLanguage);
	console.log("🔧 Detected Framework:", result1.data?.detectedFramework);
	console.log("\n📖 Recommendations Preview:");
	console.log(
		result1.artifacts[0]?.content.split("\n").slice(0, 30).join("\n") +
			"\n...\n",
	);

	// Demo 2: React Component Library
	console.log("\n📝 Demo 2: React Component Library\n");
	const result2 = await designAssistant.processRequest({
		action: "generate-context-aware-guidance",
		sessionId: "demo-react-components",
		content: `
This is a React component library with functional components using hooks like useState,
useEffect, and useCallback. We're implementing atomic design principles with atoms,
molecules, and organisms. The components need to be accessible and reusable.
		`,
	});

	console.log("✅ Success:", result2.success);
	console.log("📊 Detected Language:", result2.data?.detectedLanguage);
	console.log("🔧 Detected Framework:", result2.data?.detectedFramework);
	console.log("\n📖 Key Recommendations:");
	const reactGuidance = result2.artifacts[0]?.content;
	if (reactGuidance.includes("Atomic Design")) {
		console.log("  ✓ Atomic Design patterns detected");
	}
	if (reactGuidance.includes("accessibility")) {
		console.log("  ✓ Accessibility guidelines included");
	}
	if (reactGuidance.includes("hooks")) {
		console.log("  ✓ React hooks best practices provided");
	}

	// Demo 3: Python Django REST API
	console.log("\n📝 Demo 3: Python Django REST API\n");
	const result3 = await designAssistant.processRequest({
		action: "generate-context-aware-guidance",
		sessionId: "demo-django-api",
		content: `
This is a Python Django REST API with models.Model for database entities,
class-based views for request handling, and Django ORM for data access.
We need to improve our API design and follow Django best practices.
		`,
	});

	console.log("✅ Success:", result3.success);
	console.log("📊 Detected Language:", result3.data?.detectedLanguage);
	console.log("🔧 Detected Framework:", result3.data?.detectedFramework);
	console.log("\n📖 SOLID Principles for Python:");
	const djangoGuidance = result3.artifacts[0]?.content;
	const solidSection = djangoGuidance.match(
		/SOLID Principles for python:([\s\S]*?)(?=\n\*\*|$)/i,
	);
	if (solidSection) {
		console.log(
			solidSection[1]
				.split("\n")
				.filter((line) => line.trim())
				.slice(0, 5)
				.join("\n"),
		);
	}

	// Demo 4: Mixed Context - API + Database
	console.log("\n📝 Demo 4: Mixed Context (API + Database)\n");
	const result4 = await designAssistant.processRequest({
		action: "generate-context-aware-guidance",
		sessionId: "demo-mixed-context",
		content: `
This is a Spring Boot Java application implementing a REST API.
We have controllers handling HTTP requests, services containing business logic,
and repositories managing database entities with JPA. Need guidance on
error handling and state management patterns.
		`,
	});

	console.log("✅ Success:", result4.success);
	console.log("📊 Detected Language:", result4.data?.detectedLanguage);
	console.log("🔧 Detected Framework:", result4.data?.detectedFramework);
	console.log("\n📖 Context-Aware Guidance Categories:");
	const mixedGuidance = result4.artifacts[0]?.content;

	// Check which context-specific sections were generated
	const contexts = [];
	if (mixedGuidance.includes("API/Service Design")) {
		contexts.push("  ✓ API/Service Design patterns");
	}
	if (mixedGuidance.includes("Data Access Design")) {
		contexts.push("  ✓ Data Access patterns (Repository, Unit of Work)");
	}
	if (mixedGuidance.includes("Error Handling Design")) {
		contexts.push("  ✓ Error Handling strategies");
	}
	console.log(contexts.join("\n"));

	console.log("\n=== Demo Complete ===\n");
	console.log("📚 Summary:");
	console.log(
		"  • Languages supported: TypeScript, JavaScript, Python, Java, C#, Go, Rust",
	);
	console.log(
		"  • Frameworks detected: React, Angular, Vue, Express, Django, Spring Boot, Rails, etc.",
	);
	console.log("  • SOLID principles tailored to each language");
	console.log("  • Framework-specific architectural patterns");
	console.log(
		"  • Context-aware best practices (API, Database, State, Auth, etc.)",
	);
	console.log("\n✨ All demos executed successfully!\n");
}

demoContextAwareGuidance().catch((error) => {
	console.error("Demo failed:", error);
	process.exit(1);
});
