# Type Organization Extension

> TypeScript conventions and type system organization patterns

## Overview

This document establishes TypeScript conventions, type organization patterns, and best practices for maintaining a consistent, well-structured type system throughout the MCP AI Agent Guidelines project.

## Type Organization Principles

### 1. Co-location

**Principle**: Types should live near their usage

```
src/tools/design/
  ├── design-assistant.ts
  ├── types/
  │   ├── session.ts      // Session-related types
  │   ├── phase.ts        // Phase-related types
  │   ├── artifact.ts     // Artifact-related types
  │   └── index.ts        // Barrel export
  └── services/
```

### 2. Explicit Exports

**Principle**: Use barrel files for clean imports

```typescript
// types/index.ts
export type { Session, SessionConfig, SessionState } from './session.js';
export type { Phase, PhaseConfig, PhaseValidation } from './phase.js';
export type { Artifact, ArtifactType, ArtifactMetadata } from './artifact.js';
```

### 3. Domain Separation

**Principle**: Group types by domain, not by kind

```typescript
// ✅ Good: Domain-grouped
types/
  ├── user/
  │   ├── user.ts
  │   └── user-session.ts
  ├── order/
  │   ├── order.ts
  │   └── order-item.ts

// ❌ Bad: Kind-grouped
types/
  ├── interfaces.ts
  ├── types.ts
  └── enums.ts
```

## Type Definitions

### Interfaces vs. Types

**Use `interface` for**:
- Object shapes that can be extended
- Public APIs
- Classes and their contracts

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

// Can be extended
interface AdminUser extends User {
  permissions: string[];
}
```

**Use `type` for**:
- Unions and intersections
- Mapped types
- Complex type transformations

```typescript
type Status = 'pending' | 'active' | 'inactive';
type Result<T> = { success: true; data: T } | { success: false; error: string };
type Readonly<T> = { readonly [K in keyof T]: T[K] };
```

### Const Enums

**Use `as const` for string literals**:

```typescript
// ✅ Good: Type-safe and tree-shakeable
const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
} as const;

type UserRole = typeof UserRole[keyof typeof UserRole];

// ❌ Avoid: Runtime enum overhead
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}
```

### Generic Types

**Guidelines**:
- Use descriptive generic names for multiple parameters
- Use `T` only for single-parameter generics

```typescript
// ✅ Good: Descriptive names
type Result<TData, TError> =
  | { success: true; data: TData }
  | { success: false; error: TError };

// ✅ Good: Single parameter
type Optional<T> = T | undefined;

// ❌ Bad: Unclear
type Result<T, E, M> = { data: T; error: E; meta: M };
```

## Naming Conventions

### Type Names

```typescript
// Interfaces: PascalCase
interface UserProfile { }
interface OrderItem { }

// Types: PascalCase
type UserId = string;
type OrderStatus = 'pending' | 'shipped' | 'delivered';

// Generic parameters
type Result<TData, TError = Error> = ...;

// Utility types
type Nullable<T> = T | null;
type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };
```

### File Names

```typescript
// Type files: kebab-case
user-profile.ts
order-status.ts
session-config.ts

// Barrel exports
index.ts
```

## Common Patterns

### Pattern 1: Discriminated Unions

```typescript
type ApiResponse<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; code: number }
  | { status: 'loading' };

function handleResponse<T>(response: ApiResponse<T>) {
  switch (response.status) {
    case 'success':
      return response.data;  // Type: T
    case 'error':
      throw new Error(response.error);  // Type: string
    case 'loading':
      return null;
  }
}
```

### Pattern 2: Branded Types

```typescript
// Prevent mixing similar types
type UserId = string & { readonly brand: unique symbol };
type OrderId = string & { readonly brand: unique symbol };

function getUserById(id: UserId): User { /* ... */ }
function getOrderById(id: OrderId): Order { /* ... */ }

const userId = '123' as UserId;
const orderId = '456' as OrderId;

getUserById(userId);    // ✅ OK
getUserById(orderId);   // ❌ Type error
```

### Pattern 3: Builder Pattern Types

```typescript
interface ConfigBuilder {
  setName(name: string): this;
  setTimeout(timeout: number): this;
  build(): Config;
}

class ConfigBuilderImpl implements ConfigBuilder {
  private config: Partial<Config> = {};

  setName(name: string): this {
    this.config.name = name;
    return this;
  }

  setTimeout(timeout: number): this {
    this.config.timeout = timeout;
    return this;
  }

  build(): Config {
    return this.config as Config;
  }
}
```

### Pattern 4: Conditional Types

```typescript
// Extract function return type
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Make specific properties optional
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Deep readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

## Strict Mode Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    // Strict type checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Additional checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    // Module resolution
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    // Output
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## Type Safety Best Practices

### 1. Avoid `any`

```typescript
// ❌ Bad
function process(data: any): any {
  return data.toString();
}

// ✅ Good: Use unknown and type guards
function process(data: unknown): string {
  if (typeof data === 'string') return data;
  if (typeof data === 'number') return data.toString();
  throw new Error('Unsupported type');
}
```

### 2. Use Type Guards

```typescript
// Type guard function
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Usage
function process(value: unknown) {
  if (isString(value)) {
    return value.toUpperCase();  // Type: string
  }
}
```

### 3. Const Assertions

```typescript
// Infer literal types
const config = {
  timeout: 5000,
  retries: 3,
  mode: 'production'
} as const;

// Type: { readonly timeout: 5000; readonly retries: 3; readonly mode: "production" }

// Tuple types
const point = [10, 20] as const;
// Type: readonly [10, 20]
```

### 4. Template Literal Types

```typescript
type CSSUnit = 'px' | 'em' | 'rem' | '%';
type CSSValue<T extends number> = `${T}${CSSUnit}`;

const width: CSSValue<100> = '100px';  // ✅ OK
const height: CSSValue<50> = '50rem';  // ✅ OK
const invalid: CSSValue<10> = '10';    // ❌ Type error
```

## Documentation

### JSDoc Comments

```typescript
/**
 * Represents a user in the system.
 *
 * @example
 * ```typescript
 * const user: User = {
 *   id: '123',
 *   email: 'user@example.com',
 *   name: 'John Doe'
 * };
 * ```
 */
interface User {
  /** Unique user identifier */
  id: string;

  /** User's email address */
  email: string;

  /** User's display name */
  name: string;
}
```

### Type Exports

```typescript
/**
 * Core types for the design system.
 *
 * @module design/types
 */

// Export public types
export type { Session, SessionConfig } from './session.js';
export type { Phase, PhaseConfig } from './phase.js';

// Internal types (not exported)
type InternalState = { /* ... */ };
```

## Testing Types

### Type Tests

```typescript
// Use type assertions for type testing
import { expectType } from 'tsd';

// Test that types match
expectType<string>(getUserName());
expectType<number>(getUserAge());

// Test that types are assignable
expectType<User>({ id: '123', email: 'test@example.com', name: 'Test' });
```

## Related Resources

- [Technical Improvements](./TECHNICAL_IMPROVEMENTS.md) - Refactoring patterns
- [Error Handling](./ERROR_HANDLING.md) - Error type patterns
- [Code Quality](./CODE_QUALITY_IMPROVEMENTS.md) - TypeScript best practices

## Conclusion

Consistent type organization and strict TypeScript configuration are essential for maintaining a reliable, maintainable codebase. By following these conventions, we ensure type safety, good developer experience, and clear intent throughout the project.

Key principles:
- Co-locate types with usage
- Use strict TypeScript mode
- Prefer `unknown` over `any`
- Document complex types
- Test type definitions
