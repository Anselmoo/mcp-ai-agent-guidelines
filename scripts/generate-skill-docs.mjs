#!/usr/bin/env node
/**
 * generate-skill-docs.mjs
 *
 * Generates one Markdown reference page per skill from the compiled skill manifests.
 * Output: docs/src/content/docs/skills/reference/<id>.md  (104 files)
 *
 * Usage:
 *   npm run build               # ensure dist/ is current
 *   node scripts/generate-skill-docs.mjs
 *
 * Or via npm script:
 *   npm run generate:skill-docs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Import compiled manifests (requires `npm run build` first)
let SKILL_MANIFESTS;
try {
	({ SKILL_MANIFESTS } = await import(
		`${ROOT}/dist/generated/manifests/skill-manifests.js`
	));
} catch {
	console.error(
		"ERROR: dist/generated/manifests/skill-manifests.js not found.\n" +
			"Run `npm run build` first, then re-run this script.",
	);
	process.exit(1);
}

const OUT_DIR = resolve(ROOT, "docs/src/content/docs/skills/reference");
mkdirSync(OUT_DIR, { recursive: true });

// Sidebar badge variants per model class
const BADGE_VARIANT = {
	free: "success",
	cheap: "caution",
	strong: "danger",
	reviewer: "note",
};

// Human-readable display names for model class badges
const BADGE_TEXT = {
	free: "Zero-Cost",
	cheap: "Efficient",
	strong: "Advanced",
	reviewer: "Cross-Model",
};

// Map skill domain prefix → domain page slug under /skills/
const DOMAIN_SLUG = {
	adapt: "adaptive",
	arch: "architecture",
	bench: "benchmarking",
	debug: "debugging",
	doc: "documentation",
	eval: "evaluation",
	flow: "workflows",
	gov: "governance",
	gr: "physics-gr",
	lead: "leadership",
	orch: "orchestration",
	prompt: "prompting",
	qm: "physics-qm",
	qual: "quality",
	req: "requirements",
	resil: "resilience",
	strat: "strategy",
	synth: "research",
};

const BASE = "/mcp-ai-agent-guidelines";

/** Escape a string for use as a YAML double-quoted scalar.
 *  Truncate FIRST (on raw text), then escape — so we never cut through an escape sequence.
 */
function yamlStr(s, maxLen = 160) {
	return (s ?? "")
		.replace(/\n/g, " ")
		.slice(0, maxLen)
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"');
}

/** Format a skill ID as a relative markdown link to its reference page. */
function skillLink(id) {
	return `[${id}](${BASE}/skills/reference/${id}/)`;
}

function generatePage(manifest) {
	const {
		id,
		domain,
		description,
		purpose,
		triggerPhrases = [],
		antiTriggerPhrases = [],
		intakeQuestions = [],
		relatedSkills = [],
		outputContract = [],
		preferredModelClass,
	} = manifest;

	const modelClass = preferredModelClass ?? "free";
	const variant = BADGE_VARIANT[modelClass] ?? "note";
	const badgeText = BADGE_TEXT[modelClass] ?? modelClass;
	const domainSlug = DOMAIN_SLUG[domain] ?? domain;

	const triggerList =
		triggerPhrases.length > 0
			? triggerPhrases.map((t) => `- "${t}"`).join("\n")
			: "_None defined._";

	const antiList =
		antiTriggerPhrases.length > 0
			? antiTriggerPhrases.map((t) => `- ${t}`).join("\n")
			: "_None defined._";

	const questionList =
		intakeQuestions.length > 0
			? intakeQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
			: "_None defined._";

	const outputList =
		outputContract.length > 0
			? outputContract.map((o) => `- ${o}`).join("\n")
			: "_Not specified._";

	const relatedLinks =
		relatedSkills.length > 0
			? relatedSkills.map(skillLink).join(" · ")
			: "_None_";

	const purposeBlock = purpose ? `\n## Purpose\n\n${purpose}\n` : "";

	return `---
title: "${yamlStr(id)}"
description: "${yamlStr(description)}"
sidebar:
  label: "${yamlStr(id)}"
  badge:
    text: "${badgeText}"
    variant: "${variant}"
---

**Domain:** [\`${domain}\`](${BASE}/skills/${domainSlug}/) · **Model class:** \`${modelClass}\`

## Description

${description ?? "_No description available._"}
${purposeBlock}
## Trigger Phrases

${triggerList}

## Anti-Triggers

${antiList}

## Intake Questions

${questionList}

## Output Contract

${outputList}

## Related Skills

${relatedLinks}
`;
}

let count = 0;
for (const manifest of SKILL_MANIFESTS) {
	const content = generatePage(manifest);
	writeFileSync(resolve(OUT_DIR, `${manifest.id}.md`), content, "utf8");
	count++;
}

console.log(
	`✓ Generated ${count} skill reference pages → docs/src/content/docs/skills/reference/`,
);
