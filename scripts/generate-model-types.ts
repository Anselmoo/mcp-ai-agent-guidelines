#!/usr/bin/env node
/**
 * Model Type Generator
 *
 * Generates TypeScript types, enums, and constants from models.yaml
 * Eliminates hardcoded model references across the codebase.
 *
 * Usage: npm run generate:models
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Output directory
const OUTPUT_DIR = join(__dirname, "..", "src", "tools", "config", "generated");

// Load models from YAML (will use the existing model-loader)
// For now, we'll import dynamically after building
interface ModelDefinition {
	name: string;
	provider: string;
	pricingTier: string;
	contextTokens: number;
	baseScore: number;
	capabilities: string[];
	strengths: string[];
	limitations: string[];
	specialFeatures: string[];
	pricing: string;
	modes?: {
		agent?: boolean;
		reasoning?: boolean;
		vision?: boolean;
		chat?: boolean;
		edit?: boolean;
		completions?: boolean;
	};
	taskArea?: string;
	multiplier?: number;
	status?: string;
	documentationUrl?: string;
}

interface ModelsConfig {
	defaultModel?: string;
	models: ModelDefinition[];
}

/**
 * Slugify model name to create enum-friendly identifier
 */
function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s.-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

/**
 * Get current timestamp for header
 */
function getTimestamp(): string {
	return new Date().toISOString().slice(0, 10);
}

/**
 * Generate file header
 */
function generateHeader(description: string): string {
	return `// AUTO-GENERATED - DO NOT EDIT
// Generated from models.yaml on ${getTimestamp()}
// Run \`npm run generate:models\` to regenerate
//
// ${description}

`;
}

/**
 * Generate provider enum from models
 */
function generateProviderEnum(models: ModelDefinition[]): string {
	const providers = [...new Set(models.map((m) => slugify(m.name)))];
	// Add "other" as a catch-all
	if (!providers.includes("other")) {
		providers.push("other");
	}

	const enumValues = providers.map((p) => `\t"${p}",`).join("\n");

	return `${generateHeader("Provider enum for model selection across prompt builders")}import { z } from "zod";

/**
 * Provider enum - Generated from models.yaml
 * Represents all available AI model providers
 */
export const ProviderEnum = z.enum([
${enumValues}
]);

/**
 * Provider type inferred from ProviderEnum
 */
export type Provider = z.infer<typeof ProviderEnum>;

/**
 * Raw array of provider values for use in schemas
 * Use this in JSON schemas where zod enums cannot be used directly
 */
export const PROVIDER_ENUM_VALUES = ProviderEnum.options;
`;
}

/**
 * Generate mode enum from model capabilities
 */
function generateModeEnum(models: ModelDefinition[]): string {
	const modes = new Set<string>();

	// Extract all mode types from models
	for (const model of models) {
		if (model.modes) {
			for (const mode of Object.keys(model.modes)) {
				modes.add(mode);
			}
		}
	}

	// Add standard modes if not present
	modes.add("agent");
	modes.add("reasoning");
	modes.add("vision");
	modes.add("chat");
	modes.add("edit");
	modes.add("completions");

	const enumValues = Array.from(modes)
		.sort()
		.map((m) => `\t"${m}",`)
		.join("\n");

	return `${generateHeader("Mode enum for model capability categorization")}import { z } from "zod";

/**
 * Mode enum - Generated from models.yaml
 * Represents different operational modes/capabilities of AI models
 */
export const ModeEnum = z.enum([
${enumValues}
]);

/**
 * Mode type inferred from ModeEnum
 */
export type Mode = z.infer<typeof ModeEnum>;

/**
 * Raw array of mode values for use in schemas
 */
export const MODE_ENUM_VALUES = ModeEnum.options;
`;
}

/**
 * Generate model aliases mapping
 */
function generateModelAliases(models: ModelDefinition[]): string {
	const aliases = models
		.map((m) => `\t"${slugify(m.name)}": "${m.name}",`)
		.join("\n");

	return `${generateHeader("Model name aliases for display and normalization")}/**
 * Model aliases mapping - Generated from models.yaml
 * Maps slugified model identifiers to display names
 */
export const MODEL_ALIASES: Record<string, string> = {
${aliases}
};

/**
 * Get display name for a model identifier
 * @param identifier - Slugified model identifier
 * @returns Display name or the identifier if not found
 */
export function getModelDisplayName(identifier: string): string {
	return MODEL_ALIASES[identifier] || identifier;
}

/**
 * Check if a model identifier is valid
 * @param identifier - Model identifier to check
 * @returns true if the identifier exists in MODEL_ALIASES
 */
export function isValidModelIdentifier(identifier: string): boolean {
	return identifier in MODEL_ALIASES;
}
`;
}

/**
 * Generate model identifiers constants
 */
function generateModelIdentifiers(models: ModelDefinition[]): string {
	const constants = models
		.map((m) => {
			const constantName = m.name
				.toUpperCase()
				.replace(/[^A-Z0-9]/g, "_")
				.replace(/_+/g, "_")
				.replace(/^_|_$/g, "");
			return `export const ${constantName} = "${slugify(m.name)}";`;
		})
		.join("\n");

	return `${generateHeader("Model identifier constants for type-safe model references")}/**
 * Model identifier constants - Generated from models.yaml
 * Use these constants for type-safe model references in code
 */

${constants}

/**
 * All model identifiers as a constant array
 */
export const ALL_MODEL_IDENTIFIERS = [
${models.map((m) => `\t"${slugify(m.name)}",`).join("\n")}
] as const;

/**
 * Type representing any valid model identifier
 */
export type ModelIdentifier = (typeof ALL_MODEL_IDENTIFIERS)[number];
`;
}

/**
 * Generate barrel index file
 */
function generateIndex(): string {
	return `${generateHeader("Barrel export for all generated model types")}// Provider enum
export { ProviderEnum, PROVIDER_ENUM_VALUES } from "./provider-enum.js";
export type { Provider } from "./provider-enum.js";

// Mode enum
export { ModeEnum, MODE_ENUM_VALUES } from "./mode-enum.js";
export type { Mode } from "./mode-enum.js";

// Model aliases
export {
	MODEL_ALIASES,
	getModelDisplayName,
	isValidModelIdentifier,
} from "./model-aliases.js";

// Model identifiers
export {
	ALL_MODEL_IDENTIFIERS,
	// Individual model constants are re-exported as needed
} from "./model-identifiers.js";
export type { ModelIdentifier } from "./model-identifiers.js";
`;
}

/**
 * Generate README
 */
function generateReadme(): string {
	return `# Generated Model Types

**⚠️ AUTO-GENERATED - DO NOT EDIT DIRECTLY**
**🚫 NOT COMMITTED TO GIT - Regenerated at Build Time**

This directory contains TypeScript types, enums, and constants automatically generated from \`models.yaml\`.

## Important: These Files Are Gitignored

These files are **NOT tracked in version control**. They are automatically regenerated during the build process:

- Generated at build time by \`npm run build\`
- Source of truth: \`src/tools/config/models.yaml\`
- Output: \`src/tools/config/generated/*.ts\` (gitignored)

## Generated Files

- \`provider-enum.ts\` - ProviderEnum for model selection
- \`mode-enum.ts\` - ModeEnum for model capabilities
- \`model-aliases.ts\` - MODEL_ALIASES for display name mapping
- \`model-identifiers.ts\` - Model identifier constants
- \`index.ts\` - Barrel export for all generated types

## Developer Workflow

After cloning or pulling changes to \`models.yaml\`:

\`\`\`bash
npm run build
\`\`\`

This will automatically regenerate all types. No manual intervention needed!

## Manual Regeneration (Optional)

To regenerate without a full build:

\`\`\`bash
npm run generate:models
\`\`\`

## Usage

Import from the generated types:

\`\`\`typescript
import { ProviderEnum, MODEL_ALIASES, PROVIDER_ENUM_VALUES } from "./tools/config/generated/index.js";
\`\`\`

## Integration

These generated types are used across the codebase:
- \`src/tools/shared/types/prompt-sections.types.ts\` - ProviderEnum
- \`src/tools/shared/prompt-utils.ts\` - MODEL_ALIASES
- \`src/index.ts\` - PROVIDER_ENUM_VALUES

## Architecture

See [ADR-0001](../../../docs/adr/ADR-0001-build-time-model-type-generation.md) for the architectural decision to generate types at build time.

**Single Source of Truth:** \`models.yaml\` is the only file that needs to be maintained and committed.

Last generated: ${getTimestamp()}
`;
}

/**
 * Main generator function
 */
async function generateTypes() {
	console.log("🔄 Generating model types from models.yaml...\n");

	// Create output directory
	try {
		mkdirSync(OUTPUT_DIR, { recursive: true });
		console.log(`✅ Created output directory: ${OUTPUT_DIR}`);
	} catch (error) {
		console.error(`❌ Failed to create output directory: ${error}`);
		process.exit(1);
	}

	// Load models directly from YAML (no dependency on dist/)
	let models: ModelDefinition[];
	try {
		const yamlPath = join(
			__dirname,
			"..",
			"src",
			"tools",
			"config",
			"models.yaml",
		);
		console.log(`📖 Reading YAML from: ${yamlPath}`);

		const yamlContent = readFileSync(yamlPath, "utf8");
		const config = yaml.load(yamlContent) as ModelsConfig;

		if (!config.models || !Array.isArray(config.models)) {
			throw new Error("Invalid models.yaml: 'models' array not found");
		}

		models = config.models;
		console.log(`✅ Loaded ${models.length} models from YAML`);
	} catch (error) {
		console.error(
			`❌ Failed to load models from YAML: ${error}\n` +
				"   Make sure models.yaml exists and is valid YAML.",
		);
		process.exit(1);
	}

	// Generate files
	const files = [
		{
			name: "provider-enum.ts",
			content: generateProviderEnum(models),
		},
		{
			name: "mode-enum.ts",
			content: generateModeEnum(models),
		},
		{
			name: "model-aliases.ts",
			content: generateModelAliases(models),
		},
		{
			name: "model-identifiers.ts",
			content: generateModelIdentifiers(models),
		},
		{
			name: "index.ts",
			content: generateIndex(),
		},
		{
			name: "README.md",
			content: generateReadme(),
		},
	];

	for (const file of files) {
		try {
			const filePath = join(OUTPUT_DIR, file.name);
			writeFileSync(filePath, file.content, "utf8");
			console.log(`✅ Generated ${file.name}`);
		} catch (error) {
			console.error(`❌ Failed to generate ${file.name}: ${error}`);
			process.exit(1);
		}
	}

	console.log("\n✨ Model types generated successfully!");
	console.log(`📁 Output directory: ${OUTPUT_DIR}`);
	console.log("\n💡 Next steps:");
	console.log("   1. Run 'npm run build' to compile generated types");
	console.log("   2. Update imports in prompt-sections.types.ts");
	console.log("   3. Update imports in prompt-utils.ts");
	console.log("   4. Update imports in index.ts (3 locations)");
}

// Run generator
generateTypes().catch((error) => {
	console.error("❌ Generation failed:", error);
	process.exit(1);
});
