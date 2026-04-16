import { describe, expect, it } from "vitest";
import {
	derivePhysicsConcerns,
	gatePhysicsAdapter,
	PHYSICS_ADAPTER_GUARDRAILS,
	PHYSICS_ADAPTER_REPO_PLACEMENT,
	recommendPhysicsLenses,
} from "../../../skills/shared/physics-adapter-prototype.js";

describe("physics adapter prototype", () => {
	it("blocks physics translation when conventional evidence is missing", () => {
		const gate = gatePhysicsAdapter({
			request: "Use a QM lens for flaky tests in CI.",
		});

		expect(gate.allowed).toBe(false);
		expect(gate.missingRequirements).toContain("conventional evidence");
	});

	it("derives QM concerns for flakiness and candidate ranking", () => {
		const concerns = derivePhysicsConcerns({
			request:
				"We have intermittent flaky tests and two candidate fixes we want to rank.",
			conventionalEvidence: [
				{ kind: "tests", detail: "Retry logs show race-condition timing." },
			],
		});

		expect(concerns).toContain("flakiness");
		expect(concerns).toContain("candidate-ranking");
	});

	it("derives GR concerns for coupling and abstraction drift", () => {
		const concerns = derivePhysicsConcerns({
			request:
				"This wrapper layer causes API drift and coupling cascades across dependents.",
			conventionalEvidence: [
				{
					kind: "architecture",
					detail: "Fan-in/fan-out metrics and wrapper count already collected.",
				},
			],
		});

		expect(concerns).toContain("coupling-gravity");
		expect(concerns).toContain("abstraction-drift");
	});

	it("allows physics translation when evidence and structural concern exist", () => {
		const gate = gatePhysicsAdapter({
			request:
				"Our test suite is flaky because parallel execution shows timing jitter and ordering dependencies.",
			conventionalEvidence: [
				{ kind: "tests", detail: "Failure logs from CI retries." },
				{ kind: "metrics", detail: "Parallel execution timing data." },
			],
		});

		expect(gate.allowed).toBe(true);
		expect(gate.missingRequirements).toHaveLength(0);
	});

	it("recommends QM skills for flaky-test evidence", () => {
		const recommendations = recommendPhysicsLenses({
			request:
				"Our tests fail intermittently due to timing jitter and we need the right lens.",
			conventionalEvidence: [
				{ kind: "tests", detail: "Intermittent CI logs and retry traces." },
			],
		});

		expect(recommendations[0]?.lens).toBe("qm");
		expect(recommendations[0]?.candidateSkills).toContain(
			"qm-decoherence-sentinel",
		);
	});

	it("recommends GR skills for debt and coupling evidence", () => {
		const recommendations = recommendPhysicsLenses({
			request:
				"This module has coupling cascades and technical debt curvature hotspots.",
			conventionalEvidence: [
				{
					kind: "metrics",
					detail:
						"Coupling, complexity, and cohesion metrics already computed.",
				},
			],
		});

		const skillSet = recommendations.flatMap((item) => item.candidateSkills);
		expect(skillSet).toContain("gr-schwarzschild-classifier");
		expect(skillSet).toContain("gr-spacetime-debt-metric");
	});

	it("supports mixed QM and GR recommendations for combined requests", () => {
		const recommendations = recommendPhysicsLenses({
			request:
				"Our release history shows drift, flaky tests, and coupling shockwaves after a large merge.",
			conventionalEvidence: [
				{
					kind: "history",
					detail: "Three release snapshots and commit notes.",
				},
				{ kind: "tests", detail: "Intermittent regression failures in CI." },
				{
					kind: "architecture",
					detail: "Dependency graph changed after the refactor.",
				},
			],
		});

		const lenses = recommendations.map((item) => item.lens);
		expect(lenses).toContain("qm");
		expect(lenses).toContain("gr");
	});

	it("supports preferred lens filtering without changing the gate", () => {
		const input: Parameters<typeof gatePhysicsAdapter>[0] = {
			request:
				"We want to frame abstraction drift and wrapper-layer coupling with a gravity lens.",
			preferredLens: "gr",
			conventionalEvidence: [
				{
					kind: "architecture",
					detail: "Wrapper counts, dependents, and contract diffs collected.",
				},
			],
		};

		const gate = gatePhysicsAdapter(input);
		const recommendations = recommendPhysicsLenses(input);

		expect(gate.allowed).toBe(true);
		expect(recommendations.every((item) => item.lens === "gr")).toBe(true);
	});

	it("keeps reference-only guardrails and current repo placement metadata", () => {
		expect(PHYSICS_ADAPTER_REPO_PLACEMENT).toEqual([
			"src/skills/shared/physics-adapter-prototype.ts",
			"src/tests/skills/shared/physics-adapter-prototype.test.ts",
		]);
		expect(PHYSICS_ADAPTER_GUARDRAILS).toContain(
			"Treat the output as advisory-only; the adapter is not a runtime tool surface.",
		);
		expect(
			PHYSICS_ADAPTER_GUARDRAILS.some((item) =>
				item.includes("do not scrape opportunistic numerals"),
			),
		).toBe(true);
	});
});
