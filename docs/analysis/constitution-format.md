# CONSTITUTION.md Format Analysis

> Analysis of the CONSTITUTION.md format for designing a robust parser for Spec-Kit integration

**Analyzed**: January 11, 2026  
**Source**: `plan-v0.13.x/CONSTITUTION.md`  
**Related Task**: P4-001  
**Related Spec**: SPEC-005 (Spec-Kit Integration)

---

## 1. Executive Summary

The CONSTITUTION.md document follows a hierarchical structure with multiple section types, each containing rules, principles, or guidelines identified by unique IDs. This analysis identifies all patterns required to parse the document into structured TypeScript types.

### Key Sections
- **Foundational Principles**: 5 numbered principles (1-5)
- **Constraints**: 5 non-negotiable constraints (C1-C5)
- **Architecture Rules**: 4 architectural guidelines (AR1-AR4)
- **Design Principles**: 5 design guidelines (DP1-DP5)
- **Quality Gates**: 4 quality checkpoints (QG1-QG4)
- **Process Sections**: Workflow descriptions
- **Decision Framework**: Guidelines for when to create artifacts
- **Version Compatibility**: Scope and deprecation policy

---

## 2. Section Structure

### 2.1 Document Hierarchy

```
# Title (H1)
└── ## Major Section (H2)
    ├── ### Principle/Constraint/Rule (H3)
    │   ├── > Quote (rationale)
    │   ├── **Implications**: (list)
    │   └── Code blocks or examples
    └── ### Next Item (H3)
```

### 2.2 Major Sections

| Section | Header Pattern | Contains |
|---------|---------------|----------|
| Foundational Principles | `## 📜 Foundational Principles` | Numbered principles (1-5) |
| Constraints | `## 🚫 Constraints (Non-Negotiable)` | C1-C5 |
| Architecture Rules | `## 📐 Architecture Rules` | AR1-AR4 |
| Design Principles | `## 🎨 Design Principles` | DP1-DP5 |
| Quality Gates | `## 📋 Quality Gates` | QG1-QG4 |
| Change Process | `## 🔄 Change Process` | Process workflows |
| Decision Framework | `## 📊 Decision Framework` | When-to guidelines |
| Version Compatibility | `## 🏷️ Version Compatibility` | Versioning info |

---

## 3. ID Patterns

### 3.1 Principle Pattern

**Format**: `### \d+\. Title`

**Example**:
```markdown
### 1. Tool Discoverability First

> Every tool MUST be immediately understandable to an LLM.

**Rationale**: If LLMs can't discover and correctly select tools, the entire system fails.

**Implications**:
- Tool descriptions must be action-oriented and unique
- JSON schemas must include examples
```

**Regex Pattern**:
```typescript
const PRINCIPLE_PATTERN = /^### (\d+)\. (.+)$/gm;
```

**Extraction Logic**:
- **ID**: Numeric (1, 2, 3, 4, 5)
- **Title**: Everything after "### N. "
- **Rationale**: Text in `> ` blockquote
- **Implications**: Bulleted list after `**Implications**:`

### 3.2 Constraint Pattern

**Format**: `### C\d+: Title`

**Example**:
```markdown
### C1: TypeScript Strict Mode

- `strict: true` in tsconfig.json
- No `any` types without explicit justification
- All tool inputs validated with Zod
```

**Regex Pattern**:
```typescript
const CONSTRAINT_PATTERN = /^### (C\d+): (.+)$/gm;
```

**Extraction Logic**:
- **ID**: C1, C2, C3, C4, C5
- **Rule**: Title text after "C\d+: "
- **Details**: Bulleted list immediately following header

### 3.3 Architecture Rule Pattern

**Format**: `### AR\d+: Title`

**Example**:
```markdown
### AR1: Layer Dependencies

\`\`\`
Allowed:
  MCPServer → PolyglotGateway → DomainServices
  MCPServer → PolyglotGateway → OutputStrategies
  
Forbidden:
  DomainServices → OutputStrategies (no presentation in domain)
\`\`\`
```

**Regex Pattern**:
```typescript
const ARCH_RULE_PATTERN = /^### (AR\d+): (.+)$/gm;
```

**Extraction Logic**:
- **ID**: AR1, AR2, AR3, AR4
- **Rule**: Title text after "AR\d+: "
- **Details**: Code blocks or text following header

### 3.4 Design Principle Pattern

**Format**: `### DP\d+: Title`

**Example**:
```markdown
### DP1: Reduce to Essence

Each tool does **ONE thing** brilliantly. Consolidate overlapping tools.

**Anti-pattern**: hierarchical-prompt-builder that builds, evaluates, AND selects levels
**Pattern**: Three focused tools: prompt-build, prompt-evaluate, prompt-select-level
```

**Regex Pattern**:
```typescript
const DESIGN_PRINCIPLE_PATTERN = /^### (DP\d+): (.+)$/gm;
```

**Extraction Logic**:
- **ID**: DP1, DP2, DP3, DP4, DP5
- **Rule**: Title text after "DP\d+: "
- **Details**: Paragraph after header
- **Examples**: Text marked with `**Anti-pattern**` and `**Pattern**`

### 3.5 Quality Gate Pattern

**Format**: `### QG\d+: Title`

**Example**:
```markdown
### QG1: Pre-Commit

- Biome format check
- TypeScript type check
- No console.log statements
```

**Regex Pattern**:
```typescript
const QUALITY_GATE_PATTERN = /^### (QG\d+): (.+)$/gm;
```

**Extraction Logic**:
- **ID**: QG1, QG2, QG3, QG4
- **Gate**: Title text after "QG\d+: "
- **Checks**: Bulleted list following header

---

## 4. Regex Patterns Summary

### 4.1 Complete Pattern Set

```typescript
// Header patterns for extracting IDs and titles
const PATTERNS = {
  // Principles: ### 1. Title
  principle: /^### (\d+)\. (.+)$/gm,
  
  // Constraints: ### C1: Title
  constraint: /^### (C\d+): (.+)$/gm,
  
  // Architecture Rules: ### AR1: Title
  architectureRule: /^### (AR\d+): (.+)$/gm,
  
  // Design Principles: ### DP1: Title
  designPrinciple: /^### (DP\d+): (.+)$/gm,
  
  // Quality Gates: ### QG1: Title
  qualityGate: /^### (QG\d+): (.+)$/gm,
};
```

### 4.2 Content Extraction Patterns

```typescript
// Extract rationale (blockquote after principle)
const RATIONALE_PATTERN = /^> (.+)$/gm;

// Extract implications (after **Implications**: marker)
const IMPLICATIONS_PATTERN = /\*\*Implications\*\*:\s*\n((?:^- .+$\n?)+)/gm;

// Extract code blocks
const CODE_BLOCK_PATTERN = /```(?:\w+)?\n([\s\S]+?)```/g;

// Extract anti-patterns and patterns
const ANTI_PATTERN = /\*\*Anti-pattern\*\*:\s*(.+?)(?=\n\*\*Pattern\*\*|$)/gs;
const GOOD_PATTERN = /\*\*Pattern\*\*:\s*(.+?)(?=\n|$)/gs;
```

---

## 5. Proposed TypeScript Interfaces

### 5.1 Core Constitution Interface

```typescript
/**
 * Represents the complete parsed CONSTITUTION.md document
 */
export interface Constitution {
  /** Metadata about the constitution document */
  metadata: ConstitutionMetadata;
  
  /** Foundational principles (P1-P5 in spec, but numbered 1-5 in actual doc) */
  principles: Principle[];
  
  /** Non-negotiable constraints (C1-C5) */
  constraints: Constraint[];
  
  /** Architecture rules (AR1-AR4) */
  architectureRules: ArchitectureRule[];
  
  /** Design principles (DP1-DP5) */
  designPrinciples: DesignPrinciple[];
  
  /** Quality gates (QG1-QG4) */
  qualityGates: QualityGate[];
  
  /** Change process workflows */
  changeProcess?: ChangeProcess;
  
  /** Decision framework guidelines */
  decisionFramework?: DecisionFramework;
  
  /** Version compatibility information */
  versionCompatibility?: VersionCompatibility;
}
```

### 5.2 Metadata Interface

```typescript
export interface ConstitutionMetadata {
  /** Document title */
  title: string;
  
  /** Date the constitution was adopted */
  adopted: string;
  
  /** Last update date */
  lastUpdated: string;
  
  /** Version or scope this applies to */
  appliesTo: string;
  
  /** File path where this was parsed from */
  sourcePath?: string;
}
```

### 5.3 Principle Interface

```typescript
export interface Principle {
  /** Numeric ID (1, 2, 3, 4, 5) */
  id: string;
  
  /** Principle title */
  name: string;
  
  /** Full description/title with "Tool Discoverability First" etc. */
  title: string;
  
  /** Rationale blockquote if present */
  rationale?: string;
  
  /** List of implications */
  implications?: string[];
  
  /** Full markdown content of this principle */
  content: string;
}
```

### 5.4 Constraint Interface

```typescript
export interface Constraint {
  /** Constraint ID (C1, C2, C3, C4, C5) */
  id: string;
  
  /** Constraint title/rule */
  rule: string;
  
  /** Detailed requirements (bulleted list) */
  details: string[];
  
  /** Full markdown content */
  content: string;
}
```

### 5.5 Architecture Rule Interface

```typescript
export interface ArchitectureRule {
  /** Rule ID (AR1, AR2, AR3, AR4) */
  id: string;
  
  /** Rule title */
  rule: string;
  
  /** Detailed description */
  description?: string;
  
  /** Code examples if present */
  codeExamples?: string[];
  
  /** Full markdown content */
  content: string;
}
```

### 5.6 Design Principle Interface

```typescript
export interface DesignPrinciple {
  /** Principle ID (DP1, DP2, DP3, DP4, DP5) */
  id: string;
  
  /** Principle title */
  rule: string;
  
  /** Description/guidance */
  description: string;
  
  /** Anti-pattern example */
  antiPattern?: string;
  
  /** Good pattern example */
  goodPattern?: string;
  
  /** Full markdown content */
  content: string;
}
```

### 5.7 Quality Gate Interface

```typescript
export interface QualityGate {
  /** Gate ID (QG1, QG2, QG3, QG4) */
  id: string;
  
  /** Gate name/phase */
  gate: string;
  
  /** List of checks required */
  checks: string[];
  
  /** Full markdown content */
  content: string;
}
```

### 5.8 Supporting Interfaces

```typescript
export interface ChangeProcess {
  bugFixes?: ProcessStep[];
  features?: ProcessStep[];
  architecturalChanges?: ProcessStep[];
}

export interface ProcessStep {
  step: number;
  description: string;
}

export interface DecisionFramework {
  whenToCreateADR?: string[];
  whenToCreateSpecification?: string[];
  whenToSkipDocumentation?: string[];
}

export interface VersionCompatibility {
  currentScope?: string[];
  plannedScope?: string[];
  deprecationPolicy?: string;
}
```

---

## 6. Parsing Strategy

### 6.1 High-Level Algorithm

```typescript
function parseConstitution(markdown: string): Constitution {
  const result: Constitution = {
    metadata: extractMetadata(markdown),
    principles: [],
    constraints: [],
    architectureRules: [],
    designPrinciples: [],
    qualityGates: [],
  };
  
  // Split into sections by H2 headers
  const sections = splitBySections(markdown);
  
  // Parse each section type
  for (const section of sections) {
    if (section.header.includes('Foundational Principles')) {
      result.principles = parsePrinciples(section.content);
    } else if (section.header.includes('Constraints')) {
      result.constraints = parseConstraints(section.content);
    } else if (section.header.includes('Architecture Rules')) {
      result.architectureRules = parseArchitectureRules(section.content);
    } else if (section.header.includes('Design Principles')) {
      result.designPrinciples = parseDesignPrinciples(section.content);
    } else if (section.header.includes('Quality Gates')) {
      result.qualityGates = parseQualityGates(section.content);
    }
    // ... other sections
  }
  
  return result;
}
```

### 6.2 Section Splitting Strategy

```typescript
function splitBySections(markdown: string): Section[] {
  const sections: Section[] = [];
  const h2Pattern = /^## (.+)$/gm;
  
  let lastIndex = 0;
  let match;
  
  while ((match = h2Pattern.exec(markdown)) !== null) {
    if (lastIndex > 0) {
      sections.push({
        header: lastHeaderText,
        content: markdown.substring(lastIndex, match.index),
      });
    }
    lastHeaderText = match[1];
    lastIndex = match.index;
  }
  
  // Add final section
  if (lastIndex > 0) {
    sections.push({
      header: lastHeaderText,
      content: markdown.substring(lastIndex),
    });
  }
  
  return sections;
}
```

### 6.3 Item Extraction Strategy

```typescript
function parsePrinciples(sectionContent: string): Principle[] {
  const principles: Principle[] = [];
  const pattern = /^### (\d+)\. (.+)$/gm;
  
  let match;
  const matches: { index: number; id: string; title: string }[] = [];
  
  // Collect all matches
  while ((match = pattern.exec(sectionContent)) !== null) {
    matches.push({
      index: match.index,
      id: match[1],
      title: match[2],
    });
  }
  
  // Extract content between matches
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    
    const endIndex = next ? next.index : sectionContent.length;
    const content = sectionContent.substring(current.index, endIndex);
    
    principles.push({
      id: current.id,
      name: current.title,
      title: current.title,
      rationale: extractRationale(content),
      implications: extractImplications(content),
      content: content.trim(),
    });
  }
  
  return principles;
}
```

---

## 7. Edge Cases & Considerations

### 7.1 Multi-line Content

Some principles have multi-paragraph content. The parser must:
- Extract everything between one `###` header and the next
- Preserve formatting (code blocks, lists, emphasis)
- Handle nested structures

### 7.2 Optional Fields

Not all items have all fields:
- Some principles lack rationale blockquotes
- Some design principles lack anti-pattern examples
- Some sections have code blocks, others don't

**Solution**: Use optional fields (`?`) in TypeScript interfaces.

### 7.3 Emoji in Headers

Section headers include emoji (📜, 🚫, 📐, etc.):
- Don't include emoji in section type detection
- Use `.includes()` rather than exact match
- Example: `header.includes('Foundational Principles')`

### 7.4 Version Evolution

CONSTITUTION.md may evolve over time:
- New principle types may be added (P6, C6, etc.)
- Sections may be reordered
- Parser should be flexible and extensible

**Solution**:
- Use generic regex patterns that work for any number
- Don't hardcode section order
- Provide fallback for unknown sections

---

## 8. Validation Strategy

### 8.1 Parser Validation

```typescript
export interface ParseValidation {
  /** Whether parsing succeeded */
  success: boolean;
  
  /** Errors encountered during parsing */
  errors: ParseError[];
  
  /** Warnings about missing optional content */
  warnings: ParseWarning[];
  
  /** Statistics about parsed content */
  stats: ParseStats;
}

export interface ParseStats {
  principlesFound: number;
  constraintsFound: number;
  architectureRulesFound: number;
  designPrinciplesFound: number;
  qualityGatesFound: number;
}
```

### 8.2 Expected Counts

Based on current CONSTITUTION.md (as of January 2026):

| Type | Expected | IDs |
|------|----------|-----|
| Principles | 5 | 1, 2, 3, 4, 5 |
| Constraints | 5 | C1, C2, C3, C4, C5 |
| Architecture Rules | 4 | AR1, AR2, AR3, AR4 |
| Design Principles | 5 | DP1, DP2, DP3, DP4, DP5 |
| Quality Gates | 4 | QG1, QG2, QG3, QG4 |

**Warning Triggers**:
- Fewer items than expected
- Duplicate IDs
- Missing required fields
- Malformed markdown structure

---

## 9. Integration Points

### 9.1 SpecKitStrategy Integration

The constitution parser will be used by `SpecKitStrategy`:

```typescript
export class SpecKitStrategy implements OutputStrategy {
  private constitutionPath?: string;
  
  async render(result: DomainResult, options: RenderOptions): Promise<OutputArtifacts> {
    const constitution = this.constitutionPath
      ? await this.loadConstitution()
      : null;
    
    return {
      primary: this.renderSpec(result, constitution),
      additionalDocuments: [
        this.renderPlan(result, constitution),
        // ...
      ],
    };
  }
  
  private async loadConstitution(): Promise<Constitution | null> {
    const content = await fs.readFile(this.constitutionPath, 'utf-8');
    return parseConstitution(content);
  }
}
```

### 9.2 Spec Validation Integration

Parsed constitution used for spec validation:

```typescript
export class SpecValidator {
  constructor(private constitution: Constitution) {}
  
  validate(spec: ParsedSpec): ValidationResult {
    const violations: Violation[] = [];
    
    // Check each principle
    for (const principle of this.constitution.principles) {
      if (!this.checkPrinciple(spec, principle)) {
        violations.push({
          type: 'principle',
          id: principle.id,
          message: `Spec may violate principle ${principle.id}: ${principle.name}`,
        });
      }
    }
    
    // Check constraints
    for (const constraint of this.constitution.constraints) {
      if (!this.checkConstraint(spec, constraint)) {
        violations.push({
          type: 'constraint',
          id: constraint.id,
          message: `Spec violates constraint ${constraint.id}: ${constraint.rule}`,
        });
      }
    }
    
    return {
      valid: violations.length === 0,
      violations,
    };
  }
}
```

### 9.3 Documentation Generation

Constitution data embedded in generated spec.md:

```markdown
## Constitutional Constraints

The following constraints from CONSTITUTION.md apply:

### Principles
- **1**: Tool Discoverability First
- **2**: Pure Domain, Pluggable Output
- **3**: Incremental Migration (Strangler Fig)

### Constraints
- **C1**: TypeScript Strict Mode
- **C2**: ESM Module System
- **C3**: Test Coverage
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
describe('parseConstitution', () => {
  it('should parse all principle types', () => {
    const result = parseConstitution(sampleConstitution);
    
    expect(result.principles).toHaveLength(5);
    expect(result.constraints).toHaveLength(5);
    expect(result.architectureRules).toHaveLength(4);
    expect(result.designPrinciples).toHaveLength(5);
    expect(result.qualityGates).toHaveLength(4);
  });
  
  it('should extract principle rationale', () => {
    const result = parseConstitution(sampleConstitution);
    const principle1 = result.principles.find(p => p.id === '1');
    
    expect(principle1?.rationale).toBe(
      "If LLMs can't discover and correctly select tools, the entire system fails."
    );
  });
  
  it('should extract constraint details', () => {
    const result = parseConstitution(sampleConstitution);
    const c1 = result.constraints.find(c => c.id === 'C1');
    
    expect(c1?.details).toContain('`strict: true` in tsconfig.json');
    expect(c1?.details).toContain('No `any` types without explicit justification');
  });
});
```

### 10.2 Integration Tests

```typescript
describe('Constitution Integration', () => {
  it('should parse actual CONSTITUTION.md file', async () => {
    const path = 'plan-v0.13.x/CONSTITUTION.md';
    const content = await fs.readFile(path, 'utf-8');
    
    const result = parseConstitution(content);
    
    expect(result.principles.length).toBeGreaterThan(0);
    expect(result.constraints.length).toBeGreaterThan(0);
  });
  
  it('should integrate with SpecKitStrategy', async () => {
    const strategy = new SpecKitStrategy('plan-v0.13.x/CONSTITUTION.md');
    const artifacts = await strategy.render(mockDomainResult, {});
    
    expect(artifacts.primary.content).toContain('Constitutional Constraints');
  });
});
```

---

## 11. Next Steps

### 11.1 Immediate (Task P4-002)

1. Implement `constitution-parser.ts` based on this analysis
2. Create TypeScript interfaces in `types.ts`
3. Write comprehensive unit tests
4. Test with actual CONSTITUTION.md file

### 11.2 Follow-up Tasks

1. **P4-004**: Integrate parser with SpecKitStrategy
2. **P4-013**: Use parsed data for SpecValidator
3. **P4-022**: Document constitution parser API

---

## 12. References

- **Source File**: `plan-v0.13.x/CONSTITUTION.md`
- **Related Spec**: [SPEC-005: Spec-Kit Integration](../../plan-v0.13.x/specs/SPEC-005-speckit-integration.md)
- **Related Tasks**: [TASKS Phase 4](../../plan-v0.13.x/tasks/TASKS-phase-4-speckit-integration.md)
- **Parent Issue**: #698 (Phase 4: Spec-Kit Integration)
- **Current Task**: #P4-001 (Analyze CONSTITUTION.md Structure)

---

## Appendix A: Complete ID List

### Principles (1-5)
```
1. Tool Discoverability First
2. Pure Domain, Pluggable Output
3. Incremental Migration (Strangler Fig)
4. Cross-Cutting Capabilities Are Universal
5. Specification-Driven Development
```

### Constraints (C1-C5)
```
C1: TypeScript Strict Mode
C2: ESM Module System
C3: Test Coverage
C4: Error Handling
C5: Backward Compatibility
```

### Architecture Rules (AR1-AR4)
```
AR1: Layer Dependencies
AR2: File Organization
AR3: Naming Conventions
AR4: Interface Patterns
```

### Design Principles (DP1-DP5)
```
DP1: Reduce to Essence
DP2: Progressive Disclosure
DP3: Consistency
DP4: Deference
DP5: Clarity
```

### Quality Gates (QG1-QG4)
```
QG1: Pre-Commit
QG2: Pre-Push
QG3: PR Review
QG4: Release
```

---

## Appendix B: Sample Parser Output

```typescript
const sampleOutput: Constitution = {
  metadata: {
    title: "MCP AI Agent Guidelines — Constitution",
    adopted: "January 2026",
    lastUpdated: "January 2026",
    appliesTo: "v0.13.x and all future versions unless superseded",
    sourcePath: "plan-v0.13.x/CONSTITUTION.md"
  },
  principles: [
    {
      id: "1",
      name: "Tool Discoverability First",
      title: "Tool Discoverability First",
      rationale: "If LLMs can't discover and correctly select tools, the entire system fails.",
      implications: [
        "Tool descriptions must be action-oriented and unique",
        "JSON schemas must include examples",
        "Similar tools must be consolidated or clearly differentiated",
        "Tool annotations must indicate behavior hints"
      ],
      content: "### 1. Tool Discoverability First\n\n> Every tool MUST..."
    },
    // ... more principles
  ],
  constraints: [
    {
      id: "C1",
      rule: "TypeScript Strict Mode",
      details: [
        "`strict: true` in tsconfig.json",
        "No `any` types without explicit justification",
        "All tool inputs validated with Zod"
      ],
      content: "### C1: TypeScript Strict Mode\n\n- `strict: true`..."
    },
    // ... more constraints
  ],
  architectureRules: [
    {
      id: "AR1",
      rule: "Layer Dependencies",
      description: undefined,
      codeExamples: [
        "Allowed:\n  MCPServer → PolyglotGateway → DomainServices...",
        // ...
      ],
      content: "### AR1: Layer Dependencies\n\n```\nAllowed:\n..."
    },
    // ... more rules
  ],
  designPrinciples: [
    {
      id: "DP1",
      rule: "Reduce to Essence",
      description: "Each tool does **ONE thing** brilliantly. Consolidate overlapping tools.",
      antiPattern: "hierarchical-prompt-builder that builds, evaluates, AND selects levels",
      goodPattern: "Three focused tools: prompt-build, prompt-evaluate, prompt-select-level",
      content: "### DP1: Reduce to Essence\n\nEach tool does..."
    },
    // ... more principles
  ],
  qualityGates: [
    {
      id: "QG1",
      gate: "Pre-Commit",
      checks: [
        "Biome format check",
        "TypeScript type check",
        "No console.log statements"
      ],
      content: "### QG1: Pre-Commit\n\n- Biome format check..."
    },
    // ... more gates
  ]
};
```

---

*Analysis completed: January 11, 2026*  
*Ready for implementation: Task P4-002*
