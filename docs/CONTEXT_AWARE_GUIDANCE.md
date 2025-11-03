# Context-Aware Guidance

> Adaptive recommendations and intelligent prompting based on project context

## Overview

Context-aware guidance leverages project metadata, codebase structure, and historical patterns to provide intelligent, tailored recommendations. This approach adapts prompts and suggestions based on your specific environment and requirements.

## Core Principles

### 1. Environmental Awareness

The system analyzes:
- **Project structure**: Monorepo vs. single package, directory organization
- **Technology stack**: Languages, frameworks, build tools
- **Code patterns**: Naming conventions, architectural patterns
- **Dependencies**: Libraries, versions, compatibility

### 2. Adaptive Prompting

Prompts automatically adjust based on:
- **Detected framework**: Different guidance for React vs. Vue vs. Angular
- **Code maturity**: Stricter standards for production code
- **Team size**: Scalability considerations for larger teams
- **Quality metrics**: Current test coverage, code quality scores

### 3. Historical Learning

Leverage past interactions:
- **Previous solutions**: Reference successful patterns from your codebase
- **Common issues**: Anticipate frequent problems
- **Team preferences**: Align with established conventions

## Context Detection

### Automatic Detection

The system automatically identifies:

```typescript
{
  "projectType": "library",
  "language": "typescript",
  "framework": "node",
  "testFramework": "vitest",
  "buildTool": "tsc",
  "packageManager": "npm",
  "codeStyle": "biome",
  "architecture": "modular",
  "qualityGates": ["lint", "type-check", "test"]
}
```

### Manual Context Specification

Provide additional context for better recommendations:

```typescript
const result = await tool({
  context: {
    "team_size": 5,
    "deployment_env": "AWS Lambda",
    "performance_critical": true,
    "compliance_requirements": ["SOC2", "GDPR"],
    "code_review_required": true
  }
});
```

## Adaptive Features

### 1. Framework-Specific Guidance

#### React Projects

```
Detected: React 18 with TypeScript

Recommendations:
- Use functional components with hooks
- Implement proper memo() for performance
- Follow React Server Components patterns where applicable
- Ensure accessibility with ARIA attributes
```

#### Node.js Services

```
Detected: Express API with PostgreSQL

Recommendations:
- Implement connection pooling for database
- Add rate limiting middleware
- Use structured logging (Winston/Pino)
- Implement graceful shutdown handlers
```

### 2. Scale-Aware Suggestions

#### Small Projects (< 10k LOC)

```
Recommendations:
- Prioritize simplicity and readability
- Minimize dependencies
- Focus on core functionality
- Lightweight testing approach
```

#### Large Projects (> 100k LOC)

```
Recommendations:
- Enforce strict module boundaries
- Implement comprehensive testing strategy
- Use dependency injection for flexibility
- Document architectural decisions (ADRs)
- Consider micro-frontend patterns
```

### 3. Quality-Based Adaptation

#### High Coverage (> 80%)

```
Detected: 92% test coverage

Recommendations:
- Maintain current standards
- Focus on edge cases and integration tests
- Consider mutation testing for quality validation
```

#### Low Coverage (< 50%)

```
Detected: 35% test coverage

Recommendations:
- Prioritize critical path testing
- Use coverage-guided test generation
- Implement testing in CI/CD pipeline
- Set incremental coverage targets
```

## Context-Aware Tools

### Memory Context Optimizer

Optimizes prompt caching and context based on your usage patterns:

```typescript
const optimized = await memoryContextOptimizer({
  contextContent: "Large codebase context...",
  maxTokens: 10000,
  cacheStrategy: "aggressive" // Adapts based on context size
});
```

**Adaptive Behavior**:
- **Small context** → Conservative caching
- **Large context** → Aggressive caching with pruning
- **Frequent access** → Long-term cache retention

### Semantic Code Analyzer

Provides context-aware code analysis:

```typescript
const analysis = await semanticCodeAnalyzer({
  codeContent: "...",
  analysisType: "all",
  language: "typescript" // Auto-detected if not specified
});
```

**Adaptive Analysis**:
- **Detects patterns**: Identifies common patterns in your codebase
- **Suggests improvements**: Based on your existing style
- **Finds anti-patterns**: Specific to your tech stack

### Project Onboarding

Builds comprehensive project understanding:

```typescript
const onboarding = await projectOnboarding({
  projectPath: "./",
  analysisDepth: "standard",
  includeMemories: true
});
```

**Generated Context**:
- Project structure and organization
- Key architectural patterns
- Technology stack and dependencies
- Code quality baselines
- Common workflows and conventions

## Contextual Prompt Templates

### Security Hardening (Context-Aware)

```typescript
// Input
{
  "codeContext": "Express API with user authentication",
  "framework": "express",
  "autoDetect": true
}

// Output (adapted for Express)
"Analyze for security vulnerabilities:
- SQL injection in route handlers
- Missing express-rate-limit middleware
- Insecure session configuration
- Missing helmet.js security headers
- CSRF protection for state-changing operations
[Express-specific recommendations...]"
```

### Architecture Design (Context-Aware)

```typescript
// Input
{
  "systemRequirements": "User management service",
  "detectedArchitecture": "microservices",
  "existingPatterns": ["event-driven", "CQRS"]
}

// Output (adapted for microservices + patterns)
"Design user management service:
- Event sourcing for user state changes (matches existing CQRS)
- Message bus integration (aligns with event-driven architecture)
- Service discovery for microservices communication
- Distributed tracing for observability
[Context-aligned recommendations...]"
```

## Best Practices

### 1. Provide Rich Context Upfront

Include relevant details early:

```typescript
const result = await tool({
  // Automatic context
  projectPath: "./",

  // Explicit context
  context: {
    deployment: "serverless",
    constraints: ["cold start < 1s", "memory < 512MB"],
    existing_services: ["auth-service", "payment-service"]
  }
});
```

### 2. Leverage Project Metadata

Use package.json, tsconfig.json, and other config files:

```json
// package.json
{
  "name": "my-service",
  "scripts": {
    "test": "vitest",
    "lint": "biome check"
  },
  "engines": {
    "node": ">=20"
  }
}
```

The system uses this to adapt recommendations to your tooling.

### 3. Maintain Consistent Patterns

Established patterns are automatically detected and reinforced:

```
Detected pattern: All services use dependency injection
Recommendation: New service should also use DI container
```

### 4. Update Context as Project Evolves

When migrating or refactoring:

```typescript
await tool({
  context: {
    migration: {
      from: "JavaScript + Jest",
      to: "TypeScript + Vitest",
      phase: "in-progress"
    }
  }
});
```

## Context Sources

### File-Based Context

- `package.json` → Dependencies, scripts, engines
- `tsconfig.json` → TypeScript configuration
- `.github/workflows/` → CI/CD pipelines
- `README.md` → Project description and setup
- `.env.example` → Required environment variables

### Code-Based Context

- **Import patterns**: Common dependencies and usage
- **Test patterns**: Testing conventions and coverage
- **Error handling**: Established error patterns
- **Naming conventions**: Variable, function, class names

### Behavioral Context

- **Commit history**: Change patterns and frequency
- **Issue patterns**: Common bugs and feature requests
- **Review feedback**: Recurring review comments

## Integration Examples

### Example 1: New Feature Development

```typescript
// Context automatically includes:
// - Existing feature patterns
// - Testing conventions
// - Deployment workflow

const feature = await designAssistant({
  action: "start-session",
  config: {
    goal: "Add user profile feature",
    // Context-aware constraints added automatically:
    // - Must follow existing auth patterns
    // - Include Vitest tests
    // - Add to existing CI pipeline
  }
});
```

### Example 2: Code Review

```typescript
// Context includes:
// - Team coding standards
// - Previous review feedback
// - Common issues in this codebase

const review = await cleanCodeScorer({
  projectPath: "./",
  // Scoring adapted to your standards
  // Warnings about patterns that caused issues before
});
```

### Example 3: Migration Planning

```typescript
// Context includes:
// - Current dependencies and versions
// - Breaking changes in target versions
// - Migration complexity estimation

const migration = await gapFrameworksAnalyzers({
  frameworks: ["technology"],
  currentState: "Node 18, Express 4",
  desiredState: "Node 20, Express 5",
  context: "Production service with 99.9% uptime requirement"
  // Automatically includes:
  // - Compatible upgrade paths
  // - Risk assessment based on your usage
  // - Rollback strategy aligned with deployment process
});
```

## Debugging Context Issues

### Verify Detected Context

```typescript
const analysis = await projectOnboarding({
  projectPath: "./",
  analysisDepth: "quick"
});

console.log(analysis.detectedContext);
// Review what was automatically detected
```

### Override Incorrect Detection

```typescript
const result = await tool({
  // Override auto-detection
  framework: "fastify", // Instead of auto-detected "express"
  language: "typescript", // Explicitly specify
});
```

### Add Missing Context

```typescript
const result = await tool({
  context: {
    // Add context not auto-detectable
    legacy_code: true,
    phased_migration: {
      phase: 2,
      total_phases: 4
    }
  }
});
```

## Related Resources

- [AI Interaction Tips](./AI_INTERACTION_TIPS.md) - General guidance
- [Prompting Hierarchy](./PROMPTING_HIERARCHY.md) - Prompt levels
- [Tools Reference](./TOOLS_REFERENCE.md) - Tool documentation
- [Project Onboarding Guide](./tools/project-onboarding.md) - Detailed onboarding

## Conclusion

Context-aware guidance makes AI recommendations more relevant, accurate, and aligned with your specific project needs. By leveraging automatic detection and allowing manual context specification, the system adapts to your unique environment and requirements.
