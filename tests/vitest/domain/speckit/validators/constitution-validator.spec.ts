import { describe, expect, it } from "vitest";
import { createInitialSessionState } from "../../../../../src/domain/speckit/types.js";
import { validateAgainstConstitution } from "../../../../../src/domain/speckit/validators/constitution-validator.js";

describe("validateAgainstConstitution", () => {
	it("should return issues when checks fail", () => {
		const state = createInitialSessionState({
			title: "Validation Test",
			overview: "Overview",
			objectives: [{ description: "Obj" }],
			requirements: [{ description: "Req" }],
			acceptanceCriteria: [],
			outOfScope: [],
			validateAgainstConstitution: false,
		});
		const result = validateAgainstConstitution(state, {
			path: "/tmp/CONSTITUTION.md",
			loadedAt: new Date(),
			rules: [
				{
					id: "E1",
					description: "Must fail",
					severity: "error",
					check: () => false,
				},
				{
					id: "W1",
					description: "Warn",
					severity: "warning",
					check: () => false,
				},
			],
		});

		expect(result.isValid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.warnings).toHaveLength(1);
		expect(result.score).toBe(0);
	});

	it("should return valid result when all checks pass", () => {
		const state = createInitialSessionState({
			title: "Validation Pass",
			overview: "Overview",
			objectives: [{ description: "Obj" }],
			requirements: [{ description: "Req" }],
			acceptanceCriteria: [],
			outOfScope: [],
			validateAgainstConstitution: false,
		});
		const result = validateAgainstConstitution(state, {
			path: "/tmp/CONSTITUTION.md",
			loadedAt: new Date(),
			rules: [
				{
					id: "P1",
					description: "Pass",
					severity: "warning",
					check: () => true,
				},
			],
		});

		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
		expect(result.warnings).toHaveLength(0);
		expect(result.score).toBe(100);
	});

	it("should return 100 score for empty rules", () => {
		const state = createInitialSessionState({
			title: "Validation Empty",
			overview: "Overview",
			objectives: [{ description: "Obj" }],
			requirements: [{ description: "Req" }],
			acceptanceCriteria: [],
			outOfScope: [],
			validateAgainstConstitution: false,
		});
		const result = validateAgainstConstitution(state, {
			path: "/tmp/CONSTITUTION.md",
			loadedAt: new Date(),
			rules: [],
		});

		expect(result.isValid).toBe(true);
		expect(result.score).toBe(100);
	});
});
