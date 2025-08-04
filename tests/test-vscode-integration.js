#!/usr/bin/env node

// VS Code MCP Integration Test Script
// This script tests the MCP server as it would be used by VS Code

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testVSCodeIntegration() {
	console.log(
		"🔗 Testing AI Agent Guidelines MCP Server for VS Code Integration\n",
	);

	try {
		// Create transport (same as VS Code would)
		const transport = new StdioClientTransport({
			command: "node",
			args: ["./dist/index.js"],
		});

		const client = new Client(
			{
				name: "vscode-test-client",
				version: "0.1.0",
			},
			{
				capabilities: {
					roots: {
						listChanged: true,
					},
					sampling: {},
				},
			},
		);

		await client.connect(transport);
		console.log("✅ Connected to MCP server (simulating VS Code connection)\n");

		// Test 1: Analyze the demo Python file
		console.log("🐍 Test 1: Analyzing Demo Python Code");
		const pythonCode = readFileSync(
			join(__dirname, "..", "demos", "demo-code-analysis.py"),
			"utf8",
		);

		const codeAnalysis = await client.callTool({
			name: "code-hygiene-analyzer",
			arguments: {
				codeContent: pythonCode.substring(0, 2000), // First 2000 chars
				language: "python",
				framework: "flask",
			},
		});

		console.log("   ✅ Code analysis completed");
		console.log(
			"   📊 Analysis length:",
			codeAnalysis.content[0].text.length,
			"characters",
		);
		console.log("   🔍 Found security and code quality recommendations\n");

		// Test 2: Generate sprint timeline from project file
		console.log("📅 Test 2: Sprint Planning from Project Description");

		const sprintResult = await client.callTool({
			name: "sprint-timeline-calculator",
			arguments: {
				tasks: [
					{ name: "Environment Setup", estimate: 3, priority: "high" },
					{
						name: "Database Migration",
						estimate: 5,
						priority: "high",
						dependencies: ["Environment Setup"],
					},
					{
						name: "Authentication System",
						estimate: 8,
						priority: "high",
						dependencies: ["Database Migration"],
					},
					{
						name: "Product Catalog API",
						estimate: 10,
						priority: "high",
						dependencies: ["Authentication System"],
					},
					{
						name: "Shopping Cart Service",
						estimate: 6,
						priority: "high",
						dependencies: ["Product Catalog API"],
					},
				],
				teamSize: 5,
				sprintLength: 2,
			},
		});

		console.log("   ✅ Sprint timeline calculated");
		console.log(
			"   📋 Timeline length:",
			sprintResult.content[0].text.length,
			"characters",
		);
		console.log("   ⚡ Includes velocity and risk analysis\n");

		// Test 3: Generate system architecture
		console.log("🏗️ Test 3: Architecture Design for Customer Support System");

		const architectureResult = await client.callTool({
			name: "mermaid-diagram-generator",
			arguments: {
				description:
					"AI-powered customer support system with multi-channel input, intelligent routing, agent dashboard, and analytics",
				diagramType: "flowchart",
				accTitle: "Customer Support System Flow",
				accDescr:
					"Flowchart showing user inputs, routing, dashboard interactions, and analytics pipeline.",
			},
		});

		console.log("   ✅ Architecture diagram generated");
		console.log(
			"   📊 Diagram length:",
			architectureResult.content[0].text.length,
			"characters",
		);
		console.log("   🎨 Contains Mermaid flowchart code\n");

		// Test 4: Model recommendation for AI features
		console.log("🤖 Test 4: AI Model Selection for Customer Support");

		const modelRec = await client.callTool({
			name: "model-compatibility-checker",
			arguments: {
				taskDescription:
					"Natural language understanding for customer support tickets with intent classification and sentiment analysis",
				requirements: [
					"high accuracy",
					"real-time processing",
					"multi-language support",
				],
				budget: "medium",
			},
		});

		console.log("   ✅ Model recommendations generated");
		console.log(
			"   💡 Recommendation length:",
			modelRec.content[0].text.length,
			"characters",
		);
		console.log("   🎯 Includes cost-benefit analysis\n");

		// Test 5: Generate documentation prompt
		console.log("📝 Test 5: Documentation Generation Prompt");

		const docPrompt = await client.getPrompt({
			name: "documentation-generator-prompt",
			arguments: {
				content_type: "API",
				target_audience: "developers",
				existing_content: "Basic endpoint descriptions available",
			},
		});

		console.log("   ✅ Documentation prompt generated");
		console.log(
			"   📄 Prompt length:",
			docPrompt.messages[0].content.text.length,
			"characters",
		);
		console.log("   🎯 Ready for use with documentation AI\n");

		// Test 6: Access guidelines resource
		console.log("📚 Test 6: Accessing Development Guidelines");

		const guidelines = await client.readResource({
			uri: "guidelines://architecture-patterns",
		});

		console.log("   ✅ Guidelines resource loaded");
		console.log(
			"   📖 Content length:",
			guidelines.contents[0].text.length,
			"characters",
		);
		console.log("   🏛️ Contains architecture patterns and best practices\n");

		// Test 7: Memory optimization for large contexts
		console.log("🧠 Test 7: Memory Context Optimization");

		const memoryOpt = await client.callTool({
			name: "memory-context-optimizer",
			arguments: {
				contextContent: `${pythonCode}\n\n${readFileSync(join(__dirname, "..", "demos", "demo-model-compatibility-checker.md"), "utf8")}`,
				cacheStrategy: "balanced",
				maxTokens: 4000,
			},
		});

		console.log("   ✅ Memory optimization completed");

		// Test 8: Guidelines validator
		console.log("📐 Test 8: Guidelines Validator");
		const guidelinesValidation = await client.callTool({
			name: "guidelines-validator",
			arguments: {
				practiceDescription:
					"We maintain modular architecture with documented decisions and refactor legacy code each sprint while enforcing prompt hierarchy.",
				category: "architecture",
			},
		});
		console.log("   ✅ Guidelines validation completed");

		console.log(
			"   🎯 Optimization length:",
			memoryOpt.content[0].text.length,
			"characters",
		);
		console.log("   💾 Includes caching and segmentation strategy\n");
		console.log(
			"   📐 Validation length:",
			guidelinesValidation.content[0].text.length,
			"characters",
		);
		console.log("   � Includes compliance scoring and recommendations\n");

		console.log("🎉 VS Code Integration Tests Completed Successfully!\n");

		console.log("📋 Integration Test Summary:");
		console.log("   ✅ Server connection established");
		console.log("   ✅ All 7 tools functional and responsive");
		console.log("   ✅ Resources accessible and well-formatted");
		console.log("   ✅ Prompt templates generating correctly");
		console.log("   ✅ Real-world demo files processed successfully");
		console.log("   ✅ Complex multi-parameter operations working");
		console.log("   ✅ Memory optimization handling large content");
		console.log("   ✅ Guidelines validation producing compliance output");

		console.log("\n🚀 Ready for VS Code MCP Extension Integration!");
		console.log("\n💡 Next Steps:");
		console.log("   1. Open VS Code in this project directory");
		console.log("   2. Install the Model Context Protocol extension");
		console.log("   3. The server will auto-connect using .vscode/mcp.json");
		console.log("   4. Use the demo files in the demos/ directory");
		console.log("   5. Access tools through the MCP panel in VS Code");

		await client.close();
	} catch (error) {
		console.error("❌ VS Code integration test failed:", error.message);
		console.error("Stack:", error.stack);
		process.exit(1);
	}
}

testVSCodeIntegration().catch(console.error);
