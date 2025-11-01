#!/usr/bin/env node

/**
 * Generate Interactive GitHub-Inspired Documentation Frames
 *
 * Creates self-contained HTML header and footer files with:
 * - Animated gitlines (vertical flowing lines)
 * - Floating isometric shapes
 * - D3.js activity matrix visualization
 * - Interactive search, forms, and navigation
 * - GitHub brand colors and motion guidelines
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GitHub Brand Colors
const COLORS = {
	// GitHub Green
	greenLight: "#BFFFD1",
	greenMedium: "#5FED83",
	greenDark: "#08872B",
	greenDarker: "#104C35",

	// AI Purple
	purpleLight: "#D0B0FF",
	purpleMedium: "#C06EFF",
	purpleDark: "#501DAF",

	// Security Blue
	blueLight: "#9EECFF",
	blueMedium: "#3094FF",
	blueDark: "#0527FC",

	// Neutrals
	gray: "#8B949E",
	black: "#0D1117",
	white: "#FFFFFF",
};

// Content configurations for each file type
const CONTENT_CONFIGS = {
	README: {
		title: "MCP AI Agent Guidelines",
		subtitle:
			"Comprehensive Model Context Protocol server for AI agent best practices",
		theme: "primary",
		icon: "🤖",
		gradient: [COLORS.greenMedium, COLORS.greenDark],
		navLinks: [
			{ text: "Documentation", href: "#documentation" },
			{ text: "Tools", href: "#tools" },
			{ text: "Getting Started", href: "#getting-started" },
		],
		activityData: {
			agents: [
				"design-assistant",
				"code-analyzer",
				"prompt-builder",
				"security-scanner",
			],
			tasks: ["analyze", "refactor", "document", "test", "deploy"],
		},
	},
	CHANGELOG: {
		title: "Changelog",
		subtitle: "Release history and version updates",
		theme: "neutral",
		icon: "📝",
		gradient: [COLORS.gray, COLORS.black],
		navLinks: [
			{ text: "Latest", href: "#latest" },
			{ text: "All Versions", href: "#all-versions" },
		],
		activityData: {
			agents: ["release-bot", "changelog-generator"],
			tasks: ["version", "release", "document"],
		},
	},
	CONTRIBUTING: {
		title: "Contributing",
		subtitle: "Guidelines for contributing to this project",
		theme: "community",
		icon: "🤝",
		gradient: [COLORS.purpleMedium, COLORS.purpleDark],
		navLinks: [
			{ text: "Code of Conduct", href: "#code-of-conduct" },
			{ text: "Pull Requests", href: "#pull-requests" },
			{ text: "Issues", href: "#issues" },
		],
		activityData: {
			agents: ["contributor-bot", "review-bot", "ci-runner"],
			tasks: ["review", "test", "merge", "approve"],
		},
	},
	DISCLAIMER: {
		title: "Disclaimer",
		subtitle: "Legal information and disclaimers",
		theme: "caution",
		icon: "⚠️",
		gradient: [COLORS.blueMedium, COLORS.blueDark],
		navLinks: [
			{ text: "Terms", href: "#terms" },
			{ text: "Privacy", href: "#privacy" },
		],
		activityData: {
			agents: ["compliance-checker"],
			tasks: ["validate", "audit"],
		},
	},
	tips: {
		title: "Tips & Guides",
		subtitle: "Best practices and user guides",
		theme: "learning",
		icon: "💡",
		gradient: [COLORS.greenLight, COLORS.greenMedium],
		navLinks: [
			{ text: "Beginner", href: "#beginner" },
			{ text: "Advanced", href: "#advanced" },
		],
		activityData: {
			agents: ["tutorial-agent", "example-generator"],
			tasks: ["teach", "demonstrate", "guide"],
		},
	},
	about: {
		title: "About",
		subtitle: "Information about this project",
		theme: "info",
		icon: "ℹ️",
		gradient: [COLORS.blueLight, COLORS.blueMedium],
		navLinks: [
			{ text: "Mission", href: "#mission" },
			{ text: "Team", href: "#team" },
		],
		activityData: {
			agents: ["info-bot"],
			tasks: ["inform", "explain"],
		},
	},
	tools: {
		title: "Tools",
		subtitle: "Available tools and utilities",
		theme: "technical",
		icon: "🛠️",
		gradient: [COLORS.purpleLight, COLORS.purpleMedium],
		navLinks: [
			{ text: "Prompt Tools", href: "#prompt-tools" },
			{ text: "Analysis Tools", href: "#analysis-tools" },
		],
		activityData: {
			agents: ["tool-manager", "api-handler"],
			tasks: ["execute", "configure", "optimize"],
		},
	},
	"docs-README": {
		title: "Documentation",
		subtitle: "Complete project documentation",
		theme: "navigation",
		icon: "📚",
		gradient: [COLORS.greenMedium, COLORS.blueMedium],
		navLinks: [
			{ text: "Overview", href: "#overview" },
			{ text: "API", href: "#api" },
		],
		activityData: {
			agents: ["doc-generator", "api-documenter"],
			tasks: ["generate", "update", "validate"],
		},
	},
};

/**
 * Generate header HTML with animations and interactive elements
 */
function generateHeader(config) {
	const [gradientStart, gradientEnd] = config.gradient;

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%);
            color: ${COLORS.white};
            overflow: hidden;
            height: 180px;
            position: relative;
        }

        /* Animated Gitlines */
        .gitlines {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            opacity: 0.3;
            z-index: 1;
        }

        .gitline {
            position: absolute;
            width: 2px;
            height: 100%;
            background: linear-gradient(to bottom, transparent, ${COLORS.white}, transparent);
            animation: slideDown 3s ease-in-out infinite;
        }

        .gitline:nth-child(1) { left: 10%; animation-delay: 0s; }
        .gitline:nth-child(2) { left: 30%; animation-delay: 0.6s; }
        .gitline:nth-child(3) { left: 50%; animation-delay: 1.2s; }
        .gitline:nth-child(4) { left: 70%; animation-delay: 1.8s; }
        .gitline:nth-child(5) { left: 90%; animation-delay: 2.4s; }

        @keyframes slideDown {
            0% { transform: translateY(-100%); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(100%); opacity: 0; }
        }

        /* Floating Shapes */
        .shapes {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 2;
        }

        .shape {
            position: absolute;
            border-radius: 8px;
            opacity: 0.2;
            animation: float 6s ease-in-out infinite;
        }

        .shape:nth-child(1) {
            width: 40px;
            height: 40px;
            background: ${COLORS.greenLight};
            top: 20%;
            left: 15%;
            animation-delay: 0s;
        }

        .shape:nth-child(2) {
            width: 60px;
            height: 60px;
            background: ${COLORS.purpleLight};
            top: 60%;
            left: 75%;
            animation-delay: 2s;
        }

        .shape:nth-child(3) {
            width: 50px;
            height: 50px;
            background: ${COLORS.blueLight};
            top: 40%;
            right: 20%;
            animation-delay: 4s;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }

        /* Content Container */
        .header-container {
            position: relative;
            z-index: 10;
            padding: 20px 40px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        /* Title Row */
        .title-row {
            display: flex;
            align-items: center;
            gap: 15px;
            animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .icon {
            font-size: 48px;
            animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .title {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin-top: 8px;
            animation: fadeIn 1s ease-in 0.5s both;
        }

        /* Navigation Row */
        .nav-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        .nav-links {
            display: flex;
            gap: 20px;
        }

        .nav-link {
            color: ${COLORS.white};
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            font-size: 14px;
            font-weight: 500;
        }

        .nav-link:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }

        /* Search Bar */
        .search-container {
            animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
        }

        .search-input {
            padding: 10px 20px;
            border: none;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            color: ${COLORS.white};
            font-size: 14px;
            width: 200px;
            transition: all 0.3s ease;
        }

        .search-input::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }

        .search-input:focus {
            outline: none;
            width: 300px;
            background: rgba(255, 255, 255, 0.25);
        }

        @keyframes slideInLeft {
            from { transform: translateX(-30px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideInRight {
            from { transform: translateX(30px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header-container {
                padding: 15px 20px;
            }

            .title {
                font-size: 24px;
            }

            .subtitle {
                font-size: 14px;
            }

            .nav-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }

            .search-input {
                width: 100%;
            }

            .search-input:focus {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <!-- Animated Gitlines -->
    <div class="gitlines" aria-hidden="true">
        <div class="gitline"></div>
        <div class="gitline"></div>
        <div class="gitline"></div>
        <div class="gitline"></div>
        <div class="gitline"></div>
    </div>

    <!-- Floating Shapes -->
    <div class="shapes" aria-hidden="true">
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
    </div>

    <!-- Header Content -->
    <div class="header-container">
        <div class="title-row">
            <div class="icon" role="img" aria-label="${config.title} icon">${config.icon}</div>
            <div>
                <h1 class="title">${config.title}</h1>
                <p class="subtitle">${config.subtitle}</p>
            </div>
        </div>

        <nav class="nav-row" aria-label="Main navigation">
            <div class="nav-links">
                ${config.navLinks.map((link) => `<a href="${link.href}" class="nav-link">${link.text}</a>`).join("\n                ")}
            </div>
            <div class="search-container">
                <input
                    type="search"
                    class="search-input"
                    placeholder="Search documentation..."
                    aria-label="Search documentation"
                    onkeypress="handleSearch(event)"
                />
            </div>
        </nav>
    </div>

    <script>
        function handleSearch(event) {
            if (event.key === 'Enter') {
                const query = event.target.value;
                if (query) {
                    window.parent.postMessage({
                        type: 'search',
                        query: query
                    }, '*');
                }
            }
        }
    </script>
</body>
</html>`;
}

/**
 * Generate footer HTML with D3.js activity matrix
 */
function generateFooter(config) {
	const [gradientStart, gradientEnd] = config.gradient;
	const agents = config.activityData.agents;
	const tasks = config.activityData.tasks;

	// Generate random activity data
	const activityMatrix = agents.map((_agent) =>
		tasks.map(() => Math.floor(Math.random() * 10) + 1),
	);

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} Footer</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, ${gradientEnd} 0%, ${COLORS.black} 100%);
            color: ${COLORS.white};
            padding: 40px;
            min-height: 400px;
        }

        .footer-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        /* Activity Matrix Section */
        .activity-section {
            margin-bottom: 40px;
            animation: fadeInUp 0.8s ease-in;
        }

        .section-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        #activity-matrix {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }

        .matrix-cell {
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .matrix-cell:hover {
            stroke: ${COLORS.white};
            stroke-width: 2;
        }

        .matrix-label {
            fill: ${COLORS.white};
            font-size: 12px;
            opacity: 0.8;
        }

        .tooltip {
            position: absolute;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.9);
            color: ${COLORS.white};
            border-radius: 6px;
            font-size: 12px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 1000;
        }

        /* Links Grid */
        .links-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
            animation: fadeInUp 0.8s ease-in 0.2s both;
        }

        .link-column h3 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 12px;
            color: ${gradientStart};
        }

        .link-column ul {
            list-style: none;
        }

        .link-column a {
            color: ${COLORS.white};
            text-decoration: none;
            opacity: 0.8;
            font-size: 14px;
            transition: all 0.3s ease;
            display: block;
            margin-bottom: 8px;
        }

        .link-column a:hover {
            opacity: 1;
            transform: translateX(5px);
        }

        /* Feedback Form */
        .feedback-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 30px;
            backdrop-filter: blur(10px);
            margin-bottom: 30px;
            animation: fadeInUp 0.8s ease-in 0.4s both;
        }

        .feedback-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 15px;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-input {
            width: 100%;
            padding: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.1);
            color: ${COLORS.white};
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .form-input:focus {
            outline: none;
            border-color: ${gradientStart};
            background: rgba(255, 255, 255, 0.15);
        }

        .form-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        textarea.form-input {
            resize: vertical;
            min-height: 80px;
        }

        .submit-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            background: linear-gradient(135deg, ${gradientStart}, ${gradientEnd});
            color: ${COLORS.white};
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* Copyright */
        .copyright {
            text-align: center;
            opacity: 0.6;
            font-size: 14px;
            animation: fadeIn 1s ease-in 0.6s both;
        }

        .octocat {
            cursor: pointer;
            display: inline-block;
            transition: transform 0.3s ease;
        }

        .octocat:hover {
            transform: scale(1.2);
        }

        @keyframes fadeInUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 768px) {
            body {
                padding: 20px;
            }

            .links-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="footer-container">
        <!-- Activity Matrix -->
        <div class="activity-section">
            <h2 class="section-title">
                <span>📊</span>
                <span>Agent Activity Matrix</span>
            </h2>
            <div id="activity-matrix"></div>
        </div>

        <!-- Links Grid -->
        <div class="links-grid">
            <div class="link-column">
                <h3>Resources</h3>
                <ul>
                    <li><a href="#documentation">Documentation</a></li>
                    <li><a href="#api-reference">API Reference</a></li>
                    <li><a href="#examples">Examples</a></li>
                </ul>
            </div>
            <div class="link-column">
                <h3>Community</h3>
                <ul>
                    <li><a href="#contributing">Contributing</a></li>
                    <li><a href="#discussions">Discussions</a></li>
                    <li><a href="#code-of-conduct">Code of Conduct</a></li>
                </ul>
            </div>
            <div class="link-column">
                <h3>Support</h3>
                <ul>
                    <li><a href="#issues">Issues</a></li>
                    <li><a href="#faq">FAQ</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </div>
            <div class="link-column">
                <h3>About</h3>
                <ul>
                    <li><a href="#license">License</a></li>
                    <li><a href="#changelog">Changelog</a></li>
                    <li><a href="#security">Security</a></li>
                </ul>
            </div>
        </div>

        <!-- Feedback Form -->
        <div class="feedback-section">
            <h3 class="feedback-title">Feedback</h3>
            <form onsubmit="handleFeedback(event)">
                <div class="form-group">
                    <input
                        type="email"
                        class="form-input"
                        placeholder="Email (optional)"
                        aria-label="Email"
                    />
                </div>
                <div class="form-group">
                    <textarea
                        class="form-input"
                        placeholder="Your feedback..."
                        required
                        aria-label="Feedback message"
                    ></textarea>
                </div>
                <button type="submit" class="submit-btn">Send Feedback</button>
            </form>
        </div>

        <!-- Copyright -->
        <div class="copyright">
            <p>
                © 2025 MCP AI Agent Guidelines |
                <span class="octocat" onclick="handleOctocat()" role="button" aria-label="Octocat easter egg">🐙</span> |
                Made with ❤️
            </p>
        </div>
    </div>

    <div class="tooltip" id="tooltip"></div>

    <script>
        // Activity Matrix Data
        const agents = ${JSON.stringify(agents)};
        const tasks = ${JSON.stringify(tasks)};
        const data = ${JSON.stringify(activityMatrix)};

        // D3.js Activity Matrix Visualization
        function createActivityMatrix() {
            const margin = { top: 80, right: 20, bottom: 20, left: 120 };
            const cellSize = 40;
            const width = tasks.length * cellSize + margin.left + margin.right;
            const height = agents.length * cellSize + margin.top + margin.bottom;

            const svg = d3.select('#activity-matrix')
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            const g = svg.append('g')
                .attr('transform', \`translate(\${margin.left},\${margin.top})\`);

            // Color scale
            const colorScale = d3.scaleSequential()
                .domain([0, 10])
                .interpolator(d3.interpolateRgb('${gradientStart}', '${gradientEnd}'));

            // Create cells
            agents.forEach((agent, i) => {
                tasks.forEach((task, j) => {
                    const value = data[i][j];

                    g.append('rect')
                        .attr('class', 'matrix-cell')
                        .attr('x', j * cellSize)
                        .attr('y', i * cellSize)
                        .attr('width', cellSize - 2)
                        .attr('height', cellSize - 2)
                        .attr('rx', 4)
                        .attr('fill', colorScale(value))
                        .attr('opacity', 0)
                        .on('mouseover', function(event) {
                            const tooltip = d3.select('#tooltip');
                            tooltip
                                .style('opacity', 1)
                                .style('left', (event.pageX + 10) + 'px')
                                .style('top', (event.pageY - 10) + 'px')
                                .html(\`<strong>\${agent}</strong><br>\${task}: \${value} interactions\`);
                        })
                        .on('mouseout', function() {
                            d3.select('#tooltip').style('opacity', 0);
                        })
                        .transition()
                        .delay((i * tasks.length + j) * 20)
                        .duration(300)
                        .attr('opacity', 1);
                });
            });

            // Add labels
            g.selectAll('.agent-label')
                .data(agents)
                .enter()
                .append('text')
                .attr('class', 'matrix-label')
                .attr('x', -10)
                .attr('y', (d, i) => i * cellSize + cellSize / 2)
                .attr('dy', '.35em')
                .attr('text-anchor', 'end')
                .text(d => d)
                .attr('opacity', 0)
                .transition()
                .delay((d, i) => i * 100)
                .duration(300)
                .attr('opacity', 0.8);

            g.selectAll('.task-label')
                .data(tasks)
                .enter()
                .append('text')
                .attr('class', 'matrix-label')
                .attr('x', (d, i) => i * cellSize + cellSize / 2)
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .text(d => d)
                .attr('opacity', 0)
                .transition()
                .delay((d, i) => i * 100)
                .duration(300)
                .attr('opacity', 0.8);
        }

        // Initialize matrix on load
        createActivityMatrix();

        // Feedback form handler
        function handleFeedback(event) {
            event.preventDefault();
            alert('Thank you for your feedback! 🎉');
            event.target.reset();
        }

        // Octocat easter egg
        function handleOctocat() {
            const octocat = document.querySelector('.octocat');
            octocat.style.transform = 'rotate(720deg) scale(1.5)';
            setTimeout(() => {
                octocat.style.transform = 'rotate(0deg) scale(1)';
            }, 1000);
            alert('Octocat says: Keep building amazing things! 🚀');
        }
    </script>
</body>
</html>`;
}

/**
 * Main generation function
 */
function generateFrames() {
	console.log("🎨 Generating Interactive Documentation Frames...\n");

	// Create output directory
	const outputDir = join(dirname(__dirname), "docs", ".frames-interactive");

	try {
		mkdirSync(outputDir, { recursive: true });
		console.log(`✓ Created directory: ${outputDir}\n`);
	} catch (error) {
		console.error(`✗ Error creating directory: ${error.message}`);
		process.exit(1);
	}

	// Generate files for each configuration
	let filesGenerated = 0;

	for (const [key, config] of Object.entries(CONTENT_CONFIGS)) {
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
		files: Object.keys(CONTENT_CONFIGS).flatMap((key) => [
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
	const readmeContent = `# Interactive Documentation Frames

Auto-generated HTML headers and footers for markdown documentation.

**Generated**: ${new Date().toISOString()}
**Total Files**: ${filesGenerated}

## Files

${Object.keys(CONTENT_CONFIGS)
	.map((key) => `- header-${key}.html\n- footer-${key}.html`)
	.join("\n")}

## Features

- Animated gitlines (vertical flowing lines)
- Floating isometric shapes
- GitHub Octicons integration
- D3.js activity matrix visualization
- Interactive search bars
- Feedback forms
- Responsive design

## Usage

These files are automatically injected into markdown files using the \`apply-interactive-frames.js\` script.

Do not edit these files manually - they are auto-generated by \`generate-interactive-frames.js\`.
`;

	writeFileSync(readmePath, readmeContent, "utf-8");
	console.log(`✓ Generated: README.md`);

	console.log(`\n✅ Successfully generated ${filesGenerated} HTML files!`);
	console.log(`📁 Output directory: ${outputDir}`);
}

// Run generation
generateFrames();
