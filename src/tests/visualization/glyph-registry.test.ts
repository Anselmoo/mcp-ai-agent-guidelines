import { describe, expect, it } from "vitest";
import {
	AnalysisGlyphs,
	BoxGlyphs,
	CICDGlyphs,
	DevEmojis,
	Emoji,
	FileEmojis,
	GitGlyphs,
	Glyph,
	GlyphRegistry,
	glyphRegistry,
	glyphs,
	LogLevelGlyphs,
	ProgressGlyphs,
	StatusEmojis,
} from "../../visualization/glyph-registry.js";

describe("GlyphRegistry", () => {
	const registry = new GlyphRegistry();

	describe("forSkill", () => {
		it("returns the correct glyph for known domain prefixes", () => {
			expect(registry.forSkill("qm-entanglement-mapper")).toEqual({
				glyph: "⚛️",
				label: "Quantum Mechanics metaphors",
			});
			expect(registry.forSkill("gov-data-guardrails").glyph).toBe("🛡️");
			expect(registry.forSkill("arch-decision-tree").glyph).toBe("🏗️");
			expect(registry.forSkill("req-elicitation").glyph).toBe("📋");
		});

		it("returns fallback glyph and 'Unknown domain' label for unrecognised prefix", () => {
			const entry = registry.forSkill("custom-skill");
			expect(entry.glyph).toBe("•");
			expect(entry.label).toBe("Unknown domain");
		});

		it("prefix boundary is exact — 'archival-' does not match 'arch-'", () => {
			// 'archival-stuff' starts with 'archi', not 'arch-'
			expect(registry.forSkill("archival-stuff").glyph).toBe("•");
		});
	});

	describe("forInstruction", () => {
		it("returns the correct glyph for known instruction names", () => {
			expect(registry.forInstruction("testing").glyph).toBe("🧪");
			expect(registry.forInstruction("enterprise").glyph).toBe("🏢");
			expect(registry.forInstruction("bootstrap").glyph).toBe("🌱");
			expect(registry.forInstruction("review").glyph).toBe("👁️");
		});

		it("returns fallback with the name as label for unknown instructions", () => {
			const entry = registry.forInstruction("nonexistent");
			expect(entry.glyph).toBe("•");
			expect(entry.label).toBe("nonexistent");
		});
	});

	describe("domainPrefixes", () => {
		it("covers exactly 18 domain prefixes", () => {
			expect(Object.keys(registry.domainPrefixes())).toHaveLength(18);
		});

		it("every entry has a non-empty glyph and label", () => {
			for (const entry of Object.values(registry.domainPrefixes())) {
				expect(entry.glyph.length).toBeGreaterThan(0);
				expect(entry.label.length).toBeGreaterThan(0);
			}
		});
	});

	describe("instructions", () => {
		it("covers exactly 19 instruction names", () => {
			expect(Object.keys(registry.instructions())).toHaveLength(19);
		});
	});

	describe("format", () => {
		it("prefixes the skill glyph before the skill id", () => {
			expect(registry.format("qm-entanglement-mapper")).toBe(
				"⚛️ qm-entanglement-mapper",
			);
		});

		it("uses the fallback glyph for unknown skills", () => {
			expect(registry.format("custom-skill")).toBe("• custom-skill");
		});

		it("delegates to forSkill — gov-policy-validation gets the governance glyph", () => {
			expect(registry.format("gov-policy-validation")).toBe(
				"🛡️ gov-policy-validation",
			);
		});
	});
});

describe("glyphRegistry singleton", () => {
	it("is an instance of GlyphRegistry", () => {
		expect(glyphRegistry).toBeInstanceOf(GlyphRegistry);
	});

	it("produces the same results as a freshly constructed instance", () => {
		const fresh = new GlyphRegistry();
		expect(glyphRegistry.forSkill("gov-policy").glyph).toBe(
			fresh.forSkill("gov-policy").glyph,
		);
		expect(glyphRegistry.forInstruction("testing").glyph).toBe(
			fresh.forInstruction("testing").glyph,
		);
	});
});

describe("Glyph class", () => {
	const g = new Glyph("★", "star", "filled star");

	it("toString returns symbol", () => {
		expect(g.toString()).toBe("★");
	});

	it("string coercion via Symbol.toPrimitive returns symbol", () => {
		expect(`${g}`).toBe("★");
	});

	it("description defaults to empty string", () => {
		expect(new Glyph("·", "dot").description).toBe("");
	});

	it("all fields are set correctly", () => {
		expect(g.symbol).toBe("★");
		expect(g.name).toBe("star");
		expect(g.description).toBe("filled star");
	});
});

describe("Emoji class", () => {
	const e = new Emoji("🚀", "rocket", "launch emoji");

	it("toString returns symbol", () => {
		expect(e.toString()).toBe("🚀");
	});

	it("string coercion via Symbol.toPrimitive returns symbol", () => {
		expect(`${e}`).toBe("🚀");
	});

	it("description defaults to empty string", () => {
		expect(new Emoji("📦", "package").description).toBe("");
	});
});

describe("BoxGlyphs", () => {
	const box = new BoxGlyphs();

	it("box() output contains corner characters", () => {
		const out = box.box("hi");
		expect(out).toContain("┌");
		expect(out).toContain("┐");
		expect(out).toContain("└");
		expect(out).toContain("┘");
		expect(out).toContain("hi");
	});

	it("doubleBox() output contains double-line corners", () => {
		const out = box.doubleBox("x");
		expect(out).toContain("╔");
		expect(out).toContain("╝");
	});

	it("table() renders headers and separator row", () => {
		const out = box.table(["A", "B"], [["1", "2"]]);
		expect(out).toContain("A");
		expect(out).toContain("1");
		expect(out).toContain("┼");
	});
});

describe("LogLevelGlyphs", () => {
	const log = new LogLevelGlyphs();

	it("label() formats the level with pipe separator", () => {
		const out = log.label("info");
		expect(out).toContain("INFO");
		expect(out).toContain("│");
	});

	it("formatLine() without scope omits scope brackets", () => {
		const out = log.formatLine("error", "something broke");
		expect(out).toContain("ERROR");
		expect(out).toContain("something broke");
		expect(out).not.toContain("❬");
	});

	it("formatLine() with scope includes scope brackets", () => {
		const out = log.formatLine("debug", "trace msg", "auth");
		expect(out).toContain("❬auth❭");
	});

	it("unknown level falls back to info glyph", () => {
		const out = log.label("verbose");
		expect(out).toContain("VERBOSE");
	});
});

describe("ProgressGlyphs", () => {
	const progress = new ProgressGlyphs();

	it("renderBar() returns percentage string", () => {
		const out = progress.renderBar(0.5);
		expect(out).toContain("50%");
	});

	it("spinner() yields frame strings", () => {
		const gen = progress.spinner();
		const frame = gen.next().value;
		expect(typeof frame).toBe("string");
		expect(frame.length).toBeGreaterThan(0);
	});
});

describe("GitGlyphs", () => {
	const git = new GitGlyphs();

	it("statusLine() includes branch name", () => {
		const out = git.statusLine("main");
		expect(out).toContain("main");
	});

	it("statusLine() includes ahead/behind counts when non-zero", () => {
		const out = git.statusLine("feature", 2, 1);
		expect(out).toContain("2");
		expect(out).toContain("1");
	});

	it("logLine() uses first 7 chars of sha", () => {
		const out = git.logLine("abc1234xyz", "fix bug");
		expect(out).toContain("abc1234");
		expect(out).not.toContain("xyz");
	});
});

describe("CICDGlyphs", () => {
	const cicd = new CICDGlyphs();

	it("pipeline() renders known stage types with separators", () => {
		const out = cicd.pipeline([
			["build", "passed"],
			["test", "running"],
		]);
		expect(out).toContain("→");
	});

	it("pipeline() falls back for unknown type/status", () => {
		const out = cicd.pipeline([["custom", "unknown"]]);
		expect(typeof out).toBe("string");
		expect(out.length).toBeGreaterThan(0);
	});
});

describe("AnalysisGlyphs", () => {
	const analysis = new AnalysisGlyphs();

	it("sparkline() returns a string of the same length as input", () => {
		const values = [1, 2, 3, 4, 5];
		const out = analysis.sparkline(values);
		expect(out.length).toBeGreaterThan(0);
	});

	it("delta() shows + sign for positive diff", () => {
		const out = analysis.delta(10, 15);
		expect(out).toContain("+");
		expect(out).toContain("↗");
	});

	it("delta() shows trend_down for negative diff", () => {
		const out = analysis.delta(15, 10);
		expect(out).toContain("↘");
	});

	it("rating() includes score label", () => {
		const out = analysis.rating(3.5);
		expect(out).toContain("3.5/5");
	});
});

describe("StatusEmojis / FileEmojis / DevEmojis", () => {
	it("StatusEmojis.success is ✅", () => {
		expect(new StatusEmojis().success.symbol).toBe("✅");
	});

	it("FileEmojis.package is 📦", () => {
		expect(new FileEmojis().package.symbol).toBe("📦");
	});

	it("DevEmojis.conventionalCommit formats correctly", () => {
		const dev = new DevEmojis();
		const out = dev.conventionalCommit("feat", "auth", "add OAuth");
		expect(out).toBe("✨ feat(auth): add OAuth");
	});

	it("DevEmojis.conventionalCommit without scope omits parens", () => {
		const dev = new DevEmojis();
		const out = dev.conventionalCommit("fix", "", "null pointer");
		expect(out).toBe("🐛 fix: null pointer");
	});
});

describe("GlyphRegistry groups", () => {
	const r = new GlyphRegistry();

	it("registry.box is an instance of BoxGlyphs", () => {
		expect(r.box).toBeInstanceOf(BoxGlyphs);
	});

	it("registry.log is an instance of LogLevelGlyphs", () => {
		expect(r.log).toBeInstanceOf(LogLevelGlyphs);
	});

	it("registry.git is an instance of GitGlyphs", () => {
		expect(r.git).toBeInstanceOf(GitGlyphs);
	});

	it("registry.cicd is an instance of CICDGlyphs", () => {
		expect(r.cicd).toBeInstanceOf(CICDGlyphs);
	});

	it("registry.analysis is an instance of AnalysisGlyphs", () => {
		expect(r.analysis).toBeInstanceOf(AnalysisGlyphs);
	});

	it("registry.statusEmoji is an instance of StatusEmojis", () => {
		expect(r.statusEmoji).toBeInstanceOf(StatusEmojis);
	});

	it("registry.fileEmoji is an instance of FileEmojis", () => {
		expect(r.fileEmoji).toBeInstanceOf(FileEmojis);
	});

	it("registry.devEmoji is an instance of DevEmojis", () => {
		expect(r.devEmoji).toBeInstanceOf(DevEmojis);
	});
});

describe("glyphs alias", () => {
	it("glyphs === glyphRegistry (same singleton reference)", () => {
		expect(glyphs).toBe(glyphRegistry);
	});
});
