/**
 * glyph-registry.ts
 *
 * TypeScript ESM port of https://gist.github.com/Anselmoo/64e926bbc168e0dffd2c986ea53675e9
 *
 * Maps skill domain prefixes and instruction names to unicode glyphs for
 * consistent terminal and chat formatting across the 102-skill taxonomy.
 * Also exposes grouped glyph utilities (box-drawing, arrows, log levels, etc.)
 *
 * Platform detection: IS_LEGACY_TERMINAL is always false in Node.js on modern
 * terminals (only legacy Windows cmd.exe / old PowerShell need ASCII fallbacks).
 *
 * Zero external dependencies — pure data + lookup logic.
 */

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

export const IS_LEGACY_TERMINAL: boolean =
	typeof process !== "undefined" && process.platform === "win32";

/** Return ASCII fallback on legacy Windows terminals, Unicode elsewhere. */
function _g(ascii: string, unicode: string): string {
	return IS_LEGACY_TERMINAL ? ascii : unicode;
}

// ---------------------------------------------------------------------------
// Base types
// ---------------------------------------------------------------------------

export class Glyph {
	readonly symbol: string;
	readonly name: string;
	readonly description: string;

	constructor(symbol: string, name: string, description = "") {
		this.symbol = symbol;
		this.name = name;
		this.description = description;
	}

	toString(): string {
		return this.symbol;
	}

	[Symbol.toPrimitive](_hint: string): string {
		return this.symbol;
	}
}

export class Emoji {
	readonly symbol: string;
	readonly name: string;
	readonly description: string;

	constructor(symbol: string, name: string, description = "") {
		this.symbol = symbol;
		this.name = name;
		this.description = description;
	}

	toString(): string {
		return this.symbol;
	}

	[Symbol.toPrimitive](_hint: string): string {
		return this.symbol;
	}
}

// ===========================================================================
// GLYPH GROUPS
// ===========================================================================

// ---------------------------------------------------------------------------
// Box drawing
// ---------------------------------------------------------------------------

export class BoxGlyphs {
	readonly h = new Glyph(_g("-", "─"), "h");
	readonly v = new Glyph(_g("|", "│"), "v");
	readonly tl = new Glyph(_g("+", "┌"), "top_left");
	readonly tr = new Glyph(_g("+", "┐"), "top_right");
	readonly bl = new Glyph(_g("+", "└"), "bottom_left");
	readonly br = new Glyph(_g("+", "┘"), "bottom_right");
	readonly t = new Glyph(_g("+", "┬"), "t_top");
	readonly b = new Glyph(_g("+", "┴"), "t_bottom");
	readonly l = new Glyph(_g("+", "├"), "t_left");
	readonly r = new Glyph(_g("+", "┤"), "t_right");
	readonly x = new Glyph(_g("+", "┼"), "cross");
	// Double line
	readonly dh = new Glyph(_g("=", "═"), "double_h");
	readonly dv = new Glyph(_g("|", "║"), "double_v");
	readonly dtl = new Glyph(_g("+", "╔"), "double_top_left");
	readonly dtr = new Glyph(_g("+", "╗"), "double_top_right");
	readonly dbl = new Glyph(_g("+", "╚"), "double_bottom_left");
	readonly dbr = new Glyph(_g("+", "╝"), "double_bottom_right");
	readonly dx = new Glyph(_g("+", "╬"), "double_cross");

	box(text: string, padding = 1): string {
		const pad = " ".repeat(padding);
		const inner = `${pad}${text}${pad}`;
		const w = inner.length;
		const hr = this.h.symbol.repeat(w);
		return [
			`${this.tl}${hr}${this.tr}`,
			`${this.v}${inner}${this.v}`,
			`${this.bl}${hr}${this.br}`,
		].join("\n");
	}

	doubleBox(text: string, padding = 1): string {
		const pad = " ".repeat(padding);
		const inner = `${pad}${text}${pad}`;
		const w = inner.length;
		const hr = this.dh.symbol.repeat(w);
		return [
			`${this.dtl}${hr}${this.dtr}`,
			`${this.dv}${inner}${this.dv}`,
			`${this.dbl}${hr}${this.dbr}`,
		].join("\n");
	}

	table(headers: string[], rows: string[][]): string {
		const colW = headers.map(
			(h, i) =>
				Math.max(
					String(h).length,
					...rows.map((r) => String(r[i] ?? "").length),
				) + 2,
		);
		const rowLine = (cells: string[]) =>
			this.v +
			cells
				.map((c, i) => ` ${String(c).padEnd((colW[i] ?? 1) - 1)}`)
				.join(this.v.symbol) +
			this.v;
		const sep = (lft: string, mid: string, rgt: string, fill: Glyph) =>
			lft + colW.map((w) => fill.symbol.repeat(w)).join(mid) + rgt;
		return [
			sep(this.tl.symbol, this.t.symbol, this.tr.symbol, this.h),
			rowLine(headers),
			sep(this.l.symbol, this.x.symbol, this.r.symbol, this.h),
			...rows.map((row) => rowLine(row)),
			sep(this.bl.symbol, this.b.symbol, this.br.symbol, this.h),
		].join("\n");
	}
}

// ---------------------------------------------------------------------------
// Tree / filesystem
// ---------------------------------------------------------------------------

export type TreeEntry = [string, boolean, TreeEntry[] | null];

export class TreeGlyphs {
	readonly branch = new Glyph(_g("|--", "├──"), "branch");
	readonly last = new Glyph(_g("`--", "└──"), "last");
	readonly pipe = new Glyph(_g("|", "│"), "pipe");
	readonly blank = new Glyph(" ", "blank");

	/** Render nested entries as a tree. entries: Array of [name, isDir, children | null] */
	render(entries: TreeEntry[], indent = 0): string {
		const lines: string[] = [];
		entries.forEach(([name, isDir, children], i) => {
			const connector =
				i === entries.length - 1 ? this.last.symbol : this.branch.symbol;
			const label = isDir ? `${name}/` : name;
			lines.push(`${"  ".repeat(indent)}${connector} ${label}`);
			if (children && children.length > 0) {
				for (const line of this.render(children, indent + 1).split("\n")) {
					lines.push(line);
				}
			}
		});
		return lines.join("\n");
	}
}

// ---------------------------------------------------------------------------
// Arrows
// ---------------------------------------------------------------------------

export class ArrowGlyphs {
	readonly right = new Glyph(_g("->", "→"), "right");
	readonly left = new Glyph(_g("<-", "←"), "left");
	readonly up = new Glyph(_g("^", "↑"), "up");
	readonly down = new Glyph(_g("v", "↓"), "down");
	readonly lr = new Glyph(_g("<->", "↔"), "left_right");
	readonly fatRight = new Glyph(_g("=>", "⇒"), "fat_right");
	readonly fatLeft = new Glyph(_g("<=", "⇐"), "fat_left");
	readonly fatLr = new Glyph(_g("<=>", "⇔"), "fat_lr");
	readonly hookRight = new Glyph(_g("~>", "↪"), "hook_right");
	readonly hookLeft = new Glyph(_g("<~", "↩"), "hook_left");
	readonly upRight = new Glyph(_g("/^", "↗"), "up_right");
	readonly downRight = new Glyph(_g("\\v", "↘"), "down_right");
	readonly upLeft = new Glyph(_g("^\\", "↖"), "up_left");
	readonly downLeft = new Glyph(_g("v/", "↙"), "down_left");
	readonly clockwise = new Glyph(_g("(->)", "↻"), "clockwise");
	readonly counterCw = new Glyph(_g("(<-)", "↺"), "counter_clockwise");
	readonly pipeRight = new Glyph(_g("|>", "▷"), "pipe_right");
	readonly squiggle = new Glyph(_g("~>", "⇝"), "squiggle_right");
	readonly longRight = new Glyph(_g("-->", "⟶"), "long_right");
	readonly longLeft = new Glyph(_g("<--", "⟵"), "long_left");
	readonly mapsTo = new Glyph(_g("|->", "↦"), "maps_to");
}

// ---------------------------------------------------------------------------
// Progress / blocks
// ---------------------------------------------------------------------------

const SPINNER_BRAILLE: readonly string[] = [
	"⠋",
	"⠙",
	"⠹",
	"⠸",
	"⠼",
	"⠴",
	"⠦",
	"⠧",
	"⠇",
	"⠏",
];
const SPINNER_ASCII: readonly string[] = ["|", "/", "-", "\\"];
const SPINNER_ARROW: readonly string[] = [
	"←",
	"↖",
	"↑",
	"↗",
	"→",
	"↘",
	"↓",
	"↙",
];
const SPINNER_BOUNCE: readonly string[] = [
	"▁",
	"▃",
	"▄",
	"▅",
	"▆",
	"▇",
	"█",
	"▇",
	"▆",
	"▅",
	"▄",
	"▃",
];
const SPINNER_PULSE: readonly string[] = ["·", "●", "◉", "●", "·"];
const SPINNER_BAR: readonly string[] = [
	"▏",
	"▎",
	"▍",
	"▌",
	"▋",
	"▊",
	"▉",
	"█",
	"▉",
	"▊",
	"▋",
	"▌",
	"▍",
	"▎",
];

export class ProgressGlyphs {
	readonly full = new Glyph(_g("#", "█"), "full");
	readonly high = new Glyph(_g("=", "▓"), "high");
	readonly mid = new Glyph(_g("-", "▒"), "mid");
	readonly low = new Glyph(_g(".", "░"), "low");
	readonly empty = new Glyph(_g(".", " "), "empty");
	readonly barL = new Glyph(_g("[", "▕"), "bar_left");
	readonly barR = new Glyph(_g("]", "▏"), "bar_right");

	/** Returns an infinite generator of spinner frames. */
	*spinner(style = "braille"): Generator<string, never, unknown> {
		const map: Record<string, readonly string[]> = {
			braille: SPINNER_BRAILLE,
			ascii: SPINNER_ASCII,
			arrow: SPINNER_ARROW,
			bounce: SPINNER_BOUNCE,
			pulse: SPINNER_PULSE,
			bar: SPINNER_BAR,
		};
		const frames = IS_LEGACY_TERMINAL
			? SPINNER_ASCII
			: (map[style] ?? SPINNER_BRAILLE);
		let i = 0;
		while (true) {
			yield frames[i++ % frames.length] ?? "⠋";
		}
	}

	renderBar(value: number, width = 20): string {
		const filled = Math.round(value * width);
		const bar =
			this.full.symbol.repeat(filled) + this.low.symbol.repeat(width - filled);
		return `${this.barL}${bar}${this.barR} ${Math.round(value * 100)}%`;
	}

	renderSegmented(value: number, width = 20): string {
		if (IS_LEGACY_TERMINAL) return this.renderBar(value, width);
		const eighths = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"];
		const total = Math.round(value * width * 8);
		const full = Math.floor(total / 8);
		const rem = total % 8;
		const bar = "█".repeat(full) + (eighths[rem] ?? "");
		return `▕${bar.padEnd(width)}▏ ${Math.round(value * 100)}%`;
	}
}

// ---------------------------------------------------------------------------
// Math / operators
// ---------------------------------------------------------------------------

export class MathGlyphs {
	readonly approx = new Glyph(_g("~=", "≈"), "approx");
	readonly notEqual = new Glyph(_g("!=", "≠"), "not_equal");
	readonly lte = new Glyph(_g("<=", "≤"), "lte");
	readonly gte = new Glyph(_g(">=", "≥"), "gte");
	readonly infinity = new Glyph(_g("inf", "∞"), "infinity");
	readonly sum = new Glyph(_g("SUM", "∑"), "sum");
	readonly product = new Glyph(_g("PROD", "∏"), "product");
	readonly sqrt = new Glyph(_g("sqrt", "√"), "sqrt");
	readonly delta = new Glyph(_g("D", "Δ"), "delta");
	readonly degree = new Glyph(_g("deg", "°"), "degree");
	readonly plusMinus = new Glyph(_g("+/-", "±"), "plus_minus");
	readonly integral = new Glyph(_g("INT", "∫"), "integral");
	readonly partial = new Glyph(_g("d/", "∂"), "partial");
	readonly nabla = new Glyph(_g("V", "∇"), "nabla");
	readonly elementOf = new Glyph(_g("in", "∈"), "element_of");
	readonly notElement = new Glyph(_g("!in", "∉"), "not_element_of");
	readonly subset = new Glyph(_g("<C", "⊂"), "subset");
	readonly superset = new Glyph(_g(">C", "⊃"), "superset");
	readonly union = new Glyph(_g("U", "∪"), "union");
	readonly intersect = new Glyph(_g("^", "∩"), "intersection");
	readonly forAll = new Glyph(_g("forall", "∀"), "for_all");
	readonly exists = new Glyph(_g("exists", "∃"), "exists");
	readonly emptySet = new Glyph(_g("{}", "∅"), "empty_set");
	readonly therefore = new Glyph(_g(":..", "∴"), "therefore");
	readonly because = new Glyph(_g("..:", "∵"), "because");
	readonly proportional = new Glyph(_g("oc", "∝"), "proportional");
	readonly perpendicular = new Glyph(_g("_|_", "⊥"), "perpendicular");
	readonly parallel = new Glyph(_g("||", "∥"), "parallel");
	readonly lambda = new Glyph(_g("lam", "λ"), "lambda");
	readonly mu = new Glyph(_g("mu", "μ"), "mu");
	readonly sigma = new Glyph(_g("sig", "σ"), "sigma");
	readonly pi = new Glyph(_g("pi", "π"), "pi");
	readonly phi = new Glyph(_g("phi", "φ"), "phi");
	readonly omega = new Glyph(_g("ohm", "Ω"), "omega");
}

// ---------------------------------------------------------------------------
// Bullets / markers
// ---------------------------------------------------------------------------

export class BulletGlyphs {
	readonly dot = new Glyph(_g("*", "•"), "dot");
	readonly middleDot = new Glyph(_g(".", "·"), "middle_dot");
	readonly circle = new Glyph(_g("o", "○"), "circle");
	readonly circleFill = new Glyph(_g("O", "●"), "circle_filled");
	readonly square = new Glyph(_g("[ ]", "□"), "square");
	readonly squareFill = new Glyph(_g("[#]", "■"), "square_filled");
	readonly diamond = new Glyph(_g("<>", "◆"), "diamond");
	readonly diamondO = new Glyph(_g("<>", "◇"), "diamond_open");
	readonly triangle = new Glyph(_g(">", "▶"), "triangle");
	readonly triangleO = new Glyph(_g(">", "▷"), "triangle_open");
	readonly star = new Glyph(_g("*", "★"), "star");
	readonly starO = new Glyph(_g("*", "☆"), "star_open");
	readonly check = new Glyph(_g("[x]", "✔"), "check");
	readonly cross = new Glyph(_g("[_]", "✘"), "cross");
	readonly dash = new Glyph(_g("-", "–"), "en_dash");
	readonly emDash = new Glyph(_g("--", "—"), "em_dash");
	readonly arrow = new Glyph(_g("->", "➤"), "arrow");
	readonly lozenge = new Glyph(_g("<>", "◊"), "lozenge");
	readonly ring = new Glyph(_g("()", "◌"), "ring");
}

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export class TypographyGlyphs {
	readonly ellipsis = new Glyph(_g("...", "…"), "ellipsis");
	readonly pilcrow = new Glyph(_g("[P]", "¶"), "pilcrow");
	readonly section = new Glyph(_g("[S]", "§"), "section");
	readonly dagger = new Glyph(_g("[+]", "†"), "dagger");
	readonly doubleDag = new Glyph(_g("[++]", "‡"), "double_dagger");
	readonly trademark = new Glyph(_g("(TM)", "™"), "trademark");
	readonly registered = new Glyph(_g("(R)", "®"), "registered");
	readonly copyright = new Glyph(_g("(C)", "©"), "copyright");
	readonly openDquote = new Glyph(_g('"', "\u201C"), "open_double_quote");
	readonly closeDquote = new Glyph(_g('"', "\u201D"), "close_double_quote");
	readonly openSquote = new Glyph(_g("'", "\u2018"), "open_single_quote");
	readonly closeSquote = new Glyph(_g("'", "\u2019"), "close_single_quote");
	readonly ndash = new Glyph(_g("-", "–"), "en_dash");
	readonly mdash = new Glyph(_g("--", "—"), "em_dash");
	readonly interrobang = new Glyph(_g("?!", "‽"), "interrobang");
	readonly nbsp = new Glyph(_g(" ", "\u00A0"), "non_breaking_space");

	smartQuote(text: string): string {
		return `${this.openDquote}${text}${this.closeDquote}`;
	}
}

// ---------------------------------------------------------------------------
// Log levels
// ---------------------------------------------------------------------------

export class LogLevelGlyphs {
	readonly trace = new Glyph(_g(".", "·"), "trace");
	readonly debug = new Glyph(_g("o", "○"), "debug");
	readonly info = new Glyph(_g("*", "●"), "info");
	readonly notice = new Glyph(_g("<>", "◆"), "notice");
	readonly warning = new Glyph(_g("/!\\", "▲"), "warning");
	readonly error = new Glyph(_g("[E]", "✖"), "error");
	readonly critical = new Glyph(_g("[!!]", "⊘"), "critical");
	readonly fatal = new Glyph(_g("[XX]", "☠"), "fatal");
	readonly ok = new Glyph(_g("[OK]", "✔"), "ok");
	readonly skip = new Glyph(_g("[-]", "⊖"), "skip");
	readonly sep = new Glyph(_g("---", "─────"), "separator");
	readonly scopeL = new Glyph(_g("[", "❬"), "scope_left");
	readonly scopeR = new Glyph(_g("]", "❭"), "scope_right");
	readonly pipe = new Glyph(_g("|", "│"), "pipe");
	readonly ellipsis = new Glyph(_g("...", "…"), "ellipsis");

	label(level: string, width = 8): string {
		const map: Record<string, Glyph> = {
			trace: this.trace,
			debug: this.debug,
			info: this.info,
			notice: this.notice,
			warning: this.warning,
			warn: this.warning,
			error: this.error,
			critical: this.critical,
			fatal: this.fatal,
		};
		const g = map[level.toLowerCase()] ?? this.info;
		const name = level.toUpperCase().padEnd(width);
		return `${g} ${name} ${this.pipe}`;
	}

	formatLine(level: string, message: string, scope = ""): string {
		const prefix = this.label(level);
		if (scope)
			return `${prefix} ${this.scopeL}${scope}${this.scopeR} ${message}`;
		return `${prefix} ${message}`;
	}
}

// ---------------------------------------------------------------------------
// Diff / patch
// ---------------------------------------------------------------------------

export class DiffGlyphs {
	readonly added = new Glyph("+", "added");
	readonly removed = new Glyph(_g("-", "─"), "removed");
	readonly modified = new Glyph("~", "modified");
	readonly unchanged = new Glyph(" ", "unchanged");
	readonly conflict = new Glyph(_g("!", "≠"), "conflict");
	readonly moved = new Glyph(_g("->", "→"), "moved");
	readonly renamed = new Glyph(_g("=>", "⇒"), "renamed");
	readonly hunk = new Glyph(_g("@@", "⊕⊕"), "hunk");
	readonly arrowAdd = new Glyph(_g("+>", "┼"), "arrow_add");
	readonly blockAdd = new Glyph(_g("++", "▌"), "block_add");
	readonly blockRem = new Glyph(_g("--", "▐"), "block_remove");

	line(kind: string, text: string, lineno: number | null = null): string {
		const map: Record<string, Glyph> = {
			added: this.added,
			removed: this.removed,
			modified: this.modified,
			unchanged: this.unchanged,
		};
		const g = map[kind] ?? this.unchanged;
		const num = lineno != null ? `${String(lineno).padStart(4)} ` : "";
		return `${num}${g} ${text}`;
	}
}

// ---------------------------------------------------------------------------
// Git
// ---------------------------------------------------------------------------

export class GitGlyphs {
	// Graph nodes
	readonly commit = new Glyph(_g("o", "●"), "commit");
	readonly merge = new Glyph(_g("M", "◎"), "merge_commit");
	readonly tagNode = new Glyph(_g("#", "◈"), "tag_node");
	readonly head = new Glyph(_g("H", "◉"), "head");
	readonly stash = new Glyph(_g("s", "⊙"), "stash");
	readonly remote = new Glyph(_g("r", "◯"), "remote");
	// Graph connectors
	readonly graphV = new Glyph(_g("|", "│"), "graph_vertical");
	readonly graphH = new Glyph(_g("-", "─"), "graph_horizontal");
	readonly graphTl = new Glyph(_g("/", "╮"), "graph_top_left");
	readonly graphBr = new Glyph(_g("\\", "╯"), "graph_bottom_right");
	readonly graphBl = new Glyph(_g("\\", "╰"), "graph_bottom_left");
	readonly graphTr = new Glyph(_g("/", "╭"), "graph_top_right");
	readonly graphX = new Glyph(_g("*", "┼"), "graph_cross");
	// Branch / status indicators
	readonly branch = new Glyph(_g("br", "⎇"), "branch");
	readonly ahead = new Glyph(_g("^", "↑"), "ahead");
	readonly behind = new Glyph(_g("v", "↓"), "behind");
	readonly diverged = new Glyph(_g("^v", "↕"), "diverged");
	readonly gitAdded = new Glyph("+", "added");
	readonly gitRemoved = new Glyph("-", "removed");
	readonly gitModified = new Glyph("~", "modified");
	readonly untracked = new Glyph("?", "untracked");
	readonly ignored = new Glyph("!", "ignored");
	readonly conflict = new Glyph(_g("!=", "≠"), "conflict");
	readonly clean = new Glyph(_g("OK", "✔"), "clean");
	readonly dirty = new Glyph(_g("*", "✎"), "dirty");
	// Ref decorators
	readonly refL = new Glyph("(", "ref_left");
	readonly refR = new Glyph(")", "ref_right");

	statusLine(
		branchName: string,
		ahead = 0,
		behind = 0,
		modified = 0,
		untracked = 0,
	): string {
		const parts = [`${this.branch} ${branchName}`];
		if (ahead) parts.push(`${this.ahead}${ahead}`);
		if (behind) parts.push(`${this.behind}${behind}`);
		if (modified) parts.push(`${this.gitModified}${modified}`);
		if (untracked) parts.push(`${this.untracked}${untracked}`);
		const status = modified || untracked ? this.dirty : this.clean;
		parts.push(String(status));
		return parts.join(" ");
	}

	logLine(sha: string, message: string, refs: string[] = []): string {
		const refStr = refs.length
			? " " + refs.map((r) => `${this.refL}${r}${this.refR}`).join(" ")
			: "";
		return `${this.commit} ${sha.slice(0, 7)}${refStr} ${message}`;
	}
}

// ---------------------------------------------------------------------------
// CI/CD pipeline
// ---------------------------------------------------------------------------

export class CICDGlyphs {
	// Stage / job states
	readonly passed = new Glyph(_g("[OK]", "✔"), "passed");
	readonly failed = new Glyph(_g("[FL]", "✖"), "failed");
	readonly running = new Glyph(_g("[>>]", "▶"), "running");
	readonly queued = new Glyph(_g("[Q]", "◷"), "queued");
	readonly canceled = new Glyph(_g("[CX]", "⊘"), "canceled");
	readonly skipped = new Glyph(_g("[SK]", "⊖"), "skipped");
	readonly manual = new Glyph(_g("[M]", "◈"), "manual");
	readonly blocked = new Glyph(_g("[BL]", "⊗"), "blocked");
	readonly created = new Glyph(_g("[C]", "○"), "created");
	// Stage types
	readonly build = new Glyph(_g("[B]", "⚙"), "build");
	readonly test = new Glyph(_g("[T]", "⚗"), "test");
	readonly lint = new Glyph(_g("[L]", "⌥"), "lint");
	readonly scan = new Glyph(_g("[SC]", "⌕"), "scan");
	readonly deploy = new Glyph(_g("[D]", "⬆"), "deploy");
	readonly release = new Glyph(_g("[R]", "◆"), "release");
	readonly rollback = new Glyph(_g("[RB]", "↩"), "rollback");
	readonly artifact = new Glyph(_g("[A]", "⊡"), "artifact");
	readonly trigger = new Glyph(_g("[TR]", "⇒"), "trigger");
	readonly notify = new Glyph(_g("[N]", "◎"), "notify");
	// Pipeline connectors
	readonly stageSep = new Glyph(_g("->", "→"), "stage_sep");
	readonly parallel = new Glyph(_g("||", "⫴"), "parallel");

	/** stages: Array of [stageType, status] e.g. [["build","passed"],["test","running"]] */
	pipeline(stages: Array<[string, string]>): string {
		const typeMap: Record<string, Glyph> = {
			build: this.build,
			test: this.test,
			lint: this.lint,
			scan: this.scan,
			deploy: this.deploy,
			release: this.release,
		};
		const stateMap: Record<string, Glyph> = {
			passed: this.passed,
			failed: this.failed,
			running: this.running,
			queued: this.queued,
			canceled: this.canceled,
			skipped: this.skipped,
			manual: this.manual,
			blocked: this.blocked,
		};
		return stages
			.map(
				([type, status]) =>
					`${typeMap[type] ?? this.build}${stateMap[status] ?? this.queued}`,
			)
			.join(` ${this.stageSep} `);
	}
}

// ---------------------------------------------------------------------------
// Code / programming symbols
// ---------------------------------------------------------------------------

export class CodeGlyphs {
	// Code constructs
	readonly function_ = new Glyph(_g("fn", "ƒ"), "function");
	readonly lambda_ = new Glyph(_g("lam", "λ"), "lambda");
	readonly class_ = new Glyph(_g("cls", "⊞"), "class");
	readonly interface_ = new Glyph(_g("iface", "⊟"), "interface");
	readonly type_ = new Glyph(_g("T", "τ"), "type");
	readonly generic = new Glyph(_g("<T>", "⟨T⟩"), "generic");
	readonly variable = new Glyph(_g("var", "υ"), "variable");
	readonly constant = new Glyph(_g("CONST", "κ"), "constant");
	readonly module_ = new Glyph(_g("mod", "⊕"), "module");
	readonly namespace_ = new Glyph(_g("ns", "⊗"), "namespace");
	readonly import_ = new Glyph(_g("use", "⇐"), "import");
	readonly export_ = new Glyph(_g("pub", "⇒"), "export");
	// Flow / logic
	readonly branch = new Glyph(_g("if", "⑂"), "branch");
	readonly loop = new Glyph(_g("for", "↻"), "loop");
	readonly recurse = new Glyph(_g("rec", "⟳"), "recurse");
	readonly async_ = new Glyph(_g("~>", "⇝"), "async");
	readonly await_ = new Glyph(_g("<~", "⊸"), "await");
	readonly yield_ = new Glyph(_g("<<", "⟵"), "yield");
	readonly return_ = new Glyph(_g("<-", "↵"), "return");
	readonly throw_ = new Glyph(_g("!!!", "↯"), "throw");
	// Values / types
	readonly null_ = new Glyph(_g("null", "∅"), "null");
	readonly true_ = new Glyph(_g("T", "⊤"), "true");
	readonly false_ = new Glyph(_g("F", "⊥"), "false");
	readonly some = new Glyph(_g("Some", "◉"), "some");
	readonly none = new Glyph(_g("None", "◌"), "none");
	readonly ok_ = new Glyph(_g("Ok", "✔"), "ok");
	readonly err_ = new Glyph(_g("Err", "✖"), "err");
	// Operators
	readonly compose = new Glyph(_g(">>", "∘"), "compose");
	readonly pipeOp = new Glyph(_g("|>", "▷"), "pipe_operator");
	readonly bind = new Glyph(_g(">>=", "≫="), "bind");
	readonly mapsTo = new Glyph(_g("|->", "↦"), "maps_to");
	readonly equiv = new Glyph(_g("===", "≡"), "equivalent");
	readonly notEquiv = new Glyph(_g("!==", "≢"), "not_equivalent");
	// Memory / runtime
	readonly pointer = new Glyph(_g("*", "⊛"), "pointer");
	readonly ref = new Glyph("&", "reference");
	readonly deref = new Glyph(_g("*", "✱"), "dereference");
	readonly alloc = new Glyph(_g("new", "⊞"), "allocate");
	readonly free = new Glyph(_g("del", "⊟"), "free");
}

// ---------------------------------------------------------------------------
// Analysis / metrics
// ---------------------------------------------------------------------------

const SPARK: readonly string[] = [" ", "▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

export class AnalysisGlyphs {
	readonly trendUp = new Glyph(_g("/^", "↗"), "trend_up");
	readonly trendDown = new Glyph(_g("\\v", "↘"), "trend_down");
	readonly trendFlat = new Glyph(_g("->", "→"), "trend_flat");
	readonly spike = new Glyph(_g("/!\\", "⚡"), "spike");
	readonly drop = new Glyph(_g("\\!", "⬇"), "drop");
	readonly scoreFull = new Glyph(_g("[*]", "★"), "score_full");
	readonly scoreHalf = new Glyph(_g("[/]", "⯨"), "score_half");
	readonly scoreEmpty = new Glyph(_g("[ ]", "☆"), "score_empty");
	readonly better = new Glyph(_g(">", "⊳"), "better");
	readonly worse = new Glyph(_g("<", "⊲"), "worse");
	readonly same = new Glyph(_g("=", "≈"), "same");
	readonly p50 = new Glyph(_g("p50", "⊕"), "median");
	readonly outlier = new Glyph(_g("(!)", "⊛"), "outlier");

	sparkline(values: number[]): string {
		const mn = Math.min(...values);
		const mx = Math.max(...values);
		const rng = mx - mn || 1;
		if (IS_LEGACY_TERMINAL) {
			return values
				.map((v) => String(Math.round(((v - mn) / rng) * 9)).padStart(2))
				.join("");
		}
		return values
			.map((v) => SPARK[Math.round(((v - mn) / rng) * 8)] ?? "▄")
			.join("");
	}

	rating(score: number, maxScore = 5.0, width = 5): string {
		const ratio = score / maxScore;
		const full = Math.floor(ratio * width);
		const hasHalf = ratio * width - full >= 0.5;
		const empty = width - full - (hasHalf ? 1 : 0);
		return (
			this.scoreFull.symbol.repeat(full) +
			(hasHalf ? this.scoreHalf.symbol : "") +
			this.scoreEmpty.symbol.repeat(empty) +
			` ${score}/${maxScore}`
		);
	}

	delta(oldVal: number, newVal: number, unit = ""): string {
		const diff = newVal - oldVal;
		const pct = oldVal ? (diff / oldVal) * 100 : 0;
		const sign = diff >= 0 ? "+" : "";
		let glyph: Glyph;
		if (diff > 0) {
			glyph = this.trendUp;
		} else if (diff < 0) {
			glyph = this.trendDown;
		} else {
			glyph = this.trendFlat;
		}
		return `${glyph} ${sign}${diff.toFixed(2)}${unit} (${sign}${pct.toFixed(1)}%)`;
	}
}

// ===========================================================================
// EMOJI GROUPS
// ===========================================================================

export class StatusEmojis {
	readonly success = new Emoji("✅", "success");
	readonly error = new Emoji("❌", "error");
	readonly warning = new Emoji("⚠️", "warning");
	readonly info = new Emoji("ℹ️", "info");
	readonly pending = new Emoji("⏳", "pending");
	readonly skipped = new Emoji("⏭️", "skipped");
	readonly question = new Emoji("❓", "question");
	readonly debug = new Emoji("🐛", "debug");
	readonly locked = new Emoji("🔒", "locked");
	readonly unlocked = new Emoji("🔓", "unlocked");
	readonly new_ = new Emoji("🆕", "new");
	readonly hot = new Emoji("🔥", "hot");
	readonly pinned = new Emoji("📌", "pinned");
	readonly flag = new Emoji("🚩", "flag");
	readonly robot = new Emoji("🤖", "robot");
}

export class FileEmojis {
	readonly folder = new Emoji("📁", "folder");
	readonly folderO = new Emoji("📂", "folder_open");
	readonly file = new Emoji("📄", "file");
	readonly link = new Emoji("🔗", "link");
	readonly image = new Emoji("🖼️", "image");
	readonly video = new Emoji("🎬", "video");
	readonly audio = new Emoji("🎵", "audio");
	readonly archive = new Emoji("🗜️", "archive");
	readonly config = new Emoji("⚙️", "config");
	readonly trash = new Emoji("🗑️", "trash");
	readonly key = new Emoji("🔑", "key");
	readonly secret = new Emoji("🔐", "secret");
	readonly database = new Emoji("🗄️", "database");
	readonly terminal = new Emoji("🖥️", "terminal");
	readonly package = new Emoji("📦", "package");
}

export class DevEmojis {
	readonly feat = new Emoji("✨", "feature");
	readonly fix = new Emoji("🐛", "bugfix");
	readonly hotfix = new Emoji("🚑", "hotfix");
	readonly refactor = new Emoji("♻️", "refactor");
	readonly perf = new Emoji("⚡", "performance");
	readonly test = new Emoji("🧪", "test");
	readonly docs = new Emoji("📝", "docs");
	readonly style = new Emoji("🎨", "style");
	readonly chore = new Emoji("🔧", "chore");
	readonly revert = new Emoji("⏪", "revert");
	readonly merge = new Emoji("🔀", "merge");
	readonly release = new Emoji("🚀", "release");
	readonly deprecate = new Emoji("🗑️", "deprecate");
	readonly remove = new Emoji("🔥", "remove");
	readonly security = new Emoji("🔒", "security");
	readonly deps = new Emoji("📦", "dependencies");
	readonly ci = new Emoji("⚙️", "ci");
	readonly breaking = new Emoji("💥", "breaking_change");
	readonly wip = new Emoji("🚧", "wip");
	readonly config = new Emoji("🔧", "config");

	conventionalCommit(kind: string, scope: string, message: string): string {
		const map: Record<string, Emoji> = {
			feat: this.feat,
			fix: this.fix,
			hotfix: this.hotfix,
			refactor: this.refactor,
			perf: this.perf,
			test: this.test,
			docs: this.docs,
			style: this.style,
			chore: this.chore,
			revert: this.revert,
			ci: this.ci,
			deps: this.deps,
		};
		const e = map[kind] ?? this.chore;
		const scopeStr = scope ? `(${scope})` : "";
		return `${e} ${kind}${scopeStr}: ${message}`;
	}
}

// ===========================================================================
// Skill-domain glyph mapping
// ===========================================================================

export interface GlyphEntry {
	readonly glyph: string;
	readonly label: string;
}

// ---------------------------------------------------------------------------
// Domain-prefix → glyph table (18 prefixes, one per domain)
// ---------------------------------------------------------------------------

const DOMAIN_PREFIX_MAP: Readonly<Record<string, GlyphEntry>> = {
	"adapt-": { glyph: "🧬", label: "Bio-inspired Adaptive Routing" },
	"arch-": { glyph: "🏗️", label: "Architecture Design" },
	"bench-": { glyph: "📈", label: "Advanced Evals" },
	"debug-": { glyph: "🐛", label: "Debugging" },
	"doc-": { glyph: "📚", label: "Documentation" },
	"eval-": { glyph: "📊", label: "Evaluation & Benchmarking" },
	"flow-": { glyph: "🔄", label: "Workflow" },
	"gov-": { glyph: "🛡️", label: "Safety & Governance" },
	"gr-": { glyph: "🌌", label: "General Relativity metaphors" },
	"lead-": { glyph: "👑", label: "Leadership & Enterprise" },
	"orch-": { glyph: "🎭", label: "Orchestration" },
	"prompt-": { glyph: "💬", label: "Prompting" },
	"qm-": { glyph: "⚛️", label: "Quantum Mechanics metaphors" },
	"qual-": { glyph: "🔍", label: "Code Analysis & Quality" },
	"req-": { glyph: "📋", label: "Requirements Discovery" },
	"resil-": { glyph: "💪", label: "Resilience & Self-repair" },
	"strat-": { glyph: "♟️", label: "Strategy & Decision Making" },
	"synth-": { glyph: "🔬", label: "Research & Synthesis" },
} as const;

// ---------------------------------------------------------------------------
// Instruction name → glyph table (19 instructions)
// ---------------------------------------------------------------------------

const INSTRUCTION_MAP: Readonly<Record<string, GlyphEntry>> = {
	adapt: { glyph: "🧬", label: "Bio-inspired Adaptive Routing" },
	bootstrap: { glyph: "🌱", label: "First Contact" },
	debug: { glyph: "🐛", label: "Diagnose and Fix Problems" },
	design: { glyph: "🎨", label: "Architecture and System Design" },
	document: { glyph: "📚", label: "Generate Documentation Artifacts" },
	enterprise: { glyph: "🏢", label: "Leadership and Enterprise Scale" },
	evaluate: { glyph: "📊", label: "Benchmark and Assess Quality" },
	govern: { glyph: "🛡️", label: "Safety, Compliance, and Guardrails" },
	implement: { glyph: "🔨", label: "Build New Feature or Tool" },
	"meta-routing": { glyph: "🧭", label: "Task Router" },
	orchestrate: { glyph: "🎭", label: "Compose Multi-Agent Workflows" },
	"physics-analysis": { glyph: "⚛️", label: "QM and GR Code Metaphors" },
	plan: { glyph: "🗺️", label: "Strategy, Roadmap, and Sprint Planning" },
	"prompt-engineering": {
		glyph: "💬",
		label: "Build, Evaluate, and Optimize Prompts",
	},
	refactor: { glyph: "♻️", label: "Improve Existing Code Safely" },
	research: {
		glyph: "🔬",
		label: "Synthesis, Comparison, and Recommendations",
	},
	resilience: { glyph: "💪", label: "Self-Healing and Fault Tolerance" },
	review: { glyph: "👁️", label: "Code, Quality, and Security Review" },
	testing: { glyph: "🧪", label: "Write, Run, and Verify Tests" },
} as const;

// Fallback used when no prefix or instruction name matches.
const FALLBACK_GLYPH = "•";

// ===========================================================================
// GlyphRegistry — composite container + skill/instruction API
// ===========================================================================

export class GlyphRegistry {
	// Glyph groups
	readonly box = new BoxGlyphs();
	readonly tree = new TreeGlyphs();
	readonly arrows = new ArrowGlyphs();
	readonly progress = new ProgressGlyphs();
	readonly math = new MathGlyphs();
	readonly bullets = new BulletGlyphs();
	readonly typography = new TypographyGlyphs();
	readonly log = new LogLevelGlyphs();
	readonly diff = new DiffGlyphs();
	readonly git = new GitGlyphs();
	readonly cicd = new CICDGlyphs();
	readonly code = new CodeGlyphs();
	readonly analysis = new AnalysisGlyphs();
	// Emoji groups
	readonly statusEmoji = new StatusEmojis();
	readonly fileEmoji = new FileEmojis();
	readonly devEmoji = new DevEmojis();

	/**
	 * Returns the glyph entry for a skill by its domain-prefixed id.
	 *
	 * @example
	 * registry.forSkill("qm-entanglement-mapper") // { glyph: "⚛️", label: "Quantum Mechanics metaphors" }
	 * registry.forSkill("gov-data-guardrails")     // { glyph: "🛡️", label: "Safety & Governance" }
	 */
	forSkill(skillId: string): GlyphEntry {
		for (const prefix of Object.keys(DOMAIN_PREFIX_MAP)) {
			if (skillId.startsWith(prefix)) {
				return (
					DOMAIN_PREFIX_MAP[prefix] ?? {
						glyph: FALLBACK_GLYPH,
						label: "Unknown domain",
					}
				);
			}
		}
		return { glyph: FALLBACK_GLYPH, label: "Unknown domain" };
	}

	/**
	 * Returns the glyph entry for an instruction by its canonical name.
	 *
	 * @example
	 * registry.forInstruction("testing")    // { glyph: "🧪", label: "Write, Run, and Verify Tests" }
	 * registry.forInstruction("enterprise") // { glyph: "🏢", label: "Leadership and Enterprise Scale" }
	 */
	forInstruction(name: string): GlyphEntry {
		const entry = INSTRUCTION_MAP[name];
		if (entry) return entry;
		return { glyph: FALLBACK_GLYPH, label: name };
	}

	/**
	 * Returns the complete domain-prefix → glyph table.
	 * Useful for legend rendering.
	 */
	domainPrefixes(): Readonly<Record<string, GlyphEntry>> {
		return DOMAIN_PREFIX_MAP;
	}

	/**
	 * Returns the complete instruction → glyph table.
	 */
	instructions(): Readonly<Record<string, GlyphEntry>> {
		return INSTRUCTION_MAP;
	}

	/**
	 * Formats a skill id as a prefixed glyph string for terminal/chat output.
	 *
	 * @example
	 * registry.format("qm-bloch-interpolator") // "⚛️ qm-bloch-interpolator"
	 */
	format(skillId: string): string {
		return `${this.forSkill(skillId).glyph} ${skillId}`;
	}
}

// ---------------------------------------------------------------------------
// Singleton exports
// ---------------------------------------------------------------------------

export const glyphRegistry = new GlyphRegistry();
/** Gist-compatible alias — mirrors the Python/JS `glyphs = GlyphRegistry()` pattern. */
export const glyphs = glyphRegistry;
export default glyphs;
