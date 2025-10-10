// Guidelines configuration types

export interface Criterion {
	id: string;
	keywords: string[];
	weight: number;
	strength: string;
	issue: string;
	recommendation: string;
	optional?: boolean;
}

export interface CategoryConfig {
	base: number;
	criteria: Criterion[];
	bestPractices: string[];
}
