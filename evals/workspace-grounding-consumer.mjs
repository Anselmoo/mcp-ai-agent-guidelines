#!/usr/bin/env node
// Headless / non-LLM consumer of `groundingScope: "workspace"` — issue #1602.
//
// Unlike scripts/ab_eval.py (which shells out to a real `claude -p` session),
// this program has NO model, NO sampler, NO LLM anywhere. It points the REAL
// filesystem surface `createWorkspaceSurface()` at a checked-in fixture, runs a
// real skill, and asserts the resulting workspace-grounded findings cite file
// paths that actually resolve on disk. It exits non-zero if grounding produced
// nothing citing a real file, so it is a genuine gate, not a demo.
//
// Prerequisite: `npm run build` (imports the compiled skill from dist/).
// Run:          node evals/workspace-grounding-consumer.mjs

import { stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evalsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(evalsDir, "..");
const distSkill = join(repoRoot, "dist/skills/qual/qual-code-analysis.js");
const distWorkspace = join(
	repoRoot,
	"dist/skills/runtime/workspace-adapter.js",
);

async function loadDist() {
	try {
		const [{ skillModule }, { createWorkspaceSurface }] = await Promise.all([
			import(distSkill),
			import(distWorkspace),
		]);
		return { skillModule, createWorkspaceSurface };
	} catch (error) {
		console.error(
			"✖ Could not import compiled output. Run `npm run build` first.\n ",
			error instanceof Error ? error.message : String(error),
		);
		process.exit(2);
	}
}

// Minimal non-LLM runtime: a deterministic model router (no network, no model
// call) plus the real workspace reader. Mirrors what the MCP server injects.
function createHeadlessRuntime(workspace) {
	return {
		modelRouter: {
			chooseSkillModel: (manifest) => ({
				id: "headless-eval",
				label: "Headless Eval (no model)",
				modelClass: manifest.preferredModelClass,
				strengths: ["deterministic grounding"],
				maxContextWindow: "medium",
				costTier: manifest.preferredModelClass,
			}),
		},
		workspace,
	};
}

async function main() {
	const { skillModule, createWorkspaceSurface } = await loadDist();

	const fixtureRoot = join(evalsDir, "fixtures");
	const referencedFile = "src/payments/charge.ts";

	const reader = createWorkspaceSurface(fixtureRoot);
	const runtime = createHeadlessRuntime(reader);

	const result = await skillModule.run(
		{ request: `review ${referencedFile} for quality problems` },
		runtime,
	);

	const grounded = result.recommendations.filter(
		(r) => r.groundingScope === "workspace",
	);

	// Verify every cited path resolves on disk — no model asserted it exists.
	const findings = [];
	for (const rec of grounded) {
		for (const anchor of rec.evidenceAnchors ?? []) {
			let existsOnDisk = false;
			try {
				existsOnDisk = (await stat(join(fixtureRoot, anchor))).isFile();
			} catch {
				existsOnDisk = false;
			}
			findings.push({ detail: rec.detail, citedPath: anchor, existsOnDisk });
		}
	}

	const citingRealFiles = findings.filter((f) => f.existsOnDisk);
	const report = {
		question:
			"Does a non-LLM consumer get workspace-grounded findings that cite real files?",
		method:
			"Real createWorkspaceSurface() over evals/fixtures; qual-code-analysis skill; no sampler, no model.",
		skill: skillModule.manifest.id,
		referencedFile,
		groundedFindingCount: grounded.length,
		findings,
		citingRealFileCount: citingRealFiles.length,
		pass: citingRealFiles.length > 0,
	};

	const outPath = join(evalsDir, "workspace-grounding-results.json");
	await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

	console.log(`\nHeadless workspace-grounding consumer (#1602)`);
	console.log(`  skill:            ${report.skill}`);
	console.log(`  referenced file:  ${report.referencedFile}`);
	console.log(`  grounded findings: ${report.groundedFindingCount}`);
	console.log(`  citing real files: ${report.citingRealFileCount}`);
	for (const f of findings) {
		console.log(
			`   ${f.existsOnDisk ? "✓" : "✗"} ${f.citedPath}  —  ${f.detail}`,
		);
	}
	console.log(`  report: ${outPath}`);
	console.log(`  result: ${report.pass ? "PASS" : "FAIL"}\n`);

	if (!report.pass) {
		console.error(
			"✖ No workspace-grounded finding cited a real on-disk file — the headless-consumer justification would be speculative.",
		);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
