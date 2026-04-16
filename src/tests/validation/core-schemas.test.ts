import { describe, expect, it } from "vitest";
import {
	complianceRequirementSchema,
	createValidator,
	errorContextSchema,
	executionProgressRecordSchema,
	modelClassSchema,
	physicsSkillSchema,
	safeFilePathSchema,
	safeValidate,
	skillRequestSchema,
	validateBenchmarkConfig,
	validateComplianceRequirement,
	validateExecutionProgressRecord,
	validatePhysicsSkillRequest,
	validateSkillRequest,
} from "../../validation/core-schemas.js";

describe("core-schemas", () => {
	it("returns the first validation issue with path metadata", () => {
		const result = safeValidate(physicsSkillSchema, {
			request: "",
			physicsAnalysisJustification:
				"conventional analysis is insufficient because of cross-cutting quantum entanglement patterns",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.path).toEqual(["request"]);
			expect(result.error.message).toContain("non-empty");
		}
	});

	it("validates physics requests and benchmark defaults", () => {
		// Valid physics request with the required justification field
		expect(
			validatePhysicsSkillRequest({
				request: "investigate anomaly",
				physicsAnalysisJustification:
					"conventional dependency analysis is insufficient for this cross-cutting entanglement",
			}).success,
		).toBe(true);

		// Missing justification must fail
		expect(
			validatePhysicsSkillRequest({
				request: "investigate anomaly",
			}).success,
		).toBe(false);

		// Justification present but too short (< 20 non-whitespace chars) must fail
		expect(
			validatePhysicsSkillRequest({
				request: "investigate anomaly",
				physicsAnalysisJustification: "too short",
			}).success,
		).toBe(false);

		const benchmark = validateBenchmarkConfig({
			name: "latency",
			criteria: [{ metric: "p95", expectedValue: 100 }],
		});

		expect(benchmark.success).toBe(true);
		if (benchmark.success) {
			expect(benchmark.data.iterations).toBe(1);
		}
	});

	it("validates shared request and compliance helpers with defaults and passthrough fields", () => {
		const request = validateSkillRequest({
			request: "ship it",
			context: "repo cleanup",
			options: { mode: "safe" },
			extraField: "preserved",
		});

		expect(request.success).toBe(true);
		if (request.success) {
			expect(request.data.extraField).toBe("preserved");
			expect(request.data.options).toEqual({ mode: "safe" });
		}

		const compliance = validateComplianceRequirement({
			domain: "gdpr",
			level: "required",
			description: "retain audit logs",
		});

		expect(compliance.success).toBe(true);
		if (compliance.success) {
			expect(compliance.data.auditRequired).toBe(false);
		}

		expect(
			complianceRequirementSchema.safeParse({
				domain: "unknown",
				level: "required",
				description: "bad",
			}).success,
		).toBe(false);
	});

	it("covers path, enum, validator factory, and error-context schemas", () => {
		expect(modelClassSchema.safeParse("strong").success).toBe(true);
		expect(modelClassSchema.safeParse("invalid").success).toBe(false);

		expect(safeFilePathSchema.safeParse("src/tests/example.ts").success).toBe(
			true,
		);
		expect(safeFilePathSchema.safeParse("../secret.txt").success).toBe(false);
		expect(safeFilePathSchema.safeParse("/tmp/unsafe.txt").success).toBe(false);

		const validateRequest = createValidator(skillRequestSchema);
		const missingRequest = validateRequest({}, { source: "unit-test" });
		expect(missingRequest.success).toBe(false);
		if (!missingRequest.success) {
			expect(missingRequest.error.context).toEqual({ source: "unit-test" });
		}

		expect(
			errorContextSchema.safeParse({
				skillId: "req-analysis",
				timestamp: new Date().toISOString(),
				errorType: "validation",
			}).success,
		).toBe(true);
	});

	it("validates execution progress records for the persistence/state lane", () => {
		const valid = validateExecutionProgressRecord({
			stepLabel: "run-skill:debug-root-cause",
			kind: "skill",
			summary: "Identified the root cause of the regression",
		});
		expect(valid.success).toBe(true);

		// Missing required field → invalid
		expect(
			executionProgressRecordSchema.safeParse({
				stepLabel: "run-skill",
				kind: "skill",
			}).success,
		).toBe(false);

		// Empty string fields → invalid (nonEmptyStringSchema)
		expect(
			executionProgressRecordSchema.safeParse({
				stepLabel: "",
				kind: "skill",
				summary: "done",
			}).success,
		).toBe(false);
	});
});
