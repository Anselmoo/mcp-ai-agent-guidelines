// TODO(coverage): 24 uncovered branches (64.7%) — central dispatch surface
// with the biggest bang-per-test ratio. Closing this is the recommended
// starting point for the 87.38% → 90% project branch-coverage push noted
// in PR #1517. End-to-end coverable via existing tool-call fixtures.
import type {
	InstructionInput,
	WorkflowExecutionRuntime,
} from "../contracts/runtime.js";
import { INSTRUCTION_VALIDATORS } from "../generated/validators/instruction-validators.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { createOperationalLogger } from "../infrastructure/observability.js";
import { INSTRUCTION_SPECS } from "../instructions/instruction-specs.js";
import type { SerenaClient, SerenaQuery } from "../serena/client.js";
import { METAPHOR_CATALOG } from "../skills/analogy/catalog.js";
import { HEURISTIC_EXTRACTOR } from "../skills/analogy/clarify.js";
import type { Ranker } from "../skills/analogy/matcher.js";
import { runAnalogyWorkflow } from "../skills/analogy/workflow.js";
import {
	resolveTransformProfile,
	toSituationResult,
} from "../skills/shared/directive-first.js";
import type {
	CheckRunner,
	CheckStatus,
	MethodologyContext,
	MethodologyReport,
} from "../skills/shared/methodology-gate.js";
import {
	renderMethodologySection,
	runMethodologyChecks,
} from "../skills/shared/methodology-gate.js";
import {
	buildContextEvidenceLines,
	buildContextSourceRefs,
	extractRequestSignals,
} from "../skills/shared/recommendations.js";
import { skillRequestSchema } from "../validation/core-schemas.js";
import { createErrorContext, ValidationService } from "../validation/index.js";
import {
	buildWorkflowEnvelopePayload,
	formatWorkflowResult,
} from "./result-formatter.js";
import { buildMcpErrorContent } from "./shared/error-handler.js";
import { buildEnvelopeMeta, toToolResult } from "./shared/output-envelope.js";
import {
	dispatchWorkspaceToolCall,
	resolveWorkspaceToolName,
} from "./workspace-tools.js";

export type TextToolResult = {
	content: Array<{
		type: "text";
		text: string;
	}>;
	isError?: boolean;
};

const toolCallLogger = createOperationalLogger("warn");

// Maps instruction tool names to the library packages an agent should fetch
// via context7 to enrich the saved memory artifact after execution.
const TOOL_LIBRARY_MAP: Readonly<Record<string, readonly string[]>> = {
	"docs-generate": ["astro", "@astrojs/starlight"],
	"feature-implement": ["typescript"],
	"code-review": ["typescript"],
	"code-refactor": ["typescript"],
	"test-verify": ["vitest"],
	"policy-govern": ["zod"],
	"system-design": ["typescript", "zod"],
};

// Per-tool default Serena enrichment query.  These guide the host model to
// fetch LSP-grade symbol context from Serena (when available) instead of
// relying on heuristic scanning.  Tools omitted from this map still receive
// a generic `list_memories` advisory.
const SERENA_QUERY_BY_TOOL: Readonly<Record<string, SerenaQuery>> = {
	"code-review": { kind: "list_memories" },
	"code-refactor": { kind: "list_memories" },
	"feature-implement": { kind: "list_memories" },
	"issue-debug": { kind: "list_memories" },
	"evidence-research": { kind: "list_memories" },
	"system-design": { kind: "list_memories" },
};

async function buildSerenaFooter(
	toolName: string,
	serena: SerenaClient | undefined,
): Promise<string | null> {
	if (!serena) return null;
	const query = SERENA_QUERY_BY_TOOL[toolName] ?? { kind: "list_memories" };
	let result: Awaited<ReturnType<SerenaClient["query"]>>;
	try {
		result = await serena.query(query);
	} catch {
		return null;
	}
	if (result.kind === "error") return null;
	if (result.kind === "advisory") {
		const argsJson = JSON.stringify(result.suggestedArgs);
		return [
			"---",
			"",
			"## 🧭 Serena enrichment available",
			"",
			`Call \`${result.suggestedTool}\` ${
				argsJson === "{}" ? "" : `with \`${argsJson}\` `
			}to ground this analysis in Serena's LSP-backed symbol surface and prior project memories.`,
			"",
			`_Rationale:_ ${result.rationale}`,
		].join("\n");
	}
	// kind === "data"
	const payload = JSON.stringify(result.data, null, 2);
	return [
		"---",
		"",
		"## 🧭 Serena context",
		"",
		`Result from \`${result.tool}\`:`,
		"",
		"```json",
		payload.length > 4000 ? `${payload.slice(0, 4000)}…` : payload,
		"```",
	].join("\n");
}

function buildEnrichmentHint(
	artifactId: string,
	libraries: readonly string[],
): string {
	const libList = libraries.map((l) => `\`${l}\``).join(", ");
	return [
		"---",
		"",
		"## 📚 Memory enrichment available",
		"",
		`Artifact ID: \`${artifactId}\``,
		`Libraries: ${libList}`,
		"",
		"To anchor this memory artifact to current library documentation:",
		"1. Call `mcp_context7_resolve-library-id` for each library above",
		"2. Call `mcp_context7_get-library-docs` with the resolved ID and the user's original request as the query",
		`3. Call \`agent-memory-write(artifactId="${artifactId}", libraryContext=<combined docs>)\``,
	].join("\n");
}

// ── Cycle-detection: prevent direct 2-cycles in chainTo footer ──────────────
// Pre-compute at module load: set of "from:to" short-name pairs that would
// create an A→B→A infinite loop in autonomous agent mode.
const _forbiddenEdges = new Set<string>();
for (const spec of INSTRUCTION_SPECS) {
	for (const target of spec.chainTo) {
		const targetSpec = INSTRUCTION_SPECS.find((s) => s.toolName === target);
		if (targetSpec?.chainTo.includes(spec.toolName)) {
			_forbiddenEdges.add(`${spec.toolName}:${target}`);
		}
	}
}

function buildContextAppendix(input: InstructionInput): string {
	const contextLines = buildContextEvidenceLines(extractRequestSignals(input));
	if (contextLines.length === 0) {
		return "";
	}
	return [
		"## Context anchors",
		"",
		...contextLines.map((line) => `- ${line}`),
	].join("\n");
}

/**
 * Builds a structured JSON footer that tells the LLM which tools to call next.
 * Returns an empty string when the instruction declares no downstream tools.
 *
 * The JSON block is machine-parseable in agent mode: the LLM can extract
 * `chainTo` and auto-call the first entry without returning to the user.
 */
function buildChainToFooter(
	toolName: string,
	chainTo: readonly string[],
	sessionId: string,
	fromShortName: string,
): string {
	if (chainTo.length === 0) return "";
	// Filter out direct 2-cycle edges (A→B where B also chains back to A).
	// This prevents autonomous agent loops: review→govern→review→…
	const safeChainTo = chainTo.filter(
		(target) => !_forbiddenEdges.has(`${fromShortName}:${target}`),
	);
	if (safeChainTo.length === 0) return "";
	const payload = JSON.stringify(
		{ chainTo: safeChainTo, sessionId, from: toolName },
		null,
		2,
	);
	return [
		"---",
		"",
		"## ⚡ Next required tool call",
		"",
		"Call **one** of these tools now — do **not** return to the user first:",
		"",
		"```json",
		payload,
		"```",
		"",
		"Handoff contract (prompt-chaining): pass this tool's output above as the",
		"next call's `context` so each stage receives the previous stage's",
		"independently verifiable artifact instead of restarting from the raw request.",
	].join("\n");
}

// The four engineering workflow tools that carry a methodology gate section.
const HOST_TOOLS_WITH_METHODOLOGY_GATE = new Set([
	"issue-debug",
	"code-review",
	"system-design",
	"evidence-research",
]);

// Deterministic placeholder runner — returns needs-data for all five checks.
// An LLM-backed runner is a follow-up task; this stub ships with Task 8.
const defaultRunner: CheckRunner = async (
	_name: keyof MethodologyReport,
	_ctx: MethodologyContext,
): Promise<CheckStatus> => ({
	status: "needs-data",
	question:
		"LLM runner not yet wired (Task 8 ships a deterministic placeholder)",
});

export async function dispatchToolCall(
	toolName: string,
	args: unknown,
	runtime: WorkflowExecutionRuntime,
): Promise<TextToolResult> {
	// Initialize ValidationService if not already initialized (for backward compatibility)
	let validationService: ValidationService;
	try {
		validationService = ValidationService.getInstance();
	} catch {
		// Graceful fallback - initialize with default config for tests
		validationService = ValidationService.initialize();
	}

	try {
		// Some MCP wrappers route directly to the generic tool dispatcher instead of
		// the top-level server handler in src/index.ts. Resolve workspace tools here
		// so the advertised `workspace-*` names and the retained bare compatibility
		// aliases still reach the workspace surface.
		const workspaceToolName = resolveWorkspaceToolName(toolName);
		if (workspaceToolName) {
			return await dispatchWorkspaceToolCall(workspaceToolName, args, runtime);
		}

		// ── analogy-think: direct dispatch (no workflowEngine, no LLM ranker) ──
		// Bypasses the standard instruction.execute() path so runAnalogyWorkflow
		// can return an AnalogyEnvelopePayload rather than WorkflowExecutionResult.
		// Validation still goes through the registered INSTRUCTION_VALIDATORS entry.
		// The gateOrderRanker is deterministic and requires no LLM call — it returns
		// gated catalog entries in catalog order with descending scores (1.0, 0.9, …).
		if (toolName === "analogy-think") {
			const validator = INSTRUCTION_VALIDATORS.get(toolName);
			if (!validator) {
				throw new Error(
					`No validator registered for instruction: ${toolName}. ` +
						"Re-run generate:tool-definitions and rebuild.",
				);
			}
			const parseResult = validator.safeParse(args);
			if (!parseResult.success) {
				const issues = parseResult.error.issues
					.map((issue) =>
						issue.path.length > 0
							? `"${issue.path.join(".")}" — ${issue.message}`
							: issue.message,
					)
					.join("; ");
				return buildMcpErrorContent({
					category: "validation",
					code: `TOOL_VALIDATION_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
					message: `Invalid input for \`${toolName}\`: ${issues}`,
					recoverable: true,
					suggestedAction:
						"Provide a non-empty `request` string describing the problem.",
					nextTool: "task-bootstrap",
				});
			}
			const analogyInput = parseResult.data as {
				request: string;
				context?: string;
			};
			// Deterministic gate-order ranker: returns gated candidates in catalog order
			// with linearly descending scores (1.0 for first, 0.9 for second, …).
			// No LLM call; the LLM-backed ranker lands in a follow-up.
			const gateOrderRanker: Ranker = async (
				_summary: string,
				candidates: ReadonlyArray<{ id: string }>,
			) =>
				candidates.map((c, i) => ({
					id: c.id,
					score: Math.max(0, 1 - i * 0.1),
				}));
			// Validate catalog presence at startup
			if (METAPHOR_CATALOG.length === 0) {
				throw new Error(
					"METAPHOR_CATALOG is empty; analogy-think cannot dispatch.",
				);
			}
			const result = await runAnalogyWorkflow(
				{ request: analogyInput.request, context: analogyInput.context },
				{ extract: HEURISTIC_EXTRACTOR, rank: gateOrderRanker },
			);
			return toToolResult({
				summaryMarkdown: result.summaryMarkdown,
				// instructionId is required by the tool-coverage-matrix test which checks
				// that every workflow tool envelope carries instructionId === toolName.
				payload: { ...result.payload, instructionId: "analogy-think" },
				meta: buildEnvelopeMeta("analogy-think"),
			});
		}

		// Phase B: Wait for ambient startup context (memory refresh + session fetch)
		// with a bounded timeout so the first tool call is never blocked indefinitely.
		if (runtime.contextReady) {
			const CONTEXT_WAIT_MS = 300;
			await Promise.race([
				runtime.contextReady,
				new Promise<void>((resolve) => setTimeout(resolve, CONTEXT_WAIT_MS)),
			]);
		}

		const instruction = runtime.instructionRegistry.getByToolName(toolName);
		if (!instruction) {
			throw new Error(`Unknown instruction tool: ${toolName}`);
		}

		const validator = INSTRUCTION_VALIDATORS.get(toolName);
		if (!validator) {
			// Defensive: every public instruction should have a registered validator.
			throw new Error(
				`No validator registered for instruction: ${toolName}. ` +
					"Re-run generate:tool-definitions and rebuild.",
			);
		}

		// Use the shared validation system.
		const context = createErrorContext(
			undefined, // skillId
			toolName, // instructionId - use toolName instead of instruction.id
			undefined, // modelId - will be determined later
			runtime.sessionId,
		);

		// Enhanced validation with the new system
		const parseResult = validator.safeParse(args);
		if (!parseResult.success) {
			const issues = parseResult.error.issues
				.map((issue) =>
					issue.path.length > 0
						? `"${issue.path.join(".")}" — ${issue.message}`
						: issue.message,
				)
				.join("; ");

			return buildMcpErrorContent({
				category: "validation",
				code: `TOOL_VALIDATION_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
				message: `Invalid input for \`${toolName}\`: ${issues}`,
				recoverable: true,
				suggestedAction:
					"Review the input parameters and ensure all required fields are provided with valid values.",
				nextTool: "task-bootstrap",
			});
		}

		// Parse through the shared instruction/skill input schema so the public
		// tool boundary never trusts a generic Zod object as InstructionInput
		// without checking the core contract again.
		const inputParseResult = skillRequestSchema.safeParse(parseResult.data);
		if (!inputParseResult.success) {
			const issues = inputParseResult.error.issues
				.map((issue) =>
					issue.path.length > 0
						? `"${issue.path.join(".")}" — ${issue.message}`
						: issue.message,
				)
				.join("; ");

			return buildMcpErrorContent({
				category: "validation",
				code: `TOOL_INPUT_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
				message: `Invalid input for \`${toolName}\`: ${issues}`,
				recoverable: true,
				suggestedAction:
					"Review the tool input and ensure the shared request/context contract is satisfied.",
				nextTool: "task-bootstrap",
			});
		}
		const input: InstructionInput = inputParseResult.data;

		// Execute instruction with validation boundaries
		const result = await validationService.executeWithValidation(
			() => instruction.execute(input, runtime),
			toolName,
			context,
			true, // enable retry
		);

		if (!result.success) {
			return {
				isError: true,
				content: [
					{
						type: "text" as const,
						text: validationService.formatError(result.error),
					},
				],
			};
		}

		// Validate output before returning
		const outputValidation = validationService.validateOutput(
			result.data,
			toolName,
		);
		if (!outputValidation.success) {
			toolCallLogger.log("warn", "Tool output validation warning", {
				toolName,
				error: outputValidation.error,
			});
		}

		// LLM→LLM transform (single chokepoint): for tools with a transform
		// profile, replace the keyword-matched template recommendation wall with
		// ONE situation-specific result — per the profile's output contract
		// (analysis findings, a build deliverable, a routing decision, …) — the
		// matched templates seed (via `criteria`) but no longer dictate. Sampled
		// when the client supports it, a return-a-prompt directive otherwise.
		// Only the analogy special path resolves to no profile and passes through
		// untouched — it already gates to a request-anchored metaphor (see
		// TRANSFORM_PROFILES; 19/20 of the public surface is transformed).
		// Kill-switch (`MCP_SITUATION_TRANSFORM=0`) for A/B evaluation and ops
		// rollback: disables the transform so tools emit pre-transform output.
		const profile =
			process.env.MCP_SITUATION_TRANSFORM === "0"
				? undefined
				: resolveTransformProfile(toolName);
		const situationData = profile
			? await toSituationResult(result.data, {
					domain: profile.domain,
					outputContract: profile.outputContract,
					candidateNextTools:
						profile.candidateNextTools ?? instruction.manifest.chainTo ?? [],
				})
			: result.data;

		const formattedText = formatWorkflowResult(situationData, toolName);
		const contextAppendix = buildContextAppendix(input);
		const responseText = contextAppendix
			? `${formattedText}\n\n${contextAppendix}`
			: formattedText;
		const chainTo = instruction.manifest.chainTo ?? [];

		// Gap F — structured chainTo footer for every instruction that declares
		// downstream tools. Replaces the old hardcoded adapt-only text paragraph.
		// Note: on the analysis-transform path the directive ALSO carries a
		// prose next-action workflow. The two are intentionally distinct: this
		// footer is the machine-parseable JSON block autonomous agents read to
		// auto-chain, while the directive's workflow is advisory prose for the
		// model executing the analysis. Keep both.
		const chainToFooter = buildChainToFooter(
			toolName,
			chainTo,
			runtime.sessionId,
			instruction.manifest.toolName,
		);
		// Enrichment hint: if this tool has known library dependencies, guide the
		// agent to fetch context7 docs and enrich the just-saved memory artifact.
		const artifactId = `${toolName}-${runtime.sessionId}`;
		const enrichmentLibraries = TOOL_LIBRARY_MAP[toolName];
		const enrichmentHint = enrichmentLibraries
			? buildEnrichmentHint(artifactId, enrichmentLibraries)
			: null;
		const serenaFooter = await buildSerenaFooter(toolName, runtime.serena);
		const appendedText = [
			responseText,
			chainToFooter,
			enrichmentHint,
			serenaFooter,
		]
			.filter(Boolean)
			.join("\n\n");

		// Wrap every workflow tool in the structured two-block envelope.
		// content[0] carries the existing prose summary (backwards-compatible).
		// content[1] carries the machine-parseable WorkflowEnvelopePayload.
		const rawSummary = appendedText;
		const rawPayload = buildWorkflowEnvelopePayload(situationData, toolName);

		if (HOST_TOOLS_WITH_METHODOLOGY_GATE.has(toolName)) {
			const methodologyCtx = {
				problemSummary: input.request ?? "",
				toolResult: { summaryMarkdown: rawSummary, payload: rawPayload },
			};
			const methodologyReport = await runMethodologyChecks(
				methodologyCtx,
				defaultRunner,
			);
			const summaryWithGate =
				rawSummary + "\n\n" + renderMethodologySection(methodologyReport);
			const payloadWithGate = { ...rawPayload, methodology: methodologyReport };
			return toToolResult({
				summaryMarkdown: summaryWithGate,
				payload: payloadWithGate,
				meta: buildEnvelopeMeta(toolName),
			});
		}

		return toToolResult({
			summaryMarkdown: rawSummary,
			payload: rawPayload,
			meta: buildEnvelopeMeta(toolName),
		});
	} catch (error) {
		// Detect unknown-instruction / unknown-tool-name errors: these signal that
		// the agent called a tool name that is not registered, and should route
		// through meta-routing to get a proper classification before retrying.
		const errorMessage = toErrorMessage(error);
		const isUnknownInstruction =
			errorMessage.startsWith("Unknown instruction tool:") ||
			errorMessage.startsWith("No validator registered for instruction:");

		if (isUnknownInstruction) {
			return buildMcpErrorContent({
				category: "not_found",
				code: `TOOL_UNKNOWN_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
				message: `Tool \`${toolName}\` failed: ${errorMessage}`,
				recoverable: true,
				suggestedAction:
					"Call meta-routing to classify the request and get the correct tool name.",
				nextTool: "meta-routing",
			});
		}

		// Final fallback error handling
		const standardError = {
			code: `TOOL_EXECUTION_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
			message: `Tool \`${toolName}\` failed: ${errorMessage}`,
			context: createErrorContext(
				undefined,
				toolName,
				undefined,
				runtime.sessionId,
			),
			recoverable: true,
			suggestedAction: "Try the operation again or check the input parameters.",
		};

		return {
			isError: true,
			content: [
				{
					type: "text" as const,
					text: validationService.formatError(standardError),
				},
			],
		};
	}
}
