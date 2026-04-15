import { describe, expect, it } from "vitest";
import {
	DECOHERENCE_CHANNEL_LABELS,
	hasCandidateSignal,
	hasCodeReviewSignal,
	hasCohesionSignal,
	hasCouplingSignal,
	hasRefactoringSignal,
	hasTestFlakinesSignal,
	METRIC_PAIR_LABELS,
	matchAdvisoryRules,
	QM_ADVISORY_DISCLAIMER,
	REFACTORING_RISK_LABELS,
} from "../../../skills/qm/qm-physics-helpers.js";

describe("qm-physics-helpers - basic constants and detectors", () => {
	it("contains advisory disclaimer text", () => {
		expect(QM_ADVISORY_DISCLAIMER).toContain("quantum-mechanical");
		expect(QM_ADVISORY_DISCLAIMER).toContain("Use the recommendations");
	});

	it("detects coupling signals", () => {
		expect(hasCouplingSignal("This module has high coupling and fan.out")).toBe(
			true,
		);
		expect(hasCouplingSignal("completely unrelated text")).toBe(false);
	});

	it("detects cohesion signals", () => {
		expect(
			hasCohesionSignal("This smells like low cohesion and god.class"),
		).toBe(true);
		expect(hasCohesionSignal("no related words here")).toBe(false);
	});

	it("detects candidate signals", () => {
		expect(hasCandidateSignal("Compare candidate approaches")).toBe(true);
	});

	it("detects test flakiness signals", () => {
		expect(
			hasTestFlakinesSignal("Tests are flaky and intermittent failures"),
		).toBe(true);
		expect(hasTestFlakinesSignal("stable tests")).toBe(false);
	});

	it("detects code review signals", () => {
		expect(hasCodeReviewSignal("Please review and merge this")).toBe(true);
	});

	it("detects refactoring signals", () => {
		expect(hasRefactoringSignal("We should refactor this legacy module")).toBe(
			true,
		);
	});

	it("exports label maps for decoherence and refactoring risk and metric pairs", () => {
		expect(DECOHERENCE_CHANNEL_LABELS.timing).toBeDefined();
		expect(REFACTORING_RISK_LABELS.low).toBeDefined();
		expect(METRIC_PAIR_LABELS["coupling-cohesion"]).toContain("coupling");
	});
});

describe("matchAdvisoryRules", () => {
	it("matches rules in order and dedupes details", () => {
		const rules = [
			{ pattern: /foo/i, detail: "detail-foo" },
			{ pattern: /bar/i, detail: "detail-bar" },
			{ pattern: /foo/i, detail: "detail-foo" },
		];
		const matched = matchAdvisoryRules(rules, "This is foo and bar");
		expect(matched).toEqual(["detail-foo", "detail-bar"]);
	});
});
