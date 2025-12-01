/**
 * Tests for Ruby, C++, and Lua parsers
 */
import { describe, expect, it } from "vitest";
import {
	CppVcpkgParser,
	LuaRockspecParser,
	RubyGemfileParser,
} from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("Ruby Gemfile parsing", () => {
	it("parses Gemfile with groups", async () => {
		const gemfile = `source 'https://rubygems.org'\n\ngem 'rails', '~> 7.0'\n\ngroup :development do\n  gem 'pry'\nend`;
		const result = await dependencyAuditor({
			dependencyContent: gemfile,
			fileType: "Gemfile",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Ecosystem\s*\|\s*ruby/i);
	});

	it("detects deprecated coffee-rails", async () => {
		const gemfile = `source 'https://rubygems.org'\n\ngem 'rails', '~> 7.0'\ngem 'coffee-rails'`;
		const result = await dependencyAuditor({
			dependencyContent: gemfile,
			fileType: "Gemfile",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated|coffee-rails/i);
	});

	it("RubyGemfileParser.canParse validates correctly", () => {
		const parser = new RubyGemfileParser();
		expect(parser.canParse("source 'https://rubygems.org'\ngem 'rails'")).toBe(
			true,
		);
		expect(parser.canParse('{"dependencies": {}}')).toBe(false);
	});
});

describe("C++ vcpkg.json parsing", () => {
	it("parses vcpkg.json manifest", async () => {
		const vcpkgJson = JSON.stringify({
			name: "cpp-project",
			version: "1.0.0",
			dependencies: ["boost-asio", { name: "fmt", "version>=": "9.0.0" }],
		});
		const result = await dependencyAuditor({
			dependencyContent: vcpkgJson,
			fileType: "vcpkg.json",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Ecosystem\s*\|\s*cpp/i);
		expect(text).toMatch(/cpp-project/i);
	});

	it("detects unpinned versions", async () => {
		const vcpkgJson = JSON.stringify({
			name: "test",
			dependencies: ["boost"],
		});
		const result = await dependencyAuditor({
			dependencyContent: vcpkgJson,
			fileType: "vcpkg.json",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Unpinned Version/i);
	});

	it("CppVcpkgParser.canParse validates correctly", () => {
		const parser = new CppVcpkgParser();
		expect(parser.canParse('{"name": "test", "dependencies": ["boost"]}')).toBe(
			true,
		);
	});
});

describe("Lua rockspec parsing", () => {
	it("parses rockspec file", async () => {
		const rockspec = `package = "my-lua-pkg"\nversion = "2.0.0-1"\nsource = { url = "git://github.com/example/pkg" }\ndependencies = { "lua >= 5.1", "luasocket >= 3.0" }`;
		const result = await dependencyAuditor({
			dependencyContent: rockspec,
			fileType: "rockspec",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Ecosystem\s*\|\s*lua/i);
		expect(text).toMatch(/my-lua-pkg/i);
	});

	it("LuaRockspecParser.canParse validates correctly", () => {
		const parser = new LuaRockspecParser();
		expect(
			parser.canParse('package = "test"\nversion = "1.0-1"\nsource = {}'),
		).toBe(true);
		expect(parser.canParse('{"dependencies": {}}')).toBe(false);
	});
});
