/**
 * Workflow Capability Handler - GitHub Actions YAML Generation
 *
 * Generates GitHub Actions workflow files for CI/CD automation.
 * Supports multiple workflow types: CI, deployment, testing, release.
 *
 * @module strategies/cross-cutting/workflow-handler
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001} §5.2
 */

import type { CrossCuttingArtifact } from "../output-strategy.js";
import { CrossCuttingCapability } from "../output-strategy.js";
import type { CapabilityContext, CapabilityHandler } from "./types.js";

/**
 * Workflow types supported by this handler.
 */
type WorkflowType = "ci" | "deploy" | "test" | "release";

/**
 * WorkflowCapabilityHandler generates GitHub Actions workflow YAML files.
 *
 * Detects workflow type from domain results and generates appropriate
 * workflow configurations for CI/CD automation.
 *
 * Workflow type detection follows a well-defined priority so callers can
 * intentionally influence which workflow is generated:
 *
 * 1. {@link metadata}.workflowType – If present and one of `"ci"`, `"deploy"`,
 *    `"test"`, or `"release"`, it is used directly.
 * 2. Deployment fields – If the domain result contains deployment-related
 *    hints (for example keys like `deploy`, `deployment`, or `environment`),
 *    `"deploy"` is selected.
 * 3. Release fields – If the domain result contains release-related hints
 *    (for example `release`, `version`, or `tag`), `"release"` is selected.
 * 4. Test fields – If the domain result is dominated by testing concerns
 *    (for example `tests`, `coverage`, or `testing`), `"test"` is selected.
 * 5. Fallback – If none of the above apply, `"ci"` is used as a safe
 *    default workflow type.
 *
 * This means that you can explicitly steer workflow generation by setting
 * `metadata.workflowType`:
 *
 * @example
 * ```ts
 * const handler = new WorkflowCapabilityHandler();
 * const artifact = handler.generate({
 *   domainResult,
 *   metadata: {
 *     workflowType: "deploy", // forces deployment workflow
 *     nodeVersion: "22",
 *   },
 * });
 * // artifact.name => ".github/workflows/deploy.yml"
 * ```
 *
 * If `metadata.workflowType` is provided but not one of the supported
 * workflow types, it is ignored and the handler falls back to inspecting
 * the domain result and finally to the `"ci"` default.
 *
 * @implements {CapabilityHandler}
 */
export class WorkflowCapabilityHandler implements CapabilityHandler {
	/** The capability this handler implements */
	readonly capability = CrossCuttingCapability.WORKFLOW;

	/**
	 * Generate a GitHub Actions workflow artifact.
	 *
	 * @param context - The context for artifact generation
	 * @returns A workflow artifact with YAML content, or null if not applicable
	 */
	generate(context: CapabilityContext): CrossCuttingArtifact | null {
		const { domainResult, metadata } = context;

		// Determine workflow type based on context
		const workflowType = this.detectWorkflowType(domainResult, metadata);

		const content = this.generateWorkflowYaml(workflowType, metadata);

		return {
			type: this.capability,
			name: `.github/workflows/${workflowType}.yml`,
			content,
		};
	}

	/**
	 * Check if this handler supports the given domain type.
	 *
	 * @param domainType - The domain type identifier
	 * @returns True if workflows can be generated for this domain type
	 */
	supports(domainType: string): boolean {
		return ["SessionState", "PromptResult", "ScoringResult"].includes(
			domainType,
		);
	}

	/**
	 * Detect the workflow type from domain result and metadata.
	 *
	 * @param result - The domain result
	 * @param metadata - Optional metadata hints
	 * @returns The detected workflow type
	 * @private
	 */
	private detectWorkflowType(
		result: unknown,
		metadata?: Record<string, unknown>,
	): WorkflowType {
		// Check metadata hints
		if (metadata?.workflowType) {
			const type = String(metadata.workflowType);
			if (this.isValidWorkflowType(type)) {
				return type as WorkflowType;
			}
		}

		// Check result structure for hints
		if (typeof result === "object" && result !== null) {
			const obj = result as Record<string, unknown>;

			// Look for deployment indicators
			if (obj.deployment || obj.deploy || obj.environment) {
				return "deploy";
			}

			// Look for release indicators
			if (obj.release || obj.version || obj.tag) {
				return "release";
			}

			// Look for test indicators
			if (obj.coverage || obj.tests || obj.testing) {
				return "test";
			}
		}

		// Default to CI workflow
		return "ci";
	}

	/**
	 * Type guard for workflow type validation.
	 *
	 * @param type - The type to check
	 * @returns True if the type is a valid workflow type
	 * @private
	 */
	private isValidWorkflowType(type: string): type is WorkflowType {
		return ["ci", "deploy", "test", "release"].includes(type);
	}

	/**
	 * Generate workflow YAML content based on type.
	 *
	 * @param type - The workflow type
	 * @param metadata - Optional metadata for customization
	 * @returns The workflow YAML content
	 * @private
	 */
	private generateWorkflowYaml(
		type: WorkflowType,
		metadata?: Record<string, unknown>,
	): string {
		const templates: Record<WorkflowType, () => string> = {
			ci: () => this.generateCIWorkflow(metadata),
			deploy: () => this.generateDeployWorkflow(metadata),
			test: () => this.generateTestWorkflow(metadata),
			release: () => this.generateReleaseWorkflow(metadata),
		};

		return templates[type]();
	}

	/**
	 * Generate CI workflow template.
	 *
	 * @param metadata - Optional metadata for customization
	 * @returns CI workflow YAML
	 * @private
	 */
	private generateCIWorkflow(metadata?: Record<string, unknown>): string {
		const nodeVersion = metadata?.nodeVersion ?? "22";
		const branchesRaw = metadata?.branches ?? ["main"];
		const branches = Array.isArray(branchesRaw) ? branchesRaw : ["main"];

		return `name: CI

on:
  push:
    branches: [${branches.map((b: unknown) => String(b)).join(", ")}]
  pull_request:
    branches: [${branches.map((b: unknown) => String(b)).join(", ")}]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: ${nodeVersion}
          cache: npm
      - run: npm ci
      - run: npm run quality
      - run: npm run test:all
`;
	}

	/**
	 * Generate deployment workflow template.
	 *
	 * @param metadata - Optional metadata for customization
	 * @returns Deployment workflow YAML
	 * @private
	 */
	private generateDeployWorkflow(metadata?: Record<string, unknown>): string {
		const environment = metadata?.environment ?? "production";
		const nodeVersion = metadata?.nodeVersion ?? "22";
		const branchesRaw = metadata?.branches ?? ["main"];
		const branches = Array.isArray(branchesRaw) ? branchesRaw : ["main"];

		return `name: Deploy

on:
  push:
    branches: [${branches.map((b: unknown) => String(b)).join(", ")}]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${environment}
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: ${nodeVersion}
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Deploy
        run: echo "Add your deployment command here (npm run deploy or custom script)"
        env:
          DEPLOY_TOKEN: \${{ secrets.DEPLOY_TOKEN }}
`;
	}

	/**
	 * Generate test workflow template.
	 *
	 * @param metadata - Optional metadata for customization
	 * @returns Test workflow YAML
	 * @private
	 */
	private generateTestWorkflow(metadata?: Record<string, unknown>): string {
		const nodeVersion = metadata?.nodeVersion ?? "22";
		const coverageThreshold = metadata?.coverageThreshold ?? "90";
		const branchesRaw = metadata?.branches ?? ["main", "develop"];
		const branches = Array.isArray(branchesRaw)
			? branchesRaw
			: ["main", "develop"];

		return `name: Test

on:
  push:
    branches: [${branches.map((b: unknown) => String(b)).join(", ")}]
  pull_request:
    branches: [${branches.map((b: unknown) => String(b)).join(", ")}]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: ${nodeVersion}
          cache: npm
      - run: npm ci
      - run: npm run test:vitest
      - run: npm run check:coverage-threshold --threshold=${coverageThreshold}
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
`;
	}

	/**
	 * Generate release workflow template.
	 *
	 * @param metadata - Optional metadata for customization
	 * @returns Release workflow YAML
	 * @private
	 */
	private generateReleaseWorkflow(metadata?: Record<string, unknown>): string {
		const nodeVersion = metadata?.nodeVersion ?? "22";

		return `name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: ${nodeVersion}
          cache: npm
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm run test:all
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: \${{ github.ref }}
          name: Release \${{ github.ref }}
`;
	}
}
