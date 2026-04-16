import { describe, expect, it } from "vitest";
import { skillModule as docApiModule } from "../skills/doc/doc-api.js";
import { skillModule as docGeneratorModule } from "../skills/doc/doc-generator.js";
import { skillModule as docReadmeModule } from "../skills/doc/doc-readme.js";
import { skillModule as docRunbookModule } from "../skills/doc/doc-runbook.js";
import { createHandlerRuntime } from "./test-helpers/handler-runtime.js";

describe("doc handlers - insufficient signal paths", () => {
	it("doc-api returns insufficient-signal guidance when request is empty", async () => {
		const result = await docApiModule.run(
			{ request: "x" },
			createHandlerRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("API Documentation needs a description");
	});

	it("doc-generator returns insufficient-signal guidance when request is empty", async () => {
		const result = await docGeneratorModule.run(
			{ request: "x" },
			createHandlerRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain(
			"Documentation Generator needs a description",
		);
	});

	it("doc-readme returns insufficient-signal guidance when request is empty", async () => {
		const result = await docReadmeModule.run(
			{ request: "x" },
			createHandlerRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("README Generator needs a description");
	});

	it("doc-runbook returns insufficient-signal guidance when request is empty", async () => {
		const result = await docRunbookModule.run(
			{ request: "x" },
			createHandlerRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Runbook Generator needs a description");
	});
});
