import type { z } from "zod";

export type PromptDomain =
	| "hierarchical"
	| "security"
	| "architecture"
	| "code-analysis"
	| "domain-neutral"
	| "documentation"
	| "debugging"
	| "spark"
	| "enterprise"
	| "l9-engineer"
	| "quick-prompts"
	| "coverage-dashboard";

export type PromptTechnique =
	| "zero-shot"
	| "few-shot"
	| "chain-of-thought"
	| "self-consistency"
	| "tree-of-thoughts"
	| "react"
	| "rag"
	| "meta-prompting"
	| "art"
	| "prompt-chaining"
	| "in-context-learning"
	| "generate-knowledge"
	| "scaffolding";

export type PromptStyle = "markdown" | "xml";

export interface PromptSection {
	id: string;
	title: string;
	content: string;
	required: boolean;
	order: number;
}

export interface BasePromptRequest {
	style?: PromptStyle;
	techniques?: PromptTechnique[];
	includeMetadata?: boolean;
	includeReferences?: boolean;
	includeTechniqueHints?: boolean;
	provider?: string;
}

export interface GeneratorOptions {
	techniques: PromptTechnique[];
	provider: string;
	includeTechniqueHints: boolean;
}

export interface GeneratorMetadata {
	domain: PromptDomain;
	generatedAt: Date;
	techniques: PromptTechnique[];
	tokenEstimate: number;
}

export interface GeneratorResult {
	sections: PromptSection[];
	metadata: GeneratorMetadata;
}

export interface PromptGenerator<
	TRequest extends BasePromptRequest = BasePromptRequest,
> {
	readonly domain: PromptDomain;
	readonly version: string;
	readonly description: string;
	readonly requestSchema: z.ZodSchema<TRequest>;
	generate(
		request: TRequest,
		options?: Partial<GeneratorOptions>,
	): GeneratorResult;
	recommendTechniques(request: TRequest): PromptTechnique[];
}

export type GeneratorFactory<T extends BasePromptRequest = BasePromptRequest> =
	() => PromptGenerator<T>;

export interface RegistryEntry {
	factory: GeneratorFactory;
	singleton?: PromptGenerator;
}

export interface RegistryListItem {
	domain: PromptDomain;
	version: string;
	description: string;
}
