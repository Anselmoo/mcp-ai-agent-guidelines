#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function usage() {
	console.log("Usage: node scripts/check-coverage.js [--threshold=NUM]");
	console.log(
		"Reads coverage/lcov.info and fails if any file is below the threshold (percentage).",
	);
}

const argv = process.argv.slice(2);
let threshold = 90;
for (const a of argv) {
	if (a.startsWith("--threshold=")) threshold = parseFloat(a.split("=")[1]);
	if (a === "--help" || a === "-h") {
		usage();
		process.exit(0);
	}
}
if (Number.isNaN(threshold)) {
	console.error("Invalid threshold");
	process.exit(2);
}

const lcovPath = path.resolve(process.cwd(), "coverage", "lcov.info");
if (!fs.existsSync(lcovPath)) {
	console.error(
		"coverage/lcov.info not found. Run coverage first (npm run test:coverage:vitest).",
	);
	process.exit(2);
}

const content = fs.readFileSync(lcovPath, "utf8");
const lines = content.split("\n");

const results = [];
let currentFile = null;
let lf = null;
let lh = null;

for (const line of lines) {
	if (line.startsWith("SF:")) {
		if (currentFile) {
			results.push({ file: currentFile, lf, lh });
		}
		currentFile = line.slice(3).trim();
		lf = null;
		lh = null;
	} else if (line.startsWith("LF:")) {
		lf = parseInt(line.slice(3).trim(), 10);
	} else if (line.startsWith("LH:")) {
		lh = parseInt(line.slice(3).trim(), 10);
	}
}
if (currentFile) results.push({ file: currentFile, lf, lh });

const failing = [];
for (const r of results) {
	const { file } = r;
	if (r.lf == null || r.lh == null) {
		failing.push({ file, pct: "NA", lf: r.lf, lh: r.lh });
		continue;
	}
	const pct = (r.lh / r.lf) * 100;
	if (pct < threshold)
		failing.push({ file, pct: pct.toFixed(2), lf: r.lf, lh: r.lh });
}

if (failing.length === 0) {
	console.log(`All files meet the coverage threshold of ${threshold}%`);
	process.exit(0);
}

console.log(`Files below coverage threshold (${threshold}%):`);
for (const f of failing) {
	console.log(`${f.file} — ${f.pct}% (LH:${f.lh || "NA"}/LF:${f.lf || "NA"})`);
}
process.exit(1);
