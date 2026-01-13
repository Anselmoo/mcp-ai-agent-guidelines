#!/usr/bin/env node

/**
 * Demo: Spec-Kit Workflow
 *
 * Demonstrates the complete Spec-Kit methodology:
 * 1. Generate spec from requirements
 * 2. Validate against constitution
 * 3. Generate tasks
 * 4. Track progress
 */

import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../dist/tools/shared/logger.js";
import { specKitGenerator } from "../dist/tools/speckit-generator.js";
import { validateSpec } from "../dist/tools/validate-spec.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runDemo() {
	logger.info("Starting Spec-Kit Demo", { separator: "=".repeat(60) });

	// Sample requirements
	const requirements = {
		title: "Demo Feature: User Authentication",
		overview: "Implement secure user authentication system",
		objectives: [
			{ description: "Enable secure login", priority: "high" },
			{ description: "Support password reset", priority: "medium" },
			{ description: "Implement session management", priority: "high" },
		],
		requirements: [
			{
				description: "Users can login with email/password",
				type: "functional",
				priority: "high",
			},
			{
				description: "Users can reset password via email",
				type: "functional",
				priority: "medium",
			},
			{
				description: "Sessions expire after 24 hours",
				type: "functional",
				priority: "medium",
			},
			{
				description: "Passwords must be hashed with bcrypt",
				type: "non-functional",
				priority: "high",
			},
			{
				description: "Login attempts rate-limited",
				type: "non-functional",
				priority: "high",
			},
		],
		acceptanceCriteria: [
			"All endpoints return proper HTTP status codes",
			"Invalid credentials return 401",
			"Password reset emails sent within 5 seconds",
		],
		outOfScope: [
			"OAuth/social login",
			"Multi-factor authentication",
			"Admin user management",
		],
		constitutionPath: join(__dirname, "../plan-v0.13.x/CONSTITUTION.md"),
		validateAgainstConstitution: true,
	};

	// Step 1: Generate Spec-Kit artifacts
	logger.info("Step 1: Generating Spec-Kit artifacts", { step: 1 });

	const result = await specKitGenerator(requirements);
	logger.info("Generated artifacts", {
		artifacts: [
			"spec.md",
			"plan.md",
			"tasks.md",
			"progress.md",
			"adr.md",
			"roadmap.md",
			"README.md",
		],
	});

	// Save artifacts
	const outputDir = join(__dirname, "output");
	await fs.mkdir(outputDir, { recursive: true });

	// Parse result and save files
	// Extract text from MCP response format
	const resultText = Array.isArray(result.content)
		? result.content[0]?.text || result.content[0]
		: result.content;

	const artifacts = parseArtifacts(resultText);

	// Validate that required artifacts were parsed
	const requiredArtifacts = ["spec.md", "plan.md", "tasks.md", "progress.md"];
	const missingArtifacts = requiredArtifacts.filter((name) => !artifacts[name]);

	if (missingArtifacts.length > 0) {
		throw new Error(
			`Failed to parse required artifacts: ${missingArtifacts.join(", ")}. ` +
				`Available artifacts: ${Object.keys(artifacts).join(", ")}`,
		);
	}

	for (const [name, content] of Object.entries(artifacts)) {
		const outputPath = join(outputDir, `demo-speckit-${name}`);
		await fs.writeFile(outputPath, content);
		logger.info("Saved artifact", { path: outputPath });
	}

	// Step 2: Validate spec
	logger.info("Step 2: Validating spec against constitution", { step: 2 });

	const validation = await validateSpec({
		specContent: artifacts["spec.md"],
		constitutionPath: requirements.constitutionPath,
		outputFormat: "summary",
	});

	// Extract validation result from MCP response
	const validationText = Array.isArray(validation.content)
		? validation.content[0]?.text || validation.content[0]
		: validation.content;

	logger.info("Validation result", { result: validationText });

	// Step 3: Show initial progress
	logger.info("Step 3: Showing initial progress", { step: 3 });

	// Note: The generated task IDs (T001, T002) don't match the parser pattern
	// which expects IDs like TASK-001 or P4-019 with dashes.
	// So we'll demonstrate by showing the initial progress structure instead.

	logger.info("Progress file generated", {
		file: "progress.md",
		note: "Task tracking ready - update with task completions as work progresses",
	});

	// Display a sample of the generated progress, if available
	const progressContent = artifacts["progress.md"];
	if (typeof progressContent === "string") {
		const progressPreview = progressContent.substring(0, 300);
		logger.info("Progress preview", { preview: progressPreview });
	} else {
		logger.warn("Progress artifact not available for preview", {
			artifactKeys: Object.keys(artifacts),
		});
	}

	logger.info("Demo complete! Check demos/output/ for generated files.", {
		separator: "=".repeat(60),
	});
}

function parseArtifacts(result) {
	// Parse the multi-document response
	const artifacts = {};

	// Extract artifacts from markdown code blocks
	// Format is: ### path/filename.md
	const filePatterns = [
		{
			name: "spec.md",
			pattern: /### [^/]*\/spec\.md\s+```(?:markdown)?\s+([\s\S]*?)```/i,
		},
		{
			name: "plan.md",
			pattern: /### [^/]*\/plan\.md\s+```(?:markdown)?\s+([\s\S]*?)```/i,
		},
		{
			name: "tasks.md",
			pattern: /### [^/]*\/tasks\.md\s+```(?:markdown)?\s+([\s\S]*?)```/i,
		},
		{
			name: "progress.md",
			pattern: /### [^/]*\/progress\.md\s+```(?:markdown)?\s+([\s\S]*?)```/i,
		},
		{
			name: "adr.md",
			pattern: /### [^/]*\/adr\.md\s+```(?:markdown)?\s+([\s\S]*?)```/i,
		},
		{
			name: "roadmap.md",
			pattern: /### [^/]*\/roadmap\.md\s+```(?:markdown)?\s+([\s\S]*?)```/i,
		},
		{
			name: "README.md",
			pattern: /### [^/]*\/README\.md\s+```(?:markdown)?\s+([\s\S]*?)```/i,
		},
	];

	for (const { name, pattern } of filePatterns) {
		const match = result.match(pattern);
		if (match?.[1]) {
			artifacts[name] = match[1].trim();
		}
	}

	return artifacts;
}

runDemo().catch((error) => {
	logger.error("Demo failed", { error: error.message, stack: error.stack });
	process.exit(1);
});
