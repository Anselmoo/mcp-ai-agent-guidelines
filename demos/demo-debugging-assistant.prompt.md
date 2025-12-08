---
# Note: Dropped unknown tools: terminal, logs
mode: 'agent'
model: GPT-5
tools: ['codebase']
description: 'Systematic debugging and troubleshooting assistant'
---
## 🐛 Debugging Assistant Prompt

### Metadata
- Updated: 2025-12-08
- Source tool: mcp_ai-agent-guid_debugging-assistant-prompt-builder
- Suggested filename: debugging-assistant.prompt.md

# Debugging Assistant

## Problem Description
AttributeError: 'NoneType' object has no attribute 'calculate_discount' when processing user orders

## Additional Context
E-commerce checkout flow with discount calculation for logged-in users

## Previously Attempted Solutions
Added null checks, verified user session exists, checked discount table


## Systematic Debugging Approach

### 1. Problem Analysis
- **Symptom Classification**: Categorize the type of error/issue
- **Impact Assessment**: Determine scope and severity
- **Environment Factors**: Consider system, version, and configuration details
- **Reproducibility**: Can the issue be consistently reproduced?

### 2. Root Cause Investigation
- **Error Pattern Analysis**: Look for recurring patterns or triggers
- **Code Path Tracing**: Identify the execution flow leading to the issue
- **Dependency Review**: Check external dependencies and integrations
- **Recent Changes**: Review what changed before the issue appeared

### 3. Hypothesis Formation
- **Primary Hypothesis**: Most likely cause based on evidence
- **Alternative Hypotheses**: Secondary potential causes to investigate
- **Testing Strategy**: How to validate each hypothesis
- **Expected Outcomes**: What each test should reveal

### 4. Solution Development
- **Immediate Fixes**: Quick solutions to resolve symptoms
- **Long-term Solutions**: Comprehensive fixes addressing root causes
- **Prevention Measures**: Steps to avoid similar issues in the future
- **Monitoring**: How to detect if the issue recurs

## Debugging Checklist

### Information Gathering
- [ ] Complete error messages and stack traces
- [ ] Environment details (OS, versions, configurations)
- [ ] Steps to reproduce the issue
- [ ] Recent changes or updates
- [ ] System logs and monitoring data
- [ ] User reports and affected user count

### Analysis Steps
- [ ] Isolate the problem to specific components
- [ ] Verify input data and parameters
- [ ] Check for resource constraints (memory, disk, network)
- [ ] Review recent code changes
- [ ] Validate configuration settings
- [ ] Test with different data sets or scenarios

### Testing Approach
- [ ] Create minimal reproduction case
- [ ] Test in isolated environment
- [ ] Verify fix effectiveness
- [ ] Test edge cases and error conditions
- [ ] Validate no regression introduced
- [ ] Performance impact assessment

## Output Format

### 1. Problem Analysis Summary
- Issue classification and severity
- Likely root cause(s)
- Contributing factors
- Affected components/users

### 2. Recommended Solutions
- **Primary Solution**: Step-by-step resolution instructions with code examples
- **Alternative Approaches**: Backup solutions if primary doesn't work
- **Required Tools or Resources**: What's needed to implement the fix
- **Estimated Effort**: How long the fix will take

### 3. Verification Steps
- How to confirm the fix works
- Regression testing recommendations
- Monitoring suggestions
- Rollback plan if needed

### 4. Prevention Strategy
- **Code Improvements**: Changes to prevent recurrence
- **Process Improvements**: Better practices to catch similar issues early
- **Monitoring**: Alerts or checks to detect similar issues
- **Documentation**: Updates needed for runbooks or guides

## Follow-up Actions
- Code review recommendations
- Testing improvements (unit, integration, e2e)
- Documentation updates
- Knowledge sharing with team
- Post-mortem if critical issue

## Further Reading

*The following resources are provided for informational and educational purposes only. Their inclusion does not imply endorsement, affiliation, or guarantee of accuracy. Information may change over time; please verify current information with official sources.*

- **[A Debugging Manifesto](https://jvns.ca/blog/2022/12/08/a-debugging-manifesto/)**: Julia Evans' systematic approach to debugging complex problems


