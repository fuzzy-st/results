# `unwrapOr` Function Guide

The `unwrapOr` function is a **core** utility in the Result pattern.It is the complement to `unwrap()` **core** utility method with a *difference*, that extracts the value from a successful result or returns a default value if the result is unsuccessful. 

## Why Use `unwrapOr`?

In scenarios where you want a fallback value for potentially failing operations, `unwrapOr` provides:
- Safe value extraction
- Default value mechanism
- Simplified error handling
- Graceful degradation

### Key Benefits
- Prevents null/undefined errors
- Provides default values
- Reduces conditional logic
- Improves code readability

## Usage Examples

We have a complementary set of detailed [examples](../../examples/core/unwraps.ts) that you can view further on how to utilize `unwrapOr()` method

### Basic Usage

```typescript
// Successful result
const successResult = success(42);
const value = unwrapOr(successResult, 0); // Returns 42

// Error result
const errorResult = error(new Error('Something went wrong'));
const fallbackValue = unwrapOr(errorResult, 0); // Returns 0
```

### Validation Scenario

```typescript
function parseUserInput(input: string): Result<number, Error> {
    const parsed = parseInt(input, 10);
    return isNaN(parsed) 
        ? error(new Error('Invalid number'))
        : success(parsed);
}

function calculateWithFallback(input: string) {
    // Uses default value of 0 if parsing fails
    const number = unwrapOr(parseUserInput(input), 0);
    return number * number;
}

calculateWithFallback('5');   // Returns 25
calculateWithFallback('abc'); // Returns 0
```

### Complex Object Fallback

```typescript
interface User {
    id: number;
    name: string;
}

const defaultUser = { id: 0, name: 'Guest' };

function fetchUser(id: number): Result<User, Error> {
    // Simulated user fetch
    return id > 0 
        ? success({ id, name: `User ${id}` })
        : error(new Error('Invalid user ID'));
}

const user = unwrapOr(fetchUser(-1), defaultUser);
// Returns defaultUser if fetch fails
```

### Lazy Default Value

```typescript
function expensiveDefaultComputation() {
    console.log('Computing default value...');
    return { complexData: 42 };
}

const result = unwrapOr(
    errorResult, 
    () => expensiveDefaultComputation()
);
// Default value computed only if needed
```

## API Reference

### Function Signature
```typescript
function unwrapOr<T, E = Error, D = T>(
    result: Result<T, E>, 
    defaultValue: D | (() => D)
): T | D
```

### Parameters
- `result`: The Result to unwrap
- `defaultValue`: 
  - Can be a static value
  - Can be a function returning a value (lazy evaluation)

### Returns
- The inner value of a successful result
- The default value if the result is unsuccessful

## Best Practices
- Use meaningful default values
- Prefer lazy computation for expensive defaults
- Use for non-critical operations
- Maintain type consistency

## Common Pitfalls
- Avoid overly complex default computations
- Ensure default value type matches expected type
- Don't use as primary error handling mechanism

## TypeScript Considerations
- Supports type inference
- Allows union types
- Works with generic Result types

## Advanced Usage

### Type-Safe Defaults

```typescript
type UserResult = Result<User, DatabaseError>;

function processUser(result: UserResult) {
    // Ensures type safety with default user
    const user = unwrapOr(result, {
        id: 0,
        name: 'Guest',
        role: 'anonymous'
    });
}
```

### Conditional Defaults

```typescript
function getOptimalValue(result: Result<number, Error>) {
    return unwrapOr(result, (originalResult) => {
        // Dynamic default based on original result
        return originalResult instanceof SomeSpecificError 
            ? calculateAlternative() 
            : 0;
    });
}
```

## Related Methods
- `unwrap()`: Extracts value, throws on error
- `match()`: Pattern matching for results
- `success()`: Creates a successful result
- `error()`: Creates an error result

## Performance Considerations
- Minimal runtime overhead
- Lazy evaluation prevents unnecessary computations
- Lightweight abstraction

## Error Handling Patterns

### Graceful Degradation

```typescript
function fetchConfigWithFallback() {
    return unwrapOr(
        fetchRemoteConfig(), 
        getLocalDefaultConfig()
    );
}
```

### Logging Fallback

```typescript
function safeOperation(result: Result<Data, Error>) {
    const data = unwrapOr(result, () => {
        logError('Operation failed, using default');
        return defaultData;
    });
}
```

## When to Use vs Alternatives

- Use `unwrapOr()` when:
  - You have a sensible default value
  - The operation might fail
  - You want to prevent errors

- Use `unwrap()` when:
  - You expect the operation to succeed
  - Immediate error propagation is desired

- Use `match()` when:
  - You need complex handling
  - Want to perform different actions for success/failure
