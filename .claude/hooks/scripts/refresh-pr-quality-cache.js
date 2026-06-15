#!/usr/bin/env node
/**
 * mcp-ai-agent-guidelines — PR Quality Cache Refresher
 *
 * Fetches the current state of a PR's review threads and Codecov coverage
 * report, then writes a local cache file consumed by the pr-quality-gate hook.
 *
 * Usage:
 *   node .github/hooks/scripts/refresh-pr-quality-cache.js <pr-number>
 *
 * Requires:
 *   GITHUB_TOKEN env var (read:pull_request scope)
 *   GITHUB_REPO  env var in "owner/repo" format
 *               (defaults to "Anselmoo/mcp-ai-agent-guidelines")
 *
 * Environment variables:
 *   PR_QUALITY_CACHE_FILE — override cache output path
 *                           (default: $TMPDIR/mcp-ai-agent-guidelines-pr-quality.json)
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// ── Config ─────────────────────────────────────────────────────────────────

const PR_NUMBER = parseInt(process.argv[2] ?? "", 10);
if (!PR_NUMBER || Number.isNaN(PR_NUMBER)) {
  console.error("Usage: node refresh-pr-quality-cache.js <pr-number>");
  process.exit(1);
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("ERROR: GITHUB_TOKEN environment variable is required.");
  process.exit(1);
}

const [OWNER, REPO] = (
  process.env.GITHUB_REPO ?? "Anselmoo/mcp-ai-agent-guidelines"
).split("/");

const CACHE_FILE =
  process.env.PR_QUALITY_CACHE_FILE ??
  join(tmpdir(), "mcp-ai-agent-guidelines-pr-quality.json");

const GH_API = "https://api.github.com";
const GH_HEADERS = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "mcp-ai-agent-guidelines/pr-quality-gate",
};

// ── Helpers ────────────────────────────────────────────────────────────────

async function ghFetch(path) {
  const res = await fetch(`${GH_API}${path}`, { headers: GH_HEADERS });
  if (!res.ok) {
    throw new Error(`GitHub API ${path} → ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Summarise the first sentence of a review comment body. */
function summarize(body = "") {
  return body.replace(/```[\s\S]*?```/g, "<code block>").split(/\n/)[0].slice(0, 120);
}

// ── Fetch review threads ───────────────────────────────────────────────────

console.log(`Fetching review threads for PR #${PR_NUMBER}…`);

const reviewCommentsRaw = await ghFetch(
  `/repos/${OWNER}/${REPO}/pulls/${PR_NUMBER}/comments?per_page=100`
);

// GitHub's REST API for review comments doesn't expose is_resolved/is_outdated
// directly. We approximate: a comment is "resolved" if its position is null
// (outdated/deleted diff position) or if the PR review state is APPROVED.
// For full resolution status, use the GraphQL API in production.
const reviewThreads = reviewCommentsRaw.map((c) => ({
  id: c.id,
  path: c.path,
  line: c.original_line ?? c.line ?? c.position,
  is_resolved: false,     // REST API doesn't expose this; refresh via GraphQL if needed
  is_outdated: c.position === null,
  summary: summarize(c.body),
  html_url: c.html_url,
}));

const unresolvedCount = reviewThreads.filter(
  (t) => !t.is_resolved && !t.is_outdated
).length;
console.log(`  → ${reviewThreads.length} total threads, ${unresolvedCount} unresolved`);

// ── Fetch Codecov data from PR comments ───────────────────────────────────

console.log(`Fetching PR comments to locate Codecov report…`);

const prComments = await ghFetch(
  `/repos/${OWNER}/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`
);

const codecovComment = prComments.find(
  (c) => c.user?.login === "codecov[bot]" && c.body?.includes("Patch coverage")
);

let codecovData = null;
if (codecovComment) {
  // Parse patch coverage percentage from the comment body.
  const patchMatch = codecovComment.body.match(
    /Patch coverage is [`']?([\d.]+)%/i
  );
  const patchPct = patchMatch ? parseFloat(patchMatch[1]) : null;

  // Parse missing-file table rows:
  // | src/cli.ts | 80.30% | 12 Missing and 1 partial |
  const fileRows = [...codecovComment.body.matchAll(
    /\|\s*\[?`?([^|\]`]+\.ts)`?\]?[^|]*\|\s*([\d.]+)%\s*\|\s*(?:(\d+) Missing)?[^|]*?(?:(\d+) partial[s]?)?\s*[|:warning:]/gi
  )].map((m) => ({
    path: m[1].trim(),
    patchPct: parseFloat(m[2]),
    missing: parseInt(m[3] ?? "0", 10),
    partials: parseInt(m[4] ?? "0", 10),
  }));

  codecovData = {
    patchCoverage: patchPct,
    missingFiles: fileRows,
    commentUrl: codecovComment.html_url,
  };

  console.log(
    `  → Patch coverage: ${patchPct ?? "n/a"}%` +
    (fileRows.length ? `, ${fileRows.length} file(s) with gaps` : "")
  );
} else {
  console.log("  → No Codecov bot comment found on this PR.");
}

// ── Write cache ────────────────────────────────────────────────────────────

const cache = {
  pr: PR_NUMBER,
  owner: OWNER,
  repo: REPO,
  fetchedAt: Date.now(),
  reviewThreads,
  codecov: codecovData,
};

writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
console.log(`\nCache written to: ${CACHE_FILE}`);
console.log("The pr-quality-gate hook will use this data for the next 10 minutes.");
console.log(
  unresolvedCount > 0 || (codecovData?.patchCoverage ?? 100) < 87.55
    ? "\n⚠  Quality gate will BLOCK push/merge until issues are resolved."
    : "\n✓  Quality gate will PASS — no blocking issues found."
);
