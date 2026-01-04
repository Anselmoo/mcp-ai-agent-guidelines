import { describe, expect, it } from "vitest";
import { promptHierarchy } from "../../../../src/tools/prompt/prompt-hierarchy.js";

describe("prompt-hierarchy", () => {
describe("build mode", () => {
it("should create structured prompt from context/goal/requirements", async () => {
const result = await promptHierarchy({
mode: "build",
context: "Refactoring legacy authentication module",
goal: "Implement JWT-based authentication",
requirements: [
"Replace session-based auth with JWT tokens",
"Maintain backward compatibility",
"Add comprehensive tests",
],
outputFormat: "Markdown with code examples",
audience: "Senior backend developers",
});

expect(result).toBeDefined();
expect(result.content).toBeInstanceOf(Array);
expect(result.content[0].type).toBe("text");

const text = result.content[0].text;
expect(text).toContain("# Context");
expect(text).toContain("Refactoring legacy authentication module");
expect(text).toContain("# Goal");
expect(text).toContain("JWT-based authentication");
expect(text).toContain("# Requirements");
expect(text).toContain("Replace session-based auth");
expect(text).toContain("# Output Format");
expect(text).toContain("# Target Audience");
});

it("should handle missing optional fields", async () => {
const result = await promptHierarchy({
mode: "build",
context: "Simple refactoring task",
goal: "Clean up code",
// No requirements, outputFormat, or audience
});

expect(result).toBeDefined();
const text = result.content[0].text;
expect(text).toContain("# Context");
expect(text).toContain("# Goal");
// Should not contain sections for missing fields
});

it("should throw error when required fields are missing", async () => {
await expect(
promptHierarchy({
mode: "build",
// Missing context and goal
}),
).rejects.toThrow("Build mode requires 'context' and 'goal' fields");
});

it("should pass through optional shared fields", async () => {
const result = await promptHierarchy({
mode: "build",
context: "Testing context",
goal: "Testing goal",
includeReferences: true,
includeMetadata: true,
});

expect(result).toBeDefined();
const text = result.content[0].text;
// These sections should be present when includeReferences is true
expect(text).toContain("Further Reading");
});
});

describe("select mode", () => {
it("should recommend level based on complexity", async () => {
const result = await promptHierarchy({
mode: "select",
taskDescription: "Implement critical payment processing system",
agentCapability: "intermediate",
taskComplexity: "very-complex",
autonomyPreference: "low",
});

expect(result).toBeDefined();
expect(result.content).toBeInstanceOf(Array);
expect(result.content[0].type).toBe("text");

const text = result.content[0].text;
expect(text).toContain("Hierarchy Level Recommendation");
expect(text).toContain("Task Analysis");
expect(text).toContain("Recommended Level");
// For very complex tasks with low autonomy, should recommend high support
expect(text).toMatch(/Scaffolding|Full Physical/);
});

it("should consider agent capability", async () => {
const result = await promptHierarchy({
mode: "select",
taskDescription: "Simple bug fix in documentation",
agentCapability: "expert",
taskComplexity: "simple",
autonomyPreference: "high",
});

expect(result).toBeDefined();
const text = result.content[0].text;
// For expert agent with simple task and high autonomy, should recommend low support
expect(text).toMatch(/Independent|Indirect/);
});

it("should throw error when taskDescription is missing", async () => {
await expect(
promptHierarchy({
mode: "select",
// Missing taskDescription
agentCapability: "intermediate",
}),
).rejects.toThrow("Select mode requires 'taskDescription' field");
});

it("should use default values for optional parameters", async () => {
const result = await promptHierarchy({
mode: "select",
taskDescription: "Regular development task",
// No agentCapability, taskComplexity, autonomyPreference
});

expect(result).toBeDefined();
const text = result.content[0].text;
expect(text).toContain("Hierarchy Level Recommendation");
// Should handle defaults gracefully
});
});

describe("evaluate mode", () => {
it("should score prompt against criteria", async () => {
const result = await promptHierarchy({
mode: "evaluate",
promptText: `Refactor the authentication module:
1. First, analyze the current implementation
2. Then, identify security vulnerabilities
3. Next, implement JWT token support
4. Finally, add comprehensive tests`,
includeRecommendations: true,
});

expect(result).toBeDefined();
expect(result.content).toBeInstanceOf(Array);
expect(result.content[0].type).toBe("text");

const text = result.content[0].text;
expect(text).toContain("Prompting Hierarchy Evaluation");
expect(text).toContain("Overall Score");
expect(text).toContain("Component Scores");
expect(text).toContain("Clarity");
expect(text).toContain("Specificity");
expect(text).toContain("Completeness");
expect(text).toContain("Structure");
});

it("should provide improvement suggestions", async () => {
const result = await promptHierarchy({
mode: "evaluate",
promptText: "Do some optimization",
includeRecommendations: true,
});

expect(result).toBeDefined();
const text = result.content[0].text;
expect(text).toContain("Recommendations");
// Should have recommendations for such a vague prompt
});

it("should detect hierarchy level correctly", async () => {
const result = await promptHierarchy({
mode: "evaluate",
promptText: "Improve the system performance",
targetLevel: "independent",
});

expect(result).toBeDefined();
const text = result.content[0].text;
expect(text).toContain("Independent");
});

it("should throw error when promptText is missing", async () => {
await expect(
promptHierarchy({
mode: "evaluate",
// Missing promptText
}),
).rejects.toThrow("Evaluate mode requires 'promptText' field");
});

it("should handle includeReferences option", async () => {
const result = await promptHierarchy({
mode: "evaluate",
promptText: "Test prompt for evaluation",
includeReferences: true,
});

expect(result).toBeDefined();
const text = result.content[0].text;
expect(text).toContain("Further Reading");
});
});

describe("mode validation", () => {
it("should reject invalid mode", async () => {
await expect(
promptHierarchy({
mode: "invalid-mode",
context: "test",
goal: "test",
}),
).rejects.toThrow();
});

it("should require mode parameter", async () => {
await expect(
promptHierarchy({
// Missing mode
context: "test",
goal: "test",
}),
).rejects.toThrow();
});
});

describe("cross-mode field handling", () => {
it("should accept extra fields gracefully in build mode", async () => {
const result = await promptHierarchy({
mode: "build",
context: "Test context",
goal: "Test goal",
// Extra fields from other modes (should be ignored)
taskDescription: "Should be ignored",
promptText: "Should be ignored",
});

expect(result).toBeDefined();
expect(result.content[0].type).toBe("text");
});

it("should accept extra fields gracefully in select mode", async () => {
const result = await promptHierarchy({
mode: "select",
taskDescription: "Test task",
// Extra fields from other modes (should be ignored)
context: "Should be ignored",
promptText: "Should be ignored",
});

expect(result).toBeDefined();
expect(result.content[0].type).toBe("text");
});

it("should accept extra fields gracefully in evaluate mode", async () => {
const result = await promptHierarchy({
mode: "evaluate",
promptText: "Test prompt",
// Extra fields from other modes (should be ignored)
context: "Should be ignored",
taskDescription: "Should be ignored",
});

expect(result).toBeDefined();
expect(result.content[0].type).toBe("text");
});
});
});
