// Prompt sections types
import { z } from "zod";

export type { Provider } from "../../config/generated/index.js";
// Import ProviderEnum from generated types
export { ProviderEnum } from "../../config/generated/index.js";

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

export const StyleEnum = z.enum(["markdown", "xml"]);

export type Technique = z.infer<typeof TechniqueEnum>;
export type Style = z.infer<typeof StyleEnum>;
