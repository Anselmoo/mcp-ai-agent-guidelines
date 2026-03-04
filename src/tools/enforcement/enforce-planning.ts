/**
 * enforce_planning MCP tool.
 * Validates Spec-Kit artifacts (spec.md and plan.md) before allowing code generation.
 * Implements HITL enforcement: code generation is blocked without approved planning docs.
 * @module
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";

// ============================================
// Schemas
// ============================================

export const enforcePlanningRequestSchema = z
	.object({
		projectPath: z.string().describe("Path to project root to validate"),
		planningDir: z
			.string()
			.optional()
			.describe(
				"Subdirectory containing spec.md and plan.md (relative to projectPath). Defaults to project root.",
			),
		requireApproval: z
			.boolean()
			.default(true)
			.describe(
				"Whether to require approval markers in spec.md (status: approved)",
			),
		requirePhases: z
			.boolean()
			.default(true)
			.describe("Whether to require phase definitions in plan.md"),
	})
	.describe("Request to enforce planning artifact compliance");

export type EnforcePlanningRequest = z.infer<
	typeof enforcePlanningRequestSchema
>;

// ============================================
// Types
// ============================================

export interface ArtifactCheck {
	exists: boolean;
	path: string;
	approved?: boolean;
	hasPhases?: boolean;
	issues: string[];
}

export interface EnforcePlanningResult {
	allowed: boolean;
	blockedReason?: string;
	specMd: ArtifactCheck;
	planMd: ArtifactCheck;
	summary: string;
}

// ============================================
// Core Logic
// ============================================

/** Check if a file contains an approval marker */
function hasApprovalMarker(content: string): boolean {
	return (
		/^\s*Status:\s*Approved/im.test(content) ||
		/^\s*approved:\s*true/im.test(content) ||
		/^\*\*Status\*\*:\s*Approved/im.test(content)
	);
}

/** Check if plan.md contains phase definitions */
function hasPhaseDefs(content: string): boolean {
	return (
		/##\s+Phase\s+\d/i.test(content) ||
		/\bPhase\s+\d+:/i.test(content) ||
		/\bp\d+-/i.test(content)
	);
}

function checkArtifact(
	filePath: string,
	options: { requireApproval?: boolean; requirePhases?: boolean },
): ArtifactCheck {
	const result: ArtifactCheck = {
		exists: false,
		path: filePath,
		issues: [],
	};

	if (!fs.existsSync(filePath)) {
		result.issues.push(`File not found: ${filePath}`);
		return result;
	}

	result.exists = true;
	const content = fs.readFileSync(filePath, "utf-8");

	if (options.requireApproval !== undefined) {
		result.approved = hasApprovalMarker(content);
		if (!result.approved) {
			result.issues.push(
				`spec.md is not approved. Add 'Status: Approved' to allow code generation.`,
			);
		}
	}

	if (options.requirePhases !== undefined) {
		result.hasPhases = hasPhaseDefs(content);
		if (!result.hasPhases) {
			result.issues.push(
				`plan.md has no phase definitions. Add '## Phase N' sections.`,
			);
		}
	}

	return result;
}

// ============================================
// Tool Handler
// ============================================

export function enforceP(
	request: EnforcePlanningRequest,
): EnforcePlanningResult {
	const base = request.planningDir
		? path.join(request.projectPath, request.planningDir)
		: request.projectPath;

	// Apply defaults (schema defaults only apply when parsed through Zod)
	const requireApproval = request.requireApproval !== false;
	const requirePhases = request.requirePhases !== false;

	const specPath = path.join(base, "spec.md");
	const planPath = path.join(base, "plan.md");

	const specCheck = checkArtifact(specPath, {
		requireApproval: requireApproval ? true : undefined,
	});

	const planCheck = checkArtifact(planPath, {
		requirePhases: requirePhases ? true : undefined,
	});

	const allIssues = [...specCheck.issues, ...planCheck.issues];
	const allowed = allIssues.length === 0;

	const blockedReason = allowed
		? undefined
		: `Code generation blocked. Issues:\n${allIssues.map((i) => `  - ${i}`).join("\n")}`;

	const summary = allowed
		? `✅ Planning artifacts valid. Code generation allowed.`
		: `❌ Planning artifacts invalid. Code generation blocked.\n${blockedReason}`;

	return {
		allowed,
		blockedReason,
		specMd: specCheck,
		planMd: planCheck,
		summary,
	};
}
