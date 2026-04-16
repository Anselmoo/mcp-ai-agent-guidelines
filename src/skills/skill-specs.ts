import type { ModelClass, SkillManifestEntry } from "../contracts/generated.js";

const GENERATED_MODULE_EXTENSION = import.meta.url.endsWith(".ts")
	? ".ts"
	: ".js";

const { ALIAS_ENTRIES } = (await import(
	new URL(
		`../generated/graph/aliases${GENERATED_MODULE_EXTENSION}`,
		import.meta.url,
	).href
)) as {
	ALIAS_ENTRIES: { legacyId: string; canonicalId: string }[];
};
const { SKILL_MANIFESTS } = (await import(
	new URL(
		`../generated/manifests/skill-manifests${GENERATED_MODULE_EXTENSION}`,
		import.meta.url,
	).href
)) as {
	SKILL_MANIFESTS: SkillManifestEntry[];
};

export interface SkillSpecDefinition extends SkillManifestEntry {
	legacyIds: string[];
}

const LEGACY_IDS_BY_CANONICAL = (() => {
	const legacyIdsByCanonical = new Map<string, string[]>();
	for (const entry of ALIAS_ENTRIES) {
		if (entry.legacyId === entry.canonicalId) {
			continue;
		}
		const existing = legacyIdsByCanonical.get(entry.canonicalId) ?? [];
		existing.push(entry.legacyId);
		legacyIdsByCanonical.set(entry.canonicalId, existing);
	}
	for (const legacyIds of legacyIdsByCanonical.values()) {
		legacyIds.sort();
	}
	return legacyIdsByCanonical;
})();

export const SKILL_SPECS: SkillSpecDefinition[] = SKILL_MANIFESTS.map(
	(manifest) => ({
		...manifest,
		sourcePath: `src/skills/skill-specs.ts#${manifest.id}`,
		legacyIds: [...(LEGACY_IDS_BY_CANONICAL.get(manifest.id) ?? [])],
	}),
);

export const SKILL_SPECS_BY_ID: ReadonlyMap<string, SkillSpecDefinition> =
	new Map(SKILL_SPECS.map((spec) => [spec.id, spec] as const));

export const LEGACY_SKILL_IDS_TO_CANONICAL: ReadonlyMap<string, string> =
	new Map(
		SKILL_SPECS.flatMap((spec) =>
			spec.legacyIds.map((legacyId) => [legacyId, spec.id] as const),
		),
	);

export function getSkillSpec(skillId: string): SkillSpecDefinition {
	const canonicalId = LEGACY_SKILL_IDS_TO_CANONICAL.get(skillId) ?? skillId;
	const spec = SKILL_SPECS_BY_ID.get(canonicalId);
	if (!spec) {
		throw new Error(`Unknown skill spec: ${skillId}`);
	}
	return spec;
}

export function canonicalSkillId(skillId: string): string {
	return LEGACY_SKILL_IDS_TO_CANONICAL.get(skillId) ?? skillId;
}

export function skillSpecModelClass(skillId: string): ModelClass {
	return getSkillSpec(skillId).preferredModelClass;
}
