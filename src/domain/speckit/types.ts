import { z } from "zod";

export const ObjectiveSchema = z.object({
	description: z.string().min(1),
	priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
});

export const RequirementSchema = z.object({
	description: z.string().min(1),
	type: z
		.enum(["functional", "non-functional"])
		.optional()
		.default("functional"),
	priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
});

export const SpecKitInputSchema = z.object({
	title: z.string().min(1, "Title is required"),
	overview: z.string().min(1, "Overview is required"),
	objectives: z
		.array(ObjectiveSchema)
		.min(1, "At least one objective required"),
	requirements: z
		.array(RequirementSchema)
		.min(1, "At least one requirement required"),
	acceptanceCriteria: z.array(z.string()).optional().default([]),
	outOfScope: z.array(z.string()).optional().default([]),
	constitutionPath: z.string().optional(),
	validateAgainstConstitution: z.boolean().optional().default(false),
});

export type SpecKitInput = z.infer<typeof SpecKitInputSchema>;
export type Objective = z.infer<typeof ObjectiveSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;

export interface MarkdownSection {
	title: string;
	content: string;
	generatedAt: Date;
	tokenEstimate: number;
}

export interface ValidationIssue {
	ruleId: string;
	message: string;
	severity: "error" | "warning";
	location?: string;
}

export interface ValidationResult {
	isValid: boolean;
	score: number;
	errors: ValidationIssue[];
	warnings: ValidationIssue[];
	recommendations: string[];
}

export interface ConstitutionRule {
	id: string;
	description: string;
	severity: "error" | "warning";
	check: (state: SessionState) => boolean;
}

export interface ConstitutionConstraints {
	path: string;
	loadedAt: Date;
	rules: ConstitutionRule[];
}

export interface SessionState {
	input: SpecKitInput;
	constitution: ConstitutionConstraints | null;
	sections: {
		readme: MarkdownSection | null;
		spec: MarkdownSection | null;
		plan: MarkdownSection | null;
		tasks: MarkdownSection | null;
		progress: MarkdownSection | null;
		adr: MarkdownSection | null;
		roadmap: MarkdownSection | null;
	};
	metadata: {
		startedAt: Date;
		totalTokensEstimate: number;
		warnings: string[];
	};
}

export interface OutputArtifacts {
	readme: string;
	spec: string;
	plan: string;
	tasks: string;
	progress: string;
	adr: string;
	roadmap: string;
}

export interface ProcessingStats {
	totalDuration: number;
	documentsGenerated: number;
	totalTokens: number;
	warnings: string[];
}

export interface SpecKitOutput {
	artifacts: OutputArtifacts;
	validation: ValidationResult | null;
	stats: ProcessingStats;
}

export function createInitialSessionState(input: SpecKitInput): SessionState {
	return {
		input,
		constitution: null,
		sections: {
			readme: null,
			spec: null,
			plan: null,
			tasks: null,
			progress: null,
			adr: null,
			roadmap: null,
		},
		metadata: {
			startedAt: new Date(),
			totalTokensEstimate: 0,
			warnings: [],
		},
	};
}

export function createDefaultOutput(): SpecKitOutput {
	return {
		artifacts: {
			readme: "",
			spec: "",
			plan: "",
			tasks: "",
			progress: "",
			adr: "",
			roadmap: "",
		},
		validation: null,
		stats: {
			totalDuration: 0,
			documentsGenerated: 0,
			totalTokens: 0,
			warnings: [],
		},
	};
}
