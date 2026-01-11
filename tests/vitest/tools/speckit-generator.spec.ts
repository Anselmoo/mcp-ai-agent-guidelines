/**
 * Unit tests for speckit-generator tool
 */

import { afterEach, describe, expect, it } from "vitest";
import type { SpecKitGeneratorRequest } from "../../../src/tools/speckit-generator.js";
import { specKitGenerator } from "../../../src/tools/speckit-generator.js";

describe("specKitGenerator", () => {
	const tempFiles: string[] = [];

	afterEach(async () => {
		// Cleanup temporary files
		const fs = await import("node:fs/promises");
		for (const file of tempFiles) {
			try {
				await fs.unlink(file);
			} catch {
				// Ignore errors for non-existent files
			}
		}
		tempFiles.length = 0;
	});

	describe("basic functionality", () => {
		it("should generate spec-kit with required fields only", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "User Authentication System",
				overview: "Implement OAuth2 authentication flow",
				objectives: [
					{ description: "Secure user authentication", priority: "high" },
				],
				requirements: [
					{
						description: "Support Google OAuth",
						type: "functional",
						priority: "high",
					},
				],
			};

			const result = await specKitGenerator(request);

			expect(result).toBeDefined();
			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Spec-Kit Generated");
			expect(result.content[0].text).toContain("README.md");
			expect(result.content[0].text).toContain("spec.md");
			expect(result.content[0].text).toContain("plan.md");
			expect(result.content[0].text).toContain("tasks.md");
			expect(result.content[0].text).toContain("progress.md");
		});

		it("should include title in generated documents", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Payment Processing Module",
				overview: "Build secure payment processing",
				objectives: [
					{ description: "Process payments securely", priority: "high" },
				],
				requirements: [
					{
						description: "Integrate with Stripe",
						type: "functional",
						priority: "high",
					},
				],
			};

			const result = await specKitGenerator(request);

			expect(result.content[0].text).toContain("Payment Processing Module");
		});

		it("should handle multiple objectives", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Analytics Dashboard",
				overview: "Real-time analytics dashboard",
				objectives: [
					{
						description: "Display real-time metrics",
						priority: "high",
					},
					{
						description: "Support data export",
						priority: "medium",
					},
					{
						description: "Provide custom visualizations",
						priority: "low",
					},
				],
				requirements: [
					{
						description: "WebSocket connection",
						type: "functional",
						priority: "high",
					},
				],
			};

			const result = await specKitGenerator(request);

			expect(result.content[0].text).toContain("Display real-time metrics");
			expect(result.content[0].text).toContain("Support data export");
			expect(result.content[0].text).toContain("Provide custom visualizations");
		});

		it("should handle multiple requirements with different types", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "API Gateway",
				overview: "Build high-performance API gateway",
				objectives: [
					{ description: "Route requests efficiently", priority: "high" },
				],
				requirements: [
					{
						description: "Support REST and GraphQL",
						type: "functional",
						priority: "high",
					},
					{
						description: "Response time < 100ms",
						type: "non-functional",
						priority: "high",
					},
					{
						description: "Handle 10k requests/sec",
						type: "non-functional",
						priority: "medium",
					},
				],
			};

			const result = await specKitGenerator(request);

			expect(result.content[0].text).toContain("Support REST and GraphQL");
			expect(result.content[0].text).toContain("Response time < 100ms");
			expect(result.content[0].text).toContain("Handle 10k requests/sec");
		});
	});

	describe("optional fields", () => {
		it("should include acceptance criteria when provided", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Search Feature",
				overview: "Implement full-text search",
				objectives: [{ description: "Fast search", priority: "high" }],
				requirements: [
					{
						description: "Full-text search with Elasticsearch",
						type: "functional",
						priority: "high",
					},
				],
				acceptanceCriteria: [
					"Users can search by keyword",
					"Results returned in < 500ms",
					"Search supports fuzzy matching",
				],
			};

			const result = await specKitGenerator(request);

			expect(result.content[0].text).toContain("Users can search by keyword");
			expect(result.content[0].text).toContain("Results returned in < 500ms");
			expect(result.content[0].text).toContain(
				"Search supports fuzzy matching",
			);
		});

		it("should include out-of-scope items when provided", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Notification System",
				overview: "Send user notifications",
				objectives: [
					{ description: "Reliable notifications", priority: "high" },
				],
				requirements: [
					{
						description: "Email notifications",
						type: "functional",
						priority: "high",
					},
				],
				outOfScope: [
					"SMS notifications",
					"Push notifications",
					"In-app messaging",
				],
			};

			const result = await specKitGenerator(request);

			expect(result.content[0].text).toContain("SMS notifications");
			expect(result.content[0].text).toContain("Push notifications");
			expect(result.content[0].text).toContain("In-app messaging");
		});

		it("should work without optional acceptance criteria and out-of-scope", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Minimal Spec",
				overview: "Minimal specification example",
				objectives: [{ description: "Basic feature", priority: "high" }],
				requirements: [
					{ description: "Basic requirement", type: "functional" },
				],
			};

			const result = await specKitGenerator(request);

			expect(result).toBeDefined();
			expect(result.content[0].text).toContain("Spec-Kit Generated");
		});
	});

	describe("constitution support", () => {
		it("should handle missing constitution file gracefully", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Test Spec",
				overview: "Test overview",
				objectives: [{ description: "Test objective", priority: "high" }],
				requirements: [{ description: "Test requirement", type: "functional" }],
				constitutionPath: "/non-existent/CONSTITUTION.md",
			};

			await expect(specKitGenerator(request)).rejects.toThrow(
				/Failed to load constitution/,
			);
		});

		it("should work without constitution path", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "No Constitution Spec",
				overview: "Spec without constitution",
				objectives: [{ description: "Basic objective", priority: "high" }],
				requirements: [
					{ description: "Basic requirement", type: "functional" },
				],
			};

			const result = await specKitGenerator(request);

			expect(result).toBeDefined();
			expect(result.content[0].text).not.toContain(
				"Validated against CONSTITUTION.md",
			);
		});

		it("should load and validate with constitution when path provided", async () => {
			// Create a temporary constitution file
			const fs = await import("node:fs/promises");
			const path = await import("node:path");
			const tempConstitution = path.join(
				process.cwd(),
				".tmp-test-constitution.md",
			);
			tempFiles.push(tempConstitution);

			const constitutionContent = `# Test Constitution

> Applies to v1.0.0

## Principles

### 1. Security First

All features must prioritize security.

### 2. Performance Matters

Response times must be optimized.

## Constraints

### C1: Authentication Required

All endpoints must require authentication.

### C2: Rate Limiting

Implement rate limiting on all public APIs.
`;

			await fs.mkdir(path.dirname(tempConstitution), { recursive: true });
			await fs.writeFile(tempConstitution, constitutionContent, "utf-8");

			const request: SpecKitGeneratorRequest = {
				title: "API with Constitution",
				overview: "API following constitutional constraints",
				objectives: [{ description: "Secure and fast API", priority: "high" }],
				requirements: [
					{
						description: "REST API endpoints",
						type: "functional",
						priority: "high",
					},
				],
				constitutionPath: tempConstitution,
				validateAgainstConstitution: true,
			};

			const result = await specKitGenerator(request);

			expect(result).toBeDefined();
			expect(result.content[0].text).toContain(
				"Validated against CONSTITUTION.md",
			);
		});
	});

	describe("generated document structure", () => {
		it("should generate all expected documents", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Complete Spec",
				overview: "Full specification with all features",
				objectives: [
					{ description: "Comprehensive coverage", priority: "high" },
				],
				requirements: [
					{
						description: "Complete implementation",
						type: "functional",
						priority: "high",
					},
				],
				acceptanceCriteria: ["All features working"],
				outOfScope: ["Future enhancements"],
			};

			const result = await specKitGenerator(request);
			const text = result.content[0].text;

			// Check for all expected documents
			expect(text).toContain("README.md");
			expect(text).toContain("spec.md");
			expect(text).toContain("plan.md");
			expect(text).toContain("tasks.md");
			expect(text).toContain("progress.md");
			expect(text).toContain("adr.md");
			expect(text).toContain("roadmap.md");
		});

		it("should include timestamp in output", async () => {
			const request: SpecKitGeneratorRequest = {
				title: "Timestamped Spec",
				overview: "Spec with timestamp",
				objectives: [{ description: "Test timestamp", priority: "high" }],
				requirements: [{ description: "Test requirement", type: "functional" }],
			};

			const result = await specKitGenerator(request);

			expect(result.content[0].text).toMatch(/Generated \d{4}-\d{2}-\d{2}/);
		});
	});
});
