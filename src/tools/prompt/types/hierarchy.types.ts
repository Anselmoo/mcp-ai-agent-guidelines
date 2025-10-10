// Prompting hierarchy evaluator types
import { z } from "zod";

/**
 * Prompting Hierarchy Levels
 * Inspired by educational support hierarchies and HPT (Hierarchical Prompting Taxonomy)
 *
 * Levels from least to most supportive/specific:
 * 1. Independent - Minimal guidance, agent operates autonomously
 * 2. Indirect - Subtle hints, environmental cues
 * 3. Direct - Clear instructions without specific steps
 * 4. Modeling - Examples and demonstrations
 * 5. Scaffolding - Step-by-step guidance with support
 * 6. Full Physical - Complete detailed specification
 */

export const PromptingHierarchyLevel = z.enum([
	"independent",
	"indirect",
	"direct",
	"modeling",
	"scaffolding",
	"full-physical",
]);

export type PromptingHierarchyLevel = z.infer<typeof PromptingHierarchyLevel>;

/**
 * Numeric Evaluation Schema
 * Reinforcement Learning inspired scoring system
 */
export interface NumericEvaluation {
	// Overall quality score (0-100)
	overallScore: number;

	// Component scores (0-100 each)
	clarity: number;
	specificity: number;
	completeness: number;
	structure: number;

	// Hierarchy assessment
	hierarchyLevel: PromptingHierarchyLevel;
	hierarchyScore: number; // How well it matches the intended level (0-100)

	// Cognitive load assessment (based on HPT)
	cognitiveComplexity: number; // 0-100, higher = more complex

	// Effectiveness prediction (RL-style reward signal)
	predictedEffectiveness: number; // 0-100

	// Confidence in evaluation
	confidence: number; // 0-100
}

export interface HierarchyLevelDefinition {
	level: PromptingHierarchyLevel;
	name: string;
	description: string;
	characteristics: string[];
	examples: string[];
	useCases: string[];
	cognitiveLoad: "low" | "medium" | "high";
	autonomyLevel: "high" | "medium" | "low";
}
