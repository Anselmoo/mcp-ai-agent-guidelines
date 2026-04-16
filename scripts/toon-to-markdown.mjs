#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { toonToMarkdown } from "../dist/snapshots/toon_markdown.js";

function parseCliArgs(argv) {
	const positional = [];
	let title;

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--title") {
			title = argv[i + 1];
			i += 1;
			continue;
		}
		positional.push(arg);
	}

	return {
		inputFile: positional[0],
		outputFile: positional[1],
		title,
	};
}

export function runCli(argv = process.argv.slice(2)) {
	const { inputFile, outputFile, title } = parseCliArgs(argv);

	if (!inputFile) {
		console.error(
			'Usage: npm run toon:markdown -- <input.toon> [output.md] [--title "My Title"]',
		);
		return 1;
	}

	const toonContent = readFileSync(resolve(inputFile), "utf8");
	const derivedTitle = title ?? basename(inputFile).replace(/\.toon$/i, "");
	const markdown = toonToMarkdown(toonContent, derivedTitle);

	if (outputFile) {
		writeFileSync(resolve(outputFile), markdown, "utf8");
		console.log(`✅ Written to ${outputFile}`);
	} else {
		process.stdout.write(markdown);
	}

	return 0;
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? "")).href) {
	process.exitCode = runCli();
}
