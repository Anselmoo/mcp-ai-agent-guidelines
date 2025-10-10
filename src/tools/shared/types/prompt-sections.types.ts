// Prompt sections types
import { z } from "zod";

export const TechniqueEnum = z.enum([
	"zero-shot",
	"few-shot",
	"chain-of-thought",
	"self-consistency",
	"in-context-learning",
	"generate-knowledge",
	"prompt-chaining",
	"tree-of-thoughts",
	"meta-prompting",
	"rag",
	"react",
	"art",
]);

export const ProviderEnum = z.enum([
	"gpt-5",
	"gpt-4.1",
	"claude-4",
	"claude-3.7",
	"gemini-2.5",
	"o4-mini",
	"o3-mini",
	"other",
]);

export const StyleEnum = z.enum(["markdown", "xml"]);

export type Technique = z.infer<typeof TechniqueEnum>;
export type Provider = z.infer<typeof ProviderEnum>;
export type Style = z.infer<typeof StyleEnum>;
