import { describe, expect, it } from "vitest";
import { ReportingCliCommands as DirectReportingCliCommands } from "../../presentation/cli-extensions.js";
import {
	DocumentationIntegrationEngine as DirectDocumentationIntegrationEngine,
	DocumentationIntegrationFactory as DirectDocumentationIntegrationFactory,
} from "../../presentation/documentation-integration.js";
import {
	DocumentationIntegrationEngine,
	DocumentationIntegrationFactory,
	ReportingCliCommands,
} from "../../presentation/index.js";

describe("presentation/index", () => {
	it("re-exports the stable public presentation surface", () => {
		expect(ReportingCliCommands).toBe(DirectReportingCliCommands);
		expect(DocumentationIntegrationEngine).toBe(
			DirectDocumentationIntegrationEngine,
		);
		expect(DocumentationIntegrationFactory).toBe(
			DirectDocumentationIntegrationFactory,
		);
	});
});
