import { describe, expect, it } from "vitest";
import { skillModule as debugPostmortemModule } from "../../skills/debug/debug-postmortem.js";
import {
	createHandlerRuntime,
	recommendationText,
} from "../test-helpers/handler-runtime.js";

describe("debug-postmortem (unit)", () => {
	it("returns insufficient-signal guidance when request and context are empty", async () => {
		const runtime = createHandlerRuntime();
		const res = await debugPostmortemModule.run({ request: "x" }, runtime);
		expect(res.executionMode).toBe("capability");
		expect(res.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("includes 'No timeline provided' when hasTimeline is false and omits action items if requested", async () => {
		const runtime = createHandlerRuntime();
		const res = await debugPostmortemModule.run(
			{
				request: "Critical outage after deploy, service down",
				options: {
					incidentSeverity: "major",
					hasTimeline: false,
					includeActionItems: false,
				},
			},
			runtime,
		);
		expect(res.executionMode).toBe("capability");
		const text = recommendationText(res);
		expect(text).toMatch(/No timeline provided/i);
		expect(text).not.toMatch(
			/Write action items|add action items|action items as specific/i,
		);
	});

	it("applies constraints from the request into the guidance when present", async () => {
		const runtime = createHandlerRuntime();
		const res = await debugPostmortemModule.run(
			{
				request: "Data corruption detected in nightly job",
				constraints: ["must not restore from backup", "no downtime"],
			},
			runtime,
		);
		const text = recommendationText(res);
		expect(text).toMatch(/must not restore from backup|no downtime/i);
	});
});
