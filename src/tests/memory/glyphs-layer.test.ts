/**
 * Tests for glyphs layer and token efficiency
 */

import { describe, expect, it } from "vitest";
import {
	CoreGlyphs,
	ExtendedGlyphs,
	GlyphCompressor,
	GlyphFormatter,
	TokenEfficientReporter,
} from "../../memory/glyphs-layer.js";

describe("GlyphCompressor", () => {
	it("should compress common status phrases", () => {
		const text = "Task completed successfully with excellent quality";
		const compressed = GlyphCompressor.compress(text);

		expect(compressed).toContain("✅");
		expect(compressed).toContain("🏆");
		expect(compressed.length).toBeLessThan(text.length);
	});

	it("should expand glyphs back to text", () => {
		const glyphText = "✅ 🏆";
		const expanded = GlyphCompressor.expand(glyphText);

		expect(expanded).toContain("completed successfully");
		expect(expanded).toContain("excellent quality");
	});

	it("should estimate token savings", () => {
		const originalText = "Implementation in progress with good quality results";
		const savings = GlyphCompressor.getTokenSavings(originalText);

		expect(savings).toBeGreaterThan(0);
		expect(typeof savings).toBe("number");
	});

	it("treats compression phrases as literals when building regexes", () => {
		const compressionMap = (
			GlyphCompressor as unknown as { compressionMap: Map<string, string> }
		).compressionMap;
		const injectedPhrase = "deploy (prod)?";

		compressionMap.set(injectedPhrase, "🚀");
		try {
			expect(GlyphCompressor.compress("deploy (prod)? now")).toContain("🚀");
			expect(GlyphCompressor.compress("deploy prod now")).not.toContain("🚀");
		} finally {
			compressionMap.delete(injectedPhrase);
		}
	});
});

describe("GlyphFormatter", () => {
	it("should format progress with glyphs", () => {
		const progress = {
			completed: ["task1", "task2"],
			inProgress: ["task3"],
			blocked: ["task4"],
			pending: ["task5"],
		};

		const formatted = GlyphFormatter.formatProgress(progress);

		expect(formatted).toContain("✅ 2 completed");
		expect(formatted).toContain("🔄 1 in progress");
		expect(formatted).toContain("❌ 1 blocked");
		expect(formatted).toContain("⏸️ 1 pending");
	});

	it("should format quality scores with appropriate glyphs", () => {
		const excellent = GlyphFormatter.formatQuality(9, "code");
		const good = GlyphFormatter.formatQuality(7, "tests");
		const fair = GlyphFormatter.formatQuality(5, "docs");
		const poor = GlyphFormatter.formatQuality(3, "coverage");

		expect(excellent).toContain("🏆");
		expect(excellent).toContain("excellent");
		expect(good).toContain("👍");
		expect(good).toContain("good");
		expect(fair).toContain("⭐");
		expect(fair).toContain("fair");
		expect(poor).toContain("👎");
		expect(poor).toContain("poor");
	});

	it("should format wave status with numbered glyphs", () => {
		const wave1Complete = GlyphFormatter.formatWaveStatus(1, "complete");
		const wave2InProgress = GlyphFormatter.formatWaveStatus(2, "in_progress");
		const wave3Blocked = GlyphFormatter.formatWaveStatus(3, "blocked");

		expect(wave1Complete).toContain("1️⃣✅");
		expect(wave2InProgress).toContain("2️⃣🔄");
		expect(wave3Blocked).toContain("3️⃣❌");
	});

	it("should create compact session summaries", () => {
		const session = {
			id: "test-session-12345678",
			phase: "implement",
			progressCount: 5,
			qualityScore: 8,
			hasBlockers: false,
		};

		const summary = GlyphFormatter.formatSessionSummary(session);

		expect(summary).toContain("⚙️"); // implementation phase
		expect(summary).toContain("12345678"); // last 8 chars of ID
		expect(summary).toContain("5 tasks");
		expect(summary).not.toContain("🚫"); // no blockers
	});
});

describe("TokenEfficientReporter", () => {
	it("should generate compressed status reports", () => {
		const data = {
			session: "test-session",
			wave: 4,
			completed: 3,
			inProgress: 1,
			blocked: 0,
			quality: 8,
			phase: "memory",
		};

		const report = TokenEfficientReporter.generateStatusReport(data);

		expect(report).toContain("4️⃣"); // wave 4
		expect(report).toContain("3✅"); // 3 completed
		expect(report).toContain("1🔄"); // 1 in progress
		expect(report).toContain("0❌"); // 0 blocked
		expect(report.length).toBeLessThan(50); // Very compact
	});

	it("should calculate accurate token savings", () => {
		const compactReport = "4️⃣🔄 | 3✅ 1🔄 0❌ | 👍";
		const verboseReport =
			"Wave 4 implementation in progress with 3 tasks completed, 1 task in progress, 0 blocked tasks, and good quality results.";

		const savings = TokenEfficientReporter.calculateSavings(
			compactReport,
			verboseReport,
		);

		expect(savings.originalTokens).toBeGreaterThan(savings.compactTokens);
		expect(savings.savings).toBeGreaterThan(0);
		expect(savings.savingsPercent).toBeGreaterThan(0);
		expect(savings.savingsPercent).toBeLessThanOrEqual(100);
	});
});

describe("Core and Extended Glyphs", () => {
	it("should have consistent glyph mappings", () => {
		expect(CoreGlyphs.completed).toBe("✅");
		expect(CoreGlyphs.inProgress).toBe("🔄");
		expect(CoreGlyphs.blocked).toBe("❌");
		expect(CoreGlyphs.warning).toBe("⚠️");

		expect(ExtendedGlyphs.free).toBe("🆓");
		expect(ExtendedGlyphs.strong).toBe("🚀");
		expect(ExtendedGlyphs.secure).toBe("🔒");
	});

	it("should maintain glyph uniqueness", () => {
		const allGlyphs = { ...CoreGlyphs, ...ExtendedGlyphs };
		const glyphValues = Object.values(allGlyphs);
		const uniqueGlyphs = new Set(glyphValues);

		// Allow some reasonable overlap but check for major duplicates
		expect(uniqueGlyphs.size).toBeGreaterThan(glyphValues.length * 0.8);
	});
});

describe("Integration scenarios", () => {
	it("should handle complete workflow status compression", () => {
		const verboseStatus = `
Wave 4 Memory and Onboarding Implementation Status:
- TOON memory interface: completed successfully
- Interactive onboarding wizard: completed successfully  
- Glyphs layer implementation: completed with excellent quality
- CLI foundation: in progress with good quality
- Integration testing: pending
- Documentation updates: pending

Overall quality score: 8/10 (good)
No blocking issues identified
Ready to proceed to Wave 5
		`.trim();

		const compressed = GlyphCompressor.compress(verboseStatus);
		const savings = GlyphCompressor.getTokenSavings(verboseStatus);

		expect(compressed).toContain("✅");
		expect(compressed).toContain("🔄");
		expect(compressed).toContain("⏸️");
		expect(compressed).toContain("👍");
		expect(savings).toBeGreaterThan(20); // Expect significant savings
	});

	it("should maintain readability after compression and expansion", () => {
		const originalText =
			"Testing completed successfully with excellent quality results";
		const compressed = GlyphCompressor.compress(originalText);
		const expanded = GlyphCompressor.expand(compressed);

		// Should retain core meaning even if not identical
		expect(expanded).toContain("completed successfully");
		expect(expanded).toContain("excellent quality");
	});
});
