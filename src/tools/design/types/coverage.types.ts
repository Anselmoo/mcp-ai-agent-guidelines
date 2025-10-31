// Coverage-related type definitions

export interface CoverageReport {
	overall: number;
	phases: Record<string, number>;
	constraints: Record<string, number>;
	assumptions: Record<string, number>;
	documentation: Record<string, number>;
	testCoverage: number;
}

export interface CoverageCheckResult {
	passed: boolean;
	current: number;
	threshold: number;
	gaps: string[];
}

export interface CoverageGap {
	area: string;
	current: number;
	target: number;
	severity: "high" | "medium" | "low";
}

export interface DetailedCoverage {
	overall: number;
	phases: Record<string, number>;
	constraints: Record<string, number>;
	artifacts: Record<string, number>;
	breakdown: Record<string, number>;
}

export interface ConfirmationResult {
	passed: boolean;
	coverage: number;
	issues: string[];
	recommendations: string[];
	nextSteps: string[];
	canProceed: boolean;
	phase?: string;
}

export interface ConfirmationReport {
	overall: boolean;
	phases: Record<string, boolean>;
	constraints: Record<string, boolean>;
	artifacts: Record<string, boolean>;
	recommendations: string[];
}

export interface SessionValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export interface ComplianceReport {
	overall: boolean;
	coverage: number;
	constraints: Record<string, { passed: boolean; coverage: number }>;
	violations: string[];
	recommendations: string[];
}
