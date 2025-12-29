import { expect, test } from "vitest";
import {
	__setMermaidModuleProvider,
	validateDiagram,
} from "../../../src/tools/mermaid/validator.js";

// Direct function provider
test("validateDiagram succeeds with direct function provider", async () => {
	__setMermaidModuleProvider(() => (code: string) => true);
	const res = await validateDiagram("flowchart TD\nA --> B");
	expect(res.valid).toBe(true);
	__setMermaidModuleProvider(null);
});

// Module with parse method
test("validateDiagram succeeds with module parse method", async () => {
	__setMermaidModuleProvider(() => ({ parse: (c: string) => {} }));
	const res = await validateDiagram("flowchart TD\nA --> B");
	expect(res.valid).toBe(true);
	__setMermaidModuleProvider(null);
});

// Throws module-not-found like error -> treated as skipped
test("validateDiagram returns skipped when provider throws module-not-found style error", async () => {
	__setMermaidModuleProvider(() => {
		throw new Error("Cannot find module 'mermaid'");
	});
	const res = await validateDiagram("flowchart TD\nA --> B");
	expect(res.valid).toBe(true);
	expect(res.skipped).toBe(true);
	__setMermaidModuleProvider(null);
});

// Throws a parse error -> should return valid:false and error present
test("validateDiagram returns invalid on parse exception", async () => {
	__setMermaidModuleProvider(() => ({
		parse: () => {
			throw new Error("Syntax error at line 1");
		},
	}));
	const res = await validateDiagram("flowchart broken");
	expect(res.valid).toBe(false);
	expect(res.error).toMatch(/Syntax error/);
	__setMermaidModuleProvider(null);
});

// Async parse rejection should surface as invalid
test("validateDiagram returns invalid when parse returns rejected promise", async () => {
	__setMermaidModuleProvider(() => ({
		parse: async () => {
			return Promise.reject(new Error("Async syntax error"));
		},
	}));
	const res = await validateDiagram("sequence broken");
	expect(res.valid).toBe(false);
	expect((res as any).error).toContain("Async syntax error");
	__setMermaidModuleProvider(null);
});

// Concurrent calls reuse the same loader promise and provider is invoked only once
test("validateDiagram concurrent calls reuse loader promise", async () => {
	let providerCalls = 0;
	__setMermaidModuleProvider(() => {
		providerCalls++;
		return {
			parse: async () => {
				// short delay
				await new Promise((r) => setTimeout(r, 10));
				return true;
			},
		};
	});

	const [r1, r2] = await Promise.all([
		validateDiagram("graph TD\nA-->B"),
		validateDiagram("graph TD\nA-->B"),
	]);

	expect(r1.valid).toBe(true);
	expect(r2.valid).toBe(true);
	expect(providerCalls).toBe(1);
	__setMermaidModuleProvider(null);
});
