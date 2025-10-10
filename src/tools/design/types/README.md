# Design Tool Types - Modular Organization

This directory contains the type definitions for the Design Assistant Framework, organized by domain for better maintainability and navigation.

## File Structure

- **`common.types.ts`** - Common types used across multiple domains
  - `PhaseStatus`, `ConstraintType`, `ArtifactType`, `OutputFormat`
  - `RiskLevel`, `SessionStatus`, `EventType`

- **`session.types.ts`** - Session and state management types
  - `DesignSessionConfig`, `DesignSessionState`, `DesignPhase`
  - `SessionEvent`

- **`constraint.types.ts`** - Constraint-related types
  - `ConstraintRule`, `ValidationRule`
  - `ConstraintSatisfactionResult`, `ConstraintDecision`
  - `ConstraintEnforcementHistory`, `ConstraintConsistencyViolation`

- **`coverage.types.ts`** - Coverage and validation types
  - `CoverageReport`, `CoverageCheckResult`, `CoverageGap`
  - `ConfirmationResult`, `ConfirmationReport`
  - `SessionValidationResult`, `ComplianceReport`

- **`artifact.types.ts`** - Artifact-related types
  - `Artifact`, `ArtifactQualityResult`

- **`methodology.types.ts`** - Methodology selection types
  - `MethodologySignals`, `MethodologyCandidate`, `MethodologySelection`
  - `MethodologyProfile`, `Milestone`
  - `ProjectType`, `ProblemFraming`, `TimelinePressure`, `StakeholderMode`

- **`pivot.types.ts`** - Strategic pivot types
  - `PivotDecision`, `PivotImpact`, `PivotGuidance`
  - `StrategicPivotPromptRequest`, `StrategicPivotPromptResult`

- **`consistency.types.ts`** - Cross-session consistency types
  - `CrossSessionConstraintHistory`, `CrossSessionConsistencyReport`
  - `ConsistencyResult`, `ConsistencyViolation`, `ConsistencyRecommendation`
  - `HistoricalPattern`, `EnforcementPrompt`, `EnforcementOption`
  - `CrossSessionValidationResult`, `EnforcementAction`

- **`index.ts`** - Barrel file re-exporting all types

## Usage

Import types from the barrel export:

```typescript
import type {
  DesignSessionState,
  ConstraintRule,
  CoverageReport
} from "./types/index.js";
```

Or import from specific domain files if you need only a subset:

```typescript
import type { DesignSessionState } from "./types/session.types.js";
import type { ConstraintRule } from "./types/constraint.types.js";
```

## Migration Notes

This modular structure replaces the monolithic `types.ts` file. All imports have been updated to use the new barrel export at `./types/index.js`.

### Benefits

1. **Better Navigation** - Related types are grouped together logically
2. **Reduced Complexity** - Each file is focused on a specific domain
3. **Easier Maintenance** - Changes are isolated to specific type files
4. **Improved Discoverability** - New contributors can find types more easily
5. **Lower Risk of Circular Dependencies** - Clear boundaries between type domains
