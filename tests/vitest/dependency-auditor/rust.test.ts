/**
 * Tests for Rust Cargo.toml parser - vulnerabilities and deprecations
 */
import { describe, expect, it } from "vitest";
import { RustCargoParser } from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("Rust Cargo.toml parsing", () => {
	it("detects deprecated failure crate", async () => {
		const cargoToml = `[package]\nname = "test"\nversion = "0.1.0"\n\n[dependencies]\nfailure = "0.1.8"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated|failure/i);
	});

	it("detects deprecated error_chain crate", async () => {
		const cargoToml = `[package]\nname = "test"\nversion = "0.1.0"\n\n[dependencies]\nerror_chain = "0.12"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated|error_chain/i);
	});

	it("detects wildcard versions", async () => {
		const cargoToml = `[package]\nname = "test"\nversion = "0.1.0"\n\n[dependencies]\nserde = "*"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Unpinned Version|wildcard/i);
	});

	it("detects pre-1.0 versions", async () => {
		const cargoToml = `[package]\nname = "test"\nversion = "0.1.0"\n\n[dependencies]\nsome-crate = "0.5.0"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Pre-1\.0/i);
	});

	it("detects regex crate vulnerabilities", async () => {
		const cargoToml = `[package]\nname = "test"\nversion = "0.1.0"\n\n[dependencies]\nregex = "1.5.0"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|ReDoS|regex/i);
	});

	it("detects chrono crate vulnerabilities", async () => {
		const cargoToml = `[package]\nname = "test"\nversion = "0.1.0"\n\n[dependencies]\nchrono = "0.2.0"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|chrono/i);
	});

	it("parses dev-dependencies and build-dependencies", async () => {
		const cargoToml = `[package]\nname = "test"\nversion = "0.1.0"\n\n[dependencies]\nserde = "1.0"\n\n[dev-dependencies]\ncriterion = "0.5"\n\n[build-dependencies]\ncc = "1.0"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Dev Dependencies\s*\|\s*1/i);
	});

	it("parses complex dependency format with features", async () => {
		const cargoToml = `[package]\nname = "test"\nversion = "0.1.0"\n\n[dependencies]\nserde = { version = "1.0", features = ["derive"] }`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/serde|Dependencies\s*\|\s*1/i);
	});

	it("RustCargoParser.canParse validates correctly", () => {
		const parser = new RustCargoParser();
		expect(parser.canParse('[package]\nname = "test"')).toBe(true);
		expect(parser.canParse('[dependencies]\nserde = "1.0"')).toBe(true);
		expect(parser.canParse('{"dependencies": {}}')).toBe(false);
	});
});
