import { promises as fs } from "node:fs";
import {
	type ConstitutionConstraints,
	createInitialSessionState,
	generateAdr,
	generatePlan,
	generateProgress,
	generateReadme,
	generateRoadmap,
	generateSpec,
	generateTasks,
	type SpecKitInput,
	SpecKitInputSchema,
	type SpecKitOutput,
	validateAgainstConstitution,
} from "../../domain/speckit/index.js";
import { BaseStrategy } from "../shared/base-strategy.js";
import type { ValidationResult as BaseValidationResult } from "../shared/types.js";

export class SpecKitStrategy extends BaseStrategy<unknown, SpecKitOutput> {
	protected readonly name = "speckit";
	protected readonly version = "2.0.0";

	private validatedInput: SpecKitInput | null = null;

	validate(input: unknown): BaseValidationResult {
		const parsed = SpecKitInputSchema.safeParse(input);
		if (!parsed.success) {
			return {
				valid: false,
				errors: parsed.error.issues.map((issue) => ({
					code: "VALIDATION_ERROR",
					message: issue.message,
					field: issue.path.join("."),
				})),
				warnings: [],
			};
		}

		this.validatedInput = parsed.data;
		return { valid: true, errors: [], warnings: [] };
	}

	async execute(input: unknown): Promise<SpecKitOutput> {
		const parsed = this.validatedInput ?? SpecKitInputSchema.parse(input);
		const state = createInitialSessionState(parsed);
		const start = Date.now();

		this.trace.recordDecision("initialize", "Session state initialized", {
			title: parsed.title,
		});

		if (parsed.constitutionPath) {
			state.constitution = await this.loadConstitution(parsed.constitutionPath);
			this.trace.recordDecision("load-constitution", "Constitution loaded", {
				path: parsed.constitutionPath,
				loaded: Boolean(state.constitution),
			});
		}

		const generated = [
			generateReadme(state),
			generateSpec(state),
			generatePlan(state),
			generateTasks(state),
			generateProgress(state),
			generateAdr(state),
			generateRoadmap(state),
		];
		this.trace.recordDecision("generate-documents", "Generated artifacts", {
			count: generated.length,
		});

		const validation =
			parsed.validateAgainstConstitution && state.constitution
				? validateAgainstConstitution(state, state.constitution)
				: null;

		if (validation) {
			this.trace.recordMetric("validation_score", validation.score);
		}

		const duration = Date.now() - start;
		this.trace.recordMetric("total_duration_ms", duration, "ms");

		return {
			artifacts: {
				readme: generated[0].content,
				spec: generated[1].content,
				plan: generated[2].content,
				tasks: generated[3].content,
				progress: generated[4].content,
				adr: generated[5].content,
				roadmap: generated[6].content,
			},
			validation,
			stats: {
				totalDuration: duration,
				documentsGenerated: generated.length,
				totalTokens: generated.reduce(
					(sum, item) => sum + item.tokenEstimate,
					0,
				),
				warnings: [],
			},
		};
	}

	private async loadConstitution(
		path: string,
	): Promise<ConstitutionConstraints | null> {
		try {
			const content = await fs.readFile(path, "utf-8");
			const rules = content
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.startsWith("- "))
				.map((line, index) => {
					const description = line.replace(/^-\s*/, "");
					return {
						id: `RULE-${index + 1}`,
						description,
						severity: "warning" as const,
						check: () => true,
					};
				});
			return { path, loadedAt: new Date(), rules };
		} catch {
			this.trace.recordWarning("Constitution could not be loaded", { path });
			return null;
		}
	}
}
