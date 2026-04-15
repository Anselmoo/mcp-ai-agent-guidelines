/**
 * Content processor for registry-backed skill metadata and legacy SKILL.md files.
 *
 * Uses `gray-matter` for YAML frontmatter extraction and `yaml` for
 * round-trip serialisation of structured skill metadata.
 */

import { readFile, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { getSkillSpec, SKILL_SPECS } from "../skills/skill-specs.js";
import {
	createErrorContext,
	ValidationError,
} from "../validation/error-handling.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw frontmatter data extracted from a SKILL.md file. */
export interface SkillFrontmatter {
	name?: string;
	description?: string;
	triggers?: string[];
	antiTriggers?: string[];
	domain?: string;
	[key: string]: unknown;
}

/** Parsed representation of a SKILL.md file. */
export interface ParsedSkillDocument {
	/** Path to the source file, relative to repo root */
	filePath: string;
	/** Whether the document came from the registry or an on-disk file */
	sourceType: "registry" | "file";
	/** Canonical source path used to resolve the document */
	sourcePath: string;
	/** Whether the document is a virtual projection rather than an on-disk file */
	isVirtual: boolean;
	/** Skill identifier derived from the directory name */
	skillId: string;
	/** Structured frontmatter data */
	frontmatter: SkillFrontmatter;
	/** Markdown body (everything after the frontmatter block) */
	body: string;
	/** Last modified time for on-disk files */
	lastModifiedMs?: number;
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

/**
 * Discover all skill source documents under the given base directory.
 *
 * @param baseDir   Root of the search (defaults to `src/skills`)
 * @param cwd       Working directory for glob resolution (defaults to `process.cwd()`)
 */
export async function discoverSkillFiles(
	baseDir = "src/skills",
	cwd = process.cwd(),
): Promise<string[]> {
	const { relativePath: normalizedBaseDir } = resolveContentPath(baseDir, cwd);
	if (normalizedBaseDir.replace(/\\/g, "/") === "src/skills") {
		return SKILL_SPECS.map((spec) => `src/skills/skill-specs.ts#${spec.id}`);
	}
	return fg("**/SKILL.md", {
		cwd: join(cwd, normalizedBaseDir),
		onlyFiles: true,
		absolute: false,
	}).then((files) => files.map((f) => join(normalizedBaseDir, f)));
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a single skill source document into a {@link ParsedSkillDocument}.
 *
 * Front-matter is extracted via `gray-matter`; any YAML-string values that
 * are embedded in the frontmatter fields are further parsed with `yaml`.
 *
 * @param filePath  Path to the skill document, relative to `cwd`
 * @param cwd       Working directory (defaults to `process.cwd()`)
 */
export async function parseSkillDocument(
	filePath: string,
	cwd = process.cwd(),
): Promise<ParsedSkillDocument> {
	const [pathWithoutFragment, fragment] = filePath.split("#", 2);
	const { fullPath, relativePath } = resolveContentPath(
		pathWithoutFragment,
		cwd,
	);
	if (
		fragment &&
		relativePath.replace(/\\/g, "/") === "src/skills/skill-specs.ts"
	) {
		const spec = getSkillSpec(fragment);
		return {
			filePath: `${relativePath}#${spec.id}`,
			sourceType: "registry",
			sourcePath: relativePath,
			isVirtual: true,
			skillId: spec.id,
			frontmatter: {
				name: spec.displayName,
				description: spec.description,
				triggers: spec.triggerPhrases,
				antiTriggers: spec.antiTriggerPhrases,
				domain: spec.domain,
			},
			body: [
				`# ${spec.displayName}`,
				"",
				spec.purpose,
				"",
				...(spec.usageSteps.length > 0
					? ["## Usage", ...spec.usageSteps.map((step) => `- ${step}`)]
					: []),
			]
				.join("\n")
				.trim(),
		};
	}
	const raw = await readFile(fullPath, "utf-8");
	const fileStats = await stat(fullPath);

	const parsed = matter(raw, {
		engines: {
			// Use the yaml package for parsing so edge cases are handled consistently
			yaml: {
				parse: (str: string) => parseYaml(str) as object,
				stringify: (obj: object) => stringifyYaml(obj),
			},
		},
	});

	// Derive skill ID from the parent directory name (e.g. "adv-aco-router")
	const parts = relativePath.replace(/\\/g, "/").split("/");
	const dirName = parts[parts.length - 2] ?? "";

	return {
		filePath: relativePath,
		sourceType: "file",
		sourcePath: relativePath,
		isVirtual: false,
		skillId: dirName,
		frontmatter: parsed.data as SkillFrontmatter,
		body: parsed.content.trim(),
		lastModifiedMs: fileStats.mtimeMs,
	};
}

/**
 * Parse all skill documents discovered under `baseDir`.
 *
 * @param baseDir   Base directory for discovery (defaults to `src/skills`)
 * @param cwd       Working directory (defaults to `process.cwd()`)
 */
export async function parseAllSkillDocuments(
	baseDir = "src/skills",
	cwd = process.cwd(),
): Promise<ParsedSkillDocument[]> {
	const paths = await discoverSkillFiles(baseDir, cwd);
	return Promise.all(paths.map((p) => parseSkillDocument(p, cwd)));
}

// ---------------------------------------------------------------------------
// Serialisation helpers
// ---------------------------------------------------------------------------

/**
 * Serialise an arbitrary object to a YAML string (uses the `yaml` package).
 */
export function toYamlString(data: unknown): string {
	return stringifyYaml(data);
}

/**
 * Parse a YAML string into a typed object.  Returns `undefined` when the
 * string is empty or only contains whitespace.
 */
export function fromYamlString<T = unknown>(yamlStr: string): T | undefined {
	const trimmed = yamlStr.trim();
	if (!trimmed) return undefined;
	return parseYaml(trimmed) as T;
}

function resolveContentPath(pathValue: string, cwd: string) {
	if (isAbsolute(pathValue)) {
		throw new ValidationError(
			"Absolute paths are not allowed.",
			createErrorContext("content-processor"),
			"path",
		);
	}

	const fullPath = resolve(cwd, pathValue);
	const relativePath = relative(cwd, fullPath);
	if (
		relativePath === ".." ||
		relativePath.startsWith(`..${sep}`) ||
		isAbsolute(relativePath)
	) {
		throw new ValidationError(
			"Path traversal outside the workspace is not allowed.",
			createErrorContext("content-processor"),
			"path",
		);
	}

	return {
		fullPath,
		relativePath,
	};
}
