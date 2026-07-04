import type {
	InstructionEvidenceItem,
	InstructionInput,
} from "../../contracts/runtime.js";
import type { SkillExecutionContext } from "../runtime/contracts.js";
import { extractReferencedPaths } from "./recommendations.js";

/**
 * Workspace grounding — lets a skill produce problem-specific findings WITHOUT
 * an MCP sampling client by reading the actual files a request references and
 * matching catalogs against real file CONTENT instead of the request sentence.
 *
 * Named-files-only: reads paths the request/context explicitly mention, never
 * guesses. Always additive; never throws. When the workspace is absent or
 * nothing is referenced, returns empty and callers fall back to their existing
 * text-signal behaviour.
 */

/** A file successfully read from the workspace, with a bounded excerpt. */
export interface GroundedFile {
	path: string;
	content: string;
	excerpt: string;
}

/** A catalog rule matched against real file content. */
export interface ContentProbe {
	pattern: RegExp;
	/** Build the grounded finding once `pattern` matches inside `path`. */
	finding: (path: string) => string;
}

const MAX_FILES = 3;
const MAX_BYTES_PER_FILE = 20_000;
const EXCERPT_CHARS = 280;

/**
 * Read the files a request references via the injected WorkspaceReader.
 * Caps file count and size, swallows per-file errors, returns `[]` when the
 * workspace is absent or nothing is referenced.
 */
export async function readReferencedFiles(
	context: SkillExecutionContext,
	input: InstructionInput = context.input,
): Promise<GroundedFile[]> {
	const reader = context.runtime.workspace;
	if (!reader) {
		return [];
	}
	const paths = extractReferencedPaths(input).slice(0, MAX_FILES);
	const out: GroundedFile[] = [];
	for (const path of paths) {
		try {
			const content = (await reader.readFile(path)).slice(
				0,
				MAX_BYTES_PER_FILE,
			);
			out.push({
				path,
				content,
				excerpt: content.slice(0, EXCERPT_CHARS).trim(),
			});
		} catch {
			// missing / unreadable / outside root — grounding is best-effort
		}
	}
	return out;
}

/**
 * Match a catalog of content probes against real file content, returning the
 * grounded findings, each citing the file it was derived from.
 */
export function matchProbes(
	files: readonly GroundedFile[],
	probes: readonly ContentProbe[],
): string[] {
	const findings: string[] = [];
	for (const file of files) {
		for (const probe of probes) {
			if (probe.pattern.test(file.content)) {
				findings.push(probe.finding(file.path));
			}
		}
	}
	return findings;
}

/**
 * Build structured `workspace-file` evidence items from grounded files so the
 * envelope carries verifiable locators (feeds `groundingScope: "workspace"`).
 */
export function buildWorkspaceEvidence(
	files: readonly GroundedFile[],
	toolName: string,
): InstructionEvidenceItem[] {
	return files.map((file) => ({
		sourceType: "workspace-file" as const,
		toolName,
		locator: file.path,
		title: file.path,
		excerpt: file.excerpt,
		authority: "implementation" as const,
	}));
}
