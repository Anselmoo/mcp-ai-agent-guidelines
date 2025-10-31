const fs = require("node:fs");
const path = require("node:path");
const lcovPath = path.resolve(__dirname, "..", "coverage", "lcov.info");
if (!fs.existsSync(lcovPath)) {
	console.error("coverage/lcov.info not found");
	process.exit(1);
}
const data = fs.readFileSync(lcovPath, "utf8");
const records = data.split("\nend_of_record\n").filter(Boolean);
const out = [];
for (const r of records) {
	const m = r.match(/^SF:(.*)$/m);
	if (!m) continue;
	const sf = m[1].trim();
	if (!sf.startsWith("src/")) continue;
	const lfM = r.match(/^LF:(\d+)$/m);
	const lhM = r.match(/^LH:(\d+)$/m);
	const lf = lfM ? Number(lfM[1]) : 0;
	const lh = lhM ? Number(lhM[1]) : 0;
	const pct = lf > 0 ? +((lh / lf) * 100).toFixed(2) : 0;
	out.push({ file: sf, hit: lh, total: lf, pct });
}
out.sort((a, b) => a.pct - b.pct || a.file.localeCompare(b.file));
const csvPath = path.resolve(__dirname, "..", "coverage", "src_coverage.csv");
fs.writeFileSync(
	csvPath,
	out.map((o) => `${o.file},${o.hit},${o.total},${o.pct}`).join("\n"),
);
console.log("Wrote", csvPath);
console.log("Total src files:", out.length);
if (out.length > 0) {
	const avg = out.reduce((s, x) => s + x.pct, 0) / out.length;
	console.log("Average coverage (%):", avg.toFixed(2));
	const below90 = out.filter((x) => x.pct < 90);
	console.log("Files below 90%:", below90.length);
	console.log("\n20 lowest coverage files:");
	below90.slice(0, 20).forEach((f, i) => {
		console.log(`${i + 1}. ${f.file} — ${f.pct}% (${f.hit}/${f.total})`);
	});
}
