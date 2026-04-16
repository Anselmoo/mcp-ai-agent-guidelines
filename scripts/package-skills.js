#!/usr/bin/env node
/**
 * Simple wrapper to package canonical src/skills/ modules (or an explicitly
 * provided legacy SKILL.md folder) using the
 * canonical Python packager (package_skills.py).
 *
 * Usage:
 *   node package-skills.js            # packages all canonical skills → dist/
 *   node package-skills.js <skilldir> # packages specific skill → dist/
 *   node package-skills.js <outdir>   # packages all canonical skills → outdir/
 *
 * The Python script now defaults to packing all canonical skill modules under
 * src/skills into .skill archives.
 */

const path = require("path");
const { spawnSync } = require("child_process");

const scriptPath = path.join(__dirname, "package_skills.py");
const args = process.argv.slice(2);

let python = "python3";
let result = spawnSync(python, [scriptPath, ...args], { stdio: "inherit" });
if (result.error && result.error.code === "ENOENT") {
	python = "python";
	result = spawnSync(python, [scriptPath, ...args], { stdio: "inherit" });
}

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

process.exit(result.status ?? 0);
