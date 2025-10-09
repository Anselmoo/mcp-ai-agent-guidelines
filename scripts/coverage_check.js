import fs from "fs";
import path from "path";

function findCoverageJson() {
	const cwd = process.cwd();
	const candidates = [
		"coverage/coverage-final.json",
		"coverage/coverage-summary.json",
		"coverage/v8-to-istanbul/coverage-final.json",
		"coverage/lcov-report/coverage-summary.json",
	];
	for (const rel of candidates) {
		const p = path.join(cwd, rel);
		if (fs.existsSync(p)) return p;
	}
	return null;
}

function parseAndWrite(found) {
	const raw = fs.readFileSync(found, "utf8");
	let data;
	try {
		data = JSON.parse(raw);
	} catch (err) {
		console.error("Failed to parse coverage JSON:", err.message);
		process.exitCode = 2;
		return;
	}

	const entries = [];

	// coverage-final.json format: file -> { statements: { pct }, lines: { pct }, functions: { pct }, branches: { pct } }
	// coverage-summary.json format: similar but usually { "file": { statements: { pct: x }, ... }, "total": {...} }

	if (
		"total" in data ||
		Object.values(data).some(
			(v) => v?.statements && typeof v.statements.pct === "number",
		)
	) {
		for (const [file, obj] of Object.entries(data)) {
			if (file === "total") continue;
			const s = obj?.statements?.pct ?? obj?.lines?.pct ?? 0;
			const l = obj?.lines?.pct ?? 0;
			const f = obj?.functions?.pct ?? 0;
			const b = obj?.branches?.pct ?? 0;
			entries.push({
				file,
				stat: s || 0,
				lines: l || 0,
				funcs: f || 0,
				branches: b || 0,
			});
		}
	} else {
		// Fallback: if structure is different, try to iterate top-level keys
		for (const [file, obj] of Object.entries(data)) {
			if (file === "total") continue;
			const s =
				typeof obj?.statements?.pct === "number" ? obj.statements.pct : 0;
			const l = typeof obj?.lines?.pct === "number" ? obj.lines.pct : 0;
			const f = typeof obj?.functions?.pct === "number" ? obj.functions.pct : 0;
			const b = typeof obj?.branches?.pct === "number" ? obj.branches.pct : 0;
			entries.push({ file, stat: s, lines: l, funcs: f, branches: b });
		}
	}

	entries.sort((a, b) => a.stat - b.stat);

	const outLines = entries
		.slice(0, 50)
		.map(
			(e) =>
				`${e.stat.toFixed(1)}%\t${e.lines.toFixed(1)}%\t${e.funcs.toFixed(1)}%\t${e.branches.toFixed(1)}%\t${e.file}`,
		);

	const outDir = path.join(process.cwd(), "coverage");
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
	const outPath = path.join(outDir, "low-coverage.txt");
	fs.writeFileSync(outPath, outLines.join("\n"));
	console.log(`Wrote low-coverage summary to ${outPath}`);
}

const found = findCoverageJson();
if (!found) {
	console.error(
		"No coverage JSON found. Ensure vitest wrote coverage into the coverage/ directory.",
	);
	process.exitCode = 1;
} else {
	parseAndWrite(found);
}
