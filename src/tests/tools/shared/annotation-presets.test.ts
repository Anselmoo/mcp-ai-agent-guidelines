import { describe, expect, it } from "vitest";
import {
	ANNOTATION_ADVANCED,
	ANNOTATION_CORE,
	ANNOTATION_GOVERNANCE,
	ANNOTATION_PHYSICS,
	ANNOTATION_REVIEWER,
	annotationsForTool,
} from "../../../tools/shared/annotation-presets.js";

describe("annotation preset constants", () => {
	it("ANNOTATION_CORE is read-only, idempotent, open-world, cheap", () => {
		expect(ANNOTATION_CORE.readOnlyHint).toBe(true);
		expect(ANNOTATION_CORE.destructiveHint).toBe(false);
		expect(ANNOTATION_CORE.idempotentHint).toBe(true);
		expect(ANNOTATION_CORE.openWorldHint).toBe(true);
		expect(ANNOTATION_CORE.costTier).toBe("cheap");
	});

	it("ANNOTATION_ADVANCED is NOT idempotent (external model calls)", () => {
		expect(ANNOTATION_ADVANCED.idempotentHint).toBe(false);
		expect(ANNOTATION_ADVANCED.costTier).toBe("strong");
	});

	it("ANNOTATION_GOVERNANCE is closed-world and idempotent (evaluate, not mutate)", () => {
		expect(ANNOTATION_GOVERNANCE.openWorldHint).toBe(false);
		expect(ANNOTATION_GOVERNANCE.idempotentHint).toBe(true);
		expect(ANNOTATION_GOVERNANCE.costTier).toBe("strong");
	});

	it("ANNOTATION_PHYSICS is strong, open-world, and NOT idempotent", () => {
		expect(ANNOTATION_PHYSICS.costTier).toBe("strong");
		expect(ANNOTATION_PHYSICS.openWorldHint).toBe(true);
		expect(ANNOTATION_PHYSICS.idempotentHint).toBe(false);
	});

	it("ANNOTATION_REVIEWER has costTier 'reviewer'", () => {
		expect(ANNOTATION_REVIEWER.costTier).toBe("reviewer");
		expect(ANNOTATION_REVIEWER.readOnlyHint).toBe(true);
	});

	it("no preset has destructiveHint set to true", () => {
		for (const preset of [
			ANNOTATION_CORE,
			ANNOTATION_ADVANCED,
			ANNOTATION_GOVERNANCE,
			ANNOTATION_PHYSICS,
			ANNOTATION_REVIEWER,
		]) {
			expect(preset.destructiveHint).toBe(false);
		}
	});
});

describe("annotationsForTool", () => {
	it("qm- prefix maps to ANNOTATION_PHYSICS", () => {
		expect(annotationsForTool("qm-entanglement-mapper")).toBe(
			ANNOTATION_PHYSICS,
		);
	});

	it("gr- prefix maps to ANNOTATION_PHYSICS", () => {
		expect(annotationsForTool("gr-spacetime-curvature")).toBe(
			ANNOTATION_PHYSICS,
		);
	});

	it("gov- prefix maps to ANNOTATION_GOVERNANCE", () => {
		expect(annotationsForTool("gov-policy-validation")).toBe(
			ANNOTATION_GOVERNANCE,
		);
	});

	it("adv- prefix maps to ANNOTATION_ADVANCED", () => {
		expect(annotationsForTool("adv-custom-tool")).toBe(ANNOTATION_ADVANCED);
	});

	it("unrecognised prefix falls back to ANNOTATION_CORE", () => {
		expect(annotationsForTool("req-elicitation")).toBe(ANNOTATION_CORE);
		expect(annotationsForTool("implement")).toBe(ANNOTATION_CORE);
		expect(annotationsForTool("")).toBe(ANNOTATION_CORE);
	});

	it("prefix match is exact — 'governance-tool' does not start with 'gov-'", () => {
		expect(annotationsForTool("governance-tool")).toBe(ANNOTATION_CORE);
	});
});
