/**
 * gr-hawking-entropy-auditor.ts
 *
 * Handwritten capability handler for the gr-hawking-entropy-auditor skill.
 *
 * Physics metaphor: applies the Bekenstein-Hawking entropy formula (S = A/4)
 * to software modules. The public API surface is the module's "event horizon".
 * Entropy S = public_exports / 4. Modules with entropy_ratio > 2 have too many
 * exports for their internal complexity — they are over-exposed.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   gr-schwarzschild-classifier — coupling zone classification
 *   gr-event-horizon-detector   — cascade propagation from high fan-in
 *   gr-spacetime-debt-metric    — curvature score (K = coupling×complexity/cohesion)
 *   gr-tidal-force-analyzer     — differential coupling / split detection
 *
 * Outputs are SUPPLEMENTARY engineering guidance. They do not replace API
 * surface tools (e.g., ts-prune, api-extractor, Semgrep export rules).
 */

import { z } from "zod";
import { gr_hawking_entropy_auditor_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	classifyEntropy,
	entropyRatio,
	extractNumbers,
	fmtNum,
	hawkingEntropy,
} from "./gr-physics-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const inputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			publicExports: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Number of public exports (functions, classes, constants, types) in the module's API surface.",
				),
			internalLines: z
				.number()
				.nonnegative()
				.optional()
				.describe(
					"Total internal lines of code (excluding exports, comments, and blank lines). Used to compute internal complexity density.",
				),
		})
		.optional(),
});

// ─── Keyword Rules ────────────────────────────────────────────────────────────

const RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern:
			/\b(critical|too.?many|over.?expos|violation|exceed|bloat|leak)\b/i,
		guidance:
			"Critical entropy modules (ratio > 2) expose far more surface area than their internal complexity warrants. Immediate action: audit each public export for external consumers using `ts-prune` or `api-extractor`. Convert unclaimed exports to private/internal symbols. Consolidate related exports into typed barrel objects.",
	},
	{
		pattern: /\b(elevated|high|above|warn|concern|moder|review)\b/i,
		guidance:
			"Elevated entropy modules (1 < ratio ≤ 2) are candidates for API surface reduction in the next refactoring cycle. Identify which exports have zero external consumers and mark them `@internal`. Introduce a versioned public API contract to prevent new consumers from coupling to internal helpers.",
	},
	{
		pattern: /\b(hawking|bekenstein|entropy|bound|formula|surface|horizon)\b/i,
		guidance:
			"Formula: S = public_exports / 4 (Hawking entropy analogue). entropy_ratio = S / (internal_lines / 100 + 1). ratio > 2 → API surface is too large relative to module volume; ratio < 0.5 → module may be under-exposing and hiding useful functionality, increasing implicit coupling through copy-paste reuse.",
	},
	{
		pattern: /\b(export|api|public|surface|interface|symbol|contract)\b/i,
		guidance:
			"API surface audit protocol: list all public exports per module. Classify as: (a) externally consumed — must remain public, (b) internally referenced only — move to private scope, (c) transitional — mark `@internal` and schedule deprecation. Each reclassification reduces S and the entropy ratio.",
	},
	{
		pattern: /\b(barrel|index|re.?export|facade|aggregat|bundle)\b/i,
		guidance:
			"Barrel reduction strategy: barrel files that re-export everything from child modules amplify entropy by bundling unrelated symbols under one surface. Prefer explicit named barrel exports over `export * from`. Limit barrels to 10–15 exports; split larger barrels by functional area.",
	},
	{
		pattern: /\b(under.?expos|hidden|private|internal|encapsulat|hiding)\b/i,
		guidance:
			"Under-exposed modules (ratio < 0.5) may be hiding reusable functionality. Consumers work around missing exports by copy-pasting internals, creating hidden coupling. Audit frequently copy-pasted patterns across the codebase and promote them to the module's public API with stable contracts.",
	},
	{
		pattern: /\b(measure|collect|scan|tool|detect|find|identify|audit)\b/i,
		guidance:
			"Detection workflow: (1) run `ts-prune` or `eslint-plugin-n/no-unused-modules` to identify unused public exports, (2) count total public exports per module, (3) measure internal line count, (4) compute S = exports / 4 and ratio = S / (lines / 100 + 1), (5) flag CRITICAL (ratio > 2) and ELEVATED (ratio > 1) for review.",
	},
	{
		pattern: /\b(split|decompose|extract|separate|narrow|focus|single)\b/i,
		guidance:
			"Split strategy for high-entropy modules: decompose the module by functional area so each resulting module has a narrower public API. A module with 40 exports split into 4 focused modules of 10 exports each achieves the same total coverage with dramatically lower entropy per module.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const grHawkingEntropyAuditorHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Hawking Entropy Auditor needs a module description, export count, or API surface concern before it can produce entropy-based analysis.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const guidances: string[] = RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		// Lightweight numeric computation when metric values are provided.
		const parsed = parseSkillInput(inputSchema, input);
		const opts = parsed.ok ? parsed.data.options : undefined;

		const nums = extractNumbers(combined);
		const pubExports =
			opts?.publicExports ?? (nums.length >= 1 ? nums[0] : undefined);
		const intLines =
			opts?.internalLines ?? (nums.length >= 2 ? nums[1] : undefined);

		if (pubExports !== undefined && intLines !== undefined) {
			const S = hawkingEntropy(pubExports);
			const ratio = entropyRatio(S, intLines);
			const cls = classifyEntropy(ratio);

			const clsLabel: Record<typeof cls, string> = {
				critical: "CRITICAL",
				elevated: "ELEVATED",
				healthy: "HEALTHY",
			};

			guidances.unshift(
				`Advisory computation — public_exports=${fmtNum(pubExports)}, internal_lines=${fmtNum(intLines)}: S=${fmtNum(S)}, entropy_ratio=${fmtNum(ratio)} (${clsLabel[cls]}). ` +
					"Treat as an indicative estimate; validate against your API surface tooling before pruning exports.",
			);
		} else if (pubExports !== undefined) {
			const S = hawkingEntropy(pubExports);
			guidances.unshift(
				`Advisory computation — public_exports=${fmtNum(pubExports)}: Hawking entropy S=${fmtNum(S)}. ` +
					"Provide internal_lines (or options.internalLines) to compute the full entropy_ratio.",
			);
		}

		if (guidances.length === 0) {
			guidances.push(
				"To run the Hawking Entropy Audit: count public exports per module, measure internal lines of code. Compute S = exports / 4 and entropy_ratio = S / (lines / 100 + 1). Modules with ratio > 2 are over-exposed; ratio < 0.5 are under-exposed.",
				"Quick baseline: in a typical well-structured module, a 300-line file should have no more than 8 public exports (ratio ≈ 1.0). Use this as a rough internal benchmark pending full tooling integration.",
			);
		}

		if (signals.hasContext) {
			guidances.push(
				"Analyze the provided context for API surface patterns: look for barrel files, wildcard re-exports, and legacy compatibility shims — these are the most common sources of entropy bloat.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply entropy analysis under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Prioritize export pruning for modules that also violate these constraints.`,
			);
		}

		return createCapabilityResult(
			context,
			`Hawking Entropy Auditor produced ${guidances.length} API-surface guideline${guidances.length === 1 ? "" : "s"} for export entropy analysis. Results are advisory — validate with API surface tooling.`,
			createFocusRecommendations(
				"Entropy audit guidance",
				guidances,
				context.model.modelClass,
			),
			[
				buildWorkedExampleArtifact(
					"Hawking entropy audit example",
					{
						publicExports: 12,
						internalLines: 600,
						moduleShape: "shared AI orchestration helper",
					},
					{
						S: 3,
						entropyRatio: 0.5,
						classification: "healthy",
						action:
							"Keep the API surface stable and only expose new exports if there is a clearly named consumer need.",
					},
					"Shows how the entropy lens translates into a practical API-surface decision.",
				),
				buildOutputTemplateArtifact(
					"Entropy audit worksheet",
					`Module: 
Public exports:
Internal lines:
Computed S = exports / 4:
Entropy ratio:
Classification:
Next action:
Consumers to check:`,
					[
						"Module",
						"Public exports",
						"Internal lines",
						"Computed S",
						"Entropy ratio",
						"Classification",
						"Next action",
						"Consumers to check",
					],
					"Use this worksheet when you want the physics metaphor to end in an actionable refactoring note.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	grHawkingEntropyAuditorHandler,
);
