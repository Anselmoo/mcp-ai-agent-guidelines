/**
 * Simple data utilities without external dependencies
 * Provides basic data processing for skill orchestration
 */

import type {
	DataProcessingResult,
	DataTransformation,
	ValidationRule,
} from "../contracts/graph-types.js";
import { createOperationalLogger } from "./observability.js";

function assertNever(value: never): never {
	throw new Error(`Unhandled data utility case: ${String(value)}`);
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Unknown error";
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object";
}

function getRecordValue(item: unknown, key: string): unknown {
	return isObjectRecord(item) ? item[key] : undefined;
}

const dataUtilitiesLogger = createOperationalLogger("info");

/**
 * Simple data processing utilities
 */
export class DataUtilities {
	/**
	 * Deep clone object or array using JSON serialization
	 */
	static deepClone<T>(data: T): T {
		return JSON.parse(JSON.stringify(data));
	}

	/**
	 * Simple object merge (shallow)
	 */
	static merge<T>(target: T, ...sources: Partial<T>[]): T {
		return Object.assign({}, target, ...sources);
	}

	/**
	 * Group array elements by a key
	 */
	static groupBy<T>(
		array: T[],
		keyFn: (item: T) => string,
	): Record<string, T[]> {
		const result: Record<string, T[]> = {};
		for (const item of array) {
			const key = keyFn(item);
			if (!result[key]) result[key] = [];
			result[key].push(item);
		}
		return result;
	}

	/**
	 * Remove duplicate elements from array
	 */
	static unique<T>(array: T[]): T[] {
		return Array.from(new Set(array));
	}

	/**
	 * Flatten nested arrays
	 */
	static flatten<T>(array: (T | T[])[]): T[] {
		return array.flatMap((item) => item);
	}

	/**
	 * Pick specific properties from object
	 */
	static pick<T extends Record<string, unknown>, K extends keyof T>(
		object: T,
		keys: readonly K[],
	): Pick<T, K> {
		const result = {} as Pick<T, K>;
		for (const key of keys) {
			if (key in object) {
				result[key] = object[key];
			}
		}
		return result;
	}

	/**
	 * Validate data against rules
	 */
	static validateData<T>(
		data: T,
		rules: ValidationRule[],
	): { isValid: boolean; errors: string[]; warnings: string[] } {
		const errors: string[] = [];
		const warnings: string[] = [];

		for (const rule of rules) {
			try {
				const result = rule.validator(data);
				if (!result.isValid) {
					if (rule.severity === "error") {
						errors.push(rule.message || "Validation failed");
					} else {
						warnings.push(rule.message || "Validation warning");
					}
				}
			} catch (error) {
				errors.push(`Validation error: ${getErrorMessage(error)}`);
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Transform data using a series of transformations
	 */
	static transformData<T, R>(
		data: T,
		transformations: DataTransformation<T, R>[],
	): DataProcessingResult<R> {
		let result: unknown = data;
		const appliedTransformations: string[] = [];
		const errors: string[] = [];

		for (const transformation of transformations) {
			try {
				result = transformation.transform(result as T);
				appliedTransformations.push(transformation.name);
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				errors.push(`${transformation.name}: ${errorMessage}`);

				if (!transformation.optional) {
					return {
						success: false,
						data: undefined as R,
						appliedTransformations,
						errors,
					};
				}
			}
		}

		return {
			success: true,
			data: result as R,
			appliedTransformations,
			errors,
		};
	}

	/**
	 * Simple debounce implementation
	 */
	static debounce<TArgs extends unknown[], TReturn>(
		func: (...args: TArgs) => TReturn,
		waitMs: number,
	): (...args: TArgs) => void {
		let timeout: ReturnType<typeof setTimeout>;
		return (...args: TArgs): void => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), waitMs);
		};
	}

	/**
	 * Simple throttle implementation
	 */
	static throttle<TArgs extends unknown[], TReturn>(
		func: (...args: TArgs) => TReturn,
		limitMs: number,
	): (...args: TArgs) => void {
		let inThrottle = false;
		return (...args: TArgs): void => {
			if (!inThrottle) {
				func(...args);
				inThrottle = true;
				setTimeout(() => (inThrottle = false), limitMs);
			}
		};
	}

	/**
	 * Measure execution time of function
	 */
	static async measureExecution<T>(
		operation: () => Promise<T> | T,
		label?: string,
	): Promise<{ result: T; executionTimeMs: number }> {
		const startTime = Date.now();
		const result = await operation();
		const executionTimeMs = Date.now() - startTime;

		if (label) {
			dataUtilitiesLogger.log("info", "Measured execution completed", {
				label,
				executionTimeMs,
			});
		}

		return { result, executionTimeMs };
	}

	/**
	 * Simple batch processing
	 */
	static async batchProcess<T, R>(
		items: T[],
		processor: (item: T, index: number) => Promise<R>,
		batchSize: number = 10,
	): Promise<R[]> {
		const results: R[] = [];

		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize);
			const batchResults = await Promise.all(
				batch.map((item, index) => processor(item, i + index)),
			);
			results.push(...batchResults);
		}

		return results;
	}

	/**
	 * Group array elements by multiple criteria
	 */
	static groupByMultipleCriteria<T>(
		array: T[],
		keys: string[],
	): Record<string, T[]> {
		const result: Record<string, T[]> = {};

		for (const item of array) {
			// Create compound key from multiple properties
			const keyParts = keys.map((key) => {
				const value = getRecordValue(item, key);
				return value != null ? String(value) : "undefined";
			});
			const compoundKey = keyParts.join("|");

			if (!result[compoundKey]) {
				result[compoundKey] = [];
			}
			result[compoundKey].push(item);
		}

		return result;
	}

	/**
	 * Merge configurations with deep merging support
	 */
	static mergeConfigurations<T extends Record<string, unknown>>(
		base: T,
		override: Partial<T>,
	): T {
		const result = { ...base };

		for (const key in override) {
			const overrideValue = override[key];
			const baseValue = result[key];

			if (overrideValue != null) {
				if (
					isObjectRecord(overrideValue) &&
					isObjectRecord(baseValue) &&
					!Array.isArray(overrideValue) &&
					!Array.isArray(baseValue)
				) {
					result[key] = DataUtilities.mergeConfigurations(
						baseValue,
						overrideValue,
					) as T[Extract<keyof T, string>];
				} else {
					result[key] = overrideValue as T[Extract<keyof T, string>];
				}
			}
		}

		return result;
	}

	/**
	 * Transform dataset with async transformations
	 */
	static async transformDataset<T, R>(
		data: T[],
		transformer: (item: T) => Promise<R>,
	): Promise<R[]> {
		const results: R[] = [];
		for (const item of data) {
			results.push(await transformer(item));
		}
		return results;
	}

	/**
	 * Create a memoized function for expensive computations
	 */
	static createMemoizedFunction<TArgs extends unknown[], TReturn>(
		fn: (...args: TArgs) => TReturn,
	): (...args: TArgs) => TReturn {
		const cache = new Map<string, TReturn>();

		return (...args: TArgs): TReturn => {
			const key = JSON.stringify(args);

			if (cache.has(key)) {
				return cache.get(key)!;
			}

			const result = fn(...args);
			cache.set(key, result);
			return result;
		};
	}

	/**
	 * Filter data by multiple conditions
	 */
	static filterByConditions<T>(
		data: T[],
		conditions: Array<{
			field: keyof T;
			operator: "eq" | "gt" | "lt" | "gte" | "lte" | "contains";
			value: unknown;
		}>,
	): T[] {
		return data.filter((item) => {
			return conditions.every((condition) => {
				const fieldValue = item[condition.field];
				const condValue = condition.value;

				switch (condition.operator) {
					case "eq":
						return fieldValue === condValue;
					case "gt":
						return (fieldValue as number) > (condValue as number);
					case "lt":
						return (fieldValue as number) < (condValue as number);
					case "gte":
						return (fieldValue as number) >= (condValue as number);
					case "lte":
						return (fieldValue as number) <= (condValue as number);
					case "contains":
						return String(fieldValue).includes(String(condValue));
					default:
						return assertNever(condition.operator);
				}
			});
		});
	}
}

/**
 * Factory for creating data utilities (for consistency with other patterns)
 */
export class DataUtilitiesFactory {
	static create(): typeof DataUtilities {
		return DataUtilities;
	}
}
