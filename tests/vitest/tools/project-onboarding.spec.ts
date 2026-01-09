import { describe, expect, it } from "vitest";
import {
	buildOnboardingReferences,
	projectOnboarding,
} from "../../../src/tools/project-onboarding.js";

describe("projectOnboarding refactored with ProjectScanner", () => {
	it("buildOnboardingReferences returns expected reference links", () => {
		const refs = buildOnboardingReferences();
		expect(refs).toContain("Atlassian Onboarding Guide");
		expect(refs).toContain("VS Code Navigation");
		expect(refs).toContain("Meta AI Research");
	});

	it("projectOnboarding includes metadata when requested", async () => {
		// Create a temporary directory for testing
		const tempDir = "/tmp/test-project-metadata";
		await import("node:fs/promises").then((fs) =>
			fs.mkdir(tempDir, { recursive: true }),
		);

		const result = await projectOnboarding({
			projectPath: tempDir,
			includeMetadata: true,
		});

		expect(result.content[0].text).toContain("Metadata");
	});

	it("projectOnboarding includes references when requested", async () => {
		const tempDir = "/tmp/test-project-refs";
		await import("node:fs/promises").then((fs) =>
			fs.mkdir(tempDir, { recursive: true }),
		);

		const result = await projectOnboarding({
			projectPath: tempDir,
			includeReferences: true,
		});

		expect(result.content[0].text).toContain("Further Reading");
		expect(result.content[0].text).toContain("Atlassian");
	});

	it("projectOnboarding handles minimal project correctly", async () => {
		const tempDir = "/tmp/test-minimal-project";
		await import("node:fs/promises").then((fs) =>
			fs.mkdir(tempDir, { recursive: true }),
		);

		const result = await projectOnboarding({
			projectPath: tempDir,
		});

		expect(result.content[0].text).toContain("Project Onboarding:");
		expect(result.content[0].text).toContain("Type");
		expect(result.content[0].text).toContain("Root");
	});

	it("projectOnboarding throws error for non-existent path", async () => {
		await expect(
			projectOnboarding({
				projectPath: "/non-existent-path-12345",
			}),
		).rejects.toThrow();
	});
});
