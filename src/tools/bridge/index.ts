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
 * - Project scanning to extract real project structure
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
 *
 * ### Project Scanner
 * ```typescript
 * import { projectScanner } from './bridge';
 *
 * // Scan a project directory
 * const structure = await projectScanner.scan('/path/to/project');
 * console.log(structure.name, structure.type, structure.frameworks);
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
// Project Scanner
export {
	type ConfigFile,
	type Dependency,
	type DirectoryNode,
	type Framework,
	ProjectScanner,
	type ProjectStructure,
	type ProjectType,
	projectScanner,
	type ScanOptions,
} from "./project-scanner.js";
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
