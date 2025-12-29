#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function parseLCOV(lcovText) {
	const lines = lcovText.split(/\r?\n/);
	const files = {};
	let current = null;
	for (const line of lines) {
		if (!line) continue;
		if (line.startsWith("SF:")) {
			current = line.slice(3);
			files[current] = files[current] || { lines: {}, branches: {} };
			continue;
		}
		if (!current) continue;
		if (line.startsWith("DA:")) {
			const [, rest] = line.split("DA:");
			const [numStr, countStr] = rest.split(",");
			const num = Number(numStr);
			const count = Number(countStr);
			files[current].lines[num] = (files[current].lines[num] || 0) + count;
		} else if (line.startsWith("BRDA:")) {
			const [, rest] = line.split("BRDA:");
			const [numStr, _block, _branch, takenStr] = rest.split(",");
			const num = Number(numStr);
			const taken = takenStr === "-" ? null : Number(takenStr);
			files[current].branches[num] = files[current].branches[num] || [];
			files[current].branches[num].push(taken);
		}
	}
	return files;
}

function parseGitDiffRanges(baseRef, headRef, repoPath = ".") {
	// returns map file -> set of changed line numbers (new file line numbers)
	const cmd = `git -C "${repoPath}" fetch --no-tags origin ${baseRef} --quiet || true && git -C "${repoPath}" diff --unified=0 origin/${baseRef}...${headRef}`;
	const raw = execSync(cmd, {
		encoding: "utf8",
		stdio: ["pipe", "pipe", "ignore"],
	});
	const files = {};
	const lines = raw.split(/\r?\n/);
	let currentFile = null;
	for (const l of lines) {
		if (l.startsWith("+++ b/")) {
			currentFile = l.slice(6);
			files[currentFile] = files[currentFile] || new Set();
		}
		if (!currentFile) continue;
		if (l.startsWith("@@")) {
			// @@ -a,b +c,d @@
			const m = /@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(l);
			if (m) {
				const start = Number(m[1]);
				const len = m[2] ? Number(m[2]) : 1;
				for (let i = start; i < start + len; i++) files[currentFile].add(i);
			}
		}
	}
	return files;
}

function classifyLine(fileCoverage, lineNum) {
	const da = fileCoverage.lines?.[lineNum] || 0;
	const brs = fileCoverage.branches?.[lineNum];
	if (!brs) {
		return da > 0 ? { kind: "hit" } : { kind: "miss" };
	}
	// branch entries exist
	let anyZero = false;
	let anyNonZero = false;
	for (const t of brs) {
		if (t === null || t === 0) anyZero = true;
		else anyNonZero = true;
	}
	if (anyZero && anyNonZero) return { kind: "partial" };
	if (anyNonZero && !anyZero) return { kind: "hit" };
	return { kind: "miss" };
}

function computePatchReportFromStrings(lcovText, diffRanges) {
	const lcov = parseLCOV(lcovText);
	const report = { files: {} };
	for (const [file, setLines] of Object.entries(diffRanges)) {
		const covFileKey =
			Object.keys(lcov).find((k) => k.endsWith(file) || k === file) || file;
		const cov = lcov[covFileKey] || { lines: {}, branches: {} };
		const details = [];
		let hits = 0,
			partials = 0,
			misses = 0,
			total = 0;
		for (const ln of setLines instanceof Set ? [...setLines] : setLines) {
			total++;
			const cls = classifyLine(cov, ln);
			if (cls.kind === "hit") hits++;
			else if (cls.kind === "partial") partials++;
			else misses++;
			details.push({ line: ln, kind: cls.kind });
		}
		report.files[file] = { total, hits, partials, misses, details };
	}
	return report;
}

function printSummary(report) {
	const perFile = Object.entries(report.files).map(
		([f, r]) =>
			`${f}: changed ${r.total} lines → ${r.hits} hits, ${r.partials} partials, ${r.misses} misses`,
	);
	console.log("\n=== Coverage Patch Summary ===\n");
	for (const line of perFile) console.log(line);
	console.log("\nDetailed:");
	for (const [f, r] of Object.entries(report.files)) {
		for (const d of r.details) {
			if (d.kind !== "hit") console.log(`  ${f}:${d.line} → ${d.kind}`);
		}
	}
}

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

// CLI - only run when executed directly, not when imported for tests
if (process.argv[1] === __filename) {
	const argv = process.argv.slice(2);
	const opts = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--lcov") opts.lcov = argv[++i];
		else if (a === "--base") opts.base = argv[++i];
		else if (a === "--head") opts.head = argv[++i];
		else if (a === "--output") opts.output = argv[++i];
		else if (a === "--threshold") opts.threshold = Number(argv[++i]);
	}
	opts.lcov = opts.lcov || "coverage/lcov.info";
	opts.base = opts.base || "main";
	opts.head = opts.head || "HEAD";
	opts.output = opts.output || "artifacts/coverage-patch.json";
	opts.threshold = typeof opts.threshold === "number" ? opts.threshold : null;

	if (!existsSync(opts.lcov)) {
		console.error(`LCOV file not found: ${opts.lcov}`);
		process.exit(2);
	}

	const lcovText = readFileSync(opts.lcov, "utf8");
	const diffRanges = parseGitDiffRanges(opts.base, opts.head, process.cwd());
	const report = computePatchReportFromStrings(lcovText, diffRanges);

	// ensure artifact dir
	const outDir = path.dirname(opts.output);
	if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
	writeFileSync(opts.output, JSON.stringify(report, null, 2));
	printSummary(report);

	// optional threshold check
	if (opts.threshold !== null) {
		// compute weighted patch coverage: hits/(hits+partials+misses) but partial counts as half (optional). We'll follow Codecov: hits / (hits+partials+misses)
		let _totalChanged = 0,
			totalHits = 0,
			totalPartials = 0,
			totalMisses = 0;
		for (const r of Object.values(report.files)) {
			_totalChanged += r.total;
			totalHits += r.hits;
			totalPartials += r.partials;
			totalMisses += r.misses;
		}
		const denom = totalHits + totalPartials + totalMisses;
		const ratio = denom === 0 ? 1 : totalHits / denom;
		const pct = Math.round(ratio * 100);
		console.log(
			`\nPatch coverage: ${pct}% (${totalHits} hits / ${denom} lines)`,
		);
		if (pct < opts.threshold) {
			console.error(`Patch coverage ${pct}% < threshold ${opts.threshold}%`);
			process.exit(3);
		}
	}
}

// Exports for unit testing
export {
	parseLCOV,
	computePatchReportFromStrings,
	classifyLine,
	parseGitDiffRanges,
};
