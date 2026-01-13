import { afterEach, describe, expect, it } from "vitest";
import {
	buildOnboardingReferences,
	projectOnboarding,
} from "../../../src/tools/project-onboarding.js";

describe("projectOnboarding refactored with ProjectScanner", () => {
	const tempDirs: string[] = [];

	afterEach(async () => {
		// Cleanup all temporary directories created during tests
		const fs = await import("node:fs/promises");
		for (const dir of tempDirs) {
			await fs.rm(dir, { recursive: true, force: true });
		}
		tempDirs.length = 0;
	});

	it("buildOnboardingReferences returns expected reference links", () => {
		const refs = buildOnboardingReferences();
		expect(refs).toContain("Atlassian Onboarding Guide");
		expect(refs).toContain("VS Code Navigation");
		expect(refs).toContain("Meta AI Research");
	});

	it("projectOnboarding includes metadata when requested", async () => {
		// Create a temporary directory for testing
		const fs = await import("node:fs/promises");
		const path = await import("node:path");
		const tempDir = path.join(
			process.cwd(),
			".tmp-test",
			"test-project-metadata",
		);
		tempDirs.push(tempDir);

		await fs.mkdir(tempDir, { recursive: true });

		const result = await projectOnboarding({
			projectPath: tempDir,
			includeMetadata: true,
		});

		expect(result.content[0].text).toContain("Metadata");
	});

	it("projectOnboarding includes references when requested", async () => {
		const fs = await import("node:fs/promises");
		const path = await import("node:path");
		const tempDir = path.join(process.cwd(), ".tmp-test", "test-project-refs");
		tempDirs.push(tempDir);

		await fs.mkdir(tempDir, { recursive: true });

		const result = await projectOnboarding({
			projectPath: tempDir,
			includeReferences: true,
		});

		expect(result.content[0].text).toContain("Further Reading");
		expect(result.content[0].text).toContain("Atlassian");
	});

	it("projectOnboarding handles minimal project correctly", async () => {
		const fs = await import("node:fs/promises");
		const path = await import("node:path");
		const tempDir = path.join(
			process.cwd(),
			".tmp-test",
			"test-minimal-project",
		);
		tempDirs.push(tempDir);

		await fs.mkdir(tempDir, { recursive: true });

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

	it("projectOnboarding formats scripts with npm run for Node.js projects", async () => {
		const fs = await import("node:fs/promises");
		const path = await import("node:path");
		const tempDir = path.join(
			process.cwd(),
			".tmp-test",
			"test-nodejs-scripts",
		);
		tempDirs.push(tempDir);

		await fs.mkdir(tempDir, { recursive: true });

		// Create a package.json to make it a Node.js project
		const packageJson = {
			name: "test-project",
			version: "1.0.0",
			scripts: {
				build: "tsc",
				test: "vitest",
			},
		};
		await fs.writeFile(
			path.join(tempDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);

		const result = await projectOnboarding({
			projectPath: tempDir,
			focusAreas: ["scripts"],
		});

		const text = result.content[0].text;

		// Should use "npm run" prefix for Node.js projects
		expect(text).toContain("npm run build");
		expect(text).toContain("npm run test");
	});
});
