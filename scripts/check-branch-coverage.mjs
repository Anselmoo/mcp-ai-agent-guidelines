#!/usr/bin/env node
import { readFileSync } from "node:fs";

function parseLCOVForBranches(lcovText) {
	const lines = lcovText.split(/\r?\n/);
	let total = 0;
	let covered = 0;
	for (const line of lines) {
		if (!line) continue;
		if (line.startsWith("BRDA:")) {
			total++;
			const [, rest] = line.split("BRDA:");
			const parts = rest.split(",");
			const taken = parts[3];
			if (taken && taken !== "0" && taken !== "-") covered++;
		}
	}
	return { total, covered };
}

const argv = process.argv.slice(2);
const opts = { lcov: "coverage/lcov.info", threshold: 90 };
for (let i = 0; i < argv.length; i++) {
	const a = argv[i];
	if (a === "--lcov") opts.lcov = argv[++i];
	else if (a === "--threshold") opts.threshold = Number(argv[++i]);
}

try {
	const txt = readFileSync(opts.lcov, "utf8");
	const { total, covered } = parseLCOVForBranches(txt);
	const pct = total === 0 ? 100 : Math.round((covered / total) * 100);
	console.log(`Branch coverage: ${pct}% (${covered}/${total} branches)`);
	if (pct < opts.threshold) {
		console.error(`Branch coverage ${pct}% < threshold ${opts.threshold}%.`);
		process.exit(2);
	}
	process.exit(0);
} catch (err) {
	console.error("Failed to read lcov file:", err.message);
	process.exit(3);
}
