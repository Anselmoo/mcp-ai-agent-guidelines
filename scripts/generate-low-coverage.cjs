// Generates coverage/low-coverage.txt from coverage/lcov.info
// Keeps only files under src/ and sorts by lowest line coverage first.
const fs = require("fs");
const path = require("path");
const lcovPath = path.resolve(__dirname, "../coverage/lcov.info");
const outPath = path.resolve(__dirname, "../coverage/low-coverage.txt");
if (!fs.existsSync(lcovPath)) {
	console.error("No coverage/lcov.info found. Run tests with coverage first.");
	process.exit(1);
}
const lp = fs.readFileSync(lcovPath, "utf8");
const files = {};
let current = null;
for (const line of lp.split("\n")) {
	if (line.startsWith("SF:")) {
		current = line.slice(3).trim();
		files[current] = {
			lines: { found: 0, hit: 0 },
			functions: { found: 0, hit: 0 },
			branches: { found: 0, hit: 0 },
		};
	} else if (!current) {
	} else if (line.startsWith("LF:")) {
		files[current].lines.found = parseInt(line.slice(3), 10) || 0;
	} else if (line.startsWith("LH:")) {
		files[current].lines.hit = parseInt(line.slice(3), 10) || 0;
	} else if (line.startsWith("FNF:")) {
		files[current].functions.found = parseInt(line.slice(4), 10) || 0;
	} else if (line.startsWith("FNH:")) {
		files[current].functions.hit = parseInt(line.slice(4), 10) || 0;
	} else if (line.startsWith("BRF:")) {
		files[current].branches.found = parseInt(line.slice(4), 10) || 0;
	} else if (line.startsWith("BRH:")) {
		files[current].branches.hit = parseInt(line.slice(4), 10) || 0;
	}
}
const arr = Object.entries(files)
	.map(([f, d]) => {
		const pct = d.lines.found ? (d.lines.hit / d.lines.found) * 100 : 100;
		return {
			file: f,
			linesPct: pct,
			linesFound: d.lines.found,
			linesHit: d.lines.hit,
			functionsPct: d.functions.found
				? (d.functions.hit / d.functions.found) * 100
				: 100,
		};
	})
	// restrict to repository source files (src/) and ignore vendor or build files
	.filter((x) => x.file.includes("/src/") || x.file.startsWith("src/"))
	.sort((a, b) => a.linesPct - b.linesPct);
const top = arr.slice(0, 80);
const out = top
	.map(
		(x) =>
			`${x.linesPct.toFixed(1)}%\t${x.linesHit}/${x.linesFound}\t${x.file}`,
	)
	.join("\n");
fs.writeFileSync(outPath, out);
console.log(out);
