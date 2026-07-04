export type CheckStatus =
	| { status: "applied"; finding: string }
	| { status: "not-applicable"; reason: string }
	| { status: "needs-data"; question: string };

export interface MethodologyReport {
	dimensional: CheckStatus;
	conservation: CheckStatus;
	fermi: CheckStatus;
	scaling: CheckStatus;
	falsifiability: CheckStatus;
}

export interface MethodologyContext {
	problemSummary: string;
	toolResult: { summaryMarkdown: string; payload: unknown };
}

export type CheckRunner = (
	name: keyof MethodologyReport,
	ctx: MethodologyContext,
) => Promise<CheckStatus>;

export async function runMethodologyChecks(
	ctx: MethodologyContext,
	runner: CheckRunner,
): Promise<MethodologyReport> {
	const runCheck = async (
		name: keyof MethodologyReport,
	): Promise<CheckStatus> => {
		try {
			return await runner(name, ctx);
		} catch (error) {
			return {
				status: "needs-data" as const,
				question:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	};

	const [dimensional, conservation, fermi, scaling, falsifiability] =
		await Promise.all([
			runCheck("dimensional"),
			runCheck("conservation"),
			runCheck("fermi"),
			runCheck("scaling"),
			runCheck("falsifiability"),
		]);

	return {
		dimensional,
		conservation,
		fermi,
		scaling,
		falsifiability,
	};
}

export function renderMethodologySection(report: MethodologyReport): string {
	const lines: string[] = ["## Methodology checks (not proofs)"];

	const appliedChecks: string[] = [];
	const notApplicableChecks: string[] = [];
	const needsDataChecks: string[] = [];

	const checkEntries: [keyof MethodologyReport, CheckStatus][] = [
		["dimensional", report.dimensional],
		["conservation", report.conservation],
		["fermi", report.fermi],
		["scaling", report.scaling],
		["falsifiability", report.falsifiability],
	];

	for (const [name, status] of checkEntries) {
		if (status.status === "applied") {
			appliedChecks.push(`- **${name}**: ${status.finding}`);
		} else if (status.status === "not-applicable") {
			notApplicableChecks.push(name);
		} else if (status.status === "needs-data") {
			needsDataChecks.push(`- **${name}** (needs data): ${status.question}`);
		}
	}

	lines.push("", ...appliedChecks);

	if (needsDataChecks.length > 0) {
		lines.push("", ...needsDataChecks);
	}

	if (notApplicableChecks.length > 0) {
		lines.push(`- Skipped (not-applicable): ${notApplicableChecks.join(", ")}`);
	}

	// PAL discipline (program-aided): any number produced by a check must be
	// reproducible arithmetic, not prose. Rendering the contract here keeps
	// pseudo-calculations honest — a reader (or LLM) can re-execute solve().
	lines.push(
		"",
		"When a check produces a number, show it PAL-style so it can be re-run:",
		"",
		"```python",
		"def solve():",
		"    # <named_quantity> = <value>  # <unit> — where the value comes from",
		"    return estimate  # <unit>",
		"```",
		"",
		"Numbers without a reproducible derivation are estimates, not findings.",
	);

	return lines.join("\n");
}
