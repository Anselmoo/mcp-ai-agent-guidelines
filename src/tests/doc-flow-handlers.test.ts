import { describe, expect, it } from "vitest";
import { skillModule as docApiModule } from "../skills/doc/doc-api.js";
import { skillModule as docGeneratorModule } from "../skills/doc/doc-generator.js";
import { skillModule as docReadmeModule } from "../skills/doc/doc-readme.js";
import { skillModule as docRunbookModule } from "../skills/doc/doc-runbook.js";
import { skillModule as flowContextHandoffModule } from "../skills/flow/flow-context-handoff.js";
import { skillModule as flowModeSwitchingModule } from "../skills/flow/flow-mode-switching.js";
import { skillModule as flowOrchestratorModule } from "../skills/flow/flow-orchestrator.js";
import {
	createHandlerRuntime,
	createMockWorkspace,
	recommendationText,
} from "./test-helpers/handler-runtime.js";

describe("doc/flow handlers", () => {
	describe("doc handlers", () => {
		it("doc-api combines REST, auth, error, and example guidance without echoing the raw request", async () => {
			const rawRequest =
				"Document the REST API endpoints, JWT auth flow, OpenAPI contract, error responses, and usage examples";
			const result = await docApiModule.run(
				{
					request: rawRequest,
					constraints: ["reference docs for external integrators"],
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(result.summary).not.toContain(rawRequest);
			expect(text).toMatch(/HTTP method|request body schema|response schema/i);
			expect(text).toMatch(
				/authentication flow|error response|copy-pasteable examples/i,
			);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"output-template",
				"tool-chain",
				"eval-criteria",
				"worked-example",
				"output-template",
			]);
		});

		it("doc-readme incorporates workspace-derived project structure insights", async () => {
			const workspace = createMockWorkspace([
				{ name: "package.json", type: "file" },
				{ name: "README.md", type: "file" },
				{ name: "src", type: "directory" },
			]);
			const result = await docReadmeModule.run(
				{
					request:
						"Refresh the README with installation, configuration, contribution, and example sections",
				},
				createHandlerRuntime(workspace),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(text).toMatch(
				/copy-pasteable block|configuration option|contribution guide|minimal working example/i,
			);
			expect(text).toMatch(
				/package.json detected|Existing README found|Source directory found/i,
			);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"output-template",
				"tool-chain",
				"eval-criteria",
				"worked-example",
			]);
		});

		it("doc-runbook produces rollback, deploy, and monitoring guidance", async () => {
			const result = await docRunbookModule.run(
				{
					request:
						"Create an on-call runbook for deploy verification, rollback, alert triage, and degraded failover mode",
					context:
						"Operators use dashboards during incidents and need fast escalation paths.",
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(text).toMatch(
				/decision tree|rollback procedure|health checks|degraded-mode/i,
			);
			expect(text).toMatch(/dashboard|metric name/i);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"output-template",
				"tool-chain",
				"eval-criteria",
				"worked-example",
			]);
		});

		it("doc-generator emits a publication checklist alongside the plan template", async () => {
			const workspace = createMockWorkspace([
				{ name: "src", type: "directory" },
				{ name: "package.json", type: "file" },
				{ name: "README.md", type: "file" },
			]);
			const result = await docGeneratorModule.run(
				{
					request:
						"Document the skill registry, instruction modules, and workflow engine",
				},
				createHandlerRuntime(workspace),
			);

			expect(result.executionMode).toBe("capability");
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"output-template",
				"eval-criteria",
				"tool-chain",
				"worked-example",
			]);
		});
	});

	describe("flow handlers", () => {
		it("flow-orchestrator maps staged pipelines with parallel synthesis gates", async () => {
			const result = await flowOrchestratorModule.run(
				{
					request:
						"Research, plan, implement, test, and release a multi-agent feature with parallel specialist workstreams",
					deliverable: "validated rollout plan",
					successCriteria: "all stages produce reviewable artifacts",
					options: { allowParallel: true, maxStages: 5 },
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(result.summary).toMatch(/5 planned stage|pipeline control/i);
			expect(text).toMatch(
				/bounded stage sequence|measure each path|checkpoints/i,
			);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"comparison-matrix",
				"output-template",
				"eval-criteria",
				"tool-chain",
				"worked-example",
			]);
			expect(result.artifacts?.[1]).toMatchObject({
				kind: "output-template",
				title: "Path contract template",
			});
		});

		it("flow-context-handoff enforces artifact-first transfer with validation", async () => {
			const result = await flowContextHandoffModule.run(
				{
					request:
						"Prepare a handoff with spec files, benchmark artifacts, and the next agent owner after context-window compression",
					context:
						"The research phase is complete and implementation starts next.",
					deliverable: "implementation handoff packet",
					options: {
						handoffStyle: "artifact-first",
						maxContextItems: 4,
						includeValidation: true,
					},
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(result.summary).toContain("style: artifact-first");
			expect(text).toMatch(
				/artifact references over prose|canonical artifacts first|handoff validation check/i,
			);
		});

		it("flow-mode-switching derives plan-to-implement transitions and review gates", async () => {
			const result = await flowModeSwitchingModule.run(
				{
					request:
						"We finished planning and need to implement the feature before a formal review gate",
					context: "Requirements and scope are approved.",
					deliverable: "tested feature branch",
					options: { enforceReviewGate: true, includeRollbackCriteria: true },
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(result.summary).toContain("current: plan, next: code");
			expect(text).toMatch(
				/exit criterion for plan mode|freeze the handoff package|review gate|rollback criteria/i,
			);
		});

		it("flow-context-handoff returns insufficient-signal guidance when no usable handoff context is provided", async () => {
			const result = await flowContextHandoffModule.run(
				{ request: "x" },
				createHandlerRuntime(),
			);

			expect(result.executionMode).toBe("capability");
			expect(result.summary).toContain("Context Handoff needs");
			expect(result.recommendations[0]?.title).toBe("Provide more detail");
		});
	});
});
