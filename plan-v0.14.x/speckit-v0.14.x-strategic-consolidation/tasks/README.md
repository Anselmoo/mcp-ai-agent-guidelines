# Task Implementation Guides

This folder contains detailed implementation guides for each task in the v0.14.x Strategic Consolidation.

Each task guide includes:
- **Complete TypeScript code examples** based on existing codebase patterns
- **Step-by-step implementation instructions**
- **Test file examples** with Vitest
- **Acceptance criteria checklists**
- **References to existing source files**

## Directory Structure

```
tasks/
├── README.md
├── phase-1-foundation/
├── phase-2-migration/
├── phase-25-unified-prompts/
├── phase-3-consolidation/
├── phase-4-platform/
├── phase-5-cicd/
├── phase-6-testing/
└── validation/
```

## Task Index

### Phase 1

| Task | Title | Guide |
| --- | --- | --- |
| T-001 | Create BaseStrategy<T> Abstract Class | [Guide](./phase-1-foundation/T-001-base-strategy.md) |
| T-002 | Test BaseStrategy<T> | [Guide](./phase-1-foundation/T-002-test-basestrategy-t.md) |
| T-003 | Implement ExecutionTrace Class | [Guide](./phase-1-foundation/T-003-execution-trace.md) |
| T-004 | Test ExecutionTrace | [Guide](./phase-1-foundation/T-004-test-executiontrace.md) |
| T-005 | Create SummaryFeedbackCoordinator | [Guide](./phase-1-foundation/T-005-summary-feedback.md) |
| T-006 | Test SummaryFeedbackCoordinator | [Guide](./phase-1-foundation/T-006-test-summaryfeedbackcoordinator.md) |
| T-007 | Create AgentHandoffCoordinator | [Guide](./phase-1-foundation/T-007-agent-handoff.md) |
| T-008 | Test AgentHandoffCoordinator | [Guide](./phase-1-foundation/T-008-test-agenthandoffcoordinator.md) |
| T-009 | Update OutputStrategy Interface | [Guide](./phase-1-foundation/T-009-update-outputstrategy-interface.md) |
| T-010 | Phase 1 Integration Test | [Guide](./phase-1-foundation/T-010-phase-1-integration-test.md) |

### Phase 2

| Task | Title | Guide |
| --- | --- | --- |
| T-011 | Migrate SpecKitStrategy | [Guide](./phase-2-migration/T-011-migrate-speckit.md) |
| T-012 | Migrate TOGAFStrategy | [Guide](./phase-2-migration/T-012-migrate-togafstrategy.md) |
| T-013 | Migrate ADRStrategy | [Guide](./phase-2-migration/T-013-migrate-adrstrategy.md) |
| T-014 | Migrate RFCStrategy | [Guide](./phase-2-migration/T-014-migrate-rfcstrategy.md) |
| T-015 | Migrate EnterpriseStrategy | [Guide](./phase-2-migration/T-015-migrate-enterprisestrategy.md) |
| T-016 | Migrate SDDStrategy | [Guide](./phase-2-migration/T-016-migrate-sddstrategy.md) |
| T-017 | Migrate ChatStrategy | [Guide](./phase-2-migration/T-017-migrate-chatstrategy.md) |
| T-018 | Convert Score-Mapping to Threshold Arrays | [Guide](./phase-2-migration/T-018-threshold-arrays.md) |
| T-019 | Test Score-Mapping Thresholds | [Guide](./phase-2-migration/T-019-test-score-mapping-thresholds.md) |
| T-020 | Test All Migrated Strategies | [Guide](./phase-2-migration/T-020-test-all-migrated-strategies.md) |
| T-021 | Verify BaseStrategy Compliance | [Guide](./phase-2-migration/T-021-verify-basestrategy-compliance.md) |
| T-022 | Phase 2 Integration Test | [Guide](./phase-2-migration/T-022-phase-2-integration-test.md) |

### Phase 2.5

| Task | Title | Guide |
| --- | --- | --- |
| T-023 | Design UnifiedPromptBuilder Architecture | [Guide](./phase-25-unified-prompts/T-023-design-unifiedpromptbuilder-architecture.md) |
| T-024 | Implement PromptRegistry | [Guide](./phase-25-unified-prompts/T-024-prompt-registry.md) |
| T-025 | Implement TemplateEngine | [Guide](./phase-25-unified-prompts/T-025-template-engine.md) |
| T-026 | Implement UnifiedPromptBuilder Core | [Guide](./phase-25-unified-prompts/T-026-unified-builder.md) |
| T-027 | Implement Domain Generator: Hierarchical | [Guide](./phase-25-unified-prompts/T-027-implement-domain-generator-hierarchical.md) |
| T-028 | Implement Domain Generator: Security | [Guide](./phase-25-unified-prompts/T-028-implement-domain-generator-security.md) |
| T-029 | Implement Domain Generator: Architecture | [Guide](./phase-25-unified-prompts/T-029-implement-domain-generator-architecture.md) |
| T-030 | Implement Domain Generator: Code Analysis | [Guide](./phase-25-unified-prompts/T-030-implement-domain-generator-code-analysis.md) |
| T-031 | Implement Domain Generator: Domain Neutral | [Guide](./phase-25-unified-prompts/T-031-implement-domain-generator-domain-neutral.md) |
| T-032 | Create Legacy Facade: HierarchicalPromptBuilder | [Guide](./phase-3-consolidation/T-032-legacy-facades.md) |
| T-033 | Create Legacy Facade: DomainNeutralPromptBuilder | [Guide](./phase-25-unified-prompts/T-033-create-legacy-facade-domainneutralpromptbuilder.md) |
| T-034 | Add ToolAnnotations to All Prompt Tools (GAP-001) | [Guide](./phase-25-unified-prompts/T-034-add-toolannotations-to-all-prompt-tools-gap-001.md) |
| T-035 | Test UnifiedPromptBuilder | [Guide](./phase-25-unified-prompts/T-035-test-unifiedpromptbuilder.md) |
| T-036 | Phase 2.5 Integration Test | [Guide](./phase-25-unified-prompts/T-036-phase-2-5-integration-test.md) |

### Phase 3

| Task | Title | Guide |
| --- | --- | --- |
| T-037 | Design Framework Router Architecture | [Guide](./phase-3-consolidation/T-037-framework-router.md) |
| T-038 | Implement Framework Router | [Guide](./phase-3-consolidation/T-038-implement-framework-router.md) |
| T-039 | Consolidate Prompt Engineering Framework | [Guide](./phase-3-consolidation/T-039-consolidate-prompt-engineering-framework.md) |
| T-040 | Consolidate Code Quality Framework | [Guide](./phase-3-consolidation/T-040-consolidate-code-quality-framework.md) |
| T-041 | Consolidate Design & Architecture Framework | [Guide](./phase-3-consolidation/T-041-consolidate-design-architecture-framework.md) |
| T-042 | Consolidate Security Framework | [Guide](./phase-3-consolidation/T-042-consolidate-security-framework.md) |
| T-043 | Consolidate Testing Framework | [Guide](./phase-3-consolidation/T-043-consolidate-testing-framework.md) |
| T-044 | Consolidate Documentation Framework | [Guide](./phase-3-consolidation/T-044-consolidate-documentation-framework.md) |
| T-045 | Consolidate Remaining Frameworks (5) | [Guide](./phase-3-consolidation/T-045-consolidate-remaining-frameworks-5.md) |
| T-046 | Implement GAP-002: Schema Examples for Zod | [Guide](./phase-3-consolidation/T-046-schema-examples.md) |
| T-047 | Implement GAP-004: Deprecation Warning Helpers | [Guide](./phase-3-consolidation/T-047-implement-gap-004-deprecation-warning-helpers.md) |
| T-048 | Implement GAP-008: validate_progress Tool | [Guide](./phase-3-consolidation/T-048-validate-progress.md) |
| T-049 | Test Framework Consolidation | [Guide](./phase-3-consolidation/T-049-test-framework-consolidation.md) |
| T-050 | Test GAP Implementations | [Guide](./phase-3-consolidation/T-050-test-gap-implementations.md) |
| T-051 | Verify Framework Count = 11 | [Guide](./phase-3-consolidation/T-051-verify-framework-count-11.md) |
| T-052 | Phase 3 Integration Test | [Guide](./phase-3-consolidation/T-052-phase-3-integration-test.md) |

### Phase 4

| Task | Title | Guide |
| --- | --- | --- |
| T-053 | Design PAL Interface | [Guide](./phase-4-platform/T-053-pal-interface.md) |
| T-054 | Implement NodePAL | [Guide](./phase-4-platform/T-054-node-pal.md) |
| T-055 | Implement MockPAL | [Guide](./phase-4-platform/T-055-mock-pal.md) |
| T-056 | Identify All fs/path Calls | [Guide](./phase-4-platform/T-056-identify-all-fs-path-calls.md) |
| T-057 | Replace fs/path Calls with PAL | [Guide](./phase-4-platform/T-057-replace-fs-path-calls-with-pal.md) |
| T-058 | Test PAL Interface | [Guide](./phase-4-platform/T-058-test-pal-interface.md) |
| T-059 | Cross-Platform Verification | [Guide](./phase-4-platform/T-059-cross-platform-verification.md) |
| T-060 | Phase 4 Integration Test | [Guide](./phase-4-platform/T-060-phase-4-integration-test.md) |

### Phase 5

| Task | Title | Guide |
| --- | --- | --- |
| T-061 | Implement CI Job: validate_progress | [Guide](./phase-5-cicd/T-061-ci-validate-progress.md) |
| T-062 | Implement CI Job: validate_annotations | [Guide](./phase-5-cicd/T-062-ci-validate-annotations.md) |
| T-063 | Implement CI Job: validate_schema_examples | [Guide](./phase-5-cicd/T-063-ci-validate-schema-examples.md) |
| T-064 | Optimize CI Pipeline | [Guide](./phase-5-cicd/T-064-ci-optimize.md) |
| T-065 | Generate API Documentation | [Guide](./phase-5-cicd/T-065-generate-api-documentation.md) |
| T-066 | Create Migration Guide | [Guide](./phase-5-cicd/T-066-create-migration-guide.md) |
| T-067 | Implement GAP-005: CSV Export | [Guide](./phase-5-cicd/T-067-csv-export.md) |
| T-068 | Phase 5 Integration Test | [Guide](./phase-5-cicd/T-068-phase-5-integration-test.md) |

### Phase 6

| Task | Title | Guide |
| --- | --- | --- |
| T-069 | Domain Layer Tests (100% Coverage) | [Guide](./phase-6-testing/T-069-domain-tests.md) |
| T-070 | Tools Layer Tests (90% Coverage) | [Guide](./phase-6-testing/T-070-tools-layer-tests-90-coverage.md) |
| T-071 | Integration Tests | [Guide](./phase-6-testing/T-071-integration-tests.md) |
| T-072 | Setup CI Matrix Testing | [Guide](./phase-6-testing/T-072-ci-matrix.md) |
| T-073 | Test validate_progress Tool | [Guide](./phase-6-testing/T-073-test-validate-progress-tool.md) |
| T-074 | Test validate_annotations Tool | [Guide](./phase-6-testing/T-074-test-validate-annotations-tool.md) |
| T-075 | Test validate_schema_examples Tool | [Guide](./phase-6-testing/T-075-test-validate-schema-examples-tool.md) |
| T-076 | Final Acceptance Criteria Validation | [Guide](./phase-6-testing/T-076-final-acceptance-criteria-validation.md) |

### Validation

| Task | Title | Guide |
| --- | --- | --- |
| V-001 | Verify ToolAnnotations Coverage = 100% | [Guide](./validation/V-001-verify-toolannotations-coverage-100.md) |
| V-002 | Verify Schema Description Coverage ≥80% | [Guide](./validation/V-002-verify-schema-description-coverage-80.md) |
| V-003 | Verify Framework Count = 11 | [Guide](./validation/V-003-verify-framework-count-11.md) |
| V-004 | Verify Test Coverage ≥90% | [Guide](./validation/V-004-verify-test-coverage-90.md) |
| V-005 | Verify All Strategies Extend BaseStrategy | [Guide](./validation/V-005-verify-all-strategies-extend-basestrategy.md) |
| V-006 | Verify Zero Duplicate Descriptions | [Guide](./validation/V-006-verify-zero-duplicate-descriptions.md) |
| V-007 | Verify All progress.md Valid | [Guide](./validation/V-007-verify-all-progress-md-valid.md) |
| V-008 | Verify CI Matrix Passes | [Guide](./validation/V-008-verify-ci-matrix-passes.md) |
| V-009 | Verify Single Prompt Entry Point | [Guide](./validation/V-009-verify-single-prompt-entry-point.md) |
| V-010 | Verify CI Runtime ≤12min | [Guide](./validation/V-010-verify-ci-runtime-12min.md) |
| V-011 | Verify Documentation Complete | [Guide](./validation/V-011-verify-documentation-complete.md) |
| V-012 | Verify enforce_planning Works | [Guide](./validation/V-012-verify-enforce-planning-works.md) |
| V-013 | Verify ExecutionTrace Active | [Guide](./validation/V-013-verify-executiontrace-active.md) |
| V-014 | Verify PAL Abstracts All fs/path | [Guide](./validation/V-014-verify-pal-abstracts-all-fs-path.md) |
