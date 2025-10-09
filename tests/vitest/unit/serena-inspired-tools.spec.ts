/**
 * Test suite for Serena-inspired tools
 */

import { describe, expect, it } from "vitest";
import { modeSwitcher } from "../../../src/tools/mode-switcher.js";
import { projectOnboarding } from "../../../src/tools/project-onboarding.js";
import { semanticCodeAnalyzer } from "../../../src/tools/semantic-code-analyzer.js";

describe("Serena-Inspired Tools", () => {
	describe("Semantic Code Analyzer", () => {
		it("should analyze TypeScript code and identify symbols", async () => {
			const result = await semanticCodeAnalyzer({
				codeContent: `
export class UserService {
  async getUser(id: string): Promise<User> {
    return await this.repository.findById(id);
  }
}

export interface User {
  id: string;
  name: string;
}

export function validateUser(user: User): boolean {
  return user.id !== '' && user.name !== '';
}
`,
				language: "TypeScript/JavaScript",
				analysisType: "all",
			});

			const text = result.content[0].text;

			expect(text).toContain("Semantic Code Analysis");
			expect(text).toContain("TypeScript/JavaScript");
			expect(text).toContain("Symbols Identified");
			expect(text).toContain("UserService");
			expect(text).toContain("User");
			expect(text).toContain("validateUser");
		});

		it("should detect async/await patterns", async () => {
			const result = await semanticCodeAnalyzer({
				codeContent: `
async function fetchData() {
  const data = await fetch('/api/data');
  return await data.json();
}
`,
				analysisType: "patterns",
			});

			const text = result.content[0].text;

			expect(text).toContain("Design Patterns");
			expect(text).toContain("Async/Await");
		});

		it("should extract dependencies", async () => {
			const result = await semanticCodeAnalyzer({
				codeContent: `
import { z } from 'zod';
import { Request, Response } from 'express';
import axios from 'axios';
`,
				analysisType: "dependencies",
			});

			const text = result.content[0].text;

			expect(text).toContain("Dependencies");
			expect(text).toContain("zod");
			expect(text).toContain("express");
			expect(text).toContain("axios");
		});
	});

	describe("Project Onboarding", () => {
		it("should generate project profile and memories", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/my-project",
				projectName: "My Test Project",
				projectType: "application",
				analysisDepth: "standard",
				includeMemories: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Project Onboarding Complete");
			expect(text).toContain("My Test Project");
			expect(text).toContain("application");
			expect(text).toContain("Project Structure");
			expect(text).toContain("Project Memories Generated");
		});

		it("should detect build systems", async () => {
			const result = await projectOnboarding({
				projectPath: "/path/to/node-project",
				projectName: "Node Project",
				analysisDepth: "quick",
				includeMemories: false,
			});

			const text = result.content[0].text;

			expect(text).toContain("npm/yarn");
		});
	});

	describe("Mode Switcher", () => {
		it("should switch to planning mode", async () => {
			const result = await modeSwitcher({
				targetMode: "planning",
				reason: "Complex feature implementation",
			});

			const text = result.content[0].text;

			expect(text).toContain("Mode Switch: Planning Mode");
			expect(text).toContain("Focus on analysis, design");
			expect(text).toContain("Enabled Tools");
			expect(text).toContain("hierarchical-prompt-builder");
			expect(text).toContain("Next Steps in Planning Mode");
		});

		it("should switch to editing mode", async () => {
			const result = await modeSwitcher({
				currentMode: "planning",
				targetMode: "editing",
				reason: "Implementation phase started",
			});

			const text = result.content[0].text;

			expect(text).toContain("Planning Mode");
			expect(text).toContain("Editing Mode");
			expect(text).toContain("semantic-code-analyzer");
			expect(text).toContain("Make precise code changes");
		});

		it("should provide debugging mode guidance", async () => {
			const result = await modeSwitcher({
				targetMode: "debugging",
				context: "ide-assistant",
			});

			const text = result.content[0].text;

			expect(text).toContain("Debugging Mode");
			expect(text).toContain("Reproduce the issue");
			expect(text).toContain("IDE Assistant Context");
		});

		it("should handle one-shot mode", async () => {
			const result = await modeSwitcher({
				targetMode: "one-shot",
				reason: "Generate comprehensive report",
			});

			const text = result.content[0].text;

			expect(text).toContain("One-Shot Mode");
			expect(text).toContain("Complete tasks in a single");
			expect(text).toContain("Gather ALL necessary context");
		});
	});

	describe("Integration Tests", () => {
		it("should work together: analyze code in analysis mode", async () => {
			// First switch to analysis mode
			const modeResult = await modeSwitcher({
				targetMode: "analysis",
			});
			expect(modeResult.content[0].text).toContain("Analysis Mode");

			// Then analyze some code
			const analysisResult = await semanticCodeAnalyzer({
				codeContent: `
class DataProcessor {
  process(data) {
    return data.map(item => item * 2);
  }
}
`,
				analysisType: "all",
			});
			expect(analysisResult.content[0].text).toContain("DataProcessor");
		});

		it("should onboard project and provide next steps", async () => {
			const onboardResult = await projectOnboarding({
				projectPath: "/path/to/test-project",
				projectName: "Test Project",
				includeMemories: true,
			});

			const text = onboardResult.content[0].text;

			expect(text).toContain("Next Steps");
			expect(text).toContain("Review the project structure");
			expect(text).toContain("Onboarding Success Criteria");
		});
	});
});
