/**
 * Tests for constitution-parser
 *
 * @module tests/strategies/speckit/constitution-parser
 */

import { describe, expect, it } from "vitest";
import { parseConstitution } from "../../../../src/strategies/speckit/constitution-parser.js";

// Sample constitution content for testing
const SAMPLE_CONSTITUTION = `# MCP AI Agent Guidelines — Constitution

> Project-wide principles, constraints, and guidelines that govern all v0.13.x decisions

## 📜 Foundational Principles

### 1. Tool Discoverability First

> Every tool MUST be immediately understandable to an LLM.

**Rationale**: If LLMs can't discover and correctly select tools, the entire system fails.

**Implications**:
- Tool descriptions must be action-oriented and unique
- JSON schemas must include examples

### 2. Pure Domain, Pluggable Output

> Business logic MUST be pure; output formatting MUST be pluggable.

**Rationale**: The same analysis can be rendered as chat, RFC, ADR, or spec.md.

---

## 🚫 Constraints (Non-Negotiable)

### C1: TypeScript Strict Mode

- \`strict: true\` in tsconfig.json
- No \`any\` types without explicit justification

### C2: ESM Module System

- All imports must use \`.js\` extension
- No CommonJS require() statements

---

## 📐 Architecture Rules

### AR1: Layer Dependencies

\`\`\`
Allowed:
  MCPServer → PolyglotGateway → DomainServices
\`\`\`

### AR2: File Organization

\`\`\`
src/
├── index.ts
├── domain/
\`\`\`

---

## 🎨 Design Principles

### DP1: Reduce to Essence

Each tool does **ONE thing** brilliantly.

**Anti-pattern**: hierarchical-prompt-builder that builds, evaluates, AND selects levels
**Pattern**: Three focused tools

### DP2: Progressive Disclosure

Basic usage is obvious; advanced features are discoverable.
`;

describe("parseConstitution", () => {
	describe("basic parsing", () => {
		it("should parse constitution and return all sections", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			expect(result).toBeDefined();
			expect(result.principles).toBeDefined();
			expect(result.constraints).toBeDefined();
			expect(result.architectureRules).toBeDefined();
			expect(result.designPrinciples).toBeDefined();
		});

		it("should extract metadata from constitution", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			expect(result.metadata).toBeDefined();
			expect(result.metadata?.title).toBe(
				"MCP AI Agent Guidelines — Constitution",
			);
			expect(result.metadata?.appliesTo).toBe(
				"v0.13.x and all future versions",
			);
		});
	});

	describe("extractPrinciples", () => {
		it("should extract all numbered principles", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			expect(result.principles).toHaveLength(2);
			expect(result.principles[0].id).toBe("1");
			expect(result.principles[0].title).toBe("Tool Discoverability First");
			expect(result.principles[0].type).toBe("principle");
			expect(result.principles[0].description).toContain(
				"Every tool MUST be immediately understandable",
			);
		});

		it("should extract principle descriptions without the heading", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			const principle1 = result.principles[0];
			expect(principle1.description).not.toContain("### 1.");
			expect(principle1.description).toContain("Rationale");
			expect(principle1.description).toContain("Implications");
		});

		it("should handle multi-line principle content", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			const principle2 = result.principles[1];
			expect(principle2.id).toBe("2");
			expect(principle2.title).toBe("Pure Domain, Pluggable Output");
			expect(principle2.description).toContain("Business logic MUST be pure");
			expect(principle2.description).toContain(
				"The same analysis can be rendered",
			);
		});
	});

	describe("extractConstraints", () => {
		it("should extract all C-prefixed constraints", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			expect(result.constraints).toHaveLength(2);
			expect(result.constraints[0].id).toBe("C1");
			expect(result.constraints[0].title).toBe("TypeScript Strict Mode");
			expect(result.constraints[0].type).toBe("constraint");
		});

		it("should extract constraint descriptions", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			const c1 = result.constraints[0];
			expect(c1.description).toContain("`strict: true` in tsconfig.json");
			expect(c1.description).toContain("No `any` types");

			const c2 = result.constraints[1];
			expect(c2.id).toBe("C2");
			expect(c2.title).toBe("ESM Module System");
			expect(c2.description).toContain("All imports must use `.js` extension");
		});

		it("should not include heading in description", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			const c1 = result.constraints[0];
			expect(c1.description).not.toContain("### C1:");
		});
	});

	describe("extractArchitectureRules", () => {
		it("should extract all AR-prefixed rules", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			expect(result.architectureRules).toHaveLength(2);
			expect(result.architectureRules[0].id).toBe("AR1");
			expect(result.architectureRules[0].title).toBe("Layer Dependencies");
			expect(result.architectureRules[0].type).toBe("architecture-rule");
		});

		it("should extract architecture rule descriptions including code blocks", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			const ar1 = result.architectureRules[0];
			expect(ar1.description).toContain("```");
			expect(ar1.description).toContain("MCPServer → PolyglotGateway");

			const ar2 = result.architectureRules[1];
			expect(ar2.id).toBe("AR2");
			expect(ar2.description).toContain("src/");
			expect(ar2.description).toContain("domain/");
		});
	});

	describe("extractDesignPrinciples", () => {
		it("should extract all DP-prefixed principles", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			expect(result.designPrinciples).toHaveLength(2);
			expect(result.designPrinciples[0].id).toBe("DP1");
			expect(result.designPrinciples[0].title).toBe("Reduce to Essence");
			expect(result.designPrinciples[0].type).toBe("design-principle");
		});

		it("should extract design principle descriptions with patterns", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			const dp1 = result.designPrinciples[0];
			expect(dp1.description).toContain("Each tool does **ONE thing**");
			expect(dp1.description).toContain("Anti-pattern");
			expect(dp1.description).toContain("Pattern");

			const dp2 = result.designPrinciples[1];
			expect(dp2.id).toBe("DP2");
			expect(dp2.title).toBe("Progressive Disclosure");
			expect(dp2.description).toContain("Basic usage is obvious");
		});
	});

	describe("edge cases", () => {
		it("should handle empty content", () => {
			const result = parseConstitution("");

			expect(result.principles).toHaveLength(0);
			expect(result.constraints).toHaveLength(0);
			expect(result.architectureRules).toHaveLength(0);
			expect(result.designPrinciples).toHaveLength(0);
		});

		it("should handle content with no matching patterns", () => {
			const content = "# Some Document\n\nJust plain text.";
			const result = parseConstitution(content);

			expect(result.principles).toHaveLength(0);
			expect(result.constraints).toHaveLength(0);
			expect(result.architectureRules).toHaveLength(0);
			expect(result.designPrinciples).toHaveLength(0);
		});

		it("should handle content with only one type of section", () => {
			const content = `### C1: Test Constraint

This is a test constraint.`;

			const result = parseConstitution(content);

			expect(result.principles).toHaveLength(0);
			expect(result.constraints).toHaveLength(1);
			expect(result.architectureRules).toHaveLength(0);
			expect(result.designPrinciples).toHaveLength(0);
		});
	});

	describe("separator handling", () => {
		it("should remove trailing separator lines from descriptions", () => {
			const result = parseConstitution(SAMPLE_CONSTITUTION);

			// Principles should not have trailing ---
			expect(result.principles[1].description).not.toMatch(/---\s*$/);

			// Constraints should not have trailing ---
			expect(result.constraints[1].description).not.toMatch(/---\s*$/);
		});
	});
});
