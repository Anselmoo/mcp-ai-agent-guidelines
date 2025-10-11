import { exec } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);

describe("Security Audit", () => {
	it("should have npm audit script defined", () => {
		const packageJson = require("../../package.json");
		expect(packageJson.scripts.audit).toBeDefined();
		expect(packageJson.scripts.audit).toBe("npm audit --audit-level=moderate");
	});

	it("should have npm audit:fix script defined", () => {
		const packageJson = require("../../package.json");
		expect(packageJson.scripts["audit:fix"]).toBeDefined();
		expect(packageJson.scripts["audit:fix"]).toBe("npm audit fix");
	});

	it("should have npm audit:production script defined", () => {
		const packageJson = require("../../package.json");
		expect(packageJson.scripts["audit:production"]).toBeDefined();
		expect(packageJson.scripts["audit:production"]).toBe(
			"npm audit --omit=dev --audit-level=moderate",
		);
	});

	it("should run npm audit successfully", async () => {
		// Run npm audit and verify it completes
		const { stdout } = await execAsync("npm audit --audit-level=moderate", {
			cwd: process.cwd(),
		});

		// Should complete successfully (exit code 0)
		expect(stdout).toBeDefined();
		expect(stdout).toContain("vulnerabilities");
	}, 30000); // Increase timeout for npm audit

	it("should run production audit successfully", async () => {
		// Run production audit
		const { stdout } = await execAsync(
			"npm audit --omit=dev --audit-level=moderate",
			{
				cwd: process.cwd(),
			},
		);

		// Should complete successfully
		expect(stdout).toBeDefined();
		expect(stdout).toContain("vulnerabilities");
	}, 30000);

	it("should have security-audit job in CI/CD workflow", () => {
		const fs = require("node:fs");
		const workflowPath = ".github/workflows/ci-cd.yml";
		const workflowContent = fs.readFileSync(workflowPath, "utf8");

		// Check that security-audit job exists
		expect(workflowContent).toContain("security-audit:");
		expect(workflowContent).toContain("Security Audit");
		expect(workflowContent).toContain("npm audit --omit=dev");

		// Check that test-and-build depends on security-audit
		expect(workflowContent).toContain(
			"needs: [lint-and-quality, security-audit]",
		);
	});

	it("should have dependency-audit in lefthook pre-push", () => {
		const fs = require("node:fs");
		const lefthookPath = "lefthook.yml";
		const lefthookContent = fs.readFileSync(lefthookPath, "utf8");

		// Check that dependency-audit command exists in pre-push
		expect(lefthookContent).toContain("dependency-audit:");
		expect(lefthookContent).toContain(
			"npm audit --omit=dev --audit-level=moderate",
		);
		expect(lefthookContent).toContain("tags: [security, audit]");
	});

	it("should document security audit in README", () => {
		const fs = require("node:fs");
		const readmePath = "README.md";
		const readmeContent = fs.readFileSync(readmePath, "utf8");

		// Check for security audit documentation
		expect(readmeContent).toContain("Dependency Scanning");
		expect(readmeContent).toContain("npm run audit");
		expect(readmeContent).toContain("Remediation Steps");
		expect(readmeContent).toContain("npm audit --audit-level=moderate");
	});

	it("should document audit scripts in Development section", () => {
		const fs = require("node:fs");
		const readmePath = "README.md";
		const readmeContent = fs.readFileSync(readmePath, "utf8");

		// Check that audit scripts are documented
		expect(readmeContent).toContain("npm run audit");
		expect(readmeContent).toContain("npm run audit:fix");
		expect(readmeContent).toContain("npm run audit:production");
	});
});
