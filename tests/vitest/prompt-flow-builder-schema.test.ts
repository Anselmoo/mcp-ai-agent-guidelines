import { describe, expect, it } from "vitest";
import { promptFlowBuilderSchema } from "../../src/schemas/flow-tool-schemas";

describe("prompt-flow-builder schema documentation", () => {
	it("documents config requirements for all node types", () => {
		const nodesSchema = promptFlowBuilderSchema.inputSchema.properties.nodes;

		// @ts-expect-error - accessing schema internals for testing
		const configSchema = nodesSchema.items.properties.config;

		// Verify the description explains type-specific requirements
		expect(configSchema.description).toContain(
			"prompt nodes require 'prompt' property",
		);
		expect(configSchema.description).toContain(
			"condition nodes require 'expression' property",
		);
		expect(configSchema.description).toContain(
			"loop nodes require either 'condition' or 'iterations' property",
		);
		expect(configSchema.description).toContain(
			"parallel, merge, and transform nodes have no required config properties",
		);
	});

	it("defines config properties for prompt nodes", () => {
		const nodesSchema = promptFlowBuilderSchema.inputSchema.properties.nodes;

		// @ts-expect-error - accessing schema internals for testing
		const configProperties = nodesSchema.items.properties.config.properties;

		expect(configProperties.prompt).toBeDefined();
		expect(configProperties.prompt.type).toBe("string");
		expect(configProperties.prompt.description).toContain(
			"Required for prompt nodes",
		);
	});

	it("defines config properties for condition nodes", () => {
		const nodesSchema = promptFlowBuilderSchema.inputSchema.properties.nodes;

		// @ts-expect-error - accessing schema internals for testing
		const configProperties = nodesSchema.items.properties.config.properties;

		expect(configProperties.expression).toBeDefined();
		expect(configProperties.expression.type).toBe("string");
		expect(configProperties.expression.description).toContain(
			"Required for condition nodes",
		);
	});

	it("defines config properties for loop nodes", () => {
		const nodesSchema = promptFlowBuilderSchema.inputSchema.properties.nodes;

		// @ts-expect-error - accessing schema internals for testing
		const configProperties = nodesSchema.items.properties.config.properties;

		expect(configProperties.condition).toBeDefined();
		expect(configProperties.condition.type).toBe("string");
		expect(configProperties.condition.description).toContain(
			"Required for loop nodes",
		);

		expect(configProperties.iterations).toBeDefined();
		expect(configProperties.iterations.type).toBe("number");
		expect(configProperties.iterations.description).toContain(
			"Required for loop nodes",
		);
	});

	it("includes helpful description for nodes array", () => {
		const nodesSchema = promptFlowBuilderSchema.inputSchema.properties.nodes;

		// @ts-expect-error - accessing schema internals for testing
		expect(nodesSchema.description).toContain(
			"Each node type has specific config requirements",
		);
	});

	it("includes helpful description for type property", () => {
		const nodesSchema = promptFlowBuilderSchema.inputSchema.properties.nodes;

		// @ts-expect-error - accessing schema internals for testing
		const typeSchema = nodesSchema.items.properties.type;

		expect(typeSchema.description).toContain(
			"Node type determines required config properties",
		);
	});
});
