import { describe, expect, it } from "vitest";
import {
	canonicalSkillId,
	getSkillSpec,
	LEGACY_SKILL_IDS_TO_CANONICAL,
	SKILL_SPECS,
	SKILL_SPECS_BY_ID,
	skillSpecModelClass,
} from "../../../skills/skill-specs.js";

// Note: the `import.meta.url.endsWith(".ts") ? ".ts" : ".js"` branch at the top
// of skill-specs.ts cannot be exercised from a unit test — Vitest always
// executes the `.ts` source directly, so the `.js` fallback branch (used only
// when running compiled output from dist/) is unreachable in this harness.

describe("skill-specs", () => {
	it("exposes a non-empty set of skill specs keyed by canonical id", () => {
		expect(SKILL_SPECS.length).toBeGreaterThan(0);
		expect(SKILL_SPECS_BY_ID.size).toBe(SKILL_SPECS.length);
		for (const spec of SKILL_SPECS) {
			expect(SKILL_SPECS_BY_ID.get(spec.id)).toBe(spec);
			expect(spec.sourcePath).toBe(`src/skills/skill-specs.ts#${spec.id}`);
		}
	});

	it("getSkillSpec resolves a canonical skill id directly", () => {
		const canonicalId = "adapt-aco-router";
		const spec = getSkillSpec(canonicalId);
		expect(spec.id).toBe(canonicalId);
	});

	it("getSkillSpec resolves a legacy skill id to its canonical spec", () => {
		const legacyId = "adv-aco-router";
		const canonicalId = "adapt-aco-router";
		expect(LEGACY_SKILL_IDS_TO_CANONICAL.get(legacyId)).toBe(canonicalId);

		const spec = getSkillSpec(legacyId);
		expect(spec.id).toBe(canonicalId);
		expect(spec.legacyIds).toContain(legacyId);
	});

	it("getSkillSpec throws for an unknown skill id", () => {
		expect(() => getSkillSpec("totally-unknown-skill-id")).toThrow(
			"Unknown skill spec: totally-unknown-skill-id",
		);
	});

	it("canonicalSkillId maps a legacy id to its canonical id", () => {
		expect(canonicalSkillId("adv-aco-router")).toBe("adapt-aco-router");
	});

	it("canonicalSkillId returns the input unchanged when it has no legacy mapping", () => {
		expect(canonicalSkillId("not-a-registered-alias")).toBe(
			"not-a-registered-alias",
		);
	});

	it("skillSpecModelClass returns the preferred model class for a canonical id", () => {
		const spec = getSkillSpec("adapt-aco-router");
		expect(skillSpecModelClass("adapt-aco-router")).toBe(
			spec.preferredModelClass,
		);
	});

	it("skillSpecModelClass resolves through a legacy id as well", () => {
		expect(skillSpecModelClass("adv-aco-router")).toBe(
			skillSpecModelClass("adapt-aco-router"),
		);
	});

	it("skillSpecModelClass throws for an unknown skill id", () => {
		expect(() => skillSpecModelClass("totally-unknown-skill-id")).toThrow(
			"Unknown skill spec: totally-unknown-skill-id",
		);
	});
});
