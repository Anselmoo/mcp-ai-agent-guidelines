import { describe, expect, it } from "vitest";
import { skillModule as docApiModule } from "../skills/doc/doc-api.js";
import { skillModule as docGeneratorModule } from "../skills/doc/doc-generator.js";
import { skillModule as docReadmeModule } from "../skills/doc/doc-readme.js";
import { skillModule as docRunbookModule } from "../skills/doc/doc-runbook.js";

describe("doc skill module shape", () => {
	it("exports a manifest and run function for each doc module", () => {
		expect(docApiModule).toHaveProperty("manifest");
		expect(typeof docApiModule.run).toBe("function");

		expect(docGeneratorModule).toHaveProperty("manifest");
		expect(typeof docGeneratorModule.run).toBe("function");

		expect(docReadmeModule).toHaveProperty("manifest");
		expect(typeof docReadmeModule.run).toBe("function");

		expect(docRunbookModule).toHaveProperty("manifest");
		expect(typeof docRunbookModule.run).toBe("function");
	});
});
