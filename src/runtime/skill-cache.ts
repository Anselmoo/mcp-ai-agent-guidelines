/**
 * Intelligent skill result caching system.
 *
 * Provides memory-efficient caching with TTL management, cache invalidation
 * strategies, and configurable limits for skill execution results.
 */

import { createHash } from "node:crypto";
import {
	CACHE_EXPIRY_CHECK_PERIOD_DIVISOR,
	CACHE_EXPIRY_CHECK_PERIOD_MIN_SECONDS,
	DEFAULT_CACHE_CONFIG_VALUES,
} from "../config/runtime-defaults.js";
import type {
	InstructionInput,
	SkillExecutionResult,
} from "../contracts/runtime.js";

// Compatibility layer for NodeCache and LRUCache
interface NodeCacheConfig {
	stdTTL?: number;
	checkperiod?: number;
	maxKeys?: number;
	deleteOnExpire?: boolean;
}

class NodeCacheCompat {
	private store = new Map<string, unknown>();
	private readonly timers = new Map<string, NodeJS.Timeout>();
	private readonly onEvict?: (key: string) => void;
	private _evictions = 0;

	constructor(_config: NodeCacheConfig = {}, onEvict?: (key: string) => void) {
		this.onEvict = onEvict;
	}

	private clearTimer(key: string): void {
		const timer = this.timers.get(key);
		if (!timer) {
			return;
		}

		clearTimeout(timer);
		this.timers.delete(key);
	}

	get(key: string): unknown {
		return this.store.get(key);
	}

	set(key: string, value: unknown, ttl?: number): boolean {
		this.clearTimer(key);
		this.store.set(key, value);
		if (ttl && ttl > 0) {
			const t = setTimeout(() => {
				this.timers.delete(key);
				if (this.store.delete(key)) {
					this._evictions += 1;
					this.onEvict?.(key);
				}
			}, ttl * 1000);
			(t as NodeJS.Timeout).unref();
			this.timers.set(key, t);
		}
		return true;
	}

	del(key: string) {
		this.clearTimer(key);
		return this.store.delete(key);
	}

	keys() {
		return Array.from(this.store.keys());
	}

	flushAll() {
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear();
		this.store.clear();
	}

	getStats() {
		return {
			keys: this.store.size,
			hits: 0,
			misses: 0,
			evictions: this._evictions,
		};
	}
	has(key: string): boolean {
		return this.store.has(key);
	}
}

class LRUCacheCompat<K, V> {
	private store = new Map<K, V>();
	private expiry = new Map<K, number>();
	private maxSize: number;
	private ttlMs: number;
	private readonly onEvict?: (key: K) => void;

	constructor(
		options: {
			max: number;
			ttl?: number;
			allowStale?: boolean;
			updateAgeOnGet?: boolean;
			updateAgeOnHas?: boolean;
		},
		onEvict?: (key: K) => void,
	) {
		this.maxSize = options.max;
		this.ttlMs = options.ttl ?? 0; // ttl in ms (matches lru-cache API)
		this.onEvict = onEvict;
	}

	private remove(key: K, evicted = false): boolean {
		this.expiry.delete(key);
		const removed = this.store.delete(key);
		if (removed && evicted) {
			this.onEvict?.(key);
		}
		return removed;
	}

	get(key: K): V | undefined {
		const exp = this.expiry.get(key);
		if (exp !== undefined && Date.now() > exp) {
			this.remove(key, true);
			return undefined;
		}
		const value = this.store.get(key);
		if (value !== undefined) {
			this.store.delete(key);
			this.store.set(key, value);
		}
		return value;
	}

	set(key: K, value: V): void {
		if (this.store.has(key)) {
			this.remove(key);
		} else if (this.store.size >= this.maxSize) {
			const firstKey = this.store.keys().next().value;
			if (firstKey !== undefined) {
				this.remove(firstKey, true);
			}
		}
		this.store.set(key, value);
		if (this.ttlMs > 0) this.expiry.set(key, Date.now() + this.ttlMs);
	}

	delete(key: K): boolean {
		return this.remove(key);
	}

	clear(): void {
		this.store.clear();
		this.expiry.clear();
	}

	get size(): number {
		return this.store.size;
	}

	has(key: K): boolean {
		const exp = this.expiry.get(key);
		if (exp !== undefined && Date.now() > exp) {
			this.remove(key, true);
			return false;
		}
		return this.store.has(key);
	}
	peek(key: K): V | undefined {
		return this.store.get(key);
	}
	keys(): IterableIterator<K> {
		return this.store.keys();
	}
	purgeStale(): void {
		const now = Date.now();
		for (const [key, exp] of this.expiry) {
			if (now > exp) {
				this.remove(key, true);
			}
		}
	}
}

export interface CacheConfig {
	/** Maximum number of cached results */
	maxSize: number;
	/** Default TTL in seconds */
	defaultTtl: number;
	/** Enable LRU eviction when max size reached */
	enableLru: boolean;
	/** TTL strategies per skill type */
	skillTtlMap?: Record<string, number>;
	/** Enable cache statistics */
	enableStats: boolean;
}

export interface CacheEntry {
	result: SkillExecutionResult;
	timestamp: number;
	hits: number;
	lastAccessed: number;
	inputHash: string;
}

export interface CacheStats {
	hits: number;
	misses: number;
	evictions: number;
	totalSize: number;
	hitRate: number;
}

export type CacheInvalidationStrategy =
	| "time-based" // TTL-based expiration
	| "skill-based" // Invalidate by skill family
	| "content-based" // Invalidate by content similarity
	| "manual"; // Manual invalidation only

const DEFAULT_CONFIG: CacheConfig = {
	...DEFAULT_CACHE_CONFIG_VALUES,
	skillTtlMap: { ...DEFAULT_CACHE_CONFIG_VALUES.skillTtlMap },
};

export class SkillCacheService {
	private readonly nodeCache: NodeCacheCompat;
	private readonly lruCache: LRUCacheCompat<string, CacheEntry>;
	private readonly config: CacheConfig;
	private stats: CacheStats;

	constructor(config: Partial<CacheConfig> = {}) {
		this.config = {
			...DEFAULT_CONFIG,
			...config,
			skillTtlMap: {
				...DEFAULT_CONFIG.skillTtlMap,
				...config.skillTtlMap,
			},
		};

		// Initialize stats
		this.stats = {
			hits: 0,
			misses: 0,
			evictions: 0,
			totalSize: 0,
			hitRate: 0,
		};

		// Initialize caches
		this.nodeCache = new NodeCacheCompat(
			{
				stdTTL: this.config.defaultTtl,
				checkperiod: Math.max(
					CACHE_EXPIRY_CHECK_PERIOD_MIN_SECONDS,
					this.config.defaultTtl / CACHE_EXPIRY_CHECK_PERIOD_DIVISOR,
				),
				maxKeys: this.config.enableLru ? -1 : this.config.maxSize,
				deleteOnExpire: true,
			},
			() => this.recordEviction(),
		);

		this.lruCache = new LRUCacheCompat<string, CacheEntry>(
			{
				max: this.config.maxSize,
				ttl: this.config.defaultTtl * 1000, // LRU uses milliseconds
				allowStale: false,
				updateAgeOnGet: true,
				updateAgeOnHas: false,
			},
			() => this.recordEviction(),
		);

		// Set up cache event listeners
		this.setupCacheListeners();
	}

	/**
	 * Generate cache key from skill ID and input
	 */
	private generateCacheKey(skillId: string, input: InstructionInput): string {
		const inputStr = JSON.stringify({
			request: input.request,
			context: input.context || "",
			constraints: input.constraints || [],
			deliverable: input.deliverable || "",
			successCriteria: input.successCriteria || "",
		});

		const hash = createHash("sha256")
			.update(`${skillId}:${inputStr}`)
			.digest("hex")
			.substring(0, 16);

		return `${skillId}:${hash}`;
	}

	/**
	 * Generate hash of input content for invalidation
	 */
	private generateInputHash(input: InstructionInput): string {
		const content = `${input.request} ${input.context || ""}`;
		return createHash("md5").update(content).digest("hex");
	}

	/**
	 * Get TTL for specific skill
	 */
	private getTtlForSkill(skillId: string): number {
		// Check for exact match first
		if (this.config.skillTtlMap?.[skillId]) {
			return this.config.skillTtlMap[skillId];
		}

		// Check for prefix match
		for (const [prefix, ttl] of Object.entries(this.config.skillTtlMap || {})) {
			if (skillId.startsWith(prefix)) {
				return ttl;
			}
		}

		return this.config.defaultTtl;
	}

	/**
	 * Set up cache event listeners for statistics
	 */
	private setupCacheListeners(): void {
		// NodeCacheCompat is a simple Map shim — no event emitter.
		// Eviction tracking is handled via stats only when entries expire on get.
	}

	/**
	 * Update cache statistics
	 */
	private updateStats(hit: boolean): void {
		if (!this.config.enableStats) return;

		if (hit) {
			this.stats.hits++;
		} else {
			this.stats.misses++;
		}

		const total = this.stats.hits + this.stats.misses;
		this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
		if (!this.config.enableLru) {
			this.stats.evictions = this.nodeCache.getStats().evictions;
		}
		this.updateTotalSize();
	}

	private recordEviction(): void {
		if (!this.config.enableStats) {
			return;
		}

		this.stats.evictions++;
		this.updateTotalSize();
	}

	/**
	 * Update total cache size
	 */
	private updateTotalSize(): void {
		if (this.config.enableLru) {
			this.stats.totalSize = this.lruCache.size;
		} else {
			this.stats.totalSize = this.nodeCache.keys().length;
		}
	}

	/**
	 * Store skill execution result in cache
	 */
	async set(
		skillId: string,
		input: InstructionInput,
		result: SkillExecutionResult,
	): Promise<void> {
		const key = this.generateCacheKey(skillId, input);
		const ttl = this.getTtlForSkill(skillId);
		const now = Date.now();

		const entry: CacheEntry = {
			result,
			timestamp: now,
			hits: 0,
			lastAccessed: now,
			inputHash: this.generateInputHash(input),
		};

		if (this.config.enableLru) {
			this.lruCache.set(key, entry); // ttl handled by compat shim
		} else {
			this.nodeCache.set(key, entry, ttl);
		}

		this.updateTotalSize();
	}

	/**
	 * Retrieve skill execution result from cache
	 */
	async get(
		skillId: string,
		input: InstructionInput,
	): Promise<SkillExecutionResult | null> {
		const key = this.generateCacheKey(skillId, input);
		let entry: CacheEntry | undefined;

		if (this.config.enableLru) {
			entry = this.lruCache.get(key);
		} else {
			entry = this.nodeCache.get(key) as CacheEntry | undefined;
		}

		if (entry) {
			// Update access statistics
			entry.hits++;
			entry.lastAccessed = Date.now();
			this.updateStats(true);
			return entry.result;
		}

		this.updateStats(false);
		return null;
	}

	/**
	 * Check if result is cached without incrementing hits
	 */
	has(skillId: string, input: InstructionInput): boolean {
		const key = this.generateCacheKey(skillId, input);

		if (this.config.enableLru) {
			return this.lruCache.has(key);
		} else {
			return this.nodeCache.has(key);
		}
	}

	/**
	 * Invalidate cache entries using different strategies
	 */
	async invalidate(
		strategy: CacheInvalidationStrategy,
		target?: string | RegExp | ((entry: CacheEntry) => boolean),
	): Promise<number> {
		let deletedCount = 0;

		switch (strategy) {
			case "manual":
				if (typeof target === "string") {
					// Delete specific key
					if (this.config.enableLru) {
						const deleted = this.lruCache.delete(target);
						if (deleted) deletedCount = 1;
					} else {
						const deleted = this.nodeCache.del(target);
						deletedCount = deleted ? 1 : 0;
					}
				}
				break;

			case "skill-based":
				if (typeof target === "string") {
					// Keys are formatted as "skillId:hash" — extract the skillId part for matching
					const keys = this.config.enableLru
						? Array.from(this.lruCache.keys())
						: this.nodeCache.keys();

					const keysToDelete = keys.filter((key: string) => {
						const skillIdPart = key.substring(0, key.lastIndexOf(":"));
						return (
							skillIdPart === target || skillIdPart.startsWith(`${target}-`)
						);
					});

					for (const key of keysToDelete) {
						if (this.config.enableLru) {
							this.lruCache.delete(key);
						} else {
							this.nodeCache.del(key);
						}
						deletedCount++;
					}
				}
				break;

			case "content-based":
				if (typeof target === "function") {
					// Delete entries matching predicate
					const keys = this.config.enableLru
						? Array.from(this.lruCache.keys())
						: this.nodeCache.keys();

					for (const key of keys) {
						const keyStr = String(key);
						const rawEntry = this.config.enableLru
							? this.lruCache.peek(keyStr)
							: this.nodeCache.get(keyStr);
						const entry = rawEntry as CacheEntry | undefined;

						if (entry?.result && target(entry)) {
							if (this.config.enableLru) {
								this.lruCache.delete(String(key));
							} else {
								this.nodeCache.del(String(key));
							}
							deletedCount++;
						}
					}
				}
				break;

			case "time-based":
				// This is handled automatically by TTL, but we can force cleanup
				if (this.config.enableLru) {
					this.lruCache.purgeStale();
				} else {
					// NodeCache handles this automatically
				}
				break;
		}

		this.updateTotalSize();
		return deletedCount;
	}

	/**
	 * Clear all cache entries
	 */
	async clear(): Promise<void> {
		if (this.config.enableLru) {
			this.lruCache.clear();
		} else {
			this.nodeCache.flushAll();
		}

		// Reset stats
		this.stats = {
			hits: 0,
			misses: 0,
			evictions: 0,
			totalSize: 0,
			hitRate: 0,
		};
	}

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		this.updateTotalSize();
		return { ...this.stats };
	}

	/**
	 * Get cache configuration
	 */
	getConfig(): CacheConfig {
		return { ...this.config };
	}

	/**
	 * Update cache configuration at runtime
	 */
	updateConfig(newConfig: Partial<CacheConfig>): void {
		Object.assign(this.config, newConfig);

		// Update TTL on existing cache if changed
		if (newConfig.defaultTtl && !this.config.enableLru) {
			// this.nodeCache.options.stdTTL = newConfig.defaultTtl; // not supported by NodeCacheCompat
		}
	}

	/**
	 * Get detailed cache information for debugging
	 */
	getCacheInfo(): {
		config: CacheConfig;
		stats: CacheStats;
		sampleEntries: Array<{ key: string; age: number; hits: number }>;
	} {
		const keys = this.config.enableLru
			? Array.from(this.lruCache.keys())
			: this.nodeCache.keys();

		const now = Date.now();
		const sampleEntries = keys.slice(0, 10).map((key: string) => {
			const keyStr = String(key);
			const rawEntry = this.config.enableLru
				? this.lruCache.peek(keyStr)
				: this.nodeCache.get(keyStr);
			const entry = rawEntry as CacheEntry | undefined;

			return {
				key: keyStr,
				age: entry ? now - entry.timestamp : 0,
				hits: entry?.hits ?? 0,
			};
		});

		return {
			config: this.getConfig(),
			stats: this.getStats(),
			sampleEntries,
		};
	}
}

/**
 * Global skill cache instance
 */
export const skillCacheService = new SkillCacheService();
