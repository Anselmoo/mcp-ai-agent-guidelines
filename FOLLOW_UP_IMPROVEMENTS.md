# Follow-up Improvements for Design Services

## Code Review Findings

The following improvements were identified during the refactoring code review. These are existing issues from the original code that were moved into services during the refactoring. They should be addressed in future iterations:

### 1. PhaseManagementService - Generic Phase Guidance
**File**: `src/tools/design/services/phase-management.service.ts`, line 163
**Issue**: The `getPhaseGuidance()` method returns hardcoded generic guidance instead of utilizing the sessionState parameter.
**Recommendation**:
- Update the method to return phase-specific guidance based on the session state
- Consider using the phase configuration to provide contextual recommendations
- Remove the unused `_sessionState` parameter if not needed

### 2. ConsistencyService - Mock Session State Usage
**Files**:
- `src/tools/design/services/consistency.service.ts`, lines 117, 183
- `src/tools/design/services/artifact-generation.service.ts`, line 106

**Issue**: Using mock session state in production code for cross-session consistency enforcement.
**Recommendation**:
- Implement proper session state retrieval from storage/persistence layer
- Document the placeholder implementation if this is intentional
- Consider adding a session state provider interface for better abstraction

### 3. AdditionalOperationsService - Minimal Session Context
**File**: `src/tools/design/services/additional-operations.service.ts`, line 191
**Issue**: The `selectMethodology()` method creates a minimal mock session state for ADR generation.
**Recommendation**:
- Use proper session context when available
- Consider making session context optional with clear fallback behavior
- Document the ADR generation behavior when full session context is unavailable

## Future Refactoring Opportunities

### 1. Session State Management
Create a dedicated `SessionStateProvider` service to:
- Abstract session state retrieval
- Provide mock/real implementations based on context
- Centralize session state access patterns

### 2. Service Tests
Add comprehensive unit tests for each service:
- SessionManagementService tests
- PhaseManagementService tests
- ArtifactGenerationService tests
- ConsistencyService tests
- AdditionalOperationsService tests

### 3. Service Documentation
Add JSDoc comments to all service methods:
- Method purpose and behavior
- Parameter descriptions
- Return value documentation
- Example usage

### 4. Performance Monitoring
Consider adding performance monitoring:
- Track service method execution times
- Identify potential bottlenecks
- Add metrics for service usage patterns

## Priority

**Low Priority** - These are existing issues that do not block functionality. They can be addressed incrementally as part of ongoing maintenance and improvement efforts.
