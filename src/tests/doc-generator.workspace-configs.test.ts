import { describe, expect, it } from "vitest";
import { skillModule as docGeneratorModule } from "../skills/doc/doc-generator.js";
import {
	createHandlerRuntime,
	createMockWorkspace,
	recommendationText,
} from "./test-helpers/handler-runtime.js";

describe("doc-generator workspace inventory branches", () => {
	it("config-files-only workspace produces configuration-file guidance", async () => {
		const workspace = createMockWorkspace([
			{ name: "settings.toml", type: "file" },
			{ name: ".env.example", type: "file" },
		]);

		const result = await docGeneratorModule.run(
			{ request: "Generate docs" },
			createHandlerRuntime(workspace),
		);
		const text = recommendationText(result);

		expect(result.executionMode).toBe("capability");
		expect(text).toMatch(/configuration file/i);
		expect(text).toMatch(/document configuration keys/i);
		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"eval-criteria",
			"tool-chain",
			"worked-example",
		]);
	});
});
