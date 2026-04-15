import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
	getRequiredWorkflowSpecInputKeys,
	getWorkflowSpecById,
	getWorkflowSpecInputKeys,
	metaRoutingWorkflow,
} from "../../workflows/workflow-spec.js";

describe("workflow-spec registry bridge", () => {
	it("can lookup workflow spec by id", () => {
		const spec = getWorkflowSpecById("meta-routing");
		expect(spec).toBeDefined();
		expect(spec?.key).toBe("meta-routing");
		expect(spec?.label).toBe("Meta-Routing");
	});

	it("returns undefined for unknown id", () => {
		const spec = getWorkflowSpecById("does-not-exist");
		expect(spec).toBeUndefined();
	});

	it("extracts workflow input keys and required keys from object schemas", () => {
		expect(getWorkflowSpecInputKeys(metaRoutingWorkflow)).toEqual([
			"request",
			"context",
			"taskType",
			"currentPhase",
			"physicsAnalysisJustification",
		]);
		expect(getRequiredWorkflowSpecInputKeys(metaRoutingWorkflow)).toEqual([
			"request",
		]);
	});

	it("returns empty key lists for non-object workflow input schemas", () => {
		const nonObjectWorkflow = {
			...metaRoutingWorkflow,
			inputSchema: z.string(),
		};

		expect(getWorkflowSpecInputKeys(nonObjectWorkflow)).toEqual([]);
		expect(getRequiredWorkflowSpecInputKeys(nonObjectWorkflow)).toEqual([]);
	});
});
