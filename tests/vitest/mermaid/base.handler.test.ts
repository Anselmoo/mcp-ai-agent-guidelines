import { describe, expect, it } from "vitest";
import { BaseDiagramHandler } from "../../../src/tools/mermaid/handlers/base.handler.js";

class DummyHandler extends BaseDiagramHandler {
	readonly diagramType = "dummy";
	generate(description: string) {
		this.validateInput(description);
		return this.applyTheme(description.toUpperCase(), "test-theme");
	}
}

describe("BaseDiagramHandler behavior", () => {
	const d = new DummyHandler();

	it("applyTheme returns original when no theme", () => {
		expect((d as any).applyTheme("abc")).toBe("abc");
	});

	it("applyTheme prepends init when theme provided", () => {
		const out = (d as any).applyTheme("abc", "dark");
		expect(out).toMatch(/%%\{init:/);
		expect(out).toContain("abc");
	});

	it("validateInput default implementation allows empty description", () => {
		// Should not throw
		expect(() => d.generate("")).not.toThrow();
	});
});
