#!/usr/bin/env node

/**
 * Extract all external links from markdown files
 *
 * This script scans all markdown files in the repository and extracts
 * external links (http/https URLs) for review and validation.
 *
 * Usage:
 *   npm run links:extract
 *   npm run links:extract -- --format=json
 *   npm run links:extract -- --format=csv
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

// Configuration
const REPO_ROOT = join(__dirname, "..");
const EXCLUDED_DIRS = ["node_modules", "dist", "coverage", "build", ".git"];

// Parse command line arguments
const args = process.argv.slice(2);
const format =
	args.find((arg) => arg.startsWith("--format="))?.split("=")[1] || "table";
const outputFile = args
	.find((arg) => arg.startsWith("--output="))
	?.split("=")[1];

/**
 * Find all markdown files in directory recursively
 */
function findMarkdownFiles(dir, files = []) {
	const entries = readdirSync(dir);

	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			if (!EXCLUDED_DIRS.includes(entry)) {
				findMarkdownFiles(fullPath, files);
			}
		} else if (entry.endsWith(".md")) {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * Extract external links from markdown content
 *
 * Matches:
 * - [text](http://example.com)
 * - [text](https://example.com)
 * - <http://example.com>
 * - <https://example.com>
 * - Bare URLs: http://example.com or https://example.com
 */
function extractExternalLinks(content, filePath) {
	const links = [];

	// Markdown link pattern: [text](url)
	const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

	for (const match of content.matchAll(markdownLinkPattern)) {
		links.push({
			url: match[2],
			text: match[1],
			file: filePath,
			type: "markdown",
		});
	}

	// Angle bracket links: <url>
	const angleBracketPattern = /<(https?:\/\/[^>]+)>/g;

	for (const match of content.matchAll(angleBracketPattern)) {
		links.push({
			url: match[1],
			text: match[1],
			file: filePath,
			type: "angle-bracket",
		});
	}

	// Bare URLs (not in markdown links or angle brackets)
	// Negative lookbehind to exclude already matched patterns
	const bareUrlPattern = /(?<!\]\()(?<!<)(https?:\/\/[^\s)<>]+)/g;
	const alreadyMatched = new Set(links.map((l) => l.url));

	for (const match of content.matchAll(bareUrlPattern)) {
		const url = match[1];
		if (!alreadyMatched.has(url)) {
			links.push({
				url,
				text: url,
				file: filePath,
				type: "bare",
			});
			alreadyMatched.add(url);
		}
	}

	return links;
}

/**
 * Group links by domain
 */
function groupByDomain(links) {
	const grouped = {};

	for (const link of links) {
		try {
			const url = new URL(link.url);
			const domain = url.hostname;

			if (!grouped[domain]) {
				grouped[domain] = [];
			}

			grouped[domain].push(link);
		} catch (_error) {
			// Invalid URL, create 'invalid' group
			if (!grouped._invalid) {
				grouped._invalid = [];
			}
			grouped._invalid.push(link);
		}
	}

	return grouped;
}

/**
 * Output as table
 */
function outputTable(links) {
	console.log("\n=== External Links Found ===\n");

	const grouped = groupByDomain(links);
	const domains = Object.keys(grouped).sort();

	for (const domain of domains) {
		console.log(`\n📍 ${domain} (${grouped[domain].length} links)`);
		console.log("─".repeat(80));

		for (const link of grouped[domain]) {
			const relPath = relative(REPO_ROOT, link.file);
			console.log(`  ${link.url}`);
			console.log(`    📄 ${relPath}`);
			if (link.text !== link.url) {
				console.log(`    📝 "${link.text}"`);
			}
			console.log();
		}
	}

	console.log(`\n📊 Summary:`);
	console.log(`   Total links: ${links.length}`);
	console.log(`   Unique domains: ${domains.length}`);
	console.log();
}

/**
 * Output as JSON
 */
function outputJSON(links) {
	const output = {
		summary: {
			totalLinks: links.length,
			uniqueDomains: Object.keys(groupByDomain(links)).length,
			generatedAt: new Date().toISOString(),
		},
		byDomain: groupByDomain(links),
		allLinks: links.map((link) => ({
			...link,
			file: relative(REPO_ROOT, link.file),
		})),
	};

	console.log(JSON.stringify(output, null, 2));
}

/**
 * Output as CSV
 */
function outputCSV(links) {
	console.log("URL,Text,File,Type,Domain");

	for (const link of links) {
		const relPath = relative(REPO_ROOT, link.file);
		let domain = "";

		try {
			domain = new URL(link.url).hostname;
		} catch (_e) {
			domain = "invalid";
		} // Escape CSV fields
		const csvEscape = (str) => `"${str.replace(/"/g, '""')}"`;

		console.log(
			[
				csvEscape(link.url),
				csvEscape(link.text),
				csvEscape(relPath),
				link.type,
				domain,
			].join(","),
		);
	}
}

/**
 * Output as markdown
 */
function outputMarkdown(links) {
	console.log("# External Links Report\n");
	console.log(`Generated: ${new Date().toISOString()}\n`);

	const grouped = groupByDomain(links);
	const domains = Object.keys(grouped).sort();

	console.log("## Summary\n");
	console.log(`- **Total Links**: ${links.length}`);
	console.log(`- **Unique Domains**: ${domains.length}\n`);

	console.log("## Links by Domain\n");

	for (const domain of domains) {
		console.log(`### ${domain}\n`);
		console.log(`${grouped[domain].length} links found\n`);

		for (const link of grouped[domain]) {
			const relPath = relative(REPO_ROOT, link.file);
			console.log(`- [${link.text}](${link.url})`);
			console.log(`  - File: \`${relPath}\``);
			console.log();
		}
	}
}

/**
 * Main execution
 */
function main() {
	console.error("🔍 Scanning for markdown files...");
	const markdownFiles = findMarkdownFiles(REPO_ROOT);
	console.error(`   Found ${markdownFiles.length} markdown files\n`);

	console.error("🔗 Extracting external links...");
	const allLinks = [];

	for (const file of markdownFiles) {
		const content = readFileSync(file, "utf-8");
		const links = extractExternalLinks(content, file);
		allLinks.push(...links);
	}

	console.error(`   Found ${allLinks.length} external links\n`);

	// Output based on format
	switch (format) {
		case "json":
			outputJSON(allLinks);
			break;
		case "csv":
			outputCSV(allLinks);
			break;
		case "markdown":
		case "md":
			outputMarkdown(allLinks);
			break;
		default:
			outputTable(allLinks);
			break;
	} // Write to file if specified
	if (outputFile) {
		console.error(`\n💾 Output also written to: ${outputFile}`);
	}
}

main();
