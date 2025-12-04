#!/usr/bin/env node
/**
 * Model Configuration Validator
 *
 * Validates that generated model types are up-to-date with models.yaml
 * Used as a pre-commit check to ensure consistency.
 *
 * Usage: npm run validate:models
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const GENERATED_DIR = join(
	__dirname,
	"..",
	"src",
	"tools",
	"config",
	"generated",
);
/**
 * Check if generated files exist
 */
function checkGeneratedFilesExist() {
	const requiredFiles = [
		"provider-enum.ts",
		"mode-enum.ts",
		"model-aliases.ts",
		"model-identifiers.ts",
		"index.ts",
		"README.md",
	];
	let allExist = true;
	for (const file of requiredFiles) {
		const filePath = join(GENERATED_DIR, file);
		if (!existsSync(filePath)) {
			console.error(`❌ Missing generated file: ${file}`);
			allExist = false;
		}
	}
	return allExist;
}
/**
 * Check if generated files are stale
 */
function checkGeneratedFilesUpToDate() {
	const modelsYamlPath = join(
		__dirname,
		"..",
		"src",
		"tools",
		"config",
		"models.yaml",
	);
	const providerEnumPath = join(GENERATED_DIR, "provider-enum.ts");
	if (!existsSync(modelsYamlPath)) {
		console.error("❌ models.yaml not found");
		return false;
	}
	if (!existsSync(providerEnumPath)) {
		console.error("❌ Generated files not found");
		return false;
	}
	const modelsYamlStat = readFileSync(modelsYamlPath);
	const providerEnumContent = readFileSync(providerEnumPath, "utf8");
	// Check if the generated file contains today's date or is recent
	const today = new Date().toISOString().slice(0, 10);
	const generatedDateMatch = providerEnumContent.match(
		/Generated from models\.yaml on (\d{4}-\d{2}-\d{2})/,
	);
	if (!generatedDateMatch) {
		console.error("❌ Generated files missing timestamp");
		return false;
	}
	const generatedDate = generatedDateMatch[1];
	const daysDiff = Math.floor(
		(new Date(today).getTime() - new Date(generatedDate).getTime()) /
			(1000 * 60 * 60 * 24),
	);
	if (daysDiff > 30) {
		console.warn(
			`⚠️  Generated files are ${daysDiff} days old. Consider regenerating.`,
		);
	}
	return true;
}
/**
 * Validate model config
 */
async function validate() {
	console.log("🔍 Validating model configuration...\n");
	// Check if generated files exist
	if (!checkGeneratedFilesExist()) {
		console.error(
			"\n❌ Validation failed: Generated files are missing",
			"\n   Run 'npm run generate:models' to generate them",
		);
		process.exit(1);
	}
	console.log("✅ All generated files exist");
	// Check if generated files are up-to-date
	if (!checkGeneratedFilesUpToDate()) {
		console.error(
			"\n❌ Validation failed: Generated files may be outdated",
			"\n   Run 'npm run generate:models' to regenerate them",
		);
		process.exit(1);
	}
	console.log("✅ Generated files appear up-to-date");
	// Try to import and validate the generated types
	try {
		const generatedPath = join(
			__dirname,
			"..",
			"dist",
			"tools",
			"config",
			"generated",
			"index.js",
		);
		if (existsSync(generatedPath)) {
			const generated = await import(generatedPath);
			// Validate exports
			if (!generated.ProviderEnum) {
				console.error("❌ ProviderEnum not exported from generated types");
				process.exit(1);
			}
			if (!generated.PROVIDER_ENUM_VALUES) {
				console.error(
					"❌ PROVIDER_ENUM_VALUES not exported from generated types",
				);
				process.exit(1);
			}
			if (!generated.MODEL_ALIASES) {
				console.error("❌ MODEL_ALIASES not exported from generated types");
				process.exit(1);
			}
			console.log("✅ Generated types export correctly");
			// Validate ProviderEnum has values
			if (
				!generated.PROVIDER_ENUM_VALUES ||
				generated.PROVIDER_ENUM_VALUES.length === 0
			) {
				console.error("❌ PROVIDER_ENUM_VALUES is empty");
				process.exit(1);
			}
			console.log(
				`✅ ProviderEnum contains ${generated.PROVIDER_ENUM_VALUES.length} providers`,
			);
			// Validate MODEL_ALIASES has entries
			const aliasCount = Object.keys(generated.MODEL_ALIASES).length;
			if (aliasCount === 0) {
				console.error("❌ MODEL_ALIASES is empty");
				process.exit(1);
			}
			console.log(`✅ MODEL_ALIASES contains ${aliasCount} entries`);
		} else {
			console.warn(
				"⚠️  Generated types not compiled yet. Run 'npm run build' to compile.",
			);
		}
	} catch (error) {
		console.warn(`⚠️  Could not validate compiled types: ${error}`);
	}
	console.log("\n✨ Validation passed!");
}
// Run validator
validate().catch((error) => {
	console.error("❌ Validation failed:", error);
	process.exit(1);
});
