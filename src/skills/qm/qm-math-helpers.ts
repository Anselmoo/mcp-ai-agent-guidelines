import { evaluate } from "mathjs";

/**
 * Safe wrapper around mathjs.evaluate — returns NaN on any error rather than
 * throwing, so physics-tier formulas never propagate exceptions to callers.
 * ADVISORY ONLY: all outputs are supplementary engineering guidance.
 */
function safeEval(expr: string, scope: Record<string, number>): number {
	try {
		return evaluate(expr, scope) as number;
	} catch {
		return Number.NaN;
	}
}

/** Format a number to 3 significant figures for advisory display. Same contract as gr-physics-helpers.fmtNum. */
export function fmtNum(n: number): string {
	if (!Number.isFinite(n)) return "∞";
	const p = Number(n.toPrecision(3));
	return p.toString();
}

/** Extract up to `limit` leading numeric literals from a text string. Same contract as gr-physics-helpers.extractNumbers. */
export function extractNumbers(text: string, limit = 8): number[] {
	return (text.match(/\b\d+(?:\.\d+)?\b/g) ?? [])
		.map(Number)
		.filter((n) => Number.isFinite(n))
		.slice(0, limit);
}

/**
 * Uncertainty product for one module: U = coupling × cohesionDeficit
 * Uses evaluate() so the formula is self-documenting.
 * High U → Pareto violator (bad at both coupling AND cohesion simultaneously).
 */
export function uncertaintyProduct(
	coupling: number,
	cohesionDeficit: number,
): number {
	return safeEval("coupling * cohesionDeficit", {
		coupling,
		cohesionDeficit,
	});
}

/**
 * Advisory Pareto label for uncertainty product U relative to a threshold.
 * threshold default = 0.25 (moderate: both metrics above 0.5 on 0→1 scale)
 */
export function uncertaintyLabel(
	U: number,
	threshold = 0.25,
): "pareto-violator" | "tension" | "acceptable" {
	if (U >= threshold) return "pareto-violator";
	if (U >= threshold / 2) return "tension";
	return "acceptable";
}

/**
 * Born-rule probability distribution from raw evaluation scores.
 * True QM form: P(i) = score_i² / Σ score_j²
 * All scores must be non-negative. Zero score → zero probability.
 * Uses evaluate() for the normalization formula.
 */
export function bornRuleProbabilities(scores: number[]): number[] {
	const clean = scores.map((score) =>
		Number.isFinite(score) && score > 0 ? score : 0,
	);
	const sumSq = clean.reduce((sum, score) => sum + score ** 2, 0);
	if (clean.length === 0) return [];
	if (sumSq === 0) return clean.map(() => 1 / clean.length);
	return clean.map((score) =>
		safeEval("scoreSq / sumSq", { scoreSq: score ** 2, sumSq }),
	);
}

/**
 * Spectral gap: ratio of highest to second-highest probability.
 * gap > 2.0 → clear winner; 1.2-2.0 → marginal; < 1.2 → tie.
 */
export function spectralGap(probs: number[]): number {
	if (probs.length < 2) return Infinity;
	const [first = 0, second = 0] = [...probs].sort((a, b) => b - a);
	return second <= 0 ? Infinity : first / second;
}

/** Advisory confidence label for a spectral gap value. */
export function spectralGapLabel(
	gap: number,
): "clear-winner" | "marginal" | "tie" {
	if (gap > 2) return "clear-winner";
	if (gap >= 1.2) return "marginal";
	return "tie";
}

/**
 * Decoherence time T₂ = 1 / Σγₖ from failure rates γₖ per channel.
 * γₖ = 0 channels are excluded (non-contributing channels).
 * Uses evaluate() for the sum+reciprocal formula.
 */
export function decoherenceTime(gammas: number[]): number {
	const active = gammas.filter((gamma) => Number.isFinite(gamma) && gamma > 0);
	if (active.length === 0) return Infinity;
	return safeEval("1 / sum(gammas)", { gammas: active as unknown as number });
}

/**
 * WKB tunneling probability: T = exp(-2 × width × max(0, height - energy))
 * width ∈ [0,1] scope/complexity fraction
 * height ∈ [0,1] barrier risk fraction
 * energy ∈ [0,1] team energy fraction
 * Uses evaluate() for the compound formula.
 */
export function wkbTunneling(
	width: number,
	height: number,
	energy: number,
): number {
	const clamp = (value: number) => Math.min(0.99, Math.max(0.01, value));
	const safeWidth = clamp(width);
	const safeHeight = clamp(height);
	const safeEnergy = clamp(energy);
	return safeEval("exp(-2 * width * barrier)", {
		width: safeWidth,
		barrier: Math.max(0, safeHeight - safeEnergy),
	});
}

/** Advisory viability label for a WKB T value. */
export function wkbViabilityLabel(
	T: number,
): "attempt-now" | "attempt-reduced-scope" | "defer" {
	if (T > 0.5) return "attempt-now";
	if (T > 0.1) return "attempt-reduced-scope";
	return "defer";
}

/** Clamp a scalar to the inclusive unit interval. */
export function clampUnit(value: number): number {
	return Math.min(1, Math.max(0, value));
}

/** Euclidean norm for a real-valued vector. */
export function vectorNorm(vector: number[]): number {
	return Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
}

/** Unit-normalise a vector; zero vectors remain zero. */
export function normalizeVector(vector: number[]): number[] {
	const norm = vectorNorm(vector);
	if (norm === 0) return vector.map(() => 0);
	return vector.map((value) => value / norm);
}

/** Dot product between two real-valued vectors. */
export function dotProduct(a: number[], b: number[]): number {
	const length = Math.min(a.length, b.length);
	let sum = 0;
	for (let index = 0; index < length; index += 1) {
		sum += (a[index] ?? 0) * (b[index] ?? 0);
	}
	return sum;
}

/** Euclidean distance between two real-valued vectors. */
export function l2Distance(a: number[], b: number[]): number {
	const length = Math.max(a.length, b.length);
	let sum = 0;
	for (let index = 0; index < length; index += 1) {
		const delta = (a[index] ?? 0) - (b[index] ?? 0);
		sum += delta ** 2;
	}
	return Math.sqrt(sum);
}

/** Linear interpolation between two vectors. */
export function interpolateVector(
	a: number[],
	b: number[],
	t: number,
): number[] {
	const length = Math.max(a.length, b.length);
	return Array.from({ length }, (_, index) =>
		safeEval("(1 - t) * a + t * b", {
			t,
			a: a[index] ?? 0,
			b: b[index] ?? 0,
		}),
	);
}

/** Purity proxy for Bloch-style vectors: |r|. */
export function blochPurity(vector: number[]): number {
	return vectorNorm(vector);
}

/** Double-slit interference term 2√(I₁I₂)cos(δ). */
export function interferenceTerm(
	intensityA: number,
	intensityB: number,
	cosDelta: number,
): number {
	return safeEval("2 * sqrt(intensityA * intensityB) * cosDelta", {
		intensityA: clampUnit(intensityA),
		intensityB: clampUnit(intensityB),
		cosDelta: Math.max(-1, Math.min(1, cosDelta)),
	});
}

/** Total double-slit intensity I₁ + I₂ + interference_term. */
export function totalInterferenceIntensity(
	intensityA: number,
	intensityB: number,
	cosDelta: number,
): number {
	const term = interferenceTerm(intensityA, intensityB, cosDelta);
	return safeEval("intensityA + intensityB + term", {
		intensityA: clampUnit(intensityA),
		intensityB: clampUnit(intensityB),
		term,
	});
}

/** Relative gain versus classical addition. */
export function relativeGain(total: number, classical: number): number {
	if (classical <= 0) return 0;
	return safeEval("(total - classical) / classical", {
		total,
		classical,
	});
}

/** Sum of squared overlaps, used as a projection-weight centrality proxy. */
export function overlapProjectionWeight(overlaps: number[]): number {
	return overlaps.reduce((sum, overlap) => sum + overlap ** 2, 0);
}

/** Eigenvalues of a 2×2 symmetric matrix [[a, b], [b, d]]. */
export function eigenvalues2x2(
	a: number,
	b: number,
	d: number,
): [number, number] {
	const trace = a + d;
	const determinant = a * d - b * b;
	const discriminant = Math.sqrt(Math.max(0, trace ** 2 - 4 * determinant));
	return [(trace + discriminant) / 2, (trace - discriminant) / 2];
}

/** Von Neumann entropy for a normalised 2×2 symmetric density matrix. */
export function vonNeumannEntropy2x2(a: number, b: number, d: number): number {
	const trace = a + d;
	if (trace <= 0) return 0;
	const [lambda1, lambda2] = eigenvalues2x2(a / trace, b / trace, d / trace);
	const entropyTerm = (lambda: number) =>
		lambda <= 0 ? 0 : -safeEval("lambda * log(lambda, 2)", { lambda });
	return entropyTerm(lambda1) + entropyTerm(lambda2);
}

/** Weighted quality penalty used by qm-hamiltonian-descent. */
export function qualityPenalty(
	complexity: number,
	coupling: number,
	coverage: number,
	churn: number,
): number {
	return safeEval(
		"0.3 * complexity + 0.3 * coupling + 0.2 * (1 - coverage) + 0.2 * churn",
		{
			complexity: clampUnit(complexity),
			coupling: clampUnit(coupling),
			coverage: clampUnit(coverage),
			churn: clampUnit(churn),
		},
	);
}

/** Energy eigenvalue proxy E = 1 − penalty. */
export function energyFromPenalty(penalty: number): number {
	return safeEval("1 - penalty", { penalty: clampUnit(penalty) });
}

/** Arithmetic mean with empty-array guard. */
export function arithmeticMean(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Population standard deviation with empty-array guard. */
export function standardDeviation(values: number[]): number {
	if (values.length === 0) return 0;
	const mean = arithmeticMean(values);
	return Math.sqrt(
		values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length,
	);
}

/** Pearson correlation for equal-length numeric series. */
export function pearsonCorrelation(a: number[], b: number[]): number {
	const length = Math.min(a.length, b.length);
	if (length < 2) return 0;
	const left = a.slice(0, length);
	const right = b.slice(0, length);
	const meanA = arithmeticMean(left);
	const meanB = arithmeticMean(right);
	let numerator = 0;
	let denomA = 0;
	let denomB = 0;
	for (let index = 0; index < length; index += 1) {
		const deltaA = (left[index] ?? 0) - meanA;
		const deltaB = (right[index] ?? 0) - meanB;
		numerator += deltaA * deltaB;
		denomA += deltaA ** 2;
		denomB += deltaB ** 2;
	}
	const denominator = Math.sqrt(denomA * denomB);
	return denominator === 0 ? 0 : numerator / denominator;
}

/** Exponential path-integral weight exp(−action / temperature). */
export function pathIntegralWeight(
	action: number,
	temperature: number,
): number {
	return evaluate("exp(-action / temperature)", {
		action: Math.max(0, action),
		temperature: Math.max(0.01, temperature),
	}) as number;
}

/** Sum squared overlaps and clamp to a probability. */
export function bornCoverageProbability(overlaps: number[]): number {
	return clampUnit(overlaps.reduce((sum, overlap) => sum + overlap ** 2, 0));
}

/** Risk × uncovered probability. */
export function bornWeightedRisk(risk: number, coverage: number): number {
	return evaluate("risk * (1 - coverage)", {
		risk: clampUnit(risk),
		coverage: clampUnit(coverage),
	}) as number;
}
