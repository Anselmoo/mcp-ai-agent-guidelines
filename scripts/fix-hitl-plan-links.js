#!/usr/bin/env node

import { promises as fs } from "node:fs";
import { join, posix, resolve } from "node:path";

const PLAN_ROOT = "plan-v0.14.x";

const args = process.argv.slice(2);
const writeChanges = args.includes("--write");
const verbose = args.includes("--verbose");

const rootDir = resolve(process.cwd());
const planRootDir = resolve(rootDir, PLAN_ROOT);

function isExternalLink(link) {
	return /^(?:https?:|mailto:|tel:|#)/i.test(link);
}

function splitLink(link) {
	const hashIndex = link.indexOf("#");
	if (hashIndex === -1) {
		return { path: link, hash: "" };
	}
	return {
		path: link.slice(0, hashIndex),
		hash: link.slice(hashIndex),
	};
}

function toRepoPath(filePath) {
	const normalized = filePath.replace(/\\/g, "/");
	return normalized.startsWith("/") ? normalized.slice(1) : normalized;
}

function resolveRepoLink(link, sourcePath) {
	if (!link) return link;
	if (isExternalLink(link)) return link;
	const trimmed = link.trim();
	if (!trimmed) return link;

	const { path: linkPath, hash } = splitLink(trimmed);
	if (!linkPath) return link;

	const repoPath = toRepoPath(sourcePath);
	if (!repoPath) return link;

	if (linkPath.startsWith("/")) {
		return `${linkPath}${hash}`;
	}

	const baseDir = posix.dirname(repoPath);
	const resolved = posix.normalize(posix.join(baseDir, linkPath));
	return `/${resolved}${hash}`;
}

function shouldRewrite(resolvedPath) {
	if (!resolvedPath.startsWith("/")) return false;
	return resolvedPath.startsWith(`/${PLAN_ROOT}/`);
}

function rewriteMarkdownLinks(text, sourcePath) {
	let changed = false;
	const segments = text.split(/(```[\s\S]*?```)/g);
	const updated = segments
		.map((segment) => {
			if (segment.startsWith("```")) {
				return segment;
			}
			return segment.replace(
				/\[([^\]]+)\]\(([^)]+)\)/g,
				(match, label, link) => {
					const resolved = resolveRepoLink(link, sourcePath);
					if (resolved === link) return match;
					if (!shouldRewrite(resolved)) return match;
					changed = true;
					return `[${label}](${resolved})`;
				},
			);
		})
		.join("");
	return { text: updated, changed };
}

async function listMarkdownFiles(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const results = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			const nested = await listMarkdownFiles(fullPath);
			results.push(...nested);
			continue;
		}
		if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
			results.push(fullPath);
		}
	}

	return results;
}

async function processFile(filePath) {
	const content = await fs.readFile(filePath, "utf-8");
	const repoPath = toRepoPath(
		path.relative(rootDir, filePath).replace(/\\/g, "/"),
	);
	const { text, changed } = rewriteMarkdownLinks(content, repoPath);

	if (!changed) {
		return { filePath, changed: false };
	}

	if (writeChanges) {
		await fs.writeFile(filePath, text, "utf-8");
	}

	return { filePath, changed: true };
}

async function main() {
	const targetDir = resolve(planRootDir);
	try {
		await fs.access(targetDir);
	} catch {
		console.error(`Plan directory not found: ${targetDir}`);
		process.exit(1);
	}

	const files = await listMarkdownFiles(targetDir);
	const results = [];

	for (const filePath of files) {
		const result = await processFile(filePath);
		if (result.changed || verbose) {
			results.push(result);
		}
	}

	const changedCount = results.filter((item) => item.changed).length;
	const mode = writeChanges ? "updated" : "would update";
	console.log(`Found ${files.length} markdown files. ${mode} ${changedCount}.`);

	for (const result of results) {
		const status = result.changed ? "UPDATED" : "SKIPPED";
		console.log(`${status}: ${result.filePath}`);
	}

	if (!writeChanges) {
		console.log("\nRun with --write to apply changes.");
	}
}

main().catch((error) => {
	console.error(error?.message ?? String(error));
	process.exit(1);
});
