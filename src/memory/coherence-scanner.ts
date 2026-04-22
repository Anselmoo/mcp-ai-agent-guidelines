import { readFile } from "node:fs/promises";
import { basename, dirname, extname } from "node:path";
import fg from "fast-glob";
import { PUBLIC_INSTRUCTION_SPECS } from "../instructions/instruction-specs.js";
import { SKILL_SPECS } from "../skills/skill-specs.js";
import type { LspClient } from "../snapshots/language_server_adapter.js";
import {
	computeFileHash,
	type TrackedSymbol,
} from "../snapshots/symbol-change-tracker.js";
import type {
	CodebaseFingerprint,
	FingerprintFileSummary,
	SnapshotFileCategory,
} from "./coherence-types.js";
import {
	extractAllSymbolMap,
	extractSymbolMapFallback,
	extractSymbolMapViaLsp,
} from "./lsp-scan-bridge.js";

const DEFAULT_CODE_FILE_PATTERNS = [
	"**/*.{js,jsx,ts,tsx,mjs,cjs,py,rs,go,java,kt,kts,rb,php,swift,c,cc,cpp,h,hpp,cs,scala,sh}",
];

const DEFAULT_SKILL_PATTERNS = ["src/skills/skill-specs.ts"];

const DEFAULT_INSTRUCTION_PATTERNS = ["src/instructions/instruction-specs.ts"];

const DEFAULT_IGNORE_PATTERNS = [
	"**/node_modules/**",
	"**/.git/**",
	"**/dist/**",
	"**/build/**",
	"**/coverage/**",
	"**/target/**",
	"**/.venv/**",
	"**/venv/**",
	"**/__pycache__/**",
	"**/.mcp-ai-agent-guidelines/**",
	// ignore common provider SDKs and local provider folders
	"**/claude/**",
	"**/codex/**",
	"**/openai/**",
	"**/gemini/**",
	"**/mistral/**",
	"**/anthropic/**",
	"**/h2o/**",
];

export interface CodebaseScannerOptions {
	skillPatterns?: string[];
	instructionPatterns?: string[];
	codeFilePatterns?: string[];
	ignorePatterns?: string[];
	respectGitignore?: boolean;
	/**
	 * Fallback called when the skillPatterns glob returns zero results.
	 * Typically injected from the live SkillRegistry so the scanner works
	 * in repos where .github/skills/ has been removed (skills compiled into TS).
	 */
	skillIdSource?: () => string[];
	/**
	 * Fallback called when the instructionPatterns glob returns zero results.
	 * Typically injected from the live InstructionRegistry.
	 */
	instructionNameSource?: () => string[];
	/**
	 * Optional live LSP client. When provided, symbol extraction uses the
	 * LanguageServerAdapter (richer, cached) instead of the regex fallback.
	 */
	lsClient?: LspClient;
	/**
	 * Directory for the two-layer LSP symbol cache written by LanguageServerAdapter.
	 * Defaults to `<cwd>/.mcp-ai-agent-guidelines/symbol-cache`.
	 */
	symbolCacheDir?: string;
	/**
	 * Called for each source file as it is summarised during `scan()`.
	 * Useful for driving progress-bar / spinner updates.
	 * `index` is 0-based; `total` is the count of code files in this scan.
	 */
	onProgress?: (filePath: string, index: number, total: number) => void;
}

function uniqueSorted(values: readonly string[]) {
	return [...new Set(values)].sort();
}

function isSkillRegistryFile(path: string) {
	return path.replace(/\\/g, "/").endsWith("src/skills/skill-specs.ts");
}

function isInstructionRegistryFile(path: string) {
	return path
		.replace(/\\/g, "/")
		.endsWith("src/instructions/instruction-specs.ts");
}

function defaultSkillIds() {
	return SKILL_SPECS.map((spec) => spec.id);
}

function defaultInstructionNames() {
	return PUBLIC_INSTRUCTION_SPECS.map((spec) => spec.id);
}

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
	".js": "javascript",
	".jsx": "javascriptreact",
	".ts": "typescript",
	".tsx": "typescriptreact",
	".mjs": "javascript",
	".cjs": "javascript",
	".py": "python",
	".rs": "rust",
	".go": "go",
	".java": "java",
	".kt": "kotlin",
	".kts": "kotlin",
	".rb": "ruby",
	".php": "php",
	".swift": "swift",
	".c": "c",
	".cc": "cpp",
	".cpp": "cpp",
	".h": "c",
	".hpp": "cpp",
	".cs": "csharp",
	".scala": "scala",
	".sh": "shell",
};

function languageForPath(filePath: string): string {
	return LANGUAGE_BY_EXTENSION[extname(filePath).toLowerCase()] ?? "text";
}

function classifyFileCategory(filePath: string): SnapshotFileCategory {
	const normalizedPath = filePath.replace(/\\/g, "/");

	if (
		normalizedPath.includes("/generated/") ||
		normalizedPath.startsWith("coverage/") ||
		normalizedPath.startsWith("dist/") ||
		normalizedPath.startsWith("build/")
	) {
		return "generated";
	}

	if (
		normalizedPath.startsWith("docs/") ||
		normalizedPath.endsWith("README.md") ||
		normalizedPath.endsWith("CHANGELOG.md")
	) {
		return "docs";
	}

	if (
		normalizedPath.startsWith(".github/workflows/") ||
		normalizedPath.includes("/workflows/") ||
		normalizedPath.includes("/ci/") ||
		normalizedPath.endsWith("lefthook.yml")
	) {
		return "ci";
	}

	if (
		normalizedPath.includes("/tests/") ||
		normalizedPath.includes("/__tests__/") ||
		normalizedPath.endsWith(".test.ts") ||
		normalizedPath.endsWith(".test.tsx") ||
		normalizedPath.endsWith(".spec.ts") ||
		normalizedPath.endsWith(".spec.tsx")
	) {
		return "test";
	}

	if (
		normalizedPath.endsWith(".json") ||
		normalizedPath.endsWith(".toml") ||
		normalizedPath.endsWith(".yaml") ||
		normalizedPath.endsWith(".yml") ||
		normalizedPath.startsWith("config/") ||
		normalizedPath.includes("/config/")
	) {
		return "config";
	}

	if (normalizedPath.startsWith("src/")) {
		return "source";
	}

	return "other";
}

function buildSymbolKindCounts(
	symbols: TrackedSymbol[],
): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const symbol of symbols) {
		counts[symbol.kind] = (counts[symbol.kind] ?? 0) + 1;
	}
	return counts;
}

async function buildFileSummaries(
	repositoryRoot: string,
	codePaths: readonly string[],
	symbolMap: Record<string, string[]>,
	onProgress?: (filePath: string, index: number, total: number) => void,
): Promise<FingerprintFileSummary[]> {
	const tsPaths = codePaths.filter(
		(path) => path.endsWith(".ts") || path.endsWith(".tsx"),
	);
	const allSymbols = await extractAllSymbolMap(repositoryRoot, tsPaths, {
		includePrivate: false,
		includeMembers: true,
	});

	const summaries = await Promise.all(
		codePaths.map(async (relativePath, index) => {
			const content = await readFile(relativePath, "utf8").catch((error) => {
				if (
					typeof error === "object" &&
					error !== null &&
					"code" in error &&
					error.code === "ENOENT"
				) {
					return "";
				}
				throw error;
			});
			const fileSymbols = allSymbols[relativePath] ?? [];
			onProgress?.(relativePath, index, codePaths.length);
			return {
				path: relativePath,
				contentHash: computeFileHash(content),
				language: languageForPath(relativePath),
				category: classifyFileCategory(relativePath),
				exportedSymbols: symbolMap[relativePath] ?? [],
				totalSymbols: fileSymbols.length,
				symbolKinds: buildSymbolKindCounts(fileSymbols),
			} satisfies FingerprintFileSummary;
		}),
	);

	return summaries.sort((left, right) => left.path.localeCompare(right.path));
}

export class CodebaseScanner {
	private readonly options: Required<
		Omit<
			CodebaseScannerOptions,
			| "skillIdSource"
			| "instructionNameSource"
			| "lsClient"
			| "symbolCacheDir"
			| "onProgress"
		>
	>;
	private readonly skillIdSource?: () => string[];
	private readonly instructionNameSource?: () => string[];
	private readonly lsClient?: LspClient;
	private readonly symbolCacheDir: string;
	private readonly onProgress?: (
		filePath: string,
		index: number,
		total: number,
	) => void;

	constructor(options: CodebaseScannerOptions = {}) {
		this.options = {
			skillPatterns: options.skillPatterns ?? DEFAULT_SKILL_PATTERNS,
			instructionPatterns:
				options.instructionPatterns ?? DEFAULT_INSTRUCTION_PATTERNS,
			codeFilePatterns: options.codeFilePatterns ?? DEFAULT_CODE_FILE_PATTERNS,
			ignorePatterns: uniqueSorted([
				...DEFAULT_IGNORE_PATTERNS,
				...(options.ignorePatterns ?? []),
			]),
			respectGitignore: options.respectGitignore ?? true,
		};
		this.skillIdSource = options.skillIdSource;
		this.instructionNameSource = options.instructionNameSource;
		this.lsClient = options.lsClient;
		this.symbolCacheDir =
			options.symbolCacheDir ?? ".mcp-ai-agent-guidelines/symbol-cache";
		this.onProgress = options.onProgress;
	}

	async scan(): Promise<CodebaseFingerprint> {
		const globOptions = {
			onlyFiles: true,
			ignore: this.options.ignorePatterns,
			gitignore: this.options.respectGitignore,
		};
		const [skillFiles, instructionFiles, codeFiles] = await Promise.all([
			fg.glob(this.options.skillPatterns, globOptions),
			fg.glob(this.options.instructionPatterns, globOptions),
			fg.glob(this.options.codeFilePatterns, globOptions),
		]);
		const sortedCodePaths = uniqueSorted(codeFiles);

		// When the filesystem globs return nothing (e.g. .github/skills/ has been
		// removed because skills are compiled into TS), fall back to live registry
		// data injected via skillIdSource / instructionNameSource.
		const skillIds =
			skillFiles.length > 0
				? skillFiles.every(isSkillRegistryFile)
					? uniqueSorted(
							this.skillIdSource ? this.skillIdSource() : defaultSkillIds(),
						)
					: uniqueSorted(
							skillFiles.map((path) => dirname(path).replace(/\\/g, "/")),
						)
				: uniqueSorted(
						this.skillIdSource ? this.skillIdSource() : defaultSkillIds(),
					);

		const instructionNames =
			instructionFiles.length > 0
				? instructionFiles.every(isInstructionRegistryFile)
					? uniqueSorted(
							this.instructionNameSource
								? this.instructionNameSource()
								: defaultInstructionNames(),
						)
					: uniqueSorted(
							instructionFiles.map((filePath) =>
								basename(filePath).replace(/\.instructions\.md$/, ""),
							),
						)
				: uniqueSorted(
						this.instructionNameSource
							? this.instructionNameSource()
							: defaultInstructionNames(),
					);

		// Symbol map — TS/TSX files only
		const tsPaths = sortedCodePaths.filter(
			(p) => p.endsWith(".ts") || p.endsWith(".tsx"),
		);
		const symbolMap = await (this.lsClient
			? extractSymbolMapViaLsp(
					process.cwd(),
					this.symbolCacheDir,
					this.lsClient,
					tsPaths,
				)
			: extractSymbolMapFallback(process.cwd(), tsPaths));
		const fileSummaries = await buildFileSummaries(
			process.cwd(),
			sortedCodePaths,
			symbolMap,
			this.onProgress,
		);

		return {
			capturedAt: new Date().toISOString(),
			skillIds,
			instructionNames,
			codePaths: sortedCodePaths,
			srcPaths: sortedCodePaths,
			fileSummaries,
			symbolMap,
		};
	}
}
