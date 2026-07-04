import { readdir, readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import type {
	WorkspaceEntry,
	WorkspaceReader,
} from "../../contracts/runtime.js";
import { createOperationalLogger } from "../../infrastructure/observability.js";
import { resolveWorkspaceRoot } from "../../runtime/session-store-utils.js";

const workspaceAdapterLogger = createOperationalLogger("warn");

/**
 * Guard against path traversal.  Throws rather than silently accepting a
 * dangerous path so callers see an explicit error instead of reading the wrong data.
 */
function guardRelativePath(root: string, relativePath: string): string {
	const normalizedRoot = resolve(root);
	const resolved = resolve(normalizedRoot, relativePath);
	if (
		!resolved.startsWith(normalizedRoot + sep) &&
		resolved !== normalizedRoot
	) {
		throw new Error(
			`Workspace path traversal is not allowed: "${relativePath}". Use a path relative to the workspace root.`,
		);
	}
	return resolved;
}

/**
 * Source-file workspace surface.  The previous version exposed session-scoped
 * artifact CRUD backed by TOON files; that surface was removed because Serena
 * memory (advertised via the 🧭 Serena enrichment footer on every tool
 * response) is now the cross-session persistence layer.  The remaining
 * `listFiles` / `readFile` methods are pure OS reads with workspace-root
 * containment.
 */
export function createWorkspaceSurface(
	root: string = resolveWorkspaceRoot(),
): WorkspaceReader {
	return {
		async listFiles(path = "."): Promise<WorkspaceEntry[]> {
			const absPath = guardRelativePath(root, path);
			try {
				const entries = await readdir(absPath, { withFileTypes: true });
				return entries
					.filter((entry) => !entry.name.startsWith("."))
					.map((entry) => ({
						name: entry.name,
						type: entry.isDirectory()
							? ("directory" as const)
							: ("file" as const),
					}));
			} catch (error) {
				// Directory does not exist or is not readable — degrade gracefully,
				// but never silently: an empty listing here means downstream skills
				// run with NO workspace context (the historical silent-empty-context
				// failure), so surface the degradation in the operational log.
				workspaceAdapterLogger.log(
					"warn",
					"Workspace listing unavailable — skills proceed without workspace context",
					{
						path: absPath,
						error: error instanceof Error ? error.message : String(error),
					},
				);
				return [];
			}
		},
		async readFile(path: string): Promise<string> {
			return readFile(guardRelativePath(root, path), "utf8");
		},
	};
}

export function createWorkspaceReader(
	root: string = process.cwd(),
): WorkspaceReader {
	return createWorkspaceSurface(root);
}
