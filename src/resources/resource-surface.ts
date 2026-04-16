import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { encode as toonEncode } from "@toon-format/toon";
import type {
	ExecutionProgressRecord,
	SessionStateStore,
} from "../contracts/runtime.js";
import { ALIAS_ENTRIES } from "../generated/graph/aliases.js";
import { INSTRUCTION_SKILL_EDGES } from "../generated/graph/instruction-skill-edges.js";
import { TAXONOMY_ENTRIES } from "../generated/graph/taxonomy.js";
import {
	type ToonMemoryArtifact,
	ToonMemoryInterface,
	type ToonSessionContext,
} from "../memory/toon-interface.js";
import { splitProgressRecords } from "../memory/toon-memory-helpers.js";

export interface PublicResourceDefinition {
	uri: string;
	name: string;
	description: string;
	mimeType: string;
}

interface SupportingSkillExplanationAsset {
	fileName: string;
	uri: string;
	text: string;
}

interface SupportingSkillToolAsset {
	fileName: string;
	uri: string;
	text: string;
}

interface SupportingSkillRecord {
	family: string;
	skillId: string;
	name: string;
	title: string;
	description: string;
	skillUri: string;
	skillMarkdown: string;
	explanationsIndexUri: string;
	explanations: SupportingSkillExplanationAsset[];
	toolsIndexUri: string;
	toolPackageUri: string | null;
	toolPackageText: string | null;
	toolSources: SupportingSkillToolAsset[];
}

interface SupportingAssetResource {
	definition: PublicResourceDefinition;
	text: string;
}

interface SupportingAssetCache {
	resources: SupportingAssetResource[];
	resourceByUri: ReadonlyMap<string, SupportingAssetResource>;
}

export interface PublicResourceOptions {
	workspaceRoot?: string;
}

export interface ReadPublicResourceOptions extends PublicResourceOptions {
	memoryInterface?: ToonMemoryInterface;
}

const supportingAssetCaches = new Map<string, SupportingAssetCache>();

/**
 * Evicts the supporting-asset cache for the given workspace root (or all
 * roots when called without arguments).  Callers that refresh skill assets
 * at runtime — e.g. tests, hot-reload scenarios, or long-running server
 * processes — should call this before `buildPublicResources` to guarantee
 * fresh discovery results.
 */
export function clearSupportingAssetCache(workspaceRoot?: string): void {
	if (workspaceRoot === undefined) {
		supportingAssetCaches.clear();
	} else {
		supportingAssetCaches.delete(resolveSupportingWorkspaceRoot(workspaceRoot));
	}
}

function toTextResource(
	uri: string,
	name: string,
	description: string,
	mimeType: string,
	text: string,
) {
	return {
		resource: {
			uri,
			mimeType,
			text,
		},
		name,
		description,
		mimeType,
	};
}

function toJsonResource(
	uri: string,
	name: string,
	description: string,
	value: unknown,
) {
	return {
		resource: {
			uri,
			mimeType: "application/json",
			text: `${JSON.stringify(value, null, "\t")}\n`,
		},
		name,
		description,
		mimeType: "application/json",
	};
}

function readUtf8IfPresent(path: string) {
	if (!existsSync(path)) {
		return null;
	}

	return readFileSync(path, "utf8");
}

function parseSkillMarkdownMetadata(markdown: string, skillId: string) {
	const lines = markdown.split(/\r?\n/u);
	let title = skillId;
	let name = skillId;
	let description = "";

	if (lines[0] === "---") {
		for (let index = 1; index < lines.length; index += 1) {
			const line = lines[index];
			if (line === "---") {
				break;
			}

			if (line.startsWith("name:")) {
				name = line.slice("name:".length).trim() || skillId;
				continue;
			}

			if (line.startsWith("description:")) {
				const rawDescription = line.slice("description:".length).trim();
				if (rawDescription === ">") {
					const chunks: string[] = [];
					for (
						let descriptionIndex = index + 1;
						descriptionIndex < lines.length;
						descriptionIndex += 1
					) {
						const descriptionLine = lines[descriptionIndex];
						if (!descriptionLine.startsWith("  ")) {
							break;
						}

						chunks.push(descriptionLine.trim());
						index = descriptionIndex;
					}
					description = chunks.join(" ");
					continue;
				}

				description = rawDescription;
			}
		}
	}

	const heading = lines.find((line) => line.startsWith("# "));
	if (heading) {
		title = heading.slice(2).trim();
	}

	return {
		name,
		title,
		description,
	};
}

function resolveSupportingWorkspaceRoot(workspaceRoot?: string) {
	return resolve(workspaceRoot ?? process.cwd());
}

function resolveSupportingSkillsRoot(workspaceRoot?: string) {
	return resolve(
		resolveSupportingWorkspaceRoot(workspaceRoot),
		".github",
		"skills",
	);
}

function discoverSupportingSkills(
	workspaceRoot?: string,
): SupportingSkillRecord[] {
	const supportingSkillsRoot = resolveSupportingSkillsRoot(workspaceRoot);
	if (!existsSync(supportingSkillsRoot)) {
		return [];
	}

	const skills: SupportingSkillRecord[] = [];

	const entries = readdirSync(supportingSkillsRoot, {
		withFileTypes: true,
	})
		.filter((entry) => entry.isDirectory())
		.sort((left, right) => left.name.localeCompare(right.name));

	for (const entry of entries) {
		const skillId = entry.name;
		const familySeparatorIndex = skillId.indexOf("-");
		if (familySeparatorIndex <= 0) {
			continue;
		}

		const skillPath = resolve(supportingSkillsRoot, skillId);
		const skillMarkdownPath = resolve(skillPath, "SKILL.md");
		const skillMarkdown = readUtf8IfPresent(skillMarkdownPath);

		if (skillMarkdown === null) {
			continue;
		}

		const family = skillId.slice(0, familySeparatorIndex);
		const metadata = parseSkillMarkdownMetadata(skillMarkdown, skillId);
		const explanationPath = resolve(skillPath, "explanation");
		const explanations = existsSync(explanationPath)
			? readdirSync(explanationPath, { withFileTypes: true })
					.filter(
						(child) =>
							child.isFile() && extname(child.name).toLowerCase() === ".md",
					)
					.sort((left, right) => left.name.localeCompare(right.name))
					.map((child) => ({
						fileName: child.name,
						uri: `mcp-guidelines://supporting-assets/skills/${skillId}/explanations/${child.name}`,
						text: readFileSync(resolve(explanationPath, child.name), "utf8"),
					}))
			: [];
		const toolsPath = resolve(skillPath, "tools");
		const toolEntries = existsSync(toolsPath)
			? readdirSync(toolsPath, { withFileTypes: true })
					.filter((child) => child.isFile())
					.sort((left, right) => left.name.localeCompare(right.name))
			: [];
		const toolSources = toolEntries
			.filter((child) => child.name !== "package.json")
			.map((child) => ({
				fileName: child.name,
				uri: `mcp-guidelines://supporting-assets/skills/${skillId}/tools/source/${child.name}`,
				text: readFileSync(resolve(toolsPath, child.name), "utf8"),
			}));
		const toolPackageText = readUtf8IfPresent(
			resolve(toolsPath, "package.json"),
		);

		skills.push({
			family,
			skillId,
			name: metadata.name,
			title: metadata.title,
			description: metadata.description,
			skillUri: `mcp-guidelines://supporting-assets/skills/${skillId}/SKILL.md`,
			skillMarkdown,
			explanationsIndexUri: `mcp-guidelines://supporting-assets/skills/${skillId}/explanations`,
			explanations,
			toolsIndexUri: `mcp-guidelines://supporting-assets/skills/${skillId}/tools`,
			toolPackageUri:
				toolPackageText === null
					? null
					: `mcp-guidelines://supporting-assets/skills/${skillId}/tools/package.json`,
			toolPackageText,
			toolSources,
		});
	}

	return skills;
}

function buildSupportingAssetCache(
	workspaceRoot?: string,
): SupportingAssetCache {
	const skills = discoverSupportingSkills(workspaceRoot);
	const resources: SupportingAssetResource[] = [];
	const families = [...new Set(skills.map((skill) => skill.family))].sort(
		(left, right) => left.localeCompare(right),
	);
	const familyIndexes = families.map((family) => {
		const familySkills = skills.filter((skill) => skill.family === family);

		return {
			family,
			uri: `mcp-guidelines://supporting-assets/${family}`,
			skills: familySkills.map((skill) => ({
				skillId: skill.skillId,
				name: skill.name,
				title: skill.title,
				description: skill.description,
				uri: `mcp-guidelines://supporting-assets/skills/${skill.skillId}`,
			})),
		};
	});

	resources.push({
		definition: {
			uri: "mcp-guidelines://supporting-assets",
			name: "supporting-assets",
			description: "Index of read-only authored supporting skill assets.",
			mimeType: "application/json",
		},
		text: `${JSON.stringify(
			{
				totalSkillCount: skills.length,
				families: familyIndexes.map((familyIndex) => ({
					family: familyIndex.family,
					skillCount: familyIndex.skills.length,
					uri: familyIndex.uri,
				})),
			},
			null,
			"\t",
		)}\n`,
	});

	for (const familyIndex of familyIndexes) {
		resources.push({
			definition: {
				uri: familyIndex.uri,
				name: `${familyIndex.family}-supporting-assets`,
				description: `Index of read-only ${familyIndex.family} supporting skill assets.`,
				mimeType: "application/json",
			},
			text: `${JSON.stringify(
				{
					family: familyIndex.family,
					skillCount: familyIndex.skills.length,
					skills: familyIndex.skills,
				},
				null,
				"\t",
			)}\n`,
		});
	}

	for (const skill of skills) {
		const skillIndexUri = `mcp-guidelines://supporting-assets/skills/${skill.skillId}`;

		resources.push({
			definition: {
				uri: skillIndexUri,
				name: `${skill.skillId}-supporting-assets`,
				description: `Read-only supporting asset index for ${skill.skillId}.`,
				mimeType: "application/json",
			},
			text: `${JSON.stringify(
				{
					family: skill.family,
					skillId: skill.skillId,
					name: skill.name,
					title: skill.title,
					description: skill.description,
					skillUri: skill.skillUri,
					explanationsIndexUri: skill.explanationsIndexUri,
					explanations: skill.explanations.map((explanation) => ({
						fileName: explanation.fileName,
						uri: explanation.uri,
					})),
					toolsIndexUri: skill.toolsIndexUri,
					toolPackageUri: skill.toolPackageUri,
					toolSources: skill.toolSources.map((toolSource) => ({
						fileName: toolSource.fileName,
						uri: toolSource.uri,
					})),
				},
				null,
				"\t",
			)}\n`,
		});

		resources.push({
			definition: {
				uri: skill.skillUri,
				name: `${skill.skillId}-skill-markdown`,
				description: `Supporting SKILL.md for ${skill.skillId}.`,
				mimeType: "text/markdown",
			},
			text: skill.skillMarkdown,
		});

		resources.push({
			definition: {
				uri: skill.explanationsIndexUri,
				name: `${skill.skillId}-explanations`,
				description: `Explanation document index for ${skill.skillId}.`,
				mimeType: "application/json",
			},
			text: `${JSON.stringify(
				{
					skillId: skill.skillId,
					documents: skill.explanations.map((explanation) => ({
						fileName: explanation.fileName,
						uri: explanation.uri,
					})),
				},
				null,
				"\t",
			)}\n`,
		});

		for (const explanation of skill.explanations) {
			resources.push({
				definition: {
					uri: explanation.uri,
					name: `${skill.skillId}-${explanation.fileName}`,
					description: `Explanation markdown for ${skill.skillId}/${explanation.fileName}.`,
					mimeType: "text/markdown",
				},
				text: explanation.text,
			});
		}

		resources.push({
			definition: {
				uri: skill.toolsIndexUri,
				name: `${skill.skillId}-tool-assets`,
				description: `Safe read-only tool asset index for ${skill.skillId}.`,
				mimeType: "application/json",
			},
			text: `${JSON.stringify(
				{
					skillId: skill.skillId,
					packageJsonUri: skill.toolPackageUri,
					sourceFiles: skill.toolSources.map((toolSource) => ({
						fileName: toolSource.fileName,
						uri: toolSource.uri,
					})),
				},
				null,
				"\t",
			)}\n`,
		});

		if (skill.toolPackageUri !== null && skill.toolPackageText !== null) {
			resources.push({
				definition: {
					uri: skill.toolPackageUri,
					name: `${skill.skillId}-tool-package`,
					description: `Read-only tool package manifest for ${skill.skillId}.`,
					mimeType: "application/json",
				},
				text: skill.toolPackageText,
			});
		}

		for (const toolSource of skill.toolSources) {
			resources.push({
				definition: {
					uri: toolSource.uri,
					name: `${skill.skillId}-${toolSource.fileName}`,
					description: `Read-only tool source for ${skill.skillId}/${toolSource.fileName}.`,
					mimeType: "application/typescript",
				},
				text: toolSource.text,
			});
		}
	}

	return {
		resources,
		resourceByUri: new Map(
			resources.map((resource) => [resource.definition.uri, resource]),
		),
	};
}

function getSupportingAssetCache(workspaceRoot?: string) {
	const resolvedWorkspaceRoot = resolveSupportingWorkspaceRoot(workspaceRoot);
	const cached = supportingAssetCaches.get(resolvedWorkspaceRoot);
	if (cached !== undefined) {
		return cached;
	}

	const supportingAssetCache = buildSupportingAssetCache(resolvedWorkspaceRoot);
	supportingAssetCaches.set(resolvedWorkspaceRoot, supportingAssetCache);
	return supportingAssetCache;
}

function isReadPublicResourceOptions(
	value: ReadPublicResourceOptions | ToonMemoryInterface,
): value is ReadPublicResourceOptions {
	return "workspaceRoot" in value || "memoryInterface" in value;
}

export function buildPublicResources(
	sessionId: string,
	options: PublicResourceOptions = {},
): PublicResourceDefinition[] {
	return [
		{
			uri: "mcp-guidelines://graph/taxonomy",
			name: "taxonomy",
			description: "Skill taxonomy prefixes and domains.",
			mimeType: "application/json",
		},
		{
			uri: "mcp-guidelines://graph/aliases",
			name: "aliases",
			description: "Legacy-to-canonical skill aliases.",
			mimeType: "application/json",
		},
		{
			uri: "mcp-guidelines://graph/instruction-skill-edges",
			name: "instruction-skill-edges",
			description: "Instruction to hidden-skill graph.",
			mimeType: "application/json",
		},
		{
			uri: "mcp-guidelines://graph/skill-graph",
			name: "skill-graph",
			description:
				"Unified skill graph: taxonomy, aliases, and instruction-to-skill edges combined into a single navigable JSON structure.",
			mimeType: "application/json",
		},
		{
			uri: `mcp-guidelines://session/${sessionId}/progress`,
			name: "session-progress",
			description: "Structured progress history for the current session.",
			mimeType: "application/json",
		},
		{
			uri: `mcp-guidelines://session/${sessionId}/context`,
			name: "session-context",
			description:
				"TOON session context for the current session, loading persisted context or deriving one from secure progress history.",
			mimeType: "application/toon",
		},
		{
			uri: "mcp-guidelines://memory/artifacts",
			name: "memory-artifacts",
			description:
				"Index of persisted TOON memory artifacts, including per-artifact MCP URIs.",
			mimeType: "application/json",
		},
		...getSupportingAssetCache(options.workspaceRoot).resources.map(
			(resource) => resource.definition,
		),
	];
}

function buildDerivedSessionContext(
	sessionId: string,
	history: ExecutionProgressRecord[],
): ToonSessionContext {
	const progress = splitProgressRecords(history);
	const now = new Date().toISOString();

	return {
		meta: {
			version: "derived-from-secure-history",
			created: now,
			updated: now,
			sessionId,
		},
		context: {
			requestScope:
				"Derived session context projection from SecureFileSessionStore history.",
			constraints: [],
			phase: "runtime-history",
		},
		progress,
		memory: {
			keyInsights: [
				"Session context was derived from secure runtime progress history because no persisted TOON session context was found.",
			],
			decisions: {},
			patterns: [],
			warnings: [],
		},
	};
}

function buildMemoryArtifactIndex(artifacts: ToonMemoryArtifact[]) {
	return artifacts.map((artifact) => ({
		id: artifact.meta.id,
		summary: artifact.content.summary,
		tags: artifact.meta.tags,
		relevance: artifact.meta.relevance,
		relatedSessions: artifact.links.relatedSessions,
		uri: `mcp-guidelines://memory/artifacts/${artifact.meta.id}`,
	}));
}

export async function readPublicResource(
	uri: string,
	sessionId: string,
	sessionStore: SessionStateStore,
	memoryInterface?: ToonMemoryInterface,
): Promise<{ contents: { uri: string; mimeType: string; text: string }[] }>;
export async function readPublicResource(
	uri: string,
	sessionId: string,
	sessionStore: SessionStateStore,
	options?: ReadPublicResourceOptions,
): Promise<{ contents: { uri: string; mimeType: string; text: string }[] }>;
export async function readPublicResource(
	uri: string,
	sessionId: string,
	sessionStore: SessionStateStore,
	optionsOrMemoryInterface?: ReadPublicResourceOptions | ToonMemoryInterface,
) {
	const options: ReadPublicResourceOptions =
		optionsOrMemoryInterface === undefined
			? {}
			: isReadPublicResourceOptions(optionsOrMemoryInterface)
				? optionsOrMemoryInterface
				: { memoryInterface: optionsOrMemoryInterface };
	const memoryInterface = options.memoryInterface ?? new ToonMemoryInterface();
	switch (uri) {
		case "mcp-guidelines://graph/taxonomy":
			return {
				contents: [
					toJsonResource(
						uri,
						"taxonomy",
						"Skill taxonomy prefixes and domains.",
						TAXONOMY_ENTRIES,
					).resource,
				],
			};
		case "mcp-guidelines://graph/aliases":
			return {
				contents: [
					toJsonResource(
						uri,
						"aliases",
						"Legacy-to-canonical skill aliases.",
						ALIAS_ENTRIES,
					).resource,
				],
			};
		case "mcp-guidelines://graph/instruction-skill-edges":
			return {
				contents: [
					toJsonResource(
						uri,
						"instruction-skill-edges",
						"Instruction to hidden-skill graph.",
						INSTRUCTION_SKILL_EDGES,
					).resource,
				],
			};
		case "mcp-guidelines://graph/skill-graph": {
			const skillGraph = {
				taxonomy: TAXONOMY_ENTRIES,
				aliases: ALIAS_ENTRIES,
				instructionSkillEdges: INSTRUCTION_SKILL_EDGES,
			};
			return {
				contents: [
					toJsonResource(
						uri,
						"skill-graph",
						"Unified skill graph: taxonomy, aliases, and instruction-to-skill edges.",
						skillGraph,
					).resource,
				],
			};
		}
		case `mcp-guidelines://session/${sessionId}/progress`: {
			const history: ExecutionProgressRecord[] =
				await sessionStore.readSessionHistory(sessionId);
			return {
				contents: [
					toJsonResource(
						uri,
						"session-progress",
						"Structured progress history for the current session.",
						history,
					).resource,
				],
			};
		}
		case `mcp-guidelines://session/${sessionId}/context`: {
			const storedContext = await memoryInterface.loadSessionContext(sessionId);
			const context =
				storedContext ??
				buildDerivedSessionContext(
					sessionId,
					await sessionStore.readSessionHistory(sessionId),
				);
			return {
				contents: [
					{
						uri,
						mimeType: "application/toon",
						text: toonEncode(context, { delimiter: "\t", keyFolding: "safe" }),
					},
				],
			};
		}
		case "mcp-guidelines://memory/artifacts": {
			const artifacts = await memoryInterface.findMemoryArtifacts();
			return {
				contents: [
					toJsonResource(
						uri,
						"memory-artifacts",
						"Index of persisted TOON memory artifacts, including per-artifact MCP URIs.",
						buildMemoryArtifactIndex(artifacts),
					).resource,
				],
			};
		}
		default: {
			if (uri.startsWith("mcp-guidelines://memory/artifacts/")) {
				const memoryId = uri.slice("mcp-guidelines://memory/artifacts/".length);
				if (memoryId.length === 0) {
					throw new Error(`Unknown resource: ${uri}`);
				}
				const artifact = await memoryInterface.loadMemoryArtifact(memoryId);
				if (!artifact) {
					throw new Error(`Unknown resource: ${uri}`);
				}
				return {
					contents: [
						{
							uri,
							mimeType: "application/toon",
							text: toonEncode(artifact, {
								delimiter: "\t",
								keyFolding: "safe",
							}),
						},
					],
				};
			}
			const resource = getSupportingAssetCache(
				options.workspaceRoot,
			).resourceByUri.get(uri);
			if (resource !== undefined) {
				return {
					contents: [
						toTextResource(
							resource.definition.uri,
							resource.definition.name,
							resource.definition.description,
							resource.definition.mimeType,
							resource.text,
						).resource,
					],
				};
			}

			throw new Error(`Unknown resource: ${uri}`);
		}
	}
}
