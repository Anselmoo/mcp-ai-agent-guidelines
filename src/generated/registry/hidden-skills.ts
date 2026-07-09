// AUTO-GENERATED — do not edit manually.

import type { SkillModule } from "../../contracts/runtime.js";
import { skillModule as adapt_aco_router_module } from "../../skills/adapt/adapt-aco-router.js";
import { skillModule as adapt_annealing_module } from "../../skills/adapt/adapt-annealing.js";
import { skillModule as adapt_hebbian_router_module } from "../../skills/adapt/adapt-hebbian-router.js";
import { skillModule as adapt_physarum_router_module } from "../../skills/adapt/adapt-physarum-router.js";
import { skillModule as adapt_quorum_module } from "../../skills/adapt/adapt-quorum.js";
import { skillModule as arch_reliability_module } from "../../skills/arch/arch-reliability.js";
import { skillModule as arch_scalability_module } from "../../skills/arch/arch-scalability.js";
import { skillModule as arch_security_module } from "../../skills/arch/arch-security.js";
import { skillModule as arch_system_module } from "../../skills/arch/arch-system.js";
import { skillModule as bench_analyzer_module } from "../../skills/bench/bench-analyzer.js";
import { skillModule as bench_blind_comparison_module } from "../../skills/bench/bench-blind-comparison.js";
import { skillModule as bench_eval_suite_module } from "../../skills/bench/bench-eval-suite.js";
import { skillModule as debug_assistant_module } from "../../skills/debug/debug-assistant.js";
import { skillModule as debug_postmortem_module } from "../../skills/debug/debug-postmortem.js";
import { skillModule as debug_reproduction_module } from "../../skills/debug/debug-reproduction.js";
import { skillModule as debug_root_cause_module } from "../../skills/debug/debug-root-cause.js";
import { skillModule as doc_api_module } from "../../skills/doc/doc-api.js";
import { skillModule as doc_generator_module } from "../../skills/doc/doc-generator.js";
import { skillModule as doc_readme_module } from "../../skills/doc/doc-readme.js";
import { skillModule as doc_runbook_module } from "../../skills/doc/doc-runbook.js";
import { skillModule as eval_design_module } from "../../skills/eval/eval-design.js";
import { skillModule as eval_output_grading_module } from "../../skills/eval/eval-output-grading.js";
import { skillModule as eval_prompt_module } from "../../skills/eval/eval-prompt.js";
import { skillModule as eval_prompt_bench_module } from "../../skills/eval/eval-prompt-bench.js";
import { skillModule as eval_variance_module } from "../../skills/eval/eval-variance.js";
import { skillModule as flow_context_handoff_module } from "../../skills/flow/flow-context-handoff.js";
import { skillModule as flow_mode_switching_module } from "../../skills/flow/flow-mode-switching.js";
import { skillModule as flow_orchestrator_module } from "../../skills/flow/flow-orchestrator.js";
import { skillModule as gov_data_guardrails_module } from "../../skills/gov/gov-data-guardrails.js";
import { skillModule as gov_model_compatibility_module } from "../../skills/gov/gov-model-compatibility.js";
import { skillModule as gov_model_governance_module } from "../../skills/gov/gov-model-governance.js";
import { skillModule as gov_policy_validation_module } from "../../skills/gov/gov-policy-validation.js";
import { skillModule as gov_prompt_injection_hardening_module } from "../../skills/gov/gov-prompt-injection-hardening.js";
import { skillModule as gov_regulated_workflow_design_module } from "../../skills/gov/gov-regulated-workflow-design.js";
import { skillModule as gov_workflow_compliance_module } from "../../skills/gov/gov-workflow-compliance.js";
import { skillModule as lead_capability_mapping_module } from "../../skills/lead/lead-capability-mapping.js";
import { skillModule as lead_digital_architect_module } from "../../skills/lead/lead-digital-architect.js";
import { skillModule as lead_exec_briefing_module } from "../../skills/lead/lead-exec-briefing.js";
import { skillModule as lead_l9_engineer_module } from "../../skills/lead/lead-l9-engineer.js";
import { skillModule as lead_software_evangelist_module } from "../../skills/lead/lead-software-evangelist.js";
import { skillModule as lead_staff_mentor_module } from "../../skills/lead/lead-staff-mentor.js";
import { skillModule as lead_transformation_roadmap_module } from "../../skills/lead/lead-transformation-roadmap.js";
import { skillModule as orch_agent_orchestrator_module } from "../../skills/orch/orch-agent-orchestrator.js";
import { skillModule as orch_delegation_module } from "../../skills/orch/orch-delegation.js";
import { skillModule as orch_multi_agent_module } from "../../skills/orch/orch-multi-agent.js";
import { skillModule as orch_result_synthesis_module } from "../../skills/orch/orch-result-synthesis.js";
import { skillModule as prompt_chaining_module } from "../../skills/prompt/prompt-chaining.js";
import { skillModule as prompt_engineering_module } from "../../skills/prompt/prompt-engineering.js";
import { skillModule as prompt_hierarchy_module } from "../../skills/prompt/prompt-hierarchy.js";
import { skillModule as prompt_refinement_module } from "../../skills/prompt/prompt-refinement.js";
import { skillModule as qual_code_analysis_module } from "../../skills/qual/qual-code-analysis.js";
import { skillModule as qual_performance_module } from "../../skills/qual/qual-performance.js";
import { skillModule as qual_refactoring_priority_module } from "../../skills/qual/qual-refactoring-priority.js";
import { skillModule as qual_review_module } from "../../skills/qual/qual-review.js";
import { skillModule as qual_security_module } from "../../skills/qual/qual-security.js";
import { skillModule as req_acceptance_criteria_module } from "../../skills/req/req-acceptance-criteria.js";
import { skillModule as req_ambiguity_detection_module } from "../../skills/req/req-ambiguity-detection.js";
import { skillModule as req_analysis_module } from "../../skills/req/req-analysis.js";
import { skillModule as req_scope_module } from "../../skills/req/req-scope.js";
import { skillModule as resil_clone_mutate_module } from "../../skills/resil/resil-clone-mutate.js";
import { skillModule as resil_homeostatic_module } from "../../skills/resil/resil-homeostatic.js";
import { skillModule as resil_membrane_module } from "../../skills/resil/resil-membrane.js";
import { skillModule as resil_redundant_voter_module } from "../../skills/resil/resil-redundant-voter.js";
import { skillModule as resil_replay_module } from "../../skills/resil/resil-replay.js";
import { skillModule as strat_advisor_module } from "../../skills/strat/strat-advisor.js";
import { skillModule as strat_prioritization_module } from "../../skills/strat/strat-prioritization.js";
import { skillModule as strat_roadmap_module } from "../../skills/strat/strat-roadmap.js";
import { skillModule as strat_tradeoff_module } from "../../skills/strat/strat-tradeoff.js";
import { skillModule as synth_comparative_module } from "../../skills/synth/synth-comparative.js";
import { skillModule as synth_engine_module } from "../../skills/synth/synth-engine.js";
import { skillModule as synth_recommendation_module } from "../../skills/synth/synth-recommendation.js";
import { skillModule as synth_research_module } from "../../skills/synth/synth-research.js";

export const HIDDEN_SKILL_MODULES: SkillModule[] = [
	adapt_aco_router_module,
	adapt_annealing_module,
	bench_analyzer_module,
	bench_blind_comparison_module,
	lead_capability_mapping_module,
	resil_clone_mutate_module,
	lead_digital_architect_module,
	bench_eval_suite_module,
	lead_exec_briefing_module,
	adapt_hebbian_router_module,
	resil_homeostatic_module,
	lead_l9_engineer_module,
	resil_membrane_module,
	adapt_physarum_router_module,
	adapt_quorum_module,
	resil_redundant_voter_module,
	resil_replay_module,
	lead_staff_mentor_module,
	lead_transformation_roadmap_module,
	req_acceptance_criteria_module,
	orch_agent_orchestrator_module,
	req_ambiguity_detection_module,
	doc_api_module,
	qual_code_analysis_module,
	synth_comparative_module,
	flow_context_handoff_module,
	debug_assistant_module,
	orch_delegation_module,
	doc_generator_module,
	eval_design_module,
	debug_postmortem_module,
	flow_mode_switching_module,
	orch_multi_agent_module,
	eval_output_grading_module,
	qual_performance_module,
	strat_prioritization_module,
	eval_prompt_bench_module,
	prompt_chaining_module,
	prompt_engineering_module,
	eval_prompt_module,
	prompt_hierarchy_module,
	prompt_refinement_module,
	qual_review_module,
	doc_readme_module,
	synth_recommendation_module,
	qual_refactoring_priority_module,
	arch_reliability_module,
	debug_reproduction_module,
	req_analysis_module,
	synth_research_module,
	orch_result_synthesis_module,
	strat_roadmap_module,
	debug_root_cause_module,
	doc_runbook_module,
	arch_scalability_module,
	req_scope_module,
	arch_security_module,
	qual_security_module,
	strat_advisor_module,
	synth_engine_module,
	arch_system_module,
	strat_tradeoff_module,
	eval_variance_module,
	flow_orchestrator_module,
	gov_data_guardrails_module,
	gov_model_compatibility_module,
	gov_model_governance_module,
	gov_policy_validation_module,
	gov_prompt_injection_hardening_module,
	gov_regulated_workflow_design_module,
	gov_workflow_compliance_module,
	lead_software_evangelist_module,
];
