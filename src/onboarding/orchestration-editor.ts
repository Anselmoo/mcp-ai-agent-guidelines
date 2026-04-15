import { confirm, input, select } from "@inquirer/prompts";
import chalk from "chalk";
import type {
	DomainRouting,
	OrchestrationConfig,
	OrchestrationPattern,
	PhysicalModel,
	WorkloadProfile,
} from "../config/orchestration-config.js";

type EditorMode = "quick" | "full";

interface EditorOptions {
	title?: string;
	mode?: EditorMode;
}

const NONE_VALUE = "__none__";
const MODEL_PROVIDERS = ["openai", "anthropic", "google", "other"] as const;
const PATTERN_PROFILE_FIELDS = [
	"draft_profile",
	"synthesis_profile",
	"plan_profile",
	"critique_profile",
	"finalize_profile",
	"vote_profile",
	"tiebreak_profile",
	"review_profile",
] as const satisfies Array<keyof OrchestrationPattern>;

function formatList(values: string[]) {
	return values.join(", ");
}

function parseCsv(value: string) {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

async function promptString(message: string, defaultValue = "") {
	return input({
		message,
		default: defaultValue,
	});
}

async function promptRequiredString(message: string, defaultValue = "") {
	while (true) {
		const value = await promptString(message, defaultValue);
		if (value.trim().length > 0) {
			return value.trim();
		}
		console.log(chalk.yellow("A value is required."));
	}
}

async function promptNumber(message: string, defaultValue: number) {
	while (true) {
		const value = await promptString(message, String(defaultValue));
		const parsed = Number(value.replaceAll("_", ""));
		if (Number.isFinite(parsed)) {
			return parsed;
		}
		console.log(chalk.yellow("Enter a valid number."));
	}
}

async function promptOptionalNumber(message: string, defaultValue?: number) {
	while (true) {
		const value = await promptString(
			message,
			defaultValue === undefined ? "" : String(defaultValue),
		);
		if (value.trim().length === 0) {
			return undefined;
		}
		const parsed = Number(value.replaceAll("_", ""));
		if (Number.isFinite(parsed)) {
			return parsed;
		}
		console.log(chalk.yellow("Enter a valid number or leave blank."));
	}
}

async function promptCsvList(message: string, defaults: string[]) {
	const value = await promptString(message, formatList(defaults));
	return parseCsv(value);
}

async function promptOptionalSelection(
	message: string,
	options: string[],
	defaultValue?: string,
) {
	const value = await select({
		message,
		default: defaultValue ?? NONE_VALUE,
		choices: [
			{ value: NONE_VALUE, name: "(none)" },
			...options.map((option) => ({ value: option, name: option })),
		],
	});
	return value === NONE_VALUE ? undefined : value;
}

function configSummary(config: OrchestrationConfig) {
	return [
		`Models ${Object.keys(config.models).length} (${Object.values(config.models).filter((model) => model.available).length} available)`,
		`Profiles ${Object.keys(config.profiles).length}`,
		`Routes ${Object.keys(config.routing.domains).length}`,
		`Patterns ${Object.keys(config.orchestration.patterns).length}`,
	].join(" • ");
}

export class OrchestrationConfigEditor {
	async edit(
		initialConfig: OrchestrationConfig,
		options: EditorOptions = {},
	): Promise<OrchestrationConfig> {
		const draft = structuredClone(initialConfig);
		const mode = options.mode ?? "full";
		const title =
			options.title ??
			(mode === "quick"
				? "Quick orchestration configuration"
				: "Interactive orchestration configuration editor");

		console.log(chalk.blue(`\n🧭 ${title}`));
		console.log(chalk.gray(configSummary(draft)));

		const sections =
			mode === "quick"
				? [
						{ value: "environment", name: "Environment settings" },
						{ value: "models", name: "Model fleet and availability" },
						{ value: "save", name: "Save and finish" },
					]
				: [
						{ value: "environment", name: "Environment settings" },
						{ value: "models", name: "Model fleet and availability" },
						{ value: "capabilities", name: "Capability mappings" },
						{ value: "profiles", name: "Workload profiles" },
						{ value: "routing", name: "Domain routing" },
						{ value: "patterns", name: "Orchestration patterns" },
						{ value: "resilience-cache", name: "Resilience and cache" },
						{ value: "save", name: "Save and finish" },
					];

		while (true) {
			const section = await select({
				message: `Choose a section (${configSummary(draft)})`,
				choices: sections,
			});

			if (section === "save") {
				return draft;
			}

			if (section === "environment") {
				await this.editEnvironment(draft);
			}
			if (section === "models") {
				await this.editModels(draft);
			}
			if (section === "capabilities") {
				await this.editCapabilities(draft);
			}
			if (section === "profiles") {
				await this.editProfiles(draft);
			}
			if (section === "routing") {
				await this.editRouting(draft);
			}
			if (section === "patterns") {
				await this.editPatterns(draft);
			}
			if (section === "resilience-cache") {
				await this.editResilienceAndCache(draft);
			}
		}
	}

	private async editEnvironment(config: OrchestrationConfig) {
		console.log(chalk.cyan("\nEnvironment"));
		config.environment.strict_mode = await confirm({
			message: "Enable strict mode?",
			default: config.environment.strict_mode,
		});
		config.environment.default_max_context = await promptNumber(
			"Default max context:",
			config.environment.default_max_context,
		);
		config.environment.enable_cost_tracking = await confirm({
			message: "Enable cost tracking?",
			default: config.environment.enable_cost_tracking,
		});
	}

	private async editModels(config: OrchestrationConfig) {
		console.log(chalk.cyan("\nModels"));
		for (const alias of Object.keys(config.models).sort()) {
			console.log(chalk.gray(`Editing ${alias}`));
			config.models[alias] = await this.promptModel(
				config.models[alias],
				alias,
			);
		}

		while (
			await confirm({
				message: "Add another model alias?",
				default: false,
			})
		) {
			const alias = await promptRequiredString("New model alias:", "model_new");
			config.models[alias] = await this.promptModel(
				{
					id: "new-model-id",
					provider: "openai",
					available: true,
					context_window: config.environment.default_max_context,
				},
				alias,
			);
		}
	}

	private async promptModel(model: PhysicalModel, alias: string) {
		const id = await promptRequiredString(
			`${alias} physical model id:`,
			model.id,
		);
		const provider = await select<(typeof MODEL_PROVIDERS)[number]>({
			message: `${alias} provider:`,
			default: model.provider,
			choices: MODEL_PROVIDERS.map((entry) => ({
				value: entry,
				name: entry,
			})),
		});
		const available = await confirm({
			message: `${alias} available?`,
			default: model.available,
		});
		const reason = available
			? undefined
			: await promptRequiredString(
					`${alias} unavailable reason:`,
					model.reason ?? "Not currently available",
				);

		return {
			id,
			provider,
			available,
			reason,
			context_window: await promptNumber(
				`${alias} context window:`,
				model.context_window,
			),
			cost_per_1k_input: await promptOptionalNumber(
				`${alias} cost per 1k input tokens (blank to omit):`,
				model.cost_per_1k_input,
			),
			cost_per_1k_output: await promptOptionalNumber(
				`${alias} cost per 1k output tokens (blank to omit):`,
				model.cost_per_1k_output,
			),
		} satisfies PhysicalModel;
	}

	private async editCapabilities(config: OrchestrationConfig) {
		console.log(chalk.cyan("\nCapabilities"));
		for (const capability of Object.keys(config.capabilities).sort()) {
			config.capabilities[capability] = await promptCsvList(
				`${capability} aliases (comma-separated):`,
				config.capabilities[capability],
			);
		}

		while (
			await confirm({
				message: "Add another capability tag?",
				default: false,
			})
		) {
			const tag = await promptRequiredString(
				"Capability tag:",
				"new_capability",
			);
			config.capabilities[tag] = await promptCsvList(
				`${tag} aliases (comma-separated):`,
				[],
			);
		}
	}

	private async editProfiles(config: OrchestrationConfig) {
		console.log(chalk.cyan("\nProfiles"));
		const capabilityNames = Object.keys(config.capabilities).sort();

		for (const profileName of Object.keys(config.profiles).sort()) {
			console.log(chalk.gray(`Editing ${profileName}`));
			config.profiles[profileName] = await this.promptProfile(
				config.profiles[profileName],
				profileName,
				capabilityNames,
			);
		}

		while (
			await confirm({
				message: "Add another profile?",
				default: false,
			})
		) {
			const name = await promptRequiredString("Profile name:", "new_profile");
			config.profiles[name] = await this.promptProfile(
				{
					requires: [],
					fallback: [],
					fan_out: 1,
				},
				name,
				capabilityNames,
			);
		}
	}

	private async promptProfile(
		profile: WorkloadProfile,
		name: string,
		capabilityNames: string[],
	) {
		return {
			requires: await promptCsvList(
				`${name}.requires capability tags:`,
				profile.requires,
			),
			prefer: await promptOptionalSelection(
				`${name}.prefer capability tag:`,
				capabilityNames,
				profile.prefer,
			),
			fallback: await promptCsvList(
				`${name}.fallback capability tags:`,
				profile.fallback,
			),
			fan_out: await promptNumber(`${name}.fan_out:`, profile.fan_out),
			max_retries: await promptOptionalNumber(
				`${name}.max_retries (blank to omit):`,
				profile.max_retries,
			),
			require_human_in_loop: await confirm({
				message: `${name}.require_human_in_loop?`,
				default: profile.require_human_in_loop ?? false,
			}),
			enforce_schema: await confirm({
				message: `${name}.enforce_schema?`,
				default: profile.enforce_schema ?? false,
			}),
		} satisfies WorkloadProfile;
	}

	private async editRouting(config: OrchestrationConfig) {
		console.log(chalk.cyan("\nRouting"));
		const profileNames = Object.keys(config.profiles).sort();

		for (const route of Object.keys(config.routing.domains).sort()) {
			console.log(chalk.gray(`Editing ${route}`));
			config.routing.domains[route] = await this.promptRoutingEntry(
				config.routing.domains[route],
				route,
				profileNames,
			);
		}

		while (
			await confirm({
				message: "Add another routing pattern?",
				default: false,
			})
		) {
			const pattern = await promptRequiredString(
				'Routing pattern (for example "custom-*"):',
				"custom-*",
			);
			config.routing.domains[pattern] = await this.promptRoutingEntry(
				{ profile: profileNames[0] ?? "default" },
				pattern,
				profileNames,
			);
		}
	}

	private async promptRoutingEntry(
		routing: DomainRouting,
		pattern: string,
		profileNames: string[],
	) {
		return {
			profile: await select<string>({
				message: `${pattern}.profile:`,
				default: routing.profile,
				choices: profileNames.map((profileName) => ({
					value: profileName,
					name: profileName,
				})),
			}),
			max_retries: await promptOptionalNumber(
				`${pattern}.max_retries (blank to omit):`,
				routing.max_retries,
			),
			require_human_in_loop: await confirm({
				message: `${pattern}.require_human_in_loop?`,
				default: routing.require_human_in_loop ?? false,
			}),
			enforce_schema: await confirm({
				message: `${pattern}.enforce_schema?`,
				default: routing.enforce_schema ?? false,
			}),
		} satisfies DomainRouting;
	}

	private async editPatterns(config: OrchestrationConfig) {
		console.log(chalk.cyan("\nPatterns"));
		const profileNames = Object.keys(config.profiles).sort();

		for (const patternName of Object.keys(
			config.orchestration.patterns,
		).sort()) {
			console.log(chalk.gray(`Editing ${patternName}`));
			config.orchestration.patterns[patternName] = await this.promptPattern(
				config.orchestration.patterns[patternName],
				patternName,
				profileNames,
			);
		}
	}

	private async promptPattern(
		pattern: OrchestrationPattern,
		name: string,
		profileNames: string[],
	) {
		const output: OrchestrationPattern = {
			description: await promptRequiredString(
				`${name}.description:`,
				pattern.description,
			),
		};

		for (const field of PATTERN_PROFILE_FIELDS) {
			output[field] = await promptOptionalSelection(
				`${name}.${field}:`,
				profileNames,
				pattern[field],
			);
		}

		output.fan_out = await promptOptionalNumber(
			`${name}.fan_out (blank to omit):`,
			pattern.fan_out,
		);
		output.vote_count = await promptOptionalNumber(
			`${name}.vote_count (blank to omit):`,
			pattern.vote_count,
		);
		output.cascade_chain = await promptCsvList(
			`${name}.cascade_chain profiles (comma-separated, blank for none):`,
			pattern.cascade_chain ?? [],
		);

		return output;
	}

	private async editResilienceAndCache(config: OrchestrationConfig) {
		console.log(chalk.cyan("\nResilience and cache"));
		config.resilience.rate_limit_backoff_ms = await promptNumber(
			"resilience.rate_limit_backoff_ms:",
			config.resilience.rate_limit_backoff_ms,
		);
		config.resilience.auto_escalate_on_consecutive_failures =
			await promptNumber(
				"resilience.auto_escalate_on_consecutive_failures:",
				config.resilience.auto_escalate_on_consecutive_failures,
			);
		config.resilience.max_escalation_depth = await promptNumber(
			"resilience.max_escalation_depth:",
			config.resilience.max_escalation_depth,
		);
		config.cache.default_ttl_seconds = await promptNumber(
			"cache.default_ttl_seconds:",
			config.cache.default_ttl_seconds,
		);

		const nextOverrides: Record<string, number> = {};
		for (const profileName of Object.keys(config.profiles).sort()) {
			const override = await promptOptionalNumber(
				`cache.profile_overrides.${profileName} (blank to omit):`,
				config.cache.profile_overrides[profileName],
			);
			if (override !== undefined) {
				nextOverrides[profileName] = override;
			}
		}
		config.cache.profile_overrides = nextOverrides;
	}
}
