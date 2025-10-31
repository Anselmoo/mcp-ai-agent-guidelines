import { designAssistant } from "./dist/tools/design/design-assistant.js";

async function testContextAware() {
	console.log("\n=== Test 1: TypeScript Backend ===");
	const result1 = await designAssistant.processRequest({
		action: "generate-context-aware-guidance",
		sessionId: "test-1",
		content:
			"This is a TypeScript Node.js backend service with Express framework, implementing REST APIs with middleware, dependency injection, and modularization patterns",
	});
	console.log("Success:", result1.success);
	console.log("Language:", result1.data?.detectedLanguage);
	console.log("Framework:", result1.data?.detectedFramework);
	console.log(
		"Has SOLID principles:",
		result1.artifacts[0]?.content.includes("SOLID Principles"),
	);
	console.log(
		"Has middleware pattern:",
		result1.artifacts[0]?.content.includes("Middleware"),
	);
	console.log(
		"Has dependency injection:",
		result1.artifacts[0]?.content.includes("dependency injection"),
	);

	console.log("\n=== Test 2: React Component Library ===");
	const result2 = await designAssistant.processRequest({
		action: "generate-context-aware-guidance",
		sessionId: "test-2",
		content:
			"This is a React component library with functional components, hooks like useState and useEffect, and JSX templates",
	});
	console.log("Success:", result2.success);
	console.log("Language:", result2.data?.detectedLanguage);
	console.log("Framework:", result2.data?.detectedFramework);
	console.log(
		"Has Atomic Design:",
		result2.artifacts[0]?.content.includes("Atomic Design"),
	);
	console.log(
		"Has hooks best practices:",
		result2.artifacts[0]?.content.includes("hooks") ||
			result2.artifacts[0]?.content.includes("Hook"),
	);
	console.log(
		"Has accessibility:",
		result2.artifacts[0]?.content.includes("accessibility") ||
			result2.artifacts[0]?.content.includes("ARIA"),
	);

	console.log("\n=== Test 3: Python Django ===");
	const result3 = await designAssistant.processRequest({
		action: "generate-context-aware-guidance",
		sessionId: "test-3",
		content:
			"This is a Python Django REST API with models.Model, view classes, and Django ORM",
	});
	console.log("Success:", result3.success);
	console.log("Language:", result3.data?.detectedLanguage);
	console.log("Framework:", result3.data?.detectedFramework);
	console.log(
		"Has Python SOLID:",
		result3.artifacts[0]?.content.includes("SOLID"),
	);
	console.log(
		"Has Django patterns:",
		result3.artifacts[0]?.content.includes("Django") ||
			result3.artifacts[0]?.content.includes("MVT"),
	);
}

testContextAware().catch(console.error);
