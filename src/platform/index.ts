/**
 * Platform Abstraction Layer module.
 * Exports PAL interface, NodePAL, MockPAL, and the runtime singleton.
 * @module
 */

export type { MockPALOptions } from "./mock-pal.js";
export { MockPAL } from "./mock-pal.js";
export { NodePAL, nodePal } from "./node-pal.js";
export type {
	FileStats,
	ListFilesOptions,
	Platform,
	PlatformAbstractionLayer,
} from "./pal.interface.js";

import { NodePAL } from "./node-pal.js";
import type { PlatformAbstractionLayer } from "./pal.interface.js";

/**
 * Runtime PAL singleton.
 * Replace with MockPAL in tests via setPal().
 */
let _pal: PlatformAbstractionLayer = new NodePAL();

/**
 * Get the current PAL instance.
 */
export function getPal(): PlatformAbstractionLayer {
	return _pal;
}

/**
 * Replace the PAL instance (use in tests).
 *
 * @example
 * ```typescript
 * import { setPal, MockPAL } from './platform/index.js';
 *
 * beforeEach(() => {
 *   const mock = new MockPAL();
 *   mock.setFile('/project/README.md', '# Test');
 *   setPal(mock);
 * });
 * ```
 */
export function setPal(pal: PlatformAbstractionLayer): void {
	_pal = pal;
}

/**
 * Shortcut to access the current PAL instance.
 * Use when importing pal directly is more ergonomic.
 */
export const pal: PlatformAbstractionLayer = new Proxy(
	{} as PlatformAbstractionLayer,
	{
		get(_target, prop) {
			return (_pal as unknown as Record<string, unknown>)[prop as string];
		},
	},
);
