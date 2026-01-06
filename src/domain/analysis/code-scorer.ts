import type { ScoreBreakdown, ScoreWeights, ScoringResult } from "./types.js";

export interface CoverageMetrics {
	statements?: number;
	branches?: number;
	functions?: number;
	lines?: number;
}

export interface HygieneMetrics {
	codeContent?: string;
	language?: string;
}

export interface CodeScorerInput extends HygieneMetrics {
	coverageMetrics?: CoverageMetrics;
	weights?: Partial<ScoreWeights>;
}

const defaultWeights: ScoreWeights = {
	hygiene: 0.25,
	coverage: 0.3,
	documentation: 0.2,
	security: 0.25,
};

export function calculateHygieneScore(
	codeContent?: string,
	language?: string,
): ScoreBreakdown["hygiene"] {
	if (!codeContent) {
		return { score: 100, issues: [] };
	}

	let score = 100;
	const issues: string[] = [];
	const lang = language?.toLowerCase();

	if (codeContent.includes("TODO") || codeContent.includes("FIXME")) {
		score -= 5;
		issues.push("TODO or FIXME comments found");
	}

	if (
		(codeContent.includes("console.log") || codeContent.includes("print(")) &&
		(lang === "javascript" || lang === "typescript" || lang === "python")
	) {
		score -= 10;
		issues.push("Debug statements found");
	}

	if (
		/(apiKey|api_key|password|secret|token)\s*=\s*['"][^'"]+['"]/i.test(
			codeContent,
		)
	) {
		score -= 20;
		issues.push("Potential hardcoded credentials detected");
	}

	const commentedLines = (
		codeContent.match(/^\s*(\/\/|#)\s*(const|let|var|def|function)/gm) || []
	).length;
	if (commentedLines > 3) {
		score -= 5;
		issues.push(`${commentedLines} lines of commented code found`);
	}

	const functionMatches =
		codeContent.match(/function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?}/g) || [];
	for (const func of functionMatches) {
		const lines = func.split("\n").length;
		if (lines > 50) {
			score -= 10;
			issues.push("Complex function detected (>50 lines)");
			break;
		}
	}

	return { score: Math.max(0, score), issues };
}

export function calculateCoverageScore(
	coverageMetrics?: CoverageMetrics,
): ScoreBreakdown["coverage"] {
	const statements = coverageMetrics?.statements ?? 100;
	const branches = coverageMetrics?.branches ?? 100;
	const functions = coverageMetrics?.functions ?? 100;
	const lines = coverageMetrics?.lines ?? 100;

	const avgCoverage = (statements + branches + functions + lines) / 4;
	const issues: string[] = [];

	if (avgCoverage < 80) {
		issues.push(
			`Average coverage ${avgCoverage.toFixed(1)}% is below 80% target`,
		);
	}
	if (statements < 80) {
		issues.push(`Statement coverage ${statements}% is below 80%`);
	}
	if (branches < 80) {
		issues.push(`Branch coverage ${branches}% is below 80%`);
	}
	if (functions < 80) {
		issues.push(`Function coverage ${functions}% is below 80%`);
	}

	return { score: Math.max(0, Math.min(100, avgCoverage)), issues };
}

export function calculateDocumentationScore(
	codeContent?: string,
): ScoreBreakdown["documentation"] {
	if (!codeContent) {
		return { score: 100, issues: [] };
	}

	let score = 70;

	const docComments = (
		codeContent.match(/\/\*\*[\s\S]*?\*\/|'''[\s\S]*?'''|"""[\s\S]*?"""/g) || []
	).length;
	if (docComments > 0) {
		score += 15;
	}

	const inlineComments = (codeContent.match(/\/\/.*|#.*/g) || []).length;
	if (inlineComments > 5) {
		score += 15;
	}

	if (/README|CONTRIBUTING|CHANGELOG/i.test(codeContent)) {
		score += 10;
	}

	const normalizedScore = Math.min(100, score);
	const issues =
		normalizedScore < 80
			? ["Insufficient code documentation and comments"]
			: [];

	return { score: normalizedScore, issues };
}

export function calculateSecurityScore(
	codeContent?: string,
): ScoreBreakdown["security"] {
	if (!codeContent) {
		return { score: 100, issues: [] };
	}

	let score = 100;
	const issues: string[] = [];

	if (/\b(eval|exec)\s*\(/i.test(codeContent)) {
		score -= 30;
		issues.push("Use of eval() or exec() detected - security risk");
	}

	if (/(SELECT|INSERT|UPDATE|DELETE)\s+.*\+.*/.test(codeContent)) {
		score -= 25;
		issues.push("Potential SQL injection vulnerability");
	}

	if (/innerHTML\s*=|dangerouslySetInnerHTML/i.test(codeContent)) {
		score -= 20;
		issues.push("Potential XSS vulnerability with innerHTML");
	}

	if (
		/(secret|password|api_key|apiKey|token|auth|credential)\s*=\s*['"][^'"]+['"]/i.test(
			codeContent,
		)
	) {
		score -= 25;
		issues.push("Hardcoded secrets or credentials found");
	}

	return { score: Math.max(0, score), issues };
}

export function weightedAverage(
	breakdown: ScoreBreakdown,
	weights: Partial<ScoreWeights> = {},
): number {
	const appliedWeights: ScoreWeights = { ...defaultWeights, ...weights };
	const totalWeight =
		appliedWeights.hygiene +
		appliedWeights.coverage +
		appliedWeights.documentation +
		appliedWeights.security;

	if (totalWeight === 0) {
		return 0;
	}

	const weightedSum =
		breakdown.hygiene.score * appliedWeights.hygiene +
		breakdown.coverage.score * appliedWeights.coverage +
		breakdown.documentation.score * appliedWeights.documentation +
		breakdown.security.score * appliedWeights.security;

	return weightedSum / totalWeight;
}

export function generateRecommendations(breakdown: ScoreBreakdown): string[] {
	const recommendations: string[] = [];

	if (breakdown.hygiene.score < 85) {
		recommendations.push(
			"Improve code hygiene by addressing TODOs, debug statements, and commented code",
		);
	}

	if (breakdown.coverage.score < 80) {
		recommendations.push(
			"Increase test coverage to at least 80% across statements, branches, functions, and lines",
		);
	}

	if (breakdown.documentation.score < 80) {
		recommendations.push(
			"Add comprehensive documentation, docstrings, and README references",
		);
	}

	if (breakdown.security.score < 90) {
		recommendations.push(
			"Review security findings (eval, SQL injection, XSS, secrets) and remediate",
		);
	}

	if (recommendations.length === 0) {
		recommendations.push(
			"Maintain current quality standards and monitor regularly",
		);
	}

	return recommendations;
}

export function calculateCleanCodeScore(input: CodeScorerInput): ScoringResult {
	const hygiene = calculateHygieneScore(input.codeContent, input.language);
	const coverage = calculateCoverageScore(input.coverageMetrics);
	const documentation = calculateDocumentationScore(input.codeContent);
	const security = calculateSecurityScore(input.codeContent);

	const breakdown: ScoreBreakdown = {
		hygiene,
		coverage,
		documentation,
		security,
	};

	const overallScore = Math.round(weightedAverage(breakdown, input.weights));
	const recommendations = generateRecommendations(breakdown);

	return { overallScore, breakdown, recommendations };
}
