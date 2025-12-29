#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";

// Use parseLCOV/getFileSnippet helpers from coverage-patch.mjs to compute per-file branch diagnostics
import { getFileSnippet, parseLCOV } from "./coverage-patch.mjs";

const argv = process.argv.slice(2);
const opts = { lcov: "coverage/lcov.info", threshold: 90, top: 10 };
for (let i = 0; i < argv.length; i++) {
	const a = argv[i];
	if (a === "--lcov") opts.lcov = argv[++i];
	else if (a === "--threshold") opts.threshold = Number(argv[++i]);
	else if (a === "--top") opts.top = Number(argv[++i]);
}

try {
	const txt = readFileSync(opts.lcov, "utf8");
	const lcov = parseLCOV(txt);
	let totalBranches = 0;
	let coveredBranches = 0;
	const perFile = [];
	for (const [file, data] of Object.entries(lcov)) {
		let fileTotal = 0;
		let fileCovered = 0;
		const missingLines = [];
		for (const [lnStr, brs] of Object.entries(data.branches || {})) {
			const ln = Number(lnStr);
			for (const t of brs) {
				fileTotal++;
				if (t !== null && t !== 0) fileCovered++;
			}
			if (brs.some((t) => t === null || t === 0))
				missingLines.push({ line: ln, branches: brs });
		}
		if (fileTotal > 0) {
			totalBranches += fileTotal;
			coveredBranches += fileCovered;
			perFile.push({
				file,
				total: fileTotal,
				covered: fileCovered,
				missingLines,
			});
		}
	}

	const globalPct =
		totalBranches === 0
			? 100
			: Math.round((coveredBranches / totalBranches) * 100);
	console.log(
		`Branch coverage: ${globalPct}% (${coveredBranches}/${totalBranches} branches)`,
	);

	if (globalPct < opts.threshold) {
		console.error(
			`Branch coverage ${globalPct}% < threshold ${opts.threshold}%.`,
		);
	}

	// Show top files with most missing branches
	perFile.sort((a, b) => b.missingLines.length - a.missingLines.length);
	const top = perFile.slice(0, opts.top);
	if (top.length) {
		console.log(
			`\nTop ${Math.min(opts.top, top.length)} files with missing branches:`,
		);
		for (const f of top) {
			console.log(
				`\n${f.file} — ${f.missingLines.length} lines with missing branches (${f.covered}/${f.total} branches covered)`,
			);
			for (const ml of f.missingLines.slice(0, 5)) {
				const snippet = getFileSnippet(
					path.resolve(ml.file || f.file),
					ml.line,
					2,
				);
				console.log(`  Line ${ml.line}: branches=${JSON.stringify(ml.branches)}
${snippet ? snippet.split("\n")[0] : "(no snippet)"}\n`);
			}
		}
	}

	if (globalPct < opts.threshold) process.exit(2);
	process.exit(0);
} catch (err) {
	console.error("Failed to read lcov file:", err.message);
	process.exit(3);
}
