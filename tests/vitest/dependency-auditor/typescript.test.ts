/**
 * Tests for TypeScript Config parser (tsconfig.json)
 */
import { describe, expect, it } from "vitest";
import { TypeScriptConfigParser } from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("TypeScript Config parsing", () => {
	it("parses basic tsconfig.json with types", async () => {
		const tsConfig = JSON.stringify({
			compilerOptions: {
				target: "ES2020",
				module: "commonjs",
				strict: true,
				types: ["node", "jest"],
			},
		});
		const result = await dependencyAuditor({
			dependencyContent: tsConfig,
			fileType: "tsconfig.json",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		// Check that parsing works - 2 type definitions found
		expect(text).toMatch(/Total Packages\s*\|\s*2/i);
		expect(text).toMatch(/Ecosystem\s*\|\s*typescript/i);
	});

	it("parses project references", async () => {
		const tsConfig = JSON.stringify({
			compilerOptions: {
				composite: true,
			},
			references: [{ path: "../common" }, { path: "../utils" }],
		});
		const parser = new TypeScriptConfigParser();
		const result = parser.parse(tsConfig);
		expect(result.packages).toHaveLength(2);
		expect(result.packages[0].name).toBe("../common");
		expect(result.packages[0].source).toBe("project-reference");
	});

	it("parses extended configs", async () => {
		const tsConfig = JSON.stringify({
			extends: "@tsconfig/node18/tsconfig.json",
			compilerOptions: {
				outDir: "./dist",
			},
		});
		const parser = new TypeScriptConfigParser();
		const result = parser.parse(tsConfig);
		expect(result.packages).toHaveLength(1);
		expect(result.packages[0].name).toBe("@tsconfig/node18/tsconfig.json");
		expect(result.packages[0].source).toBe("extends");
	});

	it("detects deprecated type definitions", async () => {
		const tsConfig = JSON.stringify({
			compilerOptions: {
				types: ["node-fetch"],
			},
		});
		const result = await dependencyAuditor({
			dependencyContent: tsConfig,
			fileType: "tsconfig.json",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated|node-fetch/i);
	});

	it("detects outdated tsconfig extends", async () => {
		const tsConfig = JSON.stringify({
			extends: "@tsconfig/node12",
			compilerOptions: {},
		});
		const result = await dependencyAuditor({
			dependencyContent: tsConfig,
			fileType: "tsconfig.json",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Outdated|node12|EOL/i);
	});

	describe("TypeScriptConfigParser", () => {
		it("canParse validates correctly", () => {
			const parser = new TypeScriptConfigParser();
			expect(parser.canParse('{"compilerOptions": {}}')).toBe(true);
			expect(parser.canParse('{"extends": "@tsconfig/node18"}')).toBe(true);
			expect(parser.canParse('{"references": []}')).toBe(true);
			expect(parser.canParse('{"include": ["src/**/*"]}')).toBe(true);
			expect(parser.canParse('{"exclude": ["node_modules"]}')).toBe(true);
			expect(parser.canParse('{"files": ["src/index.ts"]}')).toBe(true);
			// Should not match package.json
			expect(parser.canParse('{"dependencies": {}}')).toBe(false);
			expect(parser.canParse('{"devDependencies": {}}')).toBe(false);
		});

		it("returns correct ecosystem and file type", () => {
			const parser = new TypeScriptConfigParser();
			expect(parser.getEcosystem()).toBe("typescript");
			expect(parser.getFileTypes()).toContain("tsconfig.json");
		});

		it("handles invalid JSON gracefully", () => {
			const parser = new TypeScriptConfigParser();
			const result = parser.parse("{ invalid json }");
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
		});

		it("extracts @types/ prefix correctly", () => {
			const parser = new TypeScriptConfigParser();
			const tsConfig = JSON.stringify({
				compilerOptions: {
					types: ["node", "@types/express", "jest"],
				},
			});
			const result = parser.parse(tsConfig);
			expect(result.packages).toHaveLength(3);
			// "node" should become "@types/node"
			expect(result.packages[0].name).toBe("@types/node");
			// "@types/express" should remain as is
			expect(result.packages[1].name).toBe("@types/express");
			// "jest" should become "@types/jest"
			expect(result.packages[2].name).toBe("@types/jest");
		});
	});

	describe("TypeScriptConfigParser analysis", () => {
		it("analyzes packages with correct options", () => {
			const parser = new TypeScriptConfigParser();
			const tsConfig = JSON.stringify({
				extends: "@tsconfig/node14",
				compilerOptions: {
					types: ["node-fetch"],
				},
			});
			const parseResult = parser.parse(tsConfig);
			const analysisResult = parser.analyze(parseResult, {
				checkOutdated: true,
				checkDeprecated: true,
				checkVulnerabilities: false,
				suggestAlternatives: false,
				analyzeBundleSize: false,
			});
			// Should have issues for deprecated node-fetch types and outdated node14
			expect(analysisResult.issues.length).toBeGreaterThan(0);
		});

		it("generates ecosystem-specific recommendations when there are issues", () => {
			const parser = new TypeScriptConfigParser();
			const tsConfig = JSON.stringify({
				extends: "@tsconfig/node12",
				compilerOptions: {
					types: ["node"],
				},
			});
			const parseResult = parser.parse(tsConfig);
			const analysisResult = parser.analyze(parseResult, {
				checkOutdated: true,
				checkDeprecated: false,
				checkVulnerabilities: false,
				suggestAlternatives: false,
				analyzeBundleSize: false,
			});
			// When there are issues, ecosystem-specific recommendations should be added
			expect(analysisResult.issues.length).toBeGreaterThan(0);
			expect(
				analysisResult.recommendations.some((r) => r.includes("tsc --noEmit")),
			).toBe(true);
		});
	});
});
