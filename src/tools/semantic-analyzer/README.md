# Semantic Analyzer Module

A modular, extensible semantic code analysis system for analyzing code structure, patterns, dependencies, and symbols across multiple programming languages.

## Architecture

The semantic analyzer is organized into several specialized modules:

```
semantic-analyzer/
├── types/           # TypeScript type definitions
├── services/        # Core analysis services
│   ├── language-detection.ts    # Extensible language registry
│   ├── symbol-extraction.ts     # Symbol identification
│   ├── dependency-extraction.ts # Import/dependency analysis
│   ├── pattern-detection.ts     # Design pattern detection
│   └── structure-analysis.ts    # Code structure analysis
├── analyzer.ts      # Main analysis coordinator
├── formatters.ts    # Output formatting utilities
└── index.ts         # Public API exports
```

## Features

### Extensible Language Support

The language registry pattern allows easy addition of new languages:

```typescript
import { languageRegistry } from './semantic-analyzer';

// Add a new language
languageRegistry.register({
  name: 'Kotlin',
  extensions: ['.kt'],
  detect: (code) => code.includes('fun ') && code.includes('package'),
  extractSymbols: (code) => { /* ... */ },
  extractDependencies: (code) => { /* ... */ }
});
```

**Currently Supported Languages:**
- TypeScript/JavaScript
- Python
- Java
- Rust
- Go
- Ruby
- PHP
- C++
- C#

### Advanced Pattern Detection

The pattern registry detects common design patterns:

- **Async/Await** - Asynchronous programming patterns
- **Error Handling** - Try-catch blocks
- **Dependency Injection** - Constructor-based DI
- **Factory Pattern** - Object creation methods
- **Singleton Pattern** - Single instance patterns
- **Observer Pattern** - Event/pub-sub patterns
- **Decorator Pattern** - Behavior extension
- **Strategy Pattern** - Algorithm selection
- **Builder Pattern** - Fluent object construction
- **Adapter Pattern** - Interface compatibility
- **Promise Pattern** - Promise-based async handling

Custom patterns can be added:

```typescript
import { patternRegistry } from './semantic-analyzer';

patternRegistry.register({
  name: 'Repository Pattern',
  description: 'Data access layer pattern',
  detect: (code, language) => {
    if (code.match(/class\s+\w+Repository/i)) {
      return {
        pattern: 'Repository Pattern',
        description: 'Repository pattern for data access',
        locations: ['Repository class found']
      };
    }
    return null;
  }
});
```

## Usage

### Basic Analysis

```typescript
import { analyzeCode, detectLanguage } from './semantic-analyzer';

const code = `
export class UserService {
  async getUser(id: string): Promise<User> {
    return await this.repository.findById(id);
  }
}
`;

const language = detectLanguage(code);
const analysis = analyzeCode(code, language, 'all');

console.log(analysis);
// {
//   symbols: [...],
//   structure: [...],
//   dependencies: [...],
//   patterns: [...]
// }
```

### Auto-Detection

```typescript
import { analyzeCodeAuto } from './semantic-analyzer';

const analysis = analyzeCodeAuto(code, 'all');
console.log(analysis.language); // "TypeScript/JavaScript"
```

### Selective Analysis

```typescript
// Analyze only symbols
const symbols = analyzeCode(code, 'TypeScript/JavaScript', 'symbols');

// Analyze only patterns
const patterns = analyzeCode(code, 'TypeScript/JavaScript', 'patterns');

// Analyze dependencies only
const dependencies = analyzeCode(code, 'TypeScript/JavaScript', 'dependencies');
```

### Formatting Output

```typescript
import {
  buildSymbolsSection,
  buildPatternsSection,
  generateInsights,
  generateRecommendations
} from './semantic-analyzer';

const insights = generateInsights(analysis, language);
const recommendations = generateRecommendations(analysis, language);
const symbolsSection = buildSymbolsSection(analysis.symbols || []);
```

## API Reference

### Types

- `AnalysisType` - `"symbols" | "structure" | "dependencies" | "patterns" | "all"`
- `SymbolInfo` - Information about code symbols (functions, classes, etc.)
- `DependencyInfo` - Dependency/import information
- `StructureInfo` - Code structure information
- `PatternInfo` - Design pattern detection results
- `AnalysisResult` - Complete analysis result

### Services

#### Language Detection
- `detectLanguage(code: string): string` - Detect programming language
- `languageRegistry.register(analyzer: LanguageAnalyzer)` - Add language support
- `languageRegistry.getRegisteredLanguages(): string[]` - List supported languages

#### Symbol Extraction
- `extractSymbols(code: string, language: string): SymbolInfo[]` - Extract symbols
- Language-specific: `extractTypeScriptSymbols`, `extractPythonSymbols`, `extractJavaSymbols`

#### Dependency Extraction
- `extractDependencies(code: string, language: string): DependencyInfo[]` - Extract dependencies
- Language-specific: `extractTypeScriptDependencies`, `extractPythonDependencies`, etc.

#### Pattern Detection
- `detectPatterns(code: string, language: string): PatternInfo[]` - Detect patterns
- `patternRegistry.register(detector: PatternDetector)` - Add pattern detector
- `patternRegistry.getRegisteredPatterns(): string[]` - List registered patterns

#### Structure Analysis
- `analyzeStructure(code: string, language: string): StructureInfo[]` - Analyze structure

### Main Analyzer
- `analyzeCode(code: string, language: string, analysisType: AnalysisType): AnalysisResult`
- `analyzeCodeAuto(code: string, analysisType?: AnalysisType): AnalysisResult & { language: string }`

### Formatters
- `buildSymbolsSection(symbols: SymbolInfo[]): string`
- `buildStructureSection(structure: StructureInfo[]): string`
- `buildDependenciesSection(dependencies: DependencyInfo[]): string`
- `buildPatternsSection(patterns: PatternInfo[]): string`
- `generateInsights(analysis: AnalysisResult, language: string): string`
- `generateRecommendations(analysis: AnalysisResult, language: string): string`

## Extension Points

### Adding a New Language

1. Create a language analyzer with detection logic
2. Register it with the language registry
3. Optionally provide symbol/dependency extraction

```typescript
languageRegistry.register({
  name: 'Swift',
  extensions: ['.swift'],
  detect: (code) => code.includes('func ') && code.includes('import '),
  extractSymbols: (code) => {
    // Custom symbol extraction for Swift
    return symbols;
  },
  extractDependencies: (code) => {
    // Custom dependency extraction for Swift
    return dependencies;
  }
});
```

### Adding a New Pattern

1. Create a pattern detector
2. Register it with the pattern registry

```typescript
patternRegistry.register({
  name: 'MVC Pattern',
  description: 'Model-View-Controller pattern',
  detect: (code, language) => {
    const hasController = code.includes('Controller');
    const hasModel = code.includes('Model');
    const hasView = code.includes('View');

    if (hasController && hasModel && hasView) {
      return {
        pattern: 'MVC Pattern',
        description: 'Model-View-Controller architecture',
        locations: ['MVC components found']
      };
    }
    return null;
  }
});
```

## Integration

The semantic analyzer integrates with other tools via the bridge pattern:

```typescript
import { extractSemanticInsights } from '../bridge/semantic-analyzer-bridge';

// Generate insights for other tools
const insights = extractSemanticInsights(analysisText);

// Use insights to enhance prompts, strategies, etc.
```

## Benefits

- **Modularity**: Each analysis type is in its own module
- **Extensibility**: Easy to add languages and patterns via registries
- **Testability**: Small, focused modules are easier to test
- **Maintainability**: Clear separation of concerns
- **Reusability**: Services can be used independently
- **Type Safety**: Comprehensive TypeScript types throughout

## Future Enhancements

Potential areas for expansion:

- AST-based parsing for more accurate symbol extraction
- Language Server Protocol integration
- Complexity metrics (cyclomatic, cognitive)
- Security vulnerability detection
- Code smell detection
- Visualization of code structure
- Integration with linting tools
- Support for more languages (Kotlin, Scala, Haskell, etc.)
