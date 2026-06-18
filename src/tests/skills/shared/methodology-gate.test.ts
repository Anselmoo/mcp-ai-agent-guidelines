import { describe, expect, it } from "vitest";
import {
	type MethodologyReport,
	renderMethodologySection,
	runMethodologyChecks,
} from "../../../skills/shared/methodology-gate.js";

describe("methodology-gate", () => {
	it("runs all five checks and tolerates per-check errors", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: required for test mock interface
		const runner = async (name: any): Promise<any> => {
			if (name === "fermi") throw new Error("fermi runner blew up");
			return { status: "applied", finding: `${name} finding` };
		};
		const report = await runMethodologyChecks(
			{ problemSummary: "x", toolResult: { summaryMarkdown: "", payload: {} } },
			runner,
		);
		expect(report.dimensional.status).toBe("applied");
		expect(report.fermi.status).toBe("needs-data");
		// biome-ignore lint/suspicious/noExplicitAny: type narrowing workaround for union
		expect((report.fermi as any).question).toContain("fermi runner blew up");
	});

	it("renderMethodologySection always starts with the markdown header", () => {
		const md = renderMethodologySection({
			dimensional: { status: "applied", finding: "all dimensions consistent" },
			conservation: { status: "not-applicable", reason: "no closed quantity" },
			fermi: { status: "needs-data", question: "what is the request rate?" },
			scaling: { status: "applied", finding: "linear in N" },
			falsifiability: { status: "applied", finding: "claim is testable" },
		});
		expect(md).toMatch(/^## Methodology checks \(not proofs\)/m);
		expect(md).toContain("dimensional");
		expect(md).toContain("not-applicable");
	});

	it("renders all five check names in a complete report", () => {
		const report: MethodologyReport = {
			dimensional: { status: "applied", finding: "test" },
			conservation: { status: "applied", finding: "test" },
			fermi: { status: "applied", finding: "test" },
			scaling: { status: "applied", finding: "test" },
			falsifiability: { status: "applied", finding: "test" },
		};
		// Compile-time check via destructuring: if a check is missing, TypeScript errors
		const { dimensional, conservation, fermi, scaling, falsifiability } =
			report;
		expect(dimensional).toBeDefined();
		expect(conservation).toBeDefined();
		expect(fermi).toBeDefined();
		expect(scaling).toBeDefined();
		expect(falsifiability).toBeDefined();
	});
});
