/**
 * Parser Registry and Exports
 *
 * This module exports all language-specific parsers and provides
 * factory functions for parser detection and selection.
 */

import type { DependencyParser, PackageFileType } from "../types.js";

// Export base utilities
export { BaseParser, PATTERNS } from "./base.js";
export { CppVcpkgParser } from "./cpp.js";
export { DotNetCsprojParser } from "./dotnet.js";
export { GoModParser } from "./go.js";
// Export language-specific parsers
export { JavaScriptParser, JsParser } from "./javascript.js";
export { LuaRockspecParser } from "./lua.js";
export {
	PyProjectParser,
	PyRequirementsParser,
	PythonPyprojectParser,
	PythonRequirementsParser,
} from "./python.js";
export { RubyGemfileParser } from "./ruby.js";
export { RustCargoParser } from "./rust.js";

import { CppVcpkgParser } from "./cpp.js";
import { DotNetCsprojParser } from "./dotnet.js";
import { GoModParser } from "./go.js";
// Import parsers for registry
import { JavaScriptParser } from "./javascript.js";
import { LuaRockspecParser } from "./lua.js";
import { PythonPyprojectParser, PythonRequirementsParser } from "./python.js";
import { RubyGemfileParser } from "./ruby.js";
import { RustCargoParser } from "./rust.js";

/**
 * Parser Registry
 *
 * Order matters! More specific parsers should come first.
 * - JSON-based parsers first (they try JSON.parse and check specific keys)
 * - XML-based parsers next (csproj)
 * - Then format-specific parsers (they have unique identifiers)
 * - Python requirements parser last (it's the most permissive)
 */
const parsers: DependencyParser[] = [
	new JavaScriptParser(), // JSON with dependencies/devDependencies
	new CppVcpkgParser(), // JSON with dependencies but no devDependencies
	new DotNetCsprojParser(), // XML with <Project> and <PackageReference>
	new RustCargoParser(), // TOML with [package] or [dependencies]
	new PythonPyprojectParser(), // TOML with [project] or [tool.poetry]
	new GoModParser(), // Has "module " and "require " or "go "
	new RubyGemfileParser(), // Has "source " and "gem "
	new LuaRockspecParser(), // Lua-style with rockspec_format or package/source =
	new PythonRequirementsParser(), // Most permissive - matches package==version style
];

/**
 * Detect the file type and return the appropriate parser
 */
export function detectParser(content: string): DependencyParser | null {
	for (const parser of parsers) {
		if (parser.canParse(content)) {
			return parser;
		}
	}
	return null;
}

/**
 * Get parser for a specific file type
 */
export function getParserForFileType(
	fileType: PackageFileType,
): DependencyParser | null {
	for (const parser of parsers) {
		if (parser.getFileTypes().includes(fileType)) {
			return parser;
		}
	}
	return null;
}

/**
 * Get all registered parsers
 */
export function getAllParsers(): DependencyParser[] {
	return [...parsers];
}
