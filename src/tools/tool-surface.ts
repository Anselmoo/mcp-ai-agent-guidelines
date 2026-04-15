import type { ToolInputSchema } from "../contracts/generated.js";
import type { InstructionModule } from "../contracts/runtime.js";
import type { InstructionRegistry } from "../instructions/instruction-registry.js";

/**
 * Public MCP tool shape exposed from the instruction registry.
 */
export interface PublicToolDefinition {
	name: string;
	description: string;
	inputSchema: ToolInputSchema;
	annotations?: Record<string, unknown>;
	[key: string]: unknown;
}

function buildToolDescription(module: InstructionModule): string {
	const parts = [module.manifest.description.trim()];
	if (module.manifest.mission.trim().length > 0) {
		parts.push(`Focus: ${module.manifest.mission.trim()}`);
	}
	if (module.manifest.chainTo.length > 0) {
		parts.push(
			`Related lanes: ${module.manifest.chainTo
				.slice(0, 3)
				.map((instructionId) => `\`${instructionId}\``)
				.join(", ")}`,
		);
	}
	if ((module.manifest.requiredPreconditions ?? []).length > 0) {
		parts.push(
			`Preconditions: ${(module.manifest.requiredPreconditions ?? [])
				.map((precondition) => `\`${precondition}\``)
				.join(", ")}`,
		);
	}
	if (module.manifest.reactivationPolicy) {
		parts.push(`Reactivation: \`${module.manifest.reactivationPolicy}\``);
	}
	if (module.manifest.autoChainOnCompletion) {
		parts.push(
			"Auto-chain: invokes the highest-confidence downstream lane on completion.",
		);
	}
	return parts.join(" ");
}

export function buildPublicToolSurface(
	registry: InstructionRegistry,
): PublicToolDefinition[] {
	const workflowTools = registry
		.getWorkflowFirst()
		.map((module: InstructionModule) => ({
			name: module.manifest.toolName,
			description: buildToolDescription(module),
			inputSchema: module.manifest.inputSchema,
			annotations: {
				title: module.manifest.displayName,
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
				surfaceCategory: "workflow",
				// Expose preferred model class so agent runtimes and routing layers
				// can make cost/capability decisions without calling the instruction first.
				preferredModelClass: module.manifest.preferredModelClass,
			},
		}));

	const boundedDiscoveryTools = registry
		.getBoundedDiscovery()
		.map((module: InstructionModule) => ({
			name: module.manifest.toolName,
			description: buildToolDescription(module),
			inputSchema: module.manifest.inputSchema,
			annotations: {
				title: module.manifest.displayName,
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
				surfaceCategory: "discovery",
				// Expose preferred model class so agent runtimes and routing layers
				// can make cost/capability decisions without calling the instruction first.
				preferredModelClass: module.manifest.preferredModelClass,
			},
		}));

	return [...workflowTools, ...boundedDiscoveryTools];
}
