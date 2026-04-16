import { doc_api_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
} from "../shared/handler-helpers.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const API_DOC_RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(rest|http|endpoint|route|get|post|put|delete|patch)\b/i,
		guidance:
			"Document each REST endpoint with: HTTP method, path, path/query parameters, request body schema, response schema (success and error), authentication requirements, and rate limits — incomplete endpoint docs force consumers to reverse-engineer behavior from trial and error.",
	},
	{
		pattern: /\b(graphql|query|mutation|subscription|schema|resolver)\b/i,
		guidance:
			"Generate schema documentation from the GraphQL SDL: document every type, field, argument, and directive with descriptions — auto-generated docs without human-written descriptions are reference noise, not reference documentation.",
	},
	{
		pattern: /\b(openapi|swagger|spec|schema|contract|definition)\b/i,
		guidance:
			"Generate from the OpenAPI spec, not from code inspection: the spec is the contract — docs that diverge from the spec are worse than no docs because they create false expectations.",
	},
	{
		pattern: /\b(sdk|client|library|package|module|wrapper)\b/i,
		guidance:
			"Document SDK methods with: signature, parameter descriptions, return type, thrown exceptions, and a minimal usage example — every public method without an example is a support ticket waiting to happen.",
	},
	{
		pattern: /\b(auth|token|key|oauth|jwt|bearer|api.?key|credential)\b/i,
		guidance:
			"Document authentication flow as a separate section: how to obtain credentials, how to include them in requests, how to refresh/rotate them, and what error responses indicate expired or invalid credentials.",
	},
	{
		pattern: /\b(error|status|code|response|exception|failure|4\d\d|5\d\d)\b/i,
		guidance:
			"Document every error response: status code, error body schema, and recovery action — consumers need to handle errors programmatically, not just know they exist.",
	},
	{
		pattern: /\b(example|sample|snippet|usage|demo|tutorial)\b/i,
		guidance:
			"Include copy-pasteable examples for the 3 most common use cases: a minimal hello-world, a typical production pattern, and an error-handling example — examples are the most-read section of any API doc.",
	},
];

const docApiHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"API Documentation needs a description of the API surface, endpoint, or module to document before it can produce structured reference documentation.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = API_DOC_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		if (findings.length === 0) {
			findings.push(
				"Start with the public surface inventory: list every exported function, endpoint, type, and constant — API documentation that misses surface area creates false 'this is undocumented' assumptions.",
				"Structure the docs for scan-ability: summary table at the top, detailed sections below, every section linkable — API consumers scan, they don't read linearly.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply documentation constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Ensure the doc format and depth match the stated audience and delivery requirements.`,
			);
		}

		if (signals.hasContext) {
			findings.push(
				"Use the provided context to identify the API surface: extract endpoint paths, function signatures, and type definitions as the documentation skeleton.",
			);
		}

		const apiDocInventory = {
			endpoints: [
				{ method: "GET", path: "/resource", description: "Fetch resource." },
			],
			auth: { type: "JWT", flow: "Bearer token in Authorization header" },
			errors: [
				{ code: 401, description: "Unauthorized" },
				{ code: 500, description: "Internal Server Error" },
			],
			examples: [
				{
					curl: "curl -H 'Authorization: Bearer <token>' https://api.example.com/resource",
				},
			],
		};

		return createCapabilityResult(
			context,
			`API Documentation generated ${findings.length} documentation guidance item${findings.length === 1 ? "" : "s"} for structured API reference.`,
			findings.map((text, index) => ({
				title: `API Documentation Guidance ${index + 1}`,
				detail: text,
				modelClass: context.model.modelClass,
				groundingScope: "request",
			})),
			[
				buildOutputTemplateArtifact(
					"API reference template",
					[
						"# API reference",
						"## Overview",
						"## Authentication",
						"## Endpoint index",
						"## Endpoint details",
						"## Error catalog",
						"## Examples",
						"## Change notes",
					].join("\n"),
					[
						"Overview",
						"Authentication",
						"Endpoint index",
						"Endpoint details",
						"Error catalog",
						"Examples",
						"Change notes",
					],
					"Reference-shaped template for API documentation that stays aligned with the contract.",
				),
				buildToolChainArtifact(
					"API documentation workflow",
					[
						{
							tool: "spec inventory",
							description:
								"collect the OpenAPI, SDL, or exported interface definitions that define the API contract",
						},
						{
							tool: "endpoint map",
							description:
								"enumerate each public operation with method, path, inputs, outputs, and auth requirements",
						},
						{
							tool: "example validation",
							description:
								"check every example request and response against the declared schema and error catalog",
						},
					],
					"Concrete workflow for producing API reference docs from the contract instead of from memory.",
				),
				buildEvalCriteriaArtifact(
					"API reference validation checklist",
					[
						"Every public endpoint or method is listed exactly once in the index.",
						"Each endpoint includes request, response, and error schemas.",
						"Authentication and rate limits are documented near the relevant operations.",
						"Examples are copy-pasteable and match the declared contract.",
					],
					"Publication checks that keep API docs aligned to the real surface area.",
				),
				buildWorkedExampleArtifact(
					"API endpoint documentation example",
					{
						endpoint: "GET /resource",
						auth: "Bearer token",
						responseCodes: [200, 401, 500],
					},
					{
						heading: "GET /resource",
						sections: [
							"Purpose",
							"Authorization",
							"Request",
							"Success response",
							"Error responses",
							"Example curl",
						],
						validation: [
							"Method and path are explicit",
							"Auth requirements are stated",
							"Success and error responses are both documented",
						],
					},
					"Worked example showing the shape of a complete endpoint reference entry.",
				),
				buildOutputTemplateArtifact(
					"API documentation inventory",
					JSON.stringify(apiDocInventory, null, 2),
					["endpoints", "auth", "errors", "examples"],
					"Structured API documentation inventory covering endpoints, auth, errors, and examples.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(skillManifest, docApiHandler);
