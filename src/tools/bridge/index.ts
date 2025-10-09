/**
 * Bridge Connectors - Integration Layer
 *
 * This module provides bridge connectors that enable integration between
 * Serena-inspired tools and existing MCP AI Agent Guidelines tools.
 *
 * ## Purpose
 * The bridge layer allows:
 * - Semantic analysis to enhance prompts and strategies
 * - Project onboarding to provide context to all tools
 * - Cross-tool data sharing and enhancement
 *
 * ## Usage
 *
 * ### Semantic Analyzer Bridge
 * ```typescript
 * import { enhancePromptWithSemantics, generateSecurityAnalysisPrompt } from './bridge';
 *
 * // Enhance a prompt with semantic insights
 * const enhancedPrompt = enhancePromptWithSemantics(semanticAnalysis, basePrompt);
 *
 * // Generate security analysis from code semantics
 * const securityPrompt = generateSecurityAnalysisPrompt(semanticAnalysis);
 * ```
 *
 * ### Project Onboarding Bridge
 * ```typescript
 * import { extractProjectContext, generateContextualPrompt } from './bridge';
 *
 * // Extract project context from onboarding
 * const context = extractProjectContext(onboardingResult);
 *
 * // Generate contextual prompts for any task
 * const taskPrompt = generateContextualPrompt(context, "Refactor authentication module");
 * ```
 */

// Project Onboarding Bridge
export {
	enhanceToolWithProjectContext,
	extractProjectContext,
	generateContextualPrompt,
	generateModeGuidance,
	generateProjectSpecificHygieneRules,
	generateStrategyWithProjectContext,
} from "./project-onboarding-bridge.js";
// Semantic Analyzer Bridge
export {
	enhancePromptWithSemantics,
	extractSemanticInsights,
	generateHygieneRecommendations,
	generateSecurityAnalysisPrompt,
	integrateWithStrategyFrameworks,
	suggestRefactorings,
} from "./semantic-analyzer-bridge.js";

/**
 * Combined Integration Example
 *
 * This shows how to use both bridges together:
 *
 * ```typescript
 * import {
 *   extractProjectContext,
 *   extractSemanticInsights,
 *   generateContextualPrompt,
 *   enhancePromptWithSemantics
 * } from './bridge';
 *
 * // 1. Get project context from onboarding
 * const projectContext = extractProjectContext(onboardingResult);
 *
 * // 2. Analyze specific file with semantic analyzer
 * const semanticAnalysis = await semanticCodeAnalyzer({
 *   codeContent: fileContent,
 *   analysisType: 'all'
 * });
 *
 * // 3. Extract insights
 * const insights = extractSemanticInsights(semanticAnalysis.content[0].text);
 *
 * // 4. Create enhanced, contextual prompt for refactoring
 * const basePrompt = generateContextualPrompt(projectContext, "Refactor this module");
 * const enhancedPrompt = enhancePromptWithSemantics(
 *   semanticAnalysis.content[0].text,
 *   basePrompt
 * );
 *
 * // 5. Use enhanced prompt with hierarchical-prompt-builder
 * const refactorPlan = await hierarchicalPromptBuilder({
 *   context: enhancedPrompt,
 *   goal: "Create refactoring plan with semantic and project awareness",
 *   requirements: [
 *     "Preserve existing patterns",
 *     "Follow project conventions",
 *     "Maintain backward compatibility"
 *   ]
 * });
 * ```
 */
