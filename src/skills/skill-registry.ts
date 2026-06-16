import type {
	InstructionInput,
	SkillExecutionResult,
	SkillExecutionRuntime,
	SkillModule,
	WorkflowExecutionRuntime,
	WorkspaceReader,
} from "../contracts/runtime.js";
import { HIDDEN_SKILL_MODULES } from "../generated/registry/hidden-skills.js";
import { assertPhysicsSkillQuorum } from "../tools/quorum-gate.js";
import type { SkillResolver } from "./runtime/contracts.js";
import { defaultSkillResolver } from "./runtime/default-skill-resolver.js";
import { createWorkspaceSurface } from "./runtime/workspace-adapter.js";

interface SkillRegistryOptions {
	modules?: SkillModule[];
	resolver?: SkillResolver;
	/**
	 * Workspace reader injected into the SkillExecutionRuntime for every
	 * skill execution.  Defaults to a real filesystem reader rooted at
	 * process.cwd().  Pass a mock in tests that verify substrate-backed behavior.
	 * Pass `undefined` explicitly to disable workspace access for all skills.
	 */
	workspace?: WorkspaceReader | null;
}

export class SkillRegistry {
	private readonly byId: Map<string, SkillModule>;
	private readonly resolver: SkillResolver;
	private readonly workspace: WorkspaceReader | undefined;

	constructor(options: SkillRegistryOptions = {}) {
		const modules = options.modules ?? HIDDEN_SKILL_MODULES;
		this.resolver = options.resolver ?? defaultSkillResolver;

		// Resolve the workspace:
		//   null  → disabled (workspace stays undefined)
		//   undefined → default real filesystem reader
		//   WorkspaceReader → use as-is
		this.workspace =
			options.workspace === null
				? undefined
				: (options.workspace ?? createWorkspaceSurface());

		this.byId = new Map(modules.map((module) => [module.manifest.id, module]));
	}

	getAll(): SkillModule[] {
		return [...this.byId.values()];
	}

	getById(skillId: string): SkillModule | undefined {
		return this.byId.get(skillId);
	}

	/**
	 * Enrich a SkillExecutionRuntime with the workspace reader managed by
	 * this registry.  The registry's reader takes precedence over anything
	 * already present on `base` so every skill execution — even those
	 * dispatched directly from OrchestrationRuntime or IntegratedSkillRuntime —
	 * receives the same substrate.  When the registry has no reader configured
	 * (constructed with `workspace: null`), the base runtime's value is preserved.
	 */
	buildSkillRuntime(base: SkillExecutionRuntime): SkillExecutionRuntime {
		if (this.workspace === undefined) {
			return base;
		}
		return {
			...base,
			workspace: this.workspace ?? base.workspace,
		};
	}

	async execute(
		skillId: string,
		input: InstructionInput,
		runtime: WorkflowExecutionRuntime,
	): Promise<SkillExecutionResult> {
		const skill = this.getById(skillId);
		if (!skill) {
			throw new Error(`Unknown hidden skill: ${skillId}`);
		}

		const skillRuntime: SkillExecutionRuntime & {
			resolveSkillHandler: SkillResolver["resolve"];
		} = {
			modelRouter: runtime.modelRouter,
			resolveSkillHandler: this.resolver.resolve.bind(this.resolver),
			workspace: this.workspace,
		};

		assertPhysicsSkillQuorum(
			skillId,
			input.request,
			input.physicsAnalysisJustification,
		);

		return skill.run(input, skillRuntime);
	}
}
