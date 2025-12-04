// AUTO-GENERATED - DO NOT EDIT
// Generated from models.yaml on 2025-12-04
// Run `npm run generate:models` to regenerate
//
// Mode enum for model capability categorization

import { z } from "zod";

/**
 * Mode enum - Generated from models.yaml
 * Represents different operational modes/capabilities of AI models
 */
export const ModeEnum = z.enum([
	"agent",
	"chat",
	"completions",
	"edit",
	"reasoning",
	"vision",
]);

/**
 * Mode type inferred from ModeEnum
 */
export type Mode = z.infer<typeof ModeEnum>;

/**
 * Raw array of mode values for use in schemas
 */
export const MODE_ENUM_VALUES = ModeEnum.options;
