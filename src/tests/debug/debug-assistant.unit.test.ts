import { describe, expect, it } from "vitest";
import { skillModule as debugAssistantModule } from "../../skills/debug/debug-assistant.js";
import {
	createHandlerRuntime,
	recommendationText,
} from "../test-helpers/handler-runtime.js";

describe("debug-assistant (unit)", () => {
	it("is stateless across repeated matches (no /g regex state)", async () => {
		const runtime = createHandlerRuntime();
		const input = { request: "TypeError: undefined is not a function" };
		const r1 = await debugAssistantModule.run(input, runtime);
		const r2 = await debugAssistantModule.run(input, runtime);

		expect(r1.executionMode).toBe("capability");
		expect(r2.executionMode).toBe("capability");

		const text1 = recommendationText(r1);
		const text2 = recommendationText(r2);
		expect(text1).toMatch(/exception|stack trace|TypeError/i);
		expect(text2).toMatch(/exception|stack trace|TypeError/i);
		expect(text1).toEqual(text2);
	});

	it("behavioural 'debug' keyword triggers debugging hints", async () => {
		const runtime = createHandlerRuntime();
		const res = await debugAssistantModule.run(
			{ request: "Help me debug this wrong output" },
			runtime,
		);
		expect(res.executionMode).toBe("capability");
		const text = recommendationText(res);
		expect(text).toMatch(/failing test|reproduce|reproduction|debug/i);
	});
});
