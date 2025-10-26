import { describe, expect, it } from "vitest";
import { codeAnalysisPromptBuilder } from "../../src/tools/prompt/code-analysis-prompt-builder.js";
import { debuggingAssistantPromptBuilder } from "../../src/tools/prompt/debugging-assistant-prompt-builder.js";

describe("prompt-specificity-enhancement", () => {
	describe("code-analysis-prompt-builder language-specific guidance", () => {
		it("should provide JavaScript-specific security guidance", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: "const sql = 'SELECT * FROM users WHERE id=' + userId;",
				focusArea: "security",
				language: "javascript",
			});

			const text = result.content[0].text;

			// Check for JavaScript-specific security checks
			expect(text).toContain("SQL Injection");
			expect(text).toContain("db.query");
			expect(text).toContain("XSS Vulnerabilities");
			expect(text).toContain("Prototype Pollution");
			expect(text).toContain("eval()");
		});

		it("should provide Python-specific security guidance", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: "cursor.execute(f'SELECT * FROM users WHERE id={user_id}')",
				focusArea: "security",
				language: "python",
			});

			const text = result.content[0].text;

			// Check for Python-specific security checks
			expect(text).toContain("SQL Injection");
			expect(text).toContain("cursor.execute");
			expect(text).toContain("Command Injection");
			expect(text).toContain("os.system()");
			expect(text).toContain("Pickle Deserialization");
		});

		it("should provide JavaScript-specific performance guidance", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: "array.forEach(item => process(item));",
				focusArea: "performance",
				language: "javascript",
			});

			const text = result.content[0].text;

			// Check for JavaScript-specific performance checks
			expect(text).toContain("Array Operations");
			expect(text).toContain("DOM Manipulation");
			expect(text).toContain("Promise.all()");
			expect(text).toContain("Closures");
		});

		it("should provide Python-specific performance guidance", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: "result = [x * 2 for x in range(1000000)]",
				focusArea: "performance",
				language: "python",
			});

			const text = result.content[0].text;

			// Check for Python-specific performance checks
			expect(text).toContain("List Comprehensions");
			expect(text).toContain("String Concatenation");
			expect(text).toContain("join()");
			expect(text).toContain("Pandas Operations");
		});

		it("should include few-shot examples for JavaScript security", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: "const query = 'SELECT * FROM users';",
				focusArea: "security",
				language: "javascript",
			});

			const text = result.content[0].text;

			// Check for few-shot examples
			expect(text).toContain("Few-Shot Examples");
			expect(text).toContain("Vulnerable Code:");
			expect(text).toContain("**Issue:**");
			expect(text).toContain("**Severity:**");
			expect(text).toContain("**Fix:**");
		});

		it("should include few-shot examples for TypeScript security", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: "const data: any = userInput;",
				focusArea: "security",
				language: "typescript",
			});

			const text = result.content[0].text;

			// TypeScript should get JavaScript examples
			expect(text).toContain("Few-Shot Examples");
			expect(text).toContain("SQL Injection Vulnerability");
		});

		it("should include few-shot examples for Python security", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: "query = f'SELECT * FROM users WHERE id={uid}'",
				focusArea: "security",
				language: "python",
			});

			const text = result.content[0].text;

			// Check for Python-specific examples
			expect(text).toContain("Few-Shot Examples");
			expect(text).toContain("f-string formatting");
			expect(text).toContain("subprocess.run");
		});

		it("should not include few-shot examples for performance focus", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: "for (let i = 0; i < arr.length; i++) {}",
				focusArea: "performance",
				language: "javascript",
			});

			const text = result.content[0].text;

			// No few-shot examples for performance
			expect(text).not.toContain("Few-Shot Examples");
		});

		it("should provide generic guidance for unsupported languages", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: 'fn main() { println!("Hello"); }',
				focusArea: "security",
				language: "rust",
			});

			const text = result.content[0].text;

			// Check for Rust-specific checks
			expect(text).toContain("Unsafe Blocks");
			expect(text).toContain("unwrap()");
		});

		it("should include severity levels in output format", async () => {
			const result = await codeAnalysisPromptBuilder({
				codebase: "test code",
				focusArea: "security",
				language: "javascript",
			});

			const text = result.content[0].text;

			expect(text).toContain("CRITICAL, HIGH, MEDIUM, LOW");
		});
	});

	describe("debugging-assistant-prompt-builder context-specific guidance", () => {
		it("should provide memory leak specific guidance", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "Memory leak causing application to crash",
				context: "Node.js application",
			});

			const text = result.content[0].text;

			// Check for memory leak specific guidance
			expect(text).toContain("Specific Guidance for Memory Leak Issues");
			expect(text).toContain("Event Listeners Not Removed");
			expect(text).toContain("Global References");
			expect(text).toContain("heap snapshots");
		});

		it("should provide Node.js-specific guidance for memory leaks", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "Out of memory error",
				context: "Express server with MongoDB",
			});

			const text = result.content[0].text;

			// Check for Node.js-specific checks
			expect(text).toContain("Node.js-Specific Checks");
			expect(text).toContain("Database Connections");
			expect(text).toContain("Stream Handling");
		});

		it("should provide performance issue specific guidance", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "API responses are very slow",
				context: "REST API with database queries",
			});

			const text = result.content[0].text;

			// Check for performance specific guidance
			expect(text).toContain("Specific Guidance for Performance Issues");
			expect(text).toContain("Identify the Bottleneck");
			expect(text).toContain("database query performance");
			expect(text).toContain("N+1 queries");
		});

		it("should provide database issue specific guidance", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "Database deadlock detected",
				context: "PostgreSQL database",
			});

			const text = result.content[0].text;

			// Check for database specific guidance
			expect(text).toContain("Specific Guidance for Database Issues");
			expect(text).toContain("Connection Pool Exhaustion");
			expect(text).toContain("Deadlocks");
		});

		it("should provide concurrency issue specific guidance", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "Race condition in user registration",
				context: "Concurrent requests",
			});

			const text = result.content[0].text;

			// Check for concurrency specific guidance
			expect(text).toContain("Specific Guidance for Concurrency Issues");
			expect(text).toContain("Race Conditions");
			expect(text).toContain("atomic operations");
		});

		it("should provide API/network issue specific guidance", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "API requests failing intermittently",
				context: "HTTP client making requests",
			});

			const text = result.content[0].text;

			// Check for API/network specific guidance
			expect(text).toContain("Specific Guidance for API/Network Issues");
			expect(text).toContain("CORS issues");
			expect(text).toContain("Rate limiting");
		});

		it("should include production-specific checklist items", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "Error in production",
				context: "Production environment with monitoring",
			});

			const text = result.content[0].text;

			// Check for production-specific steps
			expect(text).toContain("Production-Specific Steps");
			expect(text).toContain("monitoring dashboards");
			expect(text).toContain("recent deployments");
		});

		it("should include browser-specific checklist items", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "JavaScript error",
				context: "Frontend browser application",
			});

			const text = result.content[0].text;

			// Check for browser-specific steps
			expect(text).toContain("Browser/Frontend Steps");
			expect(text).toContain("browser console");
			expect(text).toContain("different browsers");
		});

		it("should include mobile-specific checklist items", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "App crashes on certain devices",
				context: "Mobile iOS application",
			});

			const text = result.content[0].text;

			// Check for mobile-specific steps
			expect(text).toContain("Mobile-Specific Steps");
			expect(text).toContain("different devices");
			expect(text).toContain("crash logs");
		});

		it("should include enhanced problem analysis", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "Intermittent timeout errors",
			});

			const text = result.content[0].text;

			// Check for enhanced problem analysis
			expect(text).toContain("Reproducibility");
			expect(text).toContain("Recent Changes");
			expect(text).toContain("Expected Outcomes");
		});

		it("should include comprehensive solution format", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "Application error",
			});

			const text = result.content[0].text;

			// Check for comprehensive solution format
			expect(text).toContain("Primary Solution");
			expect(text).toContain("Alternative Approaches");
			expect(text).toContain("Estimated Effort");
			expect(text).toContain("Rollback plan");
		});

		it("should handle multiple context keywords", async () => {
			const result = await debuggingAssistantPromptBuilder({
				errorDescription: "Memory leak detected",
				context: "Production Node.js server with database",
			});

			const text = result.content[0].text;

			// Should include memory leak guidance (first matching pattern)
			expect(text).toContain("Memory Leak Issues");
			expect(text).toContain("Production-Specific");
		});
	});
});
