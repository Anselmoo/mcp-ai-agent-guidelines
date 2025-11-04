<!-- HEADER:START -->
![Header](./.frames-static/09-header.svg)
<!-- HEADER:END -->

# Prompting Hierarchy Guide

> Understanding prompt levels and evaluation for effective AI agent interaction

## Overview

The prompting hierarchy defines six levels of guidance and autonomy for AI interactions, from fully independent operation to maximum guidance. Understanding these levels helps you choose the right prompting strategy for your task.

## The Six Levels

### Level 1: Independent

**Autonomy**: Highest
**Guidance**: Minimal
**Best For**: Well-defined tasks, experienced AI agents

The AI operates autonomously with minimal direction:

```
"Optimize the database query performance in the user service."
```

**Characteristics**:
- High-level objective only
- No step-by-step instructions
- AI determines approach and implementation
- Suitable for straightforward, well-understood tasks

**When to Use**:
- Task has clear success criteria
- AI has sufficient context
- Low risk of misinterpretation
- You trust the AI's judgment

### Level 2: Indirect

**Autonomy**: High
**Guidance**: Hints and suggestions
**Best For**: Tasks requiring some direction

Provide guidance through hints, constraints, or preferred approaches:

```
"Optimize the database query performance. Consider adding indexes
on frequently queried columns and reviewing the JOIN operations."
```

**Characteristics**:
- Objective + helpful hints
- Suggests direction without prescribing steps
- AI still has significant autonomy
- Guides thinking without being prescriptive

**When to Use**:
- Task is moderately complex
- You have preferences but not strict requirements
- Want to leverage AI creativity within bounds
- Need to avoid specific pitfalls

### Level 3: Direct

**Autonomy**: Moderate
**Guidance**: Step-by-step instructions
**Best For**: Complex tasks requiring specific approach

Provide explicit, step-by-step instructions:

```
"Optimize the database query performance:
1. Add index on user_id column
2. Replace nested SELECT with JOIN
3. Add EXPLAIN ANALYZE to measure improvement
4. Document before/after metrics"
```

**Characteristics**:
- Detailed procedural steps
- Clear sequence of actions
- Less room for interpretation
- Ensures specific approach is followed

**When to Use**:
- Task must be done a specific way
- High stakes or regulatory requirements
- You know the exact solution needed
- Consistency is critical

### Level 4: Modeling

**Autonomy**: Low
**Guidance**: Examples to follow
**Best For**: Tasks requiring specific patterns

Provide concrete examples or templates to follow:

```
"Optimize the database query performance. Here's how we did it
for the orders service:

BEFORE:
SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE active = true);

AFTER:
SELECT o.* FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.active = true;
CREATE INDEX idx_users_active ON users(active);

Apply the same pattern to the user service queries."
```

**Characteristics**:
- Concrete examples provided
- "Do it like this" approach
- Pattern to replicate
- Visual or code demonstrations

**When to Use**:
- Specific style or pattern required
- Complex formatting needs
- Learning new patterns
- Ensuring consistency with existing code

### Level 5: Scaffolding

**Autonomy**: Very Low
**Guidance**: Partial completion + fill-in-the-blanks
**Best For**: Highly structured tasks

Provide a partially completed solution with placeholders:

```
"Complete this query optimization:

-- Original query
SELECT * FROM users WHERE [CONDITION_TO_OPTIMIZE];

-- Optimized query
SELECT [SPECIFIC_COLUMNS] FROM users
WHERE [OPTIMIZED_CONDITION]
[ADD_APPROPRIATE_INDEX];

-- Add index
CREATE INDEX idx_users_[COLUMN_NAME] ON users([COLUMN_TO_INDEX]);

-- Metrics
Query time before: [MEASURE]
Query time after: [MEASURE]
Improvement: [CALCULATE]
"
```

**Characteristics**:
- Template with blanks to fill
- Structure completely provided
- Minimal decision-making required
- Focus on specific details only

**When to Use**:
- Highly standardized processes
- Strict compliance requirements
- Reducing cognitive load
- Ensuring exact format

### Level 6: Full-Physical

**Autonomy**: None
**Guidance**: Maximum
**Best For**: Critical tasks, compliance, training

Provide complete, detailed specifications with every detail prescribed:

```
"Execute this exact query optimization:

1. Open file: src/services/user-service.ts
2. Locate line 42: SELECT * FROM users WHERE active = 1
3. Replace with exactly:
   SELECT id, name, email FROM users WHERE active = true
4. Save file
5. Open migration file: migrations/2024-add-user-index.sql
6. Add exactly:
   CREATE INDEX idx_users_active ON users(active) WHERE active = true;
7. Run migration: npm run migrate
8. Run benchmarks: npm run benchmark:users
9. Verify improvement > 50%
10. Commit with message: 'perf: optimize user query with partial index'"
```

**Characteristics**:
- Every step explicitly defined
- No ambiguity or interpretation
- Complete hand-holding
- Prescriptive and detailed

**When to Use**:
- Critical, high-risk operations
- Regulatory or compliance requirements
- Training scenarios
- Eliminating all uncertainty

## Choosing the Right Level

### Decision Matrix

| Factor | Independent | Indirect | Direct | Modeling | Scaffolding | Full-Physical |
|--------|-------------|----------|--------|----------|-------------|---------------|
| Task Complexity | Low | Low-Med | Medium | Medium | High | High |
| Risk Level | Low | Low | Medium | Medium | High | Critical |
| AI Experience | High | High | Medium | Medium | Low | Any |
| Time Available | High | High | Medium | Low | Low | Low |
| Precision Required | Low | Medium | High | High | Very High | Absolute |

### Task-Based Recommendations

**Code Generation**:
- Simple utilities → Independent
- Following patterns → Modeling
- Complex algorithms → Direct or Scaffolding

**Analysis**:
- General assessment → Independent
- Focused review → Indirect
- Compliance audit → Direct or Full-Physical

**Documentation**:
- README updates → Independent or Indirect
- API docs → Modeling
- Regulatory docs → Scaffolding or Full-Physical

**Refactoring**:
- Code cleanup → Independent or Indirect
- Architecture changes → Direct or Modeling
- Database migrations → Scaffolding or Full-Physical

## Evaluation Criteria

### Scoring Prompts

The `prompting-hierarchy-evaluator` tool scores prompts on multiple dimensions:

#### 1. Clarity (0-100)

How well the prompt communicates intent:
- **90-100**: Crystal clear, unambiguous
- **70-89**: Clear with minor ambiguities
- **50-69**: Moderately clear, some interpretation needed
- **< 50**: Unclear or confusing

#### 2. Specificity (0-100)

Level of detail provided:
- **90-100**: Extremely specific, all details provided
- **70-89**: Specific in key areas
- **50-69**: Moderate detail
- **< 50**: Vague or generic

#### 3. Completeness (0-100)

Coverage of necessary information:
- **90-100**: All required information present
- **70-89**: Most information provided
- **50-69**: Some gaps exist
- **< 50**: Significant information missing

#### 4. Cognitive Complexity (0-100)

Mental effort required:
- **90-100**: Minimal thinking required (scaffolding/full-physical)
- **70-89**: Some decision-making needed (direct/modeling)
- **50-69**: Moderate complexity (indirect)
- **< 50**: High complexity (independent)

### Example Evaluation

**Prompt**: "Fix the authentication bug"

- **Clarity**: 30/100 - Unclear which bug
- **Specificity**: 20/100 - No details on what to fix
- **Completeness**: 25/100 - Missing context and requirements
- **Recommended Level**: Need more specificity for any level

**Improved Prompt**: "Fix the authentication bug where users can't log in with Google OAuth. The error occurs in `auth-service.ts` line 156 when the OAuth token is validated. Add proper error handling and logging."

- **Clarity**: 85/100 - Clear problem and location
- **Specificity**: 80/100 - Specific file and line
- **Completeness**: 75/100 - Missing expected behavior
- **Recommended Level**: Direct or Modeling

## Best Practices

### 1. Start Higher, Move Lower

Begin with less guidance (Independent/Indirect) and increase guidance if needed:

```
Attempt 1 (Independent): "Optimize the query"
→ Result unclear
Attempt 2 (Direct): "Optimize by adding index on user_id and refactoring JOIN"
→ Success
```

### 2. Match Criticality to Guidance

More critical tasks warrant lower autonomy:

- **Non-critical**: Independent/Indirect
- **Important**: Direct/Modeling
- **Critical**: Scaffolding/Full-Physical

### 3. Context Over Instructions

Sometimes providing rich context enables higher autonomy:

```
Less effective (Direct):
"Do X, then Y, then Z"

More effective (Indirect):
"Goal is to achieve [outcome]. Current constraints are [A, B, C].
Previous attempts using [D] failed because [E]."
```

### 4. Iterate Based on Results

Use evaluation results to refine prompts:

```typescript
const evaluation = await promptingHierarchyEvaluator({
  promptText: "Your prompt here",
  includeRecommendations: true
});

// Review scores and recommendations
// Adjust prompt based on feedback
```

## Tools for Hierarchy Management

### Hierarchy Level Selector

Automatically recommends appropriate level:

```typescript
const recommendation = await hierarchyLevelSelector({
  taskDescription: "Migrate database schema to new version",
  taskComplexity: "complex",
  agentCapability: "intermediate",
  autonomyPreference: "medium"
});

// Returns: "direct" or "modeling"
```

### Hierarchy Evaluator

Scores existing prompts and provides improvement suggestions:

```typescript
const evaluation = await promptingHierarchyEvaluator({
  promptText: "Your prompt",
  targetLevel: "direct",
  includeRecommendations: true
});

// Returns scores + improvement recommendations
```

### Hierarchical Prompt Builder

Builds prompts at specified levels:

```typescript
const prompt = await hierarchicalPromptBuilder({
  context: "Code optimization",
  goal: "Improve query performance",
  requirements: ["Maintain compatibility", "Document changes"],
  provider: "gpt-4.1",
  autoSelectTechniques: true
});
```

## Common Pitfalls

### 1. Over-Specification

**Problem**: Providing too much guidance for simple tasks
**Solution**: Start with Independent/Indirect for straightforward work

### 2. Under-Specification

**Problem**: Too little guidance for complex or critical tasks
**Solution**: Use Direct/Modeling for tasks requiring precision

### 3. Inconsistent Level

**Problem**: Mixing guidance levels within same prompt
**Solution**: Choose one level and maintain it throughout

### 4. Ignoring Context

**Problem**: Not providing necessary background
**Solution**: Include relevant context even at lower autonomy levels

## Related Resources

- [AI Interaction Tips](./AI_INTERACTION_TIPS.md) - General AI interaction guidance
- [Flow Prompting Examples](./FLOW_PROMPTING_EXAMPLES.md) - Multi-step workflows
- [Tools Reference](./TOOLS_REFERENCE.md) - Tool documentation

## Conclusion

The prompting hierarchy provides a framework for choosing the right level of guidance for any task. By understanding these levels and using the evaluation tools, you can craft more effective prompts that balance autonomy with precision.
---

<!-- FOOTER:START -->
![Footer](./.frames-static/09-footer.svg)
<!-- FOOTER:END -->
