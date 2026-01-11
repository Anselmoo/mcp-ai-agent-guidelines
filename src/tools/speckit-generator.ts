/**
 * SpecKit Generator Tool
 *
 * Dedicated MCP tool for generating Spec-Kit artifacts directly,
 * bypassing design-assistant workflow for streamlined spec generation.
 *
 * @module tools/speckit-generator
 */

import { promises as fs } from "node:fs";
import { polyglotGateway } from "../gateway/polyglot-gateway.js";
import { OutputApproach } from "../strategies/output-strategy.js";
import { parseConstitution } from "../strategies/speckit/constitution-parser.js";
import type { Constitution } from "../strategies/speckit/types.js";
import type { McpResponse } from "./shared/error-handler.js";
import { createMcpResponse } from "./shared/response-utils.js";

/**
 * SpecKit Generator request structure.
 *
 * Defines the inputs needed to generate a complete Spec-Kit
 * with optional constitutional validation.
 *
 * @interface SpecKitGeneratorRequest
 */
export interface SpecKitGeneratorRequest {
	/** Specification title */
	title: string;

	/** High-level overview of the feature/project */
	overview: string;

	/** Strategic objectives */
	objectives: Array<{ description: string; priority?: string }>;

	/** Functional and non-functional requirements */
	requirements: Array<{
		description: string;
		type?: "functional" | "non-functional";
		priority?: string;
	}>;

	/** Acceptance criteria for completion (optional) */
	acceptanceCriteria?: string[];

	/** Explicitly out-of-scope items (optional) */
	outOfScope?: string[];

	/** Path to CONSTITUTION.md file (optional) */
	constitutionPath?: string;

	/** Whether to validate against constitution before rendering (optional) */
	validateAgainstConstitution?: boolean;
}

/**
 * Generate Spec-Kit artifacts from requirements.
 *
 * Creates a complete set of Spec-Kit documents (spec.md, plan.md, tasks.md,
 * progress.md, adr.md, roadmap.md, README.md) from the provided requirements.
 *
 * Optionally loads and validates against a CONSTITUTION.md file to ensure
 * generated artifacts comply with project principles and constraints.
 *
 * @param request - Spec-Kit generation request with requirements
 * @returns MCP response with all generated documents
 * @throws {Error} If constitution file cannot be loaded or parsing fails
 *
 * @example
 * ```typescript
 * const result = await specKitGenerator({
 *   title: "User Authentication System",
 *   overview: "Implement OAuth2 authentication flow",
 *   objectives: [
 *     { description: "Secure user authentication", priority: "high" }
 *   ],
 *   requirements: [
 *     { description: "Support Google OAuth", type: "functional", priority: "high" },
 *     { description: "Response time < 200ms", type: "non-functional", priority: "medium" }
 *   ],
 *   acceptanceCriteria: ["Users can log in with Google"],
 *   constitutionPath: "./CONSTITUTION.md",
 *   validateAgainstConstitution: true
 * });
 * ```
 */
export async function specKitGenerator(
	request: SpecKitGeneratorRequest,
): Promise<McpResponse> {
	// Load constitution if provided
	let constitution: Constitution | undefined;
	if (request.constitutionPath) {
		try {
			const content = await fs.readFile(request.constitutionPath, "utf-8");
			constitution = parseConstitution(content);
		} catch (error) {
			throw new Error(
				`Failed to load constitution from ${request.constitutionPath}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// Create domain result from request
	// Map request to SessionState-like structure for SpecKitStrategy
	const domainResult = {
		id: `speckit-${Date.now()}`,
		phase: "implementation",
		status: "active",
		config: {
			goal: request.title,
			requirements: request.requirements.map((r) => r.description),
		},
		context: {
			title: request.title,
			overview: request.overview,
			objectives: request.objectives.map((o) => o.description),
			requirements: request.requirements.map((r) => r.description),
			acceptanceCriteria: request.acceptanceCriteria ?? [],
			outOfScope: request.outOfScope ?? [],
		},
		history: [],
		phases: {},
	};

	// Generate artifacts via gateway
	const artifacts = polyglotGateway.render({
		domainResult,
		domainType: "SessionState",
		approach: OutputApproach.SPECKIT,
		options: {
			constitution,
			includeConstitutionalConstraints: !!constitution,
			validateBeforeRender: request.validateAgainstConstitution,
		} as Record<string, unknown>,
	});

	// Format response with all documents
	const allDocs = [artifacts.primary, ...(artifacts.secondary ?? [])];

	const content = `# Spec-Kit Generated

## Generated Files

${allDocs
	.map(
		(doc) => `### ${doc.name}

\`\`\`${doc.format}
${doc.content}
\`\`\`
`,
	)
	.join("\n")}

---
*Generated ${new Date().toISOString()}*
${constitution ? "\n*Validated against CONSTITUTION.md*" : ""}
`;

	return createMcpResponse({ content });
}
