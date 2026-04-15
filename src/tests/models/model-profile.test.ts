// src/tests/models/model-profile.test.ts
import { describe, expect, it } from "vitest";
import {
	MODEL_PROFILE_LIST,
	MODEL_PROFILES,
} from "../../models/model-profile.js";

const EXPECTED_IDS = [
	"free_primary",
	"free_secondary",
	"cheap_primary",
	"cheap_secondary",
	"strong_primary",
	"strong_secondary",
	"reviewer_primary",
] as const;

describe("MODEL_PROFILES", () => {
	it("derives the profile map directly from the shared list", () => {
		expect(MODEL_PROFILE_LIST).toHaveLength(EXPECTED_IDS.length);
		for (const profile of MODEL_PROFILE_LIST) {
			expect(MODEL_PROFILES[profile.id]).toBe(profile);
		}
	});

	it("contains all 7 expected model entries", () => {
		expect(Object.keys(MODEL_PROFILES)).toHaveLength(7);
	});

	it("has an entry for every expected model ID", () => {
		for (const id of EXPECTED_IDS) {
			expect(MODEL_PROFILES).toHaveProperty(id);
		}
	});

	it("each profile's id matches its registry key", () => {
		for (const [key, profile] of Object.entries(MODEL_PROFILES)) {
			expect(profile.id).toBe(key);
		}
	});

	it("every profile has a non-empty label", () => {
		for (const profile of Object.values(MODEL_PROFILES)) {
			expect(typeof profile.label).toBe("string");
			expect(profile.label.length).toBeGreaterThan(0);
		}
	});

	it("every profile has at least one strength listed", () => {
		for (const profile of Object.values(MODEL_PROFILES)) {
			expect(Array.isArray(profile.strengths)).toBe(true);
			expect(profile.strengths.length).toBeGreaterThan(0);
		}
	});

	it("costTier matches modelClass for free-tier models", () => {
		expect(MODEL_PROFILES["free_primary"]?.costTier).toBe("free");
		expect(MODEL_PROFILES["free_secondary"]?.costTier).toBe("free");
	});

	it("costTier matches modelClass for cheap-tier models", () => {
		expect(MODEL_PROFILES["cheap_primary"]?.costTier).toBe("cheap");
		expect(MODEL_PROFILES["cheap_secondary"]?.costTier).toBe("cheap");
	});

	it("strong models have large context windows", () => {
		expect(MODEL_PROFILES["strong_primary"]?.maxContextWindow).toBe("large");
		expect(MODEL_PROFILES["strong_secondary"]?.maxContextWindow).toBe("large");
	});

	it("reviewer profile is classified as reviewer tier", () => {
		const reviewer = MODEL_PROFILES["reviewer_primary"];
		expect(reviewer?.modelClass).toBe("reviewer");
		expect(reviewer?.costTier).toBe("reviewer");
	});
});
