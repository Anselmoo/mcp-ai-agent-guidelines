/**
 * Tests for XmlRenderer — XML escaping and output structure.
 *
 * @module tests/domain/prompts/renderers/xml-renderer
 */

import { describe, expect, it } from "vitest";
import { XmlRenderer } from "../../../../../src/domain/prompts/renderers/xml-renderer.js";

describe("XmlRenderer", () => {
	const renderer = new XmlRenderer();

	describe("renderSection()", () => {
		it("should produce a well-formed <section> element", () => {
			const output = renderer.renderSection({
				id: "my-section",
				title: "My Section",
				content: "Some content here.",
			});
			expect(output).toContain('<section id="my-section">');
			expect(output).toContain("<title>My Section</title>");
			expect(output).toContain("<content>Some content here.</content>");
			expect(output).toContain("</section>");
		});

		it("should slugify the section id", () => {
			const output = renderer.renderSection({
				id: "Hello World",
				title: "Title",
				content: "Body",
			});
			expect(output).toContain('<section id="hello-world">');
		});

		it("should escape XML entities in title", () => {
			const output = renderer.renderSection({
				id: "x",
				title: "<b>Bold & More</b>",
				content: "c",
			});
			expect(output).toContain(
				"<title>&lt;b&gt;Bold &amp; More&lt;/b&gt;</title>",
			);
		});

		it("should escape XML entities in content", () => {
			const output = renderer.renderSection({
				id: "x",
				title: "t",
				content: 'Say "hello" & <world>',
			});
			expect(output).toContain(
				"<content>Say &quot;hello&quot; &amp; &lt;world&gt;</content>",
			);
		});

		it("should escape special characters in section id attribute", () => {
			const output = renderer.renderSection({
				id: 'id"with"quotes',
				title: "t",
				content: "c",
			});
			// id is escaped in attribute position
			expect(output).not.toContain('"with"');
		});
	});

	describe("renderFrontmatter()", () => {
		it("should render scalar values", () => {
			const output = renderer.renderFrontmatter({
				title: "My Prompt",
				version: "1.0",
			});
			expect(output).toContain("<title>My Prompt</title>");
			expect(output).toContain("<version>1.0</version>");
		});

		it("should render array values as <item> elements", () => {
			const output = renderer.renderFrontmatter({ tags: ["a", "b", "c"] });
			expect(output).toContain("<item>a</item>");
			expect(output).toContain("<item>b</item>");
			expect(output).toContain("<item>c</item>");
		});

		it("should escape XML entities in scalar values", () => {
			const output = renderer.renderFrontmatter({
				description: "Tools & <Utilities>",
			});
			expect(output).toContain(
				"<description>Tools &amp; &lt;Utilities&gt;</description>",
			);
		});

		it("should escape XML entities in array item values", () => {
			const output = renderer.renderFrontmatter({
				tags: ["one & two", "<three>"],
			});
			expect(output).toContain("<item>one &amp; two</item>");
			expect(output).toContain("<item>&lt;three&gt;</item>");
		});

		it("should skip undefined values", () => {
			const output = renderer.renderFrontmatter({
				title: "T",
				missing: undefined,
			});
			expect(output).toContain("<title>T</title>");
			expect(output).not.toContain("<missing>");
		});
	});

	describe("renderMetadata()", () => {
		it("should render metadata entries as <field> elements", () => {
			const output = renderer.renderMetadata([
				{ label: "Author", value: "Alice" },
				{ label: "Date", value: "2024-01-01" },
			]);
			expect(output).toContain('<field label="Author">Alice</field>');
			expect(output).toContain('<field label="Date">2024-01-01</field>');
		});

		it("should escape XML entities in label attributes", () => {
			const output = renderer.renderMetadata([
				{ label: 'Key "with" quotes', value: "v" },
			]);
			expect(output).toContain(
				'<field label="Key &quot;with&quot; quotes">v</field>',
			);
		});

		it("should escape XML entities in field values", () => {
			const output = renderer.renderMetadata([
				{ label: "desc", value: "<script>alert(1)</script>" },
			]);
			expect(output).toContain(
				'<field label="desc">&lt;script&gt;alert(1)&lt;/script&gt;</field>',
			);
		});
	});

	describe("renderReferences()", () => {
		it("should render references as <reference> elements", () => {
			const output = renderer.renderReferences([
				{ label: "GitHub", url: "https://github.com" },
			]);
			expect(output).toContain(
				'<reference url="https://github.com">GitHub</reference>',
			);
		});

		it("should escape XML entities in url attributes", () => {
			const output = renderer.renderReferences([
				{ label: "Search", url: 'https://example.com?q=1&lang="en"' },
			]);
			expect(output).toContain(
				'<reference url="https://example.com?q=1&amp;lang=&quot;en&quot;">Search</reference>',
			);
		});

		it("should escape XML entities in reference labels", () => {
			const output = renderer.renderReferences([
				{ label: "<Docs> & Guide", url: "https://example.com" },
			]);
			expect(output).toContain(
				'<reference url="https://example.com">&lt;Docs&gt; &amp; Guide</reference>',
			);
		});
	});

	describe("renderDisclaimer()", () => {
		it("should render disclaimer text", () => {
			const output = renderer.renderDisclaimer("This is a disclaimer.");
			expect(output).toContain(
				"<disclaimer>This is a disclaimer.</disclaimer>",
			);
		});

		it("should escape XML entities in disclaimer text", () => {
			const output = renderer.renderDisclaimer(
				"Do not use <b>bold</b> & special chars.",
			);
			expect(output).toContain(
				"<disclaimer>Do not use &lt;b&gt;bold&lt;/b&gt; &amp; special chars.</disclaimer>",
			);
		});
	});
});
