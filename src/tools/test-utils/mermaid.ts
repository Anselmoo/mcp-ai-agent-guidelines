/**
 * Test utilities for Mermaid diagram generation.
 *
 * @module test-utils/mermaid
 * @internal Exported for tests only
 */

/**
 * Set a custom mermaid module provider for testing.
 *
 * **Exported for tests only** - This function allows tests to mock the Mermaid
 * module loading behavior without requiring the actual mermaid package.
 *
 * @param provider - Custom module provider function or null to reset
 *
 * @example
 * ```typescript
 * import { __setMermaidModuleProvider } from '@/tools/test-utils/mermaid';
 *
 * // Mock mermaid for testing
 * __setMermaidModuleProvider(() => ({
 *   parse: (code: string) => Promise.resolve(true)
 * }));
 *
 * // Reset after test
 * __setMermaidModuleProvider(null);
 * ```
 *
 * @internal
 */
export { __setMermaidModuleProvider } from "../mermaid/validator.js";
