import { describe, expect, it } from "vitest";
import { buildFurtherReadingSection } from "../../src/tools/shared/prompt-utils.js";

describe("buildFurtherReadingSection - new object format", () => {
	it("handles object format with title, url, and description", () => {
		const result = buildFurtherReadingSection([
			{
				title: "Test Resource",
				url: "https://example.com",
				description: "A helpful test resource",
			},
		]);

		expect(result).toMatch(/## Further Reading/);
		expect(result).toMatch(
			/\*\*\[Test Resource\]\(https:\/\/example\.com\)\*\*/,
		);
		expect(result).toMatch(/A helpful test resource/);
	});

	it("handles object format without description", () => {
		const result = buildFurtherReadingSection([
			{
				title: "Test Resource",
				url: "https://example.com",
			},
		]);

		expect(result).toMatch(/## Further Reading/);
		expect(result).toMatch(
			/\*\*\[Test Resource\]\(https:\/\/example\.com\)\*\*/,
		);
		expect(result).not.toMatch(/undefined/);
	});

	it("handles mixed formats (legacy strings and new objects)", () => {
		const result = buildFurtherReadingSection([
			"Legacy: https://legacy.com",
			{
				title: "New Format",
				url: "https://new.com",
				description: "Using the new format",
			},
		]);

		expect(result).toMatch(/## Further Reading/);
		expect(result).toMatch(/- Legacy: https:\/\/legacy\.com/);
		expect(result).toMatch(/\*\*\[New Format\]\(https:\/\/new\.com\)\*\*/);
		expect(result).toMatch(/Using the new format/);
	});

	it("handles multiple object format references", () => {
		const result = buildFurtherReadingSection([
			{
				title: "First Resource",
				url: "https://first.com",
				description: "First description",
			},
			{
				title: "Second Resource",
				url: "https://second.com",
				description: "Second description",
			},
			{
				title: "Third Resource",
				url: "https://third.com",
			},
		]);

		expect(result).toMatch(/## Further Reading/);
		expect(result).toMatch(
			/\*\*\[First Resource\]\(https:\/\/first\.com\)\*\*/,
		);
		expect(result).toMatch(/First description/);
		expect(result).toMatch(
			/\*\*\[Second Resource\]\(https:\/\/second\.com\)\*\*/,
		);
		expect(result).toMatch(/Second description/);
		expect(result).toMatch(
			/\*\*\[Third Resource\]\(https:\/\/third\.com\)\*\*/,
		);
	});

	it("handles empty description gracefully", () => {
		const result = buildFurtherReadingSection([
			{
				title: "Test",
				url: "https://test.com",
				description: "",
			},
		]);

		expect(result).toMatch(/\*\*\[Test\]\(https:\/\/test\.com\)\*\*/);
		expect(result).not.toMatch(/: $/m); // No trailing colon
	});

	it("includes disclaimer text", () => {
		const result = buildFurtherReadingSection([
			{
				title: "Test",
				url: "https://test.com",
				description: "Test description",
			},
		]);

		expect(result).toMatch(/informational and educational purposes only/);
		expect(result).toMatch(/does not imply endorsement/);
		expect(result).toMatch(/verify current information/);
	});
});
