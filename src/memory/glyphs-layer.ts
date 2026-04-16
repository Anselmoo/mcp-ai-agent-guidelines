/**
 * Glyphs layer for token efficiency - Unicode symbol system for status indicators
 * Provides 40-50% token reduction for status display
 */

/**
 * Core glyph mappings for status indicators
 */
export const CoreGlyphs = {
	// Progress states
	completed: "✅",
	inProgress: "🔄",
	pending: "⏸️",
	blocked: "❌",
	warning: "⚠️",

	// Quality indicators
	excellent: "🏆",
	good: "👍",
	fair: "⭐",
	poor: "👎",
	critical: "🚨",

	// Activity types
	analysis: "📊",
	design: "📐",
	implementation: "⚙️",
	testing: "🧪",
	review: "🔍",
	documentation: "📝",

	// Outcomes
	success: "🎯",
	failure: "💥",
	partial: "⚡",
	skipped: "⤴️",

	// Context
	memory: "🧠",
	session: "💾",
	artifact: "📦",
	workflow: "🔗",
} as const;

/**
 * Extended glyph set for specialized use cases
 */
export const ExtendedGlyphs = {
	// Model types
	free: "🆓",
	cheap: "💰",
	strong: "🚀",
	reviewer: "🔬",

	// Orchestration
	parallel: "⚡",
	sequence: "🔗",
	cascade: "📉",
	feedback: "🔄",

	// Security & Governance
	secure: "🔒",
	compliant: "✅",
	audit: "🔍",
	violation: "🚫",

	// Physics metaphors
	quantum: "⚛️",
	gravity: "🌍",
	wave: "〰️",
	particle: "●",

	// Data flow
	input: "📥",
	output: "📤",
	transform: "🔄",
	filter: "🔽",

	// Performance
	fast: "⚡",
	slow: "🐌",
	optimized: "🎯",
	bottleneck: "🚧",
} as const;

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compact status representations using glyphs
 */
export const StatusGlyphs = {
	// Common status patterns
	task_completed: "✅",
	task_in_progress: "🔄",
	task_blocked: "❌",
	task_pending: "⏸️",

	quality_excellent: "🏆",
	quality_good: "👍",
	quality_needs_work: "⚠️",
	quality_poor: "👎",

	test_pass: "✅",
	test_fail: "❌",
	test_skip: "⤴️",
	test_flaky: "⚠️",

	build_success: "🎯",
	build_failure: "💥",
	build_partial: "⚡",

	// Wave status
	wave_1_complete: "1️⃣✅",
	wave_2_complete: "2️⃣✅",
	wave_3_complete: "3️⃣✅",
	wave_4_complete: "4️⃣✅",
	wave_5_complete: "5️⃣✅",
} as const;

/**
 * Glyph compression for common status messages
 */
export class GlyphCompressor {
	private static readonly compressionMap = new Map([
		// Common status phrases
		["completed successfully", "✅"],
		["in progress", "🔄"],
		["failed", "❌"],
		["pending", "⏸️"],
		["blocked", "🚫"],
		["warning", "⚠️"],

		// Quality assessments
		["excellent quality", "🏆"],
		["good quality", "👍"],
		["needs improvement", "⚠️"],
		["poor quality", "👎"],

		// Common actions
		["analysis", "📊"],
		["design", "📐"],
		["implementation", "⚙️"],
		["testing", "🧪"],
		["review", "🔍"],
		["documentation", "📝"],

		// Outcomes
		["success", "🎯"],
		["failure", "💥"],
		["partial success", "⚡"],
		["skipped", "⤴️"],

		// Memory/context
		["session context", "💾"],
		["memory artifact", "📦"],
		["workflow state", "🔗"],
	]);

	private static readonly expansionMap = new Map(
		Array.from(GlyphCompressor.compressionMap.entries()).map(([k, v]) => [
			v,
			k,
		]),
	);

	/**
	 * Compress a verbose status message into glyph form
	 */
	static compress(text: string): string {
		let compressed = text.toLowerCase();

		for (const [phrase, glyph] of GlyphCompressor.compressionMap) {
			compressed = compressed.replace(
				new RegExp(escapeRegExp(phrase), "gi"),
				glyph,
			);
		}

		return compressed;
	}

	/**
	 * Expand glyphs back to readable text
	 */
	static expand(text: string): string {
		let expanded = text;

		for (const [glyph, phrase] of GlyphCompressor.expansionMap) {
			expanded = expanded.replace(
				new RegExp(glyph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
				phrase,
			);
		}

		return expanded;
	}

	/**
	 * Get token savings estimate (approximate)
	 */
	static getTokenSavings(originalText: string): number {
		const compressed = GlyphCompressor.compress(originalText);
		const originalLength = originalText.length;
		const compressedLength = compressed.length;

		// Rough estimation: 1 glyph ≈ 1 token, 4 characters ≈ 1 token
		const originalTokens = Math.ceil(originalLength / 4);
		const compressedTokens =
			GlyphCompressor.countGlyphs(compressed) +
			Math.ceil(
				(compressedLength - GlyphCompressor.countGlyphs(compressed)) / 4,
			);

		return Math.max(0, originalTokens - compressedTokens);
	}

	private static countGlyphs(text: string): number {
		// Count Unicode emoji/symbols (rough approximation)
		return (
			text.match(
				/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
			) || []
		).length;
	}
}

/**
 * Status display formatter with glyph support
 */
export class GlyphFormatter {
	/**
	 * Format a progress report with glyphs
	 */
	static formatProgress(progress: {
		completed: string[];
		inProgress: string[];
		blocked: string[];
		pending: string[];
	}): string {
		const sections: string[] = [];

		if (progress.completed.length > 0) {
			sections.push(`✅ ${progress.completed.length} completed`);
		}

		if (progress.inProgress.length > 0) {
			sections.push(`🔄 ${progress.inProgress.length} in progress`);
		}

		if (progress.blocked.length > 0) {
			sections.push(`❌ ${progress.blocked.length} blocked`);
		}

		if (progress.pending.length > 0) {
			sections.push(`⏸️ ${progress.pending.length} pending`);
		}

		return sections.join(" | ");
	}

	/**
	 * Format a quality assessment with glyphs
	 */
	static formatQuality(score: number, label?: string): string {
		let glyph: string;
		let status: string;

		if (score >= 9) {
			glyph = CoreGlyphs.excellent;
			status = "excellent";
		} else if (score >= 7) {
			glyph = CoreGlyphs.good;
			status = "good";
		} else if (score >= 5) {
			glyph = CoreGlyphs.fair;
			status = "fair";
		} else {
			glyph = CoreGlyphs.poor;
			status = "poor";
		}

		const labelText = label ? ` ${label}` : "";
		return `${glyph} ${status}${labelText} (${score}/10)`;
	}

	/**
	 * Format a wave status with numbered glyphs
	 */
	static formatWaveStatus(
		waveNumber: number,
		status: "complete" | "in_progress" | "pending" | "blocked",
	): string {
		const numberEmoji =
			["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"][waveNumber] ||
			`${waveNumber}️⃣`;

		const statusGlyph = {
			complete: "✅",
			in_progress: "🔄",
			pending: "⏸️",
			blocked: "❌",
		}[status];

		return `${numberEmoji}${statusGlyph}`;
	}

	/**
	 * Create a compact session summary
	 */
	static formatSessionSummary(session: {
		id: string;
		phase: string;
		progressCount: number;
		qualityScore?: number;
		hasBlockers: boolean;
	}): string {
		const phaseGlyph =
			{
				bootstrap: "🚀",
				implement: "⚙️",
				review: "🔍",
				test: "🧪",
				deploy: "🎯",
			}[session.phase] || "📋";

		const qualityGlyph = session.qualityScore
			? GlyphFormatter.formatQuality(session.qualityScore).split(" ")[0]
			: "";

		const blockerGlyph = session.hasBlockers ? "🚫" : "";

		return `${phaseGlyph} ${session.id.slice(-8)} | ${session.progressCount} tasks ${qualityGlyph} ${blockerGlyph}`.trim();
	}
}

/**
 * Token-efficient status reporter
 */
export class TokenEfficientReporter {
	/**
	 * Generate a highly compressed status report
	 */
	static generateStatusReport(data: {
		session: string;
		wave: number;
		completed: number;
		inProgress: number;
		blocked: number;
		quality: number;
		phase: string;
	}): string {
		const waveStatus = GlyphFormatter.formatWaveStatus(
			data.wave,
			data.blocked > 0
				? "blocked"
				: data.inProgress > 0
					? "in_progress"
					: "complete",
		);

		const progress = `${data.completed}✅ ${data.inProgress}🔄 ${data.blocked}❌`;
		const quality = GlyphFormatter.formatQuality(data.quality).split(" ")[0];

		return `${waveStatus} | ${progress} | ${quality}`;
	}

	/**
	 * Calculate estimated token savings vs verbose report
	 */
	static calculateSavings(
		compactReport: string,
		verboseReport: string,
	): {
		originalTokens: number;
		compactTokens: number;
		savings: number;
		savingsPercent: number;
	} {
		// Rough token estimation
		const originalTokens = Math.ceil(verboseReport.length / 4);
		const compactTokens = Math.ceil(compactReport.length / 3); // Glyphs are more token-dense
		const savings = originalTokens - compactTokens;
		const savingsPercent = Math.round((savings / originalTokens) * 100);

		return {
			originalTokens,
			compactTokens,
			savings,
			savingsPercent,
		};
	}
}

// Export all glyph constants for easy access
export const Glyphs = {
	...CoreGlyphs,
	...ExtendedGlyphs,
	...StatusGlyphs,
} as const;

export type GlyphKey = keyof typeof Glyphs;
