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
	validateAgainstConstitution,
} from "../../domain/speckit/index.js";
import type { OutputArtifacts, RenderOptions } from "../output-strategy.js";
import { BaseStrategy } from "../shared/base-strategy.js";
import type { ValidationResult as BaseValidationResult } from "../shared/types.js";

/**
 * BaseStrategy-backed SpecKit migration strategy.
 *
 * Validates SpecKit input, orchestrates document generation through domain-level
 * pure generators, and optionally evaluates generated content against loaded
 * constitution rules.
 */
export class SpecKitStrategy extends BaseStrategy<unknown, OutputArtifacts> {
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
		// Try SpecKitInput schema first
		const parsed = SpecKitInputSchema.safeParse(input);
		if (parsed.success) {
			this.validatedInput = parsed.data;
			return { valid: true, errors: [], warnings: [] };
		}

		// Fallback: try to convert from SessionState-shaped input
		const converted = this.tryConvertSessionState(input);
		if (converted) {
			this.validatedInput = converted;
			return { valid: true, errors: [], warnings: [] };
		}

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

	private tryConvertSessionState(input: unknown): SpecKitInput | null {
		if (!input || typeof input !== "object") return null;
		const s = input as Record<string, unknown>;
		const cfg = s.config as Record<string, unknown> | undefined;
		const ctx = (cfg?.context ?? s.context) as
			| Record<string, unknown>
			| undefined;
		const goal =
			(typeof cfg?.goal === "string" && cfg.goal) ||
			(typeof ctx?.goal === "string" && ctx.goal) ||
			(typeof s.id === "string" && s.id) ||
			null;
		if (!goal) return null;
		const reqs = Array.isArray(cfg?.requirements)
			? (cfg.requirements as string[])
			: [];
		const consts = Array.isArray(cfg?.constraints)
			? (cfg.constraints as Array<string | { description?: string }>).map(
					(c) => (typeof c === "string" ? c : (c.description ?? "")),
				)
			: [];
		const functionalReqs =
			reqs.length > 0 ? reqs : ["See session requirements"];
		const nonFunctionalReqs = consts.filter(Boolean);
		const allReqs = [
			...functionalReqs.map((r) => ({
				description: r,
				type: "functional" as const,
			})),
			...nonFunctionalReqs.map((c) => ({
				description: c,
				type: "non-functional" as const,
			})),
		];
		return SpecKitInputSchema.parse({
			title: goal,
			overview: (typeof ctx?.overview === "string" && ctx.overview) || goal,
			objectives: (reqs.length > 0 ? reqs : [goal]).map((r) => ({
				description: r,
				priority: "high" as const,
			})),
			requirements:
				allReqs.length > 0
					? allReqs
					: [{ description: goal, type: "functional" as const }],
		});
	}

	/**
	 * Execute SpecKit generation flow for validated input.
	 *
	 * @param input - Raw input payload
	 * @returns Generated SpecKit output as OutputArtifacts
	 */
	async execute(
		input: unknown,
		_options?: Partial<RenderOptions>,
	): Promise<OutputArtifacts> {
		const cachedInput = this.validatedInput;
		this.validatedInput = null;
		const parsed = cachedInput ?? SpecKitInputSchema.parse(input);
		const state = createInitialSessionState(parsed);
		const slug = this.slugify(parsed.title ?? "Feature");
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
			primary: {
				name: `${slug}/README.md`,
				content: readme.content,
				format: "markdown",
			},
			secondary: [
				{ name: `${slug}/spec.md`, content: spec.content, format: "markdown" },
				{ name: `${slug}/plan.md`, content: plan.content, format: "markdown" },
				{
					name: `${slug}/tasks.md`,
					content: tasks.content,
					format: "markdown",
				},
				{
					name: `${slug}/progress.md`,
					content: progress.content,
					format: "markdown",
				},
				{ name: `${slug}/adr.md`, content: adr.content, format: "markdown" },
				{
					name: `${slug}/roadmap.md`,
					content: roadmap.content,
					format: "markdown",
				},
			],
		};
	}

	private slugify(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
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

	/**
	 * Check if this strategy supports a given domain type.
	 *
	 * @param domainType - Domain type identifier
	 * @returns True for SpecKitInput domain types
	 */
	supports(domainType: string): boolean {
		return ["SpecKitInput", "SessionState", "unknown"].includes(domainType);
	}
}
