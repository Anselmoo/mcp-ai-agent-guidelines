#!/usr/bin/env node
// Simple utility: parse coverage/lcov.info and print a table of file coverage for files under src/
const fs = require("node:fs");
const path = require("node:path");

const lcovPath = path.resolve(process.cwd(), "coverage", "lcov.info");
if (!fs.existsSync(lcovPath)) {
	console.error(
		"coverage/lcov.info not found. Run the coverage command first (npm run test:coverage:vitest)",
	);
	process.exit(1);
}

const lcov = fs.readFileSync(lcovPath, "utf8");
const blocks = lcov.split("\n\n");

const entries = [];
for (const block of blocks) {
	const lines = block.split("\n");
	const fileLine = lines.find((l) => l.startsWith("SF:"));
	if (!fileLine) continue;
	const file = fileLine.slice(3);
	// Only include src/ files (handle absolute, relative and windows paths)
	if (!/(^|[\\/])src([\\/]|$)/.test(file)) continue;

	const lhLine = lines.find((l) => l.startsWith("LH:"));
	const lfLine = lines.find((l) => l.startsWith("LF:"));
	let percent = 0;
	let executed = 0;
	let total = 0;
	if (lhLine && lfLine) {
		executed = parseInt(lhLine.slice(3), 10);
		total = parseInt(lfLine.slice(3), 10);
		percent = total === 0 ? 100 : Math.round((executed / total) * 10000) / 100;
	} else {
		// fallback: count DA entries
		const da = lines.filter((l) => l.startsWith("DA:"));
		for (const d of da) {
			const parts = d.slice(3).split(",");
			const hits = parseInt(parts[1] || "0", 10);
			total++;
			if (hits > 0) executed++;
		}
		percent = total === 0 ? 100 : Math.round((executed / total) * 10000) / 100;
	}

	entries.push({
		file: path.relative(process.cwd(), file),
		percent,
		executed,
		total,
	});
}

entries.sort((a, b) => a.percent - b.percent || a.file.localeCompare(b.file));

const outLines = [];
outLines.push("Coverage by file (src/ only)");
outLines.push("=".repeat(80));
const header = ["%".padEnd(6), "Executed/Total".padEnd(16), "File"];
outLines.push(header.join(" | "));
outLines.push("-".repeat(80));
for (const e of entries) {
	const pct = String(e.percent).padEnd(6);
	const ratio = `${e.executed}/${e.total}`.padEnd(16);
	outLines.push(`${pct} | ${ratio} | ${e.file}`);
}

const out = outLines.join("\n");
console.log(out);

// write to coverage/file-coverage.log
const outPath = path.resolve(process.cwd(), "coverage", "file-coverage.log");
fs.writeFileSync(outPath, out, "utf8");
console.log(`\nWrote ${outPath}`);
