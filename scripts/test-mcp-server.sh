#!/bin/bash

# Test script for MCP Server
echo "🚀 Testing AI Agent Guidelines MCP Server..."

# Create a temporary test file
cat > test-client.js << 'EOF'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function run() {
  try {
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/index.js']
    });

    const client = new Client({ name: 'test', version: '0.1.0' }, { capabilities: {} });
    await client.connect(transport);

    console.log('📡 Connected to MCP server');

    // Test 1: List tools
    const tools = await client.listTools();
    console.log('✅ Server is working! Found', tools.tools.length, 'tools');
    console.log('🔧 Tools:', tools.tools.map(t => t.name).join(', '));

    // Test 2: Test code hygiene analyzer
    console.log('\n🧹 Testing Code Hygiene Analyzer...');
    const codeAnalysis = await client.callTool({
      name: 'code-hygiene-analyzer',
      arguments: {
        codeContent: 'function test() { var x = 1; console.log(x); }',
        language: 'javascript'
      }
    });
    if (!codeAnalysis || !codeAnalysis.content) {
      throw new Error('Code hygiene analyzer returned unexpected response');
    }
    console.log('✅ Code analysis completed');

    // Test 3: List resources
    const resources = await client.listResources();
    console.log('📚 Found', resources.resources.length, 'resources');

    // Test 4: List prompts
    const prompts = await client.listPrompts();
    console.log('📝 Found', prompts.prompts.length, 'prompt templates');

    await client.close();
    console.log('\n🎉 All tests passed! MCP server is fully functional.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

run();
EOF

# Run the test with timeout
timeout 15s node test-client.js

# Clean up
rm test-client.js

echo "🏁 Test completed!"
