# Bridge Connectors

> Integration patterns for external systems and services

## Overview

Bridge connectors provide integration patterns for connecting the MCP server to external systems, code analysis tools, and third-party services without tight coupling.

## Architecture

### Bridge Pattern

Bridges act as **facades** that:
1. Abstract external system complexity
2. Provide consistent interfaces
3. Enable lazy initialization
4. Allow easy mocking/testing
5. Isolate dependencies

### Key Bridges

#### 1. Semantic Analyzer Bridge

**Purpose**: Integrate semantic code analysis capabilities

**Features**:
- Symbol inspection (classes, functions, variables)
- Reference finding (find usages)
- Type information extraction
- Pattern detection

**Usage**:
```typescript
import { createSemanticAnalyzerBridge } from './bridge/semantic-analyzer-bridge.js';

const bridge = createSemanticAnalyzerBridge();

// Analyze code structure
const symbols = await bridge.inspectSymbols(sourceCode);

// Find references
const references = await bridge.findReferences(symbol, codebase);

// Analyze patterns
const patterns = await bridge.analyzePatterns(sourceCode);
```

#### 2. Project Onboarding Bridge

**Purpose**: Scan and understand project structure

**Features**:
- Directory structure analysis
- Dependency detection
- Framework identification
- Configuration analysis

**Usage**:
```typescript
import { createProjectOnboardingBridge } from './bridge/project-onboarding-bridge.js';

const bridge = createProjectOnboardingBridge();

// Scan project
const structure = await bridge.scanProject(projectPath);

// Detect framework
const framework = await bridge.detectFramework(projectPath);

// Analyze dependencies
const deps = await bridge.analyzeDependencies(projectPath);
```

## Integration Patterns

### Pattern 1: Lazy Initialization

Bridges initialize external systems only when needed:

```typescript
export function createBridge() {
  let instance;

  return {
    async operation() {
      if (!instance) {
        instance = await initializeExternalSystem();
      }
      return instance.doWork();
    }
  };
}
```

### Pattern 2: Error Isolation

Bridges handle external errors gracefully:

```typescript
export function createBridge() {
  return {
    async operation() {
      try {
        return await externalSystem.call();
      } catch (error) {
        logger.error({ error, context: 'bridge-operation' });
        throw new OperationError('Bridge operation failed', { cause: error });
      }
    }
  };
}
```

### Pattern 3: Adapter Interface

Bridges adapt external APIs to consistent interfaces:

```typescript
// External system has complex API
externalSystem.analyzeCode({
  source: code,
  options: { deep: true, includeTypes: true }
});

// Bridge provides simple, consistent API
bridge.analyze(code);
```

## Best Practices

### 1. Single Responsibility

Each bridge handles one external system:

```typescript
// ✅ Good: Focused bridge
export function createSemanticAnalyzerBridge() {
  // Only handles semantic analysis
}

// ❌ Bad: Does too much
export function createCodeBridge() {
  // Handles analysis, formatting, linting, etc.
}
```

### 2. Factory Pattern

Use factory functions for bridge creation:

```typescript
// ✅ Good: Factory function
export function createBridge() {
  return {
    method1() {},
    method2() {}
  };
}

// ❌ Bad: Class with global state
export class Bridge {
  static instance;
  // ...
}
```

### 3. Dependency Injection

Allow external dependencies to be injected:

```typescript
export function createBridge({ logger, config } = {}) {
  const log = logger ?? defaultLogger;
  const cfg = config ?? defaultConfig;

  return {
    async operation() {
      log.info('Starting operation');
      // Use cfg
    }
  };
}
```

### 4. Graceful Degradation

Provide fallbacks when external systems unavailable:

```typescript
export function createBridge() {
  return {
    async analyze(code) {
      try {
        return await externalAnalyzer.analyze(code);
      } catch (error) {
        logger.warn('External analyzer unavailable, using fallback');
        return fallbackAnalyzer.analyze(code);
      }
    }
  };
}
```

## Example Integrations

### Integration 1: Language Server

```typescript
export function createLanguageServerBridge({ language = 'typescript' } = {}) {
  let lsp;

  return {
    async initialize(rootPath) {
      lsp = await startLanguageServer({ language, rootPath });
    },

    async getDefinition(file, position) {
      return lsp.textDocument.definition({ file, position });
    },

    async findReferences(file, position) {
      return lsp.textDocument.references({ file, position });
    },

    async shutdown() {
      await lsp.shutdown();
    }
  };
}
```

### Integration 2: Build System

```typescript
export function createBuildSystemBridge({ buildTool = 'npm' } = {}) {
  return {
    async build(projectPath) {
      switch (buildTool) {
        case 'npm':
          return execAsync('npm run build', { cwd: projectPath });
        case 'gradle':
          return execAsync('./gradlew build', { cwd: projectPath });
        default:
          throw new Error(`Unsupported build tool: ${buildTool}`);
      }
    },

    async test(projectPath) {
      switch (buildTool) {
        case 'npm':
          return execAsync('npm test', { cwd: projectPath });
        case 'gradle':
          return execAsync('./gradlew test', { cwd: projectPath });
        default:
          throw new Error(`Unsupported build tool: ${buildTool}`);
      }
    }
  };
}
```

### Integration 3: Source Control

```typescript
export function createSourceControlBridge({ scm = 'git' } = {}) {
  return {
    async getHistory(file) {
      return execAsync(`git log --follow -- ${file}`);
    },

    async getBlame(file) {
      return execAsync(`git blame ${file}`);
    },

    async getDiff(commit1, commit2) {
      return execAsync(`git diff ${commit1} ${commit2}`);
    }
  };
}
```

## Testing Bridges

### Mock Bridge for Testing

```typescript
export function createMockSemanticAnalyzerBridge() {
  return {
    async inspectSymbols(code) {
      return [
        { name: 'mockClass', kind: 'class' },
        { name: 'mockFunction', kind: 'function' }
      ];
    },

    async findReferences(symbol) {
      return [
        { file: 'test.ts', line: 10, column: 5 }
      ];
    }
  };
}
```

### Bridge Testing

```typescript
describe('SemanticAnalyzerBridge', () => {
  it('should analyze code symbols', async () => {
    const bridge = createSemanticAnalyzerBridge();
    const symbols = await bridge.inspectSymbols('class Test {}');

    expect(symbols).toContainEqual(
      expect.objectContaining({ name: 'Test', kind: 'class' })
    );
  });
});
```

## Related Resources

- [Project Onboarding](./tools/project-onboarding.md) - Using onboarding bridge
- [Semantic Code Analyzer](./tools/semantic-code-analyzer.md) - Using analyzer bridge
- [Error Handling](./ERROR_HANDLING.md) - Error patterns in bridges

## Conclusion

Bridge connectors provide clean, testable integration points for external systems. By following these patterns, you can integrate with language servers, build tools, and other services while maintaining loose coupling and high testability.
