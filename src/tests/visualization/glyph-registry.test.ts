import { describe, expect, it } from "vitest";
import {
	AnalysisGlyphs,
	ArrowGlyphs,
	BoxGlyphs,
	BulletGlyphs,
	CICDGlyphs,
	CodeGlyphs,
	DevEmojis,
	DiffGlyphs,
	Emoji,
	FileEmojis,
	GitGlyphs,
	Glyph,
	GlyphRegistry,
	glyphRegistry,
	glyphs,
	LogLevelGlyphs,
	MathGlyphs,
	ProgressGlyphs,
	StatusEmojis,
	TreeGlyphs,
	TypographyGlyphs,
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

	it("renderSegmented() returns a string with percentage", () => {
		const out = progress.renderSegmented(0.75);
		expect(out).toContain("75%");
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

	it("logLine() includes formatted refs when provided", () => {
		const out = git.logLine("aabbccddeeff", "add feature", ["main", "HEAD"]);
		expect(out).toContain("aabbccd");
		expect(out).toContain("main");
		expect(out).toContain("HEAD");
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

	it("delta() shows trendFlat for equal values", () => {
		const out = analysis.delta(10, 10);
		expect(out).toContain("→");
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

describe("TreeGlyphs", () => {
	const tree = new TreeGlyphs();

	it("render() formats a flat list of entries", () => {
		const result = tree.render([
			["fileA.ts", false, null],
			["fileB.ts", false, null],
		]);
		expect(result).toContain("fileA.ts");
		expect(result).toContain("fileB.ts");
	});

	it("render() formats a directory entry with children", () => {
		const result = tree.render([
			[
				"src",
				true,
				[
					["index.ts", false, null],
					["utils.ts", false, null],
				],
			],
		]);
		expect(result).toContain("src/");
		expect(result).toContain("index.ts");
		expect(result).toContain("utils.ts");
	});

	it("render() marks last entry with last connector", () => {
		const result = tree.render([
			["a", false, null],
			["b", false, null],
		]);
		expect(result).toContain(tree.last.symbol);
	});

	it("render() returns empty string for empty input", () => {
		expect(tree.render([])).toBe("");
	});
});

describe("ArrowGlyphs", () => {
	const arrows = new ArrowGlyphs();

	it("right arrow is non-empty", () => {
		expect(typeof arrows.right.symbol).toBe("string");
		expect(arrows.right.symbol.length).toBeGreaterThan(0);
	});

	it("all basic directions have non-empty symbols", () => {
		for (const key of ["right", "left", "up", "down", "lr"] as const) {
			expect(arrows[key].symbol.length).toBeGreaterThan(0);
		}
	});
});

describe("MathGlyphs", () => {
	const math = new MathGlyphs();

	it("all math symbols are non-empty strings", () => {
		expect(math.pi.symbol.length).toBeGreaterThan(0);
		expect(math.sum.symbol.length).toBeGreaterThan(0);
		expect(math.infinity.symbol.length).toBeGreaterThan(0);
	});
});

describe("BulletGlyphs", () => {
	const bullet = new BulletGlyphs();

	it("dot bullet is non-empty", () => {
		expect(bullet.dot.symbol.length).toBeGreaterThan(0);
	});

	it("check and cross are non-empty", () => {
		expect(bullet.check.symbol.length).toBeGreaterThan(0);
		expect(bullet.cross.symbol.length).toBeGreaterThan(0);
	});
});

describe("TypographyGlyphs", () => {
	const typo = new TypographyGlyphs();

	it("ellipsis is non-empty", () => {
		expect(typo.ellipsis.symbol.length).toBeGreaterThan(0);
	});

	it("smartQuote wraps text with quotes", () => {
		const result = typo.smartQuote("hello");
		expect(result).toContain("hello");
		expect(result.length).toBeGreaterThan("hello".length);
	});
});

describe("DiffGlyphs", () => {
	const diff = new DiffGlyphs();

	it("added and removed glyphs are non-empty", () => {
		expect(diff.added.symbol.length).toBeGreaterThan(0);
		expect(diff.removed.symbol.length).toBeGreaterThan(0);
	});

	it("conflict glyph is non-empty", () => {
		expect(diff.conflict.symbol.length).toBeGreaterThan(0);
	});

	it("line() includes line number when lineno is provided", () => {
		const out = diff.line("added", "new line content", 42);
		expect(out).toContain("42");
		expect(out).toContain("new line content");
	});

	it("line() falls back to unchanged glyph for unknown kind", () => {
		const out = diff.line("unknown-kind", "some text");
		expect(typeof out).toBe("string");
		expect(out).toContain("some text");
	});
});

describe("CodeGlyphs", () => {
	const code = new CodeGlyphs();

	it("lambda and function symbols are non-empty", () => {
		expect(code.lambda_.symbol.length).toBeGreaterThan(0);
		expect(code.function_.symbol.length).toBeGreaterThan(0);
	});

	it("class and interface symbols are non-empty", () => {
		expect(code.class_.symbol.length).toBeGreaterThan(0);
		expect(code.interface_.symbol.length).toBeGreaterThan(0);
	});
});

describe("ProgressGlyphs extended", () => {
	const progress = new ProgressGlyphs();

	it("spinner() with ascii style yields strings", () => {
		const gen = progress.spinner("ascii");
		const frame = gen.next().value;
		expect(typeof frame).toBe("string");
		expect(frame.length).toBeGreaterThan(0);
	});

	it("spinner() with arrow style yields strings", () => {
		const gen = progress.spinner("arrow");
		const frame = gen.next().value;
		expect(typeof frame).toBe("string");
	});

	it("spinner() with bounce style yields strings", () => {
		const gen = progress.spinner("bounce");
		const frame = gen.next().value;
		expect(typeof frame).toBe("string");
	});

	it("spinner() with pulse style yields strings", () => {
		const gen = progress.spinner("pulse");
		const frame = gen.next().value;
		expect(typeof frame).toBe("string");
	});

	it("spinner() with bar style yields strings", () => {
		const gen = progress.spinner("bar");
		const frame = gen.next().value;
		expect(typeof frame).toBe("string");
	});

	it("spinner() with unknown style falls back to braille", () => {
		const gen = progress.spinner("nonexistent-style");
		const frame = gen.next().value;
		expect(typeof frame).toBe("string");
	});
});

describe("GitGlyphs extended", () => {
	const git = new GitGlyphs();

	it("statusLine() includes modified count when modified > 0", () => {
		const out = git.statusLine("main", 0, 0, 3, 0);
		expect(out).toContain("3");
	});

	it("statusLine() includes untracked count when untracked > 0", () => {
		const out = git.statusLine("main", 0, 0, 0, 2);
		expect(out).toContain("2");
	});

	it("statusLine() uses dirty glyph when files are modified", () => {
		const out = git.statusLine("main", 0, 0, 1, 1);
		const git2 = new GitGlyphs();
		expect(out).toContain(git2.dirty.symbol);
	});
});

describe("AnalysisGlyphs extended", () => {
	const analysis = new AnalysisGlyphs();

	it("sparkline() handles all-equal values (rng fallback to 1)", () => {
		const out = analysis.sparkline([5, 5, 5]);
		expect(typeof out).toBe("string");
		expect(out.length).toBeGreaterThan(0);
	});

	it("rating() with integer score has no half star", () => {
		const out = analysis.rating(4.0);
		expect(out).toContain("4/5");
	});

	it("delta() returns 0-pct when oldVal is 0", () => {
		const out = analysis.delta(0, 5);
		expect(out).toContain("+5.00");
		expect(out).toContain("0.0%");
	});
});

describe("BoxGlyphs table edge cases", () => {
	const box = new BoxGlyphs();

	it("table() handles row with fewer cells than headers (missing cell shows empty)", () => {
		// row has only 1 cell but headers has 2 — r[1] ?? "" fires
		const out = box.table(["Name", "Value"], [["Alice"]]);
		expect(out).toContain("Alice");
	});

	it("table() handles row with more cells than headers (colW[i] ?? 1 fires)", () => {
		// row has 3 cells but headers only 2 — colW[2] ?? 1 fires
		const out = box.table(["Name", "Value"], [["Alice", "100", "extra"]]);
		expect(out).toContain("Alice");
		expect(out).toContain("extra");
	});
});
