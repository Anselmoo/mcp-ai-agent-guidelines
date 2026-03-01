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
	type MarkdownSection,
	type SessionState,
	type SpecKitInput,
	SpecKitInputSchema,
	type SpecKitOutput,
	validateAgainstConstitution,
} from "../../domain/speckit/index.js";
import { BaseStrategy } from "../shared/base-strategy.js";
import type { ValidationResult as BaseValidationResult } from "../shared/types.js";

/**
 * BaseStrategy-backed SpecKit migration strategy.
 *
 * Validates SpecKit input, orchestrates document generation through domain-level
 * pure generators, and optionally evaluates generated content against loaded
 * constitution rules.
 */
export class SpecKitStrategy extends BaseStrategy<unknown, SpecKitOutput> {
	protected readonly name = "speckit";
	protected readonly version = "2.0.0";

	private validatedInput: SpecKitInput | null = null;

	/**
	 * Validate unknown strategy input against SpecKit schema.
	 *
	 * @param input - Raw input payload
	 * @returns Base validation result consumed by BaseStrategy
	 */
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

	/**
	 * Execute SpecKit generation flow for validated input.
	 *
	 * @param input - Raw input payload
	 * @returns Generated SpecKit output artifacts, validation, and stats
	 */
	async execute(input: unknown): Promise<SpecKitOutput> {
		const cachedInput = this.validatedInput;
		this.validatedInput = null;
		const parsed = cachedInput ?? SpecKitInputSchema.parse(input);
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
		const [readme, spec, plan, tasks, progress, adr, roadmap] = generated;
		this.trace.recordDecision("generate-documents", "Generated artifacts", {
			count: generated.length,
		});
		state.sections = {
			readme,
			spec,
			plan,
			tasks,
			progress,
			adr,
			roadmap,
		};

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
				readme: readme.content,
				spec: spec.content,
				plan: plan.content,
				tasks: tasks.content,
				progress: progress.content,
				adr: adr.content,
				roadmap: roadmap.content,
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
						check: (state: SessionState) => {
							const sectionContent = Object.values(state.sections)
								.filter(
									(section): section is MarkdownSection => section !== null,
								)
								.map((section) => section.content);
							if (sectionContent.length === 0) {
								return false;
							}
							return sectionContent
								.join("\n")
								.toLowerCase()
								.includes(description.toLowerCase());
						},
					};
				});
			return { path, loadedAt: new Date(), rules };
		} catch {
			this.trace.recordWarning("Constitution could not be loaded", { path });
			return null;
		}
	}
}
