/**
 * Frameworks barrel — registers all 11 unified framework facades with the FrameworkRouter.
 *
 * T-038 + T-039–T-045: Framework consolidation
 */

export { FrameworkRouter, frameworkRouter } from "./registry.js";
export type { FrameworkDefinition } from "./types.js";

// Framework 8: Agent Orchestration
import { agentOrchestrationFramework } from "./agent-orchestration/index.js";
// Framework 2: Code Quality
import { codeQualityFramework } from "./code-quality/index.js";
// Framework 3: Design & Architecture
import { designArchitectureFramework } from "./design-architecture/index.js";
// Framework 6: Documentation
import { documentationFramework } from "./documentation/index.js";
// Framework 11: Project Management
import { projectManagementFramework } from "./project-management/index.js";
// Framework 1: Prompt Engineering
import { promptEngineeringFramework } from "./prompt-engineering/index.js";
// Framework 9: Prompt Optimization
import { promptOptimizationFramework } from "./prompt-optimization/index.js";
import { frameworkRouter } from "./registry.js";
// Framework 4: Security
import { securityFramework } from "./security/index.js";
// Framework 7: Strategic Planning
import { strategicPlanningFramework } from "./strategic-planning/index.js";
// Framework 5: Testing
import { testingFramework } from "./testing/index.js";
// Framework 10: Visualization
import { visualizationFramework } from "./visualization/index.js";

// Register all 11 frameworks
frameworkRouter.register("prompt-engineering", promptEngineeringFramework);
frameworkRouter.register("code-quality", codeQualityFramework);
frameworkRouter.register("design-architecture", designArchitectureFramework);
frameworkRouter.register("security", securityFramework);
frameworkRouter.register("testing", testingFramework);
frameworkRouter.register("documentation", documentationFramework);
frameworkRouter.register("strategic-planning", strategicPlanningFramework);
frameworkRouter.register("agent-orchestration", agentOrchestrationFramework);
frameworkRouter.register("prompt-optimization", promptOptimizationFramework);
frameworkRouter.register("visualization", visualizationFramework);
frameworkRouter.register("project-management", projectManagementFramework);

export {
	promptEngineeringFramework,
	codeQualityFramework,
	designArchitectureFramework,
	securityFramework,
	testingFramework,
	documentationFramework,
	strategicPlanningFramework,
	agentOrchestrationFramework,
	promptOptimizationFramework,
	visualizationFramework,
	projectManagementFramework,
};
