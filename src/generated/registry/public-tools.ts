// AUTO-GENERATED — do not edit manually.

import type { InstructionModule } from "../../contracts/runtime.js";
import { instructionModule as adapt_module } from "../instructions/adapt.js";
import { instructionModule as bootstrap_module } from "../instructions/bootstrap.js";
import { instructionModule as debug_module } from "../instructions/debug.js";
import { instructionModule as design_module } from "../instructions/design.js";
import { instructionModule as document_module } from "../instructions/document.js";
import { instructionModule as enterprise_module } from "../instructions/enterprise.js";
import { instructionModule as evaluate_module } from "../instructions/evaluate.js";
import { instructionModule as govern_module } from "../instructions/govern.js";
import { instructionModule as implement_module } from "../instructions/implement.js";
import { instructionModule as meta_routing_module } from "../instructions/meta-routing.js";
import { instructionModule as onboard_project_module } from "../instructions/onboard_project.js";
import { instructionModule as orchestrate_module } from "../instructions/orchestrate.js";
import { instructionModule as physics_analysis_module } from "../instructions/physics-analysis.js";
import { instructionModule as plan_module } from "../instructions/plan.js";
import { instructionModule as prompt_engineering_module } from "../instructions/prompt-engineering.js";
import { instructionModule as refactor_module } from "../instructions/refactor.js";
import { instructionModule as research_module } from "../instructions/research.js";
import { instructionModule as resilience_module } from "../instructions/resilience.js";
import { instructionModule as review_module } from "../instructions/review.js";
import { instructionModule as testing_module } from "../instructions/testing.js";

export const WORKFLOW_PUBLIC_INSTRUCTION_MODULES: InstructionModule[] = [
	design_module,
	implement_module,
	research_module,
	review_module,
	plan_module,
	debug_module,
	refactor_module,
	testing_module,
	document_module,
	evaluate_module,
	prompt_engineering_module,
	orchestrate_module,
	enterprise_module,
	govern_module,
	resilience_module,
	adapt_module,
	physics_analysis_module,
];

export const DISCOVERY_PUBLIC_INSTRUCTION_MODULES: InstructionModule[] = [
	bootstrap_module,
	meta_routing_module,
	onboard_project_module,
];

export const PUBLIC_INSTRUCTION_MODULES: InstructionModule[] = [
	...WORKFLOW_PUBLIC_INSTRUCTION_MODULES,
	...DISCOVERY_PUBLIC_INSTRUCTION_MODULES,
];
