# Mode-Switcher Audit

**Date**: 2026-01-08
**Auditor**: GitHub Copilot Agent
**Issue**: [P3-001: Analyze mode-switcher Current Implementation](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/TBD)
**Parent Issue**: [#697 - Phase 3: Fix Broken Tools](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/697)

---

## Executive Summary

The `mode-switcher` tool currently provides **guidance-only** functionality. It returns markdown documentation describing different agent modes and their characteristics, but it **does not actually change any agent state**. The tool lacks a state management layer, making it ineffective for runtime mode switching.

**Key Findings:**
- ✅ **Working**: Mode profile definitions, tool recommendations, context guidance
- ❌ **Missing**: State persistence, actual mode switching, cross-call state retention
- 🔧 **Required**: Singleton state manager, refactored tool handler, integration tests

---

## Current Implementation Analysis

### 1. File Location

**Primary Implementation:**
- `src/tools/mode-switcher.ts` (443 lines)

**Related Files:**
- `tests/vitest/mode-switcher.test.ts` - Test suite
- `docs/tools/mode-switcher.md` - Documentation
- `src/index.ts` - Tool registration (lines 51, 2051-2053, 2498)

### 2. Input Parameters

The tool accepts the following schema (defined in `ModeSwitcherSchema`):

```typescript
{
  targetMode: AgentMode,          // Required: 'planning' | 'editing' | 'analysis' | 'interactive' | 'one-shot' | 'debugging' | 'refactoring' | 'documentation'
  currentMode?: AgentMode,        // Optional: For display purposes only
  context?: AgentContext,         // Optional: 'desktop-app' | 'ide-assistant' | 'agent' | 'terminal' | 'collaborative'
  reason?: string,                // Optional: Reason for mode switch
  includeReferences?: boolean,    // Optional: Include external links (default: false)
  includeMetadata?: boolean       // Optional: Include metadata section (default: false)
}
```

**Validation**: Uses Zod schema validation via `ModeSwitcherSchema.parse(args)`

### 3. Current Behavior

**What It Does:**

1. **Parses Input**: Validates request parameters using Zod
2. **Retrieves Profile**: Looks up target mode profile from `MODE_PROFILES` constant
3. **Generates Guidance**: Builds markdown response with:
   - Mode overview and description
   - Primary focus areas (4 items per mode)
   - Enabled tools list (mode-specific)
   - Disabled tools list (if any)
   - Prompting strategy guidance
   - Best use cases (4 items per mode)
   - Next steps (5 numbered steps)
   - Context-specific guidance (if context provided)
   - Further reading references (if requested)

4. **Returns Response**: Markdown text in MCP response format

**Example Output Structure:**
```markdown
## 🔄 Mode Switch: Planning Mode

### 📊 Mode Transition
**To**: Planning Mode
**Reason**: Complex feature implementation

### 🎯 Planning Mode Overview
Focus on analysis, design, and creating comprehensive plans before implementation

### 🔍 Primary Focus Areas
- Understand requirements thoroughly
- Break down complex tasks
- Create detailed action plans
- Identify risks and dependencies

### 🛠️ Enabled Tools
- hierarchical-prompt-builder
- domain-neutral-prompt-builder
- strategy-frameworks-builder
- gap-frameworks-analyzers
- mermaid-diagram-generator

### 🚫 Disabled Tools
- code-editing
- file-operations

### 💡 Prompting Strategy
Use structured, hierarchical prompts with clear context and goals. Plan before acting.

### ✅ Best Used For
- Complex feature implementation
- System design
- Refactoring large codebases
- Risk assessment

### 🎬 Next Steps in Planning Mode
1. Gather all requirements and constraints
2. Break down the task into manageable components
3. Create a detailed implementation plan
4. Identify potential risks and mitigation strategies
5. Review plan before proceeding to implementation

---
**Mode Active**: Planning Mode 🟢
```

### 4. What It Does NOT Do

**Critical Gap: No State Management**

- ❌ Does not persist mode across tool calls
- ❌ Does not update any global state
- ❌ Does not filter available tools based on mode
- ❌ Does not enforce mode-specific behaviors
- ❌ Does not track mode transition history
- ❌ Cannot query current active mode
- ❌ Does not validate mode transitions

**Example Problem:**
```javascript
// Call 1: Switch to planning mode
await modeSwitcher({ targetMode: "planning" });
// Result: Returns guidance text

// Call 2: Query current mode
// Problem: There's no way to know we're in "planning" mode!
// The tool has no memory of the previous call
```

### 5. Test Coverage Analysis

**Test File**: `tests/vitest/mode-switcher.test.ts` (297 lines)

**Coverage Areas:**
- ✅ Mode switching for all 8 modes
- ✅ Context support for all 5 contexts
- ✅ Mode details (enabled/disabled tools, strategies, use cases)
- ✅ Mode transitions (current → target)
- ✅ Options (includeReferences, includeMetadata)
- ✅ Output formatting

**Missing Tests:**
- ❌ State persistence verification
- ❌ Cross-call state retention
- ❌ Actual mode change confirmation
- ❌ Tool filtering based on active mode

---

## Gap Analysis

### Problem Statement

The tool is **informational only** - it tells you about modes but doesn't actually switch them.

### Root Cause

**No State Management Layer**

The tool lacks:
1. **State Storage**: No place to persist current mode
2. **Singleton Manager**: No shared instance across tool calls
3. **State Transitions**: No mechanism to track mode changes
4. **Tool Integration**: No way for other tools to query/respect current mode

### Impact

**For Users:**
- Mode switching has no effect on agent behavior
- Must manually track which mode they're in
- Cannot leverage mode-specific tool recommendations
- False expectation of stateful behavior

**For Developers:**
- Cannot build mode-aware tools
- No way to enforce mode-specific constraints
- Cannot track mode transition patterns
- Missing telemetry on mode usage

### Comparison: Expected vs Actual

| Feature | Expected Behavior | Actual Behavior | Gap |
|---------|------------------|-----------------|-----|
| **Mode Switch** | Changes active mode, persists across calls | Returns guidance text only | ❌ No state change |
| **Current Mode** | Can query active mode | No way to query | ❌ No state storage |
| **Tool Filtering** | Only shows mode-appropriate tools | Shows all tools | ❌ No filtering |
| **Mode History** | Tracks mode transitions | No tracking | ❌ No history |
| **Validation** | Validates mode transitions | No validation | ❌ No checks |
| **Persistence** | Mode survives tool calls | Mode forgotten immediately | ❌ No memory |

---

## Proposed State Model

### Core Interfaces

```typescript
/**
 * Agent operation modes
 */
export type Mode =
  | 'planning'
  | 'editing'
  | 'analysis'
  | 'debugging'
  | 'refactoring'
  | 'documentation'
  | 'interactive'
  | 'one-shot';

/**
 * Operating contexts for agent
 */
export type AgentContext =
  | 'desktop-app'
  | 'ide-assistant'
  | 'agent'
  | 'terminal'
  | 'collaborative';

/**
 * Current state of the agent mode
 */
interface ModeState {
  currentMode: Mode;
  previousMode?: Mode;
  timestamp: Date;
  context?: AgentContext;
  metadata?: Record<string, unknown>;
}

/**
 * Record of a mode transition
 */
interface ModeTransition {
  from: Mode;
  to: Mode;
  timestamp: Date;
  reason?: string;
  context?: AgentContext;
}

/**
 * Mode profile defining characteristics and recommendations
 */
interface ModeProfile {
  name: string;
  description: string;
  focus: string[];
  enabledTools: string[];
  disabledTools: string[];
  promptingStrategy: string;
  bestFor: string[];
}
```

### Singleton Manager Design

```typescript
/**
 * Singleton class managing agent mode state
 *
 * Responsibilities:
 * - Persist current mode across tool calls
 * - Track mode transition history
 * - Provide mode-specific tool recommendations
 * - Validate mode transitions (optional)
 */
class ModeManager {
  private static instance: ModeManager;
  private state: ModeState;
  private history: ModeTransition[];

  private constructor() {
    this.state = {
      currentMode: 'interactive',
      timestamp: new Date(),
    };
    this.history = [];
  }

  static getInstance(): ModeManager {
    if (!ModeManager.instance) {
      ModeManager.instance = new ModeManager();
    }
    return ModeManager.instance;
  }

  /**
   * Get current active mode
   */
  getCurrentMode(): Mode {
    return this.state.currentMode;
  }

  /**
   * Get current state including metadata
   */
  getState(): ModeState {
    return { ...this.state };
  }

  /**
   * Switch to a new mode
   */
  setMode(mode: Mode, reason?: string, context?: AgentContext): ModeState {
    const previousMode = this.state.currentMode;

    // Record transition
    this.history.push({
      from: previousMode,
      to: mode,
      timestamp: new Date(),
      reason,
      context,
    });

    // Update state
    this.state = {
      currentMode: mode,
      previousMode,
      timestamp: new Date(),
      context,
    };

    return { ...this.state };
  }

  /**
   * Get recommended tools for a mode
   */
  getToolsForMode(mode?: Mode): string[] {
    const targetMode = mode ?? this.state.currentMode;
    return MODE_TOOL_MAP[targetMode] ?? ['*'];
  }

  /**
   * Get mode transition history
   */
  getHistory(): ModeTransition[] {
    return [...this.history];
  }

  /**
   * Reset to default state (for testing)
   */
  reset(): void {
    this.state = {
      currentMode: 'interactive',
      timestamp: new Date(),
    };
    this.history = [];
  }
}

// Export singleton instance
export const modeManager = ModeManager.getInstance();
```

### Mode-Tool Mapping

```typescript
/**
 * Maps each mode to recommended tools
 */
const MODE_TOOL_MAP: Record<Mode, string[]> = {
  planning: [
    'design-assistant',
    'hierarchical-prompt-builder',
    'domain-neutral-prompt-builder',
    'architecture-design-prompt-builder',
    'strategy-frameworks-builder',
    'gap-frameworks-analyzers',
    'mermaid-diagram-generator',
    'sprint-timeline-calculator',
  ],

  editing: [
    'semantic-code-analyzer',
    'code-hygiene-analyzer',
    'code-analysis-prompt-builder',
    'iterative-coverage-enhancer',
    'hierarchical-prompt-builder',
  ],

  analysis: [
    'semantic-code-analyzer',
    'clean-code-scorer',
    'code-hygiene-analyzer',
    'dependency-auditor',
    'guidelines-validator',
    'gap-frameworks-analyzers',
    'project-onboarding',
  ],

  debugging: [
    'debugging-assistant-prompt-builder',
    'semantic-code-analyzer',
    'iterative-coverage-enhancer',
    'code-hygiene-analyzer',
  ],

  refactoring: [
    'semantic-code-analyzer',
    'clean-code-scorer',
    'code-hygiene-analyzer',
    'code-analysis-prompt-builder',
    'iterative-coverage-enhancer',
  ],

  documentation: [
    'documentation-generator-prompt-builder',
    'mermaid-diagram-generator',
    'domain-neutral-prompt-builder',
    'hierarchical-prompt-builder',
  ],

  interactive: ['*'], // All tools available

  'one-shot': ['*'], // All tools available
};
```

---

## Required Changes

### Phase 1: Create ModeManager (P3-002)

**File**: `src/tools/shared/mode-manager.ts`

**Tasks:**
1. ✅ Create singleton ModeManager class
2. ✅ Implement state storage with ModeState interface
3. ✅ Implement mode switching with setMode()
4. ✅ Implement mode querying with getCurrentMode()
5. ✅ Implement tool recommendations with getToolsForMode()
6. ✅ Implement history tracking with getHistory()
7. ✅ Add reset() for testing
8. ✅ Export singleton instance

**Tests**: `tests/vitest/shared/mode-manager.spec.ts`
- Test mode switching
- Test state persistence
- Test history tracking
- Test tool recommendations
- Test reset functionality

**Estimate**: 4 hours

---

### Phase 2: Refactor mode-switcher Tool (P3-003)

**File**: `src/tools/mode-switcher.ts`

**Changes Required:**

1. **Import ModeManager**
   ```typescript
   import { modeManager, type Mode } from './shared/mode-manager.js';
   ```

2. **Modify modeSwitcher Function**
   ```typescript
   export async function modeSwitcher(args: unknown) {
     const input = ModeSwitcherSchema.parse(args);

     // Get current mode BEFORE switch
     const previousMode = modeManager.getCurrentMode();

     // Validate currentMode parameter if provided
     if (input.currentMode && input.currentMode !== previousMode) {
       return {
         content: [{
           type: 'text',
           text: `⚠️ Mode Mismatch\n\nExpected current mode: ${input.currentMode}\nActual current mode: ${previousMode}\n\nPlease verify the current mode before switching.`
         }]
       };
     }

     // ACTUALLY SWITCH MODE (this is the key change!)
     const newState = modeManager.setMode(
       input.targetMode,
       input.reason,
       input.context
     );

     // Get recommended tools for new mode
     const recommendedTools = modeManager.getToolsForMode(input.targetMode);

     // Get existing mode profile for guidance
     const targetProfile = MODE_PROFILES[input.targetMode];

     // Build response with actual state change confirmation
     return {
       content: [{
         type: 'text',
         text: buildModeResponse(targetProfile, newState, recommendedTools, input)
       }]
     };
   }
   ```

3. **Update Response Builder**
   - Include actual mode switch confirmation
   - Show timestamp of mode change
   - Display recommended tools from ModeManager (not hardcoded)
   - Add "Mode will persist until changed" note

4. **Add getCurrentMode Tool** (optional enhancement)
   ```typescript
   export async function getCurrentMode() {
     const state = modeManager.getState();

     return {
       content: [{
         type: 'text',
         text: `**Current Mode**: ${state.currentMode}\n**Since**: ${state.timestamp.toISOString()}\n${state.previousMode ? `**Previous Mode**: ${state.previousMode}\n` : ''}`
       }]
     };
   }
   ```

**Tests**: `tests/vitest/tools/mode-switcher.integration.spec.ts`
- Test actual mode switching
- Test mode persistence across calls
- Test currentMode validation
- Test recommended tools
- Test mode history

**Estimate**: 4 hours

---

### Phase 3: Update Tool Registration (P3-003)

**File**: `src/index.ts`

**Changes:**
1. Register mode-switcher with updated behavior
2. Optionally register getCurrentMode tool
3. Update tool description to reflect state management

**Estimate**: 1 hour

---

### Phase 4: Integration Testing (P3-016)

**File**: `tests/vitest/integration/mode-switcher.integration.spec.ts`

**Test Scenarios:**
1. **Basic Mode Switch**
   ```typescript
   // Switch to planning
   await modeSwitcher({ targetMode: 'planning' });

   // Verify mode persisted
   const state = modeManager.getState();
   expect(state.currentMode).toBe('planning');
   ```

2. **Cross-Call Persistence**
   ```typescript
   // Switch to editing
   await modeSwitcher({ targetMode: 'editing' });

   // Call another tool (simulated)

   // Verify mode still editing
   expect(modeManager.getCurrentMode()).toBe('editing');
   ```

3. **Mode Validation**
   ```typescript
   // Switch to analysis
   await modeSwitcher({ targetMode: 'analysis' });

   // Try to switch with wrong currentMode
   const result = await modeSwitcher({
     currentMode: 'planning', // Wrong!
     targetMode: 'debugging'
   });

   // Should reject
   expect(result.content[0].text).toContain('Mode Mismatch');
   ```

4. **History Tracking**
   ```typescript
   // Switch through several modes
   await modeSwitcher({ targetMode: 'planning' });
   await modeSwitcher({ targetMode: 'editing', reason: 'Start implementation' });
   await modeSwitcher({ targetMode: 'debugging', reason: 'Bug found' });

   // Verify history
   const history = modeManager.getHistory();
   expect(history).toHaveLength(3);
   expect(history[2].reason).toBe('Bug found');
   ```

**Estimate**: 3 hours

---

### Phase 5: Documentation Updates (P3-018)

**Files to Update:**

1. **docs/tools/mode-switcher.md**
   - Update "What It Does" section to reflect state management
   - Add section on state persistence
   - Document getCurrentMode (if added)
   - Update examples to show actual mode switching

2. **docs/analysis/mode-switcher-audit.md** (this document)
   - Mark as "Resolved" when complete
   - Add "Implementation Complete" section with links

3. **CHANGELOG.md**
   ```markdown
   ## [Unreleased]

   ### Fixed
   - mode-switcher now actually changes agent state (#697, P3-001, P3-002, P3-003)

   ### Added
   - ModeManager singleton for state persistence
   - Mode transition history tracking
   - getCurrentMode query capability
   ```

**Estimate**: 2 hours

---

## Implementation Roadmap

```
Phase 1: Analysis (P3-001) ✅ CURRENT
├─ Audit current implementation
├─ Define state model
└─ Document required changes

Phase 2: ModeManager (P3-002) ⏳ NEXT
├─ Create singleton class
├─ Implement state methods
└─ Add unit tests

Phase 3: Refactor Tool (P3-003) ⏳ BLOCKED BY P3-002
├─ Update mode-switcher
├─ Add getCurrentMode
└─ Add integration tests

Phase 4: Documentation (P3-018) ⏳ BLOCKED BY P3-003
├─ Update tool docs
├─ Update CHANGELOG
└─ Mark audit resolved

Phase 5: Validation (P3-016) ⏳ BLOCKED BY P3-003
└─ Comprehensive integration tests
```

**Total Estimate**: 14-16 hours across all phases

---

## Testing Strategy

### Unit Tests

**ModeManager** (`tests/vitest/shared/mode-manager.spec.ts`):
- ✅ Test singleton pattern
- ✅ Test getCurrentMode()
- ✅ Test setMode()
- ✅ Test getToolsForMode()
- ✅ Test getHistory()
- ✅ Test reset()

**mode-switcher** (`tests/vitest/mode-switcher.test.ts`):
- ✅ Test all existing scenarios (keep current tests)
- ✅ Add state change verification
- ✅ Add currentMode validation

### Integration Tests

**Cross-Tool State** (`tests/vitest/integration/mode-switcher.integration.spec.ts`):
- ✅ Test mode persistence across multiple tool calls
- ✅ Test mode validation
- ✅ Test history accumulation
- ✅ Test tool recommendations accuracy

### Manual Testing

**Interactive Scenarios**:
1. Switch to planning → verify guidance
2. Switch to editing → verify tools change
3. Query current mode → verify persistence
4. Switch through all 8 modes → verify history

---

## References

### Related Issues

- **Parent**: [#697 - Phase 3: Fix Broken Tools](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/697)
- **Next**: [P3-002 - Implement ModeManager Singleton](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/p3-002-sub-implement-mode-manager.md)
- **Blocked**: [P3-003 - Refactor mode-switcher Tool](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/p3-003-sub-refactor-mode-switcher.md)

### Specifications

- [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)
- [TASKS Phase 3: Broken Tools](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md)

### Code Files

- Implementation: `src/tools/mode-switcher.ts`
- Tests: `tests/vitest/mode-switcher.test.ts`
- Documentation: `docs/tools/mode-switcher.md`

---

## Conclusion

The mode-switcher tool audit reveals a **guidance-only implementation** that lacks actual state management. While the tool provides excellent mode documentation and recommendations, it fails to deliver on the core promise of "switching modes."

**Critical Path to Fix:**
1. ✅ **P3-001**: Complete this audit (DONE)
2. ⏳ **P3-002**: Implement ModeManager singleton
3. ⏳ **P3-003**: Refactor mode-switcher to use ModeManager
4. ⏳ **P3-016/P3-018**: Testing and documentation

**Success Criteria:**
- ✅ Mode persists across tool calls
- ✅ getCurrentMode returns actual state
- ✅ Mode transitions are tracked
- ✅ Tool recommendations reflect active mode
- ✅ Integration tests verify stateful behavior

This audit provides the foundation for transforming mode-switcher from an informational tool into a functional state management system.

---

**Audit Status**: ✅ **Complete**
**Next Action**: Proceed with P3-002 (ModeManager implementation)
**Estimated Time to Fix**: 14-16 hours across 4 phases
