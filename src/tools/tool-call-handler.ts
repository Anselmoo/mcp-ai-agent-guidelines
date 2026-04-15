import type {
	InstructionInput,
	WorkflowExecutionRuntime,
} from "../contracts/runtime.js";
import { INSTRUCTION_VALIDATORS } from "../generated/validators/instruction-validators.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { createOperationalLogger } from "../infrastructure/observability.js";
import { INSTRUCTION_SPECS } from "../instructions/instruction-specs.js";
import {
	buildContextEvidenceLines,
	buildContextSourceRefs,
	extractRequestSignals,
} from "../skills/shared/recommendations.js";
import { skillRequestSchema } from "../validation/core-schemas.js";
import { createErrorContext, ValidationService } from "../validation/index.js";
import { memoryInterface, resolveMemoryToolName } from "./memory-tools.js";
import { formatWorkflowResult } from "./result-formatter.js";
import {
	dispatchSessionToolCall,
	resolveSessionToolName,
} from "./session-tools.js";
import {
	dispatchSnapshotToolCall,
	resolveSnapshotToolName,
} from "./snapshot-tools.js";
import {
	dispatchWorkspaceToolCall,
	resolveWorkspaceToolName,
} from "./workspace-tools.js";

type TextToolResult = {
	content: Array<{
		type: "text";
		text: string;
	}>;
	isError?: boolean;
};

const toolCallLogger = createOperationalLogger("warn");
const SNAPSHOT_LINK_TIMEOUT_MS = 120;

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
		`3. Call \`agent-memory(command=enrich, artifactId="${artifactId}", libraryContext=<combined docs>)\``,
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
	].join("\n");
}

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
		if (resolveMemoryToolName(toolName)) {
			const { dispatchMemoryToolCall } = await import("./memory-tools.js");
			return (await dispatchMemoryToolCall(
				toolName,
				(args ?? {}) as Record<string, unknown>,
			)) as TextToolResult;
		}
		if (resolveSessionToolName(toolName)) {
			return (await dispatchSessionToolCall(
				toolName,
				(args ?? {}) as Record<string, unknown>,
				runtime,
			)) as TextToolResult;
		}
		if (resolveSnapshotToolName(toolName)) {
			return (await dispatchSnapshotToolCall(
				toolName,
				(args ?? {}) as Record<string, unknown>,
			)) as TextToolResult;
		}

		// Some MCP wrappers route directly to the generic tool dispatcher instead of
		// the top-level server handler in src/index.ts. Resolve workspace tools here
		// so the advertised `workspace-*` names and the retained bare compatibility
		// aliases still reach the workspace surface.
		const workspaceToolName = resolveWorkspaceToolName(toolName);
		if (workspaceToolName) {
			return await dispatchWorkspaceToolCall(workspaceToolName, args, runtime);
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

			// Format error using new system
			const standardError = {
				code: `TOOL_VALIDATION_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
				message: `Invalid input for \`${toolName}\`: ${issues}`,
				context: {
					...context,
					instructionId: toolName,
				},
				recoverable: true,
				suggestedAction:
					"Review the input parameters and ensure all required fields are provided with valid values.",
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

			const standardError = {
				code: `TOOL_INPUT_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
				message: `Invalid input for \`${toolName}\`: ${issues}`,
				context: {
					...context,
					instructionId: toolName,
				},
				recoverable: true,
				suggestedAction:
					"Review the tool input and ensure the shared request/context contract is satisfied.",
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
		const input: InstructionInput = inputParseResult.data;

		// Gap C — Non-blocking memory injection: prepend top recent artifacts to
		// input.context so every skill has continuity without explicit memory reads.
		// Bounded at 150 ms so stale or empty memory never delays tool execution.
		const MEMORY_INJECT_TIMEOUT_MS = 150;
		const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
		const recentArtifacts = await Promise.race([
			memoryInterface.findMemoryArtifacts({
				minRelevance: 0.5,
				maxAgeMs: SEVEN_DAYS_MS,
			}),
			new Promise<never>((_, reject) =>
				setTimeout(
					() => reject(new Error("memory inject timeout")),
					MEMORY_INJECT_TIMEOUT_MS,
				),
			),
		]).catch(() => []);

		// Only inject artifacts written by the same instruction type (topic tag match).
		// Cross-tool injection (e.g. review artifacts inside docs-generate) is noise.
		const topicTag = `topic:${toolName}`;
		const topicArtifacts = recentArtifacts.filter(
			(a) => a.meta.tags.includes(topicTag) && a.meta.relevance >= 0.7,
		);
		const enrichedInput: InstructionInput =
			topicArtifacts.length > 0
				? {
						...input,
						context: (() => {
							const prefix = topicArtifacts
								.slice(0, 3)
								.map((a) => `Prior context: ${a.content.summary}`)
								.join("\n");
							return input.context ? `${prefix}\n\n${input.context}` : prefix;
						})(),
					}
				: input;

		// Execute instruction with validation boundaries
		const result = await validationService.executeWithValidation(
			() => instruction.execute(enrichedInput, runtime),
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

		const formattedText = formatWorkflowResult(result.data);
		const contextAppendix = buildContextAppendix(input);
		const responseText = contextAppendix
			? `${formattedText}\n\n${contextAppendix}`
			: formattedText;
		const relatedMemoryIds = recentArtifacts
			.slice(0, 5)
			.map((artifact) => artifact.meta.id)
			.filter(
				(artifactId) => artifactId !== `${toolName}-${runtime.sessionId}`,
			);
		const sourceSignals = extractRequestSignals(input);

		// Gap E — fire-and-forget session + memory persistence.
		// Both writes are non-blocking and swallow IO errors so tool execution
		// is never influenced by persistence failures.
		const now = new Date().toISOString();
		const chainTo = instruction.manifest.chainTo ?? [];
		memoryInterface
			.saveSessionContext(runtime.sessionId, {
				context: {
					requestScope: input.request.slice(0, 200),
					constraints: [],
					phase: toolName,
				},
				progress: {
					// Record this tool as completed (not inProgress) at save time —
					// the result is already produced before saveSessionContext fires.
					completed: [toolName],
					inProgress: [],
					blocked: [],
					next: chainTo,
				},
				memory: {
					keyInsights: [],
					decisions: {},
					patterns: [],
					warnings: [],
				},
			})
			.catch((err) => {
				toolCallLogger.log("warn", "Session context persistence failed", {
					toolName,
					sessionId: runtime.sessionId,
					error: err instanceof Error ? err.message : String(err),
				});
			});

		Promise.race([
			memoryInterface.loadFingerprintSnapshot(),
			new Promise<null>((resolve) =>
				setTimeout(() => resolve(null), SNAPSHOT_LINK_TIMEOUT_MS),
			),
		])
			.then((snapshot) =>
				memoryInterface.saveMemoryArtifact({
					meta: {
						id: `${toolName}-${runtime.sessionId}`,
						created: now,
						updated: now,
						// Stable topic tag (toolName) + session tag for grouping.
						// The stable tag enables find(tags:["docs-generate"]) to work
						// reliably across sessions without knowing the session ID.
						tags: [toolName, `topic:${toolName}`, runtime.sessionId],
						relevance: 0.8,
					},
					content: {
						// Prepend an artifact-count note to the summary when the workflow
						// produced top-level artifacts. This gives memory consumers a
						// quick signal that structured outputs are available without
						// parsing the full details text.
						summary: (() => {
							const baseSummary =
								responseText
									.split("\n")
									.map((l) => l.replace(/^#+\s*/, "").trim())
									.find((l) => l.length > 0)
									?.slice(0, 200) ?? responseText.slice(0, 200);
							const topArtifacts = result.data.artifacts ?? [];
							if (topArtifacts.length === 0) return baseSummary;
							// Prefix must NOT start with "[" — the TOON encoder treats
							// "[N " as TOON array syntax, producing an undecodable artifact.
							const artifactNote =
								topArtifacts.length +
								" artifact" +
								(topArtifacts.length === 1 ? "" : "s") +
								" — ";
							return (artifactNote + baseSummary).slice(0, 200);
						})(),
						details: responseText,
						context: input.request,
						actionable: true,
					},
					links: {
						relatedSessions: [runtime.sessionId],
						relatedMemories: relatedMemoryIds,
						sources: buildContextSourceRefs(sourceSignals, {
							includeSnapshotSource: snapshot !== null,
						}),
					},
				}),
			)
			.catch((err) => {
				toolCallLogger.log("warn", "Memory artifact persistence failed", {
					toolName,
					sessionId: runtime.sessionId,
					error: err instanceof Error ? err.message : String(err),
				});
			});

		// Gap F — structured chainTo footer for every instruction that declares
		// downstream tools. Replaces the old hardcoded adapt-only text paragraph.
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
		const appendedText = [responseText, chainToFooter, enrichmentHint]
			.filter(Boolean)
			.join("\n\n");

		return {
			content: [{ type: "text" as const, text: appendedText }],
		};
	} catch (error) {
		// Final fallback error handling
		const standardError = {
			code: `TOOL_EXECUTION_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
			message: `Tool \`${toolName}\` failed: ${toErrorMessage(error)}`,
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
