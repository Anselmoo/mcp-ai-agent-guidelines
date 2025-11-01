#!/usr/bin/env node

/**
 * Generate Minimalistic GitHub-Style Documentation Frames
 *
 * Creates simple, animated header/footer banners with:
 * - GitHub contribution activity visualization
 * - Pull request merge/block animations
 * - Minimalistic design with no forms or inputs
 * - Hardcoded absolute URLs for GitHub Pages compatibility
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GitHub repository information
const GITHUB_REPO = "Anselmoo/mcp-ai-agent-guidelines";
const GITHUB_BRANCH = "main";
const FRAMES_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/docs/.frames-interactive`;

// GitHub Brand Colors
const COLORS = {
	greenLight: "#40C463",
	greenMedium: "#30A14E",
	greenDark: "#216E39",
	gray: "#EBEDF0",
	darkGray: "#161B22",
	white: "#FFFFFF",
	orange: "#FB8532",
	red: "#F85149",
	purple: "#8B5CF6",
};

/**
 * Generate minimalistic header with contribution-style activity
 */
function generateHeader(config) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} - Header</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, ${config.gradient[0]} 0%, ${config.gradient[1]} 100%);
            color: ${COLORS.white};
            height: 120px;
            overflow: hidden;
            display: flex;
            align-items: center;
            padding: 0 40px;
            position: relative;
        }

        /* Contribution Graph Animation */
        .contribution-graph {
            position: absolute;
            top: 20px;
            right: 40px;
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 3px;
            opacity: 0.3;
        }

        .contribution-cell {
            width: 12px;
            height: 12px;
            border-radius: 2px;
            background: ${COLORS.gray};
            animation: pulse 3s ease-in-out infinite;
        }

        .contribution-cell:nth-child(5n+1) {
            background: ${COLORS.greenLight};
            animation-delay: 0.1s;
        }
        .contribution-cell:nth-child(5n+2) {
            background: ${COLORS.greenMedium};
            animation-delay: 0.2s;
        }
        .contribution-cell:nth-child(5n+3) {
            background: ${COLORS.greenDark};
            animation-delay: 0.3s;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
        }

        /* Content */
        .header-content {
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 10;
        }

        .icon {
            font-size: 40px;
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        .title {
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }

        /* Merge Line Animation */
        .merge-lines {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg,
                ${COLORS.greenMedium} 0%,
                ${COLORS.purple} 50%,
                ${COLORS.greenMedium} 100%
            );
            background-size: 200% 100%;
            animation: flow 4s linear infinite;
        }

        @keyframes flow {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }

        @media (max-width: 768px) {
            body { padding: 0 20px; }
            .title { font-size: 20px; }
            .icon { font-size: 32px; }
            .contribution-graph { display: none; }
        }
    </style>
</head>
<body>
    <div class="contribution-graph" aria-hidden="true">
        ${Array(48)
					.fill(0)
					.map(() => '<div class="contribution-cell"></div>')
					.join("\n        ")}
    </div>

    <div class="header-content">
        <div class="icon" role="img" aria-label="${config.title}">${config.icon}</div>
        <h1 class="title">${config.title}</h1>
    </div>

    <div class="merge-lines" aria-hidden="true"></div>
</body>
</html>`;
}

/**
 * Generate minimalistic footer with PR status animations
 */
function generateFooter(config) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} - Footer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(180deg, ${config.gradient[1]} 0%, ${COLORS.darkGray} 100%);
            color: ${COLORS.white};
            height: 80px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 40px;
            position: relative;
        }

        /* PR Status Indicators */
        .pr-status {
            display: flex;
            gap: 20px;
            align-items: center;
        }

        .pr-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0.7;
            transition: opacity 0.3s;
        }

        .pr-indicator:hover {
            opacity: 1;
        }

        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            animation: blink 2s ease-in-out infinite;
        }

        .status-merged .status-dot {
            background: ${COLORS.purple};
        }

        .status-open .status-dot {
            background: ${COLORS.greenMedium};
        }

        .status-blocked .status-dot {
            background: ${COLORS.red};
            animation: blink 1s ease-in-out infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }

        .status-text {
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Copyright */
        .copyright {
            font-size: 13px;
            opacity: 0.6;
        }

        /* Activity Line */
        .activity-line {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg,
                transparent 0%,
                ${COLORS.greenMedium} 20%,
                ${COLORS.purple} 50%,
                ${COLORS.greenMedium} 80%,
                transparent 100%
            );
            background-size: 200% 100%;
            animation: slide 3s linear infinite;
        }

        @keyframes slide {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }

        @media (max-width: 768px) {
            body { padding: 0 20px; flex-direction: column; justify-content: center; gap: 15px; height: 100px; }
            .pr-status { gap: 10px; }
            .status-text { font-size: 10px; }
        }
    </style>
</head>
<body>
    <div class="activity-line" aria-hidden="true"></div>

    <div class="pr-status">
        <div class="pr-indicator status-merged">
            <div class="status-dot"></div>
            <span class="status-text">Merged</span>
        </div>
        <div class="pr-indicator status-open">
            <div class="status-dot"></div>
            <span class="status-text">Open</span>
        </div>
        <div class="pr-indicator status-blocked">
            <div class="status-dot"></div>
            <span class="status-text">Blocked</span>
        </div>
    </div>

    <div class="copyright">
        © 2025 MCP AI Agent Guidelines
    </div>
</body>
</html>`;
}

// Configuration for all files
const CONFIGS = {
	// Main documentation files
	README: {
		title: "MCP AI Agent Guidelines",
		icon: "🤖",
		gradient: [COLORS.greenMedium, COLORS.greenDark],
	},
	CHANGELOG: {
		title: "Changelog",
		icon: "📝",
		gradient: [COLORS.darkGray, "#0D1117"],
	},
	CONTRIBUTING: {
		title: "Contributing",
		icon: "🤝",
		gradient: [COLORS.purple, "#6E40C9"],
	},
	DISCLAIMER: {
		title: "Disclaimer",
		icon: "⚠️",
		gradient: [COLORS.orange, "#D15704"],
	},
	"docs-README": {
		title: "Documentation",
		icon: "📚",
		gradient: [COLORS.greenMedium, COLORS.purple],
	},
	"tips-README": {
		title: "Tips & Guides",
		icon: "💡",
		gradient: [COLORS.greenLight, COLORS.greenMedium],
	},
	"about-README": {
		title: "About",
		icon: "ℹ️",
		gradient: ["#0969DA", "#0550AE"],
	},
	"tools-README": {
		title: "Tools",
		icon: "🛠️",
		gradient: [COLORS.purple, "#6E40C9"],
	},
};

/**
 * Main generation function
 */
function generateFrames() {
	console.log("🎨 Generating Minimalistic GitHub-Style Frames...\n");

	const outputDir = join(dirname(__dirname), "docs", ".frames-interactive");

	try {
		mkdirSync(outputDir, { recursive: true });
		console.log(`✓ Created directory: ${outputDir}\n`);
	} catch (error) {
		console.error(`✗ Error creating directory: ${error.message}`);
		process.exit(1);
	}

	let filesGenerated = 0;

	// Generate frames for each configuration
	for (const [key, config] of Object.entries(CONFIGS)) {
		try {
			// Generate header
			const headerPath = join(outputDir, `header-${key}.html`);
			const headerContent = generateHeader(config);
			writeFileSync(headerPath, headerContent, "utf-8");
			console.log(`✓ Generated: header-${key}.html`);
			filesGenerated++;

			// Generate footer
			const footerPath = join(outputDir, `footer-${key}.html`);
			const footerContent = generateFooter(config);
			writeFileSync(footerPath, footerContent, "utf-8");
			console.log(`✓ Generated: footer-${key}.html`);
			filesGenerated++;
		} catch (error) {
			console.error(`✗ Error generating ${key}: ${error.message}`);
		}
	}

	// Generate manifest
	const manifest = {
		version: "2.0.0",
		generated: new Date().toISOString(),
		repository: GITHUB_REPO,
		branch: GITHUB_BRANCH,
		baseUrl: FRAMES_BASE_URL,
		files: Object.keys(CONFIGS).flatMap((key) => [
			`header-${key}.html`,
			`footer-${key}.html`,
		]),
		totalFiles: filesGenerated,
	};

	const manifestPath = join(outputDir, "manifest.json");
	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
	console.log(`\n✓ Generated: manifest.json`);

	// Generate README
	const readmePath = join(outputDir, "README.md");
	const readmeContent = `# Minimalistic Documentation Frames

Auto-generated GitHub-style header and footer banners for markdown documentation.

**Generated**: ${new Date().toISOString()}
**Repository**: ${GITHUB_REPO}
**Base URL**: ${FRAMES_BASE_URL}
**Total Files**: ${filesGenerated}

## Features

- ✨ GitHub contribution graph animation
- 🔀 Pull request status indicators (Merged, Open, Blocked)
- 🎨 Minimalistic design with no forms or inputs
- 📱 Responsive layout
- 🔗 Hardcoded absolute URLs for GitHub Pages compatibility

## Files

${Object.keys(CONFIGS)
	.map((key) => `- header-${key}.html\n- footer-${key}.html`)
	.join("\n")}

## Usage

These frames use absolute GitHub raw URLs and are injected via the \`apply-interactive-frames.js\` script.

**Do not edit manually** - regenerate using \`npm run frames:generate-interactive\`.
`;

	writeFileSync(readmePath, readmeContent, "utf-8");
	console.log(`✓ Generated: README.md`);

	console.log(`\n✅ Successfully generated ${filesGenerated} HTML files!`);
	console.log(`📁 Output directory: ${outputDir}`);
	console.log(`🔗 Base URL: ${FRAMES_BASE_URL}`);
}

// Run generation
generateFrames();
