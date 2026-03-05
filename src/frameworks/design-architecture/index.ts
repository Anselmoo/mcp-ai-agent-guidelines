/**
 * Design & Architecture Framework — unified entry point (T-041).
 *
 * Consolidates:
 * - architecture-design-prompt-builder
 * - l9-distinguished-engineer-prompt-builder
 * - digital-enterprise-architect-prompt-builder
 * - design-assistant (design-session)
 */

import type { FrameworkDefinition } from "../types.js";
import { routeDesignArchitectureAction } from "./router.js";
import { DesignArchitectureInputSchema } from "./types.js";

export const designArchitectureFramework: FrameworkDefinition = {
	name: "design-architecture",
	description:
		"Architecture & design: architecture prompts, L9 engineering, enterprise architect, design sessions.",
	version: "1.0.0",
	actions: [
		"architecture",
		"l9-engineering",
		"enterprise-architect",
		"design-session",
	],
	schema: DesignArchitectureInputSchema,

	async execute(input: unknown) {
		const validated = DesignArchitectureInputSchema.parse(input);
		return routeDesignArchitectureAction(validated);
	},
};

export {
	type DesignArchitectureInput,
	DesignArchitectureInputSchema,
} from "./types.js";
