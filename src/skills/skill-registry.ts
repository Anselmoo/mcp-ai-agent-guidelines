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
import {
	createWorkspaceSurface,
	type WorkspaceSurface,
} from "./runtime/workspace-adapter.js";

interface SkillRegistryOptions {
	modules?: SkillModule[];
	resolver?: SkillResolver;
	/**
	 * Workspace reader injected into the SkillExecutionRuntime for every
	 * skill execution.  Defaults to a real filesystem reader rooted at
	 * process.cwd().  Pass a mock in tests that verify substrate-backed behavior.
	 * Pass `undefined` explicitly to disable workspace access for all skills.
	 *
	 * When the supplied reader also implements the richer WorkspaceSurface
	 * interface (has `listArtifacts`), it is automatically exposed as
	 * `workspaceSurface` on the skill runtime.
	 */
	workspace?: WorkspaceReader | null;
}

/**
 * Duck-type guard: returns true when `w` implements the WorkspaceSurface
 * methods beyond the basic WorkspaceReader.
 */
function isWorkspaceSurface(
	w: WorkspaceReader | undefined,
): w is WorkspaceSurface {
	return (
		w !== undefined &&
		typeof (w as WorkspaceSurface).listArtifacts === "function"
	);
}

export class SkillRegistry {
	private readonly byId: Map<string, SkillModule>;
	private readonly resolver: SkillResolver;
	private readonly workspace: WorkspaceReader | undefined;
	/**
	 * The richer surface — populated whenever `workspace` is (or resolves to)
	 * a full WorkspaceSurface.  Undefined when only a plain WorkspaceReader
	 * was supplied.
	 */
	private readonly workspaceSurface: WorkspaceSurface | undefined;

	constructor(options: SkillRegistryOptions = {}) {
		const modules = options.modules ?? HIDDEN_SKILL_MODULES;
		this.resolver = options.resolver ?? defaultSkillResolver;

		// Resolve the workspace:
		//   null  → disabled (both workspace and workspaceSurface stay undefined)
		//   undefined → default real filesystem surface (full WorkspaceSurface)
		//   WorkspaceReader → use as-is; promote to WorkspaceSurface if possible
		const resolved: WorkspaceReader | undefined =
			options.workspace === null
				? undefined
				: (options.workspace ?? createWorkspaceSurface());

		this.workspace = resolved;
		this.workspaceSurface = isWorkspaceSurface(resolved) ? resolved : undefined;

		this.byId = new Map(modules.map((module) => [module.manifest.id, module]));
	}

	getAll(): SkillModule[] {
		return [...this.byId.values()];
	}

	getById(skillId: string): SkillModule | undefined {
		return this.byId.get(skillId);
	}

	/**
	 * Enrich a SkillExecutionRuntime with the workspace substrate managed by
	 * this registry.
	 *
	 * The registry's `workspace` and `workspaceSurface` take precedence over
	 * anything already present on `base` so that every skill execution — even
	 * those dispatched directly from OrchestrationRuntime or
	 * IntegratedSkillRuntime — receives the same rich substrate.
	 *
	 * When `workspace` is `undefined` (registry was constructed without one),
	 * the base runtime's existing values are preserved.
	 */
	buildSkillRuntime(base: SkillExecutionRuntime): SkillExecutionRuntime {
		// Only overlay if the registry actually has workspace configured.
		if (this.workspace === undefined && this.workspaceSurface === undefined) {
			return base;
		}
		return {
			...base,
			workspace: this.workspace ?? base.workspace,
			workspaceSurface: this.workspaceSurface ?? base.workspaceSurface,
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
			workspaceSurface: this.workspaceSurface,
		};

		assertPhysicsSkillQuorum(
			skillId,
			input.request,
			input.physicsAnalysisJustification,
		);

		return skill.run(input, skillRuntime);
	}
}
