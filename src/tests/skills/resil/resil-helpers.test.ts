import { describe, expect, it } from "vitest";
import {
	bufferFillLabel,
	byzantineFaultLimit,
	clampIntegral,
	fmtPct,
	fmtSig,
	hasCloneMutateSignal,
	hasHomeostaticSignal,
	hasMembraneSignal,
	hasRedundantVoterSignal,
	hasReplaySignal,
	majorityVoteCount,
	pidError,
	pidIntensityLabel,
	pidOutput,
	qualityRatioLabel,
	RESIL_ADVISORY_DISCLAIMER,
	recommendedCloneCount,
	replayMixLabel,
	similarityLabel,
} from "../../../skills/resil/resil-helpers.js";

describe("resil-helpers", () => {
	it("formats advisory numeric helpers and labels thresholds", () => {
		expect(fmtSig(12.3456)).toBe("12.3");
		expect(fmtSig(Number.POSITIVE_INFINITY)).toBe("∞");
		expect(fmtPct(0.375)).toBe("37.5%");
		expect(pidError(0.9, 0.7)).toBeCloseTo(0.2);
		expect(pidOutput(1, 0.5, 0.25, 2, 1, -1)).toBeCloseTo(2.25);
		expect(clampIntegral(12, -5, 5)).toBe(5);
		expect(pidIntensityLabel(0.6)).toBe("aggressive");
		expect(pidIntensityLabel(0.3)).toBe("moderate");
		expect(pidIntensityLabel(0.1)).toBe("gentle");
	});

	it("covers voting, mutation, and replay heuristics", () => {
		expect(majorityVoteCount(5)).toBe(3);
		expect(byzantineFaultLimit(3)).toBe(0);
		expect(byzantineFaultLimit(7)).toBe(2);
		expect(similarityLabel(0.9)).toBe("agreement");
		expect(similarityLabel(0.7)).toBe("split");
		expect(similarityLabel(0.3)).toBe("divergence");
		expect(qualityRatioLabel(0.65)).toBe("degraded");
		expect(qualityRatioLabel(0.8)).toBe("borderline");
		expect(qualityRatioLabel(0.95)).toBe("healthy");
		expect(recommendedCloneCount(2)).toBe(3);
		expect(recommendedCloneCount(5)).toBe(7);
		expect(recommendedCloneCount(11)).toBe(12);
		expect(bufferFillLabel(0.2)).toBe("sparse");
		expect(bufferFillLabel(0.6)).toBe("adequate");
		expect(bufferFillLabel(0.85)).toBe("full");
		expect(bufferFillLabel(0.95)).toBe("full");
		expect(replayMixLabel(0.8)).toBe("success-heavy");
		expect(replayMixLabel(0.5)).toBe("balanced");
		expect(replayMixLabel(0.4)).toBe("balanced");
		expect(replayMixLabel(0.2)).toBe("failure-heavy");
	});

	it("detects each resilience subsystem by signal cluster", () => {
		const cases = [
			[hasCloneMutateSignal, "mutation loop promotes the best prompt clone"],
			[
				hasHomeostaticSignal,
				"pid control loop should stabilise latency near the setpoint",
			],
			[
				hasMembraneSignal,
				"introduce a membrane boundary for pii clearance zones",
			],
			[
				hasRedundantVoterSignal,
				"run multiple replicas and vote on the majority answer",
			],
			[
				hasReplaySignal,
				"replay past execution traces to improve the routing strategy",
			],
		] as const;

		for (const [detector, text] of cases) {
			expect(detector(text)).toBe(true);
			expect(detector("ship the static marketing page")).toBe(false);
		}
	});

	it("detects alternate resilience signal clusters", () => {
		expect(
			hasCloneMutateSignal(
				"rolling quality decline should self heal automatically",
			),
		).toBe(true);
		expect(
			hasHomeostaticSignal(
				"maintain latency below threshold with feedback control",
			),
		).toBe(true);
		expect(
			hasMembraneSignal("segregate tenant data behind workflow boundaries"),
		).toBe(true);
		expect(
			hasRedundantVoterSignal(
				"cluster replica outputs by semantic match for quorum",
			),
		).toBe(true);
		expect(hasReplaySignal("learn from past runs using workflow memory")).toBe(
			true,
		);
	});

	it("exports an advisory disclaimer", () => {
		expect(RESIL_ADVISORY_DISCLAIMER).toContain("advisory only");
	});
});
