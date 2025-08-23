#!/usr/bin/env node

import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMCPServer() {
	console.log("🧪 Testing AI Agent Guidelines MCP Server...\n");

	try {
		// Start the server process
		const serverProcess = spawn("node", ["dist/index.js"], {
			stdio: ["pipe", "pipe", "inherit"],
		});

		// Create client transport
		const transport = new StdioClientTransport({
			command: "node",
			args: ["dist/index.js"],
		});

		// Create and connect client
		const client = new Client(
			{
				name: "test-client",
				version: "0.1.0",
			},
			{
				capabilities: {},
			},
		);

		await client.connect(transport);
		console.log("✅ Connected to MCP server");

		// Test 1: List available tools
		console.log("\n📋 Testing: List Tools");
		const tools = await client.listTools();
		console.log(`Found ${tools.tools.length} tools:`);
		tools.tools.forEach((tool) => {
			console.log(`  - ${tool.name}: ${tool.description}`);
		});

		// Test 2: List available resources
		console.log("\n📚 Testing: List Resources");
		const resources = await client.listResources();
		console.log(`Found ${resources.resources.length} resources:`);
		resources.resources.forEach((resource) => {
			console.log(`  - ${resource.name}: ${resource.description}`);
		});

		// Test 3: List available prompts
		console.log("\n📝 Testing: List Prompts");
		const prompts = await client.listPrompts();
		console.log(`Found ${prompts.prompts.length} prompts:`);
		prompts.prompts.forEach((prompt) => {
			console.log(`  - ${prompt.name}: ${prompt.description}`);
		});

		// Test 4: Test a simple tool call
		console.log("\n🔧 Testing: Hierarchical Prompt Builder");
		const promptResult = await client.callTool({
			name: "hierarchical-prompt-builder",
			arguments: {
				context: "Testing the MCP server functionality",
				goal: "Create a simple test prompt",
				audience: "developers",
			},
		});
		console.log("✅ Tool call successful");
		console.log(
			"Sample output length:",
			promptResult.content[0].text.length,
			"characters",
		);

		// Test 4b: Domain-Neutral Prompt Builder
		console.log("\n🧩 Testing: Domain-Neutral Prompt Builder");
		const neutralResult = await client.callTool({
			name: "domain-neutral-prompt-builder",
			arguments: {
				title: "Server Test",
				summary: "Ensure the domain-neutral builder responds",
				objectives: ["Smoke test"],
				includeReferences: true,
			},
		});
		console.log("✅ Domain-neutral tool call successful");
		console.log("Neutral output length:", neutralResult.content[0].text.length);

		// Test 5: Test resource access
		console.log("\n📖 Testing: Resource Access");
		const coreResource = await client.readResource({
			uri: "guidelines://core-principles",
		});
		console.log("✅ Resource access successful");
		console.log(
			"Core principles content length:",
			coreResource.contents[0].text.length,
			"characters",
		);

		// Test 6: Test prompt template
		console.log("\n📄 Testing: Prompt Template");
		const promptTemplate = await client.getPrompt({
			name: "code-analysis-prompt",
			arguments: {
				codebase: 'function test() { return "hello"; }',
				language: "javascript",
			},
		});
		console.log("✅ Prompt template successful");
		console.log(
			"Generated prompt length:",
			promptTemplate.messages[0].content.text.length,
			"characters",
		);

		console.log("\n🎉 All tests passed! The MCP server is working correctly.");

		// Clean up
		await client.close();
		serverProcess.kill();
	} catch (error) {
		console.error("❌ Test failed:", error.message);
		process.exit(1);
	}
}

// Run the test
testMCPServer().catch(console.error);
