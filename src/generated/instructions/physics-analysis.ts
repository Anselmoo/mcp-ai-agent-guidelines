// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "physics-analysis",
	toolName: "physics-analysis",
	aliases: [],
	displayName: "Physics Analysis: QM and GR Code Metaphors",
	description:
		"Use when conventional code analysis tools are insufficient and physics-inspired metaphors are needed: quantum mechanics analogies for coupling, coverage, and style analysis; general relativity analogies for technical debt, module gravitational mass, and refactoring paths. Covers all 30 QM+GR skills with explicit confidence tiers. NOT an entry point — always arrive here from another instruction (refactor, design, review, evaluate, research, debug). Do NOT use as a first-call tool.",
	sourcePath: "src/instructions/instruction-specs.ts#physics-analysis",
	mission:
		"Apply QM/GR analogies with explicit translation, confidence tiers, and conventional fallbacks. Home base for all 30 physics skills.",
	inputSchema: {
		type: "object",
		properties: {
			request: {
				type: "string",
				description: "Primary task request for this workflow.",
			},
			context: {
				type: "string",
				description: "Relevant background context for the workflow.",
			},
			conventionalEvidence: {
				type: "string",
				description:
					"Conventional analysis attempted before physics metaphors.",
			},
			targetQuestion: {
				type: "string",
				description: "Question the physics analysis should answer.",
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "physics-analysis",
		steps: [
			{
				kind: "parallel",
				label: "QM FOUNDATIONS",
				steps: [
					{
						kind: "invokeSkill",
						label: "qm-entanglement-mapper",
						skillId: "qm-entanglement-mapper",
					},
					{
						kind: "invokeSkill",
						label: "qm-heisenberg-picture",
						skillId: "qm-heisenberg-picture",
					},
					{
						kind: "invokeSkill",
						label: "qm-hamiltonian-descent",
						skillId: "qm-hamiltonian-descent",
					},
					{
						kind: "invokeSkill",
						label: "qm-wavefunction-coverage",
						skillId: "qm-wavefunction-coverage",
					},
					{
						kind: "invokeSkill",
						label: "qm-decoherence-sentinel",
						skillId: "qm-decoherence-sentinel",
					},
				],
			},
			{
				kind: "parallel",
				label: "QM DECISION SURFACE",
				steps: [
					{
						kind: "invokeSkill",
						label: "qm-bloch-interpolator",
						skillId: "qm-bloch-interpolator",
					},
					{
						kind: "invokeSkill",
						label: "qm-superposition-generator",
						skillId: "qm-superposition-generator",
					},
					{
						kind: "invokeSkill",
						label: "qm-double-slit-interference",
						skillId: "qm-double-slit-interference",
					},
					{
						kind: "invokeSkill",
						label: "qm-measurement-collapse",
						skillId: "qm-measurement-collapse",
					},
					{
						kind: "invokeSkill",
						label: "qm-dirac-notation-mapper",
						skillId: "qm-dirac-notation-mapper",
					},
				],
			},
			{
				kind: "parallel",
				label: "QM EVOLUTION",
				steps: [
					{
						kind: "invokeSkill",
						label: "qm-schrodinger-picture",
						skillId: "qm-schrodinger-picture",
					},
					{
						kind: "invokeSkill",
						label: "qm-path-integral-historian",
						skillId: "qm-path-integral-historian",
					},
					{
						kind: "invokeSkill",
						label: "qm-phase-kickback-reviewer",
						skillId: "qm-phase-kickback-reviewer",
					},
					{
						kind: "invokeSkill",
						label: "qm-tunneling-breakthrough",
						skillId: "qm-tunneling-breakthrough",
					},
					{
						kind: "invokeSkill",
						label: "qm-uncertainty-tradeoff",
						skillId: "qm-uncertainty-tradeoff",
					},
				],
			},
			{
				kind: "parallel",
				label: "GR STRUCTURE",
				steps: [
					{
						kind: "invokeSkill",
						label: "gr-event-horizon-detector",
						skillId: "gr-event-horizon-detector",
					},
					{
						kind: "invokeSkill",
						label: "gr-spacetime-debt-metric",
						skillId: "gr-spacetime-debt-metric",
					},
					{
						kind: "invokeSkill",
						label: "gr-schwarzschild-classifier",
						skillId: "gr-schwarzschild-classifier",
					},
					{
						kind: "invokeSkill",
						label: "gr-tidal-force-analyzer",
						skillId: "gr-tidal-force-analyzer",
					},
					{
						kind: "invokeSkill",
						label: "gr-neutron-star-compactor",
						skillId: "gr-neutron-star-compactor",
					},
				],
			},
			{
				kind: "parallel",
				label: "GR PROPAGATION",
				steps: [
					{
						kind: "invokeSkill",
						label: "gr-gravitational-lensing-tracer",
						skillId: "gr-gravitational-lensing-tracer",
					},
					{
						kind: "invokeSkill",
						label: "gr-frame-dragging-detector",
						skillId: "gr-frame-dragging-detector",
					},
					{
						kind: "invokeSkill",
						label: "gr-hawking-entropy-auditor",
						skillId: "gr-hawking-entropy-auditor",
					},
					{
						kind: "invokeSkill",
						label: "gr-dark-energy-forecaster",
						skillId: "gr-dark-energy-forecaster",
					},
					{
						kind: "invokeSkill",
						label: "gr-inflation-detector",
						skillId: "gr-inflation-detector",
					},
				],
			},
			{
				kind: "parallel",
				label: "GR TRAJECTORY",
				steps: [
					{
						kind: "invokeSkill",
						label: "gr-equivalence-principle-checker",
						skillId: "gr-equivalence-principle-checker",
					},
					{
						kind: "invokeSkill",
						label: "gr-gravitational-wave-detector",
						skillId: "gr-gravitational-wave-detector",
					},
					{
						kind: "invokeSkill",
						label: "gr-penrose-diagram-mapper",
						skillId: "gr-penrose-diagram-mapper",
					},
					{
						kind: "invokeSkill",
						label: "gr-redshift-velocity-mapper",
						skillId: "gr-redshift-velocity-mapper",
					},
					{
						kind: "invokeSkill",
						label: "gr-geodesic-refactor",
						skillId: "gr-geodesic-refactor",
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["code-review", "feature-implement"],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
