export interface ScoreDetails {
	score: number;
	issues: string[];
}

export interface ScoreBreakdown {
	hygiene: ScoreDetails;
	coverage: ScoreDetails;
	documentation: ScoreDetails;
	security: ScoreDetails;
}

export interface ScoringResult {
	overallScore: number;
	breakdown: ScoreBreakdown;
	recommendations: string[];
}

export interface ScoreWeights {
	hygiene: number;
	coverage: number;
	documentation: number;
	security: number;
}
