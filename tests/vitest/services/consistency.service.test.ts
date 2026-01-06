// Consistency Service Tests
import { describe, expect, it } from "vitest";
import { consistencyService } from "../../../src/tools/design/services/consistency.service.js";
import { sessionManagementService } from "../../../src/tools/design/services/session-management.service.js";

describe("ConsistencyService", () => {
	describe("enforceCoverage", () => {
		it("should enforce coverage thresholds", async () => {
			const sessionId = `test-coverage-${Date.now()}`;
			const config = {
				sessionId,
				context: "Coverage enforcement test",
				goal: "Test coverage validation",
				requirements: ["High code coverage", "Quality metrics"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const content = `
				# Phase Content with Comprehensive Coverage

				## Requirements Analysis
				- All requirements documented
				- User stories defined
				- Acceptance criteria established

				## Architecture Design
				- System components identified
				- Integration points defined
				- Data flows documented
			`;

			const response = await consistencyService.enforceCoverage(
				sessionId,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
			expect(response.coverage).toBeDefined();
			expect(response.recommendations).toBeInstanceOf(Array);
		});

		it("should throw for non-existent session", async () => {
			await expect(
				consistencyService.enforceCoverage("non-existent", "content"),
			).rejects.toThrow();
		});

		it("should handle coverage pass scenario", async () => {
			const sessionId = `test-pass-${Date.now()}`;
			const config = {
				sessionId,
				context: "Pass test",
				goal: "Coverage pass",
				requirements: ["Requirement 1"],
				constraints: [],
				coverageThreshold: 70,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const content = `
				Comprehensive content covering all aspects:
				- Feature A complete
				- Feature B complete
				- Feature C complete
				- Testing complete
				- Documentation complete
			`;

			const response = await consistencyService.enforceCoverage(
				sessionId,
				content,
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});

		it("should handle coverage fail scenario gracefully", async () => {
			const sessionId = `test-fail-${Date.now()}`;
			const config = {
				sessionId,
				context: "Fail test",
				goal: "Coverage fail",
				requirements: ["Requirement 1"],
				constraints: [],
				coverageThreshold: 95,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const content = "Minimal content";

			const response = await consistencyService.enforceCoverage(
				sessionId,
				content,
			);

			expect(response.success).toBe(true);
			expect(response.sessionId).toBe(sessionId);
		});
	});

	describe("enforceConsistency", () => {
		it("should enforce constraint consistency", async () => {
			const sessionId = `test-consistency-${Date.now()}`;
			const config = {
				sessionId,
				context: "Consistency test",
				goal: "Test constraint consistency",
				requirements: ["Consistent constraints"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const response = await consistencyService.enforceConsistency(
				sessionId,
				undefined,
				undefined,
				"Test content for consistency",
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});

		it("should throw for non-existent session", async () => {
			await expect(
				consistencyService.enforceConsistency("non-existent"),
			).rejects.toThrow();
		});

		it("should enforce with specific constraint ID", async () => {
			const sessionId = `test-constraint-id-${Date.now()}`;
			const config = {
				sessionId,
				context: "Constraint ID test",
				goal: "Test specific constraint",
				requirements: ["Constraint tracking"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			};

			await sessionManagementService.startDesignSession(sessionId, config);

			const response = await consistencyService.enforceConsistency(
				sessionId,
				"constraint-1",
				"discovery",
				"Content",
			);

			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});
	});

	describe("enforceCrossSessionConsistency", () => {
		it("should enforce cross-session consistency", async () => {
			const sessionId = `test-cross-${Date.now()}`;

			const response =
				await consistencyService.enforceCrossSessionConsistency(sessionId);

			expect(response).toBeDefined();
			expect(response.success).toBe(true);
			expect(response.sessionId).toBe(sessionId);
			expect(response.recommendations).toBeInstanceOf(Array);
		});

		it("should handle consistency report generation", async () => {
			const sessionId = `test-report-${Date.now()}`;

			const response =
				await consistencyService.enforceCrossSessionConsistency(sessionId);

			expect(response.data?.consistencyReport).toBeDefined();
			expect(response.data?.violationsCount).toBeDefined();
		});

		it("should handle errors gracefully", async () => {
			const sessionId = `test-error-${Date.now()}`;

			const response =
				await consistencyService.enforceCrossSessionConsistency(sessionId);

			// Should handle any errors gracefully
			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});
	});

	describe("generateEnforcementPrompts", () => {
		it("should generate enforcement prompts", async () => {
			const sessionId = `test-prompts-${Date.now()}`;

			const response =
				await consistencyService.generateEnforcementPrompts(sessionId);

			expect(response).toBeDefined();
			expect(response.success).toBe(true);
			expect(response.sessionId).toBe(sessionId);
			expect(response.recommendations).toBeInstanceOf(Array);
		});

		it("should include prompt data", async () => {
			const sessionId = `test-prompt-data-${Date.now()}`;

			const response =
				await consistencyService.generateEnforcementPrompts(sessionId);

			expect(response.data?.prompts).toBeDefined();
			expect(response.data?.consistencyReport).toBeDefined();
		});

		it("should handle prompt generation errors", async () => {
			const sessionId = `test-prompt-error-${Date.now()}`;

			const response =
				await consistencyService.generateEnforcementPrompts(sessionId);

			// Should handle any errors gracefully
			expect(response).toBeDefined();
			expect(response.sessionId).toBe(sessionId);
		});
	});
});
